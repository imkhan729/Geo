import { useEffect } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { updatePageSEO, injectPageSchema, SEO_CONFIG } from "@/lib/seo";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { EclipseButton } from "@/components/ui/eclipse-button";
import { useLocation } from "wouter";

export default function BlogRealEstate() {
  const [, navigate] = useLocation();

  useEffect(() => {
    updatePageSEO(SEO_CONFIG.blogRealEstate);

    injectPageSchema("blog-re-article", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "How to Geotag Photos for Real Estate Listings",
      description:
        "Learn how to add GPS coordinates to real estate listing photos to improve MLS accuracy, boost SEO, and give buyers better property context.",
      datePublished: "2026-03-28",
      dateModified: "2026-03-28",
      author: { "@type": "Organization", name: "FreeGeoTagger", url: "https://freegeotagger.com" },
      publisher: {
        "@type": "Organization",
        name: "FreeGeoTagger",
        url: "https://freegeotagger.com",
        logo: { "@type": "ImageObject", url: "https://freegeotagger.com/favicon.png" },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": "https://freegeotagger.com/blog/how-to-geotag-photos-for-real-estate" },
      inLanguage: "en-US",
    });

    injectPageSchema("blog-re-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://freegeotagger.com/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://freegeotagger.com/blog" },
        {
          "@type": "ListItem",
          position: 3,
          name: "How to Geotag Photos for Real Estate Listings",
          item: "https://freegeotagger.com/blog/how-to-geotag-photos-for-real-estate",
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
            <span className="text-foreground">Real Estate Geotagging</span>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">Real Estate</span>
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl leading-tight tracking-tight mb-4">
              How to Geotag Real Estate Photos for MLS Listings
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-5">
              Add GPS coordinates to property listing photos to improve MLS accuracy, strengthen local SEO, and give buyers precise location context — free, in seconds, no software needed.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-b border-border py-3">
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> March 28, 2026</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 6 min read</span>
              <span className="text-muted-foreground/60">By FreeGeoTagger</span>
            </div>
          </header>

          {/* Article */}
          <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl">

            <p>
              In real estate, location is everything. Yet thousands of property photos uploaded to MLS platforms, real estate websites, and Google Business profiles every day are missing one critical piece of data: GPS coordinates embedded in the image file itself.
            </p>

            <p>
              Geotagged photos don't just tell buyers <em>where</em> a property is — they help search engines, mapping apps, and AI tools understand the photo's context. For agents and photographers, adding GPS metadata to listing photos is one of the simplest technical improvements you can make with an outsized impact on discoverability.
            </p>

            <h2>Why GPS Metadata Matters for Real Estate Photos</h2>

            <p>
              When you upload a photo with embedded GPS data to Google Business Profile, Google My Maps, or a real estate platform, that location information is read and used in multiple ways:
            </p>

            <ul>
              <li><strong>Local SEO signals:</strong> Google uses EXIF GPS data as a corroborating signal for local business listings and map indexing. Photos geotagged to a specific address reinforce your listing's relevance for location-based searches.</li>
              <li><strong>MLS and portal accuracy:</strong> Some MLS systems and portals like Zillow and Realtor.com can read GPS from uploaded photos to auto-populate or validate address fields.</li>
              <li><strong>Buyer trust:</strong> Property photos with verifiable location data signal professionalism and reduce buyer uncertainty about exact property boundaries and surroundings.</li>
              <li><strong>Google Street View context:</strong> When geotagged photos are submitted to Google Maps, they appear in the location's photo gallery, giving your listing additional organic exposure.</li>
            </ul>

            <h2>What GPS Data Is Actually Stored in a Real Estate Photo?</h2>

            <p>
              GPS metadata in a photo is stored as part of the EXIF (Exchangeable Image File Format) data block. For a real estate photo, the most useful fields are:
            </p>

            <ul>
              <li><strong>GPSLatitude / GPSLongitude:</strong> The precise decimal coordinates of the property</li>
              <li><strong>GPSAltitude:</strong> Elevation above sea level (useful for hillside or high-rise properties)</li>
              <li><strong>GPSImgDirection:</strong> The compass bearing of the camera when the shot was taken</li>
            </ul>

            <p>
              You can verify the GPS data in any photo using our free <Link href="/gps-finder">GPS Finder tool</Link> — just upload the image and it will instantly display any embedded coordinates on a map.
            </p>

            <h2>How to Geotag Real Estate Photos Step by Step</h2>

            <p>
              You don't need expensive software or a GPS-enabled camera to add location data to your listing photos. <Link href="/">FreeGeoTagger</Link> handles it entirely in your browser — no uploads, no accounts, no cost.
            </p>

            <h3>Step 1: Find the exact property coordinates</h3>
            <p>
              Open Google Maps and navigate to the property address. Right-click the pin and copy the latitude/longitude coordinates. For a listing at 123 Main Street, you'd get something like <code>40.7128, -74.0060</code>.
            </p>

            <h3>Step 2: Upload your listing photos</h3>
            <p>
              Go to <Link href="/">FreeGeoTagger</Link> and drag your property photos into the upload area. You can upload multiple photos at once — the tool supports JPG, PNG, WebP, and HEIC files. All processing happens locally in your browser, so your images are never sent to any server.
            </p>

            <h3>Step 3: Set the GPS location</h3>
            <p>
              Click the pin icon on the interactive map, search for the property address, or paste the coordinates directly. The map pin will snap to the exact location.
            </p>

            <h3>Step 4: Download your geotagged photos</h3>
            <p>
              Click Download to get your photos with GPS coordinates embedded in the EXIF metadata. There is zero quality loss — only the metadata is modified. You can download photos individually or as a ZIP archive for batch uploads.
            </p>

            <h2>Tips for Accurate Real Estate Photo Geotagging</h2>

            <ul>
              <li><strong>Use the property's street-facing coordinates,</strong> not the center of the lot. This aligns best with how map apps display pins.</li>
              <li><strong>Geotag exterior shots separately from interior shots</strong> if they show different buildings (e.g., condo building vs. unit). Most agents geotag all photos with the same property coordinates.</li>
              <li><strong>Re-geotag after editing:</strong> Some photo editing tools strip EXIF data. Always geotag as the final step before uploading to MLS or portals.</li>
              <li><strong>Verify before uploading</strong> by running your finished photos through our <Link href="/gps-finder">GPS Finder</Link> to confirm the coordinates are embedded correctly.</li>
            </ul>

            <h2>Which MLS Platforms Read EXIF GPS Data?</h2>

            <p>
              GPS metadata support varies by platform. Here's a quick overview:
            </p>

            <ul>
              <li><strong>Google Business Profile:</strong> Reads EXIF GPS from photos and uses it for local map indexing — one of the most impactful places to geotag.</li>
              <li><strong>Zillow / Realtor.com:</strong> Accept geotagged photos, though they primarily use address fields for map pins. GPS data provides additional accuracy signals.</li>
              <li><strong>RETS / RESO MLS feeds:</strong> Modern MLS systems built on the RESO standard can surface GPS data from photos for mapping and search filters.</li>
              <li><strong>Facebook Marketplace:</strong> Reads photo EXIF data including GPS when enabled, useful for local listing targeting.</li>
            </ul>

            <h2>Real Estate Photo Geotagging and Privacy</h2>

            <p>
              One common concern: since GPS data reveals a property's exact location, is there a privacy risk? For listings that are publicly marketed, the answer is no — the address is already public. The GPS metadata simply makes that information machine-readable.
            </p>

            <p>
              For vacant properties or high-value homes where you want to limit discoverability, you can use our <Link href="/gps-finder">GPS Finder</Link> to check existing GPS data in photos before distributing them.
            </p>

            <h2>Conclusion</h2>

            <p>
              Geotagging real estate photos is a fast, free, and high-leverage action that improves local SEO, MLS accuracy, and buyer confidence. With <Link href="/">FreeGeoTagger</Link>, the entire workflow takes under a minute — add a location, download, upload to your platforms.
            </p>

            <p>
              No software. No account. No cost. <Link href="/">Try it now →</Link>
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
            <h3 className="font-display font-bold text-lg mb-2">Geotag your listing photos now</h3>
            <p className="text-sm text-muted-foreground mb-4">Free, private, browser-based. No account required.</p>
            <EclipseButton
              text="Start Geotagging Free"
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
