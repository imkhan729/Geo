import { useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import logoImage from "@assets/Geo_Tagger_Logo_2.webp-removebg-preview_1768829275162.png";
import { updatePageSEO, SEO_CONFIG } from "@/lib/seo";

export default function Cookies() {
  useEffect(() => {
    updatePageSEO(SEO_CONFIG.cookies);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <Link href="/" className="hover:opacity-80" data-testid="link-logo">
            <img src={logoImage} alt="GeoTagger" className="h-[42px]" />
          </Link>
          <ThemeToggle data-testid="button-theme" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8" data-testid="link-back">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-8" data-testid="text-title">Cookie Policy</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">What Are Cookies</h2>
            <p className="text-muted-foreground">
              Cookies are small text files stored on your device when you visit websites. They are commonly used to remember preferences and improve user experience.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Cookies We Use</h2>
            <p className="text-muted-foreground">
              GeoTagger uses minimal cookies for essential functionality only:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Theme Preference:</strong> We store your light/dark mode preference in localStorage (not a cookie) to remember your display settings</li>
              <li><strong>No Tracking Cookies:</strong> We do not use any analytics, advertising, or third-party tracking cookies</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Third-Party Services</h2>
            <p className="text-muted-foreground">
              Our map provider (OpenStreetMap) may use cookies according to their own policies. These cookies are not controlled by GeoTagger.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Managing Cookies</h2>
            <p className="text-muted-foreground">
              You can control cookies through your browser settings. Disabling cookies should not affect the core functionality of GeoTagger.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Contact</h2>
            <p className="text-muted-foreground">
              If you have questions about our cookie practices, please contact us through our website.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
