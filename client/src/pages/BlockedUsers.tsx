import { useBlocks, useUnblockUser } from "@/hooks/use-blocks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, ShieldOff, UserX } from "lucide-react";

export default function BlockedUsers() {
  const { data: blocks, isLoading } = useBlocks();
  const { mutate: unblock, isPending } = useUnblockUser();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <ShieldOff className="h-8 w-8" />
          Blocked Users
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage users you've blocked. Blocked users cannot see your profile or message you.
        </p>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>Your Blocked List</CardTitle>
          <CardDescription>
            {blocks?.length ? `${blocks.length} user${blocks.length > 1 ? 's' : ''} blocked` : 'No blocked users'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blocks?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserX className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>You haven't blocked anyone yet.</p>
              <p className="text-sm mt-1">When you block someone, they'll appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blocks?.map((block: any) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  data-testid={`row-blocked-user-${block.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={block.blocked?.profileImageUrl} />
                      <AvatarFallback>
                        {block.blocked?.firstName?.[0] || block.blocked?.username?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {block.blocked?.firstName && block.blocked?.lastName
                          ? `${block.blocked.firstName} ${block.blocked.lastName}`
                          : block.blocked?.username || 'Unknown User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Blocked on {new Date(block.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unblock(block.id)}
                    disabled={isPending}
                    data-testid={`button-unblock-${block.id}`}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Unblock'
                    )}
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
