import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProfileSchema, type InsertProfile } from "@shared/schema";
import { useMyProfile, useUpdateProfile } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, Link as LinkIcon, MapPin, Instagram, Twitter, Youtube, Music2, Check, AlertTriangle } from "lucide-react";
import { useEffect, useCallback, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function MyProfile() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useMyProfile();
  const { mutate, isPending } = useUpdateProfile();
  const { toast } = useToast();
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<InsertProfile & { instagram?: string; twitter?: string; youtube?: string; tiktok?: string }>({
    resolver: zodResolver(insertProfileSchema.extend({})),
    defaultValues: {
      bio: "",
      niche: "",
      portfolioUrl: "",
      location: "",
      socialLinks: {},
      isNsfw: false,
      interests: [],
      gender: "",
      lookingFor: "",
      isVisible: true,
    },
  });

  useEffect(() => {
    if (profile) {
      const socials = profile.socialLinks as any || {};
      form.reset({
        bio: profile.bio || "",
        niche: profile.niche || "",
        portfolioUrl: profile.portfolioUrl || "",
        location: profile.location || "",
        socialLinks: profile.socialLinks || {},
        instagram: socials.instagram || "",
        twitter: socials.twitter || "",
        youtube: socials.youtube || "",
        tiktok: socials.tiktok || "",
        isNsfw: profile.isNsfw || false,
        interests: profile.interests || [],
        gender: profile.gender || "",
        lookingFor: profile.lookingFor || "",
        isVisible: profile.isVisible ?? true,
      });
    }
  }, [profile, form]);

  const saveProfile = useCallback((data: any, force = false) => {
    if (!profile && !force) return;
    
    const { instagram, twitter, youtube, tiktok, ...rest } = data;
    const socialLinks: Record<string, string> = {};
    if (instagram) socialLinks.instagram = instagram;
    if (twitter) socialLinks.twitter = twitter;
    if (youtube) socialLinks.youtube = youtube;
    if (tiktok) socialLinks.tiktok = tiktok;

    const updatePayload: Record<string, any> = {};
    
    if (rest.bio !== undefined && rest.bio !== (profile?.bio || "")) updatePayload.bio = rest.bio;
    if (rest.niche !== undefined && rest.niche !== (profile?.niche || "")) updatePayload.niche = rest.niche;
    if (rest.portfolioUrl !== undefined && rest.portfolioUrl !== (profile?.portfolioUrl || "")) updatePayload.portfolioUrl = rest.portfolioUrl;
    if (rest.location !== undefined && rest.location !== (profile?.location || "")) updatePayload.location = rest.location;
    if (rest.isNsfw !== undefined && rest.isNsfw !== profile?.isNsfw) updatePayload.isNsfw = rest.isNsfw;
    if (rest.isVisible !== undefined && rest.isVisible !== profile?.isVisible) updatePayload.isVisible = rest.isVisible;
    
    const currentSocials = profile?.socialLinks as Record<string, string> || {};
    const socialsChanged = JSON.stringify(socialLinks) !== JSON.stringify(currentSocials);
    if (socialsChanged) updatePayload.socialLinks = socialLinks;
    
    if (Object.keys(updatePayload).length === 0 && !force) return;

    setAutoSaveStatus('saving');
    mutate(force ? { ...rest, socialLinks } : updatePayload, {
      onSuccess: () => {
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      },
      onError: () => {
        setAutoSaveStatus('idle');
        toast({
          title: "Failed to save",
          description: "Your changes could not be saved. Please try again.",
          variant: "destructive",
        });
      }
    });
  }, [mutate, toast, profile]);

  const debouncedSave = useCallback((data: any) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveProfile(data);
    }, 2000);
  }, [saveProfile]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      if (profile) {
        debouncedSave(value);
      }
    });
    return () => {
      subscription.unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form, debouncedSave, profile]);

  const onSubmit = (data: any) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveProfile(data, true);
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {user?.profileImageUrl && (
            <img src={user.profileImageUrl} alt="Profile" className="w-20 h-20 rounded-full border-4 border-white shadow-lg" />
          )}
          <div>
            <h1 className="font-display text-3xl font-bold">Edit Profile</h1>
            <p className="text-muted-foreground">Update your public profile information.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {autoSaveStatus === 'saving' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {autoSaveStatus === 'saved' && (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-green-500">Saved</span>
            </>
          )}
        </div>
      </div>

      <Card className="border-border/50 shadow-lg mb-6">
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>This information will be visible to other users. Changes save automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="niche"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Niche</FormLabel>
                      <FormControl>
                        <Input data-testid="input-niche" placeholder="e.g. Tech, Beauty, Gaming" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input data-testid="input-location" className="pl-9" placeholder="City, Country" {...field} value={field.value || ""} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        data-testid="input-bio"
                        placeholder="Tell others about yourself..." 
                        className="min-h-[120px] resize-none"
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="portfolioUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio / Website URL</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input data-testid="input-portfolio" className="pl-9" placeholder="https://..." {...field} value={field.value || ""} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">Social Media Handles</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField name="instagram" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Instagram className="absolute left-3 top-3 h-4 w-4 text-pink-500" />
                          <Input data-testid="input-instagram" className="pl-9" placeholder="Instagram username" {...field} value={field.value || ""} />
                        </div>
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField name="twitter" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Twitter className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                          <Input data-testid="input-twitter" className="pl-9" placeholder="Twitter/X username" {...field} value={field.value || ""} />
                        </div>
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField name="youtube" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Youtube className="absolute left-3 top-3 h-4 w-4 text-red-500" />
                          <Input data-testid="input-youtube" className="pl-9" placeholder="YouTube channel" {...field} value={field.value || ""} />
                        </div>
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField name="tiktok" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Music2 className="absolute left-3 top-3 h-4 w-4 text-black dark:text-white" />
                          <Input data-testid="input-tiktok" className="pl-9" placeholder="TikTok username" {...field} value={field.value || ""} />
                        </div>
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">Content Settings</h3>
                
                <FormField
                  control={form.control}
                  name="isNsfw"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          NSFW Content
                        </FormLabel>
                        <FormDescription>
                          Enable this if your profile contains adult or mature content.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          data-testid="switch-nsfw"
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isVisible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Profile Visibility</FormLabel>
                        <FormDescription>
                          When enabled, your profile is visible to others in the directory.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          data-testid="switch-visibility"
                          checked={field.value ?? true}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  data-testid="button-save-profile"
                  disabled={isPending || autoSaveStatus === 'saving'}
                  className="bg-primary hover:bg-primary/90 min-w-[150px]"
                >
                  {isPending || autoSaveStatus === 'saving' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
