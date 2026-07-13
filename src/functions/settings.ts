import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getUserSettingsFn = createServerFn({ method: "POST" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    if (!userId) throw new Error("Unauthorized");

    let { data: settings } = await supabaseAdmin
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!settings) {
      const defaultSettings = {
        user_id: userId,
        theme: "system",
        language: "English (US)",
        timezone: "Asia/Kolkata (GMT +5:30)",
        notifications_email: true,
        notifications_push: true,
        dashboard_layout: {},
        security_2fa: true,
        api_keys: [
          { id: "ind_ai_prod_1", name: "Production API Key", prefix: "ind_ai_prod_a...f9", created: "2026-07-01" }
        ] as any,
        integrations: { sap: true, maximo: true, sharepoint: false, slack: true } as any,
      };
      await supabaseAdmin.from("user_settings").insert(defaultSettings);
      settings = defaultSettings as any;
    }

    return settings || {};
  });

export const updateUserSettingsFn = createServerFn({ method: "POST" })
  .validator((data: {
    userId: string;
    theme?: string;
    language?: string;
    timezone?: string;
    notifications_email?: boolean;
    notifications_push?: boolean;
    dashboard_layout?: any;
    security_2fa?: boolean;
    api_keys?: any;
    integrations?: any;
  }) => data)
  .handler(async ({ data }) => {
    const { userId, ...updates } = data;
    if (!userId) throw new Error("Unauthorized");

    // Check if exists
    const { data: existing } = await supabaseAdmin
      .from("user_settings")
      .select("id")
      .eq("user_id", userId)
      .single();

    let res;
    if (existing) {
      res = await supabaseAdmin
        .from("user_settings")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .select()
        .single();
    } else {
      res = await supabaseAdmin
        .from("user_settings")
        .insert({ user_id: userId, ...updates, updated_at: new Date().toISOString() })
        .select()
        .single();
    }

    // Log activity
    await supabaseAdmin.from("activity_logs").insert({
      user_id: userId,
      action: "Updated Workspace Settings",
      target_type: "Settings",
      target_id: userId,
      details: `Modified preferences: ${Object.keys(updates).join(", ")}`,
    });

    return { success: true, settings: res.data };
  });
