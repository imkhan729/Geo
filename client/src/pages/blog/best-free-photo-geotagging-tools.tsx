import { useEffect } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { updatePageSEO, injectPageSchema, SEO_CONFIG } from "@/lib/seo";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { EclipseButton } from "@/components/ui/eclipse-button";
import { useLocation } from "wouter";

export default function BlogBestTools() {
  const [, navigate] = useLocation();

  useEffect(() => {
    updatePageSEO(SEO_CONFIG.blogBestTools);

    injectPageSchema("blog-tools-article", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Best Free Photo Geotagging Tools in 2026",
      description:
        "Compare the best free photo geotagging tools in 2026 — browser-based, desktop, and command-line options reviewed for speed, privacy, batch support, and ease of use.",
      datePublished: "2026-04-03",
      dateModified: "2026-04-03",
      author: { "@type": "Organization", name: "FreeGeoTagger", url: "https://freegeotagger.com" },
      publisher: {
        "@type": "Organization",
        name: "FreeGeoTagger",
        url: "https://freegeotagger.com",
        logo: { "@type": "ImageObject", url: "https://freegeotagger.com/favicon.png" },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": "https://freegeotagger.com/blog/best-free-photo-geotagging-tools",
      },
      inLanguage: "en-US",
    });

    injectPageSchema("blog-tools-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://freegeotagger.com/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://freegeotagger.com/blog" },
        {
          "@type": "ListItem",
          position: 3,
          name: "Best Free Photo Geotagging Tools",
          item: "https://freegeotagger.com/blog/best-free-photo-geotagging-tools",
        },
      ],
    });

    injectPageSchema("blog-tools-faq", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is the best free photo geotagging tool?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "FreeGeoTagger is the best free browser-based geotagging tool — no install, no account, completely private (no uploads), and it works on Windows, Mac, Linux, iOS, and Android. For power users who need GPS track import or advanced metadata editing, GeoSetter (Windows) or ExifTool (command line) are strong free alternatives.",
          },
        },
        {
          "@type": "Question",
          name: "Can I geotag photos in bulk for free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. FreeGeoTagger supports batch geotagging at no cost — upload multiple photos, set one GPS location, and download all geotagged files as a ZIP. ExifTool also supports unlimited batch geotagging from GPS track files via command line.",
          },
        },
        {
          "@type": "Question",
          name: "Is there a geotagging tool that works without uploading photos to a server?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. FreeGeoTagger processes all photos locally in your browser using JavaScript — your images never leave your device. Desktop tools like GeoSetter, HoudahGeo, and ExifTool also process files locally. Avoid any browser-based tool that requires file upload to a server if privacy is a concern.",
          },
        },
        {
          "@type": "Question",
          name: "Do I need to install software to geotag photos?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. FreeGeoTagger is entirely browser-based and requires no installation — open it in Chrome, Firefox, Safari, or Edge on any operating system and start geotagging immediately. Desktop tools like GeoSetter and HoudahGeo require installation but offer additional features like GPS track import.",
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
            <span className="text-foreground">Best Geotagging Tools</span>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium bg-violet-500/10 text-violet-700 dark:text-violet-400 px-2.5 py-1 rounded-full">Tools</span>
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl leading-tight tracking-tight mb-4">
              Best Free Photo Geotagging Tools in 2026
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-5">
              Whether you need a quick browser-based fix or a full-featured desktop workflow, these are the best free tools for adding GPS coordinates to photos in 2026 — reviewed for privacy, batch support, platform compatibility, and ease of use.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-b border-border py-3">
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> April 3, 2026</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 8 min read</span>
              <span className="text-muted-foreground/60">By FreeGeoTagger</span>
            </div>
          </header>

          {/* Article */}
          <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl">

            <p>
              Photo geotagging — embedding GPS coordinates into a photo's <Link href="/blog/what-is-exif-gps-metadata">EXIF metadata</Link> — is useful across a surprising range of workflows: organizing travel photos, tagging real estate listings, optimizing Google Business Profile images, meeting archival requirements, or simply making sure Google Photos can place your memories on a map.
            </p>

            <p>
              The good news: you don't need to pay for this. There are several excellent free geotagging tools in 2026 spanning browser-based, desktop, and command-line options. The best choice depends on your operating system, how many photos you need to process, and how much technical comfort you have. This guide covers the top options honestly — including their limitations.
            </p>

            <h2>What to Look for in a Photo Geotagging Tool</h2>

            <p>
              Before diving into specific tools, here are the criteria that actually matter when evaluating geotagging software:
            </p>

            <ul>
              <li><strong>Privacy:</strong> Does the tool upload your photos to a server? For business, personal, or sensitive images, you want local processing only.</li>
              <li><strong>Batch support:</strong> Can it geotag multiple photos at once with a single GPS location, or do you have to process photos one at a time?</li>
              <li><strong>Format support:</strong> Does it handle JPG, PNG, WebP, and HEIC — not just JPEG?</li>
              <li><strong>Platform:</strong> Browser-based tools work everywhere. Desktop tools are OS-specific.</li>
              <li><strong>Ease of use:</strong> Is it usable without reading a manual? For occasional use, simplicity matters more than power.</li>
              <li><strong>GPS accuracy:</strong> Can you set a precise location via map, address search, or coordinate input?</li>
            </ul>

            <h2>1. FreeGeoTagger — Best Browser-Based Tool (All Platforms)</h2>

            <p>
              <Link href="/">FreeGeoTagger</Link> is the top pick for anyone who needs a fast, private, no-install solution. It runs entirely in your browser — Chrome, Firefox, Safari, or Edge — on Windows, Mac, Linux, Android, and iOS. No account, no subscription, no file upload.
            </p>

            <p><strong>How it works:</strong> Upload your photos directly from your device. Use the interactive Leaflet map to pin a location, search for an address by name, or enter GPS coordinates manually. Click Download to get your geotagged files — individually or as a ZIP for batch processing.</p>

            <p><strong>Key strengths:</strong></p>
            <ul>
              <li>100% local processing — photos never leave your device</li>
              <li>Batch geotagging with no file or photo count limits</li>
              <li>Supports JPG, PNG, WebP, and HEIC (iPhone photos auto-converted)</li>
              <li>Works on mobile browsers — Chrome on Android, Safari on iOS</li>
              <li>Built-in <Link href="/gps-finder">GPS Finder</Link> to read and verify coordinates from existing photos</li>
              <li>Zero quality loss — only EXIF metadata is modified</li>
            </ul>

            <p><strong>Limitations:</strong> No GPS track file import (GPX/KML). If you're a wildlife photographer or field researcher who records GPS tracks and wants to match-and-tag thousands of photos by timestamp, you'll need a desktop tool alongside FreeGeoTagger.</p>

            <p><strong>Best for:</strong> Photographers, real estate agents, business owners, iPhone and Android users, anyone who needs a quick, private geotagging solution without software setup.</p>

            <h2>2. GeoSetter — Best Free Desktop Tool (Windows)</h2>

            <p>
              GeoSetter is a long-standing free Windows application for geotagging and EXIF editing. It integrates with Google Maps (with your API key) or OpenStreetMap for location selection, and supports GPS track files in GPX and NMEA format — useful for matching tracks recorded by a dedicated GPS device to camera photos by timestamp.
            </p>

            <p><strong>Key strengths:</strong> GPX track import and timestamp matching, batch processing of thousands of photos, full EXIF/IPTC/XMP metadata editing, and integration with ExifTool for file operations. It's free and runs without a subscription.</p>

            <p><strong>Limitations:</strong> Windows-only, requires installation, has an outdated UI that hasn't been updated since 2019, and the Google Maps integration requires an API key setup that has become more complex since Google deprecated free Maps API access. For simple geotagging tasks, it's overkill.</p>

            <p><strong>Best for:</strong> Windows users with GPS track files who need to match timestamps across large photo archives.</p>

            <h2>3. HoudahGeo — Best Desktop Tool for Mac</h2>

            <p>
              HoudahGeo is the go-to geotagging application for Mac photographers. It supports GPS track import (GPX, KML, NMEA, iPhoto, and Apple Maps), reverse geocoding to fill in location names, and full integration with Photos, Lightroom, and Finder.
            </p>

            <p><strong>Key strengths:</strong> Excellent macOS integration, track file support, reverse geocoding, IPTC metadata filling, and a polished native UI. It can batch-process large photo libraries efficiently.</p>

            <p><strong>Limitations:</strong> HoudahGeo is paid software (one-time purchase, approximately $39) with a free trial. It is not free for production use. However, for Mac-based photographers who regularly shoot with a dedicated camera and carry a GPS logger, the workflow benefits justify the cost. For occasional geotagging, <Link href="/">FreeGeoTagger</Link> is the better free alternative.</p>

            <p><strong>Best for:</strong> Mac-based professional photographers who use GPS loggers or want deep macOS Photos/Lightroom integration.</p>

            <h2>4. Adobe Lightroom — Built-in Map Module (Free with Limitations)</h2>

            <p>
              Adobe Lightroom Classic includes a Map module that displays photos with GPS data on a Google Map and allows you to drag photos to locations to geotag them. For photographers already in the Adobe ecosystem, this is convenient — no additional tool required.
            </p>

            <p><strong>Key strengths:</strong> Native integration with your Lightroom catalog, GPS track import, batch geotagging within a selection, and automatic location name population using reverse geocoding.</p>

            <p><strong>Limitations:</strong> Lightroom Classic is subscription software ($9.99/month minimum). The Map module was broken for several years when Google deprecated its free Maps API; it was restored with an alternative mapping provider but GPS precision varies. Not a free tool for most users.</p>

            <p><strong>Best for:</strong> Existing Lightroom Classic subscribers who want geotagging without leaving their photo management workflow.</p>

            <h2>5. digiKam — Best Free Open-Source Desktop Tool (Cross-Platform)</h2>

            <p>
              digiKam is a powerful open-source photo management application for Windows, Mac, and Linux that includes full geotagging functionality. It supports GPS track import, manual coordinate entry, interactive map tagging, and reverse geocoding.
            </p>

            <p><strong>Key strengths:</strong> Truly free and open-source, cross-platform, GPS track file support, deep EXIF/XMP metadata control, and large community support. It handles RAW files natively, making it useful for DSLR and mirrorless camera users.</p>

            <p><strong>Limitations:</strong> Steep learning curve, large install size, and the UI can feel complex for users who just want to add GPS to a few photos. Setup and catalog initialization take time.</p>

            <p><strong>Best for:</strong> Linux users, open-source advocates, and photographers who want a full photo management suite with geotagging built in.</p>

            <h2>6. ExifTool — Best Command-Line Tool (All Platforms)</h2>

            <p>
              ExifTool by Phil Harvey is the gold standard for EXIF metadata manipulation. It's a free, open-source command-line utility that reads and writes virtually every metadata field in every image format. Geotagging with ExifTool looks like:
            </p>

            <pre><code>exiftool -GPSLatitude=40.7128 -GPSLongitude=-74.0060 photo.jpg</code></pre>

            <p>For batch geotagging from a GPX track file:</p>

            <pre><code>exiftool -geotag track.gpx -geosync=0 *.jpg</code></pre>

            <p><strong>Key strengths:</strong> Handles every image format, unlimited batch processing, GPS track file support with configurable time offsets, scriptable for automation, and completely free with no limitations.</p>

            <p><strong>Limitations:</strong> Command-line only — no GUI. Requires comfort with terminal commands. Not practical for occasional use or non-technical users.</p>

            <p><strong>Best for:</strong> Developers, archivists, and power users who need scriptable, automated geotagging at scale.</p>

            <h2>Quick Comparison</h2>

            <div className="not-prose overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="px-3 py-2 border border-border font-semibold">Tool</th>
                    <th className="px-3 py-2 border border-border font-semibold">Free</th>
                    <th className="px-3 py-2 border border-border font-semibold">Platform</th>
                    <th className="px-3 py-2 border border-border font-semibold">Batch</th>
                    <th className="px-3 py-2 border border-border font-semibold">No Upload</th>
                    <th className="px-3 py-2 border border-border font-semibold">GPX Track</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 border border-border font-medium">FreeGeoTagger</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                    <td className="px-3 py-2 border border-border">All (Browser)</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                    <td className="px-3 py-2 border border-border text-muted-foreground">No</td>
                  </tr>
                  <tr className="bg-muted/20">
                    <td className="px-3 py-2 border border-border font-medium">GeoSetter</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                    <td className="px-3 py-2 border border-border">Windows</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border border-border font-medium">HoudahGeo</td>
                    <td className="px-3 py-2 border border-border text-amber-600 dark:text-amber-400">Trial</td>
                    <td className="px-3 py-2 border border-border">Mac</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                  </tr>
                  <tr className="bg-muted/20">
                    <td className="px-3 py-2 border border-border font-medium">Lightroom</td>
                    <td className="px-3 py-2 border border-border text-red-600 dark:text-red-400">Paid</td>
                    <td className="px-3 py-2 border border-border">Win / Mac</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border border-border font-medium">digiKam</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                    <td className="px-3 py-2 border border-border">All (Desktop)</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                  </tr>
                  <tr className="bg-muted/20">
                    <td className="px-3 py-2 border border-border font-medium">ExifTool</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                    <td className="px-3 py-2 border border-border">All (CLI)</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                    <td className="px-3 py-2 border border-border text-green-600 dark:text-green-400">Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>Which Geotagging Tool Should You Choose?</h2>

            <ul>
              <li><strong>Need a quick, private, no-install solution on any device?</strong> → <Link href="/">FreeGeoTagger</Link></li>
              <li><strong>Windows user with GPS track files from a logger or action camera?</strong> → GeoSetter</li>
              <li><strong>Mac photographer with a GPX logger and a Lightroom or Photos workflow?</strong> → HoudahGeo (paid) or digiKam (free)</li>
              <li><strong>Already paying for Lightroom and want geotagging built in?</strong> → Lightroom Map module</li>
              <li><strong>Developer, archivist, or automation user needing scriptable batch processing?</strong> → ExifTool</li>
              <li><strong>Need to verify GPS data embedded in a photo?</strong> → <Link href="/gps-finder">FreeGeoTagger GPS Finder</Link></li>
            </ul>

            <h2>Conclusion</h2>

            <p>
              For the vast majority of use cases — adding GPS to photos you already have, geotagging business photos before uploading to Google Business Profile, fixing location data stripped by messaging apps, or preparing photos for <Link href="/blog/how-to-geotag-photos-for-real-estate">real estate MLS listings</Link> — <Link href="/">FreeGeoTagger</Link> is the fastest and most private free solution available in 2026.
            </p>

            <p>
              For power workflows requiring GPS track import or deep catalog integration, GeoSetter (Windows), digiKam (all platforms), or ExifTool (command line) extend what's possible at no cost. The right tool is the one that fits your workflow — but the barrier to geotagging has never been lower.
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
                    How to Geotag Real Estate Listing Photos
                  </p>
                  <p className="text-xs text-muted-foreground">6 min read</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-0.5" />
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center">
            <h3 className="font-display font-bold text-lg mb-2">Try the best free geotagging tool now</h3>
            <p className="text-sm text-muted-foreground mb-4">Browser-based, private, no install, no account. Free forever.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <EclipseButton
                text="Geotag Photos Free"
                leftIcon={<MapPin className="h-4 w-4" />}
                onClick={() => navigate("/")}
              />
              <EclipseButton
                text="Extract GPS from Photo"
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
