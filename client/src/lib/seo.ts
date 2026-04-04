export interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  ogType?: string;
  keywords?: string;
}

/** Inject or replace a named JSON-LD block in <head>.
 *  Also removes any unattributed schema of the same @type (e.g. static blocks
 *  in index.html) to prevent "Duplicate field" errors in Google Search Console.
 */
export function injectPageSchema(id: string, schema: object) {
  // Remove existing schema with this ID
  const existing = document.querySelector(`script[data-schema="${id}"]`);
  if (existing) existing.remove();

  // Remove any static (unattributed) schema of the same @type from index.html
  const schemaType = (schema as Record<string, unknown>)['@type'];
  if (schemaType) {
    document.querySelectorAll('script[type="application/ld+json"]:not([data-schema])').forEach(el => {
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
  const baseUrl = "https://freegeotagger.com";
  const fullTitle = config.title.includes("GeoTagger") 
    ? config.title 
    : `${config.title} | GeoTagger`;
  
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

export const SEO_CONFIG = {
  home: {
    title: "Geotag Photos Free – Add GPS Coordinates to Any Photo Online | FreeGeoTagger",
    description: "Add GPS coordinates to any photo free — 100% private & browser-based. No uploads, no account, no cost. Batch geotag JPG, PNG, WebP & HEIC photos in seconds.",
    canonical: "/",
    ogType: "website",
    keywords: "geotag photos free, add gps to photos online, photo geotagging tool, embed gps in photos, free geotagging, add location to photos, exif gps editor, batch geotagging, geotag jpeg online"
  },
  gpsFinder: {
    title: "GPS Finder – Extract GPS Coordinates from Any Photo Free | FreeGeoTagger",
    description: "Extract GPS coordinates from any photo free — upload a JPG, PNG, WebP or HEIC and instantly see where it was taken on a map. 100% private, no account needed.",
    canonical: "/gps-finder",
    ogType: "website",
    keywords: "gps finder, extract gps from photo, find location of photo, photo gps extractor, read exif gps data, where was photo taken, image location finder, exif viewer online"
  },
  privacy: {
    title: "Privacy Policy | FreeGeoTagger",
    description: "FreeGeoTagger's privacy policy. All photo processing happens locally in your browser — your photos never leave your device. No data is collected or uploaded.",
    canonical: "/privacy",
    ogType: "article"
  },
  terms: {
    title: "Terms of Service | FreeGeoTagger",
    description: "Terms of service for FreeGeoTagger — the free, browser-based photo geotagging tool. Read the conditions for using this service.",
    canonical: "/terms",
    ogType: "article"
  },
  cookies: {
    title: "Cookie Policy | FreeGeoTagger",
    description: "Cookie policy for FreeGeoTagger. Learn how we use cookies and local storage to save your theme preference and improve your experience.",
    canonical: "/cookies",
    ogType: "article"
  },
  blog: {
    title: "Photo Geotagging Blog – Tips, Guides & Tutorials | FreeGeoTagger",
    description: "Practical guides on photo geotagging, EXIF GPS metadata, and adding GPS to photos — for photographers, real estate agents, and iPhone users.",
    canonical: "/blog",
    ogType: "website",
    keywords: "photo geotagging guide, exif gps tutorial, add gps to photos, geotag photos how to, geotagging tips for photographers"
  },
  blogRealEstate: {
    title: "How to Geotag Real Estate Photos for MLS Listings | FreeGeoTagger",
    description: "Learn to add GPS coordinates to real estate listing photos — improve MLS accuracy, boost local SEO, and give buyers precise location context. Free & instant.",
    canonical: "/blog/how-to-geotag-photos-for-real-estate",
    ogType: "article",
    keywords: "geotag real estate photos, add gps to listing photos, real estate photo geotagging, MLS geotagged photos, property photo location"
  },
  blogExifGps: {
    title: "What Is EXIF GPS Metadata? Complete Guide | FreeGeoTagger",
    description: "Learn what EXIF GPS metadata is, how GPS coordinates are stored inside photo files, and which apps read location data. A complete guide for photographers.",
    canonical: "/blog/what-is-exif-gps-metadata",
    ogType: "article",
    keywords: "what is EXIF GPS metadata, EXIF GPS explained, how does photo GPS work, photo location metadata, GPS in JPEG"
  },
  blogIphone: {
    title: "How to Add GPS to iPhone Photos – Free & Instant | FreeGeoTagger",
    description: "iPhone photo missing location data? Add GPS coordinates to any iPhone photo in seconds — free, private, no app install required. Works in Safari on iPhone.",
    canonical: "/blog/how-to-add-gps-to-iphone-photos",
    ogType: "article",
    keywords: "add gps to iphone photos, geotag iphone photos, add location to iphone photo, iphone photo missing location, ios photo gps"
  },
  blogGbp: {
    title: "How to Geotag Photos for Google Business Profile | FreeGeoTagger",
    description: "Add GPS coordinates to photos before uploading to Google Business Profile — boost local SEO, strengthen map indexing, and increase discovery on Google Maps. Free and instant.",
    canonical: "/blog/how-to-geotag-photos-for-google-business-profile",
    ogType: "article",
    keywords: "geotag photos google business profile, add gps to google business photos, google maps photo geotagging, local seo photo metadata, geotag business photos free, gbp photo optimization"
  },
  blogAndroid: {
    title: "How to Add GPS to Android Photos – Free & Instant | FreeGeoTagger",
    description: "Android photo missing location data? Add GPS coordinates to any Android photo in seconds — free, browser-based, no app install required. Works in Chrome on any Android device.",
    canonical: "/blog/how-to-geotag-photos-android",
    ogType: "article",
    keywords: "geotag photos android, add gps to android photos, android photo missing location, geotagging android photos free, add location to android photo, fix android photo no location"
  },
  blogBestTools: {
    title: "Best Free Photo Geotagging Tools in 2026 | FreeGeoTagger",
    description: "Compare the best free photo geotagging tools in 2026 — browser-based, desktop, and command-line options reviewed for speed, privacy, batch support, and ease of use.",
    canonical: "/blog/best-free-photo-geotagging-tools",
    ogType: "article",
    keywords: "best photo geotagging tools, free geotagging software 2026, photo geotagging tool comparison, best free geotagging app, online geotagging tool, geotag photos free software"
  }
};
