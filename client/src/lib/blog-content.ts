/**
 * Per-article extras: key takeaways, FAQs and the lead image.
 *
 * This is the single source for three things that must appear identically in the
 * React page, the prerendered HTML, and the JSON-LD:
 *
 *  - Key takeaways — an answer-first summary block. Answer engines and LLMs quote
 *    short, self-contained, factual statements far more readily than they quote
 *    prose buried mid-article.
 *  - FAQs — rendered as visible Q&A *and* emitted as FAQPage schema. Answers lead
 *    with the direct answer in the first sentence, then qualify, because extraction
 *    usually keeps only the opening sentence or two.
 *  - Lead image — with descriptive alt text and a caption, plus ImageObject schema.
 *
 * script/generate-seo-pages.ts expands <KeyTakeaways/>, <BlogFigure/> and
 * <BlogFaq/> into static HTML from this module, so the content reaches crawlers
 * without being duplicated in every .tsx file.
 *
 * Keyed by URL slug (the part after /blog/).
 */

export type Faq = { q: string; a: string };

export type BlogImage = {
  /** Absolute path under /public. */
  src: string;
  /** Describes the image content for screen readers and image search. */
  alt: string;
  /** Visible caption. Says "Diagram" explicitly when it is not a screenshot. */
  caption: string;
  width: number;
  height: number;
};

export type BlogExtras = {
  takeaways: string[];
  faqs: Faq[];
  image: BlogImage;
};

const SHOT_UPLOAD: BlogImage = {
  src: "/screenshots/geotag-tool-upload.jpg",
  alt: "FreeGeoTagger's geotagging tool showing the drag-and-drop upload area with JPG, PNG, WebP and HEIC format badges and a note that photos are processed locally.",
  caption: "The FreeGeoTagger upload step. Files are read in the browser — nothing is uploaded to a server.",
  width: 1200,
  height: 733,
};

const SHOT_MOBILE: BlogImage = {
  src: "/screenshots/geotag-tool-mobile.jpg",
  alt: "FreeGeoTagger running in a mobile browser, showing the photo drop area sized for a phone screen.",
  caption: "The same tool on a phone — it runs in Safari and Chrome for mobile with no app install.",
  width: 430,
  height: 760,
};

const SHOT_FINDER: BlogImage = {
  src: "/screenshots/gps-finder-tool.jpg",
  alt: "FreeGeoTagger's GPS Finder page, used to read existing EXIF GPS coordinates out of a photo and show the location on a map.",
  caption: "GPS Finder reads the location already stored in a photo, so you can check what a file reveals.",
  width: 1200,
  height: 733,
};

const SHOT_STEPS: BlogImage = {
  src: "/screenshots/geotag-three-steps.jpg",
  alt: "Three-step geotagging process: upload your photos, set the GPS location on the map, then download the geotagged photos.",
  caption: "The whole workflow is three steps, and batch mode applies one location to many photos at once.",
  width: 1200,
  height: 571,
};

const SHOT_COMPARISON: BlogImage = {
  src: "/screenshots/geotag-comparison.jpg",
  alt: "Comparison table of FreeGeoTagger against desktop software and cloud tools across free use, account requirement, file uploads, browser support, batch geotagging, HEIC support and quality loss.",
  caption: "How browser-based, desktop and cloud geotagging tools differ on the points that usually matter.",
  width: 1200,
  height: 623,
};

const DIAGRAM_EXIF: BlogImage = {
  src: "/diagrams/exif-gps-structure.png",
  alt: "Diagram of a JPEG file's segments — SOI, APP1/Exif, DQT/DHT/SOF and compressed image data — with the APP1 segment expanded to show the TIFF header, IFD0 and the GPS sub-IFD containing GPSLatitude, GPSLatitudeRef, GPSLongitude, GPSLongitudeRef, GPSAltitude, GPSTimeStamp, GPSDateStamp, GPSImgDirection and GPSSpeed.",
  caption: "Diagram: GPS fields live in the APP1 segment's GPS sub-IFD, separate from the compressed pixel data — which is why editing them costs no image quality.",
  width: 1200,
  height: 760,
};

const DIAGRAM_FLOW: BlogImage = {
  src: "/diagrams/geotag-workflow.png",
  alt: "Diagram showing browser-based geotagging: a photo with no GPS data, reading its EXIF APP1 segment, writing latitude and longitude into the GPS sub-IFD, and producing a geotagged photo — all on the user's device, with the server never receiving the photo.",
  caption: "Diagram: every step runs on your device. The server never receives the image.",
  width: 1200,
  height: 560,
};

export const BLOG_EXTRAS: Record<string, BlogExtras> = {
  "how-to-add-gps-to-iphone-photos": {
    image: SHOT_MOBILE,
    takeaways: [
      "iPhone photos lose GPS data when Location Services was off for the Camera app, when the photo was shared through an app that strips metadata, or when it was exported as a copy.",
      "iOS itself cannot add GPS coordinates to a photo that has none — the Photos app can only adjust a location it already recorded.",
      "You can add coordinates in Safari on the iPhone itself, with no app install, and the file never leaves the device.",
      "HEIC files are converted to JPEG during the process because JPEG has the broadest EXIF GPS compatibility.",
    ],
    faqs: [
      {
        q: "Can I add GPS location to an iPhone photo?",
        a: "Yes. Open the photo in FreeGeoTagger in Safari, set the location on the map or by address, and download the result with GPS coordinates written into its EXIF metadata. It works on the iPhone itself and needs no app.",
      },
      {
        q: "Why do some of my iPhone photos have no location?",
        a: "The most common cause is Location Services being disabled for the Camera app when the photo was taken. Photos also lose location when they are sent through messaging apps or social platforms, which strip metadata, or when exported as an unmodified copy.",
      },
      {
        q: "Can the iPhone Photos app add a location itself?",
        a: "No. The Photos app can adjust or remove a location on a photo that already has one, but it cannot create GPS data where none exists. Adding coordinates to a photo with no location requires a tool that writes EXIF metadata directly.",
      },
      {
        q: "Will adding GPS reduce my iPhone photo's quality?",
        a: "No. Only the EXIF metadata block is rewritten, and the compressed pixel data is copied through untouched. There is no decode and re-encode step, so no generation loss. HEIC files are converted to JPEG at high quality for compatibility.",
      },
      {
        q: "Does the photo get uploaded to a server?",
        a: "No. All processing happens in JavaScript inside your browser tab. You can confirm this by turning off mobile data and Wi-Fi after the page loads — the tool still works.",
      },
    ],
  },

  "how-to-geotag-photos-android": {
    image: DIAGRAM_FLOW,
    takeaways: [
      "Android photos most often lack GPS because the camera app's location permission was denied, or because the image came from a download or a screenshot.",
      "Google Photos shows a location when it can infer one, but that inferred location is not necessarily written into the file's EXIF data.",
      "Chrome on Android can write real EXIF GPS coordinates with no app install and no account.",
      "Because processing is local, the photo is never uploaded — which also means it works on a metered or offline connection once the page has loaded.",
    ],
    faqs: [
      {
        q: "How do I add GPS coordinates to an Android photo?",
        a: "Open FreeGeoTagger in Chrome on your Android device, select the photo, set the location by tapping the map or searching an address, then download it. The coordinates are written into the photo's EXIF metadata.",
      },
      {
        q: "Why does Google Photos show a location my file does not have?",
        a: "Google Photos can infer approximate location from your account's location history rather than from the file itself. That inferred value lives in Google's records, not in the photo's EXIF data, so it disappears when you export or share the file.",
      },
      {
        q: "Do I need to install an app to geotag Android photos?",
        a: "No. The tool runs entirely in the mobile browser. There is nothing to install, no permissions to grant beyond optionally sharing your current location, and no account to create.",
      },
      {
        q: "Which Android photo formats are supported?",
        a: "JPG, PNG, WebP and HEIC are all supported. JPG is the most common Android camera output and has the widest EXIF GPS support across other apps and platforms.",
      },
    ],
  },

  "what-is-exif-gps-metadata": {
    image: DIAGRAM_EXIF,
    takeaways: [
      "EXIF stands for Exchangeable Image File Format, a standard for storing metadata inside image files.",
      "GPS data lives in a dedicated GPS sub-IFD inside the JPEG's APP1 segment, referenced from IFD0 by tag 0x8825.",
      "Only four fields are strictly required to place a photo on a map: GPSLatitude, GPSLatitudeRef, GPSLongitude and GPSLongitudeRef.",
      "Coordinates are stored as RATIONAL pairs of 32-bit integers in degrees, minutes and seconds — most software converts to and from decimal degrees for you.",
      "Because metadata sits separately from the compressed pixel data, editing GPS fields cannot degrade image quality.",
    ],
    faqs: [
      {
        q: "What is EXIF GPS metadata?",
        a: "EXIF GPS metadata is location information embedded inside a photo file, including latitude, longitude and optionally altitude, timestamp and compass direction. Apps such as Google Photos, Apple Photos and Lightroom read it to place photos on a map.",
      },
      {
        q: "Where exactly is GPS data stored in a JPEG?",
        a: "In the APP1 segment, which holds a TIFF-structured block. IFD0 carries camera details and references a GPS sub-IFD by tag 0x8825; the GPS fields live in that sub-directory, entirely separate from the compressed image data.",
      },
      {
        q: "Which image formats support EXIF GPS?",
        a: "JPEG and TIFF have full native support. HEIC stores location in a compatible metadata block, WebP uses an Exif chunk, and PNG uses an eXIf chunk. RAW formats such as DNG, CR2, NEF and ARW also support GPS fields.",
      },
      {
        q: "How are latitude and longitude actually encoded?",
        a: "As three RATIONAL values — degrees, minutes and seconds — each a pair of 32-bit integers forming a fraction. A separate reference field records the hemisphere (N/S, E/W), because the numeric values themselves are unsigned.",
      },
      {
        q: "Can I add EXIF GPS data to a photo that has none?",
        a: "Yes. Any JPEG, PNG, WebP or HEIC file can have GPS fields written into it after the fact. The pixel data is unaffected, so there is no quality cost to adding or correcting coordinates.",
      },
      {
        q: "Does editing EXIF data change how the photo looks?",
        a: "No. Metadata and pixel data occupy different parts of the file. A tool that only rewrites the metadata segment leaves the image bytes identical, which is why there is no visible change and no generation loss.",
      },
    ],
  },

  "how-to-geotag-photos-for-real-estate": {
    image: SHOT_STEPS,
    takeaways: [
      "Geotagged listing photos give the MLS, portals and buyers an unambiguous record of where a property photo was taken.",
      "Use the property's own coordinates rather than your office or the street centroid, so the pin lands on the actual parcel.",
      "Batch mode applies one location to an entire shoot, which is the normal case for property photography.",
      "Photo geotagging supports local relevance signals but does not by itself rank a listing — it is one input among many.",
      "Check what a photo already contains before publishing, since agent-shot photos can carry unintended locations.",
      "Many MLS platforms and portals re-encode uploads and discard metadata, so geotag and keep your master files rather than relying on a portal's copy to retain coordinates.",
    ],
    faqs: [
      {
        q: "Should real estate photos be geotagged?",
        a: "Yes, for accuracy and verification. Coordinates tie each photo to the property it depicts, which helps MLS data quality, gives portals consistent location context, and lets you prove where a photo was taken if a listing is questioned.",
      },
      {
        q: "Does geotagging photos improve local SEO for a listing?",
        a: "It contributes a location signal but is not a ranking lever on its own. Treat it as one accuracy input alongside a correct address, complete listing data and genuine local content. Claims that geotagging alone lifts rankings are overstated.",
      },
      {
        q: "What coordinates should I use for a property?",
        a: "The coordinates of the property itself, ideally the building footprint rather than the street centre or the block. Search the full address in the tool, then fine-tune by dragging the map pin onto the correct parcel.",
      },
      {
        q: "Can I geotag a whole shoot at once?",
        a: "Yes. Upload every photo from the property, set the location once, and download them all as a ZIP. This is the intended workflow for property photography, where all images share a single location.",
      },
      {
        q: "Will the MLS strip my photo metadata?",
        a: "Some systems re-encode uploads and discard metadata. Geotag your masters and keep them, so you retain a coordinate-bearing original regardless of what any individual portal does to its own copies.",
      },
    ],
  },

  "how-to-geotag-photos-for-google-business-profile": {
    image: SHOT_UPLOAD,
    takeaways: [
      "Geotagging business photos before upload adds a consistent, accurate location signal to your own image library.",
      "Google has stated that photo EXIF data is not a direct local ranking factor, so treat geotagging as accuracy and record-keeping rather than a ranking trick.",
      "Use your real business coordinates. Fabricating locations to appear in areas you do not serve risks your profile.",
      "The durable local SEO wins remain a complete profile, correct categories, genuine reviews and real photos of your actual premises.",
    ],
    faqs: [
      {
        q: "Does geotagging photos help Google Business Profile rankings?",
        a: "Not directly. Google has indicated that photo EXIF data is not a local ranking factor, and uploads are typically re-encoded. Geotag for accurate records and consistency, not as a ranking shortcut.",
      },
      {
        q: "Should I still geotag business photos?",
        a: "Yes, for your own library. Coordinate-tagged masters let you prove where a photo was taken, organise images by location across multiple sites, and keep consistent metadata wherever you publish them.",
      },
      {
        q: "Does Google keep the EXIF data I upload?",
        a: "Usually not. Platforms commonly strip or rewrite metadata when they process and resize uploads, so do not assume your coordinates survive. Keep your geotagged originals.",
      },
      {
        q: "Is it risky to fake photo locations?",
        a: "Yes. Misrepresenting where your business operates conflicts with Google's guidelines and can affect your profile. Only tag photos with locations where you genuinely took them.",
      },
    ],
  },

  "best-free-photo-geotagging-tools": {
    image: SHOT_COMPARISON,
    takeaways: [
      "The six options worth knowing are FreeGeoTagger, GeoSetter, HoudahGeo, Adobe Lightroom, digiKam and ExifTool.",
      "Choose a browser tool for speed and privacy, a desktop app for large local archives, and ExifTool for scripted or automated work.",
      "Only browser-local and desktop tools keep photos on your own machine; cloud tools require an upload.",
      "HEIC support is the most common gap in older desktop software.",
      "For a one-off correction, a browser tool is almost always fastest; for thousands of files on a schedule, ExifTool wins.",
    ],
    faqs: [
      {
        q: "What is the best free photo geotagging tool?",
        a: "It depends on the job. FreeGeoTagger is fastest for occasional use and keeps photos on your device; digiKam and GeoSetter suit large desktop libraries; ExifTool is best for scripted batch work. All are free.",
      },
      {
        q: "Is there a free geotagging tool that does not upload my photos?",
        a: "Yes. Browser-based tools that process locally, such as FreeGeoTagger, never transmit the file. Desktop applications including GeoSetter, digiKam and ExifTool also work entirely offline on your own machine.",
      },
      {
        q: "Which tool is best for geotagging thousands of photos?",
        a: "ExifTool, because it is scriptable and can apply coordinates or GPS track logs across huge directories unattended. For a few hundred files that share one location, a batch-capable browser tool is quicker to set up.",
      },
      {
        q: "Do free geotagging tools support iPhone HEIC files?",
        a: "Support varies and is the most frequent limitation in older desktop software. FreeGeoTagger converts HEIC to JPEG automatically; ExifTool handles HEIC directly; some GUI tools require converting first.",
      },
    ],
  },

  "how-to-remove-gps-data-from-photos": {
    image: SHOT_FINDER,
    takeaways: [
      "A photo taken at home and posted publicly can reveal your home address through its EXIF GPS coordinates.",
      "Most large social platforms strip metadata on upload, but direct file shares, email attachments and cloud links usually do not.",
      "Check before you assume: read the photo's existing GPS data first, rather than trusting that a platform removed it.",
      "On iOS use Options in the share sheet to exclude location; on Android and Windows you can remove location from the file's details or properties.",
      "Removing GPS metadata does not alter image quality, because only the metadata block changes.",
    ],
    faqs: [
      {
        q: "How do I remove GPS location data from a photo?",
        a: "First check what the photo contains using a GPS reader, then strip it. On iPhone use the share sheet's Options and turn off Location; on Windows use File Properties and Remove Properties; on Android use the photo's details panel.",
      },
      {
        q: "Do social media platforms remove photo location data?",
        a: "Major platforms including Instagram, Facebook and X generally strip EXIF metadata when processing uploads. Direct file transfers, email attachments, messaging apps that send originals, and cloud storage links often preserve it.",
      },
      {
        q: "How can I check whether a photo contains GPS data?",
        a: "Open it in a GPS reader such as FreeGeoTagger's GPS Finder, which extracts the EXIF coordinates locally and shows the location on a map. On Windows you can also check Properties, then Details.",
      },
      {
        q: "Does removing GPS data damage the photo?",
        a: "No. Only the metadata section is rewritten and the compressed pixel data is untouched, so the image is visually identical with no re-compression.",
      },
      {
        q: "Should I remove location from every photo I share?",
        a: "Consider it for photos taken at home, at a child's school, or anywhere you would not publish the address. Location data is genuinely useful for organising your own archive, so the decision is about what you publish, not what you keep.",
      },
    ],
  },

  "how-to-fix-wrong-gps-location-on-photos": {
    image: SHOT_FINDER,
    takeaways: [
      "Wrong photo coordinates usually come from a weak GPS fix indoors, a stale cached position, an incorrect device clock, or metadata rewritten by an editing app.",
      "Correcting the location means overwriting the existing GPS fields, not deleting and re-adding the photo.",
      "Verify the stored coordinates first so you know whether the file is wrong or only the viewing app is guessing.",
      "Google Photos and Apple Photos may keep showing a cached place name until they re-read the file, so re-import after correcting.",
      "Overwriting coordinates costs no image quality, since only the metadata block changes.",
    ],
    faqs: [
      {
        q: "How do I fix the wrong GPS location on a photo?",
        a: "Open the photo in FreeGeoTagger, set the correct position on the map or by address, and download it. The new coordinates overwrite the existing EXIF GPS fields, leaving the image itself unchanged.",
      },
      {
        q: "Why is my photo's location wrong in the first place?",
        a: "Common causes are a poor satellite fix indoors or between tall buildings, the phone reusing a cached position from a previous location, an incorrect device clock misaligning a GPS track, or an editing app rewriting metadata.",
      },
      {
        q: "Why does Google Photos still show the old location after I fixed it?",
        a: "Because it caches the place it previously derived from the file. Re-upload or re-import the corrected photo so the library re-reads the EXIF data, and remove the stale copy.",
      },
      {
        q: "Can I change a photo's location without losing quality?",
        a: "Yes. Editing GPS fields rewrites only the metadata segment. The compressed pixel data is copied through byte-for-byte, so there is no re-encoding and no visible change.",
      },
    ],
  },

  "how-to-bulk-geotag-photos": {
    image: DIAGRAM_FLOW,
    takeaways: [
      "Bulk geotagging is the right approach whenever many photos share one location — an event, a job site, a property or a day of travel.",
      "Select every photo, set the location once, and download the set as a ZIP rather than repeating the process per file.",
      "Because processing is local, batch speed depends on your own device rather than an upload connection.",
      "Group photos by location before you start; one batch per location is faster than correcting mistakes afterwards.",
      "For very large archives or GPS track-log matching, a scriptable tool such as ExifTool is the better fit.",
    ],
    faqs: [
      {
        q: "How do I geotag multiple photos at once?",
        a: "Select all the photos that share a location, set that location once on the map or by address, then download them together as a ZIP. Each file gets the same GPS coordinates written into its EXIF metadata.",
      },
      {
        q: "Is there a limit on how many photos I can batch?",
        a: "There is no imposed file limit. The practical ceiling is your device's memory, since processing happens locally. Very large sets are best handled in groups of a few hundred.",
      },
      {
        q: "Can different photos in one batch get different locations?",
        a: "A batch applies one location to every photo in it. For a multi-location shoot, group the photos by location and run one batch per group.",
      },
      {
        q: "Does bulk geotagging reduce image quality?",
        a: "No. Each file has only its metadata segment rewritten, and the pixel data is copied through unchanged, so there is no re-compression regardless of batch size.",
      },
      {
        q: "What is the fastest way to geotag thousands of photos?",
        a: "For very large archives, a command-line tool such as ExifTool is fastest because it can be scripted and can match photos against a GPS track log. For a few hundred sharing one location, browser batch mode is quicker to set up.",
      },
    ],
  },
};

export function extrasFor(slug: string): BlogExtras | undefined {
  return BLOG_EXTRAS[slug];
}
