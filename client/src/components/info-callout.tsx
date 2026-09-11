import React from "react";
import { Info, AlertTriangle, CheckCircle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalloutVariant = "info" | "warning" | "success" | "privacy";

interface InfoCalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<CalloutVariant, { container: string; icon: typeof Info; iconColor: string; role: string }> = {
  info: {
    container: "bg-muted/50 border-border/80 text-foreground",
    icon: Info,
    iconColor: "text-primary",
    role: "status",
  },
  warning: {
    container: "bg-amber-500/10 border-amber-500/30 text-foreground",
    icon: AlertTriangle,
    iconColor: "text-amber-600 dark:text-amber-400",
    role: "alert",
  },
  success: {
    container: "bg-emerald-500/10 border-emerald-500/30 text-foreground",
    icon: CheckCircle,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    role: "status",
  },
  privacy: {
    container: "bg-primary/5 border-primary/20 text-foreground",
    icon: ShieldCheck,
    iconColor: "text-primary",
    role: "note",
  },
};

export function InfoCallout({
  variant = "info",
  title,
  children,
  className,
}: InfoCalloutProps) {
  const config = variantStyles[variant];
  const IconComponent = config.icon;

  return (
    <aside
      role={config.role}
      className={cn(
        "rounded-xl border p-4 text-sm leading-relaxed flex items-start gap-3 transition-colors",
        config.container,
        className
      )}
    >
      <IconComponent className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconColor)} aria-hidden="true" />
      <div className="flex-1 space-y-1">
        {title && <p className="font-semibold text-foreground tracking-tight">{title}</p>}
        <div className="text-muted-foreground [&_p]:leading-relaxed">{children}</div>
      </div>
    </aside>
  );
}
