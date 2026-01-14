import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  MapPin, 
  Navigation, 
  Loader2, 
  AlertTriangle, 
  Shield, 
  Phone, 
  Eye, 
  EyeOff,
  Users,
  RefreshCw
} from "lucide-react";
import type { Profile, User } from "@shared/schema";

type NearbyProfile = Profile & { user: User; distance: number };

const DISTANCE_OPTIONS = [5, 10, 25, 50, 100];

export default function Nearby() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [maxDistance, setMaxDistance] = useState(25);
  const [showLocation, setShowLocation] = useState(true);
  const [shareLiveLocation, setShareLiveLocation] = useState(false);

  const { data: nearbyProfiles, isLoading: isLoadingNearby, refetch } = useQuery<NearbyProfile[]>({
    queryKey: ["/api/profiles/nearby", location?.lat, location?.lng, maxDistance],
    enabled: !!location,
    queryFn: async () => {
      const response = await fetch(
        `/api/profiles/nearby?lat=${location!.lat}&lng=${location!.lng}&maxDistance=${maxDistance}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch nearby profiles");
      return response.json();
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (coords: { latitude: number; longitude: number }) => {
      return apiRequest("PUT", "/api/profiles/location", coords);
    },
    onSuccess: () => {
      toast({
        title: "Location updated",
        description: "Your location has been saved to your profile.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/me"] });
    },
    onError: () => {
      toast({
        title: "Failed to update location",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const getLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(coords);
        setIsGettingLocation(false);
        updateLocationMutation.mutate({
          latitude: coords.lat,
          longitude: coords.lng,
        });
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError("Location access denied. Please enable location permissions.");
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError("Location information unavailable.");
            break;
          case error.TIMEOUT:
            setGeoError("Location request timed out.");
            break;
          default:
            setGeoError("An error occurred while getting your location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  useEffect(() => {
    if (location) {
      refetch();
    }
  }, [maxDistance, location, refetch]);

  const getDistanceLabel = (value: number) => {
    const index = DISTANCE_OPTIONS.indexOf(value);
    if (index !== -1) return `${value} km`;
    const closest = DISTANCE_OPTIONS.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
    return `${closest} km`;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold flex items-center gap-3">
            <MapPin className="h-8 w-8 text-primary" />
            Nearby Users
          </h1>
          <p className="text-muted-foreground mt-2">
            Discover creators near your location
          </p>
        </div>
        <Button
          onClick={getLocation}
          disabled={isGettingLocation || updateLocationMutation.isPending}
          data-testid="button-get-location"
        >
          {isGettingLocation || updateLocationMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4 mr-2" />
          )}
          {location ? "Update Location" : "Share My Location"}
        </Button>
      </div>

      {geoError && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">{geoError}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {!location && !geoError && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <MapPin className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Enable Location</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Share your location to discover nearby creators and allow others to find you.
                </p>
                <Button onClick={getLocation} disabled={isGettingLocation} data-testid="button-enable-location">
                  {isGettingLocation ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4 mr-2" />
                  )}
                  Enable Location
                </Button>
              </CardContent>
            </Card>
          )}

          {location && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {isLoadingNearby ? "Loading..." : `${nearbyProfiles?.length || 0} users within ${maxDistance} km`}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoadingNearby}
                  data-testid="button-refresh-nearby"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingNearby ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {isLoadingNearby ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-16 w-16 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : nearbyProfiles && nearbyProfiles.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {nearbyProfiles.map((profile) => (
                    <Card key={profile.id} className="hover-elevate" data-testid={`card-nearby-user-${profile.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={profile.user.profileImageUrl || undefined} />
                            <AvatarFallback className="text-lg">
                              {profile.user.firstName?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">
                              {profile.user.firstName} {profile.user.lastName}
                            </h3>
                            <div className="flex items-center gap-1 text-sm text-primary">
                              <MapPin className="h-3 w-3" />
                              <span data-testid={`text-distance-${profile.id}`}>{profile.distance} km away</span>
                            </div>
                            {profile.niche && (
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {profile.niche}
                              </p>
                            )}
                          </div>
                          <Link href={`/profile/${profile.id}`}>
                            <Button size="sm" variant="outline" data-testid={`button-view-profile-${profile.id}`}>
                              View
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="font-semibold mb-2">No Users Nearby</h3>
                    <p className="text-muted-foreground text-sm max-w-sm">
                      No creators found within {maxDistance} km. Try increasing your search radius.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Distance Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Maximum distance</span>
                  <span className="text-sm font-medium">{maxDistance} km</span>
                </div>
                <Slider
                  value={[maxDistance]}
                  onValueChange={(value) => setMaxDistance(value[0])}
                  min={5}
                  max={100}
                  step={5}
                  disabled={!location}
                  data-testid="slider-max-distance"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>5 km</span>
                  <span>100 km</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {DISTANCE_OPTIONS.map((dist) => (
                  <Button
                    key={dist}
                    size="sm"
                    variant={maxDistance === dist ? "default" : "outline"}
                    onClick={() => setMaxDistance(dist)}
                    disabled={!location}
                    data-testid={`button-distance-${dist}`}
                  >
                    {dist} km
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Safety Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Share Live Location</p>
                    <p className="text-xs text-muted-foreground">With trusted matches only</p>
                  </div>
                </div>
                <Switch
                  checked={shareLiveLocation}
                  onCheckedChange={setShareLiveLocation}
                  data-testid="switch-share-live-location"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {showLocation ? (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Show Last Location</p>
                    <p className="text-xs text-muted-foreground">Let others see when you were last active</p>
                  </div>
                </div>
                <Switch
                  checked={showLocation}
                  onCheckedChange={setShowLocation}
                  data-testid="switch-show-location"
                />
              </div>

              <div className="border-t pt-4">
                <Button variant="outline" className="w-full" data-testid="button-emergency-contact">
                  <Phone className="h-4 w-4 mr-2" />
                  Emergency Contact
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Set up emergency contacts for quick access
                </p>
              </div>
            </CardContent>
          </Card>

          {location && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Your coordinates:</span>
                </div>
                <p className="text-xs font-mono mt-1" data-testid="text-user-coordinates">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
