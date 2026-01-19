# FreeGeoTagger - Free Photo Geotagging Tool

## Overview
A free, open-source, client-side web application for adding GPS coordinates (geotags) to photos. Similar to geoimgr.com but 100% free with no subscriptions or payments. All processing happens in the browser - no images are ever uploaded to any server.

## Features
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
│   │   ├── multi-image-uploader.tsx  # Multi-file drag & drop upload with thumbnails
│   │   ├── geotag-map.tsx            # Leaflet map with draggable marker
│   │   ├── metadata-form.tsx         # Keywords and description inputs
│   │   ├── theme-provider.tsx        # Dark/light mode context
│   │   └── theme-toggle.tsx          # Theme switch button
│   ├── lib/
│   │   └── geotag-utils.ts           # EXIF writing, geocoding, file utilities
│   ├── types/
│   │   └── piexifjs.d.ts             # TypeScript declarations for piexifjs
│   ├── pages/
│   │   └── home.tsx                  # Main landing page
│   └── App.tsx                       # Root component with routing
```

## Key Design Decisions
- Client-side only processing for maximum privacy
- No database needed - purely frontend tool
- Uses piexifjs for robust EXIF GPS embedding
- HEIC files automatically converted to JPEG for processing
- Uses Leaflet with OpenStreetMap (free, no API key required)
- Nominatim API for free reverse geocoding search

## Running the Project
The app runs with `npm run dev` which starts both the Express backend and Vite frontend on port 5000.

## License
MIT License - Free and open source
