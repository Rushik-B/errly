import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserSession } from '@/lib/authUtils'; // Import only getUserSession

// GET /api/projects/[projectId] - Fetch a single project
export async function GET(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any
) {
  const { params } = context;
  if (!params?.projectId) {
    return NextResponse.json({ error: 'Missing project ID' }, { status: 400 });
  }
  const session = await getUserSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch project', details: error.message }, { status: 500 });
    }

    if (!project) {
        return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }
    return NextResponse.json(project);

  } catch (err: unknown) { // Use unknown
    let errorMessage = 'An unexpected error occurred';
    if (err instanceof Error) {
        errorMessage = err.message;
    }
    console.error('Unexpected error fetching project:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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
    return NextResponse.json({ error: 'Missing project ID' }, { status: 400 });
  }
  const session = await getUserSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const projectId = params.projectId;

  let name: string;
  try {
    const body = await request.json();
    // Assuming body is an object, type it more specifically if possible
    name = (body as { name?: string }).name ?? ''; 
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Project name is required for update' }, { status: 400 });
    }
    name = name.trim(); // Trim whitespace
  } catch (_err: unknown) { // Prefix unused err, use unknown
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
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
         return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
       }
      return NextResponse.json({ error: 'Failed to update project', details: error.message }, { status: 500 });
    }
    
    if (!updatedProject) { // Should not happen if error is null, but good practice
         return NextResponse.json({ error: 'Project not found after update attempt' }, { status: 404 });
    }
    return NextResponse.json(updatedProject);

  } catch (err: unknown) { // Use unknown
    let errorMessage = 'An unexpected error occurred';
    if (err instanceof Error) {
        errorMessage = err.message;
    }
    console.error('Unexpected error updating project:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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
    return NextResponse.json({ error: 'Missing project ID' }, { status: 400 });
  }
  const session = await getUserSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Failed to delete project', details: error.message }, { status: 500 });
    }

    if (count === 0) {
       return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }
    
    if (count === null || count > 1) {
        console.warn(`[API] Unexpected delete count: ${count} for project ${projectId} by user ${userId}`);
    }

    return new NextResponse(null, { status: 204 });

  } catch (err: unknown) { // Use unknown
    let errorMessage = 'An unexpected error occurred';
    if (err instanceof Error) {
        errorMessage = err.message;
    }
    console.error('Unexpected error deleting project:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 