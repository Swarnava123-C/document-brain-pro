import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, textClassName, showText = true }: { className?: string; textClassName?: string; showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-primary shadow-elegant">
        <Brain className="h-5 w-5 text-white" strokeWidth={2.5} />
        <span className="absolute -inset-0.5 -z-10 rounded-xl bg-primary/40 blur-md animate-pulse-glow" />
      </div>
      {showText && (
        <div className={cn("flex flex-col leading-none", textClassName)}>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">IndustrialMind</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">AI Platform</span>
        </div>
      )}
    </div>
  );
}
