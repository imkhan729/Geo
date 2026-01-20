import logoImage from "@assets/Geo_Tagger_Logo_2.webp-removebg-preview_1768829275162.png";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLocation } from "wouter";

export function Header() {
    const [location] = useLocation();

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        // Check if the link contains a hash (section link)
        if (href.includes('#')) {
            const [path, hash] = href.split('#');

            // If we're on the target page or path is root
            if (location === path || path === '/') {
                e.preventDefault();

                // If we're not on the home page, navigate there first
                if (location !== '/' && path === '/') {
                    window.location.href = href;
                    return;
                }

                // Smooth scroll to the section
                const element = document.getElementById(hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
            // If we're on a different page, let the browser handle navigation normally
        }
    };

    return (
        <header className="border-b border-border glass sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex items-center justify-between h-16">
                    <a href="/" className="hover:opacity-80 transition-opacity" data-testid="link-logo">
                        <img src={logoImage} alt="GeoTagger" className="h-[42px]" />
                    </a>
                    <div className="flex items-center gap-6">
                        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                            <a
                                href="/"
                                onClick={(e) => handleNavClick(e, "/")}
                                className="nav-link text-muted-foreground hover:text-foreground transition-all duration-300 relative group"
                                data-testid="link-home"
                            >
                                Home
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-green-500 group-hover:w-full transition-all duration-300"></span>
                            </a>
                            <a
                                href="/#features"
                                onClick={(e) => handleNavClick(e, "/#features")}
                                className="nav-link text-muted-foreground hover:text-foreground transition-all duration-300 relative group"
                                data-testid="link-features"
                            >
                                Features
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-green-500 group-hover:w-full transition-all duration-300"></span>
                            </a>
                            <a
                                href="/#how-it-works"
                                onClick={(e) => handleNavClick(e, "/#how-it-works")}
                                className="nav-link text-muted-foreground hover:text-foreground transition-all duration-300 relative group"
                                data-testid="link-how-it-works"
                            >
                                How it Works
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-green-500 group-hover:w-full transition-all duration-300"></span>
                            </a>
                            <a
                                href="/gps-finder"
                                onClick={(e) => handleNavClick(e, "/gps-finder")}
                                className="nav-link text-muted-foreground hover:text-foreground transition-all duration-300 relative group"
                                data-testid="link-gps-finder"
                            >
                                GPS Finder
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-green-500 group-hover:w-full transition-all duration-300"></span>
                            </a>
                            <a
                                href="/#faq"
                                onClick={(e) => handleNavClick(e, "/#faq")}
                                className="nav-link text-muted-foreground hover:text-foreground transition-all duration-300 relative group"
                                data-testid="link-faq"
                            >
                                FAQ
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-green-500 group-hover:w-full transition-all duration-300"></span>
                            </a>
                        </nav>
                        <ThemeToggle data-testid="button-theme" />
                    </div>
                </div>
            </div>
        </header>
    );
}
