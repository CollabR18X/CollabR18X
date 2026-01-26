import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, BarChart3, TrendingUp, Users, Heart, MessageSquare, FileText, Handshake, Eye, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Statistics() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["/api/statistics"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/statistics");
      return res.json();
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load statistics. Please try again later.</p>
          <p className="text-sm text-muted-foreground">If this problem persists, please contact support.</p>
        </div>
      </div>
    );
  }

  const statistics = stats || {};

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Statistics
        </h1>
        <p className="text-muted-foreground mt-1">
          View your activity and engagement metrics on the platform.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Profile Views */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.profileViews || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total views of your profile
            </p>
          </CardContent>
        </Card>

        {/* Likes Received */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Likes Received</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.likesReceived || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              People who liked your profile
            </p>
          </CardContent>
        </Card>

        {/* Likes Sent */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Likes Sent</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.likesSent || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Profiles you've liked
            </p>
          </CardContent>
        </Card>

        {/* Matches */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matches</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.matches || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Mutual matches you've made
            </p>
          </CardContent>
        </Card>

        {/* Messages Sent */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.messagesSent || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total messages you've sent
            </p>
          </CardContent>
        </Card>

        {/* Messages Received */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Received</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.messagesReceived || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Messages you've received
            </p>
          </CardContent>
        </Card>

        {/* Posts Created */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts Created</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.postsCreated || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Forum posts you've created
            </p>
          </CardContent>
        </Card>

        {/* Collaborations */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collaborations</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.collaborations || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active collaborations
            </p>
          </CardContent>
        </Card>

        {/* Followers */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Followers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.followers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Users following you
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
            <CardDescription>
              Your recent activity on the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Account Created</span>
              <span className="text-sm font-medium">
                {statistics.accountCreatedAt 
                  ? formatDistanceToNow(new Date(statistics.accountCreatedAt), { addSuffix: true })
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Active</span>
              <span className="text-sm font-medium">
                {statistics.lastActive 
                  ? formatDistanceToNow(new Date(statistics.lastActive), { addSuffix: true })
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Profile Completion</span>
              <span className="text-sm font-medium">
                {statistics.profileCompletion || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Response Rate</span>
              <span className="text-sm font-medium">
                {statistics.responseRate || 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
            <CardDescription>
              How others interact with your content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Post Likes</span>
              <span className="text-sm font-medium">
                {statistics.postLikes || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Post Replies</span>
              <span className="text-sm font-medium">
                {statistics.postReplies || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Collaboration Requests Sent</span>
              <span className="text-sm font-medium">
                {statistics.collaborationRequestsSent || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Collaboration Requests Received</span>
              <span className="text-sm font-medium">
                {statistics.collaborationRequestsReceived || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
