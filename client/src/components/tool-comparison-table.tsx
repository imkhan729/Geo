import React from "react";
import { Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface ComparisonRow {
  feature: string;
  freeGeoTagger: boolean | string;
  desktopTools: boolean | string;
  cloudTools: boolean | string;
}

const defaultRows: ComparisonRow[] = [
  { feature: "100% Free Forever", freeGeoTagger: true, desktopTools: "Paid / Freely limited", cloudTools: "Subscription / Credits" },
  { feature: "No File Uploads (Browser-Local)", freeGeoTagger: true, desktopTools: true, cloudTools: false },
  { feature: "No Account or Signup Required", freeGeoTagger: true, desktopTools: true, cloudTools: false },
  { feature: "Works on Any Device (Mobile/Desktop)", freeGeoTagger: true, desktopTools: false, cloudTools: true },
  { feature: "Batch Photo Geotagging", freeGeoTagger: true, desktopTools: true, cloudTools: "Often paywalled" },
  { feature: "Zero Quality Loss (Metadata Only)", freeGeoTagger: true, desktopTools: true, cloudTools: "Often re-compressed" },
  { feature: "Verified GPS Re-Read", freeGeoTagger: true, desktopTools: "Manual", cloudTools: "Varies" },
];

function CellValue({ value, isHighlighted = false }: { value: boolean | string; isHighlighted?: boolean }) {
  if (value === true) {
    return (
      <span className={`inline-flex items-center gap-1 font-semibold ${isHighlighted ? "text-primary" : "text-foreground"}`}>
        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
        <span className="sr-only">Supported</span>
        Yes
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <X className="h-4 w-4 text-red-500 shrink-0" aria-hidden="true" />
        <span className="sr-only">Not supported</span>
        No
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">{value}</span>;
}

export function ToolComparisonTable({
  rows = defaultRows,
  caption = "Comparison of FreeGeoTagger with alternative desktop and cloud geotagging solutions",
}: {
  rows?: ComparisonRow[];
  caption?: string;
}) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm rounded-xl">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[500px]">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="py-3.5 px-4 sm:px-6">Feature</th>
                <th scope="col" className="py-3.5 px-4 text-primary bg-primary/5 font-bold">FreeGeoTagger</th>
                <th scope="col" className="py-3.5 px-4 text-muted-foreground">Desktop Software</th>
                <th scope="col" className="py-3.5 px-4 text-muted-foreground">Cloud Tools</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-muted/20 transition-colors">
                  <th scope="row" className="py-3 px-4 sm:px-6 font-medium text-foreground text-xs sm:text-sm">
                    {row.feature}
                  </th>
                  <td className="py-3 px-4 bg-primary/5 font-medium">
                    <CellValue value={row.freeGeoTagger} isHighlighted={true} />
                  </td>
                  <td className="py-3 px-4">
                    <CellValue value={row.desktopTools} />
                  </td>
                  <td className="py-3 px-4">
                    <CellValue value={row.cloudTools} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
