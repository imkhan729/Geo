import React, { useState, useRef, useEffect, lazy, Suspense } from "react";
import { Link } from "wouter";
import {
  ShieldAlert,
  ShieldCheck,
  Download,
  Trash2,
  FileCheck,
  Camera,
  MapPin,
  ExternalLink,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdSlot } from "@/components/ad-slot";
import {
  inspectImageForRemoval,
  removeGpsFromPhoto,
  revokeCleanUrl,
  RemoveGpsInspection,
  RemoveGpsResult,
  RemovalMode
} from "@/lib/remove-gps-utils";
import { updatePageSEO, SEO_CONFIG, injectPageSchema } from "@/lib/seo";

const LeafletMap = lazy(() => import("@/components/tool/leaflet-map").then((m) => ({ default: m.LeafletMap })));

export default function RemoveGpsFromPhoto() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [inspection, setInspection] = useState<RemoveGpsInspection | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState<RemovalMode>("gps-only");
  const [result, setResult] = useState<RemoveGpsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    updatePageSEO(SEO_CONFIG.removeGps);

    injectPageSchema("remove-gps-webpage", {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: SEO_CONFIG.removeGps.title,
      description: SEO_CONFIG.removeGps.description,
      url: "https://freegeotagger.com/remove-gps-from-photo",
    });

    injectPageSchema("remove-gps-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://freegeotagger.com/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Remove GPS from Photo",
          item: "https://freegeotagger.com/remove-gps-from-photo",
        },
      ],
    });

    injectPageSchema("remove-gps-webapp", {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "FreeGeoTagger Photo GPS Remover",
      url: "https://freegeotagger.com/remove-gps-from-photo",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript. Requires HTML5 Canvas.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description: SEO_CONFIG.removeGps.description,
    });

    injectPageSchema("remove-gps-faq", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Does removing GPS data reduce the visual quality of my photo?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. When using 'Remove GPS Only', FreeGeoTagger specifically clears the GPS Image File Directory (IFD) inside the EXIF header while leaving pixel data untouched. In 'Strip All Metadata' mode, standard high-quality re-encoding preserves full optical fidelity.",
          },
        },
        {
          "@type": "Question",
          name: "What is the difference between removing GPS and stripping all metadata?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Removing GPS specifically strips location coordinates, altitude, and satellite timestamps while keeping camera settings (aperture, shutter speed, ISO, lens). Stripping all metadata removes everything, including camera model and capture dates, for maximum anonymity.",
          },
        },
        {
          "@type": "Question",
          name: "Are my photos uploaded to your server when removing GPS?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. All file reading, EXIF table parsing, GPS stripping, and binary verification occur 100% in your local browser memory using JavaScript and Web APIs. Your images are never transmitted over the network.",
          },
        },
        {
          "@type": "Question",
          name: "Can I remove GPS from iPhone HEIC photos?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. FreeGeoTagger converts HEIC photos to standard JPEG directly in your browser, removes the GPS coordinates, and allows you to download a clean, universally compatible JPEG.",
          },
        },
        {
          "@type": "Question",
          name: "How do I know the GPS data is actually gone?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "FreeGeoTagger performs an automated post-removal binary verification check on the output file before presenting the download. The tool inspects the freshly generated buffer to guarantee zero GPS tags remain.",
          },
        },
        {
          "@type": "Question",
          name: "Can I add new GPS coordinates after removing old ones?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. If your photo had wrong coordinates, you can use our free Geotag Photos tool to embed accurate coordinates or search any location worldwide.",
          },
        },
      ],
    });

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const handleFileSelect = async (selectedFile: File) => {
    setError(null);
    setResult(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    // Validate size (20MB limit)
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError("File size exceeds 20MB limit. Please choose a smaller image.");
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setLoading(true);

    try {
      const insp = await inspectImageForRemoval(selectedFile);
      setInspection(insp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to inspect file metadata.");
      setInspection(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleProcessRemoval = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const res = await removeGpsFromPhoto(file, mode);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove GPS metadata.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    if (result) revokeCleanUrl(result.cleanUrl);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setInspection(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main id="main-content" tabIndex={-1} className="outline-none flex-1">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="container mx-auto px-4 max-w-6xl pt-6 pb-2">
          <ol className="flex items-center gap-2 text-xs text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            <li>
              <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
            </li>
            <li className="text-foreground font-medium" aria-current="page">
              Remove GPS from Photo
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-4 max-w-6xl pt-4 pb-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              100% Client-Side Privacy Tool
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Remove GPS from Photo Online Free
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Strip embedded location coordinates, altitude, and satellite tracking metadata from your pictures.
              100% private in-browser processing with zero server uploads and programmatic verification.
            </p>
          </div>

          {/* Core Interactive Tool Interface */}
          <div className="mt-8 max-w-4xl mx-auto bg-card border border-border rounded-xl shadow-lg p-4 md:p-6">
            {!file ? (
              /* Dropzone */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200 ${
                  isDragOver
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border/80 hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold mb-2">Drop photo here to remove GPS data</h2>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Drag &amp; drop any JPG, PNG, WebP, or HEIC image, or click to browse files from your computer or phone.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2.5 py-1 bg-muted rounded-md font-medium">JPEG / JPG</span>
                  <span className="px-2.5 py-1 bg-muted rounded-md font-medium">PNG</span>
                  <span className="px-2.5 py-1 bg-muted rounded-md font-medium">WebP</span>
                  <span className="px-2.5 py-1 bg-muted rounded-md font-medium">Apple HEIC</span>
                  <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-md font-medium">Zero Uploads</span>
                </div>
              </div>
            ) : (
              /* Inspection & Removal Workspace */
              <div className="space-y-6">
                {/* File Header Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/40 rounded-lg border border-border">
                  <div className="flex items-center gap-3 min-w-0">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Photo preview"
                        className="w-12 h-12 object-cover rounded-md border border-border shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB &bull; {file.type || "Image"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded border border-border hover:border-destructive/30"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Change Photo
                  </button>
                </div>

                {loading ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-sm">Reading image metadata...</p>
                  </div>
                ) : inspection ? (
                  <div className="space-y-6">
                    {/* Status Alert Banner */}
                    {inspection.hasGps ? (
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="space-y-1 text-sm">
                          <p className="font-semibold">GPS Location Metadata Detected!</p>
                          <p className="text-muted-foreground text-xs leading-relaxed">
                            This photo contains embedded geographical coordinates. Anyone you share this image with can see
                            where it was captured. Use the options below to strip location data safely.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="space-y-1 text-sm">
                          <p className="font-semibold">No GPS Metadata Found in This Photo</p>
                          <p className="text-muted-foreground text-xs leading-relaxed">
                            Your photo does not contain latitude/longitude tags. Your location is already completely private!
                            You can still strip remaining camera settings below, or{" "}
                            <Link href="/" className="underline font-medium hover:text-foreground">
                              add GPS coordinates using our Geotagger
                            </Link>.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Detected GPS Tags Breakdown & Map (if present) */}
                    {inspection.hasGps && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3 p-4 bg-muted/20 border border-border rounded-lg">
                          <h3 className="text-sm font-bold flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            Embedded Location Tags to Remove
                          </h3>
                          <div className="space-y-2 text-xs">
                            {inspection.detectedTags.map((t, idx) => (
                              <div key={idx} className="flex justify-between py-1 border-b border-border/50">
                                <span className="text-muted-foreground">{t.name}:</span>
                                <span className="font-mono font-medium text-foreground">{t.value}</span>
                              </div>
                            ))}
                            {inspection.cameraMake && (
                              <div className="flex justify-between py-1 border-b border-border/50">
                                <span className="text-muted-foreground">Camera:</span>
                                <span className="font-medium text-foreground">
                                  {inspection.cameraMake} {inspection.cameraModel || ""}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Interactive Leaflet Pin Preview */}
                        {inspection.latitude !== null && inspection.longitude !== null && (
                          <div className="h-44 rounded-lg overflow-hidden border border-border">
                            <Suspense
                              fallback={
                                <div className="h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                  Loading location map...
                                </div>
                              }
                            >
                              <LeafletMap
                                latitude={inspection.latitude}
                                longitude={inspection.longitude}
                                zoom={14}
                                onCoordinatesChange={() => {}}
                                readOnly={true}
                              />
                            </Suspense>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Removal Mode Options (Truth in Advertising / Section 29) */}
                    <div className="space-y-3 p-4 bg-card border border-border rounded-lg">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-primary" />
                        Choose Removal Method
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            mode === "gps-only"
                              ? "border-primary bg-primary/5 text-foreground"
                              : "border-border hover:bg-muted/30 text-muted-foreground"
                          }`}
                        >
                          <input
                            type="radio"
                            name="removal-mode"
                            value="gps-only"
                            checked={mode === "gps-only"}
                            onChange={() => setMode("gps-only")}
                            className="mt-1 accent-primary"
                          />
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">Remove GPS Location Only</p>
                            <p className="text-xs text-muted-foreground">
                              Clears coordinates, altitude, and satellite fixes. <strong>Preserves</strong> camera model,
                              aperture, ISO, lens data, and capture dates.
                            </p>
                          </div>
                        </label>

                        <label
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            mode === "all-metadata"
                              ? "border-primary bg-primary/5 text-foreground"
                              : "border-border hover:bg-muted/30 text-muted-foreground"
                          }`}
                        >
                          <input
                            type="radio"
                            name="removal-mode"
                            value="all-metadata"
                            checked={mode === "all-metadata"}
                            onChange={() => setMode("all-metadata")}
                            className="mt-1 accent-primary"
                          />
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">Strip All Metadata (Max Privacy)</p>
                            <p className="text-xs text-muted-foreground">
                              Completely scrubs all EXIF, IPTC, and XMP blocks. Wipes camera details and dates for total
                              anonymity.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Action Button */}
                    {!result && (
                      <div className="flex justify-end">
                        <button
                          onClick={handleProcessRemoval}
                          disabled={processing}
                          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                          {processing ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Removing Metadata &amp; Verifying...
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              {mode === "gps-only" ? "Remove GPS Location" : "Strip All Metadata"}
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Post-Removal Binary Verification & Download Card */}
                    {result && (
                      <div className="p-5 bg-emerald-500/10 border border-emerald-500/40 rounded-xl space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                              <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-emerald-500 flex items-center gap-2">
                                Output Verified Clean!
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-semibold">
                                  0 GPS Tags
                                </span>
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                Programmatic binary verification confirmed zero GPS metadata remains in the output image.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Verification Details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-2 border-y border-emerald-500/20">
                          <div>
                            <span className="text-muted-foreground block">GPS Status:</span>
                            <span className="font-semibold text-emerald-500">100% Removed</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Method:</span>
                            <span className="font-semibold">
                              {result.mode === "gps-only" ? "GPS Only" : "All Metadata"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Camera Settings:</span>
                            <span className="font-semibold">
                              {result.verificationReport.cameraPreserved ? "Preserved" : "Stripped"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Output Format:</span>
                            <span className="font-semibold">Clean JPEG</span>
                          </div>
                        </div>

                        {/* Download CTA */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                          <p className="text-xs text-muted-foreground">
                            Ready to download: <span className="font-mono text-foreground font-medium">{result.cleanFilename}</span>
                          </p>
                          <a
                            href={result.cleanUrl}
                            download={result.cleanFilename}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg transition-all shadow-md hover:shadow-lg w-full sm:w-auto justify-center"
                          >
                            <Download className="w-4 h-4" />
                            Download Clean Photo
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-xs">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 29 Mandatory Action CTAs */}
          <div className="mt-8 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/"
              className="p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm group-hover:text-primary transition-colors">
                  Add GPS Location
                </h3>
                <p className="text-xs text-muted-foreground">
                  Use our free Geotagging Tool to inject accurate coordinates on a map.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">
                Geotag Tool <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/gps-finder"
              className="p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm group-hover:text-primary transition-colors">
                  GPS Photo Finder
                </h3>
                <p className="text-xs text-muted-foreground">
                  See where existing photos were taken with interactive map extraction.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">
                Open Finder <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/exif-viewer"
              className="p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm group-hover:text-primary transition-colors">
                  Inspect All EXIF Data
                </h3>
                <p className="text-xs text-muted-foreground">
                  Check camera optics, shutter speeds, ISO, and timestamps with the EXIF Viewer.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">
                EXIF Viewer <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/blog/how-to-remove-gps-data-from-photos"
              className="p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm group-hover:text-primary transition-colors">
                  Step-by-Step Guide
                </h3>
                <p className="text-xs text-muted-foreground">
                  Read our tutorial on how to strip GPS data on iPhone, Android, Mac, and Windows.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">
                Read Guide <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Monetization Slot Strictly Below Core Tool Interface */}
          <div className="mt-10 max-w-4xl mx-auto">
            <AdSlot placement="remove-gps-below-tool" />
          </div>
        </section>

        {/* Comprehensive Educational Content (>1000 words) */}
        <section className="container mx-auto px-4 max-w-4xl py-12 border-t border-border">
          <article className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-sm md:text-base leading-relaxed">
            <header className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Why Removing GPS Metadata from Photos Protects Your Privacy
              </h2>
              <p className="text-muted-foreground text-base">
                Modern smartphones and digital cameras silently embed precise satellite coordinates inside image files.
                Learn why geolocation metadata poses privacy risks, how the removal process works, and how to verify
                your files are clean before sharing them online.
              </p>
            </header>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">The Hidden Danger of Embedded Photo Geotags</h3>
              <p>
                Every time you take a photograph on an iPhone, Android device, or GPS-enabled digital camera, the device
                embeds metadata into the image file container under the international Exchangeable Image File Format
                (EXIF) standard. This metadata frequently includes:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Exact latitude and longitude coordinates accurate to within a few meters.</li>
                <li>Elevation / altitude above sea level.</li>
                <li>Exact date, time, and timezone of capture down to sub-second precision.</li>
                <li>Compass direction (the bearing your lens was pointing when you pressed the shutter).</li>
                <li>Camera make, model, and serial number identifying your specific hardware.</li>
              </ul>
              <p>
                When you share these photos via email, messaging applications, cloud storage links, online marketplaces
                (such as Craigslist or Facebook Marketplace), or real estate listings, recipients can easily extract
                this data to determine the exact location of your home, your workplace, or your children's schools.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">Two Removal Strategies: GPS Only vs. All Metadata</h3>
              <p>
                Unlike generic online tools that make false promises or blindly destroy all metadata, FreeGeoTagger provides
                two transparent, tested options:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-4">
                <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-2">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Option 1: Remove GPS Location Only
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    This targeted approach empties only the GPS Image File Directory (GPS IFD table). It wipes coordinates,
                    hemisphere markers, altitude, and satellite timestamps. It <strong>preserves</strong> professional camera
                    attributes like aperture, ISO, shutter speed, lens focal length, and copyright information. Ideal for
                    photographers who wish to showcase their craft on Flickr or 500px without exposing personal locations.
                  </p>
                </div>

                <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-2">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Option 2: Strip All Metadata (Max Privacy)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    This comprehensive cleanse scrubs all EXIF, TIFF, XMP, and IPTC segments from the image. It produces a
                    completely anonymous raster file containing zero camera model details, editing software tags, or capture
                    dates. Ideal for whistleblowers, journalists, privacy advocates, and classified marketplace sales.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">Why Browser-Based Client-Side Processing Is Crucial</h3>
              <p>
                Most free online metadata scrubbers require you to upload your pictures to their remote cloud servers.
                Uploading sensitive photos to third-party servers to "remove location data" contradicts the fundamental goal
                of privacy protection:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Remote servers could log, store, or analyze your personal photos before stripping metadata.</li>
                <li>Server access logs may record your IP address alongside the uploaded image, linking your identity to the photo.</li>
                <li>Cloud services may compress your images aggressively, degrading visual resolution and color balance.</li>
              </ul>
              <p>
                FreeGeoTagger eliminates this vulnerability completely. Our engine runs 100% inside your browser's local
                JavaScript sandbox. Your photos never leave your device, meaning confidential family photos, legal documents,
                and business assets remain 100% private.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">Automated Post-Removal Programmatic Verification</h3>
              <p>
                How can you be certain that location tags were truly eliminated? FreeGeoTagger includes an automated
                post-removal verification step built directly into the processing pipeline. Immediately after the clean
                image buffer is generated in memory, our engine re-parses the binary headers using client-side EXIF inspection.
                The download button is presented only after the verification check confirms that zero GPS tags exist in the output file.
              </p>
            </div>

            {/* 6-Item FAQ Section */}
            <div className="space-y-4 pt-6 border-t border-border">
              <h3 className="text-xl font-bold text-foreground">Frequently Asked Questions</h3>
              <div className="space-y-3 not-prose">
                <details className="p-4 bg-muted/20 border border-border rounded-lg group">
                  <summary className="font-semibold text-sm cursor-pointer list-none flex items-center justify-between">
                    Does removing GPS data reduce the visual quality of my photo?
                    <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90 text-muted-foreground" />
                  </summary>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    No. When using 'Remove GPS Only', FreeGeoTagger specifically clears the GPS Image File Directory (IFD)
                    inside the EXIF header while leaving pixel data untouched. In 'Strip All Metadata' mode, standard high-quality
                    re-encoding preserves full optical fidelity.
                  </p>
                </details>

                <details className="p-4 bg-muted/20 border border-border rounded-lg group">
                  <summary className="font-semibold text-sm cursor-pointer list-none flex items-center justify-between">
                    What is the difference between removing GPS and stripping all metadata?
                    <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90 text-muted-foreground" />
                  </summary>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Removing GPS specifically strips location coordinates, altitude, and satellite timestamps while keeping
                    camera settings (aperture, shutter speed, ISO, lens). Stripping all metadata removes everything, including
                    camera model and capture dates, for maximum anonymity.
                  </p>
                </details>

                <details className="p-4 bg-muted/20 border border-border rounded-lg group">
                  <summary className="font-semibold text-sm cursor-pointer list-none flex items-center justify-between">
                    Are my photos uploaded to your server when removing GPS?
                    <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90 text-muted-foreground" />
                  </summary>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    No. All file reading, EXIF table parsing, GPS stripping, and binary verification occur 100% in your local
                    browser memory using JavaScript and Web APIs. Your images are never transmitted over the network.
                  </p>
                </details>

                <details className="p-4 bg-muted/20 border border-border rounded-lg group">
                  <summary className="font-semibold text-sm cursor-pointer list-none flex items-center justify-between">
                    Can I remove GPS from iPhone HEIC photos?
                    <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90 text-muted-foreground" />
                  </summary>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Yes. FreeGeoTagger converts HEIC photos to standard JPEG directly in your browser, removes the GPS
                    coordinates, and allows you to download a clean, universally compatible JPEG.
                  </p>
                </details>

                <details className="p-4 bg-muted/20 border border-border rounded-lg group">
                  <summary className="font-semibold text-sm cursor-pointer list-none flex items-center justify-between">
                    How do I know the GPS data is actually gone?
                    <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90 text-muted-foreground" />
                  </summary>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    FreeGeoTagger performs an automated post-removal binary verification check on the output file before
                    presenting the download. The tool inspects the freshly generated buffer to guarantee zero GPS tags remain.
                  </p>
                </details>

                <details className="p-4 bg-muted/20 border border-border rounded-lg group">
                  <summary className="font-semibold text-sm cursor-pointer list-none flex items-center justify-between">
                    Can I add new GPS coordinates after removing old ones?
                    <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90 text-muted-foreground" />
                  </summary>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Yes. If your photo had wrong coordinates, you can use our free Geotag Photos tool to embed accurate
                    coordinates or search any location worldwide.
                  </p>
                </details>
              </div>
            </div>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  );
}
