import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Users, Building, ArrowLeft, Search, Navigation, Loader2 } from "lucide-react";
import type { Profile, User } from "@shared/schema";

type ProfileWithUser = Profile & { user: User };
type LocationHub = { location: string; count: number; profiles: ProfileWithUser[] };
type NearbyProfile = Profile & { user: User; distance: number };

function HubsListView() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { data: myProfile } = useQuery<Profile>({
    queryKey: ["/api/profiles/me"],
  });

  const { data: hubs, isLoading: isLoadingHubs } = useQuery<LocationHub[]>({
    queryKey: ["/api/profiles/by-location"],
  });

  const { data: nearbyProfiles, isLoading: isLoadingNearby } = useQuery<NearbyProfile[]>({
    queryKey: ["/api/profiles/nearby", userLocation?.lat, userLocation?.lng, 50],
    enabled: !!userLocation,
    queryFn: async () => {
      const response = await fetch(
        `/api/profiles/nearby?lat=${userLocation!.lat}&lng=${userLocation!.lng}&maxDistance=50`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch nearby profiles");
      return response.json();
    },
  });

  useEffect(() => {
    if (myProfile?.latitude && myProfile?.longitude) {
      setUserLocation({ lat: myProfile.latitude, lng: myProfile.longitude });
    }
  }, [myProfile]);

  const getLocation = () => {
    if (!navigator.geolocation) return;
    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsGettingLocation(false);
      },
      () => {
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const filteredHubs = hubs?.filter(hub =>
    hub.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold flex items-center gap-3">
            <Building className="h-8 w-8 text-primary" />
            Local Creator Hubs
          </h1>
          <p className="text-muted-foreground mt-2">Connect with creators in your area and beyond.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            className="pl-10 h-12 rounded-xl border-border focus:border-primary focus:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-location"
          />
        </div>
      </div>

      {!userLocation && (
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Navigation className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Share your location</h3>
                <p className="text-sm text-muted-foreground">See creators within 50km of you</p>
              </div>
            </div>
            <Button
              onClick={getLocation}
              disabled={isGettingLocation}
              className="gap-2"
              data-testid="button-get-location"
            >
              {isGettingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              {isGettingLocation ? "Getting location..." : "Enable Location"}
            </Button>
          </CardContent>
        </Card>
      )}

      {userLocation && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Creators Near You</h2>
            <span className="text-sm text-muted-foreground">(within 50km)</span>
          </div>

          {isLoadingNearby ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : nearbyProfiles && nearbyProfiles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {nearbyProfiles.slice(0, 8).map((profile) => (
                <Card key={profile.id} className="hover-elevate transition-all" data-testid={`card-nearby-creator-${profile.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.user.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary text-white">
                          {profile.user.firstName?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${profile.id}`}>
                          <p className="font-medium truncate hover:text-primary cursor-pointer">
                            {profile.user.firstName} {profile.user.lastName}
                          </p>
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">{profile.niche || "Creator"}</p>
                        <p className="text-xs text-primary">{profile.distance} km away</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No creators found within 50km</p>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">All Location Hubs</h2>
        </div>

        {isLoadingHubs ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredHubs && filteredHubs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHubs.map((hub) => (
              <Link key={hub.location} href={`/community/hubs/${encodeURIComponent(hub.location)}`}>
                <Card className="hover-elevate cursor-pointer transition-all h-full" data-testid={`card-hub-${hub.location}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          {hub.location}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Users className="h-3 w-3" />
                          {hub.count} {hub.count === 1 ? "creator" : "creators"}
                        </p>
                      </div>
                      <div className="flex -space-x-2">
                        {hub.profiles.slice(0, 3).map((profile) => (
                          <Avatar key={profile.id} className="h-8 w-8 border-2 border-card">
                            <AvatarImage src={profile.user.profileImageUrl || undefined} />
                            <AvatarFallback className="bg-primary text-white text-xs">
                              {profile.user.firstName?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {hub.count > 3 && (
                          <div className="h-8 w-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs font-medium">
                            +{hub.count - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No location hubs yet</h3>
              <p className="text-muted-foreground">
                {search ? "No hubs match your search." : "Be the first to add your location to your profile!"}
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function LocationHubView({ location }: { location: string }) {
  const decodedLocation = decodeURIComponent(location);

  const { data: profiles, isLoading } = useQuery<ProfileWithUser[]>({
    queryKey: ["/api/profiles/by-location", location],
    queryFn: async () => {
      const response = await fetch(`/api/profiles/by-location/${encodeURIComponent(decodedLocation)}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch profiles");
      return response.json();
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 min-h-screen">
      <div className="space-y-4">
        <Link href="/community/hubs">
          <Button variant="ghost" className="gap-2" data-testid="button-back-to-hubs">
            <ArrowLeft className="h-4 w-4" />
            Back to Hubs
          </Button>
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold flex items-center gap-3">
              <MapPin className="h-8 w-8 text-primary" />
              {decodedLocation}
            </h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {isLoading ? "Loading..." : `${profiles?.length || 0} creators in this area`}
            </p>
          </div>
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
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : profiles && profiles.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <Card key={profile.id} className="overflow-hidden border-border/50 hover:shadow-xl hover:border-primary/20 transition-all duration-300" data-testid={`card-creator-${profile.id}`}>
              <div className="h-32 bg-gradient-to-r from-primary/10 to-accent/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              </div>

              <CardContent className="pt-0 relative">
                <div className="absolute -top-10 left-6">
                  <Avatar className="h-20 w-20 border-4 border-card shadow-sm">
                    <AvatarImage src={profile.user.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-primary text-white text-2xl">
                      {profile.user.firstName?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="mt-12">
                  <h3 className="font-display text-xl font-bold">
                    {profile.user.firstName} {profile.user.lastName}
                  </h3>
                  <p className="text-accent font-medium text-sm mb-4">{profile.niche || "General Creator"}</p>

                  <Link href={`/profile/${profile.id}`}>
                    <Button className="w-full" data-testid={`button-view-profile-${profile.id}`}>
                      View Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No creators in this location</h3>
            <p className="text-muted-foreground mb-4">Be the first to represent this area!</p>
            <Link href="/community/hubs">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Hubs
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function LocalHubs() {
  const params = useParams<{ location?: string }>();

  if (params.location) {
    return <LocationHubView location={params.location} />;
  }

  return <HubsListView />;
}
