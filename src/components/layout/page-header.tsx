import type { ReactNode } from "react";

export function PageHeader({
  title, description, actions, breadcrumb,
}: { title: string; description?: string; actions?: ReactNode; breadcrumb?: string }) {
  return (
    <div className="border-b border-border/60 bg-background/50">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
        {breadcrumb && <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{breadcrumb}</p>}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight text-foreground md:text-[28px]">{title}</h1>
            {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1600px] px-4 py-6 md:px-8 ${className || ""}`}>{children}</div>;
}
