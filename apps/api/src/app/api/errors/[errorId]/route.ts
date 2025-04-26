import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { getUserFromToken } from '../../../../lib/authUtils';
import { z } from 'zod';

// Common CORS headers (adjust origin as needed)
const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:8080', 
    'Access-Control-Allow-Methods': 'GET, OPTIONS', 
    'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
    'Access-Control-Allow-Credentials': 'true',
};

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