/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3?dts";
import { corsHeaders } from "../_shared/cors.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"; // For Basic Auth

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface ErrorPayload {
  id: string;
  message: string;
  project_id: string;
}

interface ProjectUserDetails {
  projects: {
    user_id: string;
    name: string;
    last_notified_at: string | null;
  };
  users: {
    phone_number: string | null;
  } | null;
}

/* ------------------------------------------------------------------ */

const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

serve(async (req: Request): Promise<Response> => {
  /* CORS pre‑flight -------------------------------------------------- */
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    /* Supabase client ------------------------------------------------ */
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    /* Parse payload -------------------------------------------------- */
    const payload = await req.json() as Record<string, unknown>;

    const newError = (payload.record ?? payload.new) as ErrorPayload;

    if (!newError?.project_id || !newError?.message) {
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    /* Project & user lookup ----------------------------------------- */
    // Fetch project details first
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from("projects")
      .select(`user_id, name, last_notified_at`)
      .eq("id", newError.project_id)
      .single();

    // Log project query result
    if (projectError) {
      console.error("[send-error-notification] Error fetching project:", projectError.message);
      return new Response(
        JSON.stringify({ error: "Failed to fetch project details", details: projectError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!projectData) {
      console.warn("[send-error-notification] Project not found for ID:", newError.project_id);
      return new Response(
        JSON.stringify({ message: "Project details not found, skipping notification." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }, // Not a server error
      );
    }

    // Store the user ID from the project table (this should be the public.users.id)
    const projectUserId = projectData.user_id;

    // === Fetch User Preference ===
    console.log(`[send-error-notification] Fetching profile for user ID: ${projectUserId}`);
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users") // Target the 'users' table
      .select(`phone_notifications_enabled`)
      .eq("id", projectUserId) // Match the user ID (assuming users.id is the PK referenced by projects.user_id)
      .maybeSingle();

    if (userError) {
      console.error(`[send-error-notification] Error fetching user data for user ID ${projectUserId}:`, userError.message);
      // Decide if this should be a fatal error or just skip notification
      return new Response(
        JSON.stringify({ message: "User data lookup failed, skipping notification.", details: userError.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check if notifications are disabled for this user
    if (!userData?.phone_notifications_enabled) {
      console.log(`[send-error-notification] Phone notifications disabled for user ID: ${projectUserId}. Skipping notification.`);
      return new Response(
        JSON.stringify({ message: "User has phone notifications disabled." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    // === End of User Preference Check ===

    // === Replace User Query with Phone Number Query ===
    console.log(`[send-error-notification] Fetching primary phone number for user ID: ${projectUserId}`);
    const { data: phoneData, error: phoneError } = await supabaseAdmin
      .from("phone_numbers") // Query the new table
      .select(`phone_number`) // Select the number column
      .eq("user_id", projectUserId) // Match the user ID from the project
      .eq("is_primary", true) // Find the primary number
      .maybeSingle(); // Use maybeSingle as a user might not have a primary number yet
    
    if (phoneError) {
      console.error(`[send-error-notification] Error fetching primary phone number for user ID ${projectUserId}:`, phoneError.message);
      return new Response(
        JSON.stringify({ message: "Primary phone number lookup failed, skipping notification.", details: phoneError.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    
    // Get the phone number from the result
    const userPhoneNumber = phoneData?.phone_number; // Will be null if no primary number found
    // === End of Query Replacement ===
    
    const lastNotifiedAt  = projectData.last_notified_at;
    const projectName     = projectData.name;

    if (!userPhoneNumber) {
      console.warn(`[send-error-notification] No primary phone number configured for user ID: ${projectUserId}. Skipping notification.`);
      return new Response(
        JSON.stringify({ message: "No primary phone number configured for user." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    /* Rate‑limit ----------------------------------------------------- */
    if (lastNotifiedAt &&
        Date.now() - new Date(lastNotifiedAt).getTime() < RATE_LIMIT_MS) {
      console.warn(`[send-error-notification] Rate limit hit for project ${newError.project_id}. Last notified: ${lastNotifiedAt}`);
      return new Response(
        JSON.stringify({ message: "Rate limit hit, notification skipped." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    /* Twilio setup --------------------------------------------------- */
    const accountSid        = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken         = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error('[send-error-notification] Twilio environment variables are not set.');
      return new Response(
        JSON.stringify({ error: "Twilio configuration missing server‑side." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const truncated = newError.message.slice(0, 100);
    const ellipsis  = newError.message.length > 100 ? "…" : "";
    const smsBody   =
      `Errly Alert: New error received for project "${projectName}". ` +
      `Message: ${truncated}${ellipsis}`;

    /* Send SMS using fetch ------------------------------------------ */
    const twilioApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const basicAuthHeader = `Basic ${base64Encode(`${accountSid}:${authToken}`)}`;

    // Twilio API expects form-urlencoded data
    const requestBody = new URLSearchParams({
      To: userPhoneNumber,
      From: twilioPhoneNumber,
      Body: smsBody,
    });

    try {
      const twilioResponse = await fetch(twilioApiUrl, {
        method: "POST",
        headers: {
          "Authorization": basicAuthHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: requestBody.toString(),
      });

      if (!twilioResponse.ok) {
        // Attempt to parse error details from Twilio
        let errorDetails = `Status: ${twilioResponse.status}`; 
        try {
            const errorJson = await twilioResponse.json();
            errorDetails += `, Body: ${JSON.stringify(errorJson)}`;
        } catch (_) {
            // Ignore if response body is not JSON
            errorDetails += `, Body: ${await twilioResponse.text()}`;
        }
        throw new Error(`Twilio API request failed. ${errorDetails}`);
      }

      /* Update last_notified_at ------------------------------------- */
      await supabaseAdmin
        .from("projects")
        .update({ last_notified_at: new Date().toISOString() })
        .eq("id", newError.project_id);

      return new Response(
        JSON.stringify({ message: "Notification sent successfully." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (error) {
      const err = error as Error;
      console.error("[send-error-notification] Error during Twilio fetch or subsequent processing:", err.message);
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (error) {
    const err = error as Error;
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

/* ------------------------------------------------------------------ */
/*  To invoke locally:                                                */
/*
  supabase start
  curl -i --location --request POST \
       'http://127.0.0.1:54321/functions/v1/send-error-notification' \
       --header 'Authorization: Bearer YOUR_JWT' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'
*/
/* ------------------------------------------------------------------ */