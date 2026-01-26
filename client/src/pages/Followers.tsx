import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, UserPlus } from "lucide-react";
import { Link } from "wouter";

export default function Followers() {
  const { data: followers, isLoading } = useQuery({
    queryKey: ["/api/connections/followers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/connections/followers");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  const followersList = followers || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <UserPlus className="h-8 w-8" />
          Followers
        </h1>
        <p className="text-muted-foreground mt-1">
          Users who are following you.
        </p>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>Your Followers</CardTitle>
          <CardDescription>
            {followersList.length ? `${followersList.length} follower${followersList.length > 1 ? 's' : ''}` : 'No followers yet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {followersList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>You don't have any followers yet.</p>
              <p className="text-sm mt-1">When users follow you, they'll appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {followersList.map((follower: any) => (
                <Link
                  key={follower.id}
                  href={`/profile/${follower.follower?.id || follower.follower_id}`}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={follower.follower?.profileImageUrl} />
                      <AvatarFallback>
                        {(follower.follower?.displayName || follower.follower?.firstName)?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {follower.follower?.displayName || `${follower.follower?.firstName || ""} ${follower.follower?.lastName || ""}`.trim() || "User"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Started following {new Date(follower.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
