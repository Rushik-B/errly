import { NextResponse } from 'next/server'
import { supabaseServiceClient } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  console.log("--- Received request in /api/errors ---");
  try {
    // 1. Parse the incoming request body
    const body = await request.json()
    const { apiKey, message, stackTrace, metadata } = body

    // Basic validation
    if (!apiKey || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: apiKey and message' },
        { status: 400 }
      )
    }

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
        { status: 401 } // Unauthorized
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
          stack_trace: stackTrace, // Will be null if not provided
          metadata: metadata,       // Will be null if not provided
        },
      ])
      .select()

    if (insertError) {
      console.error('Error inserting data into Supabase:', insertError)
      return NextResponse.json(
        { error: 'Failed to record error', details: insertError.message },
        { status: 500 } // Internal Server Error
      )
    }

    // 4. Return a success response
    console.log('Successfully recorded error:', errorData)
    return NextResponse.json(
      { message: 'Error recorded successfully', data: errorData },
      { status: 201 } // Created
    )

  } catch (error) {
    console.error('Unhandled error in POST /api/errors:', error)
    let errorMessage = 'An unexpected error occurred'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError) {
         return NextResponse.json(
            { error: 'Invalid JSON payload' },
            { status: 400 }
        )
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 } // Internal Server Error
    )
  }
} 