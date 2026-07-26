import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { updatePageSEO, injectPageSchema, SEO_CONFIG } from "@/lib/seo";

export default function About() {
  useEffect(() => {
    updatePageSEO(SEO_CONFIG.about);

    injectPageSchema("about-webpage", {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About FreeGeoTagger",
      "url": "https://freegeotagger.com/about",
      "description": SEO_CONFIG.about.description,
      "inLanguage": "en-US",
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
          { "@type": "ListItem", "position": 2, "name": "About", "item": "https://freegeotagger.com/about" }
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
          <span className="text-foreground">About</span>
        </nav>

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8" data-testid="link-back">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-8" data-testid="text-title">About FreeGeoTagger</h1>

        <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary">

          <p>
            FreeGeoTagger is a free online tool for adding, reading and correcting GPS location data in photographs. It runs entirely inside your web browser, requires no account, installs nothing, and never uploads your images to a server.
          </p>

          <h2>Why we built it</h2>

          <p>
            Adding a location to a photo is a small, ordinary task. Getting it done online was needlessly unpleasant.
          </p>

          <p>
            When we looked at the existing options, almost every one had at least one of these problems: it demanded an account before you could try it, it was free only up to some small number of files, it stamped a watermark on your work, or — most concerning — it required you to upload your personal photographs to somebody else's server for processing.
          </p>

          <p>
            That last point is the one that bothered us most. A photograph is a personal thing, and a photograph plus a precise GPS coordinate is more personal still. Handing both to a stranger's server, in order to perform an edit that only touches a few dozen bytes of metadata, is a poor trade.
          </p>

          <p>
            Modern browsers can do this work themselves. So we built a tool that does.
          </p>

          <h2>How it actually works</h2>

          <p>
            When you open a photo in FreeGeoTagger, your browser gives our JavaScript access to that file from your own disk. The code reads the file's bytes, finds the EXIF metadata block, writes the GPS latitude and longitude fields into it, and hands the result back to you as a download.
          </p>

          <p>
            Two consequences follow from that design, and both matter:
          </p>

          <ul>
            <li><strong>Your photos never leave your device.</strong> There is no upload step to skip, because there is no upload step at all. You can verify this in your browser's Network tab, or simply disconnect from the internet once the page has loaded and watch the tool keep working.</li>
            <li><strong>Your image quality is untouched.</strong> Only the metadata section changes. The pixel data is copied through byte-for-byte, so there is no re-compression and no generation loss — unlike tools that decode and re-encode your JPEG.</li>
          </ul>

          <p>
            The output is standard, spec-compliant EXIF GPS metadata, which is what Google Photos, Apple Photos, Adobe Lightroom, Windows File Explorer and GIS packages such as QGIS all read.
          </p>

          <h2>What the site offers</h2>

          <ul>
            <li><strong><Link href="/">The geotagging tool</Link></strong> — add or change GPS coordinates on JPG, PNG, WebP and HEIC files. Pin a spot on the map, search any address worldwide, or enter coordinates directly. Batch mode applies one location to many photos at once.</li>
            <li><strong><Link href="/gps-finder">GPS Finder</Link></strong> — the reverse operation. Open a photo and see whether it carries location data, and if so exactly where it was taken, plotted on a map.</li>
            <li><strong><Link href="/blog">Guides</Link></strong> — practical, specific write-ups on the questions people actually arrive with: why an iPhone photo lost its location, how to correct coordinates that point to the wrong place, how to geotag a batch of listing photos, and how to strip location data before sharing publicly.</li>
          </ul>

          <h2>Who uses it</h2>

          <p>
            The audience turned out to be broader than we expected:
          </p>

          <ul>
            <li><strong>Photographers</strong> georeferencing shoots and keeping location-organised archives.</li>
            <li><strong>Real estate agents</strong> attaching accurate coordinates to listing photos for MLS submissions.</li>
            <li><strong>Local businesses</strong> preparing images for Google Business Profile.</li>
            <li><strong>Surveyors, inspectors and field researchers</strong> who need documentation photos tied to a verified position.</li>
            <li><strong>Journalists</strong> recording and checking where an image was captured.</li>
            <li><strong>Travellers</strong> restoring locations to photos taken with location services switched off.</li>
            <li><strong>Anyone sharing photos publicly</strong> who wants to check for, and remove, an address hiding in the metadata.</li>
          </ul>

          <h2>What we will not do</h2>

          <p>
            It is worth stating the commitments plainly, because they are the reason the tool exists:
          </p>

          <ul>
            <li>We will not upload your photos to a server.</li>
            <li>We will not require an account to use the tools.</li>
            <li>We will not put a file limit or a watermark on free use.</li>
            <li>We will not sell your personal information.</li>
          </ul>

          <p>
            The site is funded by advertising, which is what lets all of the above stay true. Analytics and advertising are both consent-gated — see our <Link href="/privacy">Privacy Policy</Link> and <Link href="/cookies">Cookie Policy</Link> for exactly what is collected and by whom.
          </p>

          <h2>A note on responsible use</h2>

          <p>
            Location metadata cuts both ways. It is genuinely useful for organising and verifying photographs, and it is genuinely revealing when a photo taken at home is posted publicly. We cover both directions deliberately: how to <Link href="/">add a location</Link> when you want one, and how to <Link href="/blog/how-to-remove-gps-data-from-photos">remove it</Link> when you do not.
          </p>

          <h2>Get in touch</h2>

          <p>
            Found a bug, hit a file that will not work, or spotted a mistake in one of our guides? We would genuinely like to know. Email <a href="mailto:contact@freegeotagger.com">contact@freegeotagger.com</a> or use the <Link href="/contact">contact page</Link>.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
