import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import logoImage from "@assets/Geo_Tagger_Logo_2.webp_1768827957680.jpg";

export default function Privacy() {
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

        <h1 className="text-3xl font-bold mb-8" data-testid="text-title">Privacy Policy</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Overview</h2>
            <p className="text-muted-foreground">
              GeoTagger is committed to protecting your privacy. This Privacy Policy explains how we handle your data when you use our free geotagging tool.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Data We Collect</h2>
            <p className="text-muted-foreground">
              <strong>We do not collect any personal data.</strong> GeoTagger operates entirely in your browser. Your photos are never uploaded to any server. All image processing, including reading and writing GPS coordinates, happens locally on your device.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">How It Works</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>When you upload photos, they remain on your device</li>
              <li>GPS coordinates are embedded using JavaScript in your browser</li>
              <li>Downloaded files are saved directly to your device</li>
              <li>No data is transmitted to external servers</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Third-Party Services</h2>
            <p className="text-muted-foreground">
              We use OpenStreetMap for displaying maps and Nominatim for location search. These services may log IP addresses according to their own privacy policies. No photo data is ever sent to these services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Contact</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy, please contact us through our website.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
