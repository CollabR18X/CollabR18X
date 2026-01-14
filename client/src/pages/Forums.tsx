import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Heart, User, Plus, ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ForumTopic, ForumPost, PostReply, User as UserType } from "@shared/schema";

type TopicWithCount = ForumTopic & { postCount: number };
type PostWithAuthor = ForumPost & { author: UserType | null; replyCount: number };
type PostWithReplies = ForumPost & { author: UserType | null; replies: (PostReply & { author: UserType | null })[] };

function getIconComponent(icon: string) {
  const iconMap: Record<string, string> = {
    "message-square": "💬",
    "heart": "❤️",
    "camera": "📷",
    "video": "🎥",
    "music": "🎵",
    "dollar-sign": "💰",
    "users": "👥",
    "star": "⭐",
    "help-circle": "❓",
    "shield": "🛡️",
    "trending-up": "📈",
    "coffee": "☕"
  };
  return iconMap[icon] || "📝";
}

function ForumsListView() {
  const { data: topics, isLoading } = useQuery<TopicWithCount[]>({
    queryKey: ["/api/forums"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-12 w-12 rounded-full mb-4" />
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-16 w-full mb-4" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="forums-list-view">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold">Community Forums</h1>
        <p className="text-muted-foreground mt-2">Join discussions with fellow creators on various topics.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics?.map((topic) => (
          <Link key={topic.id} href={`/community/forums/${topic.id}`}>
            <Card 
              className="cursor-pointer hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              data-testid={`card-topic-${topic.id}`}
            >
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">{getIconComponent(topic.icon)}</div>
                <h3 className="font-display text-xl font-bold mb-2" data-testid={`text-topic-name-${topic.id}`}>
                  {topic.name}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-4 min-h-[60px]" data-testid={`text-topic-description-${topic.id}`}>
                  {topic.description}
                </p>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <MessageSquare className="h-4 w-4" />
                  <span data-testid={`text-post-count-${topic.id}`}>{topic.postCount} posts</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {topics?.length === 0 && (
          <div className="col-span-full text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground">No forum topics yet</h3>
            <p className="text-muted-foreground mt-2">Check back soon for community discussions.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NewPostForm({ topicId, onSuccess }: { topicId: number; onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const { toast } = useToast();

  const createPostMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; isAnonymous: boolean }) => {
      const res = await apiRequest("POST", `/api/forums/${topicId}/posts`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forums", topicId, "posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forums"] });
      toast({ title: "Post created successfully!" });
      setTitle("");
      setContent("");
      setIsAnonymous(false);
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create post", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    createPostMutation.mutate({ title, content, isAnonymous });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-new-post">
      <div>
        <Input
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          data-testid="input-post-title"
        />
      </div>
      <div>
        <Textarea
          placeholder="Share your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          data-testid="input-post-content"
        />
      </div>
      <div className="flex items-start gap-3">
        <Checkbox
          id="anonymous"
          checked={isAnonymous}
          onCheckedChange={(checked) => setIsAnonymous(checked === true)}
          data-testid="checkbox-anonymous"
        />
        <div>
          <label htmlFor="anonymous" className="text-sm font-medium cursor-pointer">
            Post anonymously
          </label>
          <p className="text-xs text-muted-foreground">
            Your identity will be hidden from other users
          </p>
        </div>
      </div>
      <Button 
        type="submit" 
        disabled={createPostMutation.isPending}
        data-testid="button-submit-post"
      >
        {createPostMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Create Post
      </Button>
    </form>
  );
}

function ForumTopicView() {
  const params = useParams<{ topicId: string }>();
  const topicId = Number(params.topicId);
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { data: topics } = useQuery<TopicWithCount[]>({
    queryKey: ["/api/forums"],
  });
  
  const topic = topics?.find(t => t.id === topicId);

  const { data: posts, isLoading: postsLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/forums", topicId, "posts", { limit, offset }],
    queryFn: async () => {
      const res = await fetch(`/api/forums/${topicId}/posts?limit=${limit}&offset=${offset}`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  const handleLoadMore = () => {
    setOffset(prev => prev + limit);
  };

  if (postsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/4 mb-4" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="forum-topic-view">
      <Link href="/community/forums">
        <Button variant="ghost" className="mb-6" data-testid="button-back-forums">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forums
        </Button>
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold" data-testid="text-topic-title">
            {topic?.name || "Forum Topic"}
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="text-topic-desc">
            {topic?.description}
          </p>
        </div>

        <Dialog open={isNewPostOpen} onOpenChange={setIsNewPostOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-post">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
            </DialogHeader>
            <NewPostForm topicId={topicId} onSuccess={() => setIsNewPostOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {posts?.map((post) => (
          <Link key={post.id} href={`/community/forums/posts/${post.id}`}>
            <Card 
              className="cursor-pointer hover:shadow-md hover:border-primary/20 transition-all"
              data-testid={`card-post-${post.id}`}
            >
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-1" data-testid={`text-post-title-${post.id}`}>
                  {post.title}
                </h3>
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                  <User className="h-3 w-3" />
                  <span data-testid={`text-post-author-${post.id}`}>
                    {post.isAnonymous || !post.author 
                      ? "Anonymous" 
                      : `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || "User"
                    }
                  </span>
                  <span>·</span>
                  <span data-testid={`text-post-time-${post.id}`}>
                    {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ""}
                  </span>
                </div>
                <p className="text-muted-foreground line-clamp-2 mb-4" data-testid={`text-post-preview-${post.id}`}>
                  {post.content}
                </p>
                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                  <span className="flex items-center gap-1" data-testid={`text-likes-count-${post.id}`}>
                    <Heart className="h-4 w-4" />
                    {post.likesCount}
                  </span>
                  <span className="flex items-center gap-1" data-testid={`text-replies-count-${post.id}`}>
                    <MessageSquare className="h-4 w-4" />
                    {post.replyCount}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {posts?.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground">No posts yet</h3>
            <p className="text-muted-foreground mt-2">Be the first to start a discussion!</p>
          </div>
        )}

        {posts && posts.length >= limit && (
          <div className="text-center py-4">
            <Button variant="outline" onClick={handleLoadMore} data-testid="button-load-more">
              Load More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReplyForm({ postId, onSuccess }: { postId: number; onSuccess: () => void }) {
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const { toast } = useToast();

  const createReplyMutation = useMutation({
    mutationFn: async (data: { content: string; isAnonymous: boolean }) => {
      const res = await apiRequest("POST", `/api/forums/posts/${postId}/replies`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forums/posts", postId] });
      toast({ title: "Reply posted!" });
      setContent("");
      setIsAnonymous(false);
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to post reply", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({ title: "Please enter a reply", variant: "destructive" });
      return;
    }
    createReplyMutation.mutate({ content, isAnonymous });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-reply">
      <Textarea
        placeholder="Write a reply..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        data-testid="input-reply-content"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            id="replyAnonymous"
            checked={isAnonymous}
            onCheckedChange={(checked) => setIsAnonymous(checked === true)}
            data-testid="checkbox-reply-anonymous"
          />
          <label htmlFor="replyAnonymous" className="text-sm cursor-pointer">
            Post anonymously
          </label>
        </div>
        <Button 
          type="submit" 
          disabled={createReplyMutation.isPending}
          data-testid="button-submit-reply"
        >
          {createReplyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Reply
        </Button>
      </div>
    </form>
  );
}

function SinglePostView() {
  const params = useParams<{ postId: string }>();
  const postId = Number(params.postId);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: post, isLoading } = useQuery<PostWithReplies>({
    queryKey: ["/api/forums/posts", postId],
    queryFn: async () => {
      const res = await fetch(`/api/forums/posts/${postId}`);
      if (!res.ok) throw new Error("Failed to fetch post");
      return res.json();
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/forums/posts/${postId}/like`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forums/posts", postId] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to like post", description: error.message, variant: "destructive" });
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/forums/posts/${postId}`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Post deleted" });
      if (post?.topicId) {
        queryClient.invalidateQueries({ queryKey: ["/api/forums", post.topicId, "posts"] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/forums"] });
      navigate("/community/forums");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete post", description: error.message, variant: "destructive" });
    }
  });

  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: number) => {
      const res = await apiRequest("DELETE", `/api/forums/replies/${replyId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forums/posts", postId] });
      toast({ title: "Reply deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete reply", description: error.message, variant: "destructive" });
    }
  });

  const isOwnPost = user?.id && post?.authorId === user.id;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/3 mb-6" />
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-8 w-24" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold">Post not found</h2>
        <Link href="/community/forums">
          <Button className="mt-4">Back to Forums</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl" data-testid="single-post-view">
      <Link href={`/community/forums/${post.topicId}`}>
        <Button variant="ghost" className="mb-6" data-testid="button-back-topic">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Topic
        </Button>
      </Link>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl" data-testid="text-post-title">
                {post.title}
              </CardTitle>
              <div className="flex items-center gap-2 text-muted-foreground text-sm mt-2">
                <User className="h-4 w-4" />
                <span data-testid="text-post-author">
                  {post.isAnonymous || !post.author 
                    ? "Anonymous" 
                    : `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || "User"
                  }
                </span>
                <span>·</span>
                <span data-testid="text-post-time">
                  {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ""}
                </span>
              </div>
            </div>
            {isOwnPost && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deletePostMutation.mutate()}
                disabled={deletePostMutation.isPending}
                data-testid="button-delete-post"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap mb-6" data-testid="text-post-content">
            {post.content}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => likePostMutation.mutate()}
            disabled={likePostMutation.isPending}
            data-testid="button-like-post"
          >
            <Heart className="h-4 w-4 mr-2" />
            <span data-testid="text-like-count">{post.likesCount}</span>
          </Button>
        </CardContent>
      </Card>

      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-4">
          Replies ({post.replies?.length || 0})
        </h3>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <ReplyForm postId={postId} onSuccess={() => {}} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {post.replies?.map((reply) => {
            const isOwnReply = user?.id && reply.authorId === user.id;
            return (
              <Card key={reply.id} data-testid={`card-reply-${reply.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <User className="h-3 w-3" />
                      <span data-testid={`text-reply-author-${reply.id}`}>
                        {reply.isAnonymous || !reply.author 
                          ? "Anonymous" 
                          : `${reply.author.firstName || ""} ${reply.author.lastName || ""}`.trim() || "User"
                        }
                      </span>
                      <span>·</span>
                      <span data-testid={`text-reply-time-${reply.id}`}>
                        {reply.createdAt ? formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true }) : ""}
                      </span>
                    </div>
                    {isOwnReply && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteReplyMutation.mutate(reply.id)}
                        disabled={deleteReplyMutation.isPending}
                        data-testid={`button-delete-reply-${reply.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap" data-testid={`text-reply-content-${reply.id}`}>
                    {reply.content}
                  </p>
                </CardContent>
              </Card>
            );
          })}

          {(!post.replies || post.replies.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No replies yet. Be the first to respond!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Forums() {
  const params = useParams<{ topicId?: string; postId?: string }>();
  
  const path = window.location.pathname;
  
  if (path.includes("/community/forums/posts/") && params.postId) {
    return <SinglePostView />;
  }
  
  if (path.includes("/community/forums/") && params.topicId && !path.includes("/posts/")) {
    return <ForumTopicView />;
  }
  
  return <ForumsListView />;
}
