import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import path from "path";

const ROOT = process.argv[2];
const SITE = "https://freegeotagger.com";
const issues = [];
const pass = [];
const add = (sev, area, msg) => issues.push({ sev, area, msg });

// ── Build the URL -> file map from .htaccess ──
const ht = readFileSync(path.join(ROOT, ".htaccess"), "utf8");
const fileToUrl = new Map();
for (const m of ht.matchAll(/RewriteRule \^([^\s]+?)\/\?\$ \/seo-routes\/([^\s]+\.html)/g)) {
  fileToUrl.set(m[2], "/" + m[1].replace(/\\/g, ""));
}

const pages = [{ url: "/", file: "index.html", html: readFileSync(path.join(ROOT, "index.html"), "utf8") }];
for (const f of readdirSync(path.join(ROOT, "seo-routes")).filter((f) => f.endsWith(".html")).sort()) {
  const url = fileToUrl.get(f);
  if (!url) add("HIGH", "routing", `seo-routes/${f} has no .htaccess rewrite — unreachable at a clean URL`);
  pages.push({ url: url ?? `/UNMAPPED-${f}`, file: `seo-routes/${f}`, html: readFileSync(path.join(ROOT, "seo-routes", f), "utf8") });
}

const attr = (h, re) => h.match(re)?.[1] ?? null;
const textOf = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
const words = (s) => s.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;

// ── Per-page checks ──
const titles = new Map(), descs = new Map(), h1s = new Map(), canons = new Map();
const allInternalLinks = new Map();
const knownUrls = new Set(pages.map((p) => p.url));

for (const p of pages) {
  const h = p.html;
  const label = p.url;

  // Title
  const title = attr(h, /<title>([\s\S]*?)<\/title>/);
  if (!title) add("HIGH", "title", `${label}: missing <title>`);
  else {
    if (title.length < 50 || title.length > 60) add("MED", "title", `${label}: title ${title.length} chars (want 50-60) — "${title}"`);
    titles.set(title, [...(titles.get(title) ?? []), label]);
  }

  // Description
  const desc = attr(h, /<meta name="description"\s+content="([^"]*)"/);
  if (!desc) add("HIGH", "description", `${label}: missing meta description`);
  else {
    if (desc.length < 140 || desc.length > 160) add("MED", "description", `${label}: description ${desc.length} chars (want 140-160)`);
    descs.set(desc, [...(descs.get(desc) ?? []), label]);
  }

  // Canonical
  const canon = attr(h, /<link rel="canonical"\s+href="([^"]*)"/);
  const expected = `${SITE}${label === "/" ? "/" : label}`;
  if (!canon) add("HIGH", "canonical", `${label}: missing canonical`);
  else if (canon !== expected) add("HIGH", "canonical", `${label}: canonical is ${canon}, expected ${expected}`);
  else canons.set(canon, [...(canons.get(canon) ?? []), label]);

  // Robots meta
  const robots = attr(h, /<meta name="robots"\s+content="([^"]*)"/);
  if (robots && /noindex/i.test(robots)) add("HIGH", "indexability", `${label}: has noindex — "${robots}"`);

  // Headings
  const h1list = [...h.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => textOf(m[1]));
  if (h1list.length === 0) add("HIGH", "headings", `${label}: no <h1>`);
  if (h1list.length > 1) add("MED", "headings", `${label}: ${h1list.length} <h1> elements`);
  if (h1list[0]) h1s.set(h1list[0], [...(h1s.get(h1list[0]) ?? []), label]);

  // Crawlable body
  const main = h.match(/<main id="static-seo-content"[^>]*>([\s\S]*?)<\/main>/);
  if (!main) add("HIGH", "prerender", `${label}: no prerendered <main> — crawlers get an empty shell`);
  else {
    const w = words(textOf(main[1]));
    if (w < 400) add("HIGH", "thin", `${label}: only ${w} crawlable words`);
    else if (w < 800) add("LOW", "thin", `${label}: ${w} crawlable words (under 800)`);
  }

  // Heading order (no skipped levels) within the prerendered main
  if (main) {
    const levels = [...main[1].matchAll(/<h([1-6])[^>]*>/g)].map((m) => +m[1]);
    let prev = 1, skipped = null;
    for (const l of levels) {
      if (l > prev + 1) { skipped = `h${prev} -> h${l}`; break; }
      prev = l;
    }
    if (skipped) add("LOW", "headings", `${label}: heading level skipped (${skipped})`);
  }

  // Open Graph / Twitter
  for (const tag of ["og:title", "og:description", "og:url", "og:image", "og:type"]) {
    if (!h.includes(`property="${tag}"`)) add("MED", "social", `${label}: missing ${tag}`);
  }
  if (!h.includes('name="twitter:card"')) add("MED", "social", `${label}: missing twitter:card`);
  const ogUrl = attr(h, /<meta property="og:url"\s+content="([^"]*)"/);
  if (ogUrl && ogUrl !== expected) add("MED", "social", `${label}: og:url ${ogUrl} != canonical ${expected}`);

  // lang
  if (!/<html[^>]+lang="/.test(h)) add("MED", "a11y", `${label}: <html> missing lang attribute`);

  // viewport
  if (!h.includes('name="viewport"')) add("HIGH", "mobile", `${label}: missing viewport meta`);

  // JSON-LD validity + required Article fields
  const blocks = [...h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  if (blocks.length === 0) add("MED", "schema", `${label}: no JSON-LD`);
  const types = [];
  for (const b of blocks) {
    let j;
    try { j = JSON.parse(b[1]); } catch (e) { add("HIGH", "schema", `${label}: invalid JSON-LD (${e.message.slice(0, 60)})`); continue; }
    const arr = Array.isArray(j) ? j : [j];
    for (const o of arr) {
      types.push(o["@type"]);
      if (o["@type"] === "Article") {
        for (const req of ["headline", "author", "datePublished", "image", "publisher"]) {
          if (!o[req]) add("HIGH", "schema", `${label}: Article schema missing ${req}`);
        }
        if (o.headline && o.headline.length > 110) add("LOW", "schema", `${label}: Article headline ${o.headline.length} chars (Google truncates ~110)`);
      }
      if (o["@type"] === "FAQPage") {
        const n = (o.mainEntity ?? []).length;
        if (!n) add("MED", "schema", `${label}: FAQPage with no questions`);
        // Every schema question must appear in the visible text
        const body = textOf(h);
        for (const q of o.mainEntity ?? []) {
          if (q.name && !body.includes(q.name.slice(0, 40))) {
            add("HIGH", "schema", `${label}: FAQPage question not visible on page — "${q.name.slice(0, 55)}"`);
          }
        }
      }
    }
  }
  const dupTypes = types.filter((t, i) => types.indexOf(t) !== i);
  if (dupTypes.length) add("MED", "schema", `${label}: duplicate JSON-LD @type: ${[...new Set(dupTypes)].join(", ")}`);

  // Images: alt text, dimensions, lazy loading, file existence
  for (const m of (main ? main[1] : h).matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    const src = attr(tag, /src="([^"]*)"/);
    const alt = attr(tag, /alt="([^"]*)"/);
    if (alt === null) add("HIGH", "images", `${label}: <img> with no alt attribute (${src})`);
    else if (!alt.trim()) add("MED", "images", `${label}: <img> with empty alt (${src})`);
    else if (alt.length < 15) add("LOW", "images", `${label}: very short alt "${alt}" (${src})`);
    if (!/width="/.test(tag) || !/height="/.test(tag)) add("MED", "cls", `${label}: <img> without width/height — risks layout shift (${src})`);
    if (!/loading="/.test(tag)) add("LOW", "perf", `${label}: <img> without loading attribute (${src})`);
    if (src && src.startsWith("/")) {
      const fp = path.join(ROOT, src.replace(/^\//, "").split("?")[0]);
      if (!existsSync(fp)) add("HIGH", "images", `${label}: image file missing from build: ${src}`);
    }
  }

  // Internal links
  const links = new Set([...(main ? main[1] : h).matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1].replace(/\/$/, "") || "/"));
  allInternalLinks.set(label, links);
  for (const l of links) {
    if (knownUrls.has(l)) continue;
    const fp = path.join(ROOT, l.replace(/^\//, ""));
    if (!existsSync(fp)) add("HIGH", "links", `${label}: internal link to non-existent ${l}`);
  }
}

// ── Sitewide duplicate checks ──
for (const [t, urls] of titles) if (urls.length > 1) add("HIGH", "duplicate", `duplicate title on ${urls.join(", ")}: "${t}"`);
for (const [d, urls] of descs) if (urls.length > 1) add("HIGH", "duplicate", `duplicate description on ${urls.join(", ")}`);
for (const [c, urls] of canons) if (urls.length > 1) add("HIGH", "canonical", `same canonical on multiple pages: ${urls.join(", ")}`);
for (const [t, urls] of h1s) if (urls.length > 1) add("MED", "duplicate", `duplicate H1 "${t}" on ${urls.join(", ")}`);

// ── Inbound link counts / orphans ──
const inbound = new Map([...knownUrls].map((u) => [u, 0]));
for (const [from, links] of allInternalLinks) {
  for (const l of links) if (inbound.has(l) && l !== from) inbound.set(l, inbound.get(l) + 1);
}
for (const [u, n] of inbound) {
  if (n === 0) add("HIGH", "orphan", `${u}: zero inbound internal links (orphan)`);
  else if (n < 3) add("MED", "internal-links", `${u}: only ${n} inbound internal link(s) — want 3+`);
}

// ── sitemap ──
const sm = readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
const smUrls = [...sm.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
const smPaths = smUrls.map((u) => u.replace(SITE, "").replace(/\/$/, "") || "/");
for (const u of smUrls) {
  if (!u.startsWith(SITE)) add("HIGH", "sitemap", `sitemap URL not on canonical host: ${u}`);
  if (u.includes("www.")) add("HIGH", "sitemap", `sitemap URL uses www: ${u}`);
}
for (const p of smPaths) if (!knownUrls.has(p)) add("HIGH", "sitemap", `sitemap lists ${p} which is not a built page`);
for (const u of knownUrls) if (!smPaths.includes(u)) add("MED", "sitemap", `built page ${u} missing from sitemap`);
if (new Set(smPaths).size !== smPaths.length) add("MED", "sitemap", "sitemap contains duplicate URLs");

// ── robots.txt ──
const rb = readFileSync(path.join(ROOT, "robots.txt"), "utf8");
if (!/Sitemap:\s*https:\/\/freegeotagger\.com\/sitemap\.xml/.test(rb)) add("HIGH", "robots", "robots.txt does not reference the sitemap");
if (/^\s*Disallow:\s*\/\s*$/m.test(rb)) add("HIGH", "robots", "robots.txt contains a site-wide Disallow: /");
// Match only a real directive line, not the word appearing in a comment.
if (/^\s*Crawl-delay\s*:/im.test(rb)) add("LOW", "robots", "robots.txt sets Crawl-delay — Googlebot ignores it, and it can slow other crawlers unnecessarily");

// ── required root files ──
for (const f of ["ads.txt", "robots.txt", "sitemap.xml", "404.html", "og-image.png", "llms.txt", "favicon.png", ".htaccess"]) {
  if (!existsSync(path.join(ROOT, f))) add("HIGH", "files", `missing required file: ${f}`);
}

// ── asset weight, split by whether the asset is on the critical path ──
//
// A big lazy chunk is fine; a big EAGER chunk is what costs LCP/TBT. Resolve the
// entry script from index.html, then follow static `import "..."` statements
// transitively to find everything the browser must fetch before the app runs.
const entrySrc = pages[0].html.match(/<script type="module"[^>]*src="([^"]+)"/)?.[1];
const eager = new Set();
if (entrySrc) {
  const queue = [entrySrc.replace(/^\//, "")];
  while (queue.length) {
    const rel = queue.shift();
    if (eager.has(rel)) continue;
    eager.add(rel);
    const fp = path.join(ROOT, rel);
    if (!existsSync(fp)) continue;
    const js = readFileSync(fp, "utf8").slice(0, 8000); // static imports are hoisted to the top
    for (const m of js.matchAll(/(?:^|;)import\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)?\s*(?:from)?\s*["'](\.\/[^"']+\.js)["']/g)) {
      queue.push(path.posix.join(path.posix.dirname(rel), m[1].replace(/^\.\//, "")));
    }
  }
}

let eagerJsKb = 0;
const walk = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const fp = path.join(d, e.name);
    if (e.isDirectory()) { walk(fp); continue; }
    const rel = path.relative(ROOT, fp).replace(/\\/g, "/");
    const kb = Math.round(statSync(fp).size / 1024);
    const isEager = eager.has(rel);
    if (rel.endsWith(".js") && isEager) eagerJsKb += kb;
    if (kb > 400) {
      if (isEager) add("HIGH", "perf", `large asset ON THE CRITICAL PATH: ${rel} (${kb} KB) — statically imported by the entry chunk`);
      else pass.push(`large asset ${rel} (${kb} KB) is lazy-loaded, not on the critical path`);
    }
  }
};
walk(ROOT);
if (eagerJsKb > 400) add("MED", "perf", `eager JS totals ${eagerJsKb} KB uncompressed (want < 400)`);
else pass.push(`eager JS totals ${eagerJsKb} KB uncompressed`);

// ── output ──
const order = { HIGH: 0, MED: 1, LOW: 2 };
issues.sort((a, b) => order[a.sev] - order[b.sev] || a.area.localeCompare(b.area));
const counts = { HIGH: 0, MED: 0, LOW: 0 };
for (const i of issues) counts[i.sev]++;

console.log(`Pages checked: ${pages.length}`);
console.log(`HIGH: ${counts.HIGH}   MED: ${counts.MED}   LOW: ${counts.LOW}\n`);
if (!issues.length) console.log("No issues found.");
let lastSev = null;
for (const i of issues) {
  if (i.sev !== lastSev) { console.log(`\n── ${i.sev} ──`); lastSev = i.sev; }
  console.log(`  [${i.area}] ${i.msg}`);
}
if (pass.length) {
  console.log("\n── verified good ──");
  for (const p of pass) console.log(`  ${p}`);
}

// Exit non-zero on HIGH so this can gate a deploy.
if (counts.HIGH > 0) process.exitCode = 1;
