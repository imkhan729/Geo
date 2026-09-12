import { useEffect } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { updatePageSEO } from "@/lib/seo";
import { MapPin, Search, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  useEffect(() => {
    updatePageSEO({
      title: "Page Not Found | FreeGeoTagger",
      description: "The requested page does not exist on FreeGeoTagger. Return to the home tool to add GPS to photos, or explore our free guides.",
      robots: "noindex, follow",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main id="main-content" tabIndex={-1} className="outline-none flex-1 container mx-auto px-4 py-16 max-w-3xl flex flex-col items-center text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-6 ring-8 ring-primary/5">
          <MapPin className="h-10 w-10 animate-pulse" />
        </div>

        <span className="text-sm font-semibold tracking-wide uppercase text-primary mb-2">404 Error</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
          Page Not Found
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
          The link you followed may be broken or the page may have been moved. Everything you need for private photo geotagging is available right here:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-10 text-left">
          <Link href="/" className="block group">
            <Card className="h-full border border-border/80 hover:border-primary/50 transition-all shadow-sm hover:shadow-md group-hover:-translate-y-0.5">
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <MapPin className="h-5 w-5" />
                </div>
                <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors text-base mb-1">
                  Geotag Photos
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Add GPS coordinates to JPG, PNG, WebP, and HEIC photos free in your browser.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/gps-finder" className="block group">
            <Card className="h-full border border-border/80 hover:border-primary/50 transition-all shadow-sm hover:shadow-md group-hover:-translate-y-0.5">
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Search className="h-5 w-5" />
                </div>
                <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors text-base mb-1">
                  GPS Finder
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Extract embedded EXIF coordinates from existing photos and see them on a map.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/blog" className="block group">
            <Card className="h-full border border-border/80 hover:border-primary/50 transition-all shadow-sm hover:shadow-md group-hover:-translate-y-0.5">
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors text-base mb-1">
                  Geotagging Guides
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Read tutorials on iPhone, Android, Google Business, and real estate photo geotagging.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Link href="/">
          <Button size="lg" className="gap-2 font-semibold">
            <ArrowLeft className="h-4 w-4" /> Return to Homepage
          </Button>
        </Link>
      </main>
      <Footer />
    </div>
  );
}
