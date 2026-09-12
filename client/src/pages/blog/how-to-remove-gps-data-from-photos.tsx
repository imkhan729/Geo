import { useEffect } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { updatePageSEO, injectPageSchema, SEO_CONFIG } from "@/lib/seo";
import { KeyTakeaways, BlogFigure, BlogFaq, useBlogFaqSchema } from "@/components/blog-extras";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { EclipseButton } from "@/components/ui/eclipse-button";
import { useLocation } from "wouter";

export default function BlogRemoveGps() {
  useBlogFaqSchema("how-to-remove-gps-data-from-photos");
  const [, navigate] = useLocation();

  useEffect(() => {
    updatePageSEO(SEO_CONFIG.blogRemoveGps);

    injectPageSchema("blog-remove-gps-article", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "How to Remove GPS Location Data from Photos (iPhone, Android, Windows & Mac)",
      description:
        "Protect your privacy by removing GPS location data from photos before sharing them. Step-by-step instructions for iPhone, Android, Windows, and Mac — plus how to check whether a photo still contains location metadata.",
      datePublished: "2026-07-08",
      dateModified: "2026-07-08",
      author: { "@type": "Organization", name: "FreeGeoTagger", url: "https://freegeotagger.com" },
      publisher: {
        "@type": "Organization",
        name: "FreeGeoTagger",
        url: "https://freegeotagger.com",
        logo: { "@type": "ImageObject", url: "https://freegeotagger.com/favicon.png" },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": "https://freegeotagger.com/blog/how-to-remove-gps-data-from-photos",
      },
      inLanguage: "en-US",
    });

    injectPageSchema("blog-remove-gps-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://freegeotagger.com/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://freegeotagger.com/blog" },
        {
          "@type": "ListItem",
          position: 3,
          name: "How to Remove GPS Data from Photos",
          item: "https://freegeotagger.com/blog/how-to-remove-gps-data-from-photos",
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
            <span className="text-foreground">Remove GPS Data</span>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400 px-2.5 py-1 rounded-full">Privacy</span>
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl leading-tight tracking-tight mb-4">
              How to Remove GPS Location Data from Photos (iPhone, Android, Windows &amp; Mac)
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-5">
              Every photo you take with location services enabled carries your exact coordinates inside it. Before you share images publicly, here is how to check for GPS metadata and strip it on every major platform — without losing image quality.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-b border-border py-3">
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> July 8, 2026</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 7 min read</span>
              <span className="text-muted-foreground/60">By FreeGeoTagger</span>
            </div>
          </header>

          {/* Article */}
          <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl">

            <p>
              Geotagging is genuinely useful — it lets Google Photos build travel maps, helps real estate agents document listings, and keeps field research organized. We built <Link href="/">FreeGeoTagger</Link> precisely because adding GPS to photos matters. But the same metadata becomes a privacy problem the moment a photo leaves your control. A photo taken at home and posted to a forum, marketplace listing, or public website can reveal your street address to anyone who checks the EXIF data.
            </p>

            <BlogFigure slug="how-to-remove-gps-data-from-photos" />

            <KeyTakeaways slug="how-to-remove-gps-data-from-photos" />

            <p>
              This guide covers both halves of responsible geotagging: how to <strong>find out whether a photo contains GPS data</strong>, and how to <strong>remove it</strong> on iPhone, Android, Windows, and Mac before sharing.
            </p>

            <h2>What GPS Data Is Actually Stored in a Photo</h2>

            <p>
              When location services are active, your camera writes several fields into the photo's EXIF metadata block: <code>GPSLatitude</code> and <code>GPSLongitude</code> (your position, typically accurate to 5–10 meters on a modern phone), and often <code>GPSAltitude</code>, <code>GPSImgDirection</code> (the compass heading you were facing), and a GPS timestamp. Combined with the capture date, this is enough to reconstruct not just where a photo was taken, but when you were there and which direction you were looking.
            </p>

            <p>
              None of this is visible in the image itself. It sits in a structured data section of the file that any EXIF reader — including free browser tools, Windows Explorer, and countless scripts — can extract in milliseconds. For a deeper look at how these fields work, see our <Link href="/blog/what-is-exif-gps-metadata">complete guide to EXIF GPS metadata</Link>.
            </p>

            <h2>First: Check Whether Your Photo Has GPS Data</h2>

            <p>
              Before stripping anything, confirm what is there. The fastest way is our free <Link href="/gps-finder">GPS Finder</Link>: upload the photo and it reads the EXIF block locally in your browser — nothing is uploaded to a server — and shows any embedded coordinates on a map. If it reports "No GPS data found," the photo is already safe to share from a location standpoint.
            </p>

            <p>You can also check natively on each platform:</p>

            <ul>
              <li><strong>iPhone:</strong> open the photo in the Photos app and swipe up, or tap the info (i) button. A map appears if location data is present.</li>
              <li><strong>Android:</strong> open the photo in Google Photos and tap the info icon. A map thumbnail with a place name means GPS is embedded.</li>
              <li><strong>Windows:</strong> right-click the file → Properties → Details tab. Scroll to the GPS section — latitude and longitude appear if present.</li>
              <li><strong>Mac:</strong> open the photo in Preview, press Command-I to open the inspector, and look for the GPS tab.</li>
            </ul>

            <h2>Remove GPS Data on iPhone</h2>

            <p>
              iOS has built-in location removal since iOS 13. Open the photo in the <strong>Photos app</strong>, tap the info (i) button, then tap <strong>Adjust</strong> next to the location map and choose <strong>No Location</strong>. This removes the location from the photo as stored in your library.
            </p>

            <p>
              Even easier: when sharing, iOS can strip location just for that share. In the share sheet, tap <strong>Options</strong> at the top of the screen and toggle <strong>Location off</strong>. The recipient gets the photo without coordinates while your original keeps them — usually the ideal arrangement, since your own library remains organized by place.
            </p>

            <h2>Remove GPS Data on Android</h2>

            <p>
              In <strong>Google Photos</strong>, open the photo, tap the three-dot menu or the info icon, tap the edit (pencil) icon next to the location entry, and choose <strong>Remove location</strong>. Note that on some Android versions this only removes the location from Google Photos' database; the copy shared from other apps may still contain the original EXIF. To be certain, share the photo from within Google Photos itself, or verify the shared file with a <Link href="/gps-finder">GPS checker</Link> afterwards.
            </p>

            <p>
              Samsung Gallery users: open the photo, tap the info icon, tap <strong>Edit</strong>, and delete the location entry. Most other OEM gallery apps offer an equivalent under photo details.
            </p>

            <h2>Remove GPS Data on Windows</h2>

            <p>
              Windows can strip metadata without any extra software. Right-click the photo → <strong>Properties</strong> → <strong>Details</strong> tab → click <strong>Remove Properties and Personal Information</strong> at the bottom. Choose <strong>Create a copy with all possible properties removed</strong> to get a cleaned duplicate next to the original, or select <strong>Remove the following properties from this file</strong> and tick only the GPS fields to strip location while keeping camera settings and dates.
            </p>

            <p>
              The selective option is worth using: capture dates are useful for sorting, and there is no privacy reason to delete your camera's aperture setting. Only the GPS block reveals where you were.
            </p>

            <h2>Remove GPS Data on Mac</h2>

            <p>
              Open the photo in <strong>Preview</strong>, press <strong>Command-I</strong> to open the inspector, select the <strong>GPS tab</strong>, and click <strong>Remove Location Info</strong> at the bottom of the panel. Save the file and the coordinates are gone. In the Photos app on macOS, you can instead use <strong>Image → Location → Hide Location</strong>, and like iOS, the share sheet offers per-share location stripping.
            </p>

            <h2>Does Social Media Strip GPS for You?</h2>

            <p>
              Mostly yes — but with important caveats. Instagram, Facebook, Twitter/X, WhatsApp, and most large platforms remove EXIF metadata server-side when you upload, which is why photos downloaded from social media never contain GPS. However:
            </p>

            <ul>
              <li><strong>The platform reads the data before stripping it.</strong> Deleting GPS protects viewers from seeing your location, not the platform from knowing it.</li>
              <li><strong>Email and cloud links do not strip anything.</strong> A photo attached to an email or shared via a Google Drive / Dropbox link arrives byte-for-byte identical, GPS included.</li>
              <li><strong>Marketplace and forum uploads vary.</strong> Smaller sites, classified-ad platforms, and self-hosted forums often keep original files untouched — these are exactly the places where a home address leak matters most.</li>
            </ul>

            <p>
              The safe rule: if the destination is not one of the major social networks, strip GPS yourself before uploading, then verify with a checker.
            </p>

            <h2>When You Want the Opposite: Adding Location Back</h2>

            <p>
              Removing GPS is the right call for public sharing — but the same metadata is valuable in your own archive. Photos with location sort themselves into trip albums, appear on map views, and remain searchable by place years later. A sensible workflow is to keep GPS in your originals (adding it with <Link href="/">FreeGeoTagger</Link> where it is missing) and strip it only from the copies you publish.
            </p>

            <p>
              If sharing accidentally stripped location from photos you wanted to keep tagged — a common casualty of WhatsApp transfers — you can restore the coordinates in seconds: upload the photos, pin the spot on the map, and download. Our guides for <Link href="/blog/how-to-add-gps-to-iphone-photos">iPhone</Link> and <Link href="/blog/how-to-geotag-photos-android">Android</Link> walk through it step by step.
            </p>

            <h2>Conclusion</h2>

            <p>
              GPS metadata is a tool, not a threat — as long as you control where it goes. Check photos before publishing them anywhere that preserves original files, use your platform's built-in removal for public shares, and keep location data in your private archive where it does its best work. Two free tools cover the whole workflow: the <Link href="/gps-finder">GPS Finder</Link> to see what a photo contains, and <Link href="/">FreeGeoTagger</Link> to add or update coordinates when you need them — both running entirely in your browser, with your photos never leaving your device.
            </p>

            <BlogFaq slug="how-to-remove-gps-data-from-photos" />

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
                href="/blog/how-to-fix-wrong-gps-location-on-photos"
                className="group flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-snug mb-1 group-hover:text-primary transition-colors">
                    How to Fix a Wrong GPS Location on a Photo
                  </p>
                  <p className="text-xs text-muted-foreground">6 min read</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-0.5" />
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center">
            <h3 className="font-display font-bold text-lg mb-2">Check what's inside your photos</h3>
            <p className="text-sm text-muted-foreground mb-4">Free, private, browser-based. Your photos never leave your device.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <EclipseButton
                text="Check Photo GPS"
                leftIcon={<MapPin className="h-4 w-4" />}
                onClick={() => navigate("/gps-finder")}
              />
              <EclipseButton
                text="Geotag Photos Free"
                variant="outline"
                onClick={() => navigate("/")}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
