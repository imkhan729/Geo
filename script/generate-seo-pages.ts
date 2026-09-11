import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { SEO_CONFIG } from "../client/src/lib/seo";
import { BLOG_EXTRAS } from "../client/src/lib/blog-content";

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
  "/blog/how-to-add-gps-to-iphone-photos": { published: "2026-03-22", modified: "2026-07-26" },
  "/blog/what-is-exif-gps-metadata": { published: "2026-03-25", modified: "2026-07-26" },
  "/blog/how-to-geotag-photos-for-real-estate": { published: "2026-03-28", modified: "2026-07-26" },
  "/blog/how-to-geotag-photos-for-google-business-profile": { published: "2026-04-01", modified: "2026-07-26" },
  "/blog/how-to-geotag-photos-android": { published: "2026-04-02", modified: "2026-07-26" },
  "/blog/best-free-photo-geotagging-tools": { published: "2026-04-03", modified: "2026-07-26" },
  "/blog/how-to-remove-gps-data-from-photos": { published: "2026-07-08", modified: "2026-07-26" },
  "/blog/how-to-fix-wrong-gps-location-on-photos": { published: "2026-07-10", modified: "2026-07-26" },
  "/blog/how-to-bulk-geotag-photos": { published: "2026-07-12", modified: "2026-07-26" },
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

/** Site-wide links. Mirrors what the real React footer renders on every page, so the
 *  prerendered nav does not under-represent the rendered site's internal linking. */
const commonLinks = [
  { href: "/", label: "Geotag Photos Free" },
  { href: "/gps-finder", label: "GPS Finder" },
  { href: "/blog", label: "Photo Geotagging Blog" },
  { href: "/about", label: "About FreeGeoTagger" },
  { href: "/contact", label: "Contact" },
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
  {
    q: "What is a geotagger?",
    a: "A geotagger is a tool that writes geographic location coordinates—specifically latitude, longitude, and altitude—into a photo's EXIF metadata headers so map viewers and photo services know where it was taken.",
  },
  {
    q: "How do I geotag a photo online?",
    a: "Upload your JPG, PNG, WebP, or HEIC photo, click on the interactive map or search an address to set the location, and click Download to save the geotagged image with embedded EXIF GPS tags.",
  },
  {
    q: "Can I add GPS coordinates to an existing photo?",
    a: "Yes. You can add coordinates to any digital photo from cameras without GPS, scanned prints, or messaging apps. FreeGeoTagger embeds standard EXIF tags without changing image pixels or quality.",
  },
  {
    q: "Is FreeGeoTagger really free?",
    a: "Yes. FreeGeoTagger is 100% free with no accounts, subscriptions, watermarks, or file limits. You can process single photos or batches at no charge.",
  },
  {
    q: "Are my photos uploaded to your servers?",
    a: "No. All file reading, metadata editing, and downloads happen locally in your browser using JavaScript. Your photos never leave your device and are never sent across the internet.",
  },
  {
    q: "Can I geotag multiple photos at once?",
    a: "Yes. Drop multiple photos into the queue, set the location once, and apply it to every image simultaneously. You can then download them individually or as a single ZIP archive.",
  },
  {
    q: "Can I edit or change an existing GPS location on a photo?",
    a: "Yes. If an image already contains inaccurate or drifted coordinates, FreeGeoTagger detects them upon upload. Reposition the pin or enter new coordinates to overwrite the old metadata cleanly.",
  },
  {
    q: "What latitude and longitude coordinate format should I use?",
    a: "FreeGeoTagger supports both Decimal Degrees (e.g. 40.7128, -74.0060) and Degrees, Minutes, Seconds (DMS, e.g. 40° 42' 46\" N). You can switch formats anytime with synchronized conversion.",
  },
  {
    q: "Does geotagging change or compress image quality?",
    a: "No. For JPEG, PNG, and WebP files, FreeGeoTagger only updates the metadata header segments. Pixel data is not re-compressed or resaved, ensuring 100% lossless preservation.",
  },
  {
    q: "Can I remove GPS metadata from a photo later?",
    a: "Yes. You can wipe location metadata before sharing photos publicly. FreeGeoTagger provides free guides explaining how to strip EXIF data on Windows, macOS, iPhone, and Android.",
  },
  {
    q: "How do I find where an existing photo was taken?",
    a: "Use our free companion tool, the GPS Photo Finder. It reads embedded EXIF coordinates from your photo and displays the exact capture location on an interactive map.",
  },
  {
    q: "Which image formats support GPS metadata?",
    a: "JPEG uses the universal APP1 Exif standard. PNG supports GPS via the standardized eXIf binary chunk. WebP supports EXIF via RIFF containers. HEIC photos are locally converted to JPEG for universal compatibility.",
  },
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
<h1>Free Geotagger — Add GPS Location to Photos Online</h1>
<p>FreeGeoTagger is a free, privacy-first web application to <strong>add GPS coordinates to photos</strong> directly in your browser — no software to install, no account required, and zero file uploads. Upload a single photo or a whole batch, select a location on the interactive map or search any address worldwide, and download your images with verified GPS metadata embedded in standard EXIF headers.</p>
<p>Your photos never leave your device. All image parsing, EXIF metadata editing, and file downloads execute locally in your browser using modern client-side JavaScript. Your images are never transmitted to any server, keeping personal memories, client projects, and location details 100% private.</p>

<h2>How to Geotag Photos in 3 Steps</h2>
<p>Adding GPS coordinates to any photo takes less than a minute:</p>
<ol>
<li><strong>Upload your photos</strong> — Drag and drop your JPG, PNG, WebP, or HEIC images into the dropzone, or click to browse files from your computer or phone. Files remain private on your device.</li>
<li><strong>Set the GPS location</strong> — Click the interactive map to position the pin, type an address or city into the search bar, or enter exact latitude and longitude in decimal degrees or DMS format.</li>
<li><strong>Download geotagged photos</strong> — Save individual images with verified EXIF GPS metadata, or download your entire batch organized in a convenient ZIP archive.</li>
</ol>

<h2>What GPS Data Is Added to Your Photos?</h2>
<p>When you geotag an image, standard geographic metadata is written into the file header according to the EXIF 2.32 specification. This ensures full compatibility with Google Photos, Apple Photos, Adobe Lightroom, Windows Explorer, macOS Preview, and GIS platforms.</p>
<p>The following technical metadata fields are embedded into each photo:</p>
<ul>
<li><strong>GPSLatitude &amp; GPSLatitudeRef</strong> — Degrees, minutes, and seconds stored as rational numbers, paired with a North (N) or South (S) hemisphere flag.</li>
<li><strong>GPSLongitude &amp; GPSLongitudeRef</strong> — Rational degrees, minutes, and seconds, paired with an East (E) or West (W) hemisphere flag.</li>
<li><strong>GPSAltitude &amp; GPSAltitudeRef</strong> — Elevation in meters above sea level stored as a rational fraction, with sea level reference flags.</li>
<li><strong>GPSDateStamp &amp; GPSTimeStamp</strong> — UTC date and time of the location fix in standard EXIF format.</li>
<li><strong>Keywords &amp; Description</strong> — Optional descriptive tags embedded into EXIF and IPTC fields for digital asset management.</li>
</ul>
<p>FreeGeoTagger writes this metadata without recompressing pixel coefficients. For JPEG, PNG, and WebP photos, pixel data remains unchanged down to the byte, ensuring <strong>zero loss of image quality</strong>.</p>

<h2>Supported File Formats &amp; Technical Processing Matrix</h2>
<p>FreeGeoTagger supports the primary image formats used by smartphones, digital cameras, and creative workflows:</p>
<table>
<thead>
<tr>
<th>Format</th>
<th>Extension</th>
<th>Metadata Method</th>
<th>Pixel Preservation</th>
<th>Compatibility</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>JPEG / JPG</strong></td>
<td>.jpg, .jpeg</td>
<td>APP1 Exif Segment</td>
<td>100% Lossless (DCT intact)</td>
<td>Universal (all OS &amp; apps)</td>
</tr>
<tr>
<td><strong>PNG</strong></td>
<td>.png</td>
<td>Binary eXIf Chunk + CRC32</td>
<td>100% Lossless (IDAT intact)</td>
<td>Modern viewers, GIS, web</td>
</tr>
<tr>
<td><strong>WebP</strong></td>
<td>.webp</td>
<td>RIFF Container + EXIF Chunk</td>
<td>100% Lossless (VP8 intact)</td>
<td>Browsers, Android, modern OS</td>
</tr>
<tr>
<td><strong>HEIC / HEIF</strong></td>
<td>.heic</td>
<td>Client-side JPEG Transcode</td>
<td>High Quality (0.95 factor)</td>
<td>Universal JPEG export</td>
</tr>
</tbody>
</table>
<p>Files up to 20MB are supported. Every photo is automatically re-read after metadata injection to verify coordinate precision before download.</p>

<h2>Batch Photo Geotagging — Process Multiple Images at Once</h2>
<p>When working with photos from an event, real estate shoot, job site, or vacation, tagging images one by one is inefficient. FreeGeoTagger includes a fast batch geotagging workflow:</p>
<ul>
<li><strong>Multi-File Queue</strong> — Add dozens of photos at once. Review thumbnails and quickly see which images already contain GPS coordinates.</li>
<li><strong>One-Click Location Apply</strong> — Place the map marker once and apply those coordinates across every queued photo simultaneously.</li>
<li><strong>Individual Adjustments</strong> — Click any photo in the queue to fine-tune its position independently when needed.</li>
<li><strong>Consolidated ZIP Download</strong> — Export all geotagged photos in a single ZIP file with original filenames preserved.</li>
</ul>

<h2>Why Choose FreeGeoTagger?</h2>
<p>Unlike other services that require subscriptions, force account creation, or upload private photos to remote cloud servers, FreeGeoTagger is built for speed, privacy, and simplicity.</p>
<table>
<thead>
<tr>
<th>Feature</th>
<th>FreeGeoTagger</th>
<th>Desktop Software (ExifTool / Lightroom)</th>
<th>Cloud Geotagging Sites</th>
</tr>
</thead>
<tbody>
<tr>
<td>Cost</td>
<td>100% Free Forever</td>
<td>Free (CLI) or $10–$50/mo</td>
<td>Freemium / Monthly fee</td>
</tr>
<tr>
<td>Account Required</td>
<td>No — Instant access</td>
<td>Varies by software</td>
<td>Yes (Mandatory signup)</td>
</tr>
<tr>
<td>File Privacy</td>
<td>100% In-Browser Local</td>
<td>Local on machine</td>
<td>Uploaded to third-party server</td>
</tr>
<tr>
<td>Software Installation</td>
<td>None (Runs in browser)</td>
<td>Requires installation</td>
<td>None</td>
</tr>
<tr>
<td>Interactive Map Picker</td>
<td>Yes (Leaflet + OSM)</td>
<td>Varies (None in CLI)</td>
<td>Sometimes</td>
</tr>
<tr>
<td>Batch Geotagging</td>
<td>Yes with ZIP export</td>
<td>Yes</td>
<td>Often paywalled</td>
</tr>
<tr>
<td>Mobile Support</td>
<td>Full Chrome/Safari support</td>
<td>Desktop only</td>
<td>Mobile-unfriendly</td>
</tr>
<tr>
<td>Quality Preservation</td>
<td>Zero re-compression</td>
<td>Lossless</td>
<td>Often re-compresses photos</td>
</tr>
</tbody>
</table>

<h2>Photo Geotagging vs. GPS Location Detection</h2>
<p>It is helpful to understand the difference between <em>geotagging a photo</em> and <em>finding GPS coordinates in an existing photo</em>:</p>
<ul>
<li><strong>Geotagging (This Tool)</strong> — Used when a photo lacks location metadata or has incorrect coordinates. You choose the location on the map or search an address, and FreeGeoTagger writes those coordinates into the image's EXIF data.</li>
<li><strong>GPS Location Detection (GPS Finder)</strong> — Used when a photo already contains GPS data and you want to see where it was taken. Our free <a href="/gps-finder">GPS Photo Finder</a> reads embedded EXIF data and plots the coordinates on a map without modifying the file.</li>
</ul>
<p>If you inspect an image in GPS Finder and find no location data, you can open FreeGeoTagger with one click to pin and add the coordinates.</p>

<h2>100% Client-Side Privacy &amp; In-Browser Processing</h2>
<p>Photo location data is sensitive. An image can expose a home address, school, private property, or travel location. Sending photos to remote servers introduces unnecessary privacy risks.</p>
<p>FreeGeoTagger follows a strict <strong>zero-upload architecture</strong>:</p>
<ul>
<li><strong>Local File Handling</strong> — Images are loaded into memory using HTML5 FileReader and ArrayBuffer APIs.</li>
<li><strong>In-Memory Processing</strong> — Metadata is decoded and written directly in browser memory without network transfers.</li>
<li><strong>Local File Creation</strong> — Processed files and ZIP archives are generated locally via browser Object URLs.</li>
<li><strong>Offline Functionality</strong> — Once loaded, the metadata engine continues working even without an internet connection.</li>
<li><strong>Zero Retention</strong> — Closing or refreshing the browser tab clears all image data from memory immediately.</li>
</ul>

<h2>Common Real-World Use Cases</h2>
<p>Accurate GPS metadata is essential across many personal and commercial applications:</p>
<ul>
<li><strong>Real Estate Agents &amp; Appraisers</strong> — Ensure listing photos have accurate location tags for MLS feeds, virtual tours, and local discovery. Read our guide on <a href="/blog/how-to-geotag-photos-for-real-estate">geotagging photos for real estate</a>.</li>
<li><strong>Small Businesses &amp; Local SEO</strong> — Add business location coordinates to photos before uploading to Google Business Profile. Learn more in our tutorial on <a href="/blog/how-to-geotag-photos-for-google-business-profile">geotagging for Google Business Profile</a>.</li>
<li><strong>Landscape &amp; Travel Photographers</strong> — Catalog shoots by location, maintain accurate Lightroom archives, and map journeys. See our guide on <a href="/blog/how-to-bulk-geotag-photos">how to bulk geotag photos</a>.</li>
<li><strong>Surveyors &amp; Field Inspectors</strong> — Document job site progress, infrastructure inspections, and environmental samples with verified coordinates.</li>
<li><strong>Journalists &amp; Researchers</strong> — Provide transparent geographic context for documentary photography and reporting.</li>
<li><strong>Smartphone Users</strong> — Fix photos taken with location disabled or stripped by messaging apps. Walkthroughs available for <a href="/blog/how-to-add-gps-to-iphone-photos">iPhone photos</a> and <a href="/blog/how-to-geotag-photos-android">Android photos</a>.</li>
</ul>

<h2>Helpful Guides &amp; Geotagging Resources</h2>
<p>Browse our complete collection of photo geotagging tutorials and resources:</p>
<ul>
<li><a href="/gps-finder">GPS Photo Finder</a> — Extract and view existing GPS coordinates on an interactive map.</li>
<li><a href="/blog/how-to-bulk-geotag-photos">How to Bulk Geotag Photos</a> — Efficient batch workflows for large photo collections.</li>
<li><a href="/blog/how-to-add-gps-to-iphone-photos">How to Add GPS to iPhone Photos</a> — Guide for iPhone camera settings and photo transfers.</li>
<li><a href="/blog/how-to-geotag-photos-android">How to Add GPS to Android Photos</a> — Step-by-step instructions for Android devices.</li>
<li><a href="/blog/what-is-exif-gps-metadata">What Is EXIF GPS Metadata?</a> — Deep dive into EXIF tags, coordinate formats, and standards.</li>
<li><a href="/blog/how-to-remove-gps-data-from-photos">How to Remove GPS Data from Photos</a> — Strip location metadata before sharing photos publicly.</li>
<li><a href="/blog/how-to-fix-wrong-gps-location-on-photos">How to Fix Wrong GPS Location on Photos</a> — Correct drifting coordinates and misplaced map pins.</li>
<li><a href="/blog/best-free-photo-geotagging-tools">Best Free Photo Geotagging Tools in 2026</a> — Comparison of online, desktop, and CLI tools.</li>
<li><a href="/about">About FreeGeoTagger</a> — Learn about our mission and client-side processing technology.</li>
<li><a href="/privacy">Privacy Policy</a> — Review our complete data handling practices and privacy guarantees.</li>
</ul>

<h2>Frequently Asked Questions</h2>
${homeFaqs.map((f) => `<h3>${escapeHtml(f.q)}</h3>\n<p>${escapeHtml(f.a)}</p>`).join("\n")}
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
<p>Nothing is sent anywhere. The file is read from your own disk into memory, the EXIF block is parsed in JavaScript, and the coordinates are rendered on the map. You can confirm this by opening your browser's Network tab, or by disconnecting from the internet once the page has loaded — extraction still works, though the map tiles will stop refreshing.</p>

<h2>Why Use This GPS Finder?</h2>
<ul>
<li><strong>No upload, so no exposure.</strong> Checking where a photo was taken is often exactly the moment you do not want to hand it to a server.</li>
<li><strong>Free with no account</strong> — no sign-up, no file limits, no watermarks.</li>
<li><strong>Reads all common formats</strong> — JPG, PNG, WebP and HEIC, with HEIC handled without a separate conversion step on your part.</li>
<li><strong>Shows the exact numbers</strong> — copy decimal coordinates directly, or open the position in Google Maps.</li>
<li><strong>Works on mobile</strong> — runs in Safari on iPhone and Chrome on Android.</li>
</ul>

<h2>Understanding GPS Metadata in Photos</h2>
<p>Location data is stored in a dedicated GPS sub-directory inside a photo's EXIF metadata. The essential fields are latitude and longitude, each paired with a reference field recording the hemisphere — north or south, east or west. Many cameras also record altitude, a UTC timestamp for the satellite fix, and a compass bearing describing which way the lens was pointing.</p>
<p>Accuracy depends entirely on the device that captured the image. A modern smartphone with a clear view of the sky is typically accurate to within about 5–10 metres. Indoors, underground, or between tall buildings, the fix degrades and a phone may fall back on a cached position from earlier — which is one of the most common reasons a photo appears in the wrong place.</p>
<p>If a photo turns out to have no coordinates at all, that is usually because location services were switched off for the camera, because the file came from a platform that strips metadata on upload, or because it is a screenshot rather than a camera photo. Any of those can be corrected by <a href="/">adding the location yourself</a>, and our guide on <a href="/blog/how-to-fix-wrong-gps-location-on-photos">fixing wrong photo GPS data</a> covers the causes in more detail.</p>

<h2>Who Uses GPS Finder?</h2>
<ul>
<li><strong>Researchers</strong> — extract location data for field studies, documentation, and analysis.</li>
<li><strong>Photographers</strong> — confirm where images were captured and organize archives by location.</li>
<li><strong>Real estate &amp; insurance</strong> — verify that listing or claim photos carry the correct coordinates.</li>
<li><strong>Journalists</strong> — check the stated origin of an image against what its metadata actually says.</li>
<li><strong>Anyone sharing photos publicly</strong> — see what location a file would reveal before you post it. If you want it gone, follow our guide on <a href="/blog/how-to-remove-gps-data-from-photos">removing GPS data from photos</a>.</li>
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
<p>Every guide here is written around a question people actually arrive with — a photo that lost its location, a pin that landed in the wrong city, a folder of listing photos that all need the same coordinates, or an address hiding in a file about to be posted publicly. Each one explains the cause before the fix, because photo metadata problems usually repeat until you understand why they happened.</p>

<h2>Where to Start</h2>
<p>Pick by what you are trying to do rather than reading front to back:</p>
<ul>
<li><strong>A photo has no location and you want to add one.</strong> Start with the guide for your device — <a href="/blog/how-to-add-gps-to-iphone-photos">iPhone</a> or <a href="/blog/how-to-geotag-photos-android">Android</a>.</li>
<li><strong>The location is there but wrong.</strong> Read <a href="/blog/how-to-fix-wrong-gps-location-on-photos">how to fix the wrong GPS location on a photo</a>, which also explains why cached positions and clock drift cause it.</li>
<li><strong>You have many photos from one place.</strong> <a href="/blog/how-to-bulk-geotag-photos">Bulk geotagging</a> covers the batch workflow.</li>
<li><strong>You are about to share photos publicly.</strong> <a href="/blog/how-to-remove-gps-data-from-photos">Removing GPS data</a> covers checking and stripping location first.</li>
<li><strong>You want to understand the format itself.</strong> <a href="/blog/what-is-exif-gps-metadata">What is EXIF GPS metadata</a> explains where coordinates live inside an image file and why editing them costs no quality.</li>
<li><strong>You are choosing a tool.</strong> <a href="/blog/best-free-photo-geotagging-tools">Six free geotagging tools compared</a>, including desktop and command-line options.</li>
</ul>

<h2>A Note on Geotagging and SEO</h2>
<p>Two of these guides cover business use — <a href="/blog/how-to-geotag-photos-for-real-estate">real estate listings</a> and <a href="/blog/how-to-geotag-photos-for-google-business-profile">Google Business Profile</a> — and both say the same uncomfortable thing: photo EXIF data is not a direct Google ranking factor, and most platforms strip metadata when they process an upload. Geotag business photos for accuracy, verification and your own organised library, not as a ranking shortcut. Anyone promising otherwise is overselling it.</p>

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

/** Expand the <KeyTakeaways/>, <BlogFigure/> and <BlogFaq/> components (see
 *  client/src/components/blog-extras.tsx) into static HTML using the shared data in
 *  client/src/lib/blog-content.ts. Without this the tags would survive into the
 *  prerendered output as literal, meaningless markup. */
function expandBlogExtras(jsx: string) {
  const tagRe = /<(KeyTakeaways|BlogFigure|BlogFaq)\s+slug="([^"]+)"\s*\/>/g;
  return jsx.replace(tagRe, (_match, tag: string, slug: string) => {
    const extras = BLOG_EXTRAS[slug];
    if (!extras) throw new Error(`<${tag}> references unknown blog slug "${slug}" — add it to client/src/lib/blog-content.ts`);

    if (tag === "KeyTakeaways") {
      const items = extras.takeaways.map((t) => `<li>${escapeHtml(t)}</li>`).join("\n");
      return `<aside class="key-takeaways">\n<h2>Key takeaways</h2>\n<ul>\n${items}\n</ul>\n</aside>`;
    }

    if (tag === "BlogFigure") {
      const { src, alt, caption, width, height } = extras.image;
      return [
        "<figure>",
        `<img src="${src}" alt="${escapeHtml(alt)}" width="${width}" height="${height}" loading="lazy" decoding="async" />`,
        `<figcaption>${escapeHtml(caption)}</figcaption>`,
        "</figure>",
      ].join("\n");
    }

    // BlogFaq
    const qa = extras.faqs
      .map((f) => `<h3>${escapeHtml(f.q)}</h3>\n<p>${escapeHtml(f.a)}</p>`)
      .join("\n");
    return `<section>\n<h2>Frequently asked questions</h2>\n${qa}\n</section>`;
  });
}

/** Convert a JSX fragment from a page's <article> into plain, crawlable HTML. */
function jsxToHtml(jsx: string) {
  return expandBlogExtras(jsx)
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
  // Blog posts take their FAQs from the shared blog-content module (same data that
  // renders the visible Q&A), everything else from the route's own `faqs`.
  const slug = route.path.replace("/blog/", "");
  const faqs = isBlogPost(route.path) ? BLOG_EXTRAS[slug]?.faqs : route.faqs;
  if (!faqs?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
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
    const slug = route.path.replace("/blog/", "");
    const extras = BLOG_EXTRAS[slug];
    const img = extras?.image;

    schemas.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: route.h1,
      name: route.h1,
      url: pageUrl,
      description: seo.description,
      // Prefer the article's own lead image over the generic social card.
      image: img
        ? { "@type": "ImageObject", url: `${SITE_URL}${img.src}`, width: img.width, height: img.height, caption: img.caption }
        : { "@type": "ImageObject", url: OG_IMAGE, width: 1200, height: 630 },
      datePublished: dates.published,
      dateModified: dates.modified,
      author: AUTHOR,
      publisher: PUBLISHER,
      mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
      inLanguage: "en-US",
      isPartOf: { "@type": "WebSite", name: "FreeGeoTagger", url: SITE_URL },
      // Answer/voice engines use speakable to pick the passages worth reading aloud.
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [".key-takeaways", "h1"],
      },
      // Surfaces the article's own summary points as machine-readable statements.
      ...(extras?.takeaways.length ? { abstract: extras.takeaways.join(" ") } : {}),
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

/** Three sibling articles for a blog post, chosen deterministically by rotating the
 *  blogLinks list. Without this, links flowed only hub -> spoke, leaving several posts
 *  with a single inbound internal link; spoke <-> spoke linking spreads authority and
 *  gives crawlers more paths into the newer articles. */
function siblingLinks(routePath: string) {
  const i = blogLinks.findIndex((l) => l.href === routePath);
  if (i < 0) return [];
  return [1, 2, 3].map((offset) => blogLinks[(i + offset) % blogLinks.length]);
}

async function buildStaticContent(route: RouteMeta) {
  const siblings = siblingLinks(route.path);
  const links = [...(route.links ?? commonLinks), ...siblings];
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
