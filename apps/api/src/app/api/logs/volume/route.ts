import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin.ts';
import { getUserFromToken } from '../../../../lib/authUtils.ts';
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

// Define schema for query parameters
const querySchema = z.object({
    projectId: z.string().uuid({ message: "Invalid Project ID format" }),
    startDate: z.string().datetime({ message: "Invalid Start Date format" }),
    endDate: z.string().datetime({ message: "Invalid End Date format" }),
});

// Define the expected structure from the (yet to be created) RPC function
interface LogVolumeBucket {
    bucket_start_time: string; // Renamed from timestamp
    level: string;
    count: number;
}

// Define the final aggregated structure per timestamp
interface AggregatedTimestampData {
    timestamp: string; // Keep this as 'timestamp' for the final API response
    error: number;
    warn: number;
    info: number;
    log: number;
}

// Define the final API response structure
interface LogVolumeApiResponse {
    data: AggregatedTimestampData[];
    interval: string; // 'minute', 'hour', or 'day'
}

// Helper function to get publicUserId from authUserId (assuming reuse)
async function getPublicUserIdFromAuthId(authUserId: string): Promise<string | null> {
    // Implementation similar to apps/api/src/app/api/projects/[projectId]/route.ts
    // ... (Implementation needed or import if refactored)
    try {
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('supabase_auth_id', authUserId)
            .single();
        if (userError) {
            console.error(`[API Helper /logs/volume] Error fetching public user ID for auth ID ${authUserId}:`, userError.message);
            return null;
        }
        if (!userData) {
            console.error(`[API Helper /logs/volume] Public user profile not found for auth ID ${authUserId}.`);
            return null;
        }
        return userData.id;
    } catch (err) {
        console.error('[API Helper /logs/volume] Unexpected error fetching public user ID:', err);
        return null;
    }
}

// Helper function to validate project ownership (assuming reuse)
async function validateProjectOwnership(projectId: string, publicUserId: string): Promise<boolean> {
    // Implementation similar to apps/api/src/app/api/errors/route.ts
    // ... (Implementation needed or import if refactored)
    try {
        const { data: project, error: projectError } = await supabaseAdmin
            .from('projects')
            .select('id')
            .eq('id', projectId)
            .eq('user_id', publicUserId)
            .maybeSingle();

        if (projectError) {
            console.error(`[API Helper /logs/volume] Error validating project ownership for project ${projectId}, user ${publicUserId}:`, projectError.message);
            return false;
        }
        return !!project; // True if project exists and belongs to the user, false otherwise
    } catch (err: unknown) {
        console.error(`[API Helper /logs/volume] Unexpected error validating project ownership for project ${projectId}, user ${publicUserId}:`, err);
        return false;
    }
}

// Helper to determine bucket interval based on duration
function getBucketInterval(startDate: Date, endDate: Date): string {
    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    if (durationHours <= 2) return 'minute'; // Finer grain for short periods
    if (durationHours <= 48) return 'hour'; // Hourly for up to 2 days
    return 'day'; // Daily for longer ranges
}

// GET /api/logs/volume?projectId=...&startDate=...&endDate=...
export async function GET(request: NextRequest) {
    // 1. Authenticate User
    const user = await getUserFromToken(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }
    const authUserId = user.id;

    // 2. Parse and Validate Query Params
    const { searchParams } = new URL(request.url);
    const params = {
        projectId: searchParams.get('projectId') || '',
        startDate: searchParams.get('startDate') || '',
        endDate: searchParams.get('endDate') || '',
    };
    const validationResult = querySchema.safeParse(params);

    if (!validationResult.success) {
        return NextResponse.json(
            { error: 'Invalid query parameters', details: validationResult.error.flatten().fieldErrors },
            { status: 400, headers: corsHeaders }
        );
    }
    const { projectId, startDate: startDateStr, endDate: endDateStr } = validationResult.data;
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // 3. Get Public User ID and Validate Ownership
    const publicUserId = await getPublicUserIdFromAuthId(authUserId);
    if (!publicUserId) {
        return NextResponse.json({ error: 'User profile lookup failed' }, { status: 404, headers: corsHeaders });
    }
    const hasAccess = await validateProjectOwnership(projectId, publicUserId);
    if (!hasAccess) {
        return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404, headers: corsHeaders });
    }

    // 4. Determine Bucket Interval
    const bucketInterval = getBucketInterval(startDate, endDate);

    // 5. Call RPC Function (Placeholder)
    let aggregatedData: AggregatedTimestampData[] = [];
    try {
        console.log(`[API GET /logs/volume] Calling RPC get_log_volume_aggregate for project ${projectId} with interval ${bucketInterval}`);
        const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
            'get_log_volume_aggregate', // Ensure this function exists in your DB!
            {
                project_id_param: projectId,
                start_date_param: startDate.toISOString(),
                end_date_param: endDate.toISOString(),
                bucket_interval: bucketInterval,
            }
        );

        if (rpcError) {
            console.error('[API GET /logs/volume] Error calling RPC:', rpcError);
            throw new Error(`Failed to fetch log volume: ${rpcError.message}`);
        }

        // 6. Process RPC Results (Pivot data)
        const processedMap = new Map<string, AggregatedTimestampData>();
        (rpcData as LogVolumeBucket[]).forEach(row => {
            const ts = row.bucket_start_time; // Use bucket_start_time from RPC result
            if (!processedMap.has(ts)) {
                processedMap.set(ts, {
                    timestamp: ts, // Set the final 'timestamp' field for the API response
                    error: 0,
                    warn: 0,
                    info: 0,
                    log: 0,
                });
            }
            const entry = processedMap.get(ts)!;
            const level = row.level.toLowerCase(); // Normalize level
            if (level === 'error') entry.error += row.count;
            else if (level === 'warn') entry.warn += row.count;
            else if (level === 'info') entry.info += row.count;
            else if (level === 'log') entry.log += row.count;
            // Ignore other potential levels or handle as needed
        });

        aggregatedData = Array.from(processedMap.values()).sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ); // Sort chronologically (using the final 'timestamp' field)

        console.log(`[API GET /logs/volume] Processed ${aggregatedData.length} time buckets.`);

    } catch (err: unknown) {
        const errorMessage = (err instanceof Error) ? err.message : 'An unexpected error occurred while fetching log volume';
        console.error('[API GET /logs/volume] Error:', errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500, headers: corsHeaders });
    }

    // 7. Return Data (Modified)
    const responsePayload: LogVolumeApiResponse = {
        data: aggregatedData,
        interval: bucketInterval
    };
    return NextResponse.json(responsePayload, { headers: corsHeaders });
} 