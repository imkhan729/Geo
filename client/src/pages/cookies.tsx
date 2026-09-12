import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { updatePageSEO, injectPageSchema, SEO_CONFIG } from "@/lib/seo";

/** Keep in sync with the "Last updated" line rendered below. */
const LAST_UPDATED = "July 26, 2026";

export default function Cookies() {
  useEffect(() => {
    updatePageSEO(SEO_CONFIG.cookies);

    injectPageSchema('cookies-webpage', {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": SEO_CONFIG.cookies.title,
      "url": "https://freegeotagger.com/cookies",
      "description": SEO_CONFIG.cookies.description,
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
          { "@type": "ListItem", "position": 2, "name": "Cookie Policy", "item": "https://freegeotagger.com/cookies" }
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
          <span className="text-foreground">Cookie Policy</span>
        </nav>

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8" data-testid="link-back">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-3" data-testid="text-title">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: {LAST_UPDATED}</p>

        <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary">

          <h2>What this policy covers</h2>

          <p>
            This policy explains what cookies and similar browser storage FreeGeoTagger uses, what each one is for, who sets it, and how to remove or refuse it. It sits alongside our <Link href="/privacy">Privacy Policy</Link>, which covers data handling more broadly — including the important point that your photos are processed entirely in your browser and are never uploaded to us.
          </p>

          <h2>What cookies and local storage actually are</h2>

          <p>
            A cookie is a small text file a website asks your browser to keep, and which the browser sends back on later visits. Local storage is a related mechanism that keeps small values in your browser but, unlike a cookie, is never automatically transmitted with requests.
          </p>

          <p>
            This distinction matters here, because the only values <em>FreeGeoTagger itself</em> stores are in local storage, not cookies, and they never leave your device.
          </p>

          <h2>What FreeGeoTagger stores directly</h2>

          <p>
            Two values, both strictly functional, both in local storage:
          </p>

          <ul>
            <li><strong>Your cookie choice.</strong> Records whether you accepted or declined non-essential cookies, so the consent banner does not reappear on every page view. Without it we would have to ask you again constantly.</li>
            <li><strong>Your theme preference.</strong> Records whether you selected light or dark mode, so the site does not flip back every time you navigate.</li>
          </ul>

          <p>
            Neither contains a tracking identifier, neither is shared with anyone, and neither is used to profile you. They persist until you clear your browser's site data.
          </p>

          <h2>Third-party cookies</h2>

          <p>
            The cookies that are set by other companies fall into two groups.
          </p>

          <h3>Advertising cookies — Google AdSense</h3>

          <p>
            Advertising is what keeps these tools free with no account and no file limits. When advertising is served, Google and its partners may set cookies to select which ads to show, to measure whether an ad was seen or clicked, and to limit how many times you see the same ad. If you have consented to personalised advertising, these may also draw on your prior browsing across other sites.
          </p>

          <h3>Analytics cookies — Google Analytics 4</h3>

          <p>
            We use Google Analytics to understand which pages and guides people actually find useful, and to spot pages that are broken or slow. It records page views, approximate region, device and browser type, and how visitors arrived. It never receives your photos or the coordinates you pin.
          </p>

          <h2>Consent: nothing non-essential loads until you agree</h2>

          <p>
            FreeGeoTagger implements <strong>Google Consent Mode v2</strong>. Before any advertising or analytics script is allowed to run, consent signals are set to <em>denied</em> by default for ad storage, ad user data, ad personalisation and analytics storage.
          </p>

          <p>
            The practical effect is that on your first visit, and for as long as you decline, Google's scripts operate in a restricted mode that cannot write identifying cookies or recognise you as a returning visitor. Only after you press <strong>Accept</strong> on the consent banner are those signals updated to <em>granted</em>.
          </p>

          <p>
            Declining costs you nothing. The geotagging tool and the <Link href="/gps-finder">GPS Finder</Link> work identically either way, because they never depended on cookies in the first place.
          </p>

          <h2>Map services and what they receive</h2>

          <p>
            The interactive map loads its image tiles from OpenStreetMap, and address search is resolved by Nominatim. Drawing a map necessarily involves requesting the tiles for the area you are viewing, and searching necessarily involves sending your search text to be geocoded. These providers may set their own cookies and will see your IP address as part of any ordinary web request.
          </p>

          <p>
            Neither service receives your photo. Do avoid typing sensitive information into the address search box, since that text is sent to a third party to be resolved.
          </p>

          <h2>How to control or delete cookies</h2>

          <p>
            You have several independent levers, and you can use any combination of them:
          </p>

          <ul>
            <li><strong>Our consent banner.</strong> Choose Decline to withhold advertising and analytics consent.</li>
            <li><strong>Clear site data.</strong> Clearing cookies and site data for freegeotagger.com removes your stored consent choice and theme preference, and resets consent to denied. The banner will then appear again.</li>
            <li><strong>Browser settings.</strong> Chrome, Firefox, Safari and Edge all let you block or delete cookies generally, or block third-party cookies specifically. Look for Privacy and Security in your browser's settings.</li>
            <li><strong>Google Ads Settings.</strong> Opt out of personalised advertising across Google's services from your Google account, independently of this site.</li>
            <li><strong>Private browsing.</strong> An incognito or private window discards cookies and local storage when you close it.</li>
          </ul>

          <p>
            Blocking cookies entirely will not break the geotagging tools. It may mean the consent banner reappears on each visit and your theme choice is not remembered, because the values that record those preferences are themselves the thing being cleared.
          </p>

          <h2>Do Not Track</h2>

          <p>
            There is still no agreed industry standard for how sites should respond to browser Do Not Track headers, so we do not rely on them. Our consent banner is the mechanism that actually governs whether non-essential storage is used, and it applies regardless of your DNT setting.
          </p>

          <h2>Changes to this policy</h2>

          <p>
            If we add, remove or change a cookie or a third-party service, we will update this page and revise the date above. Where a change affects consent, it will be reflected in the consent banner.
          </p>

          <h2>Contact</h2>

          <p>
            Questions about cookies or consent on this site: <a href="mailto:contact@freegeotagger.com">contact@freegeotagger.com</a>. See also our <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms of Service</Link>.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
