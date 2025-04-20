/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { Twilio } from 'https://esm.sh/twilio@4.20.1' // Use esm.sh for Deno compatibility

// console.log("Hello from Functions!") // Removed log

// Define the expected structure of the incoming error payload
interface ErrorPayload {
  id: string;
  message: string;
  project_id: string;
  // Add other fields if needed later (e.g., stack_trace)
}

// Define expected structure from joining projects and users
interface ProjectUserDetails {
  projects: {
    user_id: string;
    name: string;
    last_notified_at: string | null;
  };
  users: {
    phone_number: string | null;
  } | null; // User might not exist, though unlikely with FK constraints
}

// Rate limit interval in milliseconds (e.g., 5 minutes)
const RATE_LIMIT_MS = 5 * 60 * 1000;

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase client
    const supabaseAdmin = createClient(
      // Supabase API URL - env var read by Deno/Supabase
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase Service Role Key - env var read by Deno/Supabase
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      // Create client with Auth context of the user that called the function.
      // This is unused for service role key but good practice.
      // { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
      { auth: { persistSession: false } } // Essential for server-side/service role
    );

    // 2. Parse the incoming request body (triggered by database webhook/trigger)
    // The trigger sends the new row data in the 'record' or 'new' field
    const payload = await req.json();
    const newError: ErrorPayload = payload.record ?? payload.new;

    if (!newError || !newError.project_id || !newError.message) {
      console.warn('Invalid payload received:', payload);
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Fetch project details and user phone number
    const { data: projectDetails, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select(`
        user_id,
        name,
        last_notified_at,
        users ( phone_number )
      `)
      .eq('id', newError.project_id)
      .single<ProjectUserDetails>(); // Type assertion for clarity

    if (fetchError || !projectDetails) {
        console.error('Error fetching project/user details:', fetchError?.message);
        // Don't block processing, just skip notification if details aren't found
         return new Response(JSON.stringify({ message: "Project details not found, skipping notification." }), {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
           status: 200, // Not an error in the function itself
         });
    }

    const userPhoneNumber = projectDetails.users?.phone_number;
    const lastNotifiedAt = projectDetails.projects.last_notified_at;
    const projectName = projectDetails.projects.name;

    // 4. Check if user has a phone number
    if (!userPhoneNumber) {
      // console.log(`User for project ${newError.project_id} has no phone number. Skipping.`); // Removed log
      return new Response(JSON.stringify({ message: "No phone number configured for user." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 5. Rate Limit Check
    const now = Date.now();
    if (lastNotifiedAt) {
        const lastNotifiedTime = new Date(lastNotifiedAt).getTime();
        if (now - lastNotifiedTime < RATE_LIMIT_MS) {
            // console.log(`Rate limit hit for project ${newError.project_id}. Last notified: ${lastNotifiedAt}`); // Removed log
            return new Response(JSON.stringify({ message: "Rate limit hit, notification skipped." }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
        }
    }

    // 6. Initialize Twilio Client
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !twilioPhoneNumber) {
        console.error('Twilio environment variables are not set.'); // Kept error log
        return new Response(JSON.stringify({ error: "Twilio configuration missing server-side." }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const twilioClient = new Twilio(accountSid, authToken);

    // 7. Send SMS
    const truncatedMessage = newError.message.substring(0, 100);
    const ellipsis = newError.message.length > 100 ? '...' : '';
    const notificationMessage = `Errly Alert: New error received for project "${projectName}". Message: ${truncatedMessage}${ellipsis}`;

    // console.log(`Sending SMS to ${userPhoneNumber} for project ${newError.project_id}`); // Removed log

    try {
        const message = await twilioClient.messages.create({
            body: notificationMessage,
            from: twilioPhoneNumber,
            to: userPhoneNumber, // User's phone number from DB
        });
        // console.log(`Twilio message sent successfully, SID: ${message.sid}`); // Removed log

        // 8. Update last_notified_at timestamp for the project
        const { error: updateError } = await supabaseAdmin
            .from('projects')
            .update({ last_notified_at: new Date().toISOString() })
            .eq('id', newError.project_id);

        if (updateError) {
            console.error(`Failed to update last_notified_at for project ${newError.project_id}:`, updateError.message);
            // Don't fail the whole function, but log the error
        }

        return new Response(JSON.stringify({ message: "Notification sent successfully." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (twilioError) {
        console.error("Error sending Twilio SMS:", twilioError); // Kept error log
        // Consider specific error handling based on Twilio error codes if needed
        return new Response(JSON.stringify({ error: "Failed to send notification via Twilio.", details: twilioError instanceof Error ? twilioError.message : String(twilioError) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

  } catch (error) {
    console.error("Unhandled error in Edge Function:", error); // Kept error log
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-error-notification' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
