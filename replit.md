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
1. **Landing Mode**: Hero section with upload dropzone, Features, How It Works, GPS Finder, and FAQ sections
2. **Geotagger Mode**: After upload - interactive map on left, image thumbnails and options on right
3. **Finder Mode**: Extract and display GPS coordinates from existing photos

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
├── src/
│   ├── components/
│   │   ├── theme-provider.tsx        # Dark/light mode context
│   │   └── theme-toggle.tsx          # Theme switch button
│   ├── lib/
│   │   └── geotag-utils.ts           # EXIF writing, geocoding, file utilities
│   ├── types/
│   │   └── piexifjs.d.ts             # TypeScript declarations for piexifjs
│   ├── pages/
│   │   └── home.tsx                  # Main page with all 3 modes (landing, geotagger, finder)
│   └── App.tsx                       # Root component with routing
```

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
