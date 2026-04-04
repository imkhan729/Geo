import { useEffect } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { updatePageSEO, injectPageSchema, SEO_CONFIG } from "@/lib/seo";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { EclipseButton } from "@/components/ui/eclipse-button";
import { useLocation } from "wouter";

export default function BlogGbp() {
  const [, navigate] = useLocation();

  useEffect(() => {
    updatePageSEO(SEO_CONFIG.blogGbp);

    injectPageSchema("blog-gbp-article", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "How to Geotag Photos for Google Business Profile",
      description:
        "Add GPS coordinates to photos before uploading to Google Business Profile — boost local SEO, strengthen map indexing, and increase discovery on Google Maps.",
      datePublished: "2026-04-01",
      dateModified: "2026-04-01",
      author: { "@type": "Organization", name: "FreeGeoTagger", url: "https://freegeotagger.com" },
      publisher: {
        "@type": "Organization",
        name: "FreeGeoTagger",
        url: "https://freegeotagger.com",
        logo: { "@type": "ImageObject", url: "https://freegeotagger.com/favicon.png" },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": "https://freegeotagger.com/blog/how-to-geotag-photos-for-google-business-profile",
      },
      inLanguage: "en-US",
    });

    injectPageSchema("blog-gbp-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://freegeotagger.com/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://freegeotagger.com/blog" },
        {
          "@type": "ListItem",
          position: 3,
          name: "Geotag Photos for Google Business Profile",
          item: "https://freegeotagger.com/blog/how-to-geotag-photos-for-google-business-profile",
        },
      ],
    });

    injectPageSchema("blog-gbp-faq", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Does Google read GPS metadata from photos uploaded to Business Profile?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Google reads EXIF GPS metadata from photos uploaded to Google Business Profile and uses the location data as a corroborating signal for your business's position in local search results and Google Maps. Photos geotagged to your business address reinforce your listing's geographic relevance.",
          },
        },
        {
          "@type": "Question",
          name: "Will geotagging my business photos improve local SEO rankings?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Geotagging is one of several local SEO signals. Photos with GPS metadata matching your business address send a consistent location signal to Google, which can strengthen your local ranking — especially for near-me searches. It works best alongside other signals like consistent NAP data, reviews, and category accuracy.",
          },
        },
        {
          "@type": "Question",
          name: "What photo formats work best for Google Business Profile geotagging?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "JPEG (JPG) is the best format for Google Business Profile photos — it has full EXIF GPS support and is the most widely accepted format. FreeGeoTagger can geotag JPG, PNG, WebP, and HEIC files and download them ready for upload.",
          },
        },
        {
          "@type": "Question",
          name: "How do I geotag photos for Google Business Profile for free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Use FreeGeoTagger — a free, browser-based tool. Upload your business photos, pin your exact business location on the interactive map or search your address, then download the geotagged photos. All processing happens locally; nothing is uploaded to any server.",
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
            <span className="text-foreground">Google Business Profile</span>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full">Local SEO</span>
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl leading-tight tracking-tight mb-4">
              How to Geotag Photos for Google Business Profile
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-5">
              Adding GPS coordinates to your business photos before uploading to Google Business Profile sends a precise location signal to Google — strengthening local search rankings, improving map accuracy, and increasing visibility for near-me searches.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-b border-border py-3">
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> April 1, 2026</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 7 min read</span>
              <span className="text-muted-foreground/60">By FreeGeoTagger</span>
            </div>
          </header>

          {/* Article */}
          <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl">

            <p>
              Google Business Profile (GBP) is the single most important listing for any local business — it controls what appears in Google Maps, local pack results, and the knowledge panel that shows up when someone searches for your business by name. Most business owners optimize their GBP with accurate categories, business hours, and review responses. Far fewer optimize the one thing that directly communicates location to Google at the file level: <strong>GPS metadata embedded in their uploaded photos</strong>.
            </p>

            <p>
              When you upload a photo to Google Business Profile, Google reads every piece of data attached to that file — including any EXIF GPS coordinates stored inside the image. A photo geotagged to your exact business address sends a machine-readable location signal that corroborates your listed address and reinforces your geographic relevance. Use <Link href="/">FreeGeoTagger</Link> to embed that data before you upload, and you give Google one more reason to rank your business higher for local searches.
            </p>

            <h2>Why Google Business Profile Cares About Photo GPS Metadata</h2>

            <p>
              Google's local ranking algorithm uses hundreds of signals to determine which businesses appear in local pack results and Maps. Among those signals, <strong>location consistency</strong> is critical — the more sources that confirm your business is at a specific address, the more confident Google becomes in surfacing your listing for relevant searches.
            </p>

            <p>
              EXIF GPS metadata is one of those sources. When a photo uploaded to your GBP listing contains GPS coordinates matching your business's latitude and longitude, it adds a direct data point that your business genuinely operates at that location. This matters particularly for:
            </p>

            <ul>
              <li><strong>Businesses in competitive local markets</strong> — where every marginal signal helps separate your listing from similar competitors.</li>
              <li><strong>Service-area businesses</strong> — which often struggle with location signals because they don't have a storefront address pinned to Maps.</li>
              <li><strong>New listings</strong> — that haven't yet accumulated reviews, citations, or backlinks to build geographic authority.</li>
              <li><strong>Multi-location businesses</strong> — where each location's photos should be geotagged to that specific location's coordinates, not the headquarters.</li>
            </ul>

            <h2>How GPS Metadata in Photos Strengthens Local SEO</h2>

            <p>
              Google's local ranking considers three primary factors: relevance, distance, and prominence. GPS metadata in your photos contributes most directly to the <strong>distance signal</strong> — it provides a precise, machine-readable coordinate that confirms your physical position.
            </p>

            <p>
              Beyond ranking, geotagged photos have a secondary benefit: when submitted through Google Maps as user-contributed photos (via the Google Maps app), they appear in the location's photo gallery and contribute to that pin's data quality score. High-quality, geotagged photos from business owners are weighted more heavily than untagged uploads from strangers.
            </p>

            <p>
              A 2023 analysis of local ranking factors by Whitespark and BrightLocal consistently identified photo quality and quantity as significant GBP signals. Adding GPS metadata converts a standard photo upload into a structured location data point — without changing anything visible to customers.
            </p>

            <h2>Step-by-Step: How to Geotag Business Photos Before Uploading to GBP</h2>

            <p>
              The entire process takes under two minutes using <Link href="/">FreeGeoTagger</Link> — a free, browser-based tool that embeds GPS coordinates directly into your photo's EXIF metadata without uploading your images to any server.
            </p>

            <h3>Step 1: Find your business's exact GPS coordinates</h3>
            <p>
              Open Google Maps and navigate to your business address. Right-click on the exact front-door location and copy the coordinates. They'll look something like <code>40.7128, -74.0060</code>. For accuracy, use the point where a customer standing outside would pin your entrance — not the center of the building.
            </p>

            <h3>Step 2: Upload your business photos to FreeGeoTagger</h3>
            <p>
              Go to <Link href="/">FreeGeoTagger</Link> and drag your business photos into the upload zone. You can process multiple photos at once — the tool supports JPG, PNG, WebP, and HEIC. All files stay on your device; nothing is sent to any server.
            </p>

            <h3>Step 3: Set the GPS location</h3>
            <p>
              Click on the interactive map to pin your business, search for your address in the search bar, or paste the latitude and longitude you copied from Google Maps directly into the coordinate fields. The pin will snap to your exact business location.
            </p>

            <h3>Step 4: Download and upload to Google Business Profile</h3>
            <p>
              Click Download to get your geotagged photos. Then log into your Google Business Profile, navigate to Photos, and upload the geotagged files. Google will read the embedded GPS data when it processes the images.
            </p>

            <h2>Which Business Photos Should You Geotag?</h2>

            <p>
              Not all photo types benefit equally from geotagging. Prioritize these for maximum local SEO impact:
            </p>

            <ul>
              <li><strong>Exterior shots</strong> — photos of your storefront, signage, entrance, and parking area. These are the most geographically meaningful photos for Google.</li>
              <li><strong>Interior shots</strong> — lobby, dining room, workspace, retail floor. Tagging these to your exact address confirms the business is active at that location.</li>
              <li><strong>Team and staff photos</strong> — taken at your business location. Use your address coordinates, not the photographer's location.</li>
              <li><strong>Product or service photos</strong> — if taken on-site. Photos taken elsewhere (like a stock-photo studio) can be tagged to your business address since the subject relates to your location.</li>
            </ul>

            <p>
              You can verify GPS data is correctly embedded in any photo using our <Link href="/gps-finder">GPS Finder tool</Link> — upload the file and confirm the coordinates match your business address before uploading to GBP.
            </p>

            <h2>Tips for Maximum Local SEO Impact from Geotagged Photos</h2>

            <ul>
              <li><strong>Use your precise entrance coordinates,</strong> not the center of your building or parking lot. Google Maps pins are most accurate at street level.</li>
              <li><strong>Geotag consistently across all photos.</strong> Uploading some photos with GPS and some without sends mixed signals. Aim to geotag every photo you add to your GBP listing.</li>
              <li><strong>Upload photos regularly.</strong> GBP listings with recent photo activity are treated as more active and relevant. A weekly cadence of 2–3 new geotagged photos sustains freshness signals.</li>
              <li><strong>Match your GPS coordinates to your verified address.</strong> Coordinates that don't match your listed address can confuse Google's location algorithms. Always use the same coordinates you'd use to pin your Google Maps entry.</li>
              <li><strong>Encourage customers to add geotagged photos.</strong> Customer-uploaded photos with GPS data matching your address further corroborate your location. Share your Maps link with review request emails to make it easy.</li>
            </ul>

            <h2>Common Mistakes to Avoid</h2>

            <ul>
              <li><strong>Using the wrong coordinates.</strong> A common error is copy-pasting coordinates from the wrong Google Maps pin — check that the coordinates correspond to your specific unit or entrance, not the building or mall center.</li>
              <li><strong>Uploading photos edited with software that strips EXIF.</strong> Some editing tools (older versions of Photoshop, certain online editors) remove all EXIF data when exporting. Always run photos through <Link href="/">FreeGeoTagger</Link> as the final step before uploading to GBP.</li>
              <li><strong>Using different coordinates for different locations.</strong> For multi-location businesses, each branch needs its own set of geotagged photos with that branch's coordinates — not the headquarters address.</li>
            </ul>

            <h2>Verifying Your GPS Data Before You Upload</h2>

            <p>
              Before uploading to GBP, confirm that GPS data is correctly embedded using our <Link href="/gps-finder">GPS Finder</Link>. Upload the finished photo, and the tool will extract and display the embedded coordinates on a map. If the pin lands on your business address, the photo is ready. If the location is off, re-geotag using <Link href="/">FreeGeoTagger</Link> and download again.
            </p>

            <h2>Conclusion</h2>

            <p>
              Geotagging your Google Business Profile photos is one of the lowest-effort, highest-leverage local SEO optimizations available. It takes under two minutes per batch, it's completely free, and it adds a precise location signal that most competitors haven't thought to include.
            </p>

            <p>
              Start with your exterior shots, geotag them to your exact entrance coordinates using <Link href="/">FreeGeoTagger</Link>, verify with the <Link href="/gps-finder">GPS Finder</Link>, and upload to GBP. Repeat with every new photo you add — and let the location signal compound over time.
            </p>

          </article>

          {/* Related posts */}
          <div className="mt-12 border-t border-border pt-10">
            <h2 className="font-display font-bold text-xl mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center">
            <h3 className="font-display font-bold text-lg mb-2">Geotag your business photos now</h3>
            <p className="text-sm text-muted-foreground mb-4">Free, private, browser-based. No account required.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <EclipseButton
                text="Geotag Photos Free"
                leftIcon={<MapPin className="h-4 w-4" />}
                onClick={() => navigate("/")}
              />
              <EclipseButton
                text="Verify GPS in Photo"
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
