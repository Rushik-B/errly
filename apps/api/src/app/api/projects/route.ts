import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
// Remove unused imports if getUserSession no longer needs them directly here
// import { cookies } from 'next/headers'; 
// import { createServerClient } from '@supabase/ssr'; 
import { getUserSession } from '@/lib/authUtils'; // Import only getUserSession

// REMOVE dashboardCorsHeaders constant - rely on vercel.json
/*
const dashboardCorsHeaders = {
  // Use environment variable again
  // 'Access-Control-Allow-Origin': 'https://errly.vercel.app', 
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:8080', 
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Adjust methods as needed for this route
  'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Allow necessary headers for auth
  'Access-Control-Allow-Credentials': 'true', // Allow credentials
};
*/

// REMOVE OPTIONS handler - rely on vercel.json
/*
export async function OPTIONS(_request: Request) { // Prefix unused request
  return new NextResponse(null, { headers: dashboardCorsHeaders });
}
*/

// GET /api/projects - List projects for the authenticated user
export async function GET(request: Request) {
  console.log('[API] GET /api/projects called');
  console.log('[API] Request headers:', Object.fromEntries(request.headers.entries()));
  
  const session = await getUserSession();
  console.log('[API] Session check result:', !!session);

  if (!session?.user) {
    console.log('[API] No authenticated user found, returning 401');
    // Remove explicit headers
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); 
  }

  const userId = session.user.id;
  console.log(`[API] Fetching projects for user: ${userId}`);

  try {
    console.log('[API] Running Supabase query');
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('id, name, created_at, api_key')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] Supabase query error:', error.message);
      // Remove explicit headers
      return NextResponse.json({ error: 'Failed to fetch projects', details: error.message }, { status: 500 }); 
    }

    console.log(`[API] Query successful, found ${projects?.length || 0} projects`);
    // Remove explicit headers
    return NextResponse.json(projects); // Return only data, headers handled by vercel.json
  } catch (err: unknown) { // Use unknown instead of any
    let errorMessage = 'An unexpected error occurred';
    if (err instanceof Error) {
        errorMessage = err.message;
    }
    console.error('[API] Unexpected error fetching projects:', errorMessage);
    // Remove explicit headers
    return NextResponse.json({ error: errorMessage }, { status: 500 }); 
  }
}

// POST /api/projects - Create a new project for the authenticated user
export async function POST(request: Request) {
  const session = await getUserSession();

  if (!session?.user) {
    // Remove explicit headers
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); 
  }

  const userId = session.user.id;
  let name: string;

  try {
    const body = await request.json();
    // Assuming body is an object, type it more specifically if possible
    name = (body as { name?: string }).name ?? ''; 
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      // Remove explicit headers
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 }); 
    }
    name = name.trim(); // Trim whitespace
  } catch (_err: unknown) { // Prefix unused err, use unknown
    // Remove explicit headers
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); 
  }

  try {
    // Use the admin client to insert. RLS policy on insert ensures user_id matches auth.uid()
    const { data: newProject, error } = await supabaseAdmin
      .from('projects')
      .insert({ name: name, user_id: userId })
      .select('id, name, created_at') // Return the newly created project
      .single(); // Expecting a single row back

    if (error) {
      console.error('Supabase insert error:', error.message);
      // Check for specific errors, e.g., duplicate name if you add a unique constraint
      // Remove explicit headers
      return NextResponse.json({ error: 'Failed to create project', details: error.message }, { status: 500 }); 
    }

    if (!newProject) {
      // Remove explicit headers
      return NextResponse.json({ error: 'Failed to create project, no data returned' }, { status: 500 }); 
    }
    // Remove explicit headers
    return NextResponse.json(newProject, { status: 201 }); // 201 Created 
  } catch (err: unknown) { // Use unknown
     let errorMessage = 'An unexpected error occurred';
    if (err instanceof Error) {
        errorMessage = err.message;
    }
    console.error('Unexpected error creating project:', errorMessage);
    // Remove explicit headers
    return NextResponse.json({ error: errorMessage }, { status: 500 }); 
  }
} 