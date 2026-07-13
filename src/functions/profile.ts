import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getProfileFn = createServerFn({ method: "POST" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    if (!userId) throw new Error("Unauthorized");

    // Get profile from profiles table
    let { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!profile) {
      // Auto-insert default profile if none exists
      const defaultProfile = {
        id: userId,
        full_name: "Engineer",
        email: "engineer@industrialmind.ai",
        avatar_url: "",
        role: "Reliability Lead",
        department: "Operations & Reliability",
        company: "IndustrialMind AI",
        designation: "Principal Asset Lead",
        phone: "+91 98200 34521",
        location: "Vadodara Refinery, IN",
      };
      await supabaseAdmin.from("profiles").insert(defaultProfile);
      profile = defaultProfile as any;
    }

    // Get counts for stats
    const { count: docCount } = await supabaseAdmin
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: copilotCount } = await supabaseAdmin
      .from("copilot_conversations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: maintenanceCount } = await supabaseAdmin
      .from("maintenance_records")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: complianceCount } = await supabaseAdmin
      .from("compliance_reports")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    return {
      profile: profile || {},
      counts: {
        documents: docCount || 0,
        conversations: copilotCount || 0,
        maintenance: maintenanceCount || 0,
        compliance: complianceCount || 0,
      },
    };
  });

export const updateProfileFn = createServerFn({ method: "POST" })
  .validator((data: {
    userId: string;
    full_name?: string;
    email?: string;
    role?: string;
    department?: string;
    company?: string;
    designation?: string;
    phone?: string;
    location?: string;
    avatar_url?: string;
  }) => data)
  .handler(async ({ data }) => {
    const { userId, ...updates } = data;
    if (!userId) throw new Error("Unauthorized");

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Also log this profile change in activity logs
    await supabaseAdmin.from("activity_logs").insert({
      user_id: userId,
      action: "Updated Profile Details",
      target_type: "Profile",
      target_id: userId,
      details: `Updated fields: ${Object.keys(updates).join(", ")}`,
    });

    return { success: true, profile };
  });

export const getActivityLogsFn = createServerFn({ method: "POST" })
  .validator((data: { userId: string; limit?: number }) => data)
  .handler(async ({ data }) => {
    const { userId, limit = 20 } = data;
    if (!userId) throw new Error("Unauthorized");

    let { data: logs } = await supabaseAdmin
      .from("activity_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!logs || logs.length === 0) {
      // Create initial activity logs if none
      const initialLogs = [
        { user_id: userId, action: "Signed in from new session", target_type: "Auth", details: "Active workspace session authenticated" },
        { user_id: userId, action: "Initialized Knowledge RAG Engine", target_type: "System", details: "PGVector similarity search active" },
        { user_id: userId, action: "Verified Compliance Standards", target_type: "Compliance", details: "ISO 55001 & OISD-116 tracking online" },
      ];
      await supabaseAdmin.from("activity_logs").insert(initialLogs);
      const { data: reloaded } = await supabaseAdmin
        .from("activity_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      logs = reloaded || [];
    }

    return logs || [];
  });
