import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Sparkles, Upload, FolderOpen, Network, Wrench,
  ShieldCheck, FileBarChart, Bell, User, Settings, HelpCircle, LogOut,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";

const primary = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
  { title: "AI Copilot", url: "/app/copilot", icon: Sparkles, badge: "New" },
  { title: "Upload Center", url: "/app/upload", icon: Upload },
  { title: "Document Library", url: "/app/documents", icon: FolderOpen },
  { title: "Knowledge Graph", url: "/app/knowledge-graph", icon: Network },
];

const intelligence = [
  { title: "Maintenance", url: "/app/maintenance", icon: Wrench },
  { title: "Compliance", url: "/app/compliance", icon: ShieldCheck },
  { title: "Reports", url: "/app/reports", icon: FileBarChart },
];

const account = [
  { title: "Notifications", url: "/app/notifications", icon: Bell, badge: "3" },
  { title: "Profile", url: "/app/profile", icon: User },
  { title: "Settings", url: "/app/settings", icon: Settings },
  { title: "Help Center", url: "/app/help", icon: HelpCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const renderGroup = (label: string, items: typeof primary) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = pathname === item.url || pathname.startsWith(item.url + "/");
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={active} tooltip={collapsed ? item.title : undefined}>
                  <Link to={item.url} className="group relative">
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
                    {!collapsed && "badge" in item && item.badge && (
                      <Badge variant="secondary" className="ml-auto h-5 border-primary/20 bg-primary/10 px-1.5 text-[10px] text-primary">
                        {item.badge}
                      </Badge>
                    )}
                    {active && <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary" />}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <Link to="/app/dashboard">
          <Logo showText={!collapsed} />
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-1 px-2 py-3">
        {renderGroup("Workspace", primary)}
        {renderGroup("Intelligence", intelligence)}
        {renderGroup("Account", account)}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={collapsed ? "Sign out" : undefined}>
              <Link to="/login" className="text-muted-foreground">
                <LogOut className="h-4 w-4" />
                {!collapsed && <span>Sign out</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && (
          <div className="mt-2 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10 p-3">
            <p className="text-[11px] font-semibold text-foreground">Enterprise Trial</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">18 days remaining</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-primary/15">
              <div className="h-full w-3/5 rounded-full gradient-primary" />
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
