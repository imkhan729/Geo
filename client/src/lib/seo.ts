export interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  ogType?: string;
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
}

export const SEO_CONFIG = {
  home: {
    title: "GeoTagger – Free Image Geotagging Tool | Add GPS to Photos Online",
    description: "GeoTagger is a free online tool to add GPS location data to photos. Geotag images locally in your browser with no uploads, no accounts, and full privacy.",
    canonical: "/",
    ogType: "website"
  },
  gpsFinder: {
    title: "GPS Finder - Extract Location from Photos",
    description: "Extract GPS coordinates from any geotagged photo. Upload an image to discover where it was taken and view the exact location on an interactive map. Free and private.",
    canonical: "/gps-finder",
    ogType: "website"
  },
  privacy: {
    title: "Privacy Policy",
    description: "FreeGeoTagger Privacy Policy. Learn how we protect your privacy - all photo processing happens locally in your browser with no data uploads.",
    canonical: "/privacy",
    ogType: "article"
  },
  terms: {
    title: "Terms of Service",
    description: "FreeGeoTagger Terms of Service. Read about the terms and conditions for using our free photo geotagging tool.",
    canonical: "/terms",
    ogType: "article"
  },
  cookies: {
    title: "Cookie Policy",
    description: "FreeGeoTagger Cookie Policy. Learn about how we use cookies and local storage to improve your experience.",
    canonical: "/cookies",
    ogType: "article"
  }
};
