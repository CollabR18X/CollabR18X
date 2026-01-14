import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Users, 
  LayoutDashboard, 
  SquareUser, 
  LogOut, 
  UserCircle 
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/directory", label: "Directory", icon: Users },
    { href: "/collaborations", label: "Collabs", icon: SquareUser },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <span className="font-display text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            CollabR18X
          </span>
        </Link>
        
        <div className="hidden md:flex md:space-x-6">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary ${
                location === item.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <div className="flex items-center space-x-2 hover:bg-muted/50 p-2 rounded-full transition-colors cursor-pointer">
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt={user.firstName || "User"} 
                    className="h-8 w-8 rounded-full object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {user.firstName?.[0] || "U"}
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <Link href="/profile/me">
                <DropdownMenuItem className="cursor-pointer">
                  <UserCircle className="mr-2 h-4 w-4" />
                  My Profile
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
