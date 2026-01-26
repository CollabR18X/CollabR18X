import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Clock } from "lucide-react";
import { Link } from "wouter";

type TimeFilter = "24h" | "week" | "month";

export default function Recent() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("24h");

  const { data: recent, isLoading } = useQuery({
    queryKey: ["/api/connections/recent", timeFilter],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/connections/recent?period=${timeFilter}`);
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

  const recentList = recent || [];

  const filterLabels = {
    "24h": "Last 24 Hours",
    "week": "Last Week",
    "month": "Last Month",
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8" />
            Recent Connections
          </h1>
          <p className="text-muted-foreground mt-1">
            View your recent interactions and connections.
          </p>
        </div>
        <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            {recentList.length ? `${recentList.length} connection${recentList.length > 1 ? 's' : ''} in ${filterLabels[timeFilter].toLowerCase()}` : `No connections in ${filterLabels[timeFilter].toLowerCase()}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent connections found.</p>
              <p className="text-sm mt-1">Your recent interactions will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentList.map((item: any) => (
                <Link
                  key={item.id}
                  href={`/profile/${item.user?.id || item.user_id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={item.user?.profileImageUrl} />
                    <AvatarFallback>
                      {(item.user?.displayName || item.user?.firstName)?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">
                      {item.user?.displayName || `${item.user?.firstName || ""} ${item.user?.lastName || ""}`.trim() || "User"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.type} • {new Date(item.created_at).toLocaleString()}
                    </p>
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
