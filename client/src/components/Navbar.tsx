import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import { 
  Users, 
  Users2,
  LayoutDashboard, 
  SquareUser, 
  LogOut, 
  UserCircle,
  ShieldOff,
  MessageCircle,
  MapPin,
  Heart,
  MessageSquare,
  Calendar,
  Building,
  Shield,
  ChevronDown,
  Sparkles,
  FileText,
  Languages,
  HelpCircle,
  UserPlus,
  UserCheck,
  VolumeX,
  Clock,
  Bookmark,
  Tag,
  ShieldCheck,
  Settings,
  Archive,
  BarChart3
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { language, setLanguage } = useLanguage();

  if (!user) return null;

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/feed", label: "Feed", icon: MessageCircle },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 relative">
      <div className="container flex h-16 items-center px-4">
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <span className="font-display text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            CollabR18X
          </span>
        </Link>
        
        <div className="hidden md:flex md:space-x-1 md:items-center">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-primary ${
                location === item.href ? "text-primary bg-muted/50" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
          
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <div className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                location === "/directory" || location.startsWith("/discovery") || location.startsWith("/nearby") || location.startsWith("/similar-interests") ? "text-primary bg-muted/50" : "text-muted-foreground hover:text-primary"
              }`}>
                <Users className="h-4 w-4" />
                <span>Directory</span>
                <ChevronDown className="h-4 w-4 ml-1 transition-transform group-data-[state=open]:rotate-180" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <Link href="/directory">
                <DropdownMenuItem className="cursor-pointer flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  Directory
                </DropdownMenuItem>
              </Link>
              <Link href="/discovery">
                <DropdownMenuItem className="cursor-pointer flex items-center">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Discover
                </DropdownMenuItem>
              </Link>
              <Link href="/nearby">
                <DropdownMenuItem className="cursor-pointer flex items-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  Nearby
                </DropdownMenuItem>
              </Link>
              <Link href="/similar-interests">
                <DropdownMenuItem className="cursor-pointer flex items-center">
                  <Heart className="mr-2 h-4 w-4" />
                  Similar Interests
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <div className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                location.startsWith("/chat") || location.startsWith("/collaborations") ? "text-primary bg-muted/50" : "text-muted-foreground hover:text-primary"
              }`}>
                <MessageCircle className="h-4 w-4" />
                <span>Collabs</span>
                <ChevronDown className="h-4 w-4 ml-1 transition-transform group-data-[state=open]:rotate-180" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <Link href="/chat">
                <DropdownMenuItem className="cursor-pointer flex items-center">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Messages
                </DropdownMenuItem>
              </Link>
              <Link href="/collaborations">
                <DropdownMenuItem className="cursor-pointer flex items-center">
                  <SquareUser className="mr-2 h-4 w-4" />
                  Collaborations
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <div className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                location.startsWith("/community") ? "text-primary bg-muted/50" : "text-muted-foreground hover:text-primary"
              }`}>
                <Users2 className="h-4 w-4" />
                <span>Community</span>
                <ChevronDown className="h-4 w-4 ml-1 transition-transform group-data-[state=open]:rotate-180" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48" data-testid="community-dropdown">
              <Link href="/community">
                <DropdownMenuItem className="cursor-pointer flex items-center" data-testid="menu-community-home">
                  <Users2 className="mr-2 h-4 w-4" />
                  Community Home
                </DropdownMenuItem>
              </Link>
              <Link href="/community/forums">
                <DropdownMenuItem className="cursor-pointer flex items-center" data-testid="menu-forums">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Forums
                </DropdownMenuItem>
              </Link>
              <Link href="/community/events">
                <DropdownMenuItem className="cursor-pointer flex items-center" data-testid="menu-events">
                  <Calendar className="mr-2 h-4 w-4" />
                  Events
                </DropdownMenuItem>
              </Link>
              <Link href="/community/hubs">
                <DropdownMenuItem className="cursor-pointer flex items-center" data-testid="menu-hubs">
                  <Building className="mr-2 h-4 w-4" />
                  Local Hubs
                </DropdownMenuItem>
              </Link>
              <Link href="/community/safety">
                <DropdownMenuItem className="cursor-pointer flex items-center" data-testid="menu-safety">
                  <Shield className="mr-2 h-4 w-4" />
                  Safety Alerts
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="ml-auto flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="focus:outline-none">
              <button className="flex items-center justify-center hover:bg-muted/50 p-2 rounded-full transition-colors cursor-pointer">
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt={user.displayName || user.firstName || "User"} 
                    className="h-8 w-8 rounded-full object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {(user.displayName || user.firstName)?.[0] || "U"}
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" sideOffset={4} className="w-56">
              <Link href="/profile/me">
                <DropdownMenuItem className="cursor-pointer" data-testid="menu-my-profile">
                  <UserCircle className="mr-2 h-4 w-4" />
                  My Profile
                </DropdownMenuItem>
              </Link>
              <Link href="/account/settings">
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
              </Link>
              <Link href="/vault">
                <DropdownMenuItem className="cursor-pointer">
                  <Archive className="mr-2 h-4 w-4" />
                  Vault
                </DropdownMenuItem>
              </Link>
              <Link href="/statistics">
                <DropdownMenuItem className="cursor-pointer">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Statistics
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <Users className="mr-2 h-4 w-4" />
                  Connection Settings
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <Link href="/connections/collaborators">
                    <DropdownMenuItem className="cursor-pointer">
                      <Users className="mr-2 h-4 w-4" />
                      Collaborators
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/connections/followers">
                    <DropdownMenuItem className="cursor-pointer">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Followers
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/connections/following">
                    <DropdownMenuItem className="cursor-pointer">
                      <UserCheck className="mr-2 h-4 w-4" />
                      Following
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/connections/muted">
                    <DropdownMenuItem className="cursor-pointer">
                      <VolumeX className="mr-2 h-4 w-4" />
                      Muted
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/connections/recent">
                    <DropdownMenuItem className="cursor-pointer">
                      <Clock className="mr-2 h-4 w-4" />
                      Recent
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/connections/bookmarks">
                    <DropdownMenuItem className="cursor-pointer">
                      <Bookmark className="mr-2 h-4 w-4" />
                      Bookmarks
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/connections/tagged">
                    <DropdownMenuItem className="cursor-pointer">
                      <Tag className="mr-2 h-4 w-4" />
                      Tagged
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/connections/restricted">
                    <DropdownMenuItem className="cursor-pointer">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Restricted
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/blocked">
                    <DropdownMenuItem className="cursor-pointer" data-testid="menu-blocked-users">
                      <ShieldOff className="mr-2 h-4 w-4" />
                      Blocked Users
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <Link href="/terms">
                <DropdownMenuItem className="cursor-pointer" data-testid="menu-terms">
                  <FileText className="mr-2 h-4 w-4" />
                  Terms of Service
                </DropdownMenuItem>
              </Link>
              <Link href="/help">
                <DropdownMenuItem className="cursor-pointer" data-testid="menu-help">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <Languages className="mr-2 h-4 w-4" />
                  Language
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      className="cursor-pointer"
                      onClick={() => setLanguage(lang.code)}
                    >
                      <span className="mr-2">{lang.flag}</span>
                      <span className="flex-1">{lang.nativeName}</span>
                      {language === lang.code && (
                        <span className="ml-2 text-primary">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => logout()}
                data-testid="menu-logout"
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
