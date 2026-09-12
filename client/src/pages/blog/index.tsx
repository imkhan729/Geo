import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { updatePageSEO, injectPageSchema, SEO_CONFIG } from "@/lib/seo";
import { Calendar, Clock, ArrowRight, MapPin, FileImage, Smartphone, Globe, Monitor, Layers, ShieldOff, Crosshair, Images, HelpCircle, Sparkles, Filter, ExternalLink, Compass } from "lucide-react";
import { trackArticleToToolClick } from "@/lib/analytics";
import { EclipseButton } from "@/components/ui/eclipse-button";
import { useLocation } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const CATEGORIES = [
  { id: "all", label: "All Guides" },
  { id: "mobile", label: "Mobile (iOS & Android)" },
  { id: "privacy", label: "Privacy & Removal" },
  { id: "business", label: "Local SEO & Real Estate" },
  { id: "workflow", label: "Batch & Standards" },
];

const POSTS = [
  {
    slug: "how-to-bulk-geotag-photos",
    title: "How to Bulk Geotag Photos: Add GPS to Hundreds of Images at Once",
    description:
      "Batch geotagging saves hours when many photos share one location. Efficient workflows for events, job sites, listings, and travel archives — free and private.",
    date: "2026-07-12",
    dateDisplay: "July 12, 2026",
    readingTime: "6 min read",
    icon: Images,
    iconColor: "text-sky-600",
    iconBg: "bg-sky-500/10",
    category: "Workflow",
    cluster: "workflow",
  },
  {
    slug: "how-to-fix-wrong-gps-location-on-photos",
    title: "How to Fix or Change the Wrong GPS Location on a Photo",
    description:
      "Photo pinned to the wrong place on the map? Learn why photo GPS data ends up incorrect and how to rewrite the coordinates in seconds with zero quality loss.",
    date: "2026-07-10",
    dateDisplay: "July 10, 2026",
    readingTime: "6 min read",
    icon: Crosshair,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-500/10",
    category: "How-To",
    cluster: "workflow",
  },
  {
    slug: "how-to-remove-gps-data-from-photos",
    title: "How to Remove GPS Location Data from Photos",
    description:
      "Protect your privacy before sharing photos publicly. Check for embedded GPS coordinates and strip them on iPhone, Android, Windows, and Mac — with no quality loss.",
    date: "2026-07-08",
    dateDisplay: "July 8, 2026",
    readingTime: "7 min read",
    icon: ShieldOff,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-500/10",
    category: "Privacy",
    cluster: "privacy",
  },
  {
    slug: "how-to-geotag-photos-for-real-estate",
    title: "How to Geotag Photos for Real Estate Listings",
    description:
      "Add GPS coordinates to property photos to improve MLS accuracy, boost local SEO, and give buyers precise location context — in seconds, for free.",
    date: "2026-03-28",
    dateDisplay: "March 28, 2026",
    readingTime: "6 min read",
    icon: MapPin,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    category: "Real Estate",
    cluster: "business",
  },
  {
    slug: "what-is-exif-gps-metadata",
    title: "What Is EXIF GPS Metadata? A Complete Guide for Photographers",
    description:
      "Understand what EXIF GPS metadata is, how latitude and longitude get stored inside image files, and why it matters for apps, search, and workflows.",
    date: "2026-03-25",
    dateDisplay: "March 25, 2026",
    readingTime: "7 min read",
    icon: FileImage,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-500/10",
    category: "Photography",
    cluster: "workflow",
  },
  {
    slug: "how-to-add-gps-to-iphone-photos",
    title: "How to Add GPS Location to iPhone Photos",
    description:
      "iPhone photo missing location data? This step-by-step guide shows you how to add GPS coordinates to any iPhone photo — no app reinstall, no account, completely free.",
    date: "2026-03-22",
    dateDisplay: "March 22, 2026",
    readingTime: "5 min read",
    icon: Smartphone,
    iconColor: "text-teal-600",
    iconBg: "bg-teal-500/10",
    category: "Mobile",
    cluster: "mobile",
  },
  {
    slug: "how-to-geotag-photos-for-google-business-profile",
    title: "How to Geotag Photos for Google Business Profile",
    description:
      "Add GPS coordinates to your business photos before uploading to Google Business Profile — send a precise location signal to Google and strengthen your local SEO rankings.",
    date: "2026-04-01",
    dateDisplay: "April 1, 2026",
    readingTime: "7 min read",
    icon: Globe,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-500/10",
    category: "Local SEO",
    cluster: "business",
  },
  {
    slug: "how-to-geotag-photos-android",
    title: "How to Add GPS to Android Photos – Free & Instant",
    description:
      "Android photo missing location data? Add GPS coordinates to any Android photo in seconds — free, browser-based, no app install required. Works in Chrome on any Android device.",
    date: "2026-04-02",
    dateDisplay: "April 2, 2026",
    readingTime: "6 min read",
    icon: Monitor,
    iconColor: "text-green-600",
    iconBg: "bg-green-500/10",
    category: "Android",
    cluster: "mobile",
  },
  {
    slug: "best-free-photo-geotagging-tools",
    title: "Best Free Photo Geotagging Tools in 2026",
    description:
      "Compare the best free tools for adding GPS to photos in 2026 — browser-based, desktop, and command-line options reviewed for privacy, batch support, and ease of use.",
    date: "2026-04-03",
    dateDisplay: "April 3, 2026",
    readingTime: "8 min read",
    icon: Layers,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-500/10",
    category: "Tools",
    cluster: "privacy",
  },
];

const BLOG_FAQS = [
  {
    q: "Does adding GPS coordinates degrade photo resolution or sharpness?",
    a: "No. Photo metadata is stored in dedicated binary headers (the EXIF block) completely separate from the compressed pixel data. Adding, changing, or removing GPS tags performs binary surgery only on the header without re-compressing the pixels, ensuring 100% loss-free image preservation."
  },
  {
    q: "Why do social media platforms strip GPS metadata when I post photos?",
    a: "Platforms like Instagram, WhatsApp, Twitter/X, and Facebook automatically re-encode uploaded images and strip EXIF metadata to protect user privacy. If you need clients, GIS systems, or colleagues to view embedded GPS tags, share photos via cloud drive links (Google Drive, Dropbox) or ZIP archives instead."
  },
  {
    q: "Can I geotag photos without an active internet connection?",
    a: "Yes. Once the FreeGeoTagger application is cached in your web browser, all metadata parsing, geodetic math, and file creation algorithms run completely offline. You can test this by enabling Airplane Mode and dropping photos directly onto our tools."
  },
  {
    q: "What coordinate datum and format does EXIF require?",
    a: "The international EXIF 2.32 standard mandates the World Geodetic System 1984 (WGS84) ellipsoid datum. Coordinates are stored in the GPS IFD as unsigned rational number arrays representing degrees, minutes, and seconds, paired with hemisphere indicators (N/S/E/W)."
  }
];

export default function BlogIndex() {
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    updatePageSEO(SEO_CONFIG.blog);

    injectPageSchema("blog-webpage", {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "FreeGeoTagger Engineering & Photography Knowledge Base",
      url: "https://freegeotagger.com/blog",
      description: SEO_CONFIG.blog.description,
      inLanguage: "en-US",
      isPartOf: {
        "@type": "WebSite",
        name: "FreeGeoTagger",
        url: "https://freegeotagger.com",
      },
      publisher: {
        "@type": "Organization",
        name: "FreeGeoTagger",
        url: "https://freegeotagger.com",
        logo: { "@type": "ImageObject", url: "https://freegeotagger.com/favicon.png" }
      }
    });

    injectPageSchema("blog-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://freegeotagger.com/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://freegeotagger.com/blog" },
      ],
    });

    injectPageSchema("blog-faq-schema", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: BLOG_FAQS.map(faq => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a
        }
      }))
    });
  }, []);

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "all") return POSTS;
    return POSTS.filter(post => post.cluster === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main id="main-content" tabIndex={-1} className="outline-none flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-muted/30 topo-pattern">
          <div className="container mx-auto px-4 max-w-6xl py-14 md:py-20">
            <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <span>/</span>
              <span className="text-foreground">Blog</span>
            </nav>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              <Compass className="h-3.5 w-3.5" /> Technical Geolocation &amp; EXIF Knowledge Base
            </div>
            <h1 className="font-display font-bold text-3xl md:text-5xl tracking-tight mb-4">
              Photo Geotagging Blog — Field Guides &amp; Metadata Standards
            </h1>
            <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">
              In-depth, field-tested tutorials on EXIF 2.32 location metadata, smartphone camera configurations, batch processing workflows, and local SEO optimization — engineered for photographers, surveyors, and digital professionals.
            </p>
          </div>
        </section>

        {/* Category Filters */}
        <section className="border-b border-border/60 bg-card/50 sticky top-16 z-10 backdrop-blur-md">
          <div className="container mx-auto px-4 max-w-6xl py-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mr-2 flex-shrink-0">
              <Filter className="h-3.5 w-3.5" /> Filter:
            </span>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition-all flex-shrink-0 ${
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* Posts grid */}
        <section className="container mx-auto px-4 max-w-6xl py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold tracking-tight">
              {selectedCategory === "all" ? "All Field Guides & Tutorials" : CATEGORIES.find(c => c.id === selectedCategory)?.label}
            </h2>
            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
              Showing {filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => {
              const Icon = post.icon;
              return (
                <article
                  key={post.slug}
                  className="neon-card group flex flex-col rounded-2xl border border-border bg-card hover:border-primary/30 transition-all duration-300 relative"
                >
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${post.iconBg}`}>
                        <Icon className={`h-5 w-5 ${post.iconColor}`} />
                      </span>
                      <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/60">
                        {post.category}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-lg leading-snug mb-3 group-hover:text-primary transition-colors duration-200">
                      <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
                        {post.title}
                      </Link>
                    </h3>

                    <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">
                      {post.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {post.dateDisplay}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readingTime}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200 text-primary" />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* FreeGeoTagger Ecosystem Directory */}
        <section className="border-t border-border bg-muted/20 py-14">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="font-display font-bold text-2xl md:text-3xl tracking-tight mb-3">
                Complete Browser-Native Tool Suite
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Put these guides into practice immediately. All FreeGeoTagger utilities run 100% locally on your device hardware with zero file uploads and complete privacy.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/" className="p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/40 transition-all block group">
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-base flex items-center justify-between">
                  Single Photo Geotagger <ExternalLink className="h-4 w-4" />
                </span>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Click on an interactive Leaflet map or search any street address to embed high-precision EXIF GPS tags into individual photos.
                </p>
              </Link>

              <Link href="/gps-finder" className="p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/40 transition-all block group">
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-base flex items-center justify-between">
                  GPS Photo Finder <ExternalLink className="h-4 w-4" />
                </span>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Reverse lookup tool to inspect whether an existing image has location metadata and view its coordinates on a satellite map.
                </p>
              </Link>

              <Link href="/exif-viewer" className="p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/40 transition-all block group">
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-base flex items-center justify-between">
                  EXIF Metadata Viewer <ExternalLink className="h-4 w-4" />
                </span>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Forensic camera inspection displaying shutter speed, f-number, ISO, lens focal length, color spaces, and geodetic tags.
                </p>
              </Link>

              <Link href="/remove-gps-from-photo" className="p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/40 transition-all block group">
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-base flex items-center justify-between">
                  Remove GPS from Photo <ExternalLink className="h-4 w-4" />
                </span>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Sanitize private home location coordinates before uploading photos to public forums, or strip all metadata blocks entirely.
                </p>
              </Link>

              <Link href="/coordinate-converter" className="p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/40 transition-all block group">
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-base flex items-center justify-between">
                  GPS Coordinate Converter <ExternalLink className="h-4 w-4" />
                </span>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Convert coordinates between Decimal Degrees, Degrees Minutes Seconds, Degrees Decimal Minutes, and UTM with distance calculations.
                </p>
              </Link>

              <Link href="/batch-geotag-photos" className="p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/40 transition-all block group">
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-base flex items-center justify-between">
                  Batch Geotag Photos <ExternalLink className="h-4 w-4" />
                </span>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Tag hundreds of images in bulk with group location selection, CSV coordinate spreadsheet matching, and packaged ZIP downloads.
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* Blog Hub FAQ Accordion */}
        <section className="container mx-auto px-4 max-w-4xl py-14">
          <div className="text-center mb-10">
            <h2 className="font-display font-bold text-2xl md:text-3xl tracking-tight mb-3 flex items-center justify-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" /> Frequently Asked Questions
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Essential fundamentals regarding digital image geolocation, EXIF standards, and privacy safety.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full border rounded-2xl px-6 bg-card">
            {BLOG_FAQS.map((faq, index) => (
              <AccordionItem key={index} value={`blog-faq-${index}`}>
                <AccordionTrigger className="text-left font-semibold text-base py-5 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA Banner */}
        <section className="border-t border-border bg-primary/5 py-14">
          <div className="container mx-auto px-4 max-w-6xl text-center">
            <h2 className="font-display font-bold text-2xl md:text-3xl mb-3">Ready to Geotag Your Photos?</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-sm leading-relaxed">
              100% free, private, and instant. No account creation or software installation required — works directly in your web browser.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <EclipseButton
                text="Geotag Photos Free"
                leftIcon={<MapPin className="h-4 w-4" />}
                onClick={() => {
                  trackArticleToToolClick({ article_slug: "index", destination: "home" });
                  navigate("/");
                }}
              />
              <EclipseButton
                text="Batch Geotag Photos"
                variant="outline"
                leftIcon={<Images className="h-4 w-4" />}
                onClick={() => {
                  trackArticleToToolClick({ article_slug: "index", destination: "batch_geotag" });
                  navigate("/batch-geotag-photos");
                }}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
