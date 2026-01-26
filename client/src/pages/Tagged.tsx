import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Tag } from "lucide-react";
import { Link } from "wouter";

export default function Tagged() {
  const { data: tagged, isLoading } = useQuery({
    queryKey: ["/api/tagged"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/tagged");
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

  const taggedList = tagged || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Tag className="h-8 w-8" />
          Tagged Posts
        </h1>
        <p className="text-muted-foreground mt-1">
          View posts where you've been tagged by other users.
        </p>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>Posts You're Tagged In</CardTitle>
          <CardDescription>
            {taggedList.length ? `${taggedList.length} post${taggedList.length > 1 ? 's' : ''}` : 'No tagged posts'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {taggedList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>You haven't been tagged in any posts yet.</p>
              <p className="text-sm mt-1">When other users tag you, those posts will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {taggedList.map((item: any) => (
                <Link
                  key={item.id}
                  href={`/community/forums/posts/${item.post_id}`}
                  className="block p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium mb-1">{item.post?.title || "Untitled Post"}</p>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {item.post?.content || "No content"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>By {item.post?.author?.displayName || item.post?.author?.firstName || "Unknown"}</span>
                        <span>•</span>
                        <span>{new Date(item.post?.created_at || item.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Forum: {item.post?.topic?.name || "Unknown"}</span>
                      </div>
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
