import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Shield, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Restricted() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [restrictions, setRestrictions] = useState({
    noMessages: false,
    noProfileView: false,
    noCollaborations: false,
  });

  const { data: restricted, isLoading } = useQuery({
    queryKey: ["/api/connections/restricted"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/connections/restricted");
      return res.json();
    },
  });

  const updateRestrictionsMutation = useMutation({
    mutationFn: async ({ userId, restrictions }: { userId: string; restrictions: any }) => {
      const res = await apiRequest("PUT", `/api/connections/restricted/${userId}`, { restrictions });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections/restricted"] });
      toast({ title: "Restrictions updated", description: "User restrictions have been updated." });
      setEditingUser(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const unrestrictMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/connections/restricted/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections/restricted"] });
      toast({ title: "User unrestricted", description: "All restrictions have been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setRestrictions({
      noMessages: user.restrictions?.noMessages || false,
      noProfileView: user.restrictions?.noProfileView || false,
      noCollaborations: user.restrictions?.noCollaborations || false,
    });
  };

  const handleSave = () => {
    if (editingUser) {
      updateRestrictionsMutation.mutate({
        userId: editingUser.restricted_user?.id || editingUser.restricted_user_id,
        restrictions,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  const restrictedList = restricted || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Restricted Users
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage users you've restricted. You can control what restricted users can and cannot do.
        </p>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>Your Restricted List</CardTitle>
          <CardDescription>
            {restrictedList.length ? `${restrictedList.length} user${restrictedList.length > 1 ? 's' : ''} restricted` : 'No restricted users'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {restrictedList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>You haven't restricted anyone yet.</p>
              <p className="text-sm mt-1">When you restrict someone, they'll appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {restrictedList.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <Link
                    href={`/profile/${item.restricted_user?.id || item.restricted_user_id}`}
                    className="flex items-center gap-3 flex-1 hover:bg-muted/50 transition-colors rounded-lg p-2 -m-2"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={item.restricted_user?.profileImageUrl} />
                      <AvatarFallback>
                        {(item.restricted_user?.displayName || item.restricted_user?.firstName)?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.restricted_user?.displayName || `${item.restricted_user?.firstName || ""} ${item.restricted_user?.lastName || ""}`.trim() || "User"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {item.restrictions?.noMessages && (
                          <span className="px-2 py-0.5 bg-muted rounded">No Messages</span>
                        )}
                        {item.restrictions?.noProfileView && (
                          <span className="px-2 py-0.5 bg-muted rounded">No Profile View</span>
                        )}
                        {item.restrictions?.noCollaborations && (
                          <span className="px-2 py-0.5 bg-muted rounded">No Collaborations</span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Restrictions</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="noMessages"
                              checked={restrictions.noMessages}
                              onCheckedChange={(checked) =>
                                setRestrictions({ ...restrictions, noMessages: checked as boolean })
                              }
                            />
                            <label
                              htmlFor="noMessages"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Cannot send messages
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="noProfileView"
                              checked={restrictions.noProfileView}
                              onCheckedChange={(checked) =>
                                setRestrictions({ ...restrictions, noProfileView: checked as boolean })
                              }
                            />
                            <label
                              htmlFor="noProfileView"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Cannot view your profile
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="noCollaborations"
                              checked={restrictions.noCollaborations}
                              onCheckedChange={(checked) =>
                                setRestrictions({ ...restrictions, noCollaborations: checked as boolean })
                              }
                            />
                            <label
                              htmlFor="noCollaborations"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Cannot request collaborations
                            </label>
                          </div>
                          <div className="flex justify-end gap-2 pt-4">
                            <Button
                              variant="outline"
                              onClick={() => setEditingUser(null)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={updateRestrictionsMutation.isPending}>
                              Save Restrictions
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unrestrictMutation.mutate(item.restricted_user?.id || item.restricted_user_id)}
                      disabled={unrestrictMutation.isPending}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
