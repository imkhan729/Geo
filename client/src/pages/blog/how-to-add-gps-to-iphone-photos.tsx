import { useEffect } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { updatePageSEO, injectPageSchema, SEO_CONFIG } from "@/lib/seo";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { EclipseButton } from "@/components/ui/eclipse-button";
import { useLocation } from "wouter";

export default function BlogIphone() {
  const [, navigate] = useLocation();

  useEffect(() => {
    updatePageSEO(SEO_CONFIG.blogIphone);

    injectPageSchema("blog-iphone-article", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "How to Add GPS Location to iPhone Photos",
      description:
        "iPhone photo missing location data? Learn how to add GPS coordinates to iPhone photos without reinstalling apps — free, private, and works in your browser.",
      datePublished: "2026-03-22",
      dateModified: "2026-03-22",
      author: { "@type": "Organization", name: "FreeGeoTagger", url: "https://freegeotagger.com" },
      publisher: {
        "@type": "Organization",
        name: "FreeGeoTagger",
        url: "https://freegeotagger.com",
        logo: { "@type": "ImageObject", url: "https://freegeotagger.com/favicon.png" },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": "https://freegeotagger.com/blog/how-to-add-gps-to-iphone-photos" },
      inLanguage: "en-US",
    });

    injectPageSchema("blog-iphone-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://freegeotagger.com/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://freegeotagger.com/blog" },
        {
          "@type": "ListItem",
          position: 3,
          name: "How to Add GPS Location to iPhone Photos",
          item: "https://freegeotagger.com/blog/how-to-add-gps-to-iphone-photos",
        },
      ],
    });

    injectPageSchema("blog-iphone-faq", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Why do my iPhone photos not have location data?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "iPhone photos are missing location data if Location Services is disabled for the Camera app, if the photo was taken in a low-signal area, if the photo was shared via a platform that strips GPS metadata, or if it was saved from a screenshot.",
          },
        },
        {
          "@type": "Question",
          name: "How do I add GPS coordinates to iPhone photos without an app?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Use FreeGeoTagger — a free browser-based tool. Open it in Safari on your iPhone or on any desktop browser, upload your photo, pin the location on the map, and download the geotagged version. No app install required.",
          },
        },
        {
          "@type": "Question",
          name: "Does adding GPS to iPhone photos affect image quality?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. GPS coordinates are stored in the EXIF metadata section of the image file, completely separate from the pixel data. Adding or modifying GPS has zero effect on image quality.",
          },
        },
      ],
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 max-w-3xl py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-foreground">iPhone GPS Photos</span>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium bg-teal-500/10 text-teal-700 dark:text-teal-400 px-2.5 py-1 rounded-full">Mobile</span>
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl leading-tight tracking-tight mb-4">
              How to Add GPS to iPhone Photos — Free &amp; Instant
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-5">
              iPhone photo missing location data? Add GPS coordinates to any iPhone photo in seconds — free, private, no app install required. Works directly in Safari.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-b border-border py-3">
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> March 22, 2026</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 5 min read</span>
              <span className="text-muted-foreground/60">By FreeGeoTagger</span>
            </div>
          </header>

          {/* Article */}
          <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl">

            <p>
              You shot a great photo on your iPhone, only to find it shows up without a location pin in Google Photos, Apple Maps, or your photo management app. No location. No map marker. Just an image with no geographic context.
            </p>

            <p>
              This is a common problem — and it's fixable. You can add GPS coordinates to any iPhone photo retroactively, without reinstalling the Camera app or turning on location services for every app on your device. This guide explains why the GPS data is missing and exactly how to add it back.
            </p>

            <h2>Why Your iPhone Photo Is Missing Location Data</h2>

            <p>There are several common reasons an iPhone photo has no GPS metadata:</p>

            <ul>
              <li>
                <strong>Location Services disabled for Camera:</strong> If you have Settings → Privacy → Location Services → Camera set to "Never" or "Ask Next Time," the iPhone Camera app won't embed GPS into photos.
              </li>
              <li>
                <strong>Slow GPS fix:</strong> In areas with poor GPS signal — indoors, underground, or in dense urban canyons — the iPhone may take a photo before acquiring a GPS lock, resulting in no coordinates.
              </li>
              <li>
                <strong>GPS metadata stripped during sharing:</strong> When photos are shared via AirDrop from some configurations, iMessage, email, or saved from social media, GPS metadata is sometimes stripped from the file.
              </li>
              <li>
                <strong>Screenshots:</strong> Screenshots taken on iPhone never have GPS data — they're screen captures, not camera photos.
              </li>
              <li>
                <strong>Imported photos:</strong> Photos transferred from older cameras, scanners, or WhatsApp often arrive without any GPS data.
              </li>
            </ul>

            <p>
              Whatever the cause, the fix is the same: add GPS coordinates manually using a geotagging tool.
            </p>

            <h2>How to Check If Your iPhone Photo Has GPS Data</h2>

            <p>Before adding GPS, it's worth confirming the data is actually missing. There are two quick ways to check:</p>

            <h3>Method 1: Apple Photos app</h3>
            <ol>
              <li>Open the photo in the Photos app</li>
              <li>Swipe up on the photo to see the info panel</li>
              <li>If a map thumbnail appears with a location label, GPS data is present. If you see no map, no location name, and no coordinates — it's missing.</li>
            </ol>

            <h3>Method 2: FreeGeoTagger GPS Finder</h3>
            <p>
              Upload the photo to our <Link href="/gps-finder">GPS Finder tool</Link>. It will instantly tell you whether GPS data is embedded. If not, you'll see a message indicating no location was found — at which point you can use <Link href="/">FreeGeoTagger</Link> to add it.
            </p>

            <h2>How to Add GPS to iPhone Photos Using FreeGeoTagger</h2>

            <p>
              <Link href="/">FreeGeoTagger</Link> is a free, browser-based tool that works on iPhone (Safari), Android, and desktop. Your photos are never uploaded to any server — all processing happens locally in your browser.
            </p>

            <h3>Step 1: Export the photo from iPhone</h3>
            <p>
              If you're working from your iPhone directly, open the photo in Apple Photos, tap the Share button, and choose "Save to Files" or use AirDrop to transfer it to your Mac or PC. This ensures you have the original file without any additional compression.
            </p>
            <p>
              Alternatively, open Safari on your iPhone and go directly to <Link href="/">freegeotagger.com</Link> — you can upload photos directly from your iPhone's Camera Roll.
            </p>

            <h3>Step 2: Upload the photo</h3>
            <p>
              Go to <Link href="/">FreeGeoTagger</Link> and drag your photo into the upload area, or tap to browse and select from your Camera Roll. The tool supports HEIC (the native iPhone format), JPEG, PNG, and WebP.
            </p>

            <h3>Step 3: Set the location</h3>
            <p>
              The interactive map will appear. You have three options to set the location:
            </p>
            <ul>
              <li><strong>Search:</strong> Type an address, landmark, or city name in the search bar. The map pin will snap to that location.</li>
              <li><strong>Click the map:</strong> Pan to the correct location and click to drop a pin.</li>
              <li><strong>Enter coordinates:</strong> If you have the exact latitude/longitude (from Google Maps, for example), paste them directly.</li>
            </ul>

            <h3>Step 4: Download your geotagged photo</h3>
            <p>
              Click Download. The tool embeds the GPS coordinates into the photo's EXIF metadata and downloads the file. HEIC files are automatically converted to high-quality JPEG for maximum compatibility with apps, platforms, and MLS systems.
            </p>

            <p>
              There is zero quality loss — only the metadata is modified. The pixel data is untouched.
            </p>

            <h2>How to Verify the GPS Was Added Correctly</h2>

            <p>
              After downloading, upload the geotagged photo to our <Link href="/gps-finder">GPS Finder tool</Link> to confirm the coordinates are correctly embedded. The tool will show the location on a map and display the exact latitude/longitude stored in the file.
            </p>

            <p>
              You can also import the photo back into Apple Photos and swipe up to see the location map appear — confirming the GPS data is now present.
            </p>

            <h2>How to Prevent Missing GPS on Future iPhone Photos</h2>

            <p>
              To ensure future photos automatically capture GPS, enable Location Services for the Camera app:
            </p>
            <ol>
              <li>Go to <strong>Settings → Privacy & Security → Location Services</strong></li>
              <li>Scroll down to <strong>Camera</strong></li>
              <li>Set it to <strong>"While Using the App"</strong></li>
            </ol>

            <p>
              With this setting, every photo you take will automatically embed the GPS coordinates of where you took it. For photos where you want location but are in a poor signal area, wait a few seconds after opening Camera for the GPS to acquire a lock before shooting.
            </p>

            <h2>Batch Geotagging Multiple iPhone Photos</h2>

            <p>
              If you have a set of photos from the same location — a trip, an event, a property shoot — you don't need to geotag them one by one. <Link href="/">FreeGeoTagger</Link> supports batch upload: drag in multiple photos at once, set one location, and download them all with the same GPS coordinates embedded. You can download as individual files or as a ZIP archive.
            </p>

            <h2>Conclusion</h2>

            <p>
              Adding GPS to iPhone photos is fast and free with <Link href="/">FreeGeoTagger</Link>. Whether your photo was taken with location services off, in a GPS dead zone, or imported from another device, you can add precise coordinates in under a minute — directly in your browser, with no app install and no account.
            </p>

            <p>
              <Link href="/">Start geotagging now →</Link>
            </p>
          </article>

          {/* Related posts */}
          <div className="mt-12 border-t border-border pt-10">
            <h2 className="font-display font-bold text-xl mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/blog/what-is-exif-gps-metadata"
                className="group flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-snug mb-1 group-hover:text-primary transition-colors">
                    What Is EXIF GPS Metadata? A Complete Guide
                  </p>
                  <p className="text-xs text-muted-foreground">7 min read</p>
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
            <h3 className="font-display font-bold text-lg mb-2">Add GPS to your iPhone photos now</h3>
            <p className="text-sm text-muted-foreground mb-4">Free, private, works in Safari. No app needed.</p>
            <EclipseButton
              text="Geotag Photos Free"
              leftIcon={<MapPin className="h-4 w-4" />}
              onClick={() => navigate("/")}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
