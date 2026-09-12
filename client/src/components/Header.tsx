import logoImage from "@assets/logo-202.webp";
import { ThemeToggle } from "@/components/theme-toggle";
import { SkipLink } from "@/components/skip-link";
import { useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import {
    Menu,
    X,
    MapPin,
    ChevronDown,
} from "lucide-react";

// Zero-overhead inline SVG icons to maintain strict <= 400KB uncompressed Eager JS budget
function BatchIcon({ className = "h-4 w-4" }: { className?: string; "aria-hidden"?: boolean | "true" | "false" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
            <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
            <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
        </svg>
    );
}

function SearchIcon({ className = "h-4 w-4" }: { className?: string; "aria-hidden"?: boolean | "true" | "false" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    );
}

function CameraIcon({ className = "h-4 w-4" }: { className?: string; "aria-hidden"?: boolean | "true" | "false" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
        </svg>
    );
}

function ShieldIcon({ className = "h-4 w-4" }: { className?: string; "aria-hidden"?: boolean | "true" | "false" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        </svg>
    );
}

function CompassIcon({ className = "h-4 w-4" }: { className?: string; "aria-hidden"?: boolean | "true" | "false" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
    );
}

function SparklesIcon({ className = "h-3.5 w-3.5" }: { className?: string; "aria-hidden"?: boolean | "true" | "false" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
    );
}

interface ToolItem {
    href: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
    badge?: string;
    testId: string;
}

const TOOLS_LIST: ToolItem[] = [
    {
        href: "/#upload-widget",
        label: "Photo Geotagger",
        description: "Add GPS coordinates and location metadata to single photos",
        icon: MapPin,
        testId: "link-photo-geotagger",
    },
    {
        href: "/batch-geotag-photos",
        label: "Batch Geotagger",
        description: "Bulk geotag multiple photos with CSV coordinate mapping",
        icon: BatchIcon,
        badge: "Multi",
        testId: "link-batch-geotag",
    },
    {
        href: "/gps-finder",
        label: "GPS Photo Finder",
        description: "Extract and view existing coordinates on an interactive map",
        icon: SearchIcon,
        testId: "link-gps-finder",
    },
    {
        href: "/exif-viewer",
        label: "EXIF Viewer",
        description: "Inspect camera, lens, exposure, and raw metadata tags",
        icon: CameraIcon,
        testId: "link-exif-viewer",
    },
    {
        href: "/remove-gps-from-photo",
        label: "Remove GPS",
        description: "Strip location coordinates for total privacy before sharing",
        icon: ShieldIcon,
        badge: "Privacy",
        testId: "link-remove-gps",
    },
    {
        href: "/coordinate-converter",
        label: "Coordinate Converter",
        description: "Convert between DD, DMS, DDM, and Geohash formats",
        icon: CompassIcon,
        testId: "link-coordinate-converter",
    },
];

export function Header() {
    const [location] = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileToolsOpen, setMobileToolsOpen] = useState(true);
    const [toolsOpen, setToolsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    // Close dropdown on click outside or Escape
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                setToolsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && toolsOpen) {
                setToolsOpen(false);
                triggerRef.current?.focus();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [toolsOpen]);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        setMobileOpen(false);
        setToolsOpen(false);
        if (href.includes("#")) {
            const [path, hash] = href.split("#");
            const targetPath = path === "" ? "/" : path;
            if (location === targetPath) {
                e.preventDefault();
                const element = document.getElementById(hash);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                } else {
                    window.location.href = href;
                }
            }
        }
    };

    const isToolActive = TOOLS_LIST.some((tool) => {
        if (tool.href.startsWith("/#")) return false;
        return location === tool.href;
    });

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
                    <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 text-sm font-medium" aria-label="Main navigation">
                        <a
                            href="/"
                            onClick={(e) => handleNavClick(e, "/")}
                            className={`nav-link px-3 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                location === "/" ? "text-foreground font-semibold bg-muted/50" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            }`}
                            data-testid="link-home"
                        >
                            Home
                        </a>

                        {/* Tools Dropdown Trigger */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                ref={triggerRef}
                                type="button"
                                onClick={() => setToolsOpen(!toolsOpen)}
                                onKeyDown={(e) => {
                                    if (e.key === "ArrowDown" && !toolsOpen) {
                                        e.preventDefault();
                                        setToolsOpen(true);
                                    }
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                    toolsOpen || isToolActive
                                        ? "text-foreground font-semibold bg-muted/60"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                }`}
                                aria-expanded={toolsOpen}
                                aria-haspopup="menu"
                                data-testid="button-tools-dropdown"
                            >
                                <span>Tools</span>
                                <ChevronDown
                                    className={`h-4 w-4 transition-transform duration-200 ${toolsOpen ? "rotate-180 text-foreground" : "text-muted-foreground"}`}
                                    aria-hidden="true"
                                />
                            </button>

                            {/* Tools Dropdown Menu */}
                            {toolsOpen && (
                                <div
                                    role="menu"
                                    aria-label="Tools directory"
                                    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[540px] rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl backdrop-blur-md p-3 z-50 animate-in fade-in-0 zoom-in-95 duration-150"
                                >
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {TOOLS_LIST.map((tool) => {
                                            const Icon = tool.icon;
                                            const active = location === tool.href;
                                            return (
                                                <a
                                                    key={tool.href}
                                                    role="menuitem"
                                                    href={tool.href}
                                                    onClick={(e) => handleNavClick(e, tool.href)}
                                                    className={`group flex items-start gap-3 p-2.5 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                                        active
                                                            ? "bg-primary/10 text-primary"
                                                            : "hover:bg-muted/80 text-foreground"
                                                    }`}
                                                    data-testid={tool.testId}
                                                >
                                                    <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                                                        active
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                                    }`}>
                                                        <Icon className="h-4 w-4" aria-hidden="true" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                                                                {tool.label}
                                                            </span>
                                                            {tool.badge && (
                                                                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-primary/15 text-primary">
                                                                    {tool.badge}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                                                            {tool.description}
                                                        </p>
                                                    </div>
                                                </a>
                                            );
                                        })}
                                    </div>

                                    {/* Dropdown footer banner */}
                                    <div className="border-t border-border/80 mt-2.5 pt-2.5 px-2 flex items-center justify-between text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1.5 font-medium text-foreground/80">
                                            <SparklesIcon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                                            Zero-Upload Client Architecture
                                        </span>
                                        <span className="text-muted-foreground/80">
                                            100% Private in your browser
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <a
                            href="/#how-it-works"
                            onClick={(e) => handleNavClick(e, "/#how-it-works")}
                            className="nav-link px-3 py-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            data-testid="link-how-it-works"
                        >
                            How it Works
                        </a>

                        <a
                            href="/#features"
                            onClick={(e) => handleNavClick(e, "/#features")}
                            className="nav-link px-3 py-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            data-testid="link-features"
                        >
                            Features
                        </a>

                        <a
                            href="/blog"
                            onClick={(e) => handleNavClick(e, "/blog")}
                            className={`nav-link px-3 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                location.startsWith("/blog") ? "text-foreground font-semibold bg-muted/50" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            }`}
                            data-testid="link-blog"
                        >
                            Blog
                        </a>

                        <a
                            href="/about"
                            onClick={(e) => handleNavClick(e, "/about")}
                            className={`nav-link px-3 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                location === "/about" ? "text-foreground font-semibold bg-muted/50" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            }`}
                            data-testid="link-about"
                        >
                            About
                        </a>
                    </nav>

                    {/* Desktop actions */}
                    <div className="hidden md:flex items-center gap-3">
                        <ThemeToggle data-testid="button-theme" />
                        <a
                            href="/#upload-widget"
                            onClick={(e) => {
                                handleNavClick(e, "/#upload-widget");
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
                <div className="md:hidden border-t border-border bg-background/98 backdrop-blur-md max-h-[calc(100vh-4rem)] overflow-y-auto">
                    <nav className="container mx-auto px-4 py-3 max-w-6xl flex flex-col gap-1" aria-label="Mobile navigation">
                        <a
                            href="/"
                            onClick={(e) => handleNavClick(e, "/")}
                            className="px-3 min-h-[44px] flex items-center text-sm font-medium text-foreground hover:bg-muted/60 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            data-testid="mobile-link-home"
                        >
                            Home
                        </a>

                        {/* Collapsible Mobile Tools Section */}
                        <div className="border-y border-border/60 my-1 py-1">
                            <button
                                type="button"
                                onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
                                className="w-full px-3 min-h-[44px] flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                                aria-expanded={mobileToolsOpen}
                            >
                                <span>Tools & Utilities ({TOOLS_LIST.length})</span>
                                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${mobileToolsOpen ? "rotate-180" : ""}`} />
                            </button>

                            {mobileToolsOpen && (
                                <div className="grid grid-cols-1 gap-1 pl-2 pr-1 pb-1">
                                    {TOOLS_LIST.map((tool) => {
                                        const Icon = tool.icon;
                                        return (
                                            <a
                                                key={tool.href}
                                                href={tool.href}
                                                onClick={(e) => handleNavClick(e, tool.href)}
                                                className="flex items-center gap-2.5 px-3 min-h-[44px] rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                data-testid={`mobile-${tool.testId}`}
                                            >
                                                <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                                                <span className="flex-1">{tool.label}</span>
                                                {tool.badge && (
                                                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                                                        {tool.badge}
                                                    </span>
                                                )}
                                            </a>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <a
                            href="/#how-it-works"
                            onClick={(e) => handleNavClick(e, "/#how-it-works")}
                            className="px-3 min-h-[44px] flex items-center text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            data-testid="mobile-link-how-it-works"
                        >
                            How it Works
                        </a>

                        <a
                            href="/#features"
                            onClick={(e) => handleNavClick(e, "/#features")}
                            className="px-3 min-h-[44px] flex items-center text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            data-testid="mobile-link-features"
                        >
                            Features
                        </a>

                        <a
                            href="/blog"
                            onClick={(e) => handleNavClick(e, "/blog")}
                            className="px-3 min-h-[44px] flex items-center text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            data-testid="mobile-link-blog"
                        >
                            Blog
                        </a>

                        <a
                            href="/about"
                            onClick={(e) => handleNavClick(e, "/about")}
                            className="px-3 min-h-[44px] flex items-center text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            data-testid="mobile-link-about"
                        >
                            About
                        </a>

                        <a
                            href="/contact"
                            onClick={(e) => handleNavClick(e, "/contact")}
                            className="px-3 min-h-[44px] flex items-center text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            data-testid="mobile-link-contact"
                        >
                            Contact
                        </a>

                        <div className="pt-2 pb-1">
                            <a
                                href="/#upload-widget"
                                onClick={(e) => {
                                    handleNavClick(e, "/#upload-widget");
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

