import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
// Remove unused imports if getUserSession no longer needs them directly here
// import { cookies } from 'next/headers'; 
// import { createServerClient } from '@supabase/ssr'; 
import { getUserSession, corsHeaders } from '@/lib/authUtils'; // Import shared utilities

// CORS Headers - Remove the local definition
// const corsHeaders = { ... };

// Helper function to get user session - Remove the local definition
// async function getUserSession() { ... }

// Handle OPTIONS preflight requests for CORS
export async function OPTIONS(request: Request) {
  return new NextResponse(null, { headers: corsHeaders });
}

// GET /api/projects - List projects for the authenticated user
export async function GET(request: Request) {
  console.log('[API] GET /api/projects called');
  console.log('[API] Request headers:', Object.fromEntries(request.headers.entries()));
  
  const session = await getUserSession();
  console.log('[API] Session check result:', !!session);

  if (!session?.user) {
    console.log('[API] No authenticated user found, returning 401');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
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
      return NextResponse.json({ error: 'Failed to fetch projects', details: error.message }, { status: 500, headers: corsHeaders });
    }

    console.log(`[API] Query successful, found ${projects?.length || 0} projects`);
    return NextResponse.json(projects, { headers: corsHeaders });
  } catch (err: any) {
    console.error('[API] Unexpected error fetching projects:', err.message);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500, headers: corsHeaders });
  }
}

// POST /api/projects - Create a new project for the authenticated user
export async function POST(request: Request) {
  const session = await getUserSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  const userId = session.user.id;
  let name: string;

  try {
    const body = await request.json();
    name = body.name;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400, headers: corsHeaders });
    }
    name = name.trim(); // Trim whitespace
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: corsHeaders });
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
      return NextResponse.json({ error: 'Failed to create project', details: error.message }, { status: 500, headers: corsHeaders });
    }

    if (!newProject) {
      return NextResponse.json({ error: 'Failed to create project, no data returned' }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json(newProject, { status: 201, headers: corsHeaders }); // 201 Created
  } catch (err: any) {
    console.error('Unexpected error creating project:', err.message);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500, headers: corsHeaders });
  }
} 