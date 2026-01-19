import { useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import logoImage from "@assets/Geo_Tagger_Logo_2.webp-removebg-preview_1768829275162.png";
import { updatePageSEO, SEO_CONFIG } from "@/lib/seo";

export default function Terms() {
  useEffect(() => {
    updatePageSEO(SEO_CONFIG.terms);
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

        <h1 className="text-3xl font-bold mb-8" data-testid="text-title">Terms of Service</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By using GeoTagger, you agree to these Terms of Service. If you do not agree, please do not use our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Service Description</h2>
            <p className="text-muted-foreground">
              GeoTagger is a free, browser-based tool that allows you to add GPS coordinates to your photos. The service is provided "as is" without warranties of any kind.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">User Responsibilities</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You are responsible for any photos you upload and geotag</li>
              <li>Do not use this tool for illegal purposes</li>
              <li>Ensure you have rights to modify the photos you upload</li>
              <li>Be aware that adding location data to photos may have privacy implications</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Limitation of Liability</h2>
            <p className="text-muted-foreground">
              GeoTagger is provided free of charge. We are not liable for any damages resulting from the use of this service, including but not limited to data loss, corrupted files, or privacy breaches.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may update these terms at any time. Continued use of the service constitutes acceptance of any changes.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
