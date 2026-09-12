import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Shield, Zap, Lock, Globe, FileCode, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { updatePageSEO, injectPageSchema, SEO_CONFIG } from "@/lib/seo";

export default function About() {
  useEffect(() => {
    updatePageSEO(SEO_CONFIG.about);

    injectPageSchema("about-webpage", {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "About FreeGeoTagger – Browser-Based Photo Geotagging & Metadata Tools",
      url: "https://freegeotagger.com/about",
      description: SEO_CONFIG.about.description,
      inLanguage: "en-US",
      isPartOf: {
        "@type": "WebSite",
        name: "FreeGeoTagger",
        url: "https://freegeotagger.com",
      },
      publisher: {
        "@type": "Organization",
        name: "FreeGeoTagger",
        url: "https://freegeotagger.com",
        logo: {
          "@type": "ImageObject",
          url: "https://freegeotagger.com/favicon.png",
          width: 289,
          height: 289,
        },
      },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://freegeotagger.com/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "About",
            item: "https://freegeotagger.com/about",
          },
        ],
      },
    });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main id="main-content" tabIndex={-1} className="outline-none container mx-auto px-4 py-12 max-w-4xl flex-1">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">About</span>
        </nav>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          data-testid="link-back"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight mb-8" data-testid="text-title">
          About FreeGeoTagger
        </h1>

        <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary leading-relaxed space-y-6">
          <p className="text-lg text-muted-foreground leading-relaxed">
            FreeGeoTagger is a premier, privacy-first web utility suite engineered for adding, inspecting, converting,
            and stripping GPS location metadata in digital photography. It runs 100% client-side inside your modern web
            browser, requires no account registration, demands no desktop installations, and operates under an absolute
            Zero-Upload Invariant: your photos never leave your device.
          </p>

          <h2>Why We Built FreeGeoTagger</h2>

          <p>
            Adding geographic coordinates to a digital photograph should be an effortless, routine task. Yet for years,
            getting it done on the web was an unnecessarily frustrating and privacy-compromising ordeal.
          </p>

          <p>
            When our engineering team surveyed existing online geotagging and metadata tools, nearly every available service
            suffered from significant compromises:
          </p>

          <ul>
            <li>
              <strong>Mandatory Account Creation:</strong> Forcing users through email signups, password confirmations,
              and promotional marketing funnels before allowing a single edit.
            </li>
            <li>
              <strong>Artificial Paywalls &amp; Quotas:</strong> Restricting free usage to a handful of photos per day, or
              demanding recurring monthly subscriptions for basic batch operations.
            </li>
            <li>
              <strong>Generational Quality Degradation:</strong> Resizing images, compressing high-resolution captures, or
              stamping intrusive watermarks across finished deliverables.
            </li>
            <li>
              <strong>Remote Server Uploads (The Critical Risk):</strong> Forcing users to transmit personal photos, client
              assets, or confidential documentation over the public internet to third-party cloud servers for processing.
            </li>
          </ul>

          <p>
            That last practice was the catalyst for creating FreeGeoTagger. A digital photograph is deeply personal. A photograph
            paired with precise latitude, longitude, and elevation coordinates is even more sensitive, revealing private
            residences, job sites, child facilities, or unreleased commercial developments. Handing both to an unknown remote
            server just to modify a few dozen bytes of EXIF header metadata is an unacceptable security compromise.
          </p>

          <p>
            Modern web browsers equipped with the HTML5 File API, typed binary arrays, and WebAssembly possess immense
            computational capability. They can parse, write, and verify complex image headers entirely within local RAM.
            We built FreeGeoTagger to prove that professional-grade metadata workflows can be fast, powerful, and completely private.
          </p>

          <h2>The Zero-Upload Technical Architecture</h2>

          <p>
            FreeGeoTagger is architected with a fundamental principle: <em>the network is never used for photo processing</em>.
            When you select or drop photos onto our interface, the following local pipeline executes:
          </p>

          <ol>
            <li>
              <strong>Local File Handle Acquisition:</strong> Your browser accesses the file directly from your local disk
              or mobile gallery into an isolated sandboxed memory buffer via HTML5 FileReader.
            </li>
            <li>
              <strong>Binary Header Extraction:</strong> Our client-side parser scans the binary structure of the file, locating
              the standard Application Marker segments (such as APP1 for JPEG EXIF or metadata chunks in WebP/PNG).
            </li>
            <li>
              <strong>Lossless EXIF Manipulation:</strong> When adding or editing GPS coordinates on JPEG files, the image's
              actual pixel data (Discrete Cosine Transform frequency coefficients) is never decoded or re-compressed.
              Only the tiny binary EXIF GPS IFD structure is updated. Your original sensor sharpness and dynamic range remain
              100% bit-for-bit identical.
            </li>
            <li>
              <strong>In-Memory Post-Verification:</strong> Immediately after writing the metadata, our verification engine
              re-parses the generated binary blob in memory to mathematically confirm that the latitude, longitude, and altitude
              tags conform strictly to the international EXIF 2.32 standard before offering the file for download.
            </li>
            <li>
              <strong>Instant Local Download &amp; Cleanup:</strong> The modified image is packaged as an in-browser Blob URL.
              Once downloaded or closed, temporary object URLs are revoked immediately, freeing all allocated memory buffers.
            </li>
          </ol>

          <p>
            You can verify this architecture yourself at any time. Open your browser's Developer Tools, navigate to the
            Network tab, upload fifty high-resolution photos, and apply coordinates. You will observe zero outbound file upload
            requests. You can even disconnect your internet entirely after loading the page, and the core geotagging and EXIF
            editing tools will continue functioning seamlessly offline.
          </p>

          <h2>EXIF Standards &amp; Geodetic Accuracy</h2>

          <p>
            Location metadata in digital photography is governed by the <strong>EXIF 2.32 standard</strong> (Exchangeable Image File
            Format, published by JEITA and CIPA as CP-3451D). Under this specification, geographic coordinates are stored within
            the GPS Interoperability IFD using rational degree, minute, and second fractional arrays paired with hemisphere references:
          </p>

          <ul>
            <li><strong>GPSLatitude &amp; GPSLatitudeRef:</strong> Hex tag 0x0002 stores three unsigned rational numbers representing degrees, minutes, and fractional seconds, paired with 'N' or 'S' (tag 0x0001).</li>
            <li><strong>GPSLongitude &amp; GPSLongitudeRef:</strong> Hex tag 0x0004 stores three unsigned rational numbers representing degrees, minutes, and fractional seconds, paired with 'E' or 'W' (tag 0x0003).</li>
            <li><strong>GPSAltitude &amp; GPSAltitudeRef:</strong> Hex tag 0x0006 records elevation above or below sea level based on the WGS84 geodetic reference datum.</li>
            <li><strong>GPSMapDatum:</strong> Hex tag 0x0012 defines the horizontal geodetic coordinate frame, fixed to WGS-84 (World Geodetic System 1984) for universal compatibility with GPS, GLONASS, Galileo, and web mapping platforms.</li>
          </ul>

          <p>
            Because FreeGeoTagger generates strictly compliant EXIF data, files geotagged here are universally recognized by
            Google Photos, Apple Photos, Adobe Lightroom, Capture One, Windows File Explorer, macOS Finder, GIS software (ArcGIS, QGIS),
            and social media platforms.
          </p>

          <h2>Our Comprehensive Tool Ecosystem</h2>

          <p>
            What began as a simple photo geotagger has evolved into a unified suite of privacy-first geospatial and metadata tools.
            Each utility addresses a distinct operational requirement:
          </p>

          <ul>
            <li>
              <strong><Link href="/">Free Photo Geotagger</Link>:</strong> The core application. Drop photos, search any street
              address or landmark, click to drop a high-precision pin on the Leaflet map, and download geotagged photos individually
              or packaged into a consolidated ZIP archive.
            </li>
            <li>
              <strong><Link href="/gps-finder">GPS Photo Finder</Link>:</strong> The reverse lookup utility. Upload any photo to
              inspect whether it contains embedded location metadata, view the coordinates in Decimal Degrees and DMS, and preview
              the capture location on an interactive map with one-click reverse geocoding.
            </li>
            <li>
              <strong><Link href="/exif-viewer">EXIF Metadata Viewer</Link>:</strong> Deep camera hardware and exposure inspection.
              View shutter speed, aperture (F-number), ISO sensitivity, lens model, focal length, color space, dimensions, and
              creation timestamps with searchable raw tag filtering.
            </li>
            <li>
              <strong><Link href="/remove-gps-from-photo">Remove GPS from Photo</Link>:</strong> Privacy protection cleaner.
              Strip location coordinates before sharing images publicly while preserving all camera settings, or choose full
              metadata stripping to clear all EXIF, IPTC, and XMP blocks with automated binary verification.
            </li>
            <li>
              <strong><Link href="/coordinate-converter">GPS Coordinate Converter</Link>:</strong> Multi-format geodetic converter.
              Translate coordinates seamlessly between Decimal Degrees (DD), Degrees Minutes Seconds (DMS), Degrees Decimal
              Minutes (DDM), and Base32 Geohash with smart parsing and Haversine distance calculations.
            </li>
            <li>
              <strong><Link href="/batch-geotag-photos">Batch Geotag Photos</Link>:</strong> High-throughput bulk workflow.
              Manage multi-location image queues, import CSV coordinate spreadsheets by filename, apply custom tokenized renaming
              patterns, and export complete audit logs for enterprise deliverables.
            </li>
          </ul>

          <h2>Who Relies on FreeGeoTagger</h2>

          <p>
            FreeGeoTagger serves a diverse community of professionals, organizations, and everyday individuals who require
            accurate image geolocation without security compromises:
          </p>

          <ul>
            <li>
              <strong>Real Estate Photographers &amp; Agents:</strong> Geotagging interior and exterior property shoots to ensure
              accurate listing placement on MLS feeds, Zillow, Redfin, and virtual tour systems.
            </li>
            <li>
              <strong>Local Businesses &amp; SEO Agencies:</strong> Embedding physical business coordinates into storefront, team,
              and product imagery before uploading to Google Business Profile to boost local pack rankings.
            </li>
            <li>
              <strong>Civil Engineers, Surveyors &amp; Contractors:</strong> Documenting infrastructure progress, construction
              milestones, environmental inspections, and utility audits with verifiable geographic proof.
            </li>
            <li>
              <strong>Insurance Adjusters &amp; Field Investigators:</strong> Capturing timestamped, location-verified casualty
              and claim photos for court-admissible documentation.
            </li>
            <li>
              <strong>Travelers &amp; Documentary Photographers:</strong> Restoring missing GPS tags to photos taken with dedicated
              mirrorless or DSLR cameras that lack built-in satellite receivers.
            </li>
            <li>
              <strong>Privacy-Conscious Individuals:</strong> Inspecting and stripping location tags from personal images before
              posting to online marketplaces, forums, or social networks.
            </li>
          </ul>

          <h2>Our Commitments &amp; Ethical Standards</h2>

          <p>
            We believe that essential privacy and utility software should be accessible to everyone without deceptive practices.
            We hold ourselves to four strict commitments:
          </p>

          <ul>
            <li><strong>No Cloud Storage:</strong> We will never upload, store, inspect, or process your photos on a remote server.</li>
            <li><strong>No Account Barriers:</strong> We will never demand email signups, logins, or personal details to use our tools.</li>
            <li><strong>No Watermarks or Artificial Limits:</strong> We will never watermark your images or limit file batch sizes.</li>
            <li><strong>No Data Telemetry:</strong> We will never log, track, or transmit your photo coordinates or filenames to advertisers.</li>
          </ul>

          <h2>How FreeGeoTagger is Sustained</h2>

          <p>
            FreeGeoTagger is supported through non-intrusive, privacy-respecting online advertising. Our advertising partners
            do not have access to your uploaded photos, metadata, or geographic coordinates. Advertising scripts are strictly
            consent-gated in compliance with GDPR, CCPA, and ePrivacy regulations. For detailed information on our data practices,
            please review our <Link href="/privacy">Privacy Policy</Link> and <Link href="/cookies">Cookie Policy</Link>.
          </p>

          <h2>Frequently Asked Questions About FreeGeoTagger</h2>

          <h3>Is FreeGeoTagger really free to use?</h3>
          <p>
            Yes. All tools on FreeGeoTagger — including bulk geotagging, EXIF inspection, GPS stripping, and coordinate conversion —
            are 100% free with no hidden fees, subscriptions, or file quantity restrictions.
          </p>

          <h3>Does geotagging degrade image sharpness or resolution?</h3>
          <p>
            No. For JPEG files, our metadata engine performs direct binary injection into the EXIF header block without re-compressing
            the underlying pixel data. Your photos retain 100% of their original sensor sharpness, resolution, and color fidelity.
          </p>

          <h3>Can I use FreeGeoTagger for commercial client projects?</h3>
          <p>
            Yes. You retain full copyright and ownership of all photos processed through our tools. FreeGeoTagger is used daily by
            commercial real estate agencies, engineering consultancies, drone pilots, and corporate marketing teams.
          </p>

          <h3>Can FreeGeoTagger work offline?</h3>
          <p>
            Yes. Because all image processing and EXIF writing algorithms run locally in client-side JavaScript, the core tool
            functionality remains fully operational even if you disconnect from the internet after loading the page.
          </p>

          <h2>Contact &amp; Feedback</h2>

          <p>
            We continually refine our algorithms, expand image format support, and update our educational guides. If you encounter
            an unusual EXIF structure, discover a bug, or wish to suggest a feature, we welcome your feedback. Please reach out
            via our <Link href="/contact">contact page</Link> or email us directly at{" "}
            <a href="mailto:contact@freegeotagger.com">contact@freegeotagger.com</a>.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
