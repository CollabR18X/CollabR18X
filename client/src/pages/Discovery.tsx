import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Heart,
  X,
  Bookmark,
  Grid3X3,
  MapPin,
  Filter,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Instagram,
  Twitter,
  Youtube
} from "lucide-react";
import type { Profile, User } from "@shared/schema";

type ProfileWithUser = Profile & { user: User; matchScore: number };

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "experienced", label: "Experienced" },
  { value: "professional", label: "Professional" },
];

const AVAILABILITY_OPTIONS = [
  { value: "available_now", label: "Available Now" },
  { value: "busy_this_week", label: "Busy This Week" },
  { value: "available_next_month", label: "Available Next Month" },
  { value: "limited", label: "Limited Availability" },
];

const TRAVEL_MODE_OPTIONS = [
  { value: "local_only", label: "Local Only" },
  { value: "willing_to_travel", label: "Willing to Travel" },
  { value: "remote_only", label: "Remote Only" },
];

const MONETIZATION_OPTIONS = [
  { value: "free_collab", label: "Free Collab" },
  { value: "paid_only", label: "Paid Only" },
  { value: "negotiable", label: "Negotiable" },
  { value: "exposure_trade", label: "Exposure Trade" },
];

interface Filters {
  maxDistance: number;
  contentType: string;
  experienceLevel: string[];
  availability: string[];
  travelMode: string[];
  monetization: string[];
}

function ProfileCard({
  profile,
  onLike,
  onSave,
  onPass,
  isPending,
}: {
  profile: ProfileWithUser;
  onLike: () => void;
  onSave: () => void;
  onPass: () => void;
  isPending: boolean;
}) {
  return (
    <Card className="overflow-hidden border-border/50 hover:shadow-xl hover:border-primary/20 transition-all duration-300 group">
      <div className="h-48 bg-gradient-to-r from-primary/10 to-accent/10 relative overflow-hidden">
        {profile.photos && profile.photos.length > 0 ? (
          <img
            src={profile.photos[0]}
            alt={profile.user.firstName || "Profile"}
            className="w-full h-full object-cover"
          />
        ) : profile.user.profileImageUrl ? (
          <img
            src={profile.user.profileImageUrl}
            alt={profile.user.firstName || "Profile"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-primary/30">
              {profile.user.firstName?.[0] || "?"}
            </span>
          </div>
        )}
        {profile.matchScore > 0 && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-primary/90 text-white text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              {profile.matchScore}%
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="pt-4 space-y-3">
        <div>
          <Link href={`/profile/${profile.id}`}>
            <h3 className="font-display text-lg font-bold hover:text-primary cursor-pointer transition-colors">
              {profile.user.firstName} {profile.user.lastName}
            </h3>
          </Link>
          <p className="text-accent font-medium text-sm">{profile.niche || "Creator"}</p>
        </div>

        {profile.location && (
          <p className="text-muted-foreground text-sm flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            {profile.location}
          </p>
        )}

        {profile.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {profile.experienceLevel && (
            <Badge variant="secondary" className="text-xs">
              {EXPERIENCE_LEVELS.find(e => e.value === profile.experienceLevel)?.label || profile.experienceLevel}
            </Badge>
          )}
          {profile.availability && (
            <Badge variant="outline" className="text-xs">
              {AVAILABILITY_OPTIONS.find(a => a.value === profile.availability)?.label || profile.availability}
            </Badge>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={onPass}
            disabled={isPending}
            data-testid={`button-pass-${profile.id}`}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={onSave}
            disabled={isPending}
            data-testid={`button-save-${profile.id}`}
          >
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={onLike}
            disabled={isPending}
            data-testid={`button-interested-${profile.id}`}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterPanel({
  filters,
  setFilters,
  onApply,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onApply: () => void;
}) {
  const toggleArrayFilter = (
    key: keyof Pick<Filters, "experienceLevel" | "availability" | "travelMode" | "monetization">,
    value: string
  ) => {
    setFilters(prev => {
      const arr = prev[key];
      if (arr.includes(value)) {
        return { ...prev, [key]: arr.filter(v => v !== value) };
      } else {
        return { ...prev, [key]: [...arr, value] };
      }
    });
  };

  return (
    <div className="space-y-6 p-1">
      <div className="space-y-3">
        <Label>Max Distance: {filters.maxDistance}km</Label>
        <Slider
          value={[filters.maxDistance]}
          onValueChange={([v]) => setFilters(prev => ({ ...prev, maxDistance: v }))}
          min={5}
          max={500}
          step={5}
          data-testid="slider-distance"
        />
      </div>

      <div className="space-y-2">
        <Label>Content Type</Label>
        <Select
          value={filters.contentType || "all"}
          onValueChange={v => setFilters(prev => ({ ...prev, contentType: v === "all" ? "" : v }))}
        >
          <SelectTrigger data-testid="select-content-type">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="photography">Photography</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="modeling">Modeling</SelectItem>
            <SelectItem value="influencer">Influencer</SelectItem>
            <SelectItem value="music">Music</SelectItem>
            <SelectItem value="art">Art</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Experience Level</Label>
        <div className="grid grid-cols-2 gap-2">
          {EXPERIENCE_LEVELS.map(level => (
            <div key={level.value} className="flex items-center space-x-2">
              <Checkbox
                id={`exp-${level.value}`}
                checked={filters.experienceLevel.includes(level.value)}
                onCheckedChange={() => toggleArrayFilter("experienceLevel", level.value)}
                data-testid={`checkbox-exp-${level.value}`}
              />
              <Label htmlFor={`exp-${level.value}`} className="text-sm cursor-pointer">
                {level.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Availability</Label>
        <div className="space-y-2">
          {AVAILABILITY_OPTIONS.map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`avail-${option.value}`}
                checked={filters.availability.includes(option.value)}
                onCheckedChange={() => toggleArrayFilter("availability", option.value)}
                data-testid={`checkbox-avail-${option.value}`}
              />
              <Label htmlFor={`avail-${option.value}`} className="text-sm cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Travel Mode</Label>
        <div className="space-y-2">
          {TRAVEL_MODE_OPTIONS.map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`travel-${option.value}`}
                checked={filters.travelMode.includes(option.value)}
                onCheckedChange={() => toggleArrayFilter("travelMode", option.value)}
                data-testid={`checkbox-travel-${option.value}`}
              />
              <Label htmlFor={`travel-${option.value}`} className="text-sm cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Monetization</Label>
        <div className="space-y-2">
          {MONETIZATION_OPTIONS.map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`money-${option.value}`}
                checked={filters.monetization.includes(option.value)}
                onCheckedChange={() => toggleArrayFilter("monetization", option.value)}
                data-testid={`checkbox-money-${option.value}`}
              />
              <Label htmlFor={`money-${option.value}`} className="text-sm cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={onApply} className="w-full" data-testid="button-apply-filters">
        Apply Filters
      </Button>
    </div>
  );
}

export default function Discovery() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [passedIds, setPassedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Filters>({
    maxDistance: 100,
    contentType: "",
    experienceLevel: [],
    availability: [],
    travelMode: [],
    monetization: [],
  });
  const [appliedFilters, setAppliedFilters] = useState<Filters>(filters);

  const buildQueryString = (f: Filters) => {
    const params = new URLSearchParams();
    if (f.maxDistance) params.set("maxDistance", f.maxDistance.toString());
    if (f.contentType) params.set("contentType", f.contentType);
    if (f.experienceLevel.length) params.set("experienceLevel", f.experienceLevel.join(","));
    if (f.availability.length) params.set("availability", f.availability.join(","));
    if (f.travelMode.length) params.set("travelMode", f.travelMode.join(","));
    if (f.monetization.length) params.set("monetization", f.monetization.join(","));
    return params.toString();
  };

  const { data: profiles, isLoading, refetch } = useQuery<ProfileWithUser[]>({
    queryKey: ["/api/profiles/discover", appliedFilters],
    queryFn: async () => {
      const qs = buildQueryString(appliedFilters);
      const res = await fetch(`/api/profiles/discover${qs ? `?${qs}` : ""}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch profiles");
      return res.json();
    },
  });

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    return profiles.filter(p => !passedIds.has(p.userId));
  }, [profiles, passedIds]);

  const likeMutation = useMutation({
    mutationFn: async (likedId: string) => {
      const res = await apiRequest("POST", "/api/likes", { likedId });
      return res.json();
    },
    onSuccess: (data, likedId) => {
      if (data.match) {
        const profile = filteredProfiles.find(p => p.userId === likedId);
        if (profile) {
          setMatchedUser(profile.user);
          setShowMatchPopup(true);
        }
        queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      } else {
        toast({
          title: "Interest Sent",
          description: "They'll be notified if mutual!",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/discover"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send interest",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (savedUserId: string) => {
      const res = await apiRequest("POST", `/api/profiles/${savedUserId}/save`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Saved",
        description: "You can find this profile in your saved list.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/saved"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    },
  });

  const passMutation = useMutation({
    mutationFn: async (passedId: string) => {
      const res = await apiRequest("POST", "/api/likes/pass", { passedId });
      return res.json();
    },
    onSuccess: () => {},
  });


  const handleLike = (userId: string) => {
    likeMutation.mutate(userId);
    setPassedIds(prev => new Set([...prev, userId]));
  };

  const handleSave = (userId: string) => {
    saveMutation.mutate(userId);
  };

  const handlePass = (userId: string) => {
    passMutation.mutate(userId);
    setPassedIds(prev => new Set([...prev, userId]));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setPassedIds(new Set());
  };

  const isPending = likeMutation.isPending || saveMutation.isPending || passMutation.isPending;

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold">Discover Creators</h1>
          <p className="text-muted-foreground mt-2">
            Find your next collaboration partner
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" data-testid="button-open-filters">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filter Profiles</SheetTitle>
              </SheetHeader>
              <FilterPanel
                filters={filters}
                setFilters={setFilters}
                onApply={handleApplyFilters}
              />
            </SheetContent>
          </Sheet>

        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="w-full h-[400px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProfiles.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <Sparkles className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Profiles Found</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Try adjusting your filters to see more creators.
              </p>
              <Button onClick={() => { setPassedIds(new Set()); refetch(); }} data-testid="button-refresh-browse">
                Refresh
              </Button>
            </div>
          ) : (
            filteredProfiles.map(profile => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onLike={() => handleLike(profile.userId)}
                onSave={() => handleSave(profile.userId)}
                onPass={() => handlePass(profile.userId)}
                isPending={isPending}
              />
            ))
          )}
        </div>
      )}

      <Dialog open={showMatchPopup} onOpenChange={setShowMatchPopup}>
        <DialogContent className="text-center max-w-sm">
          <div className="py-6">
            <div className="relative mx-auto w-24 h-24 mb-4">
              <div className="absolute inset-0">
                {matchedUser?.profileImageUrl ? (
                  <img
                    src={matchedUser.profileImageUrl}
                    alt={matchedUser.firstName || "Match"}
                    className="w-full h-full rounded-full object-cover border-4 border-primary"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold border-4 border-primary">
                    {matchedUser?.firstName?.[0] || "?"}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">It's a Match!</h2>
              <p className="text-muted-foreground mb-6">
                You and {matchedUser?.firstName} are both interested in collaborating!
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setShowMatchPopup(false)} data-testid="button-keep-discovering">
                  Keep Discovering
                </Button>
                <Link href="/chat">
                  <Button data-testid="button-send-message">
                    Send Message
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
