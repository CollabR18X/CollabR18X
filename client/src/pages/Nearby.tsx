import { useState, useEffect, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FakeCall } from "@/components/FakeCall";
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
  RefreshCw,
  Timer,
  CheckCircle,
  PhoneIncoming,
  Clock,
  UserCheck,
  Bell,
  X
} from "lucide-react";
import type { Profile, User } from "@shared/schema";

type NearbyProfile = Profile & { user: User; distance: number };

interface Match {
  id: number;
  user1Id: string;
  user2Id: string;
  createdAt: string;
  user1: { id: string; firstName: string; lastName: string; profileImageUrl: string | null };
  user2: { id: string; firstName: string; lastName: string; profileImageUrl: string | null };
}

const DISTANCE_OPTIONS = [5, 10, 25, 50, 100];
const CHECK_IN_INTERVALS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
];

interface CheckInState {
  isActive: boolean;
  intervalMinutes: number;
  startTime: number | null;
  nextCheckInTime: number | null;
  missedCheckIn: boolean;
  trustedContacts: string[];
}

export default function Nearby() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [maxDistance, setMaxDistance] = useState(25);
  const [showLocation, setShowLocation] = useState(true);
  const [shareLiveLocation, setShareLiveLocation] = useState(false);
  
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [fakeCallerName, setFakeCallerName] = useState("Mom");
  
  const [checkIn, setCheckIn] = useState<CheckInState>({
    isActive: false,
    intervalMinutes: 30,
    startTime: null,
    nextCheckInTime: null,
    missedCheckIn: false,
    trustedContacts: [],
  });
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [selectedInterval, setSelectedInterval] = useState<string>("30");
  const [showTrustedContactsPicker, setShowTrustedContactsPicker] = useState(false);

  const { data: matches, isLoading: isLoadingMatches } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
    queryFn: async () => {
      const res = await fetch("/api/matches", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch matches");
      return res.json();
    },
  });

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

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (checkIn.isActive && checkIn.nextCheckInTime) {
      // Set timeRemaining immediately to avoid 1-second delay
      const now = Date.now();
      const remaining = Math.max(0, checkIn.nextCheckInTime - now);
      setTimeRemaining(remaining);
      
      interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, checkIn.nextCheckInTime! - now);
        setTimeRemaining(remaining);
        
        if (remaining === 0 && !checkIn.missedCheckIn) {
          setCheckIn(prev => ({ ...prev, missedCheckIn: true }));
          
          // Get the names of trusted contacts for the toast
          const contactNames = checkIn.trustedContacts
            .map(contactId => {
              const match = matches?.find(m => 
                (m.user1Id === contactId && m.user1) || (m.user2Id === contactId && m.user2)
              );
              if (match) {
                const otherUser = match.user1Id === contactId ? match.user1 : match.user2;
                return otherUser.firstName;
              }
              return null;
            })
            .filter(Boolean);
          
          const contactList = contactNames.length > 0 
            ? contactNames.join(", ")
            : "your trusted contacts";
          
          toast({
            title: "Check-in missed!",
            description: `${contactList} would be notified of the missed check-in.`,
            variant: "destructive",
          });
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [checkIn.isActive, checkIn.nextCheckInTime, checkIn.missedCheckIn, checkIn.trustedContacts, matches, toast]);

  const toggleTrustedContact = (contactId: string) => {
    setCheckIn(prev => {
      const isSelected = prev.trustedContacts.includes(contactId);
      return {
        ...prev,
        trustedContacts: isSelected 
          ? prev.trustedContacts.filter(id => id !== contactId)
          : [...prev.trustedContacts, contactId]
      };
    });
  };

  const getOtherUserFromMatch = (match: Match): { id: string; firstName: string; lastName: string; profileImageUrl: string | null } => {
    if (match.user1Id === user?.id) {
      return match.user2;
    }
    return match.user1;
  };

  const startCheckIn = useCallback(() => {
    const intervalMs = parseInt(selectedInterval) * 60 * 1000;
    const now = Date.now();
    
    setCheckIn({
      isActive: true,
      intervalMinutes: parseInt(selectedInterval),
      startTime: now,
      nextCheckInTime: now + intervalMs,
      missedCheckIn: false,
      trustedContacts: [],
    });
    
    setShowTrustedContactsPicker(false);
    
    toast({
      title: "Check-in started",
      description: `You'll need to check in every ${selectedInterval} minutes.`,
    });
  }, [selectedInterval, toast]);

  const confirmCheckIn = useCallback(() => {
    if (!checkIn.isActive) return;
    
    const intervalMs = checkIn.intervalMinutes * 60 * 1000;
    const now = Date.now();
    
    setCheckIn(prev => ({
      ...prev,
      nextCheckInTime: now + intervalMs,
      missedCheckIn: false,
    }));
    
    toast({
      title: "Check-in confirmed",
      description: "You're safe! Next check-in scheduled.",
    });
  }, [checkIn.isActive, checkIn.intervalMinutes, toast]);

  const endCheckIn = useCallback(() => {
    setCheckIn({
      isActive: false,
      intervalMinutes: 30,
      startTime: null,
      nextCheckInTime: null,
      missedCheckIn: false,
      trustedContacts: [],
    });
    setTimeRemaining(0);
    
    toast({
      title: "Check-in ended",
      description: "Your check-in session has been stopped.",
    });
  }, [toast]);

  const formatTimeRemaining = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

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
      <FakeCall 
        open={showFakeCall} 
        onOpenChange={setShowFakeCall} 
        callerName={fakeCallerName}
      />
      
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
                <Timer className="h-5 w-5" />
                Location Check-In
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!checkIn.isActive ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="check-in-interval" className="text-sm">Check-in interval</Label>
                    <Select value={selectedInterval} onValueChange={setSelectedInterval}>
                      <SelectTrigger id="check-in-interval" data-testid="select-check-in-interval">
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent>
                        {CHECK_IN_INTERVALS.map((interval) => (
                          <SelectItem 
                            key={interval.value} 
                            value={interval.value.toString()}
                            data-testid={`select-item-interval-${interval.value}`}
                          >
                            {interval.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Trusted contacts (optional)</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTrustedContactsPicker(!showTrustedContactsPicker)}
                        data-testid="button-toggle-trusted-contacts-picker"
                      >
                        {showTrustedContactsPicker ? "Hide" : "Add contacts"}
                      </Button>
                    </div>
                    
                    {showTrustedContactsPicker && (
                      <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                        {isLoadingMatches ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : matches && matches.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {matches.map((match) => {
                              const otherUser = getOtherUserFromMatch(match);
                              const isSelected = checkIn.trustedContacts.includes(otherUser.id);
                              return (
                                <div key={otherUser.id} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`trusted-contact-${otherUser.id}`}
                                    checked={isSelected}
                                    onCheckedChange={() => toggleTrustedContact(otherUser.id)}
                                    data-testid={`checkbox-trusted-contact-${otherUser.id}`}
                                  />
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={otherUser.profileImageUrl || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {otherUser.firstName?.[0] || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <label 
                                    htmlFor={`trusted-contact-${otherUser.id}`}
                                    className="text-sm font-medium cursor-pointer flex-1"
                                  >
                                    {otherUser.firstName} {otherUser.lastName}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            No matches yet. Start matching to add trusted contacts.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Start a timed check-in session. You'll be reminded to confirm you're safe at each interval.
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={startCheckIn}
                    data-testid="button-start-check-in"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Start Check-In
                  </Button>
                </>
              ) : (
                <>
                  {checkIn.missedCheckIn ? (
                    <div className="bg-destructive/10 border border-destructive/50 rounded-md p-4">
                      <div className="flex items-start gap-3">
                        <Bell className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0 animate-pulse" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-destructive">Check-in missed!</p>
                          {checkIn.trustedContacts.length > 0 ? (
                            <div className="mt-2 space-y-2">
                              <p className="text-xs text-muted-foreground">
                                These contacts would receive a notification:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {checkIn.trustedContacts.map(contactId => {
                                  const match = matches?.find(m => 
                                    (m.user1Id === contactId && m.user1) || (m.user2Id === contactId && m.user2)
                                  );
                                  if (!match) return null;
                                  const otherUser = match.user1Id === contactId ? match.user1 : match.user2;
                                  return (
                                    <div 
                                      key={contactId} 
                                      className="flex items-center gap-1 bg-destructive/20 rounded-full px-2 py-1 text-xs"
                                      data-testid={`badge-trusted-contact-notified-${contactId}`}
                                    >
                                      <Avatar className="h-4 w-4">
                                        <AvatarImage src={otherUser.profileImageUrl || undefined} />
                                        <AvatarFallback className="text-xs">
                                          {otherUser.firstName?.[0] || "U"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span>{otherUser.firstName}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-1">
                              No trusted contacts were selected. Consider adding contacts for future check-ins.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-primary/10 border border-primary/30 rounded-md p-4 text-center">
                      <div className="text-3xl font-mono font-bold text-primary" data-testid="text-check-in-timer">
                        {formatTimeRemaining(timeRemaining)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Time until next check-in
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserCheck className="h-4 w-4" />
                    <span>Checking in every {checkIn.intervalMinutes} minutes</span>
                  </div>
                  
                  {checkIn.trustedContacts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Trusted contacts:</p>
                      <div className="flex flex-wrap gap-2">
                        {checkIn.trustedContacts.map(contactId => {
                          const match = matches?.find(m => 
                            (m.user1Id === contactId && m.user1) || (m.user2Id === contactId && m.user2)
                          );
                          if (!match) return null;
                          const otherUser = match.user1Id === contactId ? match.user1 : match.user2;
                          return (
                            <div 
                              key={contactId} 
                              className="flex items-center gap-1 bg-primary/10 border border-primary/30 rounded-full px-2 py-1"
                              data-testid={`badge-selected-trusted-contact-${contactId}`}
                            >
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={otherUser.profileImageUrl || undefined} />
                                <AvatarFallback className="text-xs">
                                  {otherUser.firstName?.[0] || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs">{otherUser.firstName}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      onClick={confirmCheckIn}
                      disabled={checkIn.missedCheckIn}
                      data-testid="button-confirm-check-in"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      I'm Safe
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={endCheckIn}
                      data-testid="button-end-check-in"
                    >
                      End
                    </Button>
                  </div>
                </>
              )}
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

              <div className="border-t pt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="fake-caller-name" className="text-xs text-muted-foreground">
                    Fake caller name
                  </Label>
                  <Input
                    id="fake-caller-name"
                    value={fakeCallerName}
                    onChange={(e) => setFakeCallerName(e.target.value)}
                    placeholder="Mom"
                    className="h-9"
                    data-testid="input-fake-caller-name"
                  />
                </div>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setShowFakeCall(true)}
                  data-testid="button-fake-call"
                >
                  <PhoneIncoming className="h-4 w-4 mr-2" />
                  Fake Emergency Call
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Simulate an incoming call to exit uncomfortable situations
                </p>
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
