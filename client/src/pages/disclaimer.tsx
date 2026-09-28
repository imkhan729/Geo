import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { updatePageSEO, injectPageSchema, SEO_CONFIG } from "@/lib/seo";

/** Keep in sync with the "Last updated" line rendered below. */
const LAST_UPDATED = "September 28, 2026";

export default function Disclaimer() {
  useEffect(() => {
    updatePageSEO(SEO_CONFIG.disclaimer);

    injectPageSchema('disclaimer-webpage', {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": SEO_CONFIG.disclaimer.title,
      "url": "https://freegeotagger.com/disclaimer",
      "description": SEO_CONFIG.disclaimer.description,
      "inLanguage": "en-US",
      "dateModified": "2026-09-28",
      "isPartOf": { "@type": "WebSite", "name": "FreeGeoTagger", "url": "https://freegeotagger.com" },
      "publisher": {
        "@type": "Organization",
        "name": "FreeGeoTagger",
        "url": "https://freegeotagger.com",
        "logo": { "@type": "ImageObject", "url": "https://freegeotagger.com/favicon.png" }
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://freegeotagger.com/" },
          { "@type": "ListItem", "position": 2, "name": "Disclaimer", "item": "https://freegeotagger.com/disclaimer" }
        ]
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main id="main-content" tabIndex={-1} className="outline-none container mx-auto px-4 py-12 max-w-3xl">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground">Disclaimer</span>
        </nav>

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8" data-testid="link-back">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-3" data-testid="text-title">Disclaimer</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: {LAST_UPDATED}</p>

        <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary">

          <h2>General information only</h2>

          <p>
            Everything on freegeotagger.com — the tools, the blog guides, and the help articles — is provided for
            general informational purposes only. It is not professional advice. We do not provide legal, surveying,
            mapping, or forensic advice, and nothing on this site should be treated as a substitute for it.
          </p>

          <h2>GPS coordinates are editable and not proof of location</h2>

          <p>
            EXIF GPS metadata is plain text inside an image file. It can be added, changed, or removed by anyone —
            including with our own tools. A geotag is <strong>not</strong> proof that a photo was taken at a
            particular place or time, and geotagged photos should not be relied on as legal evidence of attendance,
            delivery, or presence at a location.
          </p>

          <p>
            Similarly, removing GPS data with our <Link href="/remove-gps-from-photo">Remove GPS</Link> tool deletes
            the coordinates stored in the file, but copies of the photo shared earlier, thumbnails, or sidecar files
            may still carry location information elsewhere.
          </p>

          <h2>No guarantee of search-ranking effects</h2>

          <p>
            Some of our guides discuss adding GPS metadata to photos for local SEO or real-estate listings. We do
            not promise that embedding EXIF GPS tags will improve Google rankings, Google Business Profile
            visibility, or any other search outcome. Search engines use hundreds of signals; photo metadata is, at
            most, a minor one.
          </p>

          <h2>Tool comparisons and reviews are editorial opinion</h2>

          <p>
            Where we compare FreeGeoTagger with third-party software (for example in our guide to the
            best free photo geotagging tools), the assessments reflect our editorial opinion based on the features,
            platforms, and pricing we observed at the time of writing. Software changes quickly — interfaces,
            prices, and capabilities may differ by the time you read the article. We may be biased toward our own
            tool; we disclose that plainly here.
          </p>

          <h2>Accuracy of coordinates</h2>

          <p>
            The coordinates you enter or that our <Link href="/gps-finder">GPS Finder</Link> suggests depend on the
            accuracy of your input, your device's location services, and the map data provided by third parties
            (OpenStreetMap contributors and related tile providers). We do not warrant that any coordinate is
            precise, current, or suitable for navigation, surveying, emergency use, or any safety-critical purpose.
          </p>

          <h2>External links</h2>

          <p>
            This site links to third-party websites and services (camera manufacturers, software vendors, map data
            providers). We have no control over their content, privacy practices, or availability, and linking to
            them does not imply endorsement.
          </p>

          <h2>Changes to this disclaimer</h2>

          <p>
            We may update this disclaimer from time to time. Changes take effect when published on this page, and
            the "last updated" date above will change. If you have questions about this disclaimer, please see our{" "}
            <Link href="/contact">Contact</Link> page.
          </p>

        </article>
      </main>

      <Footer />
    </div>
  );
}
