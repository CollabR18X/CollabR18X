import { useAuth } from "@/hooks/use-auth";
import { useMyProfile } from "@/hooks/use-profiles";
import { useCollaborations } from "@/hooks/use-collaborations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { Edit2, ExternalLink, Mail, ArrowUpRight, Clock, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: collabs, isLoading: collabsLoading } = useCollaborations();

  if (!user) return null;

  const pendingRequests = collabs?.filter(c => c.receiverId === user.id && c.status === 'pending') || [];
  const activeCollabs = collabs?.filter(c => c.status === 'accepted') || [];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            Welcome back, <span className="text-gradient">{user.firstName}</span>!
          </h1>
          <p className="text-muted-foreground mt-2">Here's what's happening with your collaborations.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/directory">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
              Find Creators
            </Button>
          </Link>
          <Link href="/profile/me">
            <Button size="lg" variant="outline" className="border-primary/20 hover:bg-primary/5">
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <Card className="md:col-span-1 shadow-lg shadow-black/5 border-border/50">
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {profileLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : profile ? (
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  {user.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt={user.firstName || ""} 
                      className="w-24 h-24 rounded-full object-cover border-4 border-primary/10"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold border-4 border-primary/10">
                      {user.firstName?.[0]}
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-xl">{user.firstName} {user.lastName}</h3>
                <p className="text-primary font-medium text-sm mt-1">{profile.niche || "No niche set"}</p>
                <p className="text-muted-foreground text-sm mt-3 line-clamp-2">{profile.bio || "Add a bio to let others know about you!"}</p>
                
                <div className="mt-6 flex justify-center gap-3">
                  {profile.portfolioUrl && (
                    <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                  {/* Social links would go here from jsonb */}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">You haven't set up your creator profile yet.</p>
                <Link href="/profile/me">
                  <Button variant="secondary" className="w-full">Create Profile</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats & Actions */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription className="text-primary font-semibold">Pending Requests</CardDescription>
                <CardTitle className="text-4xl font-display">{pendingRequests.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/collaborations">
                  <span className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 cursor-pointer">
                    View requests <ArrowUpRight className="w-3 h-3" />
                  </span>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
              <CardHeader className="pb-2">
                <CardDescription className="text-accent font-semibold">Active Collabs</CardDescription>
                <CardTitle className="text-4xl font-display">{activeCollabs.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/collaborations">
                  <span className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1 cursor-pointer">
                    View active <ArrowUpRight className="w-3 h-3" />
                  </span>
                </Link>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {collabsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : collabs && collabs.length > 0 ? (
                <div className="space-y-4">
                  {collabs.slice(0, 3).map((collab) => (
                    <div key={collab.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${collab.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                          {collab.status === 'pending' ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {collab.requesterId === user.id 
                              ? `Request sent to ${collab.receiver.firstName}` 
                              : `Request from ${collab.requester.firstName}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(collab.createdAt!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        collab.status === 'pending' ? 'bg-orange-100 text-orange-700' : 
                        collab.status === 'accepted' ? 'bg-green-100 text-green-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {collab.status.charAt(0).toUpperCase() + collab.status.slice(1)}
                      </span>
                    </div>
                  ))}
                  <Link href="/collaborations">
                    <Button variant="ghost" className="w-full mt-2 text-muted-foreground">View All Activity</Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No activity yet. Go find some creators!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
