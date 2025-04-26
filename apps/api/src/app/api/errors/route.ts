import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase/admin'
import { supabaseServiceClient } from '../../../lib/supabaseClient'
import { getUserFromToken } from '../../../lib/authUtils'
import { z } from 'zod' // Import Zod

// Restore dashboard-specific CORS headers (for GET requests)
const dashboardCorsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:8080', 
  'Access-Control-Allow-Methods': 'GET, OPTIONS', 
  'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
  'Access-Control-Allow-Credentials': 'true',
};

// Define permissive CORS headers for SDK submissions (POST)
const sdkCorsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow any origin
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST/OPTIONS for error submission
  'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key', // Allow content type and API key header
};

// Restore OPTIONS handler - checks requested method
export async function OPTIONS(request: NextRequest) {
  const requestMethod = request.headers.get('access-control-request-method');
  console.log('[API Errors OPTIONS] Requested Method:', requestMethod); 
  
  if (requestMethod === 'GET') {
      // Preflight for Dashboard GET request
      console.log('[API Errors OPTIONS] Responding for GET preflight');
      return new NextResponse(null, { status: 204, headers: dashboardCorsHeaders });
  } else if (requestMethod === 'POST') {
       // Preflight for SDK POST request
      console.log('[API Errors OPTIONS] Responding for POST preflight');
      return new NextResponse(null, { status: 204, headers: sdkCorsHeaders });
  } else {
      // Default/fallback OPTIONS response if method is unknown or not specified
      console.log('[API Errors OPTIONS] Responding with default (POST likely)');
      // Respond allowing POST as a sensible default for this /api/errors endpoint
      return new NextResponse(null, { status: 204, headers: sdkCorsHeaders }); 
  }
}

// Define the Zod schema for the request body
const errorSchema = z.object({
  apiKey: z.string().uuid({ message: "Invalid API Key format" }), // Assuming API keys are UUIDs
  message: z.string().min(1, { message: "Message cannot be empty" }),
  stackTrace: z.string().optional(), // Optional string
  metadata: z.record(z.unknown()).optional(), // Optional object with unknown values
  level: z.string().optional().default('error'), // Add level validation (optional, default to 'error')
});

// Define the type for the RPC response rows
interface AggregatedErrorGroup {
  message: string;
  level: string;
  count: number;
  last_seen: string;
  representative_id: string;
  trend: { time: string; count: number }[]; // Added trend data structure
  total_groups: number;
}

// GET /api/errors?projectId=...[&page=1&limit=20] - List errors for a specific project owned by the user
export async function GET(request: NextRequest) {
  // Use JWT validation
  const user = await getUserFromToken(request);

  if (!user) { // Check for user object
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: dashboardCorsHeaders });
  }
  
  // This is the auth user ID (X)
  const authUserId = user.id;
  let publicUserId: string; // To store the public user ID (Y)

  // Extract query parameters
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');

  if (!projectId) {
    return NextResponse.json({ error: 'Missing required query parameter: projectId' }, { status: 400, headers: dashboardCorsHeaders });
  }

  // --- Get Public User ID (Y) --- 
  try {
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users') // Query public.users table
      .select('id') // Select its primary key (Y)
      .eq('supabase_auth_id', authUserId) // Match using the auth ID (X)
      .single();

    if (userError) {
      console.error(`[API GET /errors] Error fetching public user ID for auth ID ${authUserId}:`, userError.message);
      throw new Error('Failed to find user profile.'); 
    }
    if (!userData) {
      console.error(`[API GET /errors] Public user profile not found for auth ID ${authUserId}.`);
      // If the public profile doesn't exist, they cannot own any projects.
      return NextResponse.json({ error: 'User profile not found, cannot access projects' }, { status: 404, headers: dashboardCorsHeaders });
    }
    publicUserId = userData.id; // Store the correct public user ID (Y)
    console.log(`[API GET /errors] Found public user ID ${publicUserId} for auth ID ${authUserId}. Validating project ${projectId}...`);

  } catch (err: unknown) {
    const errorMessage = (err instanceof Error) ? err.message : 'Failed to retrieve user information';
    console.error(`[API GET /errors] Error during user lookup: ${errorMessage}`);
    return NextResponse.json({ error: 'Failed to process user information' }, { status: 500, headers: dashboardCorsHeaders }); 
  }
  // --- End Get Public User ID --- 

  // --- Validate Project Ownership using Public User ID (Y) ---
  try {
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id') // Only need to confirm existence and ownership
      .eq('id', projectId)
      .eq('user_id', publicUserId) // <-- Use publicUserId (Y) for check
      .maybeSingle(); // Use maybeSingle to handle null case gracefully

    if (projectError) {
      console.error('[API GET /errors] Error validating project ownership:', projectError.message);
      return NextResponse.json({ error: 'Failed to validate project ownership', details: projectError.message }, { status: 500, headers: dashboardCorsHeaders });
    }

    if (!project) {
      // If project is null, it means either it doesn't exist or doesn't belong to THIS user (with publicUserId Y)
      console.warn(`[API GET /errors] Project ${projectId} not found or access denied for public user ${publicUserId}.`);
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404, headers: dashboardCorsHeaders });
    }
    // If we reach here, the user (Y) owns the project (ID: projectId)
     console.log(`[API GET /errors] Project ${projectId} ownership validated for public user ${publicUserId}. Fetching errors...`);
  } catch (err: unknown) {
    let errorMessage = 'An unexpected error occurred during project validation';
    if (err instanceof Error) {
        errorMessage = err.message;
    }
    console.error('[API GET /errors] Unexpected error validating project ownership:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: dashboardCorsHeaders });
  }
  // --- End Validate Project Ownership ---

  // --- Fetch Aggregated Errors using RPC ---
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const limit = limitParam ? parseInt(limitParam, 10) : 20; // Default limit

  if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
    return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400, headers: dashboardCorsHeaders });
  }

  // Extract date range parameters
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  // Prepare RPC parameters
  const rpcParams: { 
    project_id_param: string;
    start_date_param?: string;
    end_date_param?: string;
    page_param: number;
    limit_param: number;
  } = {
    project_id_param: projectId,
    page_param: page,
    limit_param: limit,
  };

  // Add date parameters if they are valid dates
  if (startDateParam) {
    const startDate = new Date(startDateParam);
    if (!isNaN(startDate.getTime())) {
      rpcParams.start_date_param = startDate.toISOString();
    }
  }
  if (endDateParam) {
    const endDate = new Date(endDateParam);
    if (!isNaN(endDate.getTime())) {
      rpcParams.end_date_param = endDate.toISOString();
    }
  }

  try {
    // Call the RPC function
    const { data: aggregatedErrors, error: rpcError } = await supabaseAdmin
      .rpc('get_aggregated_errors', rpcParams);

    if (rpcError) {
      console.error('Error calling get_aggregated_errors RPC:', rpcError.message);
      return NextResponse.json({ error: 'Failed to fetch aggregated errors', details: rpcError.message }, { status: 500, headers: dashboardCorsHeaders });
    }

    // Determine the total count of unique groups
    // The function returns total_groups on each row, so pick it from the first row if available.
    const totalUniqueGroups = aggregatedErrors && aggregatedErrors.length > 0 ? aggregatedErrors[0].total_groups : 0;

    // Map the RPC response to the expected API response structure
    // We need to align field names (e.g., last_seen -> received_at, representative_id -> id)
    const mappedData = (aggregatedErrors ?? []).map((group: AggregatedErrorGroup) => ({
        id: group.representative_id, // Use the ID of the latest error in the group
        message: group.message,
        level: group.level,
        received_at: group.last_seen, // Use the timestamp of the latest error
        count: group.count, // The count of errors in this group
        trend: group.trend, // Pass trend data through
        stack_trace: null, 
        metadata: null,
    }));

    return NextResponse.json({
      data: mappedData, // Return the mapped aggregated data
      totalCount: totalUniqueGroups, // Return the total count of unique groups
      page,
      limit,
    }, { headers: dashboardCorsHeaders });

  } catch (err: unknown) {
    let errorMessage = 'An unexpected error occurred while fetching aggregated errors';
     if (err instanceof Error) {
        errorMessage = err.message;
    }
    console.error('Unexpected error fetching aggregated errors:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: dashboardCorsHeaders });
  }
  // --- End Fetch Aggregated Errors ---
}

// POST /api/errors - Record a new error (using API Key authentication)
export async function POST(request: Request) {
  console.log("--- Received request in /api/errors ---");
  try {
    // 1. Parse the incoming request body
    let body: unknown;
    try {
        body = await request.json();
    } catch (_jsonError: unknown) {
        // Add SDK headers to response
        return NextResponse.json(
            { error: 'Invalid JSON payload' },
            { status: 400, headers: sdkCorsHeaders } 
        );
    }

    // 1.5 Validate the request body using Zod
    const validationResult = errorSchema.safeParse(body);

    if (!validationResult.success) {
      console.error("Request body validation failed:", validationResult.error.flatten());
      // Add SDK headers to response
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.flatten().fieldErrors },
        { status: 400, headers: sdkCorsHeaders } 
      );
    }

    const { apiKey, message, stackTrace, metadata, level } = validationResult.data;

    // 2. Validate the API Key
    const { data: projectData, error: projectError } = await supabaseServiceClient
      .from('projects')
      .select('id')
      .eq('api_key', apiKey)
      .single();

    if (projectError || !projectData) {
      console.error('API Key validation error:', projectError);
      // Add SDK headers to response
      return NextResponse.json(
        { error: 'Invalid or unknown API Key' },
        { status: 401, headers: sdkCorsHeaders } 
      );
    }

    const projectId = projectData.id;

    // 3. Insert the error into the database
    const { data: errorData, error: insertError } = await supabaseServiceClient
      .from('errors')
      .insert([
        {
          project_id: projectId,
          message: message,
          stack_trace: stackTrace,
          metadata: metadata,
          level: level,
        },
      ])
      .select();

    if (insertError) {
      console.error('Error inserting data into Supabase:', insertError);
      // Add SDK headers to response
      return NextResponse.json(
        { error: 'Failed to record error', details: insertError.message },
        { status: 500, headers: sdkCorsHeaders } 
      );
    }

    // 4. Return a success response
    console.log('Successfully recorded error:', errorData);
    // Add SDK headers to response
    return NextResponse.json(
      { message: 'Error recorded successfully', data: errorData },
      { status: 201, headers: sdkCorsHeaders }
    );

  } catch (error: unknown) {
    console.error('Unhandled error in POST /api/errors:', error);
    let errorMessage = 'An unexpected error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    // Add SDK headers to response
    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: sdkCorsHeaders } 
    );
  }
} 