# FreeGeoTagger - Free Photo Geotagging Tool

## Overview
A free, open-source, client-side web application for adding GPS coordinates (geotags) to photos. Similar to geoimgr.com but 100% free with no subscriptions or payments. All processing happens in the browser - no images are ever uploaded to any server.

## Features
- Modern landing page with hero section, Features, How It Works, and FAQ sections
- GPS Finder tool - extract location from existing geotagged photos
- Upload one or multiple images (JPG, PNG, WebP, HEIC supported)
- Interactive Leaflet map with draggable marker
- Search for places using Nominatim reverse geocoding
- Use current browser location
- Manual coordinate input with validation
- Optional keywords and description metadata
- Batch processing - apply same geotag to all images
- Download geotagged images with "_geotagged" suffix
- Dark/light theme toggle
- Mobile responsive design

## Application Modes
1. **Landing Mode**: Hero section with upload dropzone, Features, How It Works, and FAQ sections
2. **Geotagger Mode**: After upload - interactive map on left, image thumbnails and options on right
3. **GPS Finder Page** (/gps-finder): Separate dedicated page to extract and display GPS coordinates from existing photos with description and interactive map

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **EXIF Manipulation**: piexifjs for reading/writing GPS data
- **HEIC Support**: heic2any for converting HEIC to JPEG
- **Map**: Leaflet with OpenStreetMap tiles (free, no API key)
- **File Download**: file-saver library
- **Geocoding**: Nominatim API (free)

## File Structure
```
client/
├── index.html                        # Main HTML with comprehensive SEO meta tags
├── public/
│   ├── robots.txt                    # Search engine crawler rules
│   └── sitemap.xml                   # XML sitemap for all pages
├── src/
│   ├── components/
│   │   ├── theme-provider.tsx        # Dark/light mode context
│   │   └── theme-toggle.tsx          # Theme switch button
│   ├── lib/
│   │   ├── geotag-utils.ts           # EXIF writing, geocoding, file utilities
│   │   └── seo.ts                    # SEO utilities for page-specific meta tags
│   ├── types/
│   │   └── piexifjs.d.ts             # TypeScript declarations for piexifjs
│   ├── pages/
│   │   ├── home.tsx                  # Main page (landing + geotagger modes)
│   │   ├── gps-finder.tsx            # GPS Finder page
│   │   ├── privacy.tsx               # Privacy Policy page
│   │   ├── terms.tsx                 # Terms of Service page
│   │   └── cookies.tsx               # Cookie Policy page
│   └── App.tsx                       # Root component with routing
```

## SEO Implementation
Domain: freegeotagger.com
Branding: "GeoTagger" (user-facing) vs "freegeotagger.com" (domain)

### Homepage Sections (SEO-optimized content)
1. Hero: H1 "Add GPS Location to Your Photos Instantly" + H2 subtitle
2. What Is GeoTagger? - Introduction section
3. What Is Image Geotagging? - 4 educational cards
4. Privacy-First by Design - 4 privacy feature cards
5. Why Choose GeoTagger? - 4 feature cards
6. Who Should Use GeoTagger? - 6 use case cards
7. How It Works - 3 step guide
8. GeoTagger vs Other Tools - 5 comparison cards
9. FAQ - 6 questions with accordion
10. Footer with SEO description

### On-Page SEO
- Page title: "GeoTagger – Free Image Geotagging Tool | Add GPS to Photos Online"
- Comprehensive meta tags (title, description, keywords, author, robots)
- Open Graph tags for social sharing (Facebook, LinkedIn)
- Twitter Card tags for Twitter sharing
- Canonical URLs for all pages
- Page-specific titles and descriptions via seo.ts utility

### Technical SEO
- robots.txt allowing all major search engines
- XML sitemap with all pages and priorities
- JSON-LD structured data (SoftwareApplication, Organization, FAQPage with 6 questions, BreadcrumbList)
- Preconnect hints for performance
- Mobile-friendly responsive design
- Semantic HTML structure

### Structured Data
- SoftwareApplication schema
- Organization schema
- FAQ schema matching all 6 on-page questions
- Breadcrumb schema for navigation

## Key Design Decisions
- Client-side only processing for maximum privacy
- No database needed - purely frontend tool
- Single-page app with three modes (landing, geotagger, finder) controlled by state
- Uses piexifjs for robust EXIF GPS embedding
- HEIC files automatically converted to JPEG for processing
- Uses Leaflet with OpenStreetMap (free, no API key required)
- Nominatim API for free reverse geocoding search
- Comprehensive data-testid attributes on all interactive elements

## Running the Project
The app runs with `npm run dev` which starts both the Express backend and Vite frontend on port 5000.

## License
MIT License - Free and open source
