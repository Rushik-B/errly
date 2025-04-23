import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { supabaseServiceClient } from '@/lib/supabaseClient'
import { getUserSession, corsHeaders } from '@/lib/authUtils'
import { z } from 'zod' // Import Zod

// Define the Zod schema for the request body
const errorSchema = z.object({
  apiKey: z.string().uuid({ message: "Invalid API Key format" }), // Assuming API keys are UUIDs
  message: z.string().min(1, { message: "Message cannot be empty" }),
  stackTrace: z.string().optional(), // Optional string
  metadata: z.record(z.unknown()).optional(), // Optional object with unknown values
});

// Handle OPTIONS preflight requests for CORS
export async function OPTIONS(request: Request) {
  return new NextResponse(null, { headers: corsHeaders })
}

// GET /api/errors?projectId=...[&page=1&limit=20] - List errors for a specific project owned by the user
export async function GET(request: NextRequest) {
  const session = await getUserSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }
  const userId = session.user.id

  // Extract query parameters
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const pageParam = searchParams.get('page')
  const limitParam = searchParams.get('limit')

  if (!projectId) {
    return NextResponse.json({ error: 'Missing required query parameter: projectId' }, { status: 400, headers: corsHeaders })
  }

  // --- Validate Project Ownership ---
  try {
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id') // Only need to confirm existence and ownership
      .eq('id', projectId)
      .eq('user_id', userId)
      .maybeSingle() // Use maybeSingle to handle null case gracefully

    if (projectError) {
      console.error('Error validating project ownership:', projectError.message)
      return NextResponse.json({ error: 'Failed to validate project ownership', details: projectError.message }, { status: 500, headers: corsHeaders })
    }

    if (!project) {
      // If project is null, it means either it doesn't exist or doesn't belong to the user
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404, headers: corsHeaders })
    }
    // If we reach here, the user owns the project
  } catch (err: any) {
    console.error('Unexpected error validating project ownership:', err.message)
    return NextResponse.json({ error: 'An unexpected error occurred during project validation' }, { status: 500, headers: corsHeaders })
  }
  // --- End Validate Project Ownership ---

  // --- Fetch Errors with Pagination ---
  const page = pageParam ? parseInt(pageParam, 10) : 1
  const limit = limitParam ? parseInt(limitParam, 10) : 20 // Default limit
  const offset = (page - 1) * limit

  if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
    return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400, headers: corsHeaders })
  }

  try {
    const { data: errors, error: errorsError, count } = await supabaseAdmin
      .from('errors')
      .select('*', { count: 'exact' }) // Fetch all error fields and the total count
      .eq('project_id', projectId)
      .order('received_at', { ascending: false }) // Order by most recent
      .range(offset, offset + limit - 1) // Apply pagination range

    if (errorsError) {
      console.error('Error fetching errors:', errorsError.message)
      return NextResponse.json({ error: 'Failed to fetch errors', details: errorsError.message }, { status: 500, headers: corsHeaders })
    }

    return NextResponse.json({
      data: errors ?? [],
      totalCount: count ?? 0,
      page,
      limit,
    }, { headers: corsHeaders })

  } catch (err: any) {
    console.error('Unexpected error fetching errors:', err.message)
    return NextResponse.json({ error: 'An unexpected error occurred while fetching errors' }, { status: 500, headers: corsHeaders })
  }
  // --- End Fetch Errors with Pagination ---
}

// POST /api/errors - Record a new error (using API Key authentication)
export async function POST(request: Request) {
  console.log("--- Received request in /api/errors ---")
  try {
    // 1. Parse the incoming request body
    let body: unknown; // Parse as unknown first
    try {
        body = await request.json();
    } catch (jsonError) {
        // Handle JSON parsing errors specifically
        return NextResponse.json(
            { error: 'Invalid JSON payload' },
            { status: 400, headers: corsHeaders }
        );
    }

    // 1.5 Validate the request body using Zod
    const validationResult = errorSchema.safeParse(body);

    if (!validationResult.success) {
      // If validation fails, return a 400 error with details
      console.error("Request body validation failed:", validationResult.error.flatten());
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.flatten().fieldErrors },
        { status: 400, headers: corsHeaders }
      );
    }

    // Use the validated data
    const { apiKey, message, stackTrace, metadata } = validationResult.data;

    // Basic validation (already covered by Zod, but kept for clarity/defense-in-depth)
    // if (!apiKey || !message) { // This check is now handled by Zod
    //   return NextResponse.json(
    //     { error: 'Missing required fields: apiKey and message' },
    //     { status: 400, headers: corsHeaders }
    //   );
    // }

    // 2. Validate the API Key
    // Query the projects table to find a project with the given apiKey
    const { data: projectData, error: projectError } = await supabaseServiceClient
      .from('projects')
      .select('id') // We only need the id to link the error
      .eq('api_key', apiKey)
      .single() // Expect only one project per API key

    if (projectError || !projectData) {
      console.error('API Key validation error:', projectError)
      return NextResponse.json(
        { error: 'Invalid or unknown API Key' },
        { status: 401, headers: corsHeaders } // Unauthorized
      )
    }

    const projectId = projectData.id

    // 3. Insert the error into the database
    const { data: errorData, error: insertError } = await supabaseServiceClient
      .from('errors')
      .insert([
        {
          project_id: projectId,
          message: message,
          stack_trace: stackTrace,
          metadata: metadata,
        },
      ])
      .select()

    if (insertError) {
      console.error('Error inserting data into Supabase:', insertError)
      return NextResponse.json(
        { error: 'Failed to record error', details: insertError.message },
        { status: 500, headers: corsHeaders } // Internal Server Error
      )
    }

    // 4. Return a success response
    console.log('Successfully recorded error:', errorData)
    return NextResponse.json(
      { message: 'Error recorded successfully', data: errorData },
      { status: 201, headers: corsHeaders } // Created
    )

  } catch (error) {
    console.error('Unhandled error in POST /api/errors:', error)
    let errorMessage = 'An unexpected error occurred'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    // Remove specific JSON error handling here as it's handled earlier
    // if (error instanceof SyntaxError) { ... }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: corsHeaders } // Internal Server Error
    )
  }
} 