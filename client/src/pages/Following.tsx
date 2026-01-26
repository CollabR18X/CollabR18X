import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, UserCheck, UserMinus } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Following() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: following, isLoading } = useQuery({
    queryKey: ["/api/connections/following"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/connections/following");
      return res.json();
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/connections/following/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/followers"] });
      toast({ title: "Unfollowed", description: "You are no longer following this user." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  const followingList = following || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <UserCheck className="h-8 w-8" />
          Following
        </h1>
        <p className="text-muted-foreground mt-1">
          Users you are following.
        </p>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>People You Follow</CardTitle>
          <CardDescription>
            {followingList.length ? `Following ${followingList.length} user${followingList.length > 1 ? 's' : ''}` : 'Not following anyone yet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {followingList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>You're not following anyone yet.</p>
              <p className="text-sm mt-1">Start following creators to see their updates here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {followingList.map((follow: any) => (
                <div
                  key={follow.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <Link
                    href={`/profile/${follow.following?.id || follow.following_id}`}
                    className="flex items-center gap-3 flex-1 hover:bg-muted/50 transition-colors rounded-lg p-2 -m-2"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={follow.following?.profileImageUrl} />
                      <AvatarFallback>
                        {(follow.following?.displayName || follow.following?.firstName)?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {follow.following?.displayName || `${follow.following?.firstName || ""} ${follow.following?.lastName || ""}`.trim() || "User"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Since {new Date(follow.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unfollowMutation.mutate(follow.following?.id || follow.following_id)}
                    disabled={unfollowMutation.isPending}
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Unfollow
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
