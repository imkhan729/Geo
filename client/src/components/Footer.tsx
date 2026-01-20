import logoImage from "@assets/Geo_Tagger_Logo_2.webp-removebg-preview_1768829275162.png";
import { Link } from "wouter";

export function Footer() {
    return (
        <footer className="border-t border-border py-10">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
                    <div className="md:max-w-sm">
                        <img src={logoImage} alt="GeoTagger" className="h-[59px] mb-4" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            GeoTagger is a free online image geotagging tool that allows users to add GPS location data to photos directly in their browser. It supports JPG, PNG, WebP, and HEIC files and works without uploads, accounts, or subscriptions.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-8">
                        <div>
                            <h4 className="font-semibold mb-3">Product</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="/#features" className="hover:text-foreground transition-colors">Features</Link></li>
                                <li><Link href="/#how-it-works" className="hover:text-foreground transition-colors">How it Works</Link></li>
                                <li><Link href="/gps-finder" className="hover:text-foreground transition-colors">GPS Finder</Link></li>
                                <li><Link href="/#faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-3">Legal</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                                <li><Link href="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="border-t border-border mt-8 pt-6 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} GeoTagger. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
