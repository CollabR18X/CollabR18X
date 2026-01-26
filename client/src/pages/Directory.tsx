import { useProfiles, useMyProfile } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
import { CollabRequestModal } from "@/components/CollabRequestModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, ExternalLink, Instagram, Twitter, Youtube, ChevronDown, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const POPULAR_NICHES = [
  "Photography",
  "Videography",
  "Fashion",
  "Beauty",
  "Fitness",
  "Gaming",
  "Music",
  "Art",
  "Writing",
  "Cooking",
  "Travel",
  "Lifestyle",
  "Tech",
  "Business",
  "Education",
  "Comedy",
  "Dance",
  "Acting",
  "Modeling",
  "Influencer",
  "Podcast",
  "Streaming",
  "OnlyFans",
  "Fansly",
  "Patreon"
];

export default function Directory() {
  const { user } = useAuth();
  const { data: profiles, isLoading } = useProfiles();
  const { data: myProfile } = useMyProfile();
  const [search, setSearch] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);

  const filteredProfiles = profiles?.filter(p => {
    if (p.userId === user?.id) return false; // Don't show self
    const term = search.toLowerCase();
    const name = `${p.user.firstName} ${p.user.lastName}`.toLowerCase();
    const niche = (p.niche || "").toLowerCase();
    
    // If a niche is selected, filter by that niche
    if (selectedNiche) {
      return niche === selectedNiche.toLowerCase() && (name.includes(term) || niche.includes(term));
    }
    
    return name.includes(term) || niche.includes(term);
  });
  
  const handleNicheSelect = (niche: string) => {
    setSelectedNiche(niche === selectedNiche ? null : niche);
    if (niche !== selectedNiche) {
      setSearch(niche); // Auto-fill search with selected niche
    } else {
      setSearch(""); // Clear search if deselecting
    }
  };

  // Calculate recommendation score based on alignment
  const calculateRecommendationScore = (profile: typeof profiles[0]) => {
    if (!myProfile) return 0;
    
    let score = 0;
    
    // Same niche (high weight)
    if (myProfile.niche && profile.niche && 
        myProfile.niche.toLowerCase() === profile.niche.toLowerCase()) {
      score += 40;
    }
    
    // Shared interests
    const myInterests = Array.isArray(myProfile.interests) ? myProfile.interests : [];
    const theirInterests = Array.isArray(profile.interests) ? profile.interests : [];
    if (myInterests.length > 0 && theirInterests.length > 0) {
      const myInterestsSet = new Set(myInterests.map((i: string) => i.toLowerCase().trim()));
      const sharedInterests = theirInterests.filter((i: string) => 
        myInterestsSet.has(i.toLowerCase().trim())
      );
      score += (sharedInterests.length / Math.max(myInterests.length, theirInterests.length)) * 30;
    }
    
    // Same location
    if (myProfile.location && profile.location &&
        myProfile.location.toLowerCase().trim() === profile.location.toLowerCase().trim()) {
      score += 20;
    }
    
    // Similar looking for
    if (myProfile.lookingFor && profile.lookingFor &&
        myProfile.lookingFor.toLowerCase() === profile.lookingFor.toLowerCase()) {
      score += 10;
    }
    
    return score;
  };

  // Get recommended creators (only show when not searching)
  const recommendedCreators = useMemo(() => {
    if (!profiles || !myProfile || search || selectedNiche) return [];
    
    const scored = profiles
      .filter(p => p.userId !== user?.id) // Don't show self
      .map(profile => ({
        profile,
        score: calculateRecommendationScore(profile)
      }))
      .filter(item => item.score > 0) // Only show creators with some alignment
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, 6); // Top 6 recommendations
    
    return scored.map(item => item.profile);
  }, [profiles, myProfile, search, selectedNiche, user?.id]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Creator Directory</h1>
          <p className="text-muted-foreground mt-2">Discover talented creators to collaborate with.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or niche..." 
              className="pl-10 h-12 rounded-xl border-border focus:border-primary focus:ring-primary/20"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!e.target.value) setSelectedNiche(null); // Clear niche selection when search is cleared
              }}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-12 px-4 rounded-xl">
                <span className="hidden sm:inline">Niche</span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
              <div className="space-y-2">
                <div className="text-sm font-semibold mb-2">Popular Niches</div>
                <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                  {POPULAR_NICHES.map((niche) => (
                    <Badge
                      key={niche}
                      variant={selectedNiche === niche ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => handleNicheSelect(niche)}
                    >
                      {niche}
                    </Badge>
                  ))}
                </div>
                {selectedNiche && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      setSelectedNiche(null);
                      setSearch("");
                    }}
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Recommended Creators Section */}
      {!isLoading && recommendedCreators.length > 0 && !search && !selectedNiche && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl font-bold">Recommended Creators</h2>
          </div>
          <p className="text-muted-foreground text-sm">Creators that align with your interests and profile</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedCreators.map((profile) => (
              <Card key={profile.id} className="overflow-hidden border-border/50 hover:shadow-xl hover:border-primary/20 transition-all duration-300 group">
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
                    
                    {/* Show shared interests if available */}
                    {myProfile && Array.isArray(myProfile.interests) && Array.isArray(profile.interests) && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {profile.interests
                          .filter((interest: string) => 
                            myProfile.interests.some((mi: string) => 
                              mi.toLowerCase().trim() === interest.toLowerCase().trim()
                            )
                          )
                          .slice(0, 3)
                          .map((interest: string, idx: number) => (
                            <Badge 
                              key={idx} 
                              variant="secondary"
                              className="bg-primary/10 text-primary border-primary/20 text-xs"
                            >
                              {interest}
                            </Badge>
                          ))}
                      </div>
                    )}
                    
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
          </div>
        </div>
      )}

      {/* All Creators Section */}
      <div className="space-y-4">
        {!search && !selectedNiche && (
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">All Creators</h2>
          </div>
        )}
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
