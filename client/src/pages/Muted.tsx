import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, VolumeX, Volume2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Muted() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: muted, isLoading } = useQuery({
    queryKey: ["/api/connections/muted"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/connections/muted");
      return res.json();
    },
  });

  const unmuteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/connections/muted/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections/muted"] });
      toast({ title: "Unmuted", description: "You can now see this user's content again." });
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

  const mutedList = muted || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <VolumeX className="h-8 w-8" />
          Muted Users
        </h1>
        <p className="text-muted-foreground mt-1">
          View and manage users you've muted. Muted users' content won't appear in your feed.
        </p>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>Your Muted List</CardTitle>
          <CardDescription>
            {mutedList.length ? `${mutedList.length} user${mutedList.length > 1 ? 's' : ''} muted` : 'No muted users'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mutedList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <VolumeX className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>You haven't muted anyone yet.</p>
              <p className="text-sm mt-1">When you mute someone, they'll appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mutedList.map((mute: any) => (
                <div
                  key={mute.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <Link
                    href={`/profile/${mute.muted_user?.id || mute.muted_user_id}`}
                    className="flex items-center gap-3 flex-1 hover:bg-muted/50 transition-colors rounded-lg p-2 -m-2"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={mute.muted_user?.profileImageUrl} />
                      <AvatarFallback>
                        {(mute.muted_user?.displayName || mute.muted_user?.firstName)?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {mute.muted_user?.displayName || `${mute.muted_user?.firstName || ""} ${mute.muted_user?.lastName || ""}`.trim() || "User"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Muted on {new Date(mute.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unmuteMutation.mutate(mute.muted_user?.id || mute.muted_user_id)}
                    disabled={unmuteMutation.isPending}
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    Unmute
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
