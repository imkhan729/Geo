import logoImage from "@assets/logo-202.webp";
import { ThemeToggle } from "@/components/theme-toggle";
import { SkipLink } from "@/components/skip-link";
import { useLocation } from "wouter";
import { useState } from "react";
import { Menu, X, MapPin } from "lucide-react";

export function Header() {
    const [location] = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        setMobileOpen(false);
        if (href.includes('#')) {
            const [path, hash] = href.split('#');
            if (location === path || path === '/') {
                e.preventDefault();
                if (location !== '/' && path === '/') {
                    window.location.href = href;
                    return;
                }
                const element = document.getElementById(hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }
    };

    const navLinks = [
        { href: "/", label: "Home", testId: "link-home" },
        { href: "/#features", label: "Features", testId: "link-features" },
        { href: "/#how-it-works", label: "How it Works", testId: "link-how-it-works" },
        { href: "/gps-finder", label: "GPS Finder", testId: "link-gps-finder" },
        { href: "/exif-viewer", label: "EXIF Viewer", testId: "link-exif-viewer" },
        { href: "/remove-gps-from-photo", label: "Remove GPS", testId: "link-remove-gps" },
        { href: "/coordinate-converter", label: "Coordinates", testId: "link-coordinate-converter" },
        { href: "/batch-geotag-photos", label: "Batch", testId: "link-batch-geotag" },
        { href: "/blog", label: "Blog", testId: "link-blog" },
    ];

    return (
        <header role="banner" className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-50">
            <SkipLink targetId="main-content" />
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <a
                        href="/"
                        className="hover:opacity-85 transition-opacity flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
                        data-testid="link-logo"
                        aria-label="FreeGeoTagger Home"
                    >
                        <img
                            src={logoImage}
                            alt="FreeGeoTagger Logo"
                            className="h-[40px] w-auto"
                            width="202"
                            height="70"
                            fetchPriority="high"
                        />
                    </a>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-1 text-sm font-medium" aria-label="Main navigation">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={(e) => handleNavClick(e, link.href)}
                                className="nav-link px-3 py-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                data-testid={link.testId}
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    {/* Desktop actions */}
                    <div className="hidden md:flex items-center gap-3">
                        <ThemeToggle data-testid="button-theme" />
                        <a
                            href="/#upload-widget"
                            onClick={(e) => {
                                e.preventDefault();
                                const el = document.getElementById('upload-widget');
                                if (el) {
                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                } else {
                                    window.location.href = '/#upload-widget';
                                }
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-10 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            data-testid="link-cta-header"
                        >
                            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                            Geotag Free
                        </a>
                    </div>

                    {/* Mobile actions */}
                    <div className="flex md:hidden items-center gap-2">
                        <ThemeToggle data-testid="button-theme-mobile" />
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            aria-label={mobileOpen ? "Close menu" : "Open menu"}
                            aria-expanded={mobileOpen}
                        >
                            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-border bg-background/98 backdrop-blur-md">
                    <nav className="container mx-auto px-4 py-3 max-w-6xl flex flex-col gap-1" aria-label="Mobile navigation">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={(e) => handleNavClick(e, link.href)}
                                className="px-3 min-h-[44px] flex items-center text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                data-testid={`mobile-${link.testId}`}
                            >
                                {link.label}
                            </a>
                        ))}
                        <div className="pt-2 pb-1">
                            <a
                                href="/#upload-widget"
                                onClick={(e) => {
                                    setMobileOpen(false);
                                    e.preventDefault();
                                    const el = document.getElementById('upload-widget');
                                    if (el) {
                                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    } else {
                                        window.location.href = '/#upload-widget';
                                    }
                                }}
                                className="flex items-center justify-center gap-2 w-full px-4 min-h-[44px] rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                data-testid="mobile-link-cta"
                            >
                                <MapPin className="h-4 w-4" aria-hidden="true" />
                                Geotag Photos Free
                            </a>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
