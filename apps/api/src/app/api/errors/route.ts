import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase/admin.ts'
import { supabaseServiceClient } from '../../../lib/supabaseClient.ts'
import { getUserFromToken } from '../../../lib/authUtils.ts'
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
  message: z.string().min(1, { message: "Message cannot be empty" }),
  stackTrace: z.string().optional(), // Optional string
  metadata: z.record(z.unknown()).optional(), // Optional object with unknown values
  level: z.string().optional().default('error'), // Add level validation (optional, default to 'error')
});

// Define the type for the RPC response rows
interface AggregatedErrorGroupV2 { // Renamed interface for clarity
  out_message: string;         // Use out_ prefix matching RETURNS TABLE
  out_level: string;
  out_count: number;
  out_last_seen: string;
  out_representative_id: string;
  out_trend: { time: string; count: number }[];
  out_total_groups: number;
}

// GET /api/errors?projectId=...[&page=1&limit=20] - List errors for a specific project owned by the user
export async function GET(request: NextRequest) {
  console.log("[API GET /errors] Handler started."); // Log start

  // <<<<<<<<<<<<<<<<<<<<< TEMPORARILY COMMENTED OUT >>>>>>>>>>>>>>>>>>>>>>>
  /*
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
     // console.log(`[API GET /errors] Project ${projectId} ownership validated for public user ${publicUserId}. Fetching errors...`); // Log removed
  } catch (err: unknown) {
    let errorMessage = 'An unexpected error occurred during project validation';
    if (err instanceof Error) {
        errorMessage = err.message;
    }
    console.error('[API GET /errors] Unexpected error validating project ownership:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: dashboardCorsHeaders });
  }
  // --- End Validate Project Ownership ---
  // console.log("[API GET /errors] Project ownership validated successfully."); // Logging removed

  // --- Fetch Aggregated Errors using RPC ---
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const limit = limitParam ? parseInt(limitParam, 10) : 20; // Default limit

  if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
    return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400, headers: dashboardCorsHeaders });
  }

  // Extract date range parameters
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  // --- Calculate Bucket Interval based on Date Range --- 
  const startDate = startDateParam ? new Date(startDateParam) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default 24h ago
  const endDate = endDateParam ? new Date(endDateParam) : new Date(); // Default now

  let bucketInterval = 'hour'; // Default to hourly
  if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      // Use 'day' interval if the range is more than 48 hours
      if (durationHours > 48) {
          bucketInterval = 'day';
      }
  } else {
      console.warn('[API GET /errors] Invalid start or end date parameter received. Defaulting interval to hour.');
  }
  console.log(`[API GET /errors] Determined bucket interval: ${bucketInterval}`); // Keep this log
  // --- End Calculate Bucket Interval --- 

  // Prepare RPC parameters - Explicitly use null for optional dates
  const rpcParams: { 
    project_id_param: string;
    start_date_param: string | null; // Type includes null
    end_date_param: string | null;   // Type includes null
    page_param: number;
    limit_param: number;
    bucket_interval_param: string;
  } = {
    project_id_param: projectId,
    start_date_param: null, // Default to null
    end_date_param: null,   // Default to null
    page_param: page,
    limit_param: limit,
    bucket_interval_param: bucketInterval,
  };

  // Add date parameters if they are valid dates, overriding null
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

  console.log("[API GET /errors] Attempting RPC call with FULL params (null defaults):", rpcParams);

  try {
    // Call the NEW RPC function name with the original full params object
    const { data: aggregatedErrors, error: rpcError } = await supabaseAdmin
      .rpc('get_aggregated_errors_trend_v1', rpcParams); // <-- USE FULL rpcParams

    if (rpcError) {
      console.error('Error calling get_aggregated_errors_trend_v1 RPC:', rpcError.message);
      return NextResponse.json({ error: 'Failed to fetch aggregated errors', details: rpcError.message }, { status: 500, headers: dashboardCorsHeaders });
    }

    // Determine the total count of unique groups from the new output column name
    const totalUniqueGroups = aggregatedErrors && aggregatedErrors.length > 0 ? aggregatedErrors[0].out_total_groups : 0;

    // Map the RPC response to the expected API response structure using new output column names
    const mappedData = (aggregatedErrors ?? []).map((group: AggregatedErrorGroupV2) => ({ // Use new interface
        id: group.out_representative_id, // Use out_ prefix
        message: group.out_message,       // Use out_ prefix
        level: group.out_level,           // Use out_ prefix
        received_at: group.out_last_seen, // Use out_ prefix
        count: group.out_count,           // Use out_ prefix
        trend: group.out_trend,           // Use out_ prefix
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
  */
  // <<<<<<<<<<<<<<<<<<<<< END TEMPORARY COMMENT OUT >>>>>>>>>>>>>>>>>>>>>

  // Return a simple success message for now
  return NextResponse.json({ message: "GET /api/errors handler reached successfully!" });
}

// POST /api/errors - Record a new error (using API Key authentication)
export async function POST(request: Request) {
  console.log("--- Received request in /api/errors ---");
  try {
    // 0. Get API Key from header
    const apiKeyHeader = request.headers.get('X-Api-Key');
    if (!apiKeyHeader) {
        console.error("API Key header (X-Api-Key) missing");
        return NextResponse.json(
            { error: 'API Key header (X-Api-Key) is required' },
            { status: 401, headers: sdkCorsHeaders }
        );
    }
    // Optional: Add format validation if keys are always UUIDs
    // const apiKeyUuidSchema = z.string().uuid();
    // if (!apiKeyUuidSchema.safeParse(apiKeyHeader).success) {
    //    console.error("Invalid API Key format in header");
    //     return NextResponse.json(
    //         { error: 'Invalid API Key format in header' },
    //         { status: 400, headers: sdkCorsHeaders }
    //     );
    // }

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

    // Now validationResult.data contains message, stackTrace, metadata, level
    const { message, stackTrace, metadata, level } = validationResult.data;

    // 2. Validate the API Key (using the key from the header)
    const { data: projectData, error: projectError } = await supabaseServiceClient
      .from('projects')
      .select('id')
      .eq('api_key', apiKeyHeader) // <-- Use apiKeyHeader here
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