import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Bookmark, BookmarkX } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Bookmarks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookmarks, isLoading } = useQuery({
    queryKey: ["/api/bookmarks"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/bookmarks");
      return res.json();
    },
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/connections/bookmarks/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections/bookmarks"] });
      toast({ title: "Bookmark removed", description: "Profile removed from your bookmarks." });
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

  const bookmarksList = bookmarks || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Bookmark className="h-8 w-8" />
          Bookmarks
        </h1>
        <p className="text-muted-foreground mt-1">
          View profiles you've bookmarked for easy access.
        </p>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>Your Bookmarks</CardTitle>
          <CardDescription>
            {bookmarksList.length ? `${bookmarksList.length} bookmarked profile${bookmarksList.length > 1 ? 's' : ''}` : 'No bookmarks yet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookmarksList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>You haven't bookmarked any profiles yet.</p>
              <p className="text-sm mt-1">Bookmark profiles to save them for later.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarksList.map((bookmark: any) => (
                <div
                  key={bookmark.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <Link
                    href={`/profile/${bookmark.saved_user?.id || bookmark.saved_user_id}`}
                    className="flex items-center gap-3 flex-1 hover:bg-muted/50 transition-colors rounded-lg p-2 -m-2"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={bookmark.saved_user?.profileImageUrl} />
                      <AvatarFallback>
                        {(bookmark.saved_user?.displayName || bookmark.saved_user?.firstName)?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {bookmark.saved_user?.displayName || `${bookmark.saved_user?.firstName || ""} ${bookmark.saved_user?.lastName || ""}`.trim() || "User"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Bookmarked on {new Date(bookmark.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeBookmarkMutation.mutate(bookmark.saved_user?.id || bookmark.saved_user_id)}
                    disabled={removeBookmarkMutation.isPending}
                  >
                    <BookmarkX className="h-4 w-4 mr-2" />
                    Remove
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
