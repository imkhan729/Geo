import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Mail, Clock, ShieldCheck, HelpCircle, AlertTriangle, MessageSquare, Bug, Compass, Sparkles, ExternalLink, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { updatePageSEO, injectPageSchema, SEO_CONFIG } from "@/lib/seo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const CONTACT_FAQS = [
  {
    q: "How quickly will I receive a response to my email?",
    a: "Every email sent to contact@freegeotagger.com is routed directly to our core engineering team. We review incoming messages daily and typically respond within 24 to 48 business hours. If you are reporting a critical browser crash, severe metadata corruption bug, or security vulnerability, your inquiry is prioritized for immediate triage."
  },
  {
    q: "Can you recover original GPS location data from a photo sent via WhatsApp, Facebook, or Instagram?",
    a: "Unfortunately, no. When images are uploaded to social media platforms or messaging applications (including WhatsApp, Instagram, Twitter/X, Telegram, and Facebook), their backend ingestion servers deliberately re-encode and compress the image, permanently stripping all EXIF metadata tags—including GPS IFD coordinates, camera serial numbers, and timestamps. Once stripped by social media servers, original coordinates cannot be recovered from the downloaded file. You must locate the original image stored on the taking device or camera memory card."
  },
  {
    q: "Do you offer a cloud API or server-side SDK for bulk photo geotagging?",
    a: "FreeGeoTagger is architecturally committed to zero-server processing. We do not operate cloud photo ingestion endpoints because doing so would violate our core Zero-Upload Invariant. However, our browser-native client supports high-speed client-side batch processing capable of tagging hundreds of photos locally using multi-core worker threads without sending a single byte to our servers."
  },
  {
    q: "Can FreeGeoTagger be used completely offline or within air-gapped secure environments?",
    a: "Yes. Once the web application and its interactive Leaflet map tiles are cached in your browser, the metadata parsing and EXIF encoding engines function completely offline. You can test this by loading FreeGeoTagger, enabling Airplane Mode, and dropping images onto our tool—metadata extraction, coordinate assignment, and file downloads will continue without interruption."
  }
];

export default function Contact() {
  useEffect(() => {
    updatePageSEO(SEO_CONFIG.contact);

    injectPageSchema("contact-webpage", {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact FreeGeoTagger Support & Engineering",
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
          "contactType": "technical support",
          "availableLanguage": ["English"],
          "hoursAvailable": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "opens": "09:00",
            "closes": "17:00"
          }
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

    injectPageSchema("contact-faq-schema", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": CONTACT_FAQS.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" tabIndex={-1} className="outline-none container mx-auto px-4 py-12 max-w-4xl">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground">Contact</span>
        </nav>

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8" data-testid="link-back">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" data-testid="text-title">
          Contact FreeGeoTagger Support & Engineering
        </h1>
        <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
          Connect directly with the software engineers and metadata specialists behind FreeGeoTagger. Whether you are troubleshooting an exotic camera RAW format, reporting a browser compatibility edge case, or requesting workflow features, we are here to help.
        </p>

        {/* Primary Contact Channel Card */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-6 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col justify-between">
            <div className="flex items-start gap-4 mb-4">
              <span className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mail className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">Direct Engineering Inbox</h2>
                <a
                  href="mailto:contact@freegeotagger.com"
                  className="text-primary text-xl font-semibold hover:underline break-all"
                  data-testid="link-email"
                >
                  contact@freegeotagger.com
                </a>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Monitored directly by our software development and geodetic metadata specialists. No AI gatekeepers, no automated ticket deflection.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-primary/10">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-primary" /> Response SLA: 24–48 Business Hours
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Security & Vulnerability Priority
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-center">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Zero-Account Access
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              You never need an account, subscription tier, or customer ID to receive technical assistance with our tools.
            </p>
            <div className="text-xs font-mono bg-muted/60 p-2.5 rounded-lg border border-border/50 text-muted-foreground">
              PGP / MIME Support Available upon Request
            </div>
          </div>
        </div>

        <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary">

          <p>
            FreeGeoTagger is engineered to operate seamlessly as an in-browser utility. Because all image decoding, coordinate manipulation, and EXIF binary serialization occur directly on your local device hardware, our support model is focused entirely on client-side compatibility, geodetic precision, and user experience excellence. We read every email sent to our inbox and provide detailed, technical answers directly from our developer team.
          </p>

          <h2>What We Can Assist You With</h2>

          <p>
            Our engineering team actively monitors and responds to user inquiries across several specialized categories:
          </p>

          <h3>1. Metadata Parsing &amp; EXIF Standardization Anomalies</h3>
          <p>
            If a particular image file fails to display coordinates, throws an unexpected binary parsing error, or loses metadata upon export, our team can help diagnose the underlying issue. Digital cameras, smartphones, drones, and post-processing software encode EXIF headers with subtle differences. We routinely analyze non-standard TIFF header offsets, proprietary maker note tags (from Sony, Canon, Nikon, Fujifilm, and DJI), and container quirks in Apple HEIC/HEIF files to improve our client-side parsing libraries.
          </p>

          <h3>2. Browser &amp; Hardware Compatibility Edge Cases</h3>
          <p>
            FreeGeoTagger is built on modern web standards including WebGL, the HTML5 File API, typed binary arrays, and the Leaflet mapping engine. If you encounter rendering glitches, canvas memory limits on iOS Safari, input focus issues on mobile devices, or screen reader accessibility barriers, please notify us. We are committed to maintaining flawless cross-platform performance across Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge, and mobile browsers.
          </p>

          <h3>3. Field Workflow Suggestions &amp; Community Input</h3>
          <p>
            Many of our most popular features—including CSV coordinate imports, tokenized batch file renaming, and multi-format coordinate conversion—originated as suggestions from real-world surveyors, GIS specialists, drone pilots, and real estate professionals. Tell us about your workflow bottlenecks and how FreeGeoTagger can be optimized for your field operations.
          </p>

          <h3>4. Responsible Security &amp; Vulnerability Disclosures</h3>
          <p>
            We take web application security seriously. If you discover a potential vulnerability—such as a Content Security Policy bypass, a client-side memory safety flaw in our binary parsing logic, or an outdated third-party library dependency—please email us with the subject line <code>Security Disclosure</code>. We triage security reports within 24 hours and practice coordinated disclosure.
          </p>

          <h3>5. Privacy Verification &amp; Technical Inquiries</h3>
          <p>
            Our architectural hallmark is the Zero-Upload Invariant: your photos are processed entirely inside your browser and are never transmitted to our servers. If you represent an enterprise compliance team, educational institution, or privacy audit organization seeking technical validation of our browser-local execution model, we are happy to answer your architectural questions.
          </p>

          <h3>6. Academic, Media, &amp; Partnership Inquiries</h3>
          <p>
            Journalists, technology educators, and open-web advocates seeking commentary on image metadata standards, geolocation privacy, or client-side web development are welcome to reach out. Please include your publication name and deadline in the email subject.
          </p>

          <h2>How to Get an Actionable Resolution Rapidly</h2>

          <p>
            Because FreeGeoTagger does not track your user session, collect behavioral telemetry, or store server-side error logs, our engineers cannot inspect what happened on your screen unless you tell us. When writing in about a bug or unexpected behavior, providing these four pieces of context will save unnecessary back-and-forth:
          </p>

          <ul>
            <li><strong>Tool URL &amp; Workflow:</strong> Specify which page you were using, such as the <Link href="/">Single Geotagger</Link>, the <Link href="/batch-geotag-photos">Batch Geotagging Tool</Link>, the <Link href="/gps-finder">GPS Photo Finder</Link>, or the <Link href="/exif-viewer">EXIF Metadata Viewer</Link>.</li>
            <li><strong>Device, Operating System &amp; Browser:</strong> Let us know your exact platform—for example, "Chrome 124 on Windows 11", "Safari 17 on iOS 17.4", or "Firefox 125 on Ubuntu Linux".</li>
            <li><strong>Source File Characteristics:</strong> Detail the file format (JPEG, PNG, WebP, HEIC), approximate file size, and the device or software that produced it (e.g., "DJI Mini 4 Pro drone JPEG", "iPhone 15 Pro Max 48MP HEIC", or "Adobe Lightroom Classic export").</li>
            <li><strong>Browser Developer Console Errors:</strong> If you are on a desktop computer, open the developer tools (<kbd>F12</kbd> or <kbd>Ctrl+Shift+I</kbd> on Windows; <kbd>Cmd+Option+I</kbd> on macOS), navigate to the <em>Console</em> tab, and paste any red error messages into your message.</li>
          </ul>

          <h2>Zero-Upload Privacy Policy: Do Not Attach Sensitive Photos</h2>

          <p>
            FreeGeoTagger exists precisely to eliminate the privacy hazard of sending personal photographs to cloud servers. Email is an unencrypted, insecure communication channel. Please do <strong>not</strong> attach private photos of your family, home, or confidential property to your email.
          </p>

          <p>
            If an EXIF parsing bug is specific to a particular file, we recommend recreating the issue with an innocuous test image (such as pointing your camera at a blank desk or wall) that produces the same error, or stripping the image pixel data while preserving the header. We will never ask you to email private or sensitive imagery.
          </p>

          <h2>Instant Self-Service: Immediate Solutions</h2>

          <p>
            Before sending an email, review our suite of browser-native utilities. The solution you need may already be available directly in our tool ecosystem:
          </p>

          <ul>
            <li><strong><Link href="/">Single Photo Geotagger</Link>:</strong> Add, overwrite, or update GPS coordinates on individual photos with an interactive Leaflet map and geocoding search.</li>
            <li><strong><Link href="/gps-finder">GPS Photo Finder</Link>:</strong> Inspect whether an existing image already has embedded location tags, display the pin on a map, and copy decimal or DMS coordinates.</li>
            <li><strong><Link href="/exif-viewer">EXIF Metadata Viewer</Link>:</strong> Perform deep forensic inspection of camera hardware tags, exposure parameters, lens specifications, and color profiles.</li>
            <li><strong><Link href="/remove-gps-from-photo">Remove GPS from Photo</Link>:</strong> Strip sensitive latitude, longitude, and altitude tags before publishing images online, with optional full EXIF wipe.</li>
            <li><strong><Link href="/coordinate-converter">Coordinate Converter</Link>:</strong> Convert coordinates seamlessly between Decimal Degrees (DD), Degrees Minutes Seconds (DMS), Degrees Decimal Minutes (DDM), and UTM.</li>
            <li><strong><Link href="/batch-geotag-photos">Batch Geotag Photos</Link>:</strong> Process dozens or hundreds of images simultaneously with multi-selection group mapping, CSV coordinate imports, and ZIP export.</li>
          </ul>

          <h2>In-Depth Educational Documentation &amp; Step-by-Step Guides</h2>

          <p>
            We have authored comprehensive technical guides covering mobile device settings, local search optimization, and metadata fundamentals:
          </p>

          <ul>
            <li><Link href="/blog/how-to-fix-wrong-gps-location-on-photos">How to Fix or Change the Wrong GPS Location on a Photo</Link> — Step-by-step instructions for troubleshooting inaccurate phone coordinates and correcting location tags.</li>
            <li><Link href="/blog/how-to-remove-gps-data-from-photos">How to Remove GPS Location Data from Photos</Link> — Comprehensive tutorial on protecting personal privacy before uploading images to social networks or classified listings.</li>
            <li><Link href="/blog/how-to-add-gps-to-iphone-photos">How to Add GPS to iPhone Photos</Link> — Learn how to configure iOS location permissions, handle Apple HEIC formats, and geotag iPhone photos.</li>
            <li><Link href="/blog/how-to-geotag-photos-android">How to Add GPS Coordinates to Android Photos</Link> — Complete guide to Android camera location settings and Google Photos metadata handling.</li>
            <li><Link href="/blog/how-to-geotag-photos-for-google-business-profile">How to Geotag Photos for Google Business Profile</Link> — Strategies for leveraging geotagged business photos to improve local SEO search rankings and customer trust.</li>
            <li><Link href="/blog/how-to-geotag-photos-for-real-estate">How to Geotag Real Estate Photos for MLS Listings</Link> — Best practices for real estate photographers, virtual tours, and property portal compliance.</li>
            <li><Link href="/blog/how-to-bulk-geotag-photos">How to Bulk Geotag Photos: Add GPS to Hundreds of Images</Link> — High-efficiency workflows for batch processing drone surveys, event portfolios, and commercial projects.</li>
            <li><Link href="/blog/best-free-photo-geotagging-tools">Best Free Photo Geotagging Tools: Complete Comparison</Link> — An honest breakdown of browser-based, desktop, and command-line geotagging utilities.</li>
            <li><Link href="/blog/what-is-exif-gps-metadata">What Is EXIF GPS Metadata? Complete Technical Guide</Link> — An authoritative exploration of EXIF 2.32 tags, WGS84 datum specs, and binary storage formats.</li>
          </ul>

          <h2>Frequently Asked Support Questions</h2>

          <h3>How quickly will I receive a response to my email?</h3>
          <p>
            Every email sent to contact@freegeotagger.com is routed directly to our core engineering team. We review incoming messages daily and typically respond within 24 to 48 business hours. If you are reporting a critical browser crash, severe metadata corruption bug, or security vulnerability, your inquiry is prioritized for immediate triage.
          </p>

          <h3>Can you recover original GPS location data from a photo sent via WhatsApp, Facebook, or Instagram?</h3>
          <p>
            Unfortunately, no. When images are uploaded to social media platforms or messaging applications (including WhatsApp, Instagram, Twitter/X, Telegram, and Facebook), their backend ingestion servers deliberately re-encode and compress the image, permanently stripping all EXIF metadata tags—including GPS IFD coordinates, camera serial numbers, and timestamps. Once stripped by social media servers, original coordinates cannot be recovered from the downloaded file. You must locate the original image stored on the taking device or camera memory card.
          </p>

          <h3>Do you offer a cloud API or server-side SDK for bulk photo geotagging?</h3>
          <p>
            FreeGeoTagger is architecturally committed to zero-server processing. We do not operate cloud photo ingestion endpoints because doing so would violate our core Zero-Upload Invariant. However, our browser-native client supports high-speed client-side batch processing capable of tagging hundreds of photos locally using multi-core worker threads without sending a single byte to our servers.
          </p>

          <h3>Can FreeGeoTagger be used completely offline or within air-gapped secure environments?</h3>
          <p>
            Yes. Once the web application and its interactive Leaflet map tiles are cached in your browser, the metadata parsing and EXIF encoding engines function completely offline. You can test this by loading FreeGeoTagger, enabling Airplane Mode, and dropping images onto our tool—metadata extraction, coordinate assignment, and file downloads will continue without interruption.
          </p>

          <h2>Legal, Governance &amp; Trust Resources</h2>

          <p>
            Transparency is central to everything we do. For full details on our policies and operations, explore our governance documentation:
          </p>

          <ul>
            <li><Link href="/about">About FreeGeoTagger</Link> — Learn about our founding mission, engineering principles, and browser-native philosophy.</li>
            <li><Link href="/privacy">Privacy Policy</Link> — Transparent breakdown of our Zero-Upload Invariant, cookie policies, and data processing practices.</li>
            <li><Link href="/terms">Terms of Service</Link> — Clear, plain-language usage terms for individuals and commercial organizations.</li>
            <li><Link href="/cookies">Cookie Policy</Link> — Comprehensive disclosure of cookie usage, consent management, and advertising privacy controls.</li>
          </ul>

        </article>

        {/* Interactive FAQ Accordion for Client Runtime */}
        <div className="mt-8 mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" /> Support FAQ Quick Reference
          </h2>
          <Accordion type="single" collapsible className="w-full border rounded-xl px-4 bg-card">
            {CONTACT_FAQS.map((faq, index) => (
              <AccordionItem key={index} value={`contact-faq-${index}`}>
                <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="p-6 rounded-2xl bg-muted/40 border border-border text-center">
          <h3 className="font-semibold text-base mb-2">Looking for Legal & Compliance Information?</h3>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-4">
            Review our governance frameworks and privacy guarantees. FreeGeoTagger operates under complete transparency with zero tracking and zero server storage.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            <span className="text-muted-foreground">&middot;</span>
            <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
            <span className="text-muted-foreground">&middot;</span>
            <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>
            <span className="text-muted-foreground">&middot;</span>
            <Link href="/about" className="text-primary hover:underline">About Us</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
