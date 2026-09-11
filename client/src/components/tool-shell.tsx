import React from "react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface ToolShellProps {
  title: string;
  subtitle?: string;
  badge?: string;
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
  className?: string;
}

export function ToolShell({
  title,
  subtitle,
  badge,
  breadcrumbs,
  children,
  className = "",
}: ToolShellProps) {
  return (
    <main id="main-content" tabIndex={-1} className={`outline-none min-h-[calc(100vh-4rem)] ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-6 sm:py-10">
        {/* Breadcrumbs if provided */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumbs" className="mb-4">
            <ol className="flex items-center flex-wrap gap-1.5 text-xs text-muted-foreground">
              {breadcrumbs.map((item, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <li key={idx} className="flex items-center gap-1.5">
                    {idx > 0 && <ChevronRight className="h-3 w-3 opacity-60 shrink-0" aria-hidden="true" />}
                    {isLast || !item.href ? (
                      <span className="font-medium text-foreground" aria-current={isLast ? "page" : undefined}>
                        {item.label}
                      </span>
                    ) : (
                      <Link href={item.href} className="hover:text-foreground transition-colors">
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        {/* Tool Header Block */}
        <div className="mb-6 sm:mb-8 text-center max-w-3xl mx-auto">
          {badge && (
            <div className="mb-2.5 inline-flex">
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 px-3 py-0.5 text-xs font-medium">
                {badge}
              </Badge>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground font-display">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Tool Content / Workspace */}
        <div className="w-full">
          {children}
        </div>
      </div>
    </main>
  );
}
