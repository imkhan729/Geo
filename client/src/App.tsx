import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import Cookies from "@/pages/cookies";
import GpsFinder from "@/pages/gps-finder";
import BlogIndex from "@/pages/blog/index";
import BlogRealEstate from "@/pages/blog/how-to-geotag-photos-for-real-estate";
import BlogExifGps from "@/pages/blog/what-is-exif-gps-metadata";
import BlogIphone from "@/pages/blog/how-to-add-gps-to-iphone-photos";
import FluidCursorEffect from "@/components/ui/smokey-cursor-effect";

function Router() {
  return (
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
      <Route component={NotFound} />
    </Switch>
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
