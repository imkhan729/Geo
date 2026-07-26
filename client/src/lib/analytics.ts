/**
 * Google Analytics 4 helpers.
 *
 * The gtag.js snippet and Consent Mode v2 defaults live in client/index.html, which also
 * sends the page_view for the initial load. These helpers only cover what the static
 * snippet cannot: page_view events for client-side (wouter) route changes, and custom
 * events from the app.
 */

export const GA_MEASUREMENT_ID = "G-BWMMC6PP63";

type Gtag = (...args: unknown[]) => void;

function getGtag(): Gtag | undefined {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  return typeof gtag === "function" ? gtag : undefined;
}

/** Report a virtual pageview after a client-side route change. */
export function trackPageView(path: string) {
  getGtag()?.("event", "page_view", {
    page_path: path,
    page_title: document.title,
    page_location: window.location.href,
  });
}

/** Report a custom GA4 event. No-op when analytics has not loaded (e.g. blocked). */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  getGtag()?.("event", name, params);
}
