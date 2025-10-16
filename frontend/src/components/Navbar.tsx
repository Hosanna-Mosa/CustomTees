import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Menu, X, Search, Phone } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  const navLinks = [
    { name: "Custom T-shirts", path: "/" },
    { name: "Design Lab", path: "/customize" },
    { name: "Products", path: "/products" },
    { name: "Templates", path: "/templates" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top bar */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto flex h-10 items-center justify-between px-4 text-sm">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Custom T-shirts & Promotional Products</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">855-271-2660</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-xl font-bold text-primary-foreground">T</span>
            </div>
            <span className="text-xl font-bold">
              <span className="text-primary">Custom</span>Tees
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors rounded-md",
                  isActive(link.path)
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  0
                </span>
              </Button>
            </Link>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t py-4 md:hidden">
            <div className="flex flex-col gap-2 px-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "rounded-md px-4 py-3 text-sm font-medium transition-colors",
                    isActive(link.path)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/80 hover:bg-muted"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
