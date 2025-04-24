import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserSession } from '@/lib/authUtils'; // Import only getUserSession

// Restore dashboardCorsHeaders constant
const dashboardCorsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:8080',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

// Restore OPTIONS handler
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, { headers: dashboardCorsHeaders });
}

// GET /api/projects/[projectId] - Fetch a single project
export async function GET(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any
) {
  const { params } = context;
  if (!params?.projectId) {
    // Add back explicit headers
    return NextResponse.json({ error: 'Missing project ID' }, { status: 400, headers: dashboardCorsHeaders });
  }
  const session = await getUserSession();

  if (!session?.user) {
    // Add back explicit headers
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: dashboardCorsHeaders });
  }
  const userId = session.user.id;
  const projectId = params.projectId;

  try {
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('id, name, created_at, api_key') // Select desired fields
      .eq('id', projectId)
      .eq('user_id', userId) // Ensure the project belongs to the user
      .single(); // Expect a single result

    if (error) {
      console.error('Supabase query error (GET project):', error.message);
      if (error.code === 'PGRST116') { // PGRST116 = "Row not found"
        // Add back explicit headers
        return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404, headers: dashboardCorsHeaders });
      }
      // Add back explicit headers
      return NextResponse.json({ error: 'Failed to fetch project', details: error.message }, { status: 500, headers: dashboardCorsHeaders });
    }

    if (!project) {
        // Add back explicit headers
        return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404, headers: dashboardCorsHeaders });
    }
    // Add back explicit headers
    return NextResponse.json(project, { headers: dashboardCorsHeaders });

  } catch (err: unknown) { // Use unknown
    let errorMessage = 'An unexpected error occurred';
    if (err instanceof Error) {
        errorMessage = err.message;
    }
    console.error('Unexpected error fetching project:', errorMessage);
    // Add back explicit headers
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: dashboardCorsHeaders });
  }
}

// PUT /api/projects/[projectId] - Update a specific project
export async function PUT(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any
) {
  const { params } = context;
  if (!params?.projectId) {
    // Add back explicit headers
    return NextResponse.json({ error: 'Missing project ID' }, { status: 400, headers: dashboardCorsHeaders });
  }
  const session = await getUserSession();

  if (!session?.user) {
    // Add back explicit headers
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: dashboardCorsHeaders });
  }
  const userId = session.user.id;
  const projectId = params.projectId;

  let name: string;
  try {
    const body = await request.json();
    // Assuming body is an object, type it more specifically if possible
    name = (body as { name?: string }).name ?? ''; 
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      // Add back explicit headers
      return NextResponse.json({ error: 'Project name is required for update' }, { status: 400, headers: dashboardCorsHeaders });
    }
    name = name.trim(); // Trim whitespace
  } catch (_err: unknown) { // Prefix unused err, use unknown
    // Add back explicit headers
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: dashboardCorsHeaders });
  }

  try {
    const { data: updatedProject, error } = await supabaseAdmin
      .from('projects')
      .update({ name: name })
      .eq('id', projectId)
      .eq('user_id', userId) // Ensure the user owns the project
      .select('id, name, created_at') // Return the updated project
      .single(); // Expect a single row back

    if (error) {
      console.error('Supabase update error:', error.message);
       if (error.code === 'PGRST116') { // PGRST116 = "Row not found"
         // Add back explicit headers
         return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404, headers: dashboardCorsHeaders });
       }
      // Add back explicit headers
      return NextResponse.json({ error: 'Failed to update project', details: error.message }, { status: 500, headers: dashboardCorsHeaders });
    }
    
    if (!updatedProject) { // Should not happen if error is null, but good practice
         // Add back explicit headers
         return NextResponse.json({ error: 'Project not found after update attempt' }, { status: 404, headers: dashboardCorsHeaders });
    }
    // Add back explicit headers
    return NextResponse.json(updatedProject, { headers: dashboardCorsHeaders });

  } catch (err: unknown) { // Use unknown
    let errorMessage = 'An unexpected error occurred';
    if (err instanceof Error) {
        errorMessage = err.message;
    }
    console.error('Unexpected error updating project:', errorMessage);
    // Add back explicit headers
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: dashboardCorsHeaders });
  }
}

// DELETE /api/projects/[projectId] - Delete a specific project
export async function DELETE(
  _request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any
) {
  const { params } = context;
  if (!params?.projectId) {
    // Add back explicit headers
    return NextResponse.json({ error: 'Missing project ID' }, { status: 400, headers: dashboardCorsHeaders });
  }
  const session = await getUserSession();

  if (!session?.user) {
    // Add back explicit headers
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: dashboardCorsHeaders });
  }
  const userId = session.user.id;
  const projectId = params.projectId;

  try {
    const { error, count } = await supabaseAdmin
      .from('projects')
      .delete({ count: 'exact' }) // Request the count of deleted rows
      .eq('id', projectId)
      .eq('user_id', userId); // Ensure the user owns the project

    if (error) {
      console.error('Supabase delete error:', error.message);
      // Add back explicit headers
      return NextResponse.json({ error: 'Failed to delete project', details: error.message }, { status: 500, headers: dashboardCorsHeaders });
    }

    if (count === 0) {
       // Add back explicit headers
       return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404, headers: dashboardCorsHeaders });
    }
    
    if (count === null || count > 1) {
        console.warn(`[API] Unexpected delete count: ${count} for project ${projectId} by user ${userId}`);
    }

    // Add back explicit headers
    return new NextResponse(null, { status: 204, headers: dashboardCorsHeaders });

  } catch (err: unknown) { // Use unknown
    let errorMessage = 'An unexpected error occurred';
    if (err instanceof Error) {
        errorMessage = err.message;
    }
    console.error('Unexpected error deleting project:', errorMessage);
    // Add back explicit headers
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: dashboardCorsHeaders });
  }
} 