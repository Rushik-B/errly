import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin.ts';
// Remove unused imports if getUserSession no longer needs them directly here
// import { cookies } from 'next/headers'; 
// import { createServerClient } from '@supabase/ssr'; 
import { getUserFromToken } from '../../../lib/authUtils.ts';

// Restore dashboardCorsHeaders constant
const dashboardCorsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:8080', 
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 
  'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
  'Access-Control-Allow-Credentials': 'true',
};

// Restore OPTIONS handler
export async function OPTIONS(_request: Request) { 
  return new NextResponse(null, { headers: dashboardCorsHeaders });
}

// GET /api/projects - List projects for the authenticated user
export async function GET(request: NextRequest) {
  console.log('[API] GET /api/projects called');
  // console.log('[API] Request headers:', Object.fromEntries(request.headers.entries())); // Optional: less verbose logging
  
  // Use JWT validation
  const user = await getUserFromToken(request); 

  if (!user) {
    console.log('[API] No authenticated user found via token, returning 401');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: dashboardCorsHeaders }); 
  }

  // This is the auth user ID (X)
  const authUserId = user.id; 
  let publicUserId: string; // Variable to hold the public.users.id (Y)

  // --- Add step to get public user ID (Y) --- 
  try {
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users') // Query public.users table
      .select('id') // Select its primary key (Y)
      .eq('supabase_auth_id', authUserId) // Match using the auth ID (X)
      .single();

    if (userError) {
      console.error(`[API GET /projects] Error fetching public user ID for auth ID ${authUserId}:`, userError.message);
      throw new Error('Failed to find user profile.'); 
    }
    if (!userData) {
      console.error(`[API GET /projects] Public user profile not found for auth ID ${authUserId}.`);
      throw new Error('User profile not found.'); 
    }
    publicUserId = userData.id; // Store the correct public user ID (Y)
    console.log(`[API GET /projects] Found public user ID ${publicUserId} for auth ID ${authUserId}. Fetching projects...`);

  } catch (err: unknown) {
    const errorMessage = (err instanceof Error) ? err.message : 'Failed to retrieve user information';
    console.error(`[API GET /projects] Error during user lookup: ${errorMessage}`);
    return NextResponse.json({ error: 'Failed to process user information' }, { status: 500, headers: dashboardCorsHeaders }); 
  }
  // --- End of getting public user ID --- 

  // --- Fetch projects using the correct public user ID (Y) --- 
  try {
    console.log(`[API GET /projects] Running Supabase query for public user ID: ${publicUserId}`);
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('id, name, created_at, api_key')
      .eq('user_id', publicUserId) // <-- Use publicUserId (Y) here
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API GET /projects] Supabase query error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch projects', details: error.message }, { status: 500, headers: dashboardCorsHeaders }); 
    }

    console.log(`[API GET /projects] Query successful, found ${projects?.length || 0} projects for public user ID ${publicUserId}`);
    return NextResponse.json(projects, { headers: dashboardCorsHeaders }); 

  } catch (err: unknown) { 
    let errorMessage = 'An unexpected error occurred during project fetch';
    if (err instanceof Error) {
        errorMessage = err.message;
    }
    console.error('[API GET /projects] Unexpected error fetching projects:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: dashboardCorsHeaders }); 
  }
}

// POST /api/projects - Create a new project for the authenticated user
export async function POST(request: NextRequest) {
  // Use JWT validation
  const user = await getUserFromToken(request); 

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: dashboardCorsHeaders }); 
  }

  // This is the auth user ID (X)
  const authUserId = user.id; 
  let name: string;
  let publicUserId: string; // Variable to hold the public.users.id (Y)

  try {
    const body = await request.json();
    name = (body as { name?: string }).name ?? ''; 
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400, headers: dashboardCorsHeaders }); 
    }
    name = name.trim(); 
  } catch (_err: unknown) { 
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: dashboardCorsHeaders }); 
  }

  // --- Add step to get public user ID (Y) --- 
  try {
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users') // Query public.users table
      .select('id') // Select its primary key (Y)
      .eq('supabase_auth_id', authUserId) // Match using the auth ID (X)
      .single();

    if (userError) {
      console.error(`[API POST /projects] Error fetching public user ID for auth ID ${authUserId}:`, userError.message);
      throw new Error('Failed to find user profile.'); // Throw internal error
    }
    if (!userData) {
      console.error(`[API POST /projects] Public user profile not found for auth ID ${authUserId}.`);
      // This case might indicate an inconsistency if the user exists in auth but not public.users
      throw new Error('User profile not found.'); 
    }
    publicUserId = userData.id; // Store the correct public user ID (Y)
    console.log(`[API POST /projects] Found public user ID ${publicUserId} for auth ID ${authUserId}`);

  } catch (err: unknown) {
    const errorMessage = (err instanceof Error) ? err.message : 'Failed to retrieve user information';
    // Don't expose internal error details directly if sensitive
    return NextResponse.json({ error: 'Failed to process user information' }, { status: 500, headers: dashboardCorsHeaders }); 
  }
  // --- End of getting public user ID --- 

  // --- Insert project using the correct public user ID (Y) --- 
  try {
    const { data: newProject, error } = await supabaseAdmin
      .from('projects')
      .insert({ name: name, user_id: publicUserId }) // <-- Use publicUserId (Y) here
      .select('id, name, created_at')
      .single();

    if (error) {
      console.error('[API POST /projects] Supabase insert error:', error.message);
      // Check for foreign key violation specifically
      if (error.code === '23503') { 
         return NextResponse.json({ error: 'User reference error creating project' }, { status: 500, headers: dashboardCorsHeaders });
      }
      return NextResponse.json({ error: 'Failed to create project', details: error.message }, { status: 500, headers: dashboardCorsHeaders }); 
    }

    if (!newProject) {
      return NextResponse.json({ error: 'Failed to create project, no data returned' }, { status: 500, headers: dashboardCorsHeaders }); 
    }

    return NextResponse.json(newProject, { status: 201, headers: dashboardCorsHeaders }); 
  } catch (err: unknown) { 
     let errorMessage = 'An unexpected error occurred during project creation';
    if (err instanceof Error) {
        errorMessage = err.message;
    }
    console.error('[API POST /projects] Unexpected error creating project:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: dashboardCorsHeaders }); 
  }
} 