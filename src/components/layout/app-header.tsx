import { Link } from "@tanstack/react-router";
import { Search, Bell, Moon, Sun, Upload, Command } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";

export function AppHeader() {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <SidebarTrigger className="shrink-0" />
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search assets, documents, SOPs, incidents…"
          className="h-10 border-border/60 bg-muted/40 pl-9 pr-16 text-sm shadow-none focus-visible:ring-1"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-border/70 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:inline-flex">
          <Command className="h-3 w-3" /> K
        </kbd>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button asChild size="sm" className="hidden gradient-primary text-white shadow-elegant hover:opacity-95 sm:inline-flex">
          <Link to="/app/upload"><Upload className="h-4 w-4" /> Quick Upload</Link>
        </Button>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button asChild variant="ghost" size="icon" className="relative">
          <Link to="/app/notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 py-1 pl-1 pr-3 transition hover:bg-muted">
              <Avatar className="h-7 w-7">
                <AvatarImage src="" />
                <AvatarFallback className="gradient-primary text-[11px] font-semibold text-white">RI</AvatarFallback>
              </Avatar>
              <div className="hidden text-left leading-tight lg:block">
                <p className="text-[12px] font-medium text-foreground">Rohan Iyer</p>
                <p className="text-[10px] text-muted-foreground">Reliability Lead</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Rohan Iyer</span>
                <span className="text-xs text-muted-foreground">rohan.iyer@northgrid.io</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link to="/app/profile">Profile</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/app/settings">Settings</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/app/help">Help center</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link to="/login" className="text-destructive">Sign out</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
