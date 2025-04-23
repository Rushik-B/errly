import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserSession, corsHeaders } from '@/lib/authUtils'; // Import shared utilities

// Handle OPTIONS preflight requests for CORS
export async function OPTIONS(request: Request) {
  return new NextResponse(null, { headers: corsHeaders });
}

// GET /api/projects/[projectId] - Fetch a single project
export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await getUserSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
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
        return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404, headers: corsHeaders });
      }
      return NextResponse.json({ error: 'Failed to fetch project', details: error.message }, { status: 500, headers: corsHeaders });
    }

    if (!project) {
        return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json(project, { headers: corsHeaders });

  } catch (err: any) {
    console.error('Unexpected error fetching project:', err.message);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500, headers: corsHeaders });
  }
}

// PUT /api/projects/[projectId] - Update a specific project
export async function PUT(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await getUserSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }
  const userId = session.user.id;
  const projectId = params.projectId;

  let name: string;
  try {
    const body = await request.json();
    name = body.name;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Project name is required for update' }, { status: 400, headers: corsHeaders });
    }
    name = name.trim(); // Trim whitespace
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: corsHeaders });
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
         return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404, headers: corsHeaders });
       }
      return NextResponse.json({ error: 'Failed to update project', details: error.message }, { status: 500, headers: corsHeaders });
    }
    
    if (!updatedProject) { // Should not happen if error is null, but good practice
         return NextResponse.json({ error: 'Project not found after update attempt' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json(updatedProject, { headers: corsHeaders });

  } catch (err: any) {
    console.error('Unexpected error updating project:', err.message);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500, headers: corsHeaders });
  }
}

// DELETE /api/projects/[projectId] - Delete a specific project
export async function DELETE(
  request: Request, // Request object might not be strictly needed for DELETE, but good practice
  { params }: { params: { projectId: string } }
) {
  const session = await getUserSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
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
      return NextResponse.json({ error: 'Failed to delete project', details: error.message }, { status: 500, headers: corsHeaders });
    }

    if (count === 0) {
       return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404, headers: corsHeaders });
    }
    
    if (count === null || count > 1) {
        // This case indicates something unexpected happened (e.g., count not returned or multiple deletes)
        console.warn(`[API] Unexpected delete count: ${count} for project ${projectId} by user ${userId}`);
        // Still return success, but log a warning
    }

    // Return 204 No Content on successful deletion
    return new NextResponse(null, { status: 204, headers: corsHeaders });

  } catch (err: any) {
    console.error('Unexpected error deleting project:', err.message);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500, headers: corsHeaders });
  }
} 