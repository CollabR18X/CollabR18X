import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Archive, FileText, Trash2, Image as ImageIcon, Video, Music, File, RotateCcw, Trash, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function Vault() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("drafts");

  const { data: vaultData, isLoading } = useQuery({
    queryKey: ["/api/vault"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/vault");
      return res.json();
    },
  });

  const restorePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await apiRequest("POST", `/api/vault/restore/${postId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vault"] });
      toast({ title: "Post restored", description: "The post has been restored successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePermanentlyMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await apiRequest("DELETE", `/api/vault/delete/${postId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vault"] });
      toast({ title: "Post deleted", description: "The post has been permanently deleted." });
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

  const drafts = vaultData?.drafts || [];
  const archived = vaultData?.archived || [];
  const deleted = vaultData?.deleted || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Archive className="h-8 w-8" />
          Vault
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your draft posts, archived content, and deleted items.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="drafts">
            <FileText className="h-4 w-4 mr-2" />
            Drafts ({drafts.length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            <Archive className="h-4 w-4 mr-2" />
            Archived ({archived.length})
          </TabsTrigger>
          <TabsTrigger value="deleted">
            <Trash2 className="h-4 w-4 mr-2" />
            Deleted ({deleted.length})
          </TabsTrigger>
        </TabsList>

        {/* Drafts Tab */}
        <TabsContent value="drafts" className="mt-6">
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle>Draft Posts</CardTitle>
              <CardDescription>
                Your saved drafts that haven't been published yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {drafts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No draft posts yet.</p>
                  <p className="text-sm mt-1">Start writing a post to save it as a draft.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {drafts.map((draft: any) => (
                    <div
                      key={draft.id}
                      className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{draft.title || "Untitled Draft"}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {draft.content || "No content"}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Last edited {formatDistanceToNow(new Date(draft.updated_at || draft.created_at), { addSuffix: true })}</span>
                              {draft.topic && (
                                <>
                                  <span>•</span>
                                  <span>Forum: {draft.topic.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={`/community/forums/${draft.topic_id || ''}?draft=${draft.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Archived Tab */}
        <TabsContent value="archived" className="mt-6">
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle>Archived Content</CardTitle>
              <CardDescription>
                Posts and media you've archived
              </CardDescription>
            </CardHeader>
            <CardContent>
              {archived.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Archive className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No archived content yet.</p>
                  <p className="text-sm mt-1">Archive posts or media to keep them organized.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {archived.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {item.type === 'post' ? (
                          <>
                            <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{item.title || "Untitled Post"}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {item.content || "No content"}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Archived {formatDistanceToNow(new Date(item.archived_at), { addSuffix: true })}</span>
                                {item.topic && (
                                  <>
                                    <span>•</span>
                                    <span>Forum: {item.topic.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {item.media_type === 'image' && <ImageIcon className="h-5 w-5 text-muted-foreground mt-1" />}
                            {item.media_type === 'video' && <Video className="h-5 w-5 text-muted-foreground mt-1" />}
                            {item.media_type === 'audio' && <Music className="h-5 w-5 text-muted-foreground mt-1" />}
                            {!item.media_type && <File className="h-5 w-5 text-muted-foreground mt-1" />}
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{item.name || "Untitled Media"}</h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {item.url && (
                                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    View Media
                                  </a>
                                )}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Archived {formatDistanceToNow(new Date(item.archived_at), { addSuffix: true })}</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Restore archived item
                            apiRequest("POST", `/api/vault/unarchive/${item.id}`)
                              .then(() => {
                                queryClient.invalidateQueries({ queryKey: ["/api/vault"] });
                                toast({ title: "Item restored", description: "The item has been restored from archive." });
                              })
                              .catch((error) => {
                                toast({ title: "Error", description: error.message, variant: "destructive" });
                              });
                          }}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deleted Tab */}
        <TabsContent value="deleted" className="mt-6">
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle>Deleted Posts</CardTitle>
              <CardDescription>
                Posts you've deleted. They can be restored within 30 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deleted.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Trash2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No deleted posts yet.</p>
                  <p className="text-sm mt-1">Deleted posts will appear here and can be restored within 30 days.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deleted.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <Trash2 className="h-5 w-5 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{item.title || "Untitled Post"}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {item.content || "No content"}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Deleted {formatDistanceToNow(new Date(item.deleted_at), { addSuffix: true })}</span>
                            {item.topic && (
                              <>
                                <span>•</span>
                                <span>Forum: {item.topic.name}</span>
                              </>
                            )}
                            {item.expires_at && new Date(item.expires_at) > new Date() && (
                              <>
                                <span>•</span>
                                <span className="text-orange-500">
                                  Expires in {formatDistanceToNow(new Date(item.expires_at), { addSuffix: true })}
                                </span>
                              </>
                            )}
                            {item.expires_at && new Date(item.expires_at) <= new Date() && (
                              <>
                                <span>•</span>
                                <span className="text-red-500">Permanently deleted</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {item.expires_at && new Date(item.expires_at) > new Date() ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restorePostMutation.mutate(item.id)}
                            disabled={restorePostMutation.isPending}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Cannot restore</span>
                        )}
                        {item.expires_at && new Date(item.expires_at) > new Date() && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm("Are you sure you want to permanently delete this post? This action cannot be undone.")) {
                                deletePermanentlyMutation.mutate(item.id);
                              }
                            }}
                            disabled={deletePermanentlyMutation.isPending}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete Forever
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
