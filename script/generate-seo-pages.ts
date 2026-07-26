import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { SEO_CONFIG } from "../client/src/lib/seo";

const SITE_URL = "https://freegeotagger.com";
const OG_IMAGE = `${SITE_URL}/og-image.png`;
const LOGO = `${SITE_URL}/favicon.png`;

/** Titles/descriptions come from SEO_CONFIG so the prerendered HTML and the React
 *  runtime can never disagree. Keyed by canonical path. */
const seoByPath = new Map(
  Object.values(SEO_CONFIG).map((cfg) => [cfg.canonical, cfg as { title: string; description: string; keywords?: string }]),
);

/** Publication dates for Article schema. Google requires datePublished (and strongly
 *  prefers dateModified) for Article rich results. Keyed by canonical path. */
const POST_DATES: Record<string, { published: string; modified: string }> = {
  "/blog/how-to-add-gps-to-iphone-photos": { published: "2026-03-22", modified: "2026-03-22" },
  "/blog/what-is-exif-gps-metadata": { published: "2026-03-25", modified: "2026-03-25" },
  "/blog/how-to-geotag-photos-for-real-estate": { published: "2026-03-28", modified: "2026-03-28" },
  "/blog/how-to-geotag-photos-for-google-business-profile": { published: "2026-04-01", modified: "2026-04-01" },
  "/blog/how-to-geotag-photos-android": { published: "2026-04-02", modified: "2026-04-02" },
  "/blog/best-free-photo-geotagging-tools": { published: "2026-04-03", modified: "2026-04-03" },
  "/blog/how-to-remove-gps-data-from-photos": { published: "2026-07-08", modified: "2026-07-08" },
  "/blog/how-to-fix-wrong-gps-location-on-photos": { published: "2026-07-10", modified: "2026-07-10" },
  "/blog/how-to-bulk-geotag-photos": { published: "2026-07-12", modified: "2026-07-12" },
};

const AUTHOR = { "@type": "Organization", name: "FreeGeoTagger", url: SITE_URL };
const PUBLISHER = {
  "@type": "Organization",
  name: "FreeGeoTagger",
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: LOGO, width: 512, height: 512 },
};

const isBlogPost = (p: string) => p.startsWith("/blog/");

type RouteMeta = {
  path: string;
  file: string;
  ogType: "website" | "article";
  h1: string;
  /** Full crawlable HTML body (already semantic HTML). Takes priority over `body`. */
  contentHtml?: string;
  /** Source .tsx page whose <article> content should be extracted into the static page. */
  sourceFile?: string;
  /** Simple paragraph fallback when neither contentHtml nor sourceFile is provided. */
  body?: string[];
  links?: Array<{ href: string; label: string }>;
  /** Optional FAQ pairs rendered as visible content + FAQPage schema. */
  faqs?: Array<{ q: string; a: string }>;
};

const commonLinks = [
  { href: "/", label: "Geotag Photos Free" },
  { href: "/gps-finder", label: "GPS Finder" },
  { href: "/blog", label: "Photo Geotagging Blog" },
];

const blogLinks = [
  { href: "/blog/how-to-add-gps-to-iphone-photos", label: "How to Add GPS to iPhone Photos" },
  { href: "/blog/how-to-geotag-photos-android", label: "How to Add GPS to Android Photos" },
  { href: "/blog/what-is-exif-gps-metadata", label: "What Is EXIF GPS Metadata" },
  { href: "/blog/how-to-geotag-photos-for-real-estate", label: "Geotag Photos for Real Estate" },
  { href: "/blog/how-to-geotag-photos-for-google-business-profile", label: "Geotag Photos for Google Business Profile" },
  { href: "/blog/best-free-photo-geotagging-tools", label: "Best Free Photo Geotagging Tools" },
  { href: "/blog/how-to-remove-gps-data-from-photos", label: "Remove GPS Data from Photos" },
  { href: "/blog/how-to-fix-wrong-gps-location-on-photos", label: "Fix Wrong GPS Location on Photos" },
  { href: "/blog/how-to-bulk-geotag-photos", label: "Bulk Geotag Photos" },
];

const BLOG_DIR = "client/src/pages/blog";
const PAGES_DIR = "client/src/pages";

// ── Homepage FAQ (mirrors the in-app FAQ so crawlers see the same content) ──
const homeFaqs: Array<{ q: string; a: string }> = [
  { q: "Is FreeGeoTagger really free?", a: "Yes. FreeGeoTagger is completely free with no hidden fees, subscriptions, watermarks, or file limits, and no account is required." },
  { q: "Are my photos uploaded to any server?", a: "No. All image processing happens entirely in your browser using JavaScript. Your photos never leave your device — not even temporarily." },
  { q: "Can I geotag multiple photos at once?", a: "Yes. Batch geotagging is fully supported — upload multiple photos and apply the same GPS location to all at once, then download individually or as a ZIP archive." },
  { q: "What image file formats are supported?", a: "JPG, PNG, WebP, and HEIC are all supported. HEIC files (iPhone photos) are automatically converted to high-quality JPEG for full EXIF GPS compatibility." },
  { q: "Will geotagging affect my image quality?", a: "No. FreeGeoTagger only modifies the EXIF metadata — the actual pixel data remains completely untouched. There is zero quality loss." },
  { q: "Does FreeGeoTagger work on mobile devices?", a: "Yes. It works on modern mobile browsers including Chrome for Android, Safari for iOS, and Firefox Mobile." },
  { q: "How do I add GPS coordinates to a photo taken without location data?", a: "Upload your photo, then use the interactive map to click on the correct location, search for an address or city, or enter GPS coordinates manually. Click Download to save the geotagged version with embedded EXIF GPS data." },
  { q: "What is EXIF GPS metadata?", a: "EXIF GPS metadata is location information embedded inside a photo file — including latitude, longitude, and optionally altitude and compass direction. Apps like Google Photos, Apple Photos, and Adobe Lightroom use this data to show where a photo was taken on a map." },
  { q: "Which platforms recognize geotagged photos?", a: "GPS-tagged photos are recognized by Google Photos, Apple Photos, Adobe Lightroom, Windows File Explorer, macOS Preview, most GIS software, and any platform that reads standard EXIF metadata." },
];

const gpsFinderFaqs: Array<{ q: string; a: string }> = [
  { q: "What is a GPS Finder tool?", a: "A GPS Finder is a tool that reads EXIF metadata from photos to extract embedded GPS coordinates. When you take a photo with location services enabled, your camera or smartphone stores latitude and longitude data in the image file. Our GPS Finder reads this data and displays the exact location on an interactive map." },
  { q: "How do I find GPS coordinates in a photo?", a: "Upload your photo to our GPS Finder tool. If the image contains GPS metadata, we automatically extract the coordinates and show the location on a map. You can then copy the coordinates or open the location in Google Maps." },
  { q: "What image formats support GPS data?", a: "Most common image formats support GPS metadata, including JPG/JPEG, PNG, WebP, and HEIC (iPhone photos). Our tool supports all of these and automatically converts HEIC files for processing." },
  { q: "Is my photo uploaded to your servers?", a: "No. All processing happens locally in your browser. Your photos never leave your device, ensuring complete privacy and security." },
  { q: "Why doesn't my photo have GPS data?", a: "Photos may lack GPS data if location services were disabled, the image was edited and metadata was stripped, the camera had no GPS, or the image was downloaded from social media, which often removes location data." },
  { q: "How accurate are the GPS coordinates?", a: "Accuracy depends on the device that captured the photo. Modern smartphones typically provide accuracy within 5–10 meters, and professional cameras with GPS modules can be even more accurate." },
];

// ── Rich homepage content (mirrors the in-app landing page sections) ──
const homeContentHtml = `
<h1>Geotag Photos Free — Add GPS Coordinates to Any Photo Online</h1>
<p>FreeGeoTagger is a free, privacy-first tool that lets you <strong>add GPS coordinates to photos</strong> directly in your browser — no software to install and no account to create. Upload one photo or a whole batch, pin the location on an interactive map or search any address worldwide, then download your images with precise GPS metadata embedded in the EXIF data.</p>
<p>Your files never leave your device. All processing happens locally in your browser tab, so geotagging is completely private and works in seconds. The output uses standard EXIF GPS metadata that is recognized by <strong>Google Photos, Apple Photos, Adobe Lightroom, Windows Explorer</strong>, and any platform that reads location data.</p>

<h2>What Is Image Geotagging?</h2>
<p>Geotagging embeds precise GPS location data into a photo's EXIF metadata — making images searchable, mappable, and location-aware. A geotagged photo can store several location fields:</p>
<ul>
<li><strong>Latitude &amp; Longitude</strong> — the precise geographic coordinates of where the photo was taken.</li>
<li><strong>Timestamp</strong> — the date and time of capture.</li>
<li><strong>Altitude</strong> — elevation above sea level.</li>
<li><strong>Direction</strong> — the camera's compass heading at the moment of the shot.</li>
</ul>
<p>Geotagged images display on maps in Google Photos and Apple Photos, integrate with GIS software, and satisfy location-verification requirements for journalism, insurance, and real estate.</p>

<h2>Why Choose FreeGeoTagger?</h2>
<ul>
<li><strong>100% Private</strong> — photos never leave your browser. Zero uploads, zero exposure.</li>
<li><strong>Lightning Fast</strong> — no server round-trips. Batch geotag dozens of photos in seconds.</li>
<li><strong>Universal GPS Format</strong> — standard EXIF GPS data works in Google Photos, Lightroom, and GIS tools.</li>
<li><strong>Multi-Format Support</strong> — JPG, PNG, and WebP natively; HEIC auto-converts to JPEG.</li>
<li><strong>No account, no cost, no watermarks</strong> — free forever, with no file limits.</li>
</ul>

<h2>Privacy-First by Design</h2>
<p>Your photos are sensitive, so FreeGeoTagger was built from the ground up so your images never leave your device. There are no image uploads, no cloud storage, no tracking of your images, and no account needed. All processing happens using JavaScript inside your browser tab — when you close the page, nothing is retained.</p>

<h2>Who Uses FreeGeoTagger?</h2>
<ul>
<li><strong>Photographers</strong> — organize location-based shoots and keep portfolio images georeferenced for clients and stock platforms.</li>
<li><strong>Real estate agents</strong> — tag listing photos with precise GPS coordinates for MLS submissions and location verification.</li>
<li><strong>Surveyors &amp; researchers</strong> — embed accurate field coordinates into documentation photos for reporting and GIS workflows.</li>
<li><strong>Travelers &amp; bloggers</strong> — preserve precise location memories so photos display correctly on map-based albums.</li>
<li><strong>Journalists</strong> — verify and embed photo location metadata for editorial accountability.</li>
<li><strong>Businesses</strong> — manage location-aware media libraries with accurate GPS data for marketing and compliance.</li>
</ul>

<h2>How to Geotag Photos in 3 Steps</h2>
<ol>
<li><strong>Upload your photos.</strong> Drag and drop or click to select one or multiple JPG, PNG, WebP, or HEIC files. Files stay on your device.</li>
<li><strong>Set the GPS location.</strong> Click the interactive map to pin a location, search for any address worldwide, or use your device's current GPS.</li>
<li><strong>Download geotagged photos.</strong> Get your photos with GPS coordinates embedded in the EXIF metadata. Download all at once as a ZIP file.</li>
</ol>

<h2>FreeGeoTagger vs Other Geotagging Tools</h2>
<p>Most geotagging tools require accounts, paid plans, or upload your photos to the cloud. FreeGeoTagger does none of that.</p>
<table>
<thead>
<tr><th>Feature</th><th>FreeGeoTagger</th><th>Desktop Software</th><th>Cloud Tools</th></tr>
</thead>
<tbody>
<tr><td>Free to use</td><td>Yes</td><td>Sometimes</td><td>Rarely</td></tr>
<tr><td>No account required</td><td>Yes</td><td>Yes</td><td>No</td></tr>
<tr><td>No file uploads</td><td>Yes</td><td>Yes</td><td>No</td></tr>
<tr><td>Works in browser</td><td>Yes</td><td>No</td><td>Yes</td></tr>
<tr><td>Batch geotagging</td><td>Yes</td><td>Yes</td><td>Limited</td></tr>
<tr><td>HEIC support</td><td>Yes</td><td>Limited</td><td>Limited</td></tr>
<tr><td>Zero quality loss</td><td>Yes</td><td>Yes</td><td>Varies</td></tr>
</tbody>
</table>

<h2>Frequently Asked Questions</h2>
${homeFaqs.map((f) => `<h3>${escapeHtml(f.q)}</h3>\n<p>${escapeHtml(f.a)}</p>`).join("\n")}

<h2>Explore FreeGeoTagger</h2>
<nav aria-label="Site pages"><ul>
<li><a href="/gps-finder">GPS Finder — Extract GPS from a Photo</a></li>
<li><a href="/blog">Photo Geotagging Blog</a></li>
<li><a href="/blog/how-to-add-gps-to-iphone-photos">How to Add GPS to iPhone Photos</a></li>
<li><a href="/blog/how-to-geotag-photos-android">How to Add GPS to Android Photos</a></li>
<li><a href="/blog/what-is-exif-gps-metadata">What Is EXIF GPS Metadata</a></li>
<li><a href="/about">About FreeGeoTagger</a></li>
<li><a href="/privacy">Privacy Policy</a></li>
</ul></nav>
`.trim();

const routes: RouteMeta[] = [
  {
    path: "/gps-finder",
    file: "gps-finder.html",
    ogType: "website",
    h1: "GPS Finder — Extract GPS Coordinates from Photos",
    contentHtml: `
<h1>GPS Finder — Extract GPS Coordinates from Photos</h1>
<p>Use FreeGeoTagger's GPS Finder to read location metadata from photos directly in your browser. Upload a JPG, PNG, WebP, or HEIC image and instantly see the embedded GPS coordinates plotted on an interactive map — completely free and private.</p>
<p>Photos stay on your device. The tool checks EXIF GPS data locally and shows the location on a map when coordinates are available. Nothing is uploaded to a server.</p>

<h2>What Is GPS Finder?</h2>
<p>When you take a photo with location services enabled, your camera or phone stores latitude and longitude inside the image file's EXIF metadata. GPS Finder reads that data and shows you exactly where the photo was captured. If a photo has no embedded location, you can add one with the free <a href="/">FreeGeoTagger geotagging tool</a>.</p>

<h2>How GPS Finder Works</h2>
<ol>
<li><strong>Upload a photo</strong> — drag and drop or select a JPG, PNG, WebP, or HEIC file.</li>
<li><strong>Automatic extraction</strong> — the tool reads the EXIF GPS block locally in your browser.</li>
<li><strong>View &amp; use the location</strong> — see the coordinates on a map, copy them, or open the spot in Google Maps.</li>
</ol>

<h2>Who Uses GPS Finder?</h2>
<ul>
<li><strong>Researchers</strong> — extract location data for field studies, documentation, and analysis.</li>
<li><strong>Photographers</strong> — confirm where images were captured and organize archives by location.</li>
<li><strong>Real estate &amp; insurance</strong> — verify that listing or claim photos carry the correct coordinates.</li>
<li><strong>Everyday users</strong> — find out where an old photo was taken.</li>
</ul>

<h2>Frequently Asked Questions</h2>
${gpsFinderFaqs.map((f) => `<h3>${escapeHtml(f.q)}</h3>\n<p>${escapeHtml(f.a)}</p>`).join("\n")}
`.trim(),
    links: commonLinks,
    faqs: gpsFinderFaqs,
  },
  {
    path: "/blog",
    file: "blog.html",
    ogType: "website",
    h1: "Photo Geotagging Blog",
    contentHtml: `
<h1>Photo Geotagging Blog — Tips, Guides &amp; How-Tos</h1>
<p>Practical tutorials on adding GPS coordinates to photos, editing EXIF location metadata, and using geotagged images for local SEO and photography workflows. Guides cover iPhone, Android, real estate listings, Google Business Profile photos, and free geotagging tools.</p>

<h2>Latest Articles</h2>
<article>
<h3><a href="/blog/how-to-bulk-geotag-photos">How to Bulk Geotag Photos: Add GPS to Hundreds of Images at Once</a></h3>
<p>Batch geotagging saves hours when many photos share one location. Efficient workflows for events, job sites, listings, and travel archives — free and private.</p>
</article>
<article>
<h3><a href="/blog/how-to-fix-wrong-gps-location-on-photos">How to Fix or Change the Wrong GPS Location on a Photo</a></h3>
<p>Photo pinned to the wrong place on the map? Learn why photo GPS data ends up incorrect and how to rewrite the coordinates in seconds with zero quality loss.</p>
</article>
<article>
<h3><a href="/blog/how-to-remove-gps-data-from-photos">How to Remove GPS Location Data from Photos</a></h3>
<p>Protect your privacy before sharing photos publicly. Check for embedded GPS coordinates and strip them on iPhone, Android, Windows, and Mac — with no quality loss.</p>
</article>
<article>
<h3><a href="/blog/how-to-add-gps-to-iphone-photos">How to Add GPS Location to iPhone Photos</a></h3>
<p>iPhone photo missing location data? This step-by-step guide shows you how to add GPS coordinates to any iPhone photo — no app reinstall, no account, completely free.</p>
</article>
<article>
<h3><a href="/blog/how-to-geotag-photos-android">How to Add GPS to Android Photos — Free &amp; Instant</a></h3>
<p>Android photo missing location data? Add GPS coordinates to any Android photo in seconds — free, browser-based, no app install required. Works in Chrome on any Android device.</p>
</article>
<article>
<h3><a href="/blog/what-is-exif-gps-metadata">What Is EXIF GPS Metadata? A Complete Guide for Photographers</a></h3>
<p>Understand what EXIF GPS metadata is, how latitude and longitude get stored inside image files, and why it matters for apps, search, and workflows.</p>
</article>
<article>
<h3><a href="/blog/how-to-geotag-photos-for-real-estate">How to Geotag Photos for Real Estate Listings</a></h3>
<p>Add GPS coordinates to property photos to improve MLS accuracy, boost local SEO, and give buyers precise location context — in seconds, for free.</p>
</article>
<article>
<h3><a href="/blog/how-to-geotag-photos-for-google-business-profile">How to Geotag Photos for Google Business Profile</a></h3>
<p>Add GPS coordinates to your business photos before uploading to Google Business Profile — send a precise location signal to Google and strengthen your local SEO rankings.</p>
</article>
<article>
<h3><a href="/blog/best-free-photo-geotagging-tools">Best Free Photo Geotagging Tools in 2026</a></h3>
<p>Compare the best free tools for adding GPS to photos in 2026 — browser-based, desktop, and command-line options reviewed for privacy, batch support, and ease of use.</p>
</article>
`.trim(),
    links: blogLinks,
  },
  {
    path: "/blog/best-free-photo-geotagging-tools",
    file: "blog-best-free-photo-geotagging-tools.html",
    ogType: "article",
    h1: "Best Free Photo Geotagging Tools in 2026",
    sourceFile: `${BLOG_DIR}/best-free-photo-geotagging-tools.tsx`,
    links: commonLinks,
  },
  {
    path: "/blog/how-to-add-gps-to-iphone-photos",
    file: "blog-how-to-add-gps-to-iphone-photos.html",
    ogType: "article",
    h1: "How to Add GPS to iPhone Photos",
    sourceFile: `${BLOG_DIR}/how-to-add-gps-to-iphone-photos.tsx`,
    links: commonLinks,
  },
  {
    path: "/blog/how-to-geotag-photos-android",
    file: "blog-how-to-geotag-photos-android.html",
    ogType: "article",
    h1: "How to Add GPS to Android Photos",
    sourceFile: `${BLOG_DIR}/how-to-geotag-photos-android.tsx`,
    links: commonLinks,
  },
  {
    path: "/blog/how-to-geotag-photos-for-google-business-profile",
    file: "blog-how-to-geotag-photos-for-google-business-profile.html",
    ogType: "article",
    h1: "How to Geotag Photos for Google Business Profile",
    sourceFile: `${BLOG_DIR}/how-to-geotag-photos-for-google-business-profile.tsx`,
    links: commonLinks,
  },
  {
    path: "/blog/how-to-geotag-photos-for-real-estate",
    file: "blog-how-to-geotag-photos-for-real-estate.html",
    ogType: "article",
    h1: "How to Geotag Real Estate Photos",
    sourceFile: `${BLOG_DIR}/how-to-geotag-photos-for-real-estate.tsx`,
    links: commonLinks,
  },
  {
    path: "/blog/what-is-exif-gps-metadata",
    file: "blog-what-is-exif-gps-metadata.html",
    ogType: "article",
    h1: "What Is EXIF GPS Metadata?",
    sourceFile: `${BLOG_DIR}/what-is-exif-gps-metadata.tsx`,
    links: commonLinks,
  },
  {
    path: "/blog/how-to-remove-gps-data-from-photos",
    file: "blog-how-to-remove-gps-data-from-photos.html",
    ogType: "article",
    h1: "How to Remove GPS Location Data from Photos",
    sourceFile: `${BLOG_DIR}/how-to-remove-gps-data-from-photos.tsx`,
    links: commonLinks,
  },
  {
    path: "/blog/how-to-fix-wrong-gps-location-on-photos",
    file: "blog-how-to-fix-wrong-gps-location-on-photos.html",
    ogType: "article",
    h1: "How to Fix or Change the Wrong GPS Location on a Photo",
    sourceFile: `${BLOG_DIR}/how-to-fix-wrong-gps-location-on-photos.tsx`,
    links: commonLinks,
  },
  {
    path: "/blog/how-to-bulk-geotag-photos",
    file: "blog-how-to-bulk-geotag-photos.html",
    ogType: "article",
    h1: "How to Bulk Geotag Photos: Add GPS to Hundreds of Images at Once",
    sourceFile: `${BLOG_DIR}/how-to-bulk-geotag-photos.tsx`,
    links: commonLinks,
  },
  {
    path: "/privacy",
    file: "privacy.html",
    ogType: "article",
    h1: "Privacy Policy",
    sourceFile: `${PAGES_DIR}/privacy.tsx`,
    links: [...commonLinks, { href: "/cookies", label: "Cookie Policy" }, { href: "/terms", label: "Terms of Service" }],
  },
  {
    path: "/terms",
    file: "terms.html",
    ogType: "article",
    h1: "Terms of Service",
    sourceFile: `${PAGES_DIR}/terms.tsx`,
    links: [...commonLinks, { href: "/privacy", label: "Privacy Policy" }, { href: "/cookies", label: "Cookie Policy" }],
  },
  {
    path: "/cookies",
    file: "cookies.html",
    ogType: "article",
    h1: "Cookie Policy",
    sourceFile: `${PAGES_DIR}/cookies.tsx`,
    links: [...commonLinks, { href: "/privacy", label: "Privacy Policy" }, { href: "/terms", label: "Terms of Service" }],
  },
  {
    path: "/about",
    file: "about.html",
    ogType: "article",
    h1: "About FreeGeoTagger",
    sourceFile: `${PAGES_DIR}/about.tsx`,
    links: [
      ...commonLinks,
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/contact", label: "Contact FreeGeoTagger" },
    ],
  },
  {
    path: "/contact",
    file: "contact.html",
    ogType: "article",
    h1: "Contact FreeGeoTagger",
    sourceFile: `${PAGES_DIR}/contact.tsx`,
    links: [
      ...commonLinks,
      { href: "/about", label: "About FreeGeoTagger" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
];

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function replaceOrInsert(html: string, selector: RegExp, replacement: string) {
  if (selector.test(html)) return html.replace(selector, replacement);
  return html.replace("</head>", `  ${replacement}\n</head>`);
}

/** Convert a JSX fragment from a page's <article> into plain, crawlable HTML. */
function jsxToHtml(jsx: string) {
  return jsx
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "") // JSX comments
    .replace(/<Link\b[\s\S]*?href="([^"]*)"[\s\S]*?>/g, '<a href="$1">')
    .replace(/<\/Link>/g, "</a>")
    .replace(/\s+className="[^"]*"/g, "")
    .replace(/\s+data-testid="[^"]*"/g, "")
    // JSX string/whitespace expressions such as {" "} would otherwise be emitted
    // literally into the static HTML and show up as visible text to crawlers.
    .replace(/\{\s*["'`]([^"'`]*)["'`]\s*\}/g, "$1")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function articleFromSource(sourceFile: string) {
  const src = await readFile(path.resolve(sourceFile), "utf-8");
  const articleMatch = src.match(/<article\b[^>]*>([\s\S]*?)<\/article>/);
  if (!articleMatch) throw new Error(`No <article> found in ${sourceFile}`);
  const h1Match = src.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/);
  const introMatch = src.match(/<\/h1>\s*<p\b[^>]*>([\s\S]*?)<\/p>/);
  const h1 = h1Match ? jsxToHtml(h1Match[1]).replace(/\s+/g, " ").trim() : "";
  const intro = introMatch ? jsxToHtml(introMatch[1]).replace(/\s+/g, " ").trim() : "";
  const article = jsxToHtml(articleMatch[1]);
  return { h1, intro, article };
}

function faqSchema(route: RouteMeta) {
  if (!route.faqs?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: route.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Look up a route's canonical metadata, failing loudly rather than shipping a page
 *  with no title if SEO_CONFIG and the route table ever drift apart. */
function seoFor(route: RouteMeta) {
  const cfg = seoByPath.get(route.path);
  if (!cfg) throw new Error(`No SEO_CONFIG entry with canonical "${route.path}" — add one in client/src/lib/seo.ts`);
  return cfg;
}

function schemaFor(route: RouteMeta) {
  const pageUrl = `${SITE_URL}${route.path}`;
  const seo = seoFor(route);
  const schemas: object[] = [];

  if (isBlogPost(route.path)) {
    // Article rich results require author + datePublished; image and publisher are
    // strongly recommended. Omitting them makes the page ineligible entirely.
    const dates = POST_DATES[route.path];
    if (!dates) throw new Error(`No POST_DATES entry for blog post "${route.path}"`);
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: route.h1,
      name: route.h1,
      url: pageUrl,
      description: seo.description,
      image: { "@type": "ImageObject", url: OG_IMAGE, width: 1200, height: 630 },
      datePublished: dates.published,
      dateModified: dates.modified,
      author: AUTHOR,
      publisher: PUBLISHER,
      mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
      inLanguage: "en-US",
      isPartOf: { "@type": "WebSite", name: "FreeGeoTagger", url: SITE_URL },
    });
  } else {
    // Everything else (blog hub, tool pages, trust pages) is a WebPage — the legal
    // and about pages were previously mistyped as Article, which they are not.
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: route.h1,
      url: pageUrl,
      description: seo.description,
      inLanguage: "en-US",
      isPartOf: { "@type": "WebSite", name: "FreeGeoTagger", url: SITE_URL },
      publisher: PUBLISHER,
    });
  }

  // The GPS Finder is a genuine web application, not just a document.
  if (route.path === "/gps-finder") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "GPS Photo Finder",
      applicationCategory: "PhotographyApplication",
      operatingSystem: "Web Browser",
      browserRequirements: "Chrome, Firefox, Safari, Edge",
      url: pageUrl,
      description: seo.description,
      image: OG_IMAGE,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" },
      featureList: [
        "Read EXIF GPS coordinates from photos",
        "Show photo location on an interactive map",
        "Copy coordinates or open in Google Maps",
        "JPG, PNG, WebP and HEIC support",
        "Runs entirely in the browser — no uploads",
      ],
      publisher: PUBLISHER,
    });
  }

  const crumbs: object[] = [{ "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` }];
  if (isBlogPost(route.path)) crumbs.push({ "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` });
  crumbs.push({ "@type": "ListItem", position: crumbs.length + 1, name: route.h1, item: pageUrl });

  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs,
  });

  const faq = faqSchema(route);
  if (faq) schemas.push(faq);
  return schemas;
}

const MAIN_OPEN =
  '<main id="static-seo-content" style="max-width: 820px; margin: 40px auto; padding: 0 20px; font-family: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; line-height: 1.65;">';

const LONG_DATE = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

/** Visible, crawlable author + date line for a blog post. Returns "" for non-posts. */
function bylineHtml(routePath: string) {
  const dates = POST_DATES[routePath];
  if (!dates) return "";
  const published = LONG_DATE.format(new Date(`${dates.published}T00:00:00Z`));
  const parts = [
    `<span>By <span rel="author">FreeGeoTagger</span></span>`,
    `<span>Published <time datetime="${dates.published}">${published}</time></span>`,
  ];
  if (dates.modified !== dates.published) {
    const modified = LONG_DATE.format(new Date(`${dates.modified}T00:00:00Z`));
    parts.push(`<span>Updated <time datetime="${dates.modified}">${modified}</time></span>`);
  }
  return `<p class="byline">${parts.join(" &middot; ")}</p>`;
}

async function buildStaticContent(route: RouteMeta) {
  const links = route.links ?? commonLinks;
  const navHtml = [
    '<nav aria-label="Related pages"><ul>',
    ...links.map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`),
    "</ul></nav>",
  ].join("\n");

  if (route.sourceFile) {
    const { h1, article } = await articleFromSource(route.sourceFile);
    // The React page renders a byline, but it sits outside the <article> element that
    // articleFromSource() extracts — so crawlers previously saw no author or date on
    // any post. Emit it here, with machine-readable <time> elements.
    return [
      MAIN_OPEN,
      `<h1>${h1 || escapeHtml(route.h1)}</h1>`,
      bylineHtml(route.path),
      article,
      navHtml,
      "</main>",
    ].filter(Boolean).join("\n");
  }

  if (route.contentHtml) {
    return [MAIN_OPEN, route.contentHtml, navHtml, "</main>"].join("\n");
  }

  return [
    MAIN_OPEN,
    `<h1>${escapeHtml(route.h1)}</h1>`,
    ...(route.body ?? []).map((text) => `<p>${escapeHtml(text)}</p>`),
    navHtml,
    "</main>",
  ].join("\n");
}

async function applyMeta(baseHtml: string, route: RouteMeta) {
  const fullUrl = `${SITE_URL}${route.path}`;
  const seo = seoFor(route);
  let html = baseHtml;

  html = html.replace(/<script type="application\/ld\+json"[\s\S]*?<\/script>\s*/g, "");
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(seo.title)}</title>`);
  html = replaceOrInsert(
    html,
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${escapeHtml(seo.description)}" />`,
  );
  html = replaceOrInsert(
    html,
    /<meta name="keywords"[^>]*>/,
    `<meta name="keywords" content="${escapeHtml(seo.keywords ?? "")}" />`,
  );
  html = replaceOrInsert(html, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${fullUrl}" />`);
  html = replaceOrInsert(html, /<meta property="og:type"[^>]*>/, `<meta property="og:type" content="${route.ogType}" />`);
  html = replaceOrInsert(html, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${escapeHtml(seo.title)}" />`);
  html = replaceOrInsert(html, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${escapeHtml(seo.description)}" />`);
  html = replaceOrInsert(html, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${fullUrl}" />`);
  html = replaceOrInsert(html, /<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`);
  html = replaceOrInsert(html, /<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`);

  const schemaScripts = schemaFor(route)
    .map((schema, index) => {
      const json = JSON.stringify(schema).replaceAll("</script", "<\\/script");
      return `  <script type="application/ld+json" data-schema="static-${route.file}-${index}">${json}</script>`;
    })
    .join("\n");
  html = html.replace("</head>", `${schemaScripts}\n</head>`);

  const content = await buildStaticContent(route);
  return html.replace('<div id="root"></div>', `<div id="root">\n${content}\n  </div>`);
}

/** Reset the root div and remove previously injected static content/schemas so runs are idempotent. */
function cleanBaseHtml(baseHtml: string) {
  return baseHtml
    .replace(/<div id="root">[\s\S]*?<\/div>/, '<div id="root"></div>')
    .replace(/\s*<script type="application\/ld\+json" data-schema="static-[^"]*">[\s\S]*?<\/script>/g, "");
}

function applyHome(cleanBase: string) {
  const content = [MAIN_OPEN, homeContentHtml, "</main>"].join("\n");
  const seo = SEO_CONFIG.home;
  // Keep the homepage's own meta in sync with SEO_CONFIG too, so index.html can never
  // drift from the validated values the way it did before.
  cleanBase = cleanBase.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(seo.title)}</title>`);
  cleanBase = replaceOrInsert(cleanBase, /<meta name="description"[^>]*>/, `<meta name="description" content="${escapeHtml(seo.description)}" />`);
  cleanBase = replaceOrInsert(cleanBase, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${escapeHtml(seo.title)}" />`);
  cleanBase = replaceOrInsert(cleanBase, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${escapeHtml(seo.description)}" />`);
  cleanBase = replaceOrInsert(cleanBase, /<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`);
  cleanBase = replaceOrInsert(cleanBase, /<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`);

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: homeFaqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const json = JSON.stringify(faq).replaceAll("</script", "<\\/script");
  const faqScript = `  <script type="application/ld+json" data-schema="static-home-faq">${json}</script>`;
  let html = cleanBase.replace("</head>", `${faqScript}\n</head>`);
  return html.replace('<div id="root"></div>', `<div id="root">\n${content}\n  </div>`);
}

export async function generateSeoPages(publicDirInput?: string) {
  const publicDir = path.resolve(publicDirInput ?? path.join("dist", "public"));
  const seoDir = path.join(publicDir, "seo-routes");
  const indexPath = path.join(publicDir, "index.html");
  const baseHtml = await readFile(indexPath, "utf-8");
  const cleanBase = cleanBaseHtml(baseHtml);

  await mkdir(seoDir, { recursive: true });

  await Promise.all(
    routes.map(async (route) => {
      const html = await applyMeta(cleanBase, route);
      await writeFile(path.join(seoDir, route.file), html, "utf-8");
    }),
  );

  // Inject rich, crawlable content into the homepage itself.
  await writeFile(indexPath, applyHome(cleanBase), "utf-8");

  console.log(`generated ${routes.length} static SEO route pages + homepage content`);
}

// Allow running directly against an already-built folder:
//   tsx script/generate-seo-pages.ts freegeotagger-hostinger-static
const invokedDirectly = process.argv[1] && process.argv[1].endsWith("generate-seo-pages.ts");
if (invokedDirectly) {
  const target = process.argv[2];
  generateSeoPages(target).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
