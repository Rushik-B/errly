/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3?dts";
import { corsHeaders } from "../_shared/cors.ts";
import { Twilio } from "https://esm.sh/twilio@4.20.1?dts";

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

const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

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
    const { data: projectDetails, error: fetchError } = await supabaseAdmin
      .from("projects")
      .select(`
        user_id,
        name,
        last_notified_at,
        users ( phone_number )
      `)
      .eq("id", newError.project_id)
      .single<ProjectUserDetails>();

    if (fetchError || !projectDetails) {
      return new Response(
        JSON.stringify({ message: "Project details not found, skipping notification." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userPhoneNumber = projectDetails.users?.phone_number;
    const lastNotifiedAt  = projectDetails.projects.last_notified_at;
    const projectName     = projectDetails.projects.name;

    if (!userPhoneNumber) {
      return new Response(
        JSON.stringify({ message: "No phone number configured for user." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    /* Rate‑limit ----------------------------------------------------- */
    if (lastNotifiedAt &&
        Date.now() - new Date(lastNotifiedAt).getTime() < RATE_LIMIT_MS) {
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
      return new Response(
        JSON.stringify({ error: "Twilio configuration missing server‑side." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const twilioClient = new Twilio(accountSid, authToken);

    const truncated = newError.message.slice(0, 100);
    const ellipsis  = newError.message.length > 100 ? "…" : "";
    const smsBody   =
      `Errly Alert: New error received for project "${projectName}". ` +
      `Message: ${truncated}${ellipsis}`;

    /* Send SMS ------------------------------------------------------- */
    try {
      await twilioClient.messages.create({
        body: smsBody,
        from: twilioPhoneNumber,
        to:   userPhoneNumber,
      });

      /* Update last_notified_at ------------------------------------- */
      await supabaseAdmin
        .from("projects")
        .update({ last_notified_at: new Date().toISOString() })
        .eq("id", newError.project_id);

      return new Response(
        JSON.stringify({ message: "Notification sent successfully." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (twilioError) {
      const err = twilioError as Error;
      return new Response(
        JSON.stringify({
          error:   "Failed to send notification via Twilio.",
          details: err.message,
        }),
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