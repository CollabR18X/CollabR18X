import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProfile, useLikeProfile, useMyProfile } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
import { useBlockUser } from "@/hooks/use-blocks";
import { useToast } from "@/hooks/use-toast";
import { CollabRequestModal } from "@/components/CollabRequestModal";
import { ConsentDialog, useConsentCheck } from "@/components/ConsentDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link, useRoute, useLocation } from "wouter";
import { ArrowLeft, MapPin, Globe, Instagram, Twitter, Youtube, ExternalLink, ShieldBan, Loader2, Briefcase, GraduationCap, Ruler, Calendar, Shield, Lock, AlertTriangle, CheckCircle, Heart, Star, Music2, PlayCircle, MessageCircle, Image as ImageIcon, CreditCard, Share2, Copy, Check, Mail, Linkedin, Pencil, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function Profile() {
  const [, params] = useRoute("/profile/:id");
  const [, meParams] = useRoute("/profile/me");
  const { user } = useAuth();
  const isMeRoute = !!meParams;
  const id = isMeRoute ? null : parseInt(params?.id || "0");
  const { data: profileFromHook, isLoading, error } = useProfile(isMeRoute ? 0 : (id || 0));
  const { data: myProfile, isLoading: isLoadingMyProfile } = useMyProfile();
  
  // Use myProfile if on /profile/me route, otherwise use profileFromHook
  const profile = isMeRoute ? myProfile : profileFromHook;
  const isLoadingProfile = isMeRoute ? isLoadingMyProfile : isLoading;
  const { mutate: blockUser, isPending: isBlocking } = useBlockUser();
  const { mutate: likeProfile, isPending: isLiking } = useLikeProfile();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);
  const [pendingLikeType, setPendingLikeType] = useState<'like' | 'superlike' | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [editingDisplayName, setEditingDisplayName] = useState("");
  const [isSavingDisplayName, setIsSavingDisplayName] = useState(false);
  const queryClient = useQueryClient();

  if (isLoadingProfile) return <ProfileSkeleton />;
  
  // Handle error cases
  if (!isMeRoute && error) return <ProfileSkeleton />;
  
  // For own profile route, if no profile exists, show a message to create one
  if (isMeRoute && !myProfile && !isLoadingMyProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Profile Found</h2>
          <p className="text-muted-foreground mb-6">You haven't created your profile yet.</p>
          <Link href="/profile/me/edit">
            <Button>Create Profile</Button>
          </Link>
        </Card>
      </div>
    );
  }
  
  // If profile doesn't exist and not loading, show skeleton
  if (!profile) return <ProfileSkeleton />;

  // Normalize profile data - myProfile might not have user nested
  // If we're on the me route, use myProfile and merge with current user data
  // This ensures we get the latest user data including display_name
  // Priority: myProfile.user.displayName > user.displayName > fallback
  const profileData = isMeRoute && myProfile 
    ? { 
        ...myProfile, 
        user: { 
          ...user!, 
          displayName: myProfile.user?.displayName || user?.displayName || "" 
        } 
      } 
    : profile;

  // Fetch user posts
  const userIdToFetch = isMeRoute ? user?.id : profileData?.userId;
  const { data: userPosts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ["/api/posts/user", userIdToFetch],
    queryFn: async () => {
      if (!userIdToFetch) return [];
      const res = await fetch(`/api/posts/user/${userIdToFetch}`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userIdToFetch,
  });
  const userPostsCount = userPosts?.length || 0;
  
  // Get profile URL for sharing
  const profileUrl = isMeRoute 
    ? `${window.location.origin}/profile/me`
    : id 
    ? `${window.location.origin}/profile/${id}`
    : "";

  // Update display name mutation
  const updateDisplayNameMutation = useMutation({
    mutationFn: async (displayName: string) => {
      const response = await fetch("/api/profiles/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to update display name");
      }
      return response.json();
    },
    onSuccess: async (data) => {
      // Update the query cache immediately with the new data
      if (isMeRoute) {
        queryClient.setQueryData(["/api/profiles/me"], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            user: {
              ...oldData.user,
              displayName: data.user?.displayName || editingDisplayName.trim(),
            },
          };
        });
      }
      // Also update the auth user query cache
      queryClient.setQueryData(["/api/auth/user"], (oldUser: any) => {
        if (!oldUser) return oldUser;
        return {
          ...oldUser,
          displayName: data.user?.displayName || editingDisplayName.trim(),
        };
      });
      // Invalidate and refetch profile queries to ensure consistency
      await queryClient.invalidateQueries({ queryKey: ["/api/profiles/me"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/profiles", id] });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Refetch the profile data
      if (isMeRoute) {
        await queryClient.refetchQueries({ queryKey: ["/api/profiles/me"] });
      } else {
        await queryClient.refetchQueries({ queryKey: ["/api/profiles", id] });
      }
      setIsEditingDisplayName(false);
      toast({
        title: "Display name updated",
        description: "Your display name has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update display name",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveDisplayName = () => {
    if (editingDisplayName.trim() === (profileData.user?.displayName || "")) {
      setIsEditingDisplayName(false);
      return;
    }
    setIsSavingDisplayName(true);
    updateDisplayNameMutation.mutate(editingDisplayName.trim(), {
      onSettled: () => {
        setIsSavingDisplayName(false);
      },
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Profile link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (platform: string) => {
    const text = `Check out ${profileData.user?.firstName || "this creator"}'s profile on CollabR18X!`;
    const url = profileUrl;
    
    let shareUrl = "";
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`;
        break;
      default:
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };
  
  const hasConsent = useConsentCheck(profileData?.userId || '');

  const handleBlock = () => {
    if (profileData?.userId) {
      blockUser(profileData.userId, {
        onSuccess: () => setLocation("/blocked")
      });
    }
  };

  const handleLikeClick = (isSuperLike: boolean) => {
    if (!profileData?.userId) return;
    
    if (hasConsent) {
      likeProfile({ likedId: profileData.userId, isSuperLike });
    } else {
      setPendingLikeType(isSuperLike ? 'superlike' : 'like');
      setConsentDialogOpen(true);
    }
  };

  const handleConsentConfirm = () => {
    if (profileData?.userId && pendingLikeType) {
      likeProfile({ likedId: profileData.userId, isSuperLike: pendingLikeType === 'superlike' });
      setPendingLikeType(null);
    }
  };

  const handleConsentCancel = () => {
    setPendingLikeType(null);
  };
  const isOwnProfile = isMeRoute || user?.id === profileData.userId;
  const socials = profileData.socialLinks as any || {};
  const privacy = profileData.privacySettings as any || {};
  
  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };
  
  // When viewing own profile, always show all details regardless of privacy settings
  const showLocation = isOwnProfile ? true : (privacy.showLocation !== false);
  const showAge = isOwnProfile ? true : (privacy.showAge !== false);
  const showBirthDate = isOwnProfile ? true : (privacy.showBirthDate === true);
  const showOccupation = isOwnProfile ? true : (privacy.showOccupation !== false);
  const showEducation = isOwnProfile ? true : (privacy.showEducation !== false);
  const showHeight = isOwnProfile ? true : (privacy.showHeight !== false);
  const boundaries = profileData.boundaries as {
    contentTypes?: string[];
    communicationPrefs?: string[];
    collaborationTypes?: string[];
    dealBreakers?: string[];
    safetyRequirements?: string[];
  } || {};
  const hasBoundaries = boundaries.contentTypes?.length || boundaries.communicationPrefs?.length || 
    boundaries.collaborationTypes?.length || boundaries.dealBreakers?.length || boundaries.safetyRequirements?.length;

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header Banner */}
      <div className="h-64 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 relative">
        <Link href="/directory">
          <Button variant="ghost" className="absolute top-6 left-6 text-foreground/80 hover:text-foreground hover:bg-white/50 backdrop-blur-sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory
          </Button>
        </Link>
      </div>

      <div className="container mx-auto px-4 -mt-24 relative">
        <div className="bg-card rounded-3xl shadow-xl border border-border overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              {/* Avatar Section */}
              <div className="flex flex-col md:flex-row gap-6 items-end -mt-4">
                <div className="relative flex flex-col items-center md:items-start">
                  {profileData.user?.profileImageUrl ? (
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-card shadow-lg overflow-hidden">
                      <img 
                        src={profileData.user.profileImageUrl} 
                        alt={profileData.user?.firstName || ""} 
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-card bg-primary text-white flex items-center justify-center text-4xl font-bold shadow-lg aspect-square">
                      {profileData.user?.firstName?.[0] || "?"}
                    </div>
                  )}
                  {isOwnProfile && (
                    <>
                      <div className="mt-4 flex gap-2 w-full md:w-auto">
                        <Link href="/profile/me/edit">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 md:flex-none"
                          >
                            Edit Profile
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex-1 md:flex-none"
                            >
                              <Share2 className="h-4 w-4 mr-2" />
                              Share Profile
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                              {copied ? (
                                <>
                                  <Check className="h-4 w-4 mr-2 text-green-500" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy Link
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleShare("twitter")} 
                              className="cursor-pointer"
                            >
                              <Twitter className="h-4 w-4 mr-2" />
                              Share on Twitter
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleShare("facebook")} 
                              className="cursor-pointer"
                            >
                              <Globe className="h-4 w-4 mr-2" />
                              Share on Facebook
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleShare("linkedin")} 
                              className="cursor-pointer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Share on LinkedIn
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleShare("whatsapp")} 
                              className="cursor-pointer"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Share on WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleShare("email")} 
                              className="cursor-pointer"
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Share via Email
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-4 text-center md:text-left">
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {userPostsCount ?? 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Posts</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">0</div>
                          <div className="text-xs text-muted-foreground">Followers</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">0</div>
                          <div className="text-xs text-muted-foreground">Following</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">0</div>
                          <div className="text-xs text-muted-foreground">Friends</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="mb-2 text-center md:text-left">
                  {isOwnProfile && isEditingDisplayName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingDisplayName}
                        onChange={(e) => setEditingDisplayName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveDisplayName();
                          } else if (e.key === 'Escape') {
                            setIsEditingDisplayName(false);
                            setEditingDisplayName(profileData.user?.displayName || "");
                          }
                        }}
                        className="text-3xl font-bold font-display max-w-md"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSaveDisplayName}
                        disabled={isSavingDisplayName}
                      >
                        {isSavingDisplayName ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsEditingDisplayName(false);
                          setEditingDisplayName(profileData.user?.displayName || "");
                        }}
                        disabled={isSavingDisplayName}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <h1 className="font-display text-3xl font-bold">
                        {profileData.user?.displayName || `${profileData.user?.firstName || ""} ${profileData.user?.lastName || ""}`.trim() || "User"}
                      </h1>
                      {isOwnProfile && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setIsEditingDisplayName(true);
                            setEditingDisplayName(profileData.user?.displayName || "");
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                  {profileData.niche && (
                    <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary hover:bg-primary/20">
                      {profileData.niche}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-wrap gap-3 w-full md:w-auto">
                {!isOwnProfile ? (
                  <>
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={() => handleLikeClick(false)}
                      disabled={isLiking}
                      data-testid="button-like-profile"
                      className="border-pink-300 text-pink-600 hover:bg-pink-50 hover:text-pink-700 dark:border-pink-700 dark:text-pink-400 dark:hover:bg-pink-900/30"
                    >
                      {isLiking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Heart className="h-4 w-4 mr-2" />}
                      Like
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={() => handleLikeClick(true)}
                      disabled={isLiking}
                      data-testid="button-superlike-profile"
                      className="border-amber-300 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30"
                    >
                      {isLiking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Star className="h-4 w-4 mr-2" />}
                      Super Like
                    </Button>
                    <CollabRequestModal 
                      receiverId={profileData.userId}
                      receiverName={profileData.user?.firstName || "Creator"}
                      trigger={
                        <Button size="lg" className="w-full md:w-auto bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                          Let's Collaborate
                        </Button>
                      }
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="lg"
                          data-testid="button-block-user"
                        >
                          <ShieldBan className="h-4 w-4 mr-2" />
                          Block
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Block {profileData.user?.firstName}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will prevent them from seeing your profile, messaging you, or sending collaboration requests. You can unblock them later from your settings.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleBlock}
                            disabled={isBlocking}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isBlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Block User'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : null}
              </div>
            </div>

            {/* Boundaries Section - Show for own profile and others */}
            {hasBoundaries && (
              <Card className="mt-8 border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-primary" />
                    Boundaries & Expectations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {boundaries.contentTypes && boundaries.contentTypes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Content Comfort Level</h4>
                      <div className="flex flex-wrap gap-2">
                        {boundaries.contentTypes.map((type: string) => (
                          <Badge key={type} variant="secondary" className="bg-primary/10 text-primary">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {boundaries.communicationPrefs && boundaries.communicationPrefs.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Communication</h4>
                      <div className="flex flex-wrap gap-2">
                        {boundaries.communicationPrefs.map((pref: string) => (
                          <Badge key={pref} variant="outline">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {pref}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {boundaries.collaborationTypes && boundaries.collaborationTypes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Open To</h4>
                      <div className="flex flex-wrap gap-2">
                        {boundaries.collaborationTypes.map((type: string) => (
                          <Badge key={type} variant="outline">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {boundaries.safetyRequirements && boundaries.safetyRequirements.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1 text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        Safety Requirements
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {boundaries.safetyRequirements.map((req: string) => (
                          <Badge key={req} variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {boundaries.dealBreakers && boundaries.dealBreakers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1 text-muted-foreground">
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                        Deal Breakers
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {boundaries.dealBreakers.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Content Grid */}
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="md:col-span-2 space-y-8">
                <div>
                  <h2 className="text-lg font-bold mb-3 border-b pb-2">About</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-lg">
                    {profileData.bio || "This creator hasn't added a bio yet."}
                  </p>
                </div>

                {/* Posts Section */}
                <div>
                  <h2 className="text-lg font-bold mb-4 border-b pb-2">Posts</h2>
                  {isLoadingPosts ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <Card key={i}>
                          <CardHeader>
                            <Skeleton className="h-5 w-3/4" />
                          </CardHeader>
                          <CardContent>
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-5/6" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : userPosts && userPosts.length > 0 ? (
                    <div className="space-y-4">
                      {userPosts.map((post: any) => (
                        <Card key={post.id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <Link href={`/community/forums/posts/${post.id}`}>
                                  <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors cursor-pointer">
                                    {post.title}
                                  </h3>
                                </Link>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                                  {post.topic && (
                                    <>
                                      <span>•</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {post.topic.name}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground line-clamp-3 mb-3">
                              {post.content}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-3 border-t">
                              <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                <span>{post.likesCount || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="h-4 w-4" />
                                <span>{post.repliesCount || 0}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No posts yet</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                  <h3 className="font-semibold mb-4">Details</h3>
                  <div className="space-y-4 text-sm">
                    {profileData.location && showLocation && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{profileData.location}</span>
                      </div>
                    )}
                    {profileData.birthDate && showAge && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{calculateAge(profileData.birthDate)} years old</span>
                      </div>
                    )}
                    {profileData.birthDate && showBirthDate && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>Born {new Date(profileData.birthDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {profileData.occupation && showOccupation && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Briefcase className="w-4 h-4 text-primary" />
                        <span>{profileData.occupation}</span>
                      </div>
                    )}
                    {profileData.education && showEducation && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <GraduationCap className="w-4 h-4 text-primary" />
                        <span>{profileData.education}</span>
                      </div>
                    )}
                    {profileData.height && showHeight && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Ruler className="w-4 h-4 text-primary" />
                        <span>{profileData.height} cm</span>
                      </div>
                    )}
                    {profileData.portfolioUrl && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-primary" />
                        <a href={profileData.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                          Website / Portfolio
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                  <h3 className="font-semibold mb-4">Socials</h3>
                  <div className="flex flex-col gap-3">
                    {socials.instagram && (
                      <SocialLink icon={Instagram} label="Instagram" value={socials.instagram} color="text-pink-500" />
                    )}
                    {socials.twitter && (
                      <SocialLink icon={Twitter} label="Twitter" value={socials.twitter} color="text-blue-400" />
                    )}
                    {socials.youtube && (
                      <SocialLink icon={Youtube} label="YouTube" value={socials.youtube} color="text-red-500" />
                    )}
                    {socials.tiktok && (
                      <SocialLink icon={Music2} label="TikTok" value={socials.tiktok} color="text-black dark:text-white" />
                    )}
                    {socials.twitch && (
                      <SocialLink icon={PlayCircle} label="Twitch" value={socials.twitch} color="text-purple-500" />
                    )}
                    {socials.discord && (
                      <SocialLink icon={MessageCircle} label="Discord" value={socials.discord} color="text-indigo-500" />
                    )}
                    {socials.pinterest && (
                      <SocialLink icon={ImageIcon} label="Pinterest" value={socials.pinterest} color="text-red-600" />
                    )}
                    {socials.onlyfans && (
                      <SocialLink icon={CreditCard} label="OnlyFans" value={socials.onlyfans} color="text-blue-600" />
                    )}
                    {socials.fansly && (
                      <SocialLink icon={Heart} label="Fansly" value={socials.fansly} color="text-pink-600" />
                    )}
                    {socials.patreon && (
                      <SocialLink icon={CreditCard} label="Patreon" value={socials.patreon} color="text-orange-500" />
                    )}
                    {socials.linkedin && (
                      <SocialLink icon={Linkedin} label="LinkedIn" value={socials.linkedin} color="text-blue-600" />
                    )}
                    {socials.whatsapp && (
                      <SocialLink icon={MessageCircle} label="WhatsApp" value={socials.whatsapp} color="text-green-500" />
                    )}
                    {socials.email && (
                      <SocialLink icon={Mail} label="Email" value={socials.email} color="text-blue-500" />
                    )}
                  </div>
                  {Object.keys(socials).length === 0 && (
                    <p className="text-muted-foreground text-sm">No social links added.</p>
                  )}
                </div>
                
                {/* Additional Details - Show for own profile */}
                {isOwnProfile && (
                  <>
                    {profileData.gender && (
                      <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                        <h3 className="font-semibold mb-4">Gender</h3>
                        <p className="text-sm text-muted-foreground">{profileData.gender}</p>
                      </div>
                    )}
                    {profileData.lookingFor && (
                      <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                        <h3 className="font-semibold mb-4">Looking For</h3>
                        <p className="text-sm text-muted-foreground">{profileData.lookingFor}</p>
                      </div>
                    )}
                    {profileData.relationshipType && (
                      <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                        <h3 className="font-semibold mb-4">Relationship Type</h3>
                        <p className="text-sm text-muted-foreground">{profileData.relationshipType}</p>
                      </div>
                    )}
                    {profileData.interests && Array.isArray(profileData.interests) && profileData.interests.length > 0 && (
                      <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                        <h3 className="font-semibold mb-4">Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {profileData.interests.map((interest: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="bg-primary/10 text-primary">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {profileData.photos && Array.isArray(profileData.photos) && profileData.photos.length > 0 && (
                      <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                        <h3 className="font-semibold mb-4">Photos</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {profileData.photos.map((photo: string, idx: number) => (
                            <img 
                              key={idx} 
                              src={photo} 
                              alt={`Photo ${idx + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {profileData.tags && Array.isArray(profileData.tags) && profileData.tags.length > 0 && (
                      <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                        <h3 className="font-semibold mb-4">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {profileData.tags.map((tag: string, idx: number) => (
                            <Badge key={idx} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {(profileData.minAgePreference || profileData.maxAgePreference || profileData.maxDistance) && (
                      <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                        <h3 className="font-semibold mb-4">Preferences</h3>
                        <div className="space-y-2 text-sm">
                          {(profileData.minAgePreference || profileData.maxAgePreference) && (
                            <div className="text-muted-foreground">
                              Age Range: {profileData.minAgePreference || 18} - {profileData.maxAgePreference || 99}
                            </div>
                          )}
                          {profileData.maxDistance && (
                            <div className="text-muted-foreground">
                              Max Distance: {profileData.maxDistance} km
                            </div>
                          )}
                          {profileData.genderPreference && Array.isArray(profileData.genderPreference) && profileData.genderPreference.length > 0 && (
                            <div className="text-muted-foreground">
                              Gender Preference: {profileData.genderPreference.join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {(profileData.experienceLevel || profileData.availability || profileData.travelMode || profileData.monetizationExpectation) && (
                      <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                        <h3 className="font-semibold mb-4">Collaboration Details</h3>
                        <div className="space-y-2 text-sm">
                          {profileData.experienceLevel && (
                            <div className="text-muted-foreground">
                              Experience Level: {profileData.experienceLevel}
                            </div>
                          )}
                          {profileData.availability && (
                            <div className="text-muted-foreground">
                              Availability: {profileData.availability}
                            </div>
                          )}
                          {profileData.travelMode && (
                            <div className="text-muted-foreground">
                              Travel Mode: {profileData.travelMode}
                            </div>
                          )}
                          {profileData.monetizationExpectation && (
                            <div className="text-muted-foreground">
                              Monetization: {profileData.monetizationExpectation}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConsentDialog
        open={consentDialogOpen}
        onOpenChange={(open) => {
          setConsentDialogOpen(open);
          if (!open) handleConsentCancel();
        }}
        userId={profileData.userId}
        userName={profileData.user?.firstName || "Creator"}
        boundaries={boundaries}
        onConfirm={handleConsentConfirm}
      />
    </div>
  );
}

function SocialLink({ icon: Icon, label, value, color }: any) {
  return (
    <div className="flex items-center justify-between p-2 hover:bg-background rounded-lg transition-colors group">
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="font-medium text-sm">{label}</span>
      </div>
      <a href={`https://${label.toLowerCase()}.com/${value}`} target="_blank" rel="noreferrer">
        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </a>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="h-64 bg-muted animate-pulse" />
      <div className="container mx-auto px-4 -mt-24">
        <div className="bg-card h-[600px] rounded-3xl border shadow-xl p-8">
          <Skeleton className="w-40 h-40 rounded-full border-4 border-card -mt-20" />
          <div className="mt-6 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-32 w-full max-w-2xl mt-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
