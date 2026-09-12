import { useEffect } from "react";
import { useLocation } from "wouter";
import { EclipseButton } from "@/components/ui/eclipse-button";
import { MapPin } from "lucide-react";
import { extrasFor } from "@/lib/blog-content";
import { injectPageSchema } from "@/lib/seo";
import { trackArticleToToolClick } from "@/lib/analytics";
import { AdSlot } from "@/components/ad-slot";

export { trackArticleToToolClick };

/**
 * Responsive ad placement for blog articles with pre-allocated geometry to guarantee CLS = 0.00.
 */
export function BlogAdSlot({
  placement = "article-bottom",
}: {
  placement?: "article-mid" | "article-bottom";
}) {
  return (
    <div className="not-prose my-8 flex justify-center">
      <AdSlot
        placement={placement}
        format={placement === "article-mid" ? "rectangle" : "horizontal"}
      />
    </div>
  );
}

/**
 * Article building blocks whose content lives in client/src/lib/blog-content.ts.
 *
 * script/generate-seo-pages.ts recognises these three tags by name and expands them
 * into static HTML from the same module, so the prerendered page a crawler receives
 * carries the identical takeaways, figure and Q&A — without the text being pasted
 * into every article file.
 *
 * Keep the tag names and the `slug` prop in sync with the expander in that script.
 */

/**
 * Injects the article's FAQPage schema from the shared data.
 *
 * Needed because injectPageSchema() de-duplicates by @type: when React mounts it
 * strips the prerendered FAQPage block, so without re-injecting here the schema
 * would be present in the raw HTML but absent from the rendered DOM.
 */
export function useBlogFaqSchema(slug: string) {
  useEffect(() => {
    const extras = extrasFor(slug);
    if (!extras?.faqs.length) return;
    injectPageSchema(`blog-faq-${slug}`, {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: extras.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }, [slug]);
}

/** Answer-first summary. Placed directly after the intro so extraction engines hit it early. */
export function KeyTakeaways({ slug }: { slug: string }) {
  const extras = extrasFor(slug);
  if (!extras?.takeaways.length) return null;

  return (
    <aside className="not-prose my-8 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
      <h2 className="font-display text-base font-bold mb-3">Key takeaways</h2>
      <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground list-disc pl-5">
        {extras.takeaways.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </aside>
  );
}

/** Lead image with a real caption. Lazy-loaded and dimensioned to avoid layout shift. */
export function BlogFigure({ slug }: { slug: string }) {
  const extras = extrasFor(slug);
  if (!extras?.image) return null;
  const { src, alt, caption, width, height } = extras.image;

  return (
    <figure className="not-prose my-8">
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className="w-full h-auto rounded-xl border border-border"
      />
      <figcaption className="mt-2 text-xs leading-relaxed text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}

/**
 * Reusable acquisition CTA for blog articles that tracks conversion
 * to the geotagging tool or GPS finder without transmitting any PII.
 */
export function BlogToolCta({
  slug,
  title = "Ready to geotag your photos?",
  description = "Add GPS coordinates to your JPG, PNG, WebP, or HEIC images in seconds — completely free, private, and in your browser.",
  primaryText = "Geotag Photos Free",
  secondaryText = "Extract GPS from Photo",
}: {
  slug: string;
  title?: string;
  description?: string;
  primaryText?: string;
  secondaryText?: string;
}) {
  const [, navigate] = useLocation();

  return (
    <div className="mt-10 p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center not-prose">
      <h3 className="font-display font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <EclipseButton
          text={primaryText}
          leftIcon={<MapPin className="h-4 w-4" />}
          onClick={() => {
            trackArticleToToolClick({ article_slug: slug, destination: "home" });
            navigate("/");
          }}
        />
        <EclipseButton
          text={secondaryText}
          variant="outline"
          onClick={() => {
            trackArticleToToolClick({ article_slug: slug, destination: "gps_finder" });
            navigate("/gps-finder");
          }}
        />
      </div>
    </div>
  );
}

/** Visible FAQ section. The matching FAQPage schema is emitted from the same data. */
export function BlogFaq({ slug }: { slug: string }) {
  const extras = extrasFor(slug);
  if (!extras?.faqs.length) return null;

  return (
    <section className="mt-12">
      <h2>Frequently asked questions</h2>
      {extras.faqs.map((f) => (
        <div key={f.q}>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </div>
      ))}
    </section>
  );
}
