import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { getUserFromToken } from '../../../../lib/authUtils';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../../../../lib/authUtils';

// Initialize Supabase Admin Client (use environment variables)
const supabaseAdminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } }
);

// OPTIONS handler for preflight requests
export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// Define schema for URL parameters
const paramsSchema = z.object({
    errorId: z.string().uuid({ message: "Invalid Error ID format (must be UUID)" })
});

// GET /api/errors/[errorId] - Fetch details for a single error
export async function GET(request: NextRequest, { params }: { params: { errorId: string } }) {
    // 1. Validate User Authentication
    const user = await getUserFromToken(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }
    const authUserId = user.id;

    // 2. Validate URL Parameter
    const validationResult = paramsSchema.safeParse(params);
    if (!validationResult.success) {
        return NextResponse.json(
            { error: 'Invalid request parameters', details: validationResult.error.flatten().fieldErrors },
            { status: 400, headers: corsHeaders }
        );
    }
    const { errorId } = validationResult.data;

    try {
        // 3. Fetch the error and its associated project ID
        const { data: errorData, error: fetchError } = await supabaseAdmin
            .from('errors')
            .select(`
                *,
                projects ( user_id )
            `)
            .eq('id', errorId)
            .single();

        if (fetchError) {
            console.error(`[API GET /errors/${errorId}] Error fetching error:`, fetchError.message);
            if (fetchError.code === 'PGRST116') { // Code for "Resource not found"
                return NextResponse.json({ error: 'Error not found' }, { status: 404, headers: corsHeaders });
            }
            return NextResponse.json({ error: 'Failed to fetch error details', details: fetchError.message }, { status: 500, headers: corsHeaders });
        }

        if (!errorData) {
            // Should be caught by fetchError PGRST116, but double-check
            return NextResponse.json({ error: 'Error not found' }, { status: 404, headers: corsHeaders });
        }

        // 4. Verify Project Ownership (Crucial for security)
        // We need the public user ID associated with the auth user ID
        const { data: userData, error: userFetchError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('supabase_auth_id', authUserId)
            .single();

        if (userFetchError || !userData) {
            console.error(`[API GET /errors/${errorId}] Failed to find public user ID for auth user ${authUserId}:`, userFetchError?.message);
            return NextResponse.json({ error: 'User profile not found or lookup failed' }, { status: 404, headers: corsHeaders });
        }
        const publicUserId = userData.id;
        
        // Check if the error's project's user_id matches the public user ID
        if (!errorData.projects || errorData.projects.user_id !== publicUserId) {
             console.warn(`[API GET /errors/${errorId}] Access denied for user ${publicUserId}. Error project belongs to ${errorData.projects?.user_id}.`);
             return NextResponse.json({ error: 'Access denied to this error' }, { status: 403, headers: corsHeaders });
        }

        // 5. Return the full error details (excluding the joined project data)
        const { projects, ...errorDetails } = errorData; // Separate project info
        return NextResponse.json(errorDetails, { status: 200, headers: corsHeaders });

    } catch (err: unknown) {
        const errorMessage = (err instanceof Error) ? err.message : 'An unexpected error occurred';
        console.error(`[API GET /errors/${errorId}] Unexpected error:`, errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500, headers: corsHeaders });
    }
}

// TODO: Implement proper authentication and authorization

export async function PATCH(
  request: NextRequest,
  { params }: { params: { errorId: string } }
) {
  const errorId = params.errorId;
  let updateData: { state?: string; muted_until?: string | null } = {};
  let responseStatus = 200;
  let responseBody: any = { message: 'Error updated successfully' };

  // Handle CORS preflight request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const newState = body.state;
    const mutedUntil = body.muted_until; // Expect ISO string

    console.log(`[API PATCH /api/errors/${errorId}] Received request:`, body);

    // --- Basic Input Validation ---
    if (!newState || !['active', 'resolved', 'muted'].includes(newState)) {
      responseStatus = 400;
      responseBody = { error: 'Invalid or missing state value. Must be one of: active, resolved, muted.' };
      return new NextResponse(JSON.stringify(responseBody), { status: responseStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (newState === 'muted' && !mutedUntil) {
      responseStatus = 400;
      responseBody = { error: 'muted_until timestamp is required when state is muted.' };
      return new NextResponse(JSON.stringify(responseBody), { status: responseStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- Prepare Update Payload ---
    updateData.state = newState;
    if (newState === 'muted') {
      // Validate timestamp format if needed, Supabase handles basic validation
      updateData.muted_until = mutedUntil;
    } else {
      // Clear muted_until if state is changing to active or resolved
      updateData.muted_until = null;
    }

    // --- Authorization (Placeholder - NEEDS IMPLEMENTATION) ---
    // 1. Get user from JWT (e.g., using request headers and Supabase auth helpers)
    // const { data: { user }, error: userError } = await supabase.auth.getUser(request.headers.get('Authorization')?.split(' ')[1]);
    // if (userError || !user) { throw new Error('Unauthorized'); }
    // 2. Verify user owns the project associated with this errorId
    // const { data: errorProject, error: ownerError } = await supabaseAdmin
    //   .from('errors')
    //   .select('projects(user_id)')
    //   .eq('id', errorId)
    //   .single();
    // if (ownerError || !errorProject || errorProject.projects.user_id !== user.id) {
    //   throw new Error('Forbidden: User does not own the project associated with this error.');
    // }
    // --- End Authorization Placeholder ---

    console.log(`[API PATCH /api/errors/${errorId}] Updating with data:`, updateData);

    // --- Database Update ---
    const { data, error } = await supabaseAdminClient
      .from('errors')
      .update(updateData)
      .eq('id', errorId)
      .select('id, state, muted_until') // Select updated fields back
      .single();

    if (error) {
      console.error(`[API PATCH /api/errors/${errorId}] Supabase error:`, error);
      throw new Error(`Database update failed: ${error.message}`);
    }

    if (!data) {
       responseStatus = 404;
       responseBody = { error: `Error with ID ${errorId} not found.` };
    } else {
       responseBody = data; // Return the updated data
    }


  } catch (err: any) {
    console.error(`[API PATCH /api/errors/${errorId}] Error:`, err.message);
    responseStatus = err.message.includes('Unauthorized') ? 401 : err.message.includes('Forbidden') ? 403 : 500;
    responseBody = { error: err.message || 'An internal server error occurred.' };
  }

  // Return the response
  return new NextResponse(JSON.stringify(responseBody), {
    status: responseStatus,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
} 