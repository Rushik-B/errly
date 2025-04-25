import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { getUserFromToken } from '../../../../lib/authUtils';

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

// Helper function to get publicUserId from authUserId
async function getPublicUserIdFromAuthId(authUserId: string): Promise<string | null> {
  try {
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('supabase_auth_id', authUserId)
      .single();
    if (userError) {
      console.error(`[API Helper] Error fetching public user ID for auth ID ${authUserId}:`, userError.message);
      return null;
    }
    if (!userData) {
      console.error(`[API Helper] Public user profile not found for auth ID ${authUserId}.`);
      return null;
    }
    return userData.id;
  } catch (err) {
    console.error('[API Helper] Unexpected error fetching public user ID:', err);
    return null;
  }
}

// GET /api/projects/[projectId] - Fetch a single project
export async function GET(
  request: NextRequest,
  context: { params?: { projectId?: string } }
) {
  const projectId = context.params?.projectId;
  if (!projectId) {
    return NextResponse.json({ error: 'Missing project ID' }, { status: 400, headers: dashboardCorsHeaders });
  }

  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: dashboardCorsHeaders });
  }
  const authUserId = user.id; // Auth ID (X)

  // Get Public User ID (Y)
  const publicUserId = await getPublicUserIdFromAuthId(authUserId);
  if (!publicUserId) {
    // Handle case where public user profile doesn't exist or lookup failed
    return NextResponse.json({ error: 'User profile not found or lookup failed' }, { status: 404, headers: dashboardCorsHeaders });
  }

  console.log(`[API GET /projects/${projectId}] Looking for project for public user ID: ${publicUserId}`);

  try {
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('id, name, created_at, api_key')
      .eq('id', projectId)
      .eq('user_id', publicUserId) // Use publicUserId (Y) for check
      .single();

    if (error || !project) {
        if (error?.code === 'PGRST116' || !project) {
            console.warn(`[API GET /projects/${projectId}] Project not found for public user ID ${publicUserId}`);
            return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404, headers: dashboardCorsHeaders });
        } else {
           console.error('[API GET /projects] Supabase query error:', error.message);
           return NextResponse.json({ error: 'Failed to fetch project', details: error.message }, { status: 500, headers: dashboardCorsHeaders });
        }
    }
    
    return NextResponse.json(project, { headers: dashboardCorsHeaders });

  } catch (err: unknown) {
    let errorMessage = 'An unexpected error occurred';
    if (err instanceof Error) { errorMessage = err.message; }
    console.error('[API GET /projects] Unexpected error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: dashboardCorsHeaders });
  }
}

// PUT /api/projects/[projectId] - Update a specific project
export async function PUT(
  request: NextRequest,
  context: { params?: { projectId?: string } }
) {
  const projectId = context.params?.projectId;
  if (!projectId) {
    return NextResponse.json({ error: 'Missing project ID' }, { status: 400, headers: dashboardCorsHeaders });
  }

  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: dashboardCorsHeaders });
  }
  const authUserId = user.id; // Auth ID (X)

  // Get Public User ID (Y)
  const publicUserId = await getPublicUserIdFromAuthId(authUserId);
  if (!publicUserId) {
    return NextResponse.json({ error: 'User profile not found or lookup failed' }, { status: 404, headers: dashboardCorsHeaders });
  }

  let name: string;
  try {
    const body = await request.json();
    name = (body as { name?: string }).name ?? '';
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Project name is required for update' }, { status: 400, headers: dashboardCorsHeaders });
    }
    name = name.trim();
  } catch (_err: unknown) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: dashboardCorsHeaders });
  }

  console.log(`[API PUT /projects/${projectId}] Updating project for public user ID: ${publicUserId}`);

  try {
    const { data: updatedProject, error } = await supabaseAdmin
      .from('projects')
      .update({ name: name })
      .eq('id', projectId)
      .eq('user_id', publicUserId) // Use publicUserId (Y) for check
      .select('id, name, created_at')
      .single();

    if (error || !updatedProject) {
      if (error?.code === 'PGRST116' || !updatedProject) {
        console.warn(`[API PUT /projects/${projectId}] Project not found for public user ID ${publicUserId}`);
        return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404, headers: dashboardCorsHeaders });
      } else {
        console.error('[API PUT /projects] Supabase update error:', error.message);
        return NextResponse.json({ error: 'Failed to update project', details: error.message }, { status: 500, headers: dashboardCorsHeaders });
      }
    }

    return NextResponse.json(updatedProject, { headers: dashboardCorsHeaders });

  } catch (err: unknown) {
    let errorMessage = 'An unexpected error occurred';
    if (err instanceof Error) { errorMessage = err.message; }
    console.error('[API PUT /projects] Unexpected error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: dashboardCorsHeaders });
  }
}

// DELETE /api/projects/[projectId] - Delete a specific project
export async function DELETE(
  request: NextRequest, // Need request for getUserFromToken
  context: { params?: { projectId?: string } }
) {
  const projectId = context.params?.projectId;
  if (!projectId) {
    return NextResponse.json({ error: 'Missing project ID' }, { status: 400, headers: dashboardCorsHeaders });
  }

  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: dashboardCorsHeaders });
  }
  const authUserId = user.id; // Auth ID (X)

  // Get Public User ID (Y)
  const publicUserId = await getPublicUserIdFromAuthId(authUserId);
  if (!publicUserId) {
    // Even if user doesn't exist, we can proceed to attempt delete,
    // it will just likely result in count=0 if they never had the project.
    console.warn(`[API DELETE /projects] Public user ID lookup failed for auth ID ${authUserId}, proceeding with delete attempt.`);
    // Alternatively, return 404 here if desired: 
    // return NextResponse.json({ error: 'User profile not found or lookup failed' }, { status: 404, headers: dashboardCorsHeaders });
  }

  console.log(`[API DELETE /projects/${projectId}] Attempting delete for auth user ${authUserId} (public ID: ${publicUserId})`);

  try {
    // Use publicUserId (Y) if available, otherwise the delete will naturally fail to match
    // if the project exists but belongs to someone else, or if the project simply doesn't exist.
    // The key is matching on projectId AND the correct user ID (Y) if we found it.
    const query = supabaseAdmin
        .from('projects')
        .delete({ count: 'exact' })
        .eq('id', projectId);
    
    // Only add the user_id check if we successfully found the publicUserId
    if (publicUserId) {
        query.eq('user_id', publicUserId); 
    }

    const { error, count } = await query;

    if (error) {
      console.error('[API DELETE /projects] Supabase delete error:', error.message);
      return NextResponse.json({ error: 'Failed to delete project', details: error.message }, { status: 500, headers: dashboardCorsHeaders });
    }

    if (count === 0) {
       console.warn(`[API DELETE /projects/${projectId}] Project not found for user or access denied (public user ID: ${publicUserId})`);
       return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404, headers: dashboardCorsHeaders });
    }
    
    if (count === null || count > 1) {
        console.warn(`[API DELETE /projects] Unexpected delete count: ${count} for project ${projectId}`);
    }

    console.log(`[API DELETE /projects/${projectId}] Successfully deleted project.`);
    return new NextResponse(null, { status: 204, headers: dashboardCorsHeaders });

  } catch (err: unknown) {
    let errorMessage = 'An unexpected error occurred';
    if (err instanceof Error) { errorMessage = err.message; }
    console.error('[API DELETE /projects] Unexpected error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: dashboardCorsHeaders });
  }
} 