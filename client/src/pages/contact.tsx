import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Mail } from "lucide-react";
import { Link } from "wouter";
import { updatePageSEO, injectPageSchema, SEO_CONFIG } from "@/lib/seo";

export default function Contact() {
  useEffect(() => {
    updatePageSEO(SEO_CONFIG.contact);

    injectPageSchema("contact-webpage", {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact FreeGeoTagger",
      "url": "https://freegeotagger.com/contact",
      "description": SEO_CONFIG.contact.description,
      "inLanguage": "en-US",
      "isPartOf": { "@type": "WebSite", "name": "FreeGeoTagger", "url": "https://freegeotagger.com" },
      "publisher": {
        "@type": "Organization",
        "name": "FreeGeoTagger",
        "url": "https://freegeotagger.com",
        "email": "contact@freegeotagger.com",
        "logo": { "@type": "ImageObject", "url": "https://freegeotagger.com/favicon.png" },
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "contact@freegeotagger.com",
          "contactType": "customer support",
          "availableLanguage": "English"
        }
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://freegeotagger.com/" },
          { "@type": "ListItem", "position": 2, "name": "Contact", "item": "https://freegeotagger.com/contact" }
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
          <span className="text-foreground">Contact</span>
        </nav>

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8" data-testid="link-back">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-6" data-testid="text-title">Contact FreeGeoTagger</h1>

        <div className="mb-10 p-6 rounded-2xl bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </span>
            <div>
              <p className="font-semibold mb-1">Email us</p>
              <a
                href="mailto:contact@freegeotagger.com"
                className="text-primary text-lg font-medium hover:underline"
                data-testid="link-email"
              >
                contact@freegeotagger.com
              </a>
              <p className="text-sm text-muted-foreground mt-2">
                A real, monitored inbox — not a no-reply address.
              </p>
            </div>
          </div>
        </div>

        <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary">

          <p>
            We read every message that arrives. Email is the fastest way to reach us, and you never need an account to get help with anything on this site.
          </p>

          <h2>What we can help with</h2>

          <p>
            Most of what people write in about falls into a handful of categories, and we are happy to help with all of them:
          </p>

          <ul>
            <li><strong>A photo that will not work.</strong> If a particular file fails to geotag or shows no location when you expect one, tell us the file format, the device that took it, and the browser you are using. Format edge cases are the most common cause and the most useful for us to hear about.</li>
            <li><strong>Bug reports.</strong> Something visibly broken, a button that does nothing, a map that will not load, a layout problem on your phone. Include your browser and, if you can, whether the browser console shows an error.</li>
            <li><strong>Corrections to our guides.</strong> If something in one of our <Link href="/blog">articles</Link> is out of date, imprecise or simply wrong, we want to fix it. Point us at the sentence.</li>
            <li><strong>Privacy questions and requests.</strong> Anything about how data is handled, or a request under GDPR or CCPA. Our <Link href="/privacy">Privacy Policy</Link> covers the detail, but ask if anything is unclear.</li>
            <li><strong>Feature suggestions.</strong> Tell us what you were trying to do and where the tool got in your way. That framing is far more useful to us than a feature name.</li>
            <li><strong>Media and partnership enquiries.</strong> Put "Partnership" in the subject line so it does not get lost.</li>
          </ul>

          <h2>How to get a useful answer quickly</h2>

          <p>
            Diagnosing a metadata problem remotely is much easier with a little context. If you are reporting something that is not working, including these three things will usually save a round trip:
          </p>

          <ul>
            <li><strong>The page URL</strong> you were on when it happened.</li>
            <li><strong>Your browser and device</strong> — for example "Safari on iPhone 14" or "Chrome on Windows 11".</li>
            <li><strong>The file type</strong> involved, and where it came from — a phone camera, a download, a screenshot, or an export from another app.</li>
          </ul>

          <p>
            Please do <strong>not</strong> attach the photo itself unless we ask. We do not want or need your images, and the whole point of the tool is that they stay on your device.
          </p>

          <h2>Answers you may not need to wait for</h2>

          <p>
            A few questions come up often enough that the answer is already written down:
          </p>

          <ul>
            <li><strong>Are my photos uploaded anywhere?</strong> No. Everything happens in your browser — the mechanism is explained in our <Link href="/privacy">Privacy Policy</Link>.</li>
            <li><strong>My photo has no location data. Why?</strong> Usually location services were off, or the file came from social media, which strips metadata. Our guide on <Link href="/blog/how-to-fix-wrong-gps-location-on-photos">fixing photo GPS data</Link> covers the causes.</li>
            <li><strong>The location on my photo is wrong.</strong> You can overwrite it — see the same guide above.</li>
            <li><strong>Can I do many photos at once?</strong> Yes, batch mode does exactly that. See <Link href="/blog/how-to-bulk-geotag-photos">bulk geotagging</Link>.</li>
            <li><strong>How do I check what a photo contains?</strong> Use the <Link href="/gps-finder">GPS Finder</Link>.</li>
          </ul>

          <h2>Other pages you might be looking for</h2>

          <p>
            <Link href="/about">About FreeGeoTagger</Link> explains who we are and why the tool works the way it does. <Link href="/terms">Terms of Service</Link> and <Link href="/cookies">Cookie Policy</Link> cover the legal and consent side.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
