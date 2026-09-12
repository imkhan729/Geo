# FreeGeoTagger Ads Readiness Architecture Specification (Phase 16)

## 1. Overview & Monetization Principles
FreeGeoTagger is a premier, privacy-first image geotagging web application. While the site is 100% free and client-side, future advertising can support ongoing development and geocoding infrastructure. In accordance with **Phase 16 (Ads Readiness Only)** and **Section 25 of the Master Specification**, monetization infrastructure is fully architected and pre-allocated but remains **strictly disabled by default** (`ADS_CONFIG.enabled === false`).

### The Golden Rule of Monetization
> **"The core tool must remain exceptionally fast, intuitive, and easy to use even after ads are enabled."**

### Forbidden Core Tool Interaction Zones (Zero Ads Policy)
Under no circumstances may an advertisement be placed:
1. Inside the upload dropzone or file selection queue.
2. Between the latitude and longitude coordinate input fields or DMS inputs.
3. Directly adjacent to or mimicking the "Download" or "Download ZIP" buttons.
4. Between "Process" and the verification result state.
5. Over the interactive Leaflet map canvas.
6. Over the photo image preview.
7. Inside toast notifications or error messages.
8. As a deceptive "fake download" button.
9. In a full-screen interstitial or modal gating user progress.

---

## 2. Configuration & Master Switch (`client/src/lib/ads-config.ts`)

Monetization is centrally managed via `ADS_CONFIG`:
```typescript
export const ADS_CONFIG: AdsSystemConfig = {
  enabled: false, // Inactive by default during core rebuild
  client: "ca-pub-6438644207209483",
  debugPlaceholders: process.env.NODE_ENV === "development",
  placements: { ... }
};
```

### Publisher Ownership & Credentials
- **ads.txt**: Located at `https://freegeotagger.com/ads.txt` declaring:
  `google.com, pub-6438644207209483, DIRECT, f08c47fec0942fa0`
- **Meta Tag**: Declared in `client/index.html` and all static routes:
  `<meta name="google-adsense-account" content="ca-pub-6438644207209483" />`

---

## 3. Cumulative Layout Shift (CLS) Protection

A primary risk of web advertising is Cumulative Layout Shift (CLS) caused when dynamic ad tags inject content into unreserved DOM space. FreeGeoTagger prevents layout shifts through strict geometric reservations.

### Pre-Allocated Slot Geometries
Every ad slot defines explicit CSS min-height rules matching standard IAB ad units:
| Placement ID | Standard Format | Desktop Dimensions | Mobile Dimensions | Pre-Allocated Min-Height |
|---|---|---|---|---|
| `homepage-below-tool` | Horizontal Banner | 728 × 90 px | 320 × 100 px | `min-h-[90px] md:min-h-[90px]` |
| `homepage-mid-content` | Horizontal Banner | 728 × 90 px | 320 × 100 px | `min-h-[90px] md:min-h-[90px]` |
| `homepage-bottom` | Horizontal Banner | 728 × 90 px | 320 × 100 px | `min-h-[90px] md:min-h-[90px]` |
| `gps-finder-below-tool`| Horizontal Banner | 728 × 90 px | 320 × 100 px | `min-h-[90px] md:min-h-[90px]` |
| `article-mid` | Medium Rectangle | 300 × 250 px | 300 × 250 px | `min-h-[250px]` |
| `article-bottom` | Horizontal Banner | 728 × 90 px | 320 × 100 px | `min-h-[90px]` |

When monetization is inactive, the component either renders zero markup in production or an unobtrusive wireframe placeholder in local development (`debugPlaceholders`), preserving exact layout integrity.

---

## 4. Google Consent Mode v2 & Privacy Integration

FreeGeoTagger integrates advertising readiness directly with Google Consent Mode v2 and the user's choice in `CookieConsent`:
1. **Default-Denied State**: Before any ad scripts load, all advertising storage is denied:
   ```javascript
   gtag('consent', 'default', {
     'ad_storage': 'denied',
     'ad_user_data': 'denied',
     'ad_personalization': 'denied',
     'analytics_storage': 'denied',
     'wait_for_update': 500
   });
   ```
2. **Consent Gate**: `AdSlot` evaluates `hasAdConsent()` prior to requesting ad creatives. If the user declined cookies or has not yet accepted, zero advertising requests are made.
3. **Delayed Loading**: Ad scripts are loaded with non-blocking deferred timing to guarantee zero competition with critical LCP and FCP tool assets.

---

## 5. Component Architecture (`client/src/components/ad-slot.tsx`)

### Features
- **Security Guardrail**: Checks `FORBIDDEN_PLACEMENTS` and throws an error if placed in a core tool zone.
- **Accessibility**: Includes semantic `role="region"` or `aside`, `aria-label="Advertisement"`, and optional subtle uppercase "Advertisement" badge.
- **Responsive Wrapper**: Centered flex container maintaining max-width bounds (`728px` or `336px`).

---

## 6. Verification & Automated Test Suite

The ads readiness implementation is verified by `script/test-ads-readiness.ts` (`npm run test:ads`):
- Verifies master disabled switch (`ADS_CONFIG.enabled === false`).
- Validates publisher credentials against `ads.txt` and `index.html`.
- Verifies min-height reservations across all 6 standard placements.
- Scans all core tool components (`client/src/components/tool/*`) to guarantee zero ad units.
- Verifies placement presence across Homepage, GPS Finder, and Blog templates.
- Tests consent check integration and security blocklists.
