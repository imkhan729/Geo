import { useEffect } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { updatePageSEO, injectPageSchema, SEO_CONFIG } from "@/lib/seo";
import { KeyTakeaways, BlogFigure, BlogFaq, useBlogFaqSchema } from "@/components/blog-extras";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { EclipseButton } from "@/components/ui/eclipse-button";
import { useLocation } from "wouter";

export default function BlogBulkGeotag() {
  useBlogFaqSchema("how-to-bulk-geotag-photos");
  const [, navigate] = useLocation();

  useEffect(() => {
    updatePageSEO(SEO_CONFIG.blogBulkGeotag);

    injectPageSchema("blog-bulk-geotag-article", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "How to Bulk Geotag Photos: Add GPS to Hundreds of Images at Once",
      description:
        "Batch geotagging saves hours when many photos need the same location. Learn efficient workflows for bulk-adding GPS coordinates to photos — for events, job sites, listings, and travel — free and private.",
      datePublished: "2026-07-12",
      dateModified: "2026-07-12",
      author: { "@type": "Organization", name: "FreeGeoTagger", url: "https://freegeotagger.com" },
      publisher: {
        "@type": "Organization",
        name: "FreeGeoTagger",
        url: "https://freegeotagger.com",
        logo: { "@type": "ImageObject", url: "https://freegeotagger.com/favicon.png" },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": "https://freegeotagger.com/blog/how-to-bulk-geotag-photos",
      },
      inLanguage: "en-US",
    });

    injectPageSchema("blog-bulk-geotag-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://freegeotagger.com/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://freegeotagger.com/blog" },
        {
          "@type": "ListItem",
          position: 3,
          name: "How to Bulk Geotag Photos",
          item: "https://freegeotagger.com/blog/how-to-bulk-geotag-photos",
        },
      ],
    });

}, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main id="main-content" tabIndex={-1} className="outline-none flex-1">
        <div className="container mx-auto px-4 max-w-3xl py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-foreground">Bulk Geotag Photos</span>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium bg-sky-500/10 text-sky-700 dark:text-sky-400 px-2.5 py-1 rounded-full">Workflow</span>
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl leading-tight tracking-tight mb-4">
              How to Bulk Geotag Photos: Add GPS to Hundreds of Images at Once
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-5">
              Geotagging one photo takes seconds. Geotagging three hundred, one at a time, takes an afternoon. This guide covers efficient batch workflows for events, job sites, property shoots, and travel archives — free, private, and without installing anything.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-b border-border py-3">
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> July 12, 2026</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 6 min read</span>
              <span className="text-muted-foreground/60">By FreeGeoTagger</span>
            </div>
          </header>

          {/* Article */}
          <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl">

            <p>
              Most geotagging jobs are not single photos. A wedding shoot produces hundreds of frames at one venue. A construction progress report documents one site across fifty images. A property listing carries twenty photos of one address. In every one of these cases the photos share a single correct location — which means the work should be done once, not once per file.
            </p>

            <BlogFigure slug="how-to-bulk-geotag-photos" />

            <KeyTakeaways slug="how-to-bulk-geotag-photos" />

            <p>
              That is what batch geotagging is for: set the coordinates one time and write them into every file in the group. Done right, tagging 300 photos takes barely longer than tagging 3.
            </p>

            <h2>When Bulk Geotagging Makes Sense</h2>

            <ul>
              <li><strong>Real estate shoots:</strong> every photo of a listing belongs to one address. Batch-tagging the full set keeps MLS records consistent — our <Link href="/blog/how-to-geotag-photos-for-real-estate">real estate guide</Link> covers the details.</li>
              <li><strong>Business photo libraries:</strong> photos destined for a Google Business Profile should carry the business's coordinates. Tag each location's set in one pass — see the <Link href="/blog/how-to-geotag-photos-for-google-business-profile">Google Business Profile guide</Link>.</li>
              <li><strong>Events:</strong> weddings, conferences, and festivals happen at one venue. One batch, one pin.</li>
              <li><strong>Field and site documentation:</strong> inspections, surveys, and construction progress photos need consistent, verifiable coordinates for reporting.</li>
              <li><strong>Travel archive repair:</strong> photos that lost GPS in transit — WhatsApp transfers, social media downloads, old camera imports — can be restored city by city.</li>
              <li><strong>Scanned photo collections:</strong> digitized prints have no metadata at all. Batch-tagging by place (the family home, a holiday destination) makes decades of scans mappable.</li>
            </ul>

            <h2>Bulk Geotagging in the Browser, Step by Step</h2>

            <p>
              <Link href="/">FreeGeoTagger</Link> processes batches entirely on your device — no uploads, no account, no per-file fees. The workflow:
            </p>

            <h3>Step 1: Group photos by location</h3>
            <p>
              Before opening any tool, sort your photos into one folder per location. Capture time is usually the quickest sorting key — photos from the same place cluster together chronologically. This preparation step is what makes the rest of the process fast: each folder becomes one batch with one pin.
            </p>

            <h3>Step 2: Upload a batch</h3>
            <p>
              Drag an entire folder's photos into the upload zone, or use multi-select in the file picker (Ctrl/Cmd-click on desktop; long-press then tap on mobile). JPG, PNG, WebP, and HEIC files are all supported, and HEIC converts automatically. The files load instantly because nothing is transferred over the network.
            </p>

            <h3>Step 3: Set one location for the batch</h3>
            <p>
              Zoom into the map and click the exact spot, search the address, or paste coordinates from Google Maps. The location applies to every uploaded photo simultaneously. For precision work, zoom to street level before pinning — a click at high zoom is accurate to a few meters.
            </p>

            <h3>Step 4: Download as ZIP</h3>
            <p>
              One click downloads the entire geotagged batch as a ZIP archive, with each file's EXIF GPS fields written and pixel data untouched. Extract, spot-check a couple of files with the <Link href="/gps-finder">GPS Finder</Link>, and move on to the next folder.
            </p>

            <p>
              Repeating this loop, a multi-location archive — say, a two-week trip across five cities — takes a few minutes total: five folders, five pins, five ZIPs.
            </p>

            <h2>Browser Batch vs Desktop Software vs Command Line</h2>

            <p>
              There are three realistic approaches to bulk geotagging, and each has a legitimate use case:
            </p>

            <ul>
              <li><strong>Browser-based (FreeGeoTagger):</strong> zero install, free batch support, complete privacy since files never leave the device. Best for same-location batches of up to a few hundred photos — which covers the overwhelming majority of real jobs.</li>
              <li><strong>Desktop software (Lightroom, GeoSetter):</strong> worthwhile when you need track-log matching — syncing photo timestamps against a GPS track recorded while shooting, so each photo gets its own position along a route. Overkill for single-location batches, and batch features are often paywalled.</li>
              <li><strong>Command line (ExifTool):</strong> unbeatable for automation and very large archives — one command can tag thousands of files or apply a track log. The cost is a learning curve and no visual map to verify against. Our <Link href="/blog/best-free-photo-geotagging-tools">free geotagging tools comparison</Link> weighs all three in detail.</li>
            </ul>

            <h2>Batch Geotagging Pitfalls to Avoid</h2>

            <ul>
              <li><strong>Mixed-location batches:</strong> the classic error is uploading a whole camera roll and stamping everything with one pin. Sort first; photos from different places belong in different batches.</li>
              <li><strong>Tagging the copies you're about to publish:</strong> location data on publicly shared photos can be a privacy leak. Tag your archive originals, and strip GPS from public copies — our <Link href="/blog/how-to-remove-gps-data-from-photos">GPS removal guide</Link> explains when and how.</li>
              <li><strong>Skipping verification:</strong> after any bulk operation, check two or three random outputs with a <Link href="/gps-finder">GPS reader</Link>. Thirty seconds of spot-checking catches a wrong pin before it propagates into hundreds of files.</li>
              <li><strong>Overwriting good data:</strong> if some photos in a folder already carry correct native GPS, exclude them from the batch — rewriting their coordinates with a map pin replaces precise data with approximate data.</li>
            </ul>

            <h2>Why Local Processing Matters at Batch Scale</h2>

            <p>
              For a single photo, uploading to a cloud geotagging service is a minor privacy trade-off. For a batch, it multiplies: three hundred photos of your home, your job site, or your clients' properties sitting on someone else's server is a very different exposure. Browser-local processing sidesteps the issue entirely — the batch never exists anywhere except your own device — and it is also simply faster, since there is no upload or download time for the images themselves.
            </p>

            <h2>Conclusion</h2>

            <p>
              Bulk geotagging turns a tedious per-file chore into a few minutes of folder sorting and map clicks: group photos by place, upload each group to <Link href="/">FreeGeoTagger</Link>, pin the location once, and download the finished ZIP. No installs, no accounts, no cost, and no photos leaving your device — whether the batch is a listing's twenty photos or a summer's worth of travel.
            </p>

            <BlogFaq slug="how-to-bulk-geotag-photos" />

          </article>

          {/* Related posts */}
          <div className="mt-12 border-t border-border pt-10">
            <h2 className="font-display font-bold text-xl mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/blog/best-free-photo-geotagging-tools"
                className="group flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-snug mb-1 group-hover:text-primary transition-colors">
                    Best Free Photo Geotagging Tools in 2026
                  </p>
                  <p className="text-xs text-muted-foreground">8 min read</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-0.5" />
              </Link>
              <Link
                href="/blog/how-to-geotag-photos-for-real-estate"
                className="group flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-snug mb-1 group-hover:text-primary transition-colors">
                    How to Geotag Photos for Real Estate Listings
                  </p>
                  <p className="text-xs text-muted-foreground">6 min read</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-0.5" />
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center">
            <h3 className="font-display font-bold text-lg mb-2">Batch geotag your photos now</h3>
            <p className="text-sm text-muted-foreground mb-4">Upload a whole folder, set one pin, download the ZIP. Free and private.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <EclipseButton
                text="Bulk Geotag Free"
                leftIcon={<MapPin className="h-4 w-4" />}
                onClick={() => navigate("/")}
              />
              <EclipseButton
                text="Check Photo GPS"
                variant="outline"
                onClick={() => navigate("/gps-finder")}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
