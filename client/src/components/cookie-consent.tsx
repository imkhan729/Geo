import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "fgt-cookie-consent";

type Consent = "accepted" | "declined";

function updateConsentMode(consent: Consent) {
  const granted = consent === "accepted" ? "granted" : "denied";
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === "function") {
    gtag("consent", "update", {
      ad_storage: granted,
      ad_user_data: granted,
      ad_personalization: granted,
      analytics_storage: granted,
    });
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage blocked — show the notice so the user can still choose.
      setVisible(true);
    }
  }, []);

  const choose = (consent: Consent) => {
    try {
      localStorage.setItem(STORAGE_KEY, consent);
    } catch {
      /* ignore write failure */
    }
    updateConsentMode(consent);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4"
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
    >
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background/98 backdrop-blur-md p-4 shadow-lg sm:flex-row sm:items-center sm:gap-6 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Cookie className="h-4 w-4 text-primary" />
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We use cookies for analytics and to show ads that keep FreeGeoTagger free. Your
              photos are always processed privately in your browser and are never uploaded. See
              our{" "}
              <Link href="/cookies" className="text-primary underline-offset-2 hover:underline">
                Cookie Policy
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-shrink-0 gap-2 sm:ml-auto">
            <button
              type="button"
              onClick={() => choose("declined")}
              className="flex-1 min-h-[44px] inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground sm:flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="button-cookie-decline"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => choose("accepted")}
              className="flex-1 min-h-[44px] inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-primary px-5 py-2 text-sm font-semibold font-display text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="button-cookie-accept"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
