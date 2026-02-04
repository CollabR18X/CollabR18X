import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { sitePath } from "@/lib/site";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreVertical,
  Calendar,
  User,
  Plus,
  Loader2,
  Copy,
  Check,
  Send,
  X
} from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface FeedPost {
  id: number;
  title: string;
  content: string;
  authorId: string | null;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  topic?: {
    id: number;
    name: string;
  };
  likesCount: number;
  repliesCount?: number;
  createdAt: string;
  isAnonymous: boolean;
  isLiked?: boolean;
}

interface Reply {
  id: number;
  content: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  isAnonymous: boolean;
  createdAt: string;
}

export default function Feed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [commentOpen, setCommentOpen] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [copiedPostId, setCopiedPostId] = useState<number | null>(null);

  const { data: posts, isLoading, error } = useQuery<FeedPost[]>({
    queryKey: ["/api/feed"],
    queryFn: async () => {
      const res = await fetch("/api/feed", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; isAnonymous: boolean }) => {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to create post");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      toast({ title: "Success", description: "Post created successfully!" });
      setTitle("");
      setContent("");
      setIsAnonymous(false);
      setCreatePostOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    createPostMutation.mutate({ title, content, isAnonymous });
  };

  const likePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to like post");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const { data: replies, refetch: refetchReplies } = useQuery<Reply[]>({
    queryKey: ["/api/posts/replies", commentOpen],
    queryFn: async () => {
      if (!commentOpen) return [];
      const res = await fetch(`/api/posts/${commentOpen}/replies`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!commentOpen,
  });

  const createReplyMutation = useMutation({
    mutationFn: async ({ postId, content, isAnonymous }: { postId: number; content: string; isAnonymous: boolean }) => {
      const res = await fetch(`/api/posts/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content, isAnonymous }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to create comment");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      if (commentOpen) {
        refetchReplies();
        setCommentText("");
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleLike = (postId: number) => {
    if (!user) {
      toast({ title: "Login required", description: "Please log in to like posts", variant: "destructive" });
      return;
    }
    likePostMutation.mutate(postId);
  };

  const handleComment = (postId: number) => {
    if (!user) {
      toast({ title: "Login required", description: "Please log in to comment", variant: "destructive" });
      return;
    }
    setCommentOpen(postId);
  };

  const handleSubmitComment = (postId: number) => {
    if (!commentText.trim()) {
      toast({ title: "Error", description: "Please enter a comment", variant: "destructive" });
      return;
    }
    createReplyMutation.mutate({ postId, content: commentText, isAnonymous: false });
  };

  const handleShare = async (post: FeedPost, platform?: string) => {
    const postUrl = sitePath(`/community/forums/posts/${post.id}`);
    const text = `Check out this post: ${post.title}`;
    
    if (platform) {
      let shareUrl = "";
      switch (platform) {
        case "twitter":
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`;
          break;
        case "facebook":
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
          break;
        case "linkedin":
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
          break;
        case "whatsapp":
          shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + postUrl)}`;
          break;
        case "email":
          shareUrl = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(postUrl)}`;
          break;
        default:
          return;
      }
      if (shareUrl) {
        window.open(shareUrl, "_blank", "noopener,noreferrer");
      }
    } else {
      // Copy link
      try {
        await navigator.clipboard.writeText(postUrl);
        setCopiedPostId(post.id);
        toast({ title: "Link copied!", description: "Post link has been copied to your clipboard." });
        setTimeout(() => setCopiedPostId(null), 2000);
      } catch (err) {
        toast({ title: "Failed to copy", description: "Could not copy link to clipboard.", variant: "destructive" });
      }
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <p className="text-muted-foreground">Failed to load feed. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold mb-2">Creator Feed</h1>
          <p className="text-muted-foreground">Discover what creators in the community are sharing</p>
        </div>
        <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create a New Post</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="What's on your mind?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Share your thoughts, updates, or experiences..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(checked === true)}
                />
                <Label htmlFor="anonymous" className="cursor-pointer">
                  Post anonymously
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreatePostOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createPostMutation.isPending}>
                  {createPostMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Post
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {post.isAnonymous ? (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    ) : post.author?.profileImageUrl ? (
                      <Avatar>
                        <AvatarImage src={post.author.profileImageUrl} />
                        <AvatarFallback>
                          {post.author.firstName?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar>
                        <AvatarFallback>
                          {post.author?.firstName?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      {post.isAnonymous ? (
                        <p className="font-semibold text-sm">Anonymous Creator</p>
                      ) : (
                        <Link href={`/profile/${post.authorId}`}>
                          <p className="font-semibold hover:text-primary transition-colors cursor-pointer">
                            {post.author?.firstName} {post.author?.lastName}
                          </p>
                        </Link>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                        {post.topic && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary" className="text-xs">
                              {post.topic.name}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Link href={`/community/forums/posts/${post.id}`}>
                  <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors cursor-pointer">
                    {post.title}
                  </h3>
                </Link>
                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {post.content}
                </p>
                <div className="flex items-center gap-4 pt-4 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`gap-2 ${post.isLiked ? 'text-red-500 hover:text-red-600' : ''}`}
                    onClick={() => handleLike(post.id)}
                    disabled={likePostMutation.isPending}
                  >
                    <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                    <span>{post.likesCount || 0}</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => handleComment(post.id)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.repliesCount || 0}</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => handleShare(post)} className="cursor-pointer">
                        {copiedPostId === post.id ? (
                          <>
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleShare(post, "twitter")} className="cursor-pointer">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share on Twitter
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(post, "facebook")} className="cursor-pointer">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share on Facebook
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(post, "linkedin")} className="cursor-pointer">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share on LinkedIn
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Comments Dialog */}
                <Dialog open={commentOpen === post.id} onOpenChange={(open) => !open && setCommentOpen(null)}>
                  <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Comments</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[400px] pr-4">
                      <div className="space-y-4 mb-4">
                        {replies && replies.length > 0 ? (
                          replies.map((reply) => (
                            <div key={reply.id} className="border-b pb-4 last:border-0">
                              <div className="flex items-start gap-3">
                                {reply.isAnonymous ? (
                                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                ) : reply.author?.profileImageUrl ? (
                                  <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarImage src={reply.author.profileImageUrl} />
                                    <AvatarFallback>
                                      {reply.author.firstName?.[0] || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarFallback>
                                      {reply.author?.firstName?.[0] || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {reply.isAnonymous ? (
                                      <p className="font-semibold text-sm">Anonymous</p>
                                    ) : (
                                      <p className="font-semibold text-sm">
                                        {reply.author?.firstName} {reply.author?.lastName}
                                      </p>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{reply.content}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-sm text-center py-8">No comments yet. Be the first to comment!</p>
                        )}
                      </div>
                    </ScrollArea>
                    <div className="flex gap-2 pt-4 border-t">
                      <Textarea
                        placeholder="Write a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                      <Button
                        onClick={() => handleSubmitComment(post.id)}
                        disabled={createReplyMutation.isPending || !commentText.trim()}
                        size="sm"
                        className="self-end"
                      >
                        {createReplyMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No posts yet</h3>
          <p className="text-muted-foreground">Be the first to share something with the community!</p>
        </div>
      )}
    </div>
  );
}
