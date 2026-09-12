import { Switch, Route, useLocation } from "wouter";
import { useEffect, useRef, lazy, Suspense } from "react";
import { trackPageView, initWebVitalsMonitoring } from "@/lib/analytics";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { CookieConsent } from "@/components/cookie-consent";
// Home is loaded eagerly (critical path)
import Home from "@/pages/home";

// All other routes are lazy-loaded to reduce initial bundle size
const NotFound = lazy(() => import("@/pages/not-found"));
const Privacy = lazy(() => import("@/pages/privacy"));
const Terms = lazy(() => import("@/pages/terms"));
const Cookies = lazy(() => import("@/pages/cookies"));
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const GpsFinder = lazy(() => import("@/pages/gps-finder"));
const ExifViewer = lazy(() => import("@/pages/exif-viewer"));
const BlogIndex = lazy(() => import("@/pages/blog/index"));
const BlogRealEstate = lazy(() => import("@/pages/blog/how-to-geotag-photos-for-real-estate"));
const BlogExifGps = lazy(() => import("@/pages/blog/what-is-exif-gps-metadata"));
const BlogIphone = lazy(() => import("@/pages/blog/how-to-add-gps-to-iphone-photos"));
const BlogGbp = lazy(() => import("@/pages/blog/how-to-geotag-photos-for-google-business-profile"));
const BlogAndroid = lazy(() => import("@/pages/blog/how-to-geotag-photos-android"));
const BlogBestTools = lazy(() => import("@/pages/blog/best-free-photo-geotagging-tools"));
const BlogRemoveGps = lazy(() => import("@/pages/blog/how-to-remove-gps-data-from-photos"));
const BlogFixWrongGps = lazy(() => import("@/pages/blog/how-to-fix-wrong-gps-location-on-photos"));
const BlogBulkGeotag = lazy(() => import("@/pages/blog/how-to-bulk-geotag-photos"));

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  return null;
}

/**
 * Sends a GA4 page_view on every client-side route change. The initial pageview is already
 * sent by the gtag config in index.html, so the first location is skipped to avoid a double
 * count. The short delay lets the (lazily loaded) route render and set document.title first.
 */
function AnalyticsPageViews() {
  const [location] = useLocation();
  const isFirstLocation = useRef(true);

  useEffect(() => {
    if (isFirstLocation.current) {
      isFirstLocation.current = false;
      return;
    }
    const timer = window.setTimeout(() => trackPageView(location), 400);
    return () => window.clearTimeout(timer);
  }, [location]);

  return null;
}

function Router() {
  return (
    <Suspense fallback={null}>
      <ScrollToTop />
      <AnalyticsPageViews />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/cookies" component={Cookies} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/gps-finder" component={GpsFinder} />
        <Route path="/exif-viewer" component={ExifViewer} />
        <Route path="/blog" component={BlogIndex} />
        <Route path="/blog/how-to-geotag-photos-for-real-estate" component={BlogRealEstate} />
        <Route path="/blog/what-is-exif-gps-metadata" component={BlogExifGps} />
        <Route path="/blog/how-to-add-gps-to-iphone-photos" component={BlogIphone} />
        <Route path="/blog/how-to-geotag-photos-for-google-business-profile" component={BlogGbp} />
        <Route path="/blog/how-to-geotag-photos-android" component={BlogAndroid} />
        <Route path="/blog/best-free-photo-geotagging-tools" component={BlogBestTools} />
        <Route path="/blog/how-to-remove-gps-data-from-photos" component={BlogRemoveGps} />
        <Route path="/blog/how-to-fix-wrong-gps-location-on-photos" component={BlogFixWrongGps} />
        <Route path="/blog/how-to-bulk-geotag-photos" component={BlogBulkGeotag} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    initWebVitalsMonitoring();
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="geofinder-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
          <CookieConsent />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
