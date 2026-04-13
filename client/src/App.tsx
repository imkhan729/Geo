import { Switch, Route, useLocation } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
// Home is loaded eagerly (critical path)
import Home from "@/pages/home";
import FluidCursorEffect from "@/components/ui/smokey-cursor-effect";

// All other routes are lazy-loaded to reduce initial bundle size
const NotFound = lazy(() => import("@/pages/not-found"));
const Privacy = lazy(() => import("@/pages/privacy"));
const Terms = lazy(() => import("@/pages/terms"));
const Cookies = lazy(() => import("@/pages/cookies"));
const GpsFinder = lazy(() => import("@/pages/gps-finder"));
const BlogIndex = lazy(() => import("@/pages/blog/index"));
const BlogRealEstate = lazy(() => import("@/pages/blog/how-to-geotag-photos-for-real-estate"));
const BlogExifGps = lazy(() => import("@/pages/blog/what-is-exif-gps-metadata"));
const BlogIphone = lazy(() => import("@/pages/blog/how-to-add-gps-to-iphone-photos"));
const BlogGbp = lazy(() => import("@/pages/blog/how-to-geotag-photos-for-google-business-profile"));
const BlogAndroid = lazy(() => import("@/pages/blog/how-to-geotag-photos-android"));
const BlogBestTools = lazy(() => import("@/pages/blog/best-free-photo-geotagging-tools"));

function Router() {
  return (
    <Suspense fallback={null}>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/cookies" component={Cookies} />
        <Route path="/gps-finder" component={GpsFinder} />
        <Route path="/blog" component={BlogIndex} />
        <Route path="/blog/how-to-geotag-photos-for-real-estate" component={BlogRealEstate} />
        <Route path="/blog/what-is-exif-gps-metadata" component={BlogExifGps} />
        <Route path="/blog/how-to-add-gps-to-iphone-photos" component={BlogIphone} />
        <Route path="/blog/how-to-geotag-photos-for-google-business-profile" component={BlogGbp} />
        <Route path="/blog/how-to-geotag-photos-android" component={BlogAndroid} />
        <Route path="/blog/best-free-photo-geotagging-tools" component={BlogBestTools} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="geofinder-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <FluidCursorEffect />
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
