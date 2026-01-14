import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProfileSchema, type InsertProfile } from "@shared/schema";
import { useMyProfile, useUpdateProfile } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, Link as LinkIcon, MapPin, Instagram, Twitter, Youtube, Music2 } from "lucide-react";
import { useEffect } from "react";

export default function MyProfile() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useMyProfile();
  const { mutate, isPending } = useUpdateProfile();

  // Define schema for form (handling JSON social links separately if needed, but here simple)
  // For simplicity, we'll map social links manually in submit
  const form = useForm<InsertProfile & { instagram?: string; twitter?: string; youtube?: string; tiktok?: string }>({
    resolver: zodResolver(insertProfileSchema.extend({
      // We extend to allow string inputs for socials which we'll pack into json
    })),
    defaultValues: {
      bio: "",
      niche: "",
      portfolioUrl: "",
      location: "",
      socialLinks: {},
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
        // @ts-ignore - handling the json field unpacking for UI
        socialLinks: profile.socialLinks || {},
        instagram: socials.instagram || "",
        twitter: socials.twitter || "",
        youtube: socials.youtube || "",
        tiktok: socials.tiktok || "",
      });
    }
  }, [profile, form]);

  const onSubmit = (data: any) => {
    const { instagram, twitter, youtube, tiktok, ...rest } = data;
    const socialLinks = { instagram, twitter, youtube, tiktok };
    
    // Clean empty strings
    Object.keys(socialLinks).forEach(key => {
      // @ts-ignore
      if (!socialLinks[key]) delete socialLinks[key];
    });

    mutate({ ...rest, socialLinks });
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8 flex items-center gap-4">
        {user?.profileImageUrl && (
          <img src={user.profileImageUrl} alt="Profile" className="w-20 h-20 rounded-full border-4 border-white shadow-lg" />
        )}
        <div>
          <h1 className="font-display text-3xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground">Update your public profile information.</p>
        </div>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>This information will be visible to other creators.</CardDescription>
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
                        <Input placeholder="e.g. Tech, Beauty, Gaming" {...field} value={field.value || ""} />
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
                          <Input className="pl-9" placeholder="City, Country" {...field} value={field.value || ""} />
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
                        placeholder="Tell others about your content style, audience, and what kind of collaborations you're looking for..." 
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
                        <Input className="pl-9" placeholder="https://..." {...field} value={field.value || ""} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">Social Media Handles</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* @ts-ignore - manual fields */}
                  <FormField name="instagram" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Instagram className="absolute left-3 top-3 h-4 w-4 text-pink-500" />
                          <Input className="pl-9" placeholder="Instagram username" {...field} />
                        </div>
                      </FormControl>
                    </FormItem>
                  )} />
                  {/* @ts-ignore */}
                  <FormField name="twitter" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Twitter className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                          <Input className="pl-9" placeholder="Twitter/X username" {...field} />
                        </div>
                      </FormControl>
                    </FormItem>
                  )} />
                  {/* @ts-ignore */}
                  <FormField name="youtube" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Youtube className="absolute left-3 top-3 h-4 w-4 text-red-500" />
                          <Input className="pl-9" placeholder="YouTube channel" {...field} />
                        </div>
                      </FormControl>
                    </FormItem>
                  )} />
                  {/* @ts-ignore */}
                  <FormField name="tiktok" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Music2 className="absolute left-3 top-3 h-4 w-4 text-black dark:text-white" />
                          <Input className="pl-9" placeholder="TikTok username" {...field} />
                        </div>
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={isPending}
                  className="bg-primary hover:bg-primary/90 min-w-[150px]"
                >
                  {isPending ? (
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
