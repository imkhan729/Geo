import { useEffect } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { updatePageSEO, injectPageSchema, SEO_CONFIG } from "@/lib/seo";
import { Calendar, Clock, ArrowRight, MapPin, FileImage, Smartphone } from "lucide-react";
import { EclipseButton } from "@/components/ui/eclipse-button";
import { useLocation } from "wouter";

const POSTS = [
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
  },
];

export default function BlogIndex() {
  const [, navigate] = useLocation();

  useEffect(() => {
    updatePageSEO(SEO_CONFIG.blog);

    injectPageSchema("blog-webpage", {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "FreeGeoTagger Blog",
      url: "https://freegeotagger.com/blog",
      description:
        "Guides and tutorials on photo geotagging, EXIF GPS metadata, and location tagging for photographers, real estate agents, and mobile users.",
      inLanguage: "en-US",
      isPartOf: {
        "@type": "WebSite",
        name: "FreeGeoTagger",
        url: "https://freegeotagger.com",
      },
    });

    injectPageSchema("blog-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://freegeotagger.com/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://freegeotagger.com/blog" },
      ],
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-muted/30 topo-pattern">
          <div className="container mx-auto px-4 max-w-6xl py-14 md:py-20">
            <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <span>/</span>
              <span className="text-foreground">Blog</span>
            </nav>
            <h1 className="font-display font-bold text-3xl md:text-5xl tracking-tight mb-4">
              Photo Geotagging Blog — Tips, Guides &amp; How-Tos
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Practical guides on adding GPS to photos, understanding EXIF metadata, and geotagging workflows — for photographers, real estate agents, iPhone users, and more.
            </p>
          </div>
        </section>

        {/* Posts grid */}
        <section className="container mx-auto px-4 max-w-6xl py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {POSTS.map((post) => {
              const Icon = post.icon;
              return (
                <article
                  key={post.slug}
                  className="neon-card group flex flex-col rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors duration-300"
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

                    <h2 className="font-display font-bold text-lg leading-snug mb-3 group-hover:text-primary transition-colors duration-200">
                      <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
                        {post.title}
                      </Link>
                    </h2>

                    <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">
                      {post.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
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

        {/* CTA */}
        <section className="border-t border-border bg-primary/5">
          <div className="container mx-auto px-4 max-w-6xl py-12 text-center">
            <h2 className="font-display font-bold text-2xl mb-3">Ready to geotag your photos?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
              Free, private, and instant. No account or software needed — works entirely in your browser.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <EclipseButton
                text="Geotag Photos Free"
                leftIcon={<MapPin className="h-4 w-4" />}
                onClick={() => navigate("/")}
              />
              <EclipseButton
                text="Extract GPS from Photo"
                variant="outline"
                onClick={() => navigate("/gps-finder")}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
