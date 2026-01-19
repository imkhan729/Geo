# GeoFinder - Free Image Location Finder

## Overview
A free, privacy-focused web tool that extracts EXIF metadata from uploaded images and displays GPS location on an interactive map. All processing happens client-side - no images are ever stored or sent to a server.

## Features
- Drag & drop image upload (JPG, PNG, TIFF, HEIC, WebP)
- Client-side EXIF metadata extraction
- GPS location display on interactive Leaflet map
- Copy coordinates to clipboard
- Export metadata as JSON
- Dark/light theme toggle
- Mobile responsive design
- SEO optimized

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **EXIF Parsing**: ExifReader.js
- **Map**: Leaflet with OpenStreetMap tiles

## File Structure
```
client/
├── src/
│   ├── components/
│   │   ├── image-uploader.tsx    # Drag & drop upload component
│   │   ├── metadata-panel.tsx    # EXIF data display
│   │   ├── location-map.tsx      # Leaflet map integration
│   │   ├── theme-provider.tsx    # Dark/light mode context
│   │   └── theme-toggle.tsx      # Theme switch button
│   ├── lib/
│   │   └── exif-utils.ts         # EXIF extraction utilities
│   ├── pages/
│   │   └── home.tsx              # Main landing page
│   └── App.tsx                   # Root component with routing
```

## Key Design Decisions
- Client-side only processing for privacy
- No database needed - purely frontend tool
- Uses Leaflet with OpenStreetMap (free, no API key required)
- ExifReader library for robust EXIF parsing across image formats

## Running the Project
The app runs with `npm run dev` which starts both the Express backend and Vite frontend on port 5000.
