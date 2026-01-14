import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, MapPin, Sparkles, UserX } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import type { Profile } from "@shared/schema";
import type { User } from "@shared/schema";

type SimilarProfile = Profile & { user: User; sharedInterests: string[]; sharedCount: number };

export default function SimilarInterests() {
  const { user } = useAuth();
  const [minShared, setMinShared] = useState("1");

  const { data: profiles, isLoading } = useQuery<SimilarProfile[]>({
    queryKey: ["/api/profiles/similar-interests"],
  });

  const { data: myProfile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ["/api/profiles/me"],
  });

  const hasNoInterests = !myProfile?.interests || myProfile.interests.length === 0;

  const filteredProfiles = profiles?.filter(p => p.sharedCount >= parseInt(minShared));

  const maxSharedCount = profiles?.length ? Math.max(...profiles.map(p => p.sharedCount)) : 1;
  const filterOptions = Array.from({ length: Math.min(maxSharedCount, 10) }, (_, i) => i + 1);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold flex items-center gap-3">
            <Heart className="h-8 w-8 text-primary" />
            Similar Interests
          </h1>
          <p className="text-muted-foreground mt-2">Find creators who share your passions.</p>
        </div>
        {!hasNoInterests && profiles && profiles.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Min shared:</span>
            <Select value={minShared} onValueChange={setMinShared}>
              <SelectTrigger className="w-24" data-testid="select-min-shared">
                <SelectValue placeholder="1+" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((num) => (
                  <SelectItem key={num} value={num.toString()} data-testid={`option-min-${num}`}>
                    {num}+
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {profileLoading ? (
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
      ) : hasNoInterests ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No interests set yet</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Add some interests to your profile to find creators who share your passions.
          </p>
          <Link href="/profile/me">
            <Button className="mt-6" data-testid="button-edit-profile">
              Edit My Profile
            </Button>
          </Link>
        </div>
      ) : isLoading ? (
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
      ) : filteredProfiles && filteredProfiles.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <Card 
              key={profile.id} 
              className="overflow-hidden border-border/50 hover:shadow-xl hover:border-primary/20 transition-all duration-300 group"
              data-testid={`card-profile-${profile.id}`}
            >
              <div className="h-32 bg-gradient-to-r from-primary/10 to-accent/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-primary-foreground">
                    {profile.sharedCount} shared
                  </Badge>
                </div>
              </div>
              
              <CardContent className="pt-0 relative">
                <div className="flex justify-between items-start">
                  <div className="absolute -top-10 left-6">
                    {profile.user.profileImageUrl ? (
                      <img 
                        src={profile.user.profileImageUrl} 
                        alt={profile.user.firstName || ""} 
                        className="h-20 w-20 rounded-full object-cover border-4 border-card shadow-sm"
                        data-testid={`img-avatar-${profile.id}`}
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold border-4 border-card shadow-sm">
                        {profile.user.firstName?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="ml-auto mt-4">
                    <Link href={`/profile/${profile.id}`}>
                      <Button 
                        size="sm" 
                        className="rounded-full"
                        data-testid={`button-view-profile-${profile.id}`}
                      >
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="mt-12">
                  <Link href={`/profile/${profile.id}`}>
                    <h3 
                      className="font-display text-xl font-bold hover:text-primary cursor-pointer transition-colors"
                      data-testid={`text-name-${profile.id}`}
                    >
                      {profile.user.firstName} {profile.user.lastName}
                    </h3>
                  </Link>
                  <p className="text-accent font-medium text-sm mb-3">{profile.niche || "General Creator"}</p>
                  
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {profile.sharedInterests.slice(0, 5).map((interest, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20"
                        data-testid={`badge-interest-${profile.id}-${idx}`}
                      >
                        {interest}
                      </Badge>
                    ))}
                    {profile.sharedInterests.length > 5 && (
                      <Badge variant="outline" className="text-muted-foreground">
                        +{profile.sharedInterests.length - 5} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-muted-foreground text-xs pt-4 border-t border-border/50">
                    {profile.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {profile.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3 text-primary" /> 
                      {profile.sharedCount} interest{profile.sharedCount !== 1 ? "s" : ""} in common
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <UserX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No similar creators found</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            {parseInt(minShared) > 1 
              ? "Try lowering the minimum shared interests filter."
              : "No other creators share your interests yet. Check back later!"}
          </p>
        </div>
      )}
    </div>
  );
}
