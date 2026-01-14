import { useProfiles } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
import { CollabRequestModal } from "@/components/CollabRequestModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, ExternalLink, Instagram, Twitter, Youtube } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Directory() {
  const { user } = useAuth();
  const { data: profiles, isLoading } = useProfiles();
  const [search, setSearch] = useState("");

  const filteredProfiles = profiles?.filter(p => {
    if (p.userId === user?.id) return false; // Don't show self
    const term = search.toLowerCase();
    const name = `${p.user.firstName} ${p.user.lastName}`.toLowerCase();
    const niche = (p.niche || "").toLowerCase();
    return name.includes(term) || niche.includes(term);
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Creator Directory</h1>
          <p className="text-muted-foreground mt-2">Discover talented creators to collaborate with.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or niche..." 
            className="pl-10 h-12 rounded-xl border-border focus:border-primary focus:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-32 bg-muted animate-pulse" />
              <CardContent className="pt-0 relative">
                <Skeleton className="h-20 w-20 rounded-full border-4 border-card absolute -top-10 left-6" />
                <div className="mt-12 space-y-3">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles?.map((profile) => (
            <Card key={profile.id} className="overflow-hidden border-border/50 hover:shadow-xl hover:border-primary/20 transition-all duration-300 group">
              {/* Cover Image Placeholder - could be real if added to schema */}
              <div className="h-32 bg-gradient-to-r from-primary/10 to-accent/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              </div>
              
              <CardContent className="pt-0 relative">
                <div className="flex justify-between items-start">
                  <div className="absolute -top-10 left-6">
                    {profile.user.profileImageUrl ? (
                      <img 
                        src={profile.user.profileImageUrl} 
                        alt={profile.user.firstName || ""} 
                        className="h-20 w-20 rounded-full object-cover border-4 border-card shadow-sm"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold border-4 border-card shadow-sm">
                        {profile.user.firstName?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="ml-auto mt-4">
                    <CollabRequestModal 
                      receiverId={profile.userId}
                      receiverName={profile.user.firstName || "Creator"}
                      trigger={
                        <Button size="sm" className="rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all">
                          Connect
                        </Button>
                      }
                    />
                  </div>
                </div>

                <div className="mt-12">
                  <Link href={`/profile/${profile.id}`}>
                    <h3 className="font-display text-xl font-bold hover:text-primary cursor-pointer transition-colors">
                      {profile.user.firstName} {profile.user.lastName}
                    </h3>
                  </Link>
                  <p className="text-accent font-medium text-sm mb-3">{profile.niche || "General Creator"}</p>
                  
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-4 min-h-[60px]">
                    {profile.bio || "No bio yet."}
                  </p>

                  <div className="flex items-center gap-4 text-muted-foreground text-xs pt-4 border-t border-border/50">
                    {profile.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {profile.location}
                      </span>
                    )}
                    {profile.portfolioUrl && (
                      <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> Portfolio
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredProfiles?.length === 0 && (
            <div className="col-span-full text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground">No creators found</h3>
              <p className="text-muted-foreground mt-2">Try adjusting your search terms.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
