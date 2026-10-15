import { useEffect, useState } from "react";

/**
 * Adsterra ad units for freegeotagger.com.
 *
 * Units (user-supplied codes, Oct 2026):
 * - Social Bar      → injected sitewide in client/index.html (runs once per page load)
 * - 300×250 banner  → key 75f758a7820dcb6e0f876190c0b3591b
 * - 728×90 banner   → key 9f909f6d899c26b5b3c1ebd84e5e86a7 (desktop; falls back to 300×250 on mobile)
 * - Native 4:1      → key 167abe101dc49f0b1f83907503d24724
 *
 * Implementation notes:
 * - Banner tags use document.write internally, which would wipe the page if executed
 *   after load in this React SPA. They are therefore rendered inside an <iframe>
 *   via srcDoc, so every mount (including client-side route changes) is a fresh,
 *   safe impression.
 * - The native unit targets a container div by id; its loader script is injected
 *   in a useEffect after the div mounts and removed on unmount.
 * - Deliberately NOT wired: the popunder code (violates Google publisher policies
 *   and would jeopardise any future AdSense/Ezoic approval) and the SmartLink
 *   (no honest, non-deceptive placement exists on this privacy-first tool site).
 */

const RECTANGLE_KEY = "75f758a7820dcb6e0f876190c0b3591b";
const LEADERBOARD_KEY = "9f909f6d899c26b5b3c1ebd84e5e86a7";
const NATIVE_KEY = "167abe101dc49f0b1f83907503d24724";
const NATIVE_CONTAINER_ID = `adsterra-native-${NATIVE_KEY}`;

function bannerSrcDoc(adKey: string, width: number, height: number): string {
  return (
    `<!DOCTYPE html><html><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=${width}"></head>` +
    `<body style="margin:0;padding:0;background:transparent;overflow:hidden">` +
    `<script>atOptions={'key':'${adKey}','format':'iframe','height':${height},'width':${width},'params':{}};<\/script>` +
    `<script src="https://www.highrevenueformat.com/${adKey}/invoke.js"><\/script>` +
    `</body></html>`
  );
}

function AdLabel() {
  return (
    <span className="mb-1 block text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
      Advertisement
    </span>
  );
}

export interface AdsterraBannerProps {
  adKey: string;
  width: number;
  height: number;
  className?: string;
}

/** Iframe-wrapped Adsterra banner. SPA-safe: a fresh impression on every mount. */
export function AdsterraBanner({ adKey, width, height, className = "" }: AdsterraBannerProps) {
  return (
    <div
      className={`not-prose my-8 flex flex-col items-center ${className}`}
      role="complementary"
      aria-label="Advertisement"
      data-testid={`adsterra-banner-${width}x${height}`}
    >
      <AdLabel />
      <iframe
        title="Advertisement"
        srcDoc={bannerSrcDoc(adKey, width, height)}
        width={width}
        height={height}
        scrolling="no"
        frameBorder="0"
        loading="lazy"
        style={{ border: 0, display: "block", maxWidth: "100%" }}
      />
    </div>
  );
}

/** 300×250 medium rectangle. */
export function AdsterraRectangle({ className = "" }: { className?: string }) {
  return <AdsterraBanner adKey={RECTANGLE_KEY} width={300} height={250} className={className} />;
}

/**
 * Responsive leaderboard: 728×90 on desktop, 300×250 on smaller screens.
 * Chooses exactly one size via matchMedia so only one impression loads.
 */
export function AdsterraLeaderboard({ className = "" }: { className?: string }) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Reserve space pre-hydration to avoid layout shift.
  if (isDesktop === null) {
    return <div className={`not-prose my-8 ${className}`} style={{ minHeight: 90 }} aria-hidden="true" />;
  }

  return isDesktop ? (
    <AdsterraBanner adKey={LEADERBOARD_KEY} width={728} height={90} className={className} />
  ) : (
    <AdsterraBanner adKey={RECTANGLE_KEY} width={300} height={250} className={className} />
  );
}

/**
 * Adsterra native banner (4:1). Renders the required container div, then loads
 * the unit's loader script once the div is mounted. The script is removed on
 * unmount so client-side navigation re-initialises the unit cleanly.
 */
export function AdsterraNative({ className = "" }: { className?: string }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = `https://pl31849741.profitableratecpmnetwork.com/${NATIVE_KEY}/invoke.js`;
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  return (
    <div
      className={`not-prose my-8 ${className}`}
      role="complementary"
      aria-label="Advertisement"
      data-testid="adsterra-native"
    >
      <AdLabel />
      <div id={NATIVE_CONTAINER_ID} />
    </div>
  );
}
