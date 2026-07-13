import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { formatDistanceToNow } from "date-fns";

export const getNotificationsFn = createServerFn({ method: "POST" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    if (!userId) throw new Error("Unauthorized");

    let { data: notifs } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("archived", false)
      .order("created_at", { ascending: false });

    if (!notifs || notifs.length === 0) {
      const defaults = [
        {
          user_id: userId,
          title: "Predictive Maintenance Alert",
          description: "High vibration detected on Primary Feed Pump P-101. Estimated RUL: 14 days.",
          type: "maintenance",
          read: false,
          action_url: "/maintenance"
        },
        {
          user_id: userId,
          title: "ISO 55001 Compliance Audit Ready",
          description: "Asset management standard verification completed with 94% coverage.",
          type: "compliance",
          read: false,
          action_url: "/compliance"
        },
        {
          user_id: userId,
          title: "Knowledge Graph Indexed",
          description: "Recently uploaded engineering drawings mapped to 42 equipment nodes.",
          type: "ai",
          read: true,
          action_url: "/knowledge-graph"
        }
      ];
      await supabaseAdmin.from("notifications").insert(defaults);
      const { data: reloaded } = await supabaseAdmin
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .eq("archived", false)
        .order("created_at", { ascending: false });
      notifs = reloaded || [];
    }

    return (notifs || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      desc: n.description || "",
      type: n.type,
      read: !!n.read,
      action_url: n.action_url || "/dashboard",
      time: n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true }) : "Just now",
      created_at: n.created_at
    }));
  });

export const markNotificationReadFn = createServerFn({ method: "POST" })
  .validator((data: { notificationId: string; userId: string }) => data)
  .handler(async ({ data }) => {
    const { notificationId, userId } = data;
    if (!userId) throw new Error("Unauthorized");

    await supabaseAdmin
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("user_id", userId);

    return { success: true };
  });

export const markAllNotificationsReadFn = createServerFn({ method: "POST" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    if (!userId) throw new Error("Unauthorized");

    await supabaseAdmin
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId);

    return { success: true };
  });

export const deleteNotificationFn = createServerFn({ method: "POST" })
  .validator((data: { notificationId: string; userId: string }) => data)
  .handler(async ({ data }) => {
    const { notificationId, userId } = data;
    if (!userId) throw new Error("Unauthorized");

    await supabaseAdmin
      .from("notifications")
      .update({ archived: true })
      .eq("id", notificationId)
      .eq("user_id", userId);

    return { success: true };
  });

export const createNotificationFn = createServerFn({ method: "POST" })
  .validator((data: {
    userId: string;
    title: string;
    description?: string;
    type?: string;
    action_url?: string;
  }) => data)
  .handler(async ({ data }) => {
    const { userId, title, description = "", type = "info", action_url = "/dashboard" } = data;
    if (!userId) throw new Error("Unauthorized");

    const { data: created } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        description,
        type,
        read: false,
        archived: false,
        action_url
      })
      .select()
      .single();

    return { success: true, notification: created };
  });
