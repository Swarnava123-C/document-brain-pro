import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Bell, Moon, Sun, Upload, Command, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useClerk } from "@clerk/clerk-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { CommandModal } from "@/components/layout/command-modal";

export function AppHeader() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const { signOut: clerkSignOut } = useClerk();
  const navigate = useNavigate();
  const [commandOpen, setCommandOpen] = useState(false);

  const email = (user as any)?.primaryEmailAddress?.emailAddress ?? (user as any)?.email ?? "swarnava@industrialmind.ai";
  const fullName = (user as any)?.fullName ?? (user as any)?.user_metadata?.full_name ?? email.split("@")[0] ?? "Signed in";
  const initials = fullName.split(/\s+/).map((s: string) => s[0]).slice(0, 2).join("").toUpperCase() || "U";

  async function signOut() {
    try {
      await clerkSignOut();
    } catch (e) {
      console.error(e);
    }
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/login", replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <CommandModal open={commandOpen} onOpenChange={setCommandOpen} />
      <SidebarTrigger className="shrink-0" aria-label="Toggle sidebar" />
      <div className="relative hidden max-w-md flex-1 md:block">
        <label htmlFor="global-search" className="sr-only">Search workspace</label>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden="true" />
        <Input
          id="global-search"
          readOnly
          onClick={() => setCommandOpen(true)}
          onFocus={() => setCommandOpen(true)}
          placeholder="Search assets, documents, SOPs, incidents…"
          className="h-10 border-border/60 bg-muted/40 pl-9 pr-16 text-sm shadow-none focus-visible:ring-1 cursor-pointer"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-border/70 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:inline-flex">
          <Command className="h-3 w-3" /> K
        </kbd>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button asChild size="sm" className="hidden gradient-primary text-white shadow-elegant hover:opacity-95 sm:inline-flex">
          <Link to="/upload"><Upload className="h-4 w-4" aria-hidden="true" /> Quick Upload</Link>
        </Button>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
          {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
        </Button>
        <Button asChild variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Link to="/notifications">
            <Bell className="h-4 w-4" aria-hidden="true" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" aria-hidden="true" />
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 py-1 pl-1 pr-3 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" aria-label="Account menu">
              <Avatar className="h-7 w-7">
                <AvatarImage src="" alt="" />
                <AvatarFallback className="gradient-primary text-[11px] font-semibold text-white">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left leading-tight lg:block">
                <p className="text-[12px] font-medium text-foreground">{fullName}</p>
                <p className="text-[10px] text-muted-foreground">Engineer</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{fullName}</span>
                <span className="text-xs text-muted-foreground">{email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link to="/profile">Profile</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/settings">Settings</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/help">Help center</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
