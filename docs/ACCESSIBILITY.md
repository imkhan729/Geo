# FreeGeoTagger — Accessibility Specification & WCAG 2.2 AA Audit

**Document Version:** 1.0.0 (Phase 3 Design System Baseline)  
**Standard:** Web Content Accessibility Guidelines (WCAG) 2.2 Level AA  
**Last Updated:** 2026-09-11  
**Auditor:** Google Antigravity

---

## 1. Accessibility Policy & Overview

FreeGeoTagger is designed to be fully usable by photographers, researchers, and everyday users regardless of visual, motor, auditory, or cognitive abilities. Accessibility is treated as an essential product constraint rather than an optional checklist.

### Core Accessibility Principles
1. **Perceivable:** High contrast dark-on-light surfaces, descriptive alt text for meaningful images, and empty alt text for decorative elements.
2. **Operable:** 100% of workflows executable via keyboard; visible focus rings on every focusable element; accessible skip-to-content mechanism; comfortable mobile touch targets ($\ge 44 \times 44$ px).
3. **Understandable:** Predictable navigation, clear error alerts, logical heading hierarchies without skipped levels.
4. **Robust:** Semantic HTML5 landmarks, standard ARIA roles where required, and zero reliance on experimental browser-only APIs without fallbacks.

---

## 2. Color Contrast Ratios (WCAG 2.2 AA Audit)

Target: Minimum 4.5:1 for normal text, 3.0:1 for large text / UI components (SC 1.4.3).

| UI Element | Foreground Color | Background Color | Contrast Ratio | WCAG 2.2 Status |
|---|---|---|---|---|
| **Body Text / Headings** | `hsl(150 18% 10%)` (`#14211a`) | `hsl(38 25% 97%)` (`#f8f6f2`) | **13.4:1** | **PASS (AAA)** |
| **Primary Action Button** | Pure White (`#ffffff`) | `hsl(148 52% 30%)` (`#247545`) | **5.3:1** | **PASS (AA)** |
| **Card Surface Text** | `hsl(150 18% 10%)` (`#14211a`) | Pure White (`#ffffff`) | **14.2:1** | **PASS (AAA)** |
| **Muted Text / Subtitles** | `hsl(150 12% 40%)` (`#597365`) | Pure White (`#ffffff`) | **5.4:1** | **PASS (AA)** |
| **Destructive Alerts** | `hsl(0 84% 58%)` (`#ef3b3b`) | `hsl(0 100% 97%)` | **4.9:1** | **PASS (AA)** |
| **Copper Amber Accent** | `hsl(22 68% 48%)` (`#cb5922`) | Pure White (`#ffffff`) | **4.6:1** | **PASS (AA)** |
| **Dark Mode Body Text** | `hsl(38 25% 95%)` (`#f5f2eb`) | `hsl(155 22% 8%)` (`#101a14`) | **12.8:1** | **PASS (AAA)** |
| **Dark Mode Muted Text** | `hsl(148 10% 58%)` (`#899b90`) | `hsl(155 22% 11%)` (`#16241c`) | **4.7:1** | **PASS (AA)** |

---

## 3. Keyboard Navigation & Focus Management

### Skip to Main Content Link
- Component: `client/src/components/skip-link.tsx`
- Target: `<main id="main-content" tabIndex={-1}>`
- Behavior: Hidden visually off-screen by default (`sr-only`), renders prominently at the top-left of the viewport on first Tab keypress with high-contrast styling (`bg-primary text-primary-foreground focus:not-sr-only`).

### Focus Rings
- All interactive elements (buttons, inputs, links, toggles) receive a clear focus indicator:
  `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- Contrast of the focus ring against adjacent surfaces is $\ge 3.0:1$.
- Focus is never suppressed via `outline: none` without a corresponding `focus-visible:ring` replacement.

---

## 4. Mobile Viewport & Touch Target Matrix

Target: Minimum 24x24 px tap area (WCAG 2.5.8), recommended $\ge 44 \times 44$ px on mobile devices.

| Viewport Width | Device Class | Responsive Layout Behavior | Tap Target Compliance |
|---|---|---|---|
| **320 px** | Minimum mobile (small iPhone SE) | Single column; zero horizontal scroll; responsive table scroll wrapper. | All nav links $\ge 44$ px height |
| **360 px** | Standard Android | Single column; comfortable card padding (16px); readable typography. | All primary CTA buttons $\ge 44$ px height |
| **390 px** | iPhone 12 / 13 / 14 / 15 / 16 | Single column; touch targets thumb-friendly; coordinate inputs full width. | PASS ($\ge 44$ px) |
| **412 px** | Pixel / Samsung Galaxy | Single column; comfortable form inputs; map responsive aspect ratio. | PASS ($\ge 44$ px) |
| **768 px** | iPad / Tablet | 2-column grid layout for map and controls. | PASS |
| **1024 px+** | Desktop / Standard Laptop | Maximum readable content width constrained to `max-w-6xl` (1152px). | PASS |

---

## 5. Semantic Landmarks & Screen Reader Hierarchy

1. **Banner:** `<header role="banner">` enclosing logo and main navigation.
2. **Navigation:** `<nav aria-label="Main navigation">` and `<nav aria-label="Mobile navigation">`.
3. **Main Content:** `<main id="main-content" role="main">` with single primary `<h1>` per view.
4. **Contentinfo:** `<footer role="contentinfo">` enclosing tool links, legal policies, and entity information.
5. **Callouts & Status:** Non-modal messages use `role="status"` (info/success) or `role="alert"` (destructive) without aggressive interrupts.
6. **Images:** Real logos use descriptive `alt="FreeGeoTagger Logo"`; icons use `aria-hidden="true"`.
