export interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  ogType?: string;
  keywords?: string;
  ogImage?: string;
  robots?: string;
}

export const SITE_URL = "https://freegeotagger.com";
export const SITE_LOGO_URL = "https://freegeotagger.com/favicon.png";
export const SITE_LOGO_WIDTH = 289;
export const SITE_LOGO_HEIGHT = 289;

/** Canonical Organization schema with validated logo dimensions */
export const ORGANIZATION_SCHEMA = {
  "@type": "Organization",
  "name": "FreeGeoTagger",
  "url": SITE_URL,
  "logo": {
    "@type": "ImageObject",
    "url": SITE_LOGO_URL,
    "width": SITE_LOGO_WIDTH,
    "height": SITE_LOGO_HEIGHT,
  },
  "sameAs": [
    "https://twitter.com/freegeotagger"
  ]
};

/** Canonical WebSite schema for Google Site Name recognition */
export const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "FreeGeoTagger",
  "alternateName": ["Free Geo Tagger", "GeoTagger"],
  "url": `${SITE_URL}/`
};

/** Inject or replace a named JSON-LD block in <head>.
 *  Removes ALL other JSON-LD scripts of the same @type (static or dynamic)
 *  to prevent "Duplicate field" errors in Google Search Console.
 */
export function injectPageSchema(id: string, schema: object) {
  // Remove existing schema with this ID first
  const existing = document.querySelector(`script[data-schema="${id}"]`);
  if (existing) existing.remove();

  // Remove every other JSON-LD script with the same @type, whether it has a
  // data-schema attribute or not (covers static blocks in index.html and
  // previously-injected schemas from other routes during client-side navigation)
  const schemaType = (schema as Record<string, unknown>)['@type'];
  if (schemaType) {
    document.querySelectorAll('script[type="application/ld+json"]').forEach(el => {
      if (el.getAttribute('data-schema') === id) return; // already removed above
      try {
        const parsed = JSON.parse(el.textContent || '');
        if (parsed['@type'] === schemaType) el.remove();
      } catch { /* ignore malformed JSON */ }
    });
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-schema', id);
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

export function updatePageSEO(config: SEOConfig) {
  const baseUrl = SITE_URL;
  // Titles in SEO_CONFIG are already length-tuned to Google's ~60-character render
  // limit (enforced by script/validate-meta.ts). Appending a brand suffix here would
  // push them over and cause SERP truncation, so use them verbatim.
  const fullTitle = config.title;

  document.title = fullTitle;
  
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute("content", config.description);
  }
  
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute("content", fullTitle);
  }
  
  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) {
    ogDescription.setAttribute("content", config.description);
  }
  
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl && config.canonical) {
    ogUrl.setAttribute("content", `${baseUrl}${config.canonical}`);
  }
  
  const ogType = document.querySelector('meta[property="og:type"]');
  if (ogType && config.ogType) {
    ogType.setAttribute("content", config.ogType);
  }

  if (config.ogImage) {
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute("content", config.ogImage);
    const twImage = document.querySelector('meta[name="twitter:image"]');
    if (twImage) twImage.setAttribute("content", config.ogImage);
  }

  if (config.robots) {
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) robots.setAttribute("content", config.robots);
  }
  
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) {
    twitterTitle.setAttribute("content", fullTitle);
  }
  
  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  if (twitterDescription) {
    twitterDescription.setAttribute("content", config.description);
  }
  
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical && config.canonical) {
    canonical.setAttribute("href", `${baseUrl}${config.canonical}`);
  }

  if (config.keywords) {
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute("content", config.keywords);
    }
  }
}

/** Every page's canonical metadata. Single source of truth: the React runtime reads it
 *  via updatePageSEO(), and script/generate-seo-pages.ts imports it for the prerendered
 *  HTML, so the two can never drift. Titles are 50-60 chars and descriptions 140-160,
 *  enforced by script/validate-meta.ts which fails the build on violations. */
export const SEO_CONFIG = {
  home: {
    title: "Geotag Photos Free – Add GPS to Any Photo in Seconds",
    description: "Add GPS coordinates to any photo free, right in your browser. No uploads, no signup. Batch geotag JPG, PNG, WebP and HEIC with zero quality loss.",
    canonical: "/",
    ogType: "website",
    keywords: "geotag photos free, add gps to photos online, photo geotagging tool, embed gps in photos, free geotagging, add location to photos, exif gps editor, batch geotagging, geotag jpeg online"
  },
  gpsFinder: {
    title: "GPS Photo Finder – See Where Any Photo Was Taken Free",
    description: "Upload a photo to see exactly where it was taken on a map. Free GPS photo finder reads EXIF location data privately in your browser. No signup.",
    canonical: "/gps-finder",
    ogType: "website",
    keywords: "gps finder, extract gps from photo, find location of photo, photo gps extractor, read exif gps data, where was photo taken, image location finder, exif viewer online"
  },
  privacy: {
    title: "Privacy Policy – How We Handle Your Photos and Data",
    description: "How FreeGeoTagger handles your data: photos processed locally in your browser, cookie use, advertising partners, and your GDPR and CCPA rights.",
    canonical: "/privacy",
    ogType: "article",
    keywords: "freegeotagger privacy policy, photo metadata privacy, exif data privacy, browser based photo processing"
  },
  terms: {
    title: "Terms of Service – Using the FreeGeoTagger Tools Free",
    description: "The terms for using FreeGeoTagger's free photo geotagging and GPS Finder tools, including acceptable use, disclaimers and limits of liability.",
    canonical: "/terms",
    ogType: "article",
    keywords: "freegeotagger terms of service, geotagging tool terms, acceptable use policy"
  },
  cookies: {
    title: "Cookie Policy – Cookies, Consent and How to Opt Out",
    description: "Which cookies FreeGeoTagger uses, how Google Consent Mode works, and how to control or delete advertising and analytics cookies in your browser.",
    canonical: "/cookies",
    ogType: "article",
    keywords: "freegeotagger cookie policy, consent mode v2, advertising cookies, analytics cookies control"
  },
  about: {
    title: "About FreeGeoTagger – Free Private Photo Geotagging",
    description: "Learn who builds FreeGeoTagger, why it processes photos locally in your browser, and how the free geotagging and GPS Finder tools protect privacy.",
    canonical: "/about",
    ogType: "article",
    keywords: "about FreeGeoTagger, photo geotagging tool, free GPS photo metadata tool, private image geotagging"
  },
  contact: {
    title: "Contact FreeGeoTagger – Support and Site Questions",
    description: "Contact FreeGeoTagger with questions about photo geotagging, EXIF GPS data, privacy or site content. Email us and include the page URL in question.",
    canonical: "/contact",
    ogType: "article",
    keywords: "contact FreeGeoTagger, geotagging support, photo GPS metadata help, FreeGeoTagger email"
  },
  blog: {
    title: "Photo Geotagging Guides, Tips and EXIF GPS Tutorials",
    description: "Practical guides on geotagging photos, editing EXIF GPS data and fixing photo locations. Step-by-step tutorials for iPhone, Android and real estate.",
    canonical: "/blog",
    ogType: "website",
    keywords: "photo geotagging guide, exif gps tutorial, add gps to photos, geotag photos how to, geotagging tips for photographers"
  },
  blogRealEstate: {
    title: "How to Geotag Real Estate Photos for MLS Listings 2026",
    description: "Add GPS coordinates to real estate listing photos to improve MLS accuracy and local SEO. Free step-by-step guide for agents and property photographers.",
    canonical: "/blog/how-to-geotag-photos-for-real-estate",
    ogType: "article",
    keywords: "geotag real estate photos, add gps to listing photos, real estate photo geotagging, MLS geotagged photos, property photo location"
  },
  blogExifGps: {
    title: "What Is EXIF GPS Metadata? The Complete 2026 Guide",
    description: "Learn what EXIF GPS metadata is, how latitude and longitude are stored inside photo files, and which apps read it. A complete guide for photographers.",
    canonical: "/blog/what-is-exif-gps-metadata",
    ogType: "article",
    keywords: "what is EXIF GPS metadata, EXIF GPS explained, how does photo GPS work, photo location metadata, GPS in JPEG"
  },
  blogIphone: {
    title: "How to Add GPS Location to iPhone Photos Free 2026",
    description: "iPhone photo missing its location? Add GPS coordinates to any iPhone photo free in Safari. No app to install, no account, and no loss of image quality.",
    canonical: "/blog/how-to-add-gps-to-iphone-photos",
    ogType: "article",
    keywords: "add gps to iphone photos, geotag iphone photos, add location to iphone photo, iphone photo missing location, ios photo gps"
  },
  blogGbp: {
    title: "How to Geotag Photos for Google Business Profile Free",
    description: "Geotag your business photos before uploading to Google Business Profile. Free step-by-step guide to strengthen local relevance and map discovery.",
    canonical: "/blog/how-to-geotag-photos-for-google-business-profile",
    ogType: "article",
    keywords: "geotag photos google business profile, add gps to google business photos, google maps photo geotagging, local seo photo metadata, geotag business photos free, gbp photo optimization"
  },
  blogAndroid: {
    title: "How to Add GPS to Android Photos Free – No App Needed",
    description: "Android photo missing location data? Add GPS coordinates to any Android photo free in Chrome. No app install, no signup, and zero image quality loss.",
    canonical: "/blog/how-to-geotag-photos-android",
    ogType: "article",
    keywords: "geotag photos android, add gps to android photos, android photo missing location, geotagging android photos free, add location to android photo, fix android photo no location"
  },
  blogBestTools: {
    title: "6 Best Free Photo Geotagging Tools in 2026 Compared",
    description: "Compare the 6 best free photo geotagging tools for 2026. Browser, desktop and command-line options rated for privacy, batch support and ease of use.",
    canonical: "/blog/best-free-photo-geotagging-tools",
    ogType: "article",
    keywords: "best photo geotagging tools, free geotagging software 2026, photo geotagging tool comparison, best free geotagging app, online geotagging tool, geotag photos free software"
  },
  blogRemoveGps: {
    title: "How to Remove GPS Location Data From Photos Free 2026",
    description: "Remove GPS location data from photos before you share them. Step-by-step privacy guide for iPhone, Android, Windows and Mac, with zero quality loss.",
    canonical: "/blog/how-to-remove-gps-data-from-photos",
    ogType: "article",
    keywords: "remove gps data from photos, delete photo location data, strip exif gps, remove location from photo iphone, remove geotag android, photo privacy metadata"
  },
  blogFixWrongGps: {
    title: "How to Fix the Wrong GPS Location on Your Photos Free",
    description: "Photo pinned to the wrong place on the map? Learn why photo GPS data goes wrong and how to correct the coordinates in seconds, free and fully private.",
    canonical: "/blog/how-to-fix-wrong-gps-location-on-photos",
    ogType: "article",
    keywords: "fix wrong gps location photo, change photo location data, edit photo gps coordinates, photo shows wrong location, correct exif gps, photo location wrong google photos"
  },
  blogBulkGeotag: {
    title: "How to Bulk Geotag Photos – Batch Add GPS to Hundreds",
    description: "Batch geotag hundreds of photos at once with the same GPS location. Free bulk workflow for events, job sites, property listings and travel archives.",
    canonical: "/blog/how-to-bulk-geotag-photos",
    ogType: "article",
    keywords: "bulk geotag photos, batch geotagging, add gps to multiple photos, geotag many photos at once, batch add location to photos, bulk exif gps editor"
  }
};
