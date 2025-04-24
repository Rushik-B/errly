import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin.ts';
// Remove unused imports if getUserSession no longer needs them directly here
// import { cookies } from 'next/headers'; 
// import { createServerClient } from '@supabase/ssr'; 
import { getUserFromToken } from '../../../lib/authUtils.ts'; // Relative path with extension

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
  console.log('[API] Request headers:', Object.fromEntries(request.headers.entries()));
  
  // Use JWT validation
  const user = await getUserFromToken(request); 

  if (!user) { // Check for user object
    console.log('[API] No authenticated user found via token, returning 401');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: dashboardCorsHeaders }); 
  }

  // Use user.id directly
  const userId = user.id; 
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
      // Add back explicit headers
      return NextResponse.json({ error: 'Failed to fetch projects', details: error.message }, { status: 500, headers: dashboardCorsHeaders }); 
    }

    console.log(`[API] Query successful, found ${projects?.length || 0} projects`);
    // Add back explicit headers
    return NextResponse.json(projects, { headers: dashboardCorsHeaders }); 
  } catch (err: unknown) { 
    let errorMessage = 'An unexpected error occurred';
    if (err instanceof Error) {
        errorMessage = err.message;
    }
    console.error('[API] Unexpected error fetching projects:', errorMessage);
    // Add back explicit headers
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: dashboardCorsHeaders }); 
  }
}

// POST /api/projects - Create a new project for the authenticated user
export async function POST(request: NextRequest) {
  // Use JWT validation
  const user = await getUserFromToken(request); 

  if (!user) { // Check for user object
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: dashboardCorsHeaders }); 
  }

  // Use user.id directly
  const userId = user.id; 
  let name: string;

  try {
    const body = await request.json();
    name = (body as { name?: string }).name ?? ''; 
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      // Add back explicit headers
      return NextResponse.json({ error: 'Project name is required' }, { status: 400, headers: dashboardCorsHeaders }); 
    }
    name = name.trim(); 
  } catch (_err: unknown) { 
    // Add back explicit headers
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: dashboardCorsHeaders }); 
  }

  try {
    const { data: newProject, error } = await supabaseAdmin
      .from('projects')
      .insert({ name: name, user_id: userId })
      .select('id, name, created_at')
      .single();

    if (error) {
      console.error('Supabase insert error:', error.message);
      // Add back explicit headers
      return NextResponse.json({ error: 'Failed to create project', details: error.message }, { status: 500, headers: dashboardCorsHeaders }); 
    }

    if (!newProject) {
      // Add back explicit headers
      return NextResponse.json({ error: 'Failed to create project, no data returned' }, { status: 500, headers: dashboardCorsHeaders }); 
    }
    // Add back explicit headers
    return NextResponse.json(newProject, { status: 201, headers: dashboardCorsHeaders }); 
  } catch (err: unknown) { 
     let errorMessage = 'An unexpected error occurred';
    if (err instanceof Error) {
        errorMessage = err.message;
    }
    console.error('Unexpected error creating project:', errorMessage);
    // Add back explicit headers
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: dashboardCorsHeaders }); 
  }
} 