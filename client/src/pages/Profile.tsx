import { useProfile } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
import { CollabRequestModal } from "@/components/CollabRequestModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link, useRoute } from "wouter";
import { ArrowLeft, MapPin, Globe, Instagram, Twitter, Youtube, ExternalLink } from "lucide-react";

export default function Profile() {
  const [, params] = useRoute("/profile/:id");
  const id = parseInt(params?.id || "0");
  const { data: profile, isLoading, error } = useProfile(id);
  const { user } = useAuth();

  if (isLoading) return <ProfileSkeleton />;
  if (error || !profile) return <div className="p-8 text-center">Profile not found</div>;

  const isOwnProfile = user?.id === profile.userId;
  const socials = profile.socialLinks as any || {};

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
              <div className="flex flex-col md:flex-row gap-6 items-end -mt-20">
                <div className="relative">
                  {profile.user.profileImageUrl ? (
                    <img 
                      src={profile.user.profileImageUrl} 
                      alt={profile.user.firstName || ""} 
                      className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-card object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-card bg-primary text-white flex items-center justify-center text-4xl font-bold shadow-lg">
                      {profile.user.firstName?.[0]}
                    </div>
                  )}
                </div>
                <div className="mb-2 text-center md:text-left">
                  <h1 className="font-display text-3xl font-bold">{profile.user.firstName} {profile.user.lastName}</h1>
                  {profile.niche && (
                    <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary hover:bg-primary/20">
                      {profile.niche}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-3 w-full md:w-auto">
                {!isOwnProfile ? (
                  <CollabRequestModal 
                    receiverId={profile.userId}
                    receiverName={profile.user.firstName || "Creator"}
                    trigger={
                      <Button size="lg" className="w-full md:w-auto bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                        Let's Collaborate
                      </Button>
                    }
                  />
                ) : (
                  <Link href="/profile/me">
                    <Button variant="outline">Edit Profile</Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="md:col-span-2 space-y-8">
                <div>
                  <h2 className="text-lg font-bold mb-3 border-b pb-2">About</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-lg">
                    {profile.bio || "This creator hasn't added a bio yet."}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                  <h3 className="font-semibold mb-4">Details</h3>
                  <div className="space-y-4 text-sm">
                    {profile.location && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.portfolioUrl && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-primary" />
                        <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
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
                  </div>
                  {Object.keys(socials).length === 0 && (
                    <p className="text-muted-foreground text-sm">No social links added.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
