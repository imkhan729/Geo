import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { updatePageSEO, injectPageSchema, SEO_CONFIG } from "@/lib/seo";

/** Keep in sync with the "Last updated" line rendered below. */
const LAST_UPDATED = "July 26, 2026";

export default function Privacy() {
  useEffect(() => {
    updatePageSEO(SEO_CONFIG.privacy);

    injectPageSchema('privacy-webpage', {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": SEO_CONFIG.privacy.title,
      "url": "https://freegeotagger.com/privacy",
      "description": SEO_CONFIG.privacy.description,
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
          { "@type": "ListItem", "position": 2, "name": "Privacy Policy", "item": "https://freegeotagger.com/privacy" }
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
          <span className="text-foreground">Privacy Policy</span>
        </nav>

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8" data-testid="link-back">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-3" data-testid="text-title">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: {LAST_UPDATED}</p>

        <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary">

          <h2>The short version</h2>

          <p>
            FreeGeoTagger is a browser-based tool for adding, reading and editing GPS location data in photos. The single most important thing to know about privacy here is this: <strong>your photos are never uploaded to us.</strong> Every image you open in FreeGeoTagger is read, modified and saved entirely by JavaScript running inside your own browser tab. There is no server-side image processing, no temporary upload, and no copy of your photo on any machine but your own.
          </p>

          <p>
            We do not ask you to create an account. We do not ask for your name or email to use the tools. We do collect anonymous, consent-gated analytics about page visits, and we show advertising to keep the tools free. Those two things — analytics and ads — are the only places where third parties are involved, and both are described in detail below.
          </p>

          <h2>Who we are</h2>

          <p>
            FreeGeoTagger operates the website at <strong>freegeotagger.com</strong>, which provides a free photo geotagging tool and a free <Link href="/gps-finder">GPS Finder</Link> for reading location data out of existing photos. For any privacy question or request, contact us at <a href="mailto:contact@freegeotagger.com">contact@freegeotagger.com</a>. You can also use our <Link href="/contact">contact page</Link>.
          </p>

          <h2>Your photos: processed locally, never uploaded</h2>

          <p>
            This is the part most people want to understand properly, so here is the actual mechanism rather than a vague reassurance.
          </p>

          <p>
            When you select a photo, your browser hands our JavaScript a reference to that file from your own file system. We read the file's bytes in memory, locate the EXIF metadata block, write or read the GPS fields inside it, and then hand the resulting bytes back to your browser as a download. The pixel data of your image is never touched, which is why geotagging with this tool causes zero quality loss — only the metadata section changes.
          </p>

          <p>
            Because all of that happens in the page itself, there is no network request carrying your image anywhere. If you want to verify this rather than take our word for it, open your browser's developer tools, switch to the Network tab, and geotag a photo. You will see no upload request. You can also disconnect from the internet after the page has loaded and the tool will continue to work.
          </p>

          <ul>
            <li><strong>Your photos are not stored on our servers</strong> — they never reach our servers at all.</li>
            <li><strong>Your photos are not retained anywhere</strong> — when you close or reload the tab, the in-memory copy is discarded.</li>
            <li><strong>Your GPS coordinates are not logged</strong> — the location you pin is used only to write into your file.</li>
            <li><strong>HEIC conversion is also local</strong> — iPhone HEIC files are converted to JPEG in your browser, not on a server.</li>
          </ul>

          <h2>Location and device permissions</h2>

          <p>
            The tool offers a "use my current location" option. If you choose it, your browser will ask for permission to share your device location, and the resulting coordinates are used only to place the map pin and to write into your photo's metadata. We do not transmit or store your device location. You can decline the permission and still use every other feature by clicking the map or searching an address instead.
          </p>

          <h2>What data we do collect</h2>

          <p>
            We collect analytics about how the website is used, so we know which guides are useful and which pages are broken. We use <strong>Google Analytics 4</strong> for this. It records things like which pages were viewed, approximate geographic region, device type, browser, and how visitors arrived. It does not receive your photos, your pinned coordinates, or any file you open.
          </p>

          <p>
            Analytics storage is <strong>denied by default</strong> until you accept cookies. Until you do, Google Analytics runs in a restricted, cookieless mode that cannot identify a returning visitor. This is implemented with Google Consent Mode v2, which sets consent signals before any measurement or advertising script is allowed to load.
          </p>

          <p>
            Separately, our hosting provider keeps standard server access logs, which typically include IP address, timestamp, requested URL and user agent. These are ordinary security and operations records common to every website.
          </p>

          <h2>Cookies and browser storage</h2>

          <p>
            FreeGeoTagger itself stores only two small values in your browser's local storage, and neither is a tracking identifier:
          </p>

          <ul>
            <li><strong>Your cookie choice</strong> — so the consent banner does not reappear on every visit.</li>
            <li><strong>Your theme preference</strong> — whether you chose light or dark mode.</li>
          </ul>

          <p>
            Advertising and analytics cookies are set by Google, not by us, and only after you accept. Our <Link href="/cookies">Cookie Policy</Link> lists what these do and how to remove them.
          </p>

          <h2>Third-party services and what each one receives</h2>

          <p>
            We keep third parties to a minimum, but the map and the ads do involve other companies. Here is exactly what each one sees:
          </p>

          <ul>
            <li><strong>OpenStreetMap</strong> — serves the map image tiles. To draw a map it necessarily receives requests for the tiles covering the area you are looking at, along with your IP address. It does not receive your photo.</li>
            <li><strong>Nominatim</strong> — powers address and place-name search. When you type a search, that text is sent to Nominatim to be resolved into coordinates. Do not type sensitive information into the search box. It does not receive your photo.</li>
            <li><strong>Google AdSense</strong> — serves the advertising that funds the site. After consent, Google may use cookies to select, measure and cap ads. It does not receive your photo.</li>
            <li><strong>Google Analytics 4</strong> — anonymous usage measurement, consent-gated as described above. It does not receive your photo.</li>
            <li><strong>Hostinger</strong> — our web host, which serves the site's files and keeps standard access logs.</li>
          </ul>

          <p>
            Each of these operates under its own privacy policy, and we have no control over their internal practices.
          </p>

          <h2>Advertising and personalisation</h2>

          <p>
            Advertising is what makes it possible to offer these tools free, with no account and no file limits. Third-party vendors including Google use cookies to serve ads based on prior visits to this and other websites. You can opt out of personalised advertising at any time through Google's Ads Settings, and you can decline advertising cookies entirely using our consent banner — the tools work identically either way.
          </p>

          <h2>Your rights</h2>

          <p>
            If you are in the European Economic Area or the UK, the GDPR gives you the right to access, correct, delete, restrict, port and object to processing of your personal data, and to withdraw consent at any time. Our lawful bases are consent for analytics and advertising cookies, and legitimate interests for basic security logging.
          </p>

          <p>
            If you are a California resident, the CCPA and CPRA give you the right to know what personal information is collected, to request deletion, to correct inaccurate information, and to opt out of the sale or sharing of personal information. <strong>We do not sell your personal information.</strong>
          </p>

          <p>
            In practice we hold very little about you, because the tools require no account and your photos never reach us. To exercise any right, email <a href="mailto:contact@freegeotagger.com">contact@freegeotagger.com</a>. You may also withdraw cookie consent yourself at any time by clearing your browser's site data for freegeotagger.com.
          </p>

          <h2>Data retention</h2>

          <p>
            Photos: not retained, because they are never received. Consent and theme preferences: stored in your browser until you clear them. Analytics data: retained according to the retention period configured in Google Analytics. Server access logs: retained by our host under its standard schedule.
          </p>

          <h2>Children's privacy</h2>

          <p>
            FreeGeoTagger is a general-purpose utility and is not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has provided personal information, contact us and we will delete it.
          </p>

          <h2>Security</h2>

          <p>
            The site is served over HTTPS with HSTS enabled, so traffic between your browser and our host is encrypted. Because your photos are processed locally and never transmitted, the most common risk in online photo tools — a server-side breach exposing uploaded images — does not apply here.
          </p>

          <h2>International visitors</h2>

          <p>
            The site is available worldwide. Our third-party providers, including Google, may process data in countries other than your own, including the United States, under their own transfer safeguards.
          </p>

          <h2>Changes to this policy</h2>

          <p>
            If we change how data is handled, we will update this page and revise the "last updated" date above. Material changes affecting consent will be reflected in the consent banner.
          </p>

          <h2>Contact us</h2>

          <p>
            Questions about this policy, or a privacy request: <a href="mailto:contact@freegeotagger.com">contact@freegeotagger.com</a>. Please include the URL of the page you are asking about. See also our <Link href="/terms">Terms of Service</Link> and <Link href="/cookies">Cookie Policy</Link>.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
