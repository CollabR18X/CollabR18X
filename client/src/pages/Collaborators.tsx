import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Users } from "lucide-react";
import { Link } from "wouter";

export default function Collaborators() {
  const { data: collaborations, isLoading } = useQuery({
    queryKey: ["/api/collaborations"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/collaborations");
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

  const collaborators = collaborations || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          Collaborators
        </h1>
        <p className="text-muted-foreground mt-1">
          View and manage your active collaborations with other creators.
        </p>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>Your Collaborations</CardTitle>
          <CardDescription>
            {collaborators.length ? `${collaborators.length} active collaboration${collaborators.length > 1 ? 's' : ''}` : 'No active collaborations'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {collaborators.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>You don't have any active collaborations yet.</p>
              <p className="text-sm mt-1">Start collaborating with other creators to see them here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {collaborators.map((collab: any) => (
                <Link
                  key={collab.id}
                  href={`/collaborations/${collab.id}/workspace`}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={collab.partner?.profileImageUrl} />
                      <AvatarFallback>
                        {(collab.partner?.displayName || collab.partner?.firstName)?.[0] || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {collab.partner?.displayName || `${collab.partner?.firstName || ""} ${collab.partner?.lastName || ""}`.trim() || "Collaborator"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: <span className="capitalize">{collab.status}</span>
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
