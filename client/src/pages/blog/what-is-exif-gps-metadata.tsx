import { useEffect } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { updatePageSEO, injectPageSchema, SEO_CONFIG } from "@/lib/seo";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { EclipseButton } from "@/components/ui/eclipse-button";
import { useLocation } from "wouter";

export default function BlogExifGps() {
  const [, navigate] = useLocation();

  useEffect(() => {
    updatePageSEO(SEO_CONFIG.blogExifGps);

    injectPageSchema("blog-exif-article", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "What Is EXIF GPS Metadata? A Complete Guide for Photographers",
      description:
        "Understand what EXIF GPS metadata is, how latitude and longitude get stored inside image files, and why it matters for apps, search, and workflows.",
      datePublished: "2026-03-25",
      dateModified: "2026-03-25",
      author: { "@type": "Organization", name: "FreeGeoTagger", url: "https://freegeotagger.com" },
      publisher: {
        "@type": "Organization",
        name: "FreeGeoTagger",
        url: "https://freegeotagger.com",
        logo: { "@type": "ImageObject", url: "https://freegeotagger.com/favicon.png" },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": "https://freegeotagger.com/blog/what-is-exif-gps-metadata" },
      inLanguage: "en-US",
    });

    injectPageSchema("blog-exif-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://freegeotagger.com/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://freegeotagger.com/blog" },
        {
          "@type": "ListItem",
          position: 3,
          name: "What Is EXIF GPS Metadata?",
          item: "https://freegeotagger.com/blog/what-is-exif-gps-metadata",
        },
      ],
    });

    injectPageSchema("blog-exif-faq", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is EXIF GPS metadata?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "EXIF GPS metadata is location information — latitude, longitude, altitude, and direction — embedded inside a photo file's EXIF data block. It tells apps and services exactly where a photo was taken.",
          },
        },
        {
          "@type": "Question",
          name: "Can I add GPS data to a photo after it was taken?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. You can add GPS coordinates to any JPEG, PNG, WebP, or HEIC photo using FreeGeoTagger — a free, browser-based tool that embeds GPS into the EXIF metadata without affecting image quality.",
          },
        },
        {
          "@type": "Question",
          name: "How do I read GPS data from a photo?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Use the FreeGeoTagger GPS Finder tool. Upload any geotagged photo and it will extract the embedded GPS coordinates and display them on a map — free and private.",
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
            <span className="text-foreground">EXIF GPS Metadata</span>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full">Photography</span>
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl leading-tight tracking-tight mb-4">
              What Is EXIF GPS Metadata? A Complete Guide
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-5">
              Learn what EXIF GPS metadata is, how GPS coordinates are stored inside photo files, and why it matters for photo apps, search engines, and professional workflows.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-b border-border py-3">
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> March 25, 2026</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 7 min read</span>
              <span className="text-muted-foreground/60">By FreeGeoTagger</span>
            </div>
          </header>

          {/* Article */}
          <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl">

            <p>
              Every time you take a photo with a modern smartphone, your device quietly embeds a detailed block of technical data into the image file. This data — known as EXIF metadata — includes camera settings, timestamps, device model, and, if location services are enabled, precise GPS coordinates.
            </p>

            <p>
              EXIF GPS metadata is what makes Google Photos organize your images on a world map, lets Apple Photos show "Taken near Paris," and allows platforms like Flickr to cluster photos by location. It's also something you can add to any photo after the fact — which is exactly what <Link href="/">FreeGeoTagger</Link> does.
            </p>

            <h2>What Does "EXIF" Stand For?</h2>

            <p>
              EXIF stands for <strong>Exchangeable Image File Format</strong>. It's a standard first defined in 1995 by the Japan Electronic Industries Development Association (JEIDA) and now maintained as part of the JEITA standard. EXIF defines how metadata is stored in JPEG, TIFF, and (with extensions) PNG, WebP, and HEIC files.
            </p>

            <p>
              EXIF data lives in a dedicated section of the image file binary — separate from the pixel data. This means modifying EXIF metadata, including GPS coordinates, has zero effect on image quality or visual appearance.
            </p>

            <h2>What GPS Data Is Stored in an EXIF Block?</h2>

            <p>
              The GPS sub-IFD (Image File Directory) within EXIF can store numerous fields. The most commonly used are:
            </p>

            <ul>
              <li><strong>GPSLatitude</strong> — Degrees, minutes, seconds (DMS) or decimal degrees of latitude</li>
              <li><strong>GPSLatitudeRef</strong> — North (N) or South (S) hemisphere</li>
              <li><strong>GPSLongitude</strong> — Degrees, minutes, seconds of longitude</li>
              <li><strong>GPSLongitudeRef</strong> — East (E) or West (W) of the Prime Meridian</li>
              <li><strong>GPSAltitude</strong> — Elevation in meters above (or below) sea level</li>
              <li><strong>GPSAltitudeRef</strong> — Above (0) or below (1) sea level</li>
              <li><strong>GPSTimestamp / GPSDateStamp</strong> — UTC time and date the GPS fix was recorded</li>
              <li><strong>GPSImgDirection</strong> — Compass bearing of the camera at time of shot (0–359.99 degrees)</li>
              <li><strong>GPSSpeed</strong> — Speed of the GPS receiver at time of capture (useful for dashcams and action cameras)</li>
              <li><strong>GPSAreaInformation</strong> — Free-text location name or area</li>
            </ul>

            <p>
              The minimum data needed to place a photo on a map is <code>GPSLatitude</code>, <code>GPSLatitudeRef</code>, <code>GPSLongitude</code>, and <code>GPSLongitudeRef</code>. Everything else is supplementary.
            </p>

            <h2>How Are GPS Coordinates Stored in a JPEG?</h2>

            <p>
              JPEG files begin with a SOI (Start of Image) marker, followed by a series of APP segments. GPS data lives inside the <strong>APP1 segment</strong>, which starts with an Exif header followed by a TIFF-format data structure.
            </p>

            <p>
              Inside that structure, GPS data is stored in a dedicated sub-IFD referenced from IFD0. Each GPS field (like <code>GPSLatitude</code>) is encoded as a RATIONAL type — a pair of 32-bit integers representing a numerator/denominator fraction. For example, a latitude of 40.7128° might be stored as:
            </p>

            <ul>
              <li>Degrees: 40/1</li>
              <li>Minutes: 42/1</li>
              <li>Seconds: 46/100 (representing 0.768 arc-seconds)</li>
            </ul>

            <p>
              Most software reads and writes decimal degrees (like 40.7128, -74.0060) and handles the DMS conversion internally.
            </p>

            <h2>Which Image Formats Support EXIF GPS?</h2>

            <ul>
              <li><strong>JPEG (.jpg, .jpeg):</strong> Full EXIF GPS support. The universal standard for camera and phone photos.</li>
              <li><strong>TIFF (.tif):</strong> Native EXIF support. Used in professional photography and GIS workflows.</li>
              <li><strong>HEIC (.heic):</strong> Apple's format for iPhone photos. Stores GPS in a compatible metadata block. Most platforms require conversion to JPEG for broad compatibility.</li>
              <li><strong>WebP (.webp):</strong> GPS data stored in an Exif chunk. Support is growing but not universal across all apps.</li>
              <li><strong>PNG (.png):</strong> Stores EXIF in an eXIf chunk (uppercase). Less universally supported than JPEG EXIF, but readable by modern tools.</li>
              <li><strong>RAW formats (.dng, .cr2, .nef, .arw):</strong> Full EXIF GPS support. GPS is typically written by the camera if location services are active.</li>
            </ul>

            <p>
              <Link href="/">FreeGeoTagger</Link> supports JPEG, PNG, WebP, and HEIC. You can verify GPS data in any format using our <Link href="/gps-finder">GPS Finder</Link>.
            </p>

            <h2>How Do Apps Use EXIF GPS Data?</h2>

            <p>
              EXIF GPS data is read by virtually every major photo application and many web services:
            </p>

            <ul>
              <li><strong>Google Photos:</strong> Auto-organizes photos by location into Albums and Places. Enables the "Memories on a Map" feature.</li>
              <li><strong>Apple Photos:</strong> Shows photos on a map, groups by location in Places view, and shows location in the photo's info panel.</li>
              <li><strong>Adobe Lightroom / Bridge:</strong> Displays GPS on a map module, supports filtering by location, and shows coordinates in metadata panels.</li>
              <li><strong>Windows File Explorer:</strong> Shows GPS coordinates in the file's Properties &gt; Details tab.</li>
              <li><strong>Google Search:</strong> Uses EXIF GPS as a signal for image indexing in Google Images, especially for local queries.</li>
              <li><strong>Flickr / 500px:</strong> Place photos on world maps, cluster by location, and enable location-based discovery.</li>
              <li><strong>GIS Software (ArcGIS, QGIS):</strong> Reads GPS from photos to plot them on geographic maps for field research and surveys.</li>
            </ul>

            <h2>How to Add GPS Data to a Photo That Doesn't Have It</h2>

            <p>
              Photos taken without location services enabled, scanned prints, screenshots, or images from cameras without GPS chips will have no EXIF GPS data. You can add it retroactively:
            </p>

            <ol>
              <li>Go to <Link href="/">FreeGeoTagger</Link></li>
              <li>Upload your photo (JPG, PNG, WebP, or HEIC)</li>
              <li>Click the map to set the location, search for an address, or enter coordinates</li>
              <li>Download the geotagged version — GPS is now embedded in the EXIF data</li>
            </ol>

            <p>
              The entire process takes under 30 seconds. No account, no software, no upload to any server.
            </p>

            <h2>How to Read GPS Data From an Existing Photo</h2>

            <p>
              If you want to find out where a geotagged photo was taken — or verify that GPS data was correctly written — use our <Link href="/gps-finder">GPS Finder tool</Link>. Upload any photo and it will extract the embedded GPS coordinates and display the location on an interactive map.
            </p>

            <h2>EXIF GPS and Privacy</h2>

            <p>
              Because EXIF GPS data reveals exact locations, privacy is a legitimate concern. A photo taken at your home, shared publicly, contains your home's GPS coordinates in its EXIF metadata unless stripped.
            </p>

            <p>
              Most social media platforms (Instagram, Twitter/X, Facebook) automatically strip EXIF GPS data when you upload photos. But email attachments, direct file shares, and some platforms preserve it. Always check EXIF data before sharing photos from sensitive locations.
            </p>

            <h2>Summary</h2>

            <p>
              EXIF GPS metadata is the technology that makes location-aware photography possible. It's stored as a structured block inside image files, read by virtually every photo app and service, and can be added or removed without any effect on image quality.
            </p>

            <p>
              Whether you're a photographer organizing a location-based archive, a real estate agent adding GPS to listing photos, or a developer building a location-aware app, understanding EXIF GPS is foundational.
            </p>

            <p>
              Try <Link href="/">FreeGeoTagger</Link> to add GPS to your photos, or use the <Link href="/gps-finder">GPS Finder</Link> to read GPS from existing images. Both tools are free and work entirely in your browser.
            </p>
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
                href="/blog/how-to-add-gps-to-iphone-photos"
                className="group flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-snug mb-1 group-hover:text-primary transition-colors">
                    How to Add GPS Location to iPhone Photos
                  </p>
                  <p className="text-xs text-muted-foreground">5 min read</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-0.5" />
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center">
            <h3 className="font-display font-bold text-lg mb-2">Add GPS to your photos for free</h3>
            <p className="text-sm text-muted-foreground mb-4">Browser-based, no uploads, no account required.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <EclipseButton
                text="Geotag a Photo"
                leftIcon={<MapPin className="h-4 w-4" />}
                onClick={() => navigate("/")}
              />
              <EclipseButton
                text="Read GPS from Photo"
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
