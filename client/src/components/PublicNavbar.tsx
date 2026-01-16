import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/directory", label: "Directory" },
  { href: "/community", label: "Community" },
  { href: "/community/events", label: "Events" },
  { href: "/community/forums", label: "Forums" },
];

export function PublicNavbar() {
  const [location] = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-20 items-center gap-6 px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white font-bold text-xl shadow-lg shadow-primary/20">
            C
          </div>
          <span className="font-display text-2xl font-bold">CollabR18X</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location === item.href ? "text-primary bg-muted/50" : "text-muted-foreground hover:text-primary"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <a href="/api/login">
            <Button variant="outline" className="font-semibold border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
              Log in
            </Button>
          </a>
          <a href="/api/login">
            <Button className="font-semibold shadow-lg shadow-primary/20">
              Get Started
            </Button>
          </a>
        </div>
      </div>
    </nav>
  );
}
