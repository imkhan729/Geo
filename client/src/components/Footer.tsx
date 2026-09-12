import logoImage from "@assets/logo-202.webp";
import { Link } from "wouter";
import { Shield, Zap, Globe, MapPin } from "lucide-react";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer role="contentinfo" className="border-t border-border bg-muted/20">
            {/* Pre-footer CTA strip */}
            <div className="border-b border-border bg-primary/5 topo-pattern">
                <div className="container mx-auto px-4 max-w-6xl py-10 text-center">
                    <h2 className="text-2xl font-display font-bold mb-2 text-foreground">
                        Ready to geotag your photos?
                    </h2>
                    <p className="text-muted-foreground mb-5 max-w-md mx-auto text-sm">
                        Free, private, and instant. No account or software needed — works entirely in your browser.
                    </p>
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 min-h-12 rounded-xl font-semibold font-display bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        Start Geotagging — It's Free
                    </a>
                </div>
            </div>

            {/* Main footer */}
            <div className="container mx-auto px-4 max-w-6xl py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {/* Brand column */}
                    <div className="lg:col-span-1">
                        <a href="/" className="inline-block hover:opacity-85 transition-opacity mb-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label="FreeGeoTagger Home">
                            <img src={logoImage} alt="FreeGeoTagger Logo" className="h-[48px] w-auto" width="202" height="70" loading="lazy" decoding="async" />
                        </a>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                            A free, privacy-first browser tool for adding GPS coordinates to photos. No uploads. No accounts. No cost.
                        </p>
                        {/* Trust badges */}
                        <div className="flex flex-wrap gap-2.5">
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/60">
                                <Shield className="h-3 w-3 text-primary" aria-hidden="true" />
                                100% Private
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/60">
                                <Zap className="h-3 w-3 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                                Always Free
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/60">
                                <Globe className="h-3 w-3 text-primary" aria-hidden="true" />
                                Browser-Based
                            </span>
                        </div>
                    </div>

                    {/* Tools column */}
                    <div>
                        <h3 className="font-display font-semibold text-sm mb-4 text-foreground">Tools</h3>
                        <ul className="space-y-2.5 text-sm text-muted-foreground">
                            <li>
                                <Link href="/" className="hover:text-foreground transition-colors hover:translate-x-0.5 inline-block py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                                    Photo Geotagging
                                </Link>
                            </li>
                            <li>
                                <Link href="/gps-finder" className="hover:text-foreground transition-colors hover:translate-x-0.5 inline-block py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                                    GPS Finder
                                </Link>
                            </li>
                            <li>
                                <Link href="/exif-viewer" className="hover:text-foreground transition-colors hover:translate-x-0.5 inline-block py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                                    EXIF Viewer
                                </Link>
                            </li>
                            <li>
                                <Link href="/remove-gps-from-photo" className="hover:text-foreground transition-colors hover:translate-x-0.5 inline-block py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                                    Remove GPS
                                </Link>
                            </li>
                            <li>
                                <Link href="/coordinate-converter" className="hover:text-foreground transition-colors hover:translate-x-0.5 inline-block py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                                    Coordinate Converter
                                </Link>
                            </li>
                            <li>
                                <Link href="/batch-geotag-photos" className="hover:text-foreground transition-colors hover:translate-x-0.5 inline-block py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                                    Batch Geotagger
                                </Link>
                            </li>
                            <li>
                                <Link href="/#features" className="hover:text-foreground transition-colors hover:translate-x-0.5 inline-block py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link href="/#how-it-works" className="hover:text-foreground transition-colors hover:translate-x-0.5 inline-block py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                                    How it Works
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog" className="hover:text-foreground transition-colors hover:translate-x-0.5 inline-block py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="hover:text-foreground transition-colors hover:translate-x-0.5 inline-block py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                                    About
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Use Cases column */}
                    <div>
                        <h3 className="font-display font-semibold text-sm mb-4 text-foreground">Use Cases</h3>
                        <ul className="space-y-2.5 text-sm text-muted-foreground">
                            <li className="py-1">Photographers</li>
                            <li className="py-1">Real Estate Agents</li>
                            <li className="py-1">Travel Bloggers</li>
                            <li className="py-1">Journalists</li>
                            <li className="py-1">Field Researchers</li>
                            <li className="py-1">Businesses</li>
                        </ul>
                    </div>

                    {/* Legal column */}
                    <div>
                        <h3 className="font-display font-semibold text-sm mb-4 text-foreground">Legal & Privacy</h3>
                        <ul className="space-y-2.5 text-sm text-muted-foreground">
                            <li>
                                <Link href="/privacy" className="hover:text-foreground transition-colors hover:translate-x-0.5 inline-block py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="hover:text-foreground transition-colors hover:translate-x-0.5 inline-block py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/cookies" className="hover:text-foreground transition-colors hover:translate-x-0.5 inline-block py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                                    Cookie Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="hover:text-foreground transition-colors hover:translate-x-0.5 inline-block py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                                    Contact
                                </Link>
                            </li>
                        </ul>

                        <div className="mt-6">
                            <h3 className="font-display font-semibold text-sm mb-3 text-foreground">Compatible With</h3>
                            <ul className="space-y-1.5 text-xs text-muted-foreground">
                                <li>Google Photos</li>
                                <li>Apple Photos</li>
                                <li>Adobe Lightroom</li>
                                <li>Windows File Explorer</li>
                                <li>GIS Systems</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-muted-foreground">
                    <p>&copy; {currentYear} FreeGeoTagger. All rights reserved.</p>
                    <p className="text-muted-foreground/70">
                        Processing happens entirely in your browser — your photos never leave your device.
                    </p>
                </div>
            </div>
        </footer>
    );
}
