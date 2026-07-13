import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Bell, CheckCheck, Trash2, Filter, AlertTriangle, ShieldAlert, Wrench, Sparkles, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { getNotificationsFn, markNotificationReadFn, markAllNotificationsReadFn, deleteNotificationFn } from "@/functions/notifications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — IndustrialMind AI" }] }),
  component: NotificationsPage,
});

const typeIcons: Record<string, any> = {
  critical: AlertTriangle,
  compliance: ShieldAlert,
  maintenance: Wrench,
  ai: Sparkles,
  info: Info,
};

const typeColors: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  compliance: "bg-warning/15 text-warning border-warning/30",
  maintenance: "bg-primary/15 text-primary border-primary/30",
  ai: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  info: "bg-muted text-muted-foreground border-border",
};

function NotificationsPage() {
  const [filter, setFilter] = useState<string>("all");
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("notifications_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      if (!userId) return [];
      return await getNotificationsFn({ data: userId });
    },
    enabled: !!userId,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error("Unauthorized");
      return await markNotificationReadFn({ data: { notificationId: id, userId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      toast.success("Marked as read");
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Unauthorized");
      return await markAllNotificationsReadFn({ data: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      toast.success("All notifications marked as read");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error("Unauthorized");
      return await deleteNotificationFn({ data: { notificationId: id, userId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      toast.success("Notification removed");
    },
  });

  const filtered = notifications.filter((n: any) => {
    if (filter === "unread") return !n.read;
    if (filter === "critical") return n.type === "critical";
    if (filter === "compliance") return n.type === "compliance";
    if (filter === "maintenance") return n.type === "maintenance";
    return true;
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <div>
      <PageHeader
        breadcrumb="Workspace"
        title="Alerts & Notifications"
        description="Live operational alerts, predictive maintenance flags, and compliance audit triggers."
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="gap-1.5"
              >
                <CheckCheck className="h-4 w-4" /> Mark all as read
              </Button>
            )}
          </div>
        }
      />
      <PageBody>
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: `All Alerts (${notifications.length})` },
              { id: "unread", label: `Unread (${unreadCount})` },
              { id: "critical", label: "Critical Risks" },
              { id: "maintenance", label: "Maintenance Flags" },
              { id: "compliance", label: "Compliance Audits" },
            ].map(f => (
              <Button
                key={f.id}
                variant={filter === f.id ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.id)}
                className={`text-xs ${filter === f.id ? "gradient-primary text-white border-0 shadow-sm" : ""}`}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="mt-4 space-y-3">
          {isLoading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Syncing live notifications...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-card/50 py-16 text-center">
              <Bell className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-base font-semibold text-foreground">No alerts match your criteria</p>
              <p className="text-xs text-muted-foreground mt-1">Your industrial pipelines are currently operating normally.</p>
            </div>
          ) : (
            filtered.map((n: any) => {
              const Icon = typeIcons[n.type] || Info;
              const badgeClass = typeColors[n.type] || typeColors.info;
              return (
                <div
                  key={n.id}
                  className={`group flex items-start justify-between gap-4 rounded-2xl border p-5 transition ${
                    n.read ? "border-border/50 bg-card/60 opacity-80" : "border-primary/30 bg-card shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${badgeClass}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`text-sm font-bold ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                        <Badge variant="outline" className={`text-[10px] uppercase font-semibold ${badgeClass}`}>
                          {n.type}
                        </Badge>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{n.description}</p>
                      <p className="mt-2 text-[11px] text-muted-foreground/80 font-mono">
                        {n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true }) : "Just now"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markReadMutation.mutate(n.id)}
                        title="Mark as read"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(n.id)}
                      title="Delete notification"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PageBody>
    </div>
  );
}
