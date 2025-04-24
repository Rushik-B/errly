import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { supabaseServiceClient } from '@/lib/supabaseClient'
import { getUserFromToken } from '@/lib/authUtils'
import { z } from 'zod' // Import Zod

// Define the Zod schema for the request body
const errorSchema = z.object({
  apiKey: z.string().uuid({ message: "Invalid API Key format" }), // Assuming API keys are UUIDs
  message: z.string().min(1, { message: "Message cannot be empty" }),
  stackTrace: z.string().optional(), // Optional string
  metadata: z.record(z.unknown()).optional(), // Optional object with unknown values
});

// GET /api/errors?projectId=...[&page=1&limit=20] - List errors for a specific project owned by the user
export async function GET(request: NextRequest) {
  // Use JWT validation
  const user = await getUserFromToken(request);

  if (!user) { // Check for user object
    // Return 401 (Headers should be handled by vercel.json if configured)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Use user.id directly
  const userId = user.id;

  // Extract query parameters
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const pageParam = searchParams.get('page')
  const limitParam = searchParams.get('limit')

  if (!projectId) {
    return NextResponse.json({ error: 'Missing required query parameter: projectId' }, { status: 400 })
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
      return NextResponse.json({ error: 'Failed to validate project ownership', details: projectError.message }, { status: 500 })
    }

    if (!project) {
      // If project is null, it means either it doesn't exist or doesn't belong to the user
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }
    // If we reach here, the user owns the project
  } catch (err: unknown) {
    let errorMessage = 'An unexpected error occurred during project validation';
    if (err instanceof Error) {
        errorMessage = err.message;
    }
    console.error('Unexpected error validating project ownership:', errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
  // --- End Validate Project Ownership ---

  // --- Fetch Errors with Pagination ---
  const page = pageParam ? parseInt(pageParam, 10) : 1
  const limit = limitParam ? parseInt(limitParam, 10) : 20 // Default limit
  const offset = (page - 1) * limit

  if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
    return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 })
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
      return NextResponse.json({ error: 'Failed to fetch errors', details: errorsError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: errors ?? [],
      totalCount: count ?? 0,
      page,
      limit,
    })

  } catch (err: unknown) {
    let errorMessage = 'An unexpected error occurred while fetching errors';
     if (err instanceof Error) {
        errorMessage = err.message;
    }
    console.error('Unexpected error fetching errors:', errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
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
    } catch (_jsonError: unknown) {
        // Remove explicit headers
        return NextResponse.json(
            { error: 'Invalid JSON payload' },
            { status: 400 } 
        );
    }

    // 1.5 Validate the request body using Zod
    const validationResult = errorSchema.safeParse(body);

    if (!validationResult.success) {
      console.error("Request body validation failed:", validationResult.error.flatten());
      // Remove explicit headers
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.flatten().fieldErrors },
        { status: 400 } 
      );
    }

    // Use the validated data
    const { apiKey, message, stackTrace, metadata } = validationResult.data;

    // 2. Validate the API Key
    // Query the projects table to find a project with the given apiKey
    const { data: projectData, error: projectError } = await supabaseServiceClient
      .from('projects')
      .select('id') // We only need the id to link the error
      .eq('api_key', apiKey)
      .single() // Expect only one project per API key

    if (projectError || !projectData) {
      console.error('API Key validation error:', projectError)
      // Remove explicit headers
      return NextResponse.json(
        { error: 'Invalid or unknown API Key' },
        { status: 401 } 
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
      // Remove explicit headers
      return NextResponse.json(
        { error: 'Failed to record error', details: insertError.message },
        { status: 500 } 
      )
    }

    // 4. Return a success response
    console.log('Successfully recorded error:', errorData)
    return NextResponse.json(
      { message: 'Error recorded successfully', data: errorData },
      { status: 201 } 
    )

  } catch (error) {
    console.error('Unhandled error in POST /api/errors:', error)
    let errorMessage = 'An unexpected error occurred'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    // Remove explicit headers
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 } 
    )
  }
} 