import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { updatePageSEO, injectPageSchema, SEO_CONFIG } from "@/lib/seo";

/** Keep in sync with the "Last updated" line rendered below. */
const LAST_UPDATED = "July 26, 2026";

export default function Terms() {
  useEffect(() => {
    updatePageSEO(SEO_CONFIG.terms);

    injectPageSchema('terms-webpage', {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": SEO_CONFIG.terms.title,
      "url": "https://freegeotagger.com/terms",
      "description": SEO_CONFIG.terms.description,
      "inLanguage": "en-US",
      "dateModified": "2026-07-26",
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
          { "@type": "ListItem", "position": 2, "name": "Terms of Service", "item": "https://freegeotagger.com/terms" }
        ]
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground">Terms of Service</span>
        </nav>

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8" data-testid="link-back">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-3" data-testid="text-title">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: {LAST_UPDATED}</p>

        <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary">

          <h2>Agreement to these terms</h2>

          <p>
            These terms govern your use of freegeotagger.com and the free tools offered on it, including the photo geotagging tool and the <Link href="/gps-finder">GPS Finder</Link>. By using the site you agree to these terms. If you do not agree with them, please do not use the site.
          </p>

          <p>
            We may update these terms from time to time. Changes take effect when published on this page, and the "last updated" date above will change. Continuing to use the site after an update means you accept the revised terms.
          </p>

          <h2>What the service is</h2>

          <p>
            FreeGeoTagger is a browser-based utility that writes GPS coordinates into a photo's EXIF metadata, and reads GPS coordinates back out of photos that already contain them. It runs entirely as JavaScript inside your browser. We do not receive, store or process your images on any server — see our <Link href="/privacy">Privacy Policy</Link> for the technical detail.
          </p>

          <p>
            The service is provided free of charge. There is no account, no subscription, no watermark and no file-count limit. We fund the site through advertising.
          </p>

          <h2>Acceptable use</h2>

          <p>
            You may use FreeGeoTagger for personal and commercial purposes, including professional photography, real estate listings, field research, journalism and business marketing. You agree not to:
          </p>

          <ul>
            <li>Use the service for any unlawful purpose, or in violation of any applicable law or regulation.</li>
            <li>Add false location data to photographs in order to deceive, defraud or mislead — for example falsifying the location of evidence, an insurance claim, or a property listing.</li>
            <li>Modify photographs you have no right to modify, or infringe anyone's copyright, privacy or publicity rights.</li>
            <li>Attempt to disrupt, overload, or gain unauthorised access to the site or its infrastructure.</li>
            <li>Use automated means to scrape or hammer the site in a way that degrades it for other people.</li>
          </ul>

          <p>
            Adding or removing location metadata is a normal, legitimate operation. Using it to deceive is not, and that is your responsibility rather than ours.
          </p>

          <h2>Your content and your responsibility</h2>

          <p>
            You retain all rights to your photographs. Because your files never reach us, we claim no licence over them and could not use them even if we wanted to.
          </p>

          <p>
            You are responsible for the photos you modify and for understanding the consequences of the metadata you add. In particular, be aware that <strong>embedding a precise GPS location in a photo and then sharing it publicly reveals that location</strong> — which may be your home, a child's school, or another sensitive place. If that concerns you, read our guide on <Link href="/blog/how-to-remove-gps-data-from-photos">removing GPS data from photos</Link> before sharing.
          </p>

          <h2>Accuracy and verification</h2>

          <p>
            The tool is designed to write standard, spec-compliant EXIF GPS metadata that is read correctly by Google Photos, Apple Photos, Adobe Lightroom, Windows File Explorer and common GIS software. Even so, metadata support varies between applications and file formats, and results can differ.
          </p>

          <p>
            <strong>You are responsible for verifying results before relying on them</strong>, especially for professional, legal, insurance or compliance purposes. You can check what was written using our <Link href="/gps-finder">GPS Finder</Link>. We recommend keeping an unmodified original of any important photograph.
          </p>

          <h2>No warranty</h2>

          <p>
            The service is provided "as is" and "as available", without warranties of any kind, whether express or implied, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the service will be uninterrupted, error-free, or compatible with every device, browser or file format, nor that any defect will be corrected.
          </p>

          <h2>Limitation of liability</h2>

          <p>
            To the maximum extent permitted by law, FreeGeoTagger is not liable for any indirect, incidental, special, consequential or punitive damages, nor for any loss of data, loss of profits, corrupted files, or loss of business arising from your use of or inability to use the service — even if we have been advised of the possibility of such damages.
          </p>

          <p>
            Because the service is free, our total aggregate liability to you for any claim relating to it is limited to zero. Some jurisdictions do not allow certain exclusions of liability, so parts of this section may not apply to you.
          </p>

          <h2>Third-party services</h2>

          <p>
            The site displays map tiles from OpenStreetMap, resolves address searches through Nominatim, and serves advertising through Google AdSense. These are operated by third parties under their own terms and privacy policies, and we are not responsible for their content, availability or practices.
          </p>

          <h2>Intellectual property</h2>

          <p>
            The FreeGeoTagger name, site design, written guides and original content are our intellectual property. You may link to our pages and quote briefly with attribution, but you may not republish our articles wholesale or present them as your own. All third-party trademarks mentioned on the site — including Google, Apple, Adobe and Android — belong to their respective owners, and we are not affiliated with or endorsed by them.
          </p>

          <h2>Availability and changes to the service</h2>

          <p>
            We may modify, suspend or discontinue any part of the service at any time without notice. We may also restrict access to anyone who abuses the service or breaches these terms.
          </p>

          <h2>Severability and entire agreement</h2>

          <p>
            If any provision of these terms is found unenforceable, the remaining provisions stay in full effect. Our failure to enforce a provision is not a waiver of it. These terms, together with our <Link href="/privacy">Privacy Policy</Link> and <Link href="/cookies">Cookie Policy</Link>, form the entire agreement between you and us regarding the service.
          </p>

          <h2>Contact</h2>

          <p>
            Questions about these terms: <a href="mailto:contact@freegeotagger.com">contact@freegeotagger.com</a>. Please include the page URL your question relates to. You can also reach us through our <Link href="/contact">contact page</Link>.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
