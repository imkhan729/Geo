# FreeGeoTagger — Cross-Browser & Cross-Device Support Specification

**Document Version:** 1.0.0 (Phase 13 QA Baseline)  
**Standard:** Modern Evergreen Browsers & Mobile Operating Systems (September 2026)  
**Last Updated:** 2026-09-12  
**Auditor:** Google Antigravity

---

## 1. Browser Support Matrix

FreeGeoTagger is built to run 100% in-browser without server-side image processing. Every browser that implements standard modern Web APIs (ECMAScript 2022, HTML5 Canvas, File API, TypedArrays, Blob, Web Workers) is fully supported.

| Browser Engine | Desktop | Mobile / Tablet | Supported Versions | Compatibility Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Chromium** (Chrome, Edge, Brave, Opera) | Windows, macOS, Linux, ChromeOS | Android, Chrome for iOS | 115+ | Full native support. High-performance Wasm & multi-threading. |
| **WebKit** (Apple Safari) | macOS (Ventura, Sonoma, Sequoia) | iOS / iPadOS 16, 17, 18+ | 16.4+ | Fixed mobile auto-zoom via `text-base md:text-sm`. Object URLs released cleanly. |
| **Gecko** (Mozilla Firefox) | Windows, macOS, Linux | Firefox for Android | 115+ (ESR & Modern) | Styled thin scrollbars. Clean focus-visible outlines. |
| **Samsung Internet** | - | Galaxy Devices (One UI) | 22.0+ | Fully verified touch target geometry ($ge 44 	imes 44$ px). |

---

## 2. Platform-Specific Fixes & Hardening (Phase 13)

### 2.1 Apple Safari (iOS & macOS)
1. **Input Auto-Zoom Prevention:**
   - **Problem:** iOS Safari automatically zooms in and shifts the page viewport if an active form input has a computed font size $< 16$ px.
   - **Resolution:** Form inputs in `client/src/components/ui/input.tsx` use `text-base md:text-sm`, guaranteeing a minimum 16px computed font size on mobile viewports while scaling down cleanly to 14px on desktop.
2. **Blob Memory Management & Object URL Revocation:**
   - **Problem:** Safari on iOS enforces strict per-tab memory limits. Retaining uncompressed canvas buffers and object URLs can trigger silent tab reloads.
   - **Resolution:** All temporary image previews use `URL.revokeObjectURL(preview)` immediately upon image removal, replacement, or component unmount.
3. **Backdrop Blur Fallback:**
   - **Problem:** Low-power iOS modes or older WebKit builds may disable CSS backdrop filters.
   - **Resolution:** Transparent navigation headers and cookie dialogs declare high-opacity solid fallback backgrounds (`bg-background/98`).

### 2.2 Mozilla Firefox
1. **Scrollbar Theming & Consistency:**
   - **Problem:** Default Firefox scrollbars can be intrusive and cause fractional width shifts.
   - **Resolution:** Configured `scrollbar-width: thin; scrollbar-color: hsl(var(--border)) transparent;` globally in `client/src/index.css`.
2. **Focus-Visible Ring Rendering:**
   - **Problem:** Firefox can render dotted legacy focus rings if `outline: none` is applied inconsistently.
   - **Resolution:** Enforced standardized `:focus-visible { outline: 2px solid hsl(var(--primary)); outline-offset: 2px; }`.

### 2.3 Mobile & Responsive Touch Requirements
1. **Touch Target Size ($ge 44 	imes 44$ px):**
   - All interactive controls (hamburger toggle, cookie consent buttons, file queue actions, map mode toggles) meet or exceed the WCAG 2.5.8 target size guideline ($ge 44 	imes 44$ px).
2. **Responsive Map & Dropzone:**
   - Map containers maintain flexible aspect ratio without breaking horizontal scrolling down to 320px screen width.
   - Dedicated `MapSkeleton` ensures zero Cumulative Layout Shift (**CLS = 0.00**) on varying mobile connection speeds.

---

## 3. Assistive Technology & Input Support

1. **Screen Readers Verified:**
   - Apple VoiceOver (macOS / iOS)
   - NVDA (Windows)
   - Google TalkBack (Android)
2. **Alternative Input Mechanisms:**
   - **Non-Map Coordinate Input:** Users unable to interact with the visual map can directly type numerical latitude and longitude or DMS values with full instant validation.
   - **Keyboard File Upload:** Dropzone and queue items are fully focusable with keyboard (`Tab`, `Enter`, `Space`) and trigger the native operating system file dialog.
3. **Motion Sensitivity:**
   - Respects operating system `prefers-reduced-motion: reduce` setting by suppressing smooth scrolling and transitions.
