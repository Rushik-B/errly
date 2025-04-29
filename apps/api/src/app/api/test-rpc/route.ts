import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin.ts'; // Adjust path if needed

export const dynamic = 'force-dynamic' // Ensure it runs dynamically on Vercel

export async function GET() {
    console.log("[API GET /test-rpc] Handler started.");
    try {
        console.log("[API GET /test-rpc] Attempting RPC call...");
        // Use your actual project ID here for the test
        const testParams = { project_id_param: 'c034a4b5-c8a5-4d04-bb5d-31159f5996ee' }; 
        const { data, error } = await supabaseAdmin
            .rpc('get_aggregated_errors_trend_v1', testParams);

        if (error) {
            // Log all available error details
            console.error("[API GET /test-rpc] RPC call FAILED: Code=", error.code, "Msg=", error.message, "Details=", error.details, "Hint=", error.hint);
            return NextResponse.json(
                { error: 'RPC call failed', code: error.code, details: error.message },
                { status: 500 }
            );
        } else {
            console.log("[API GET /test-rpc] RPC call SUCCEEDED.");
            // Return minimal success message, not the actual data
            return NextResponse.json({ message: 'RPC call succeeded', data_length: Array.isArray(data) ? data.length : null });
        }
    } catch (err: unknown) {
        const errMsg = (err instanceof Error) ? err.message : String(err);
        console.error("[API GET /test-rpc] Caught exception:", errMsg);
        return NextResponse.json(
            { error: 'Caught exception', details: errMsg },
            { status: 500 }
        );
    }
} 