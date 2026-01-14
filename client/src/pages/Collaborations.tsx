import { useCollaborations, useUpdateCollaborationStatus } from "@/hooks/use-collaborations";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Clock, MessageSquare, User, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function Collaborations() {
  const { user } = useAuth();
  const { data: collabs, isLoading } = useCollaborations();
  const { mutate: updateStatus, isPending } = useUpdateCollaborationStatus();

  if (isLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  const incoming = collabs?.filter(c => c.receiverId === user.id && c.status === 'pending') || [];
  const outgoing = collabs?.filter(c => c.requesterId === user.id && c.status === 'pending') || [];
  const active = collabs?.filter(c => c.status === 'accepted') || [];
  const history = collabs?.filter(c => c.status === 'rejected') || [];

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Collaborations</h1>
        <p className="text-muted-foreground">Manage your requests and active projects.</p>
      </div>

      <Tabs defaultValue="incoming" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="incoming" className="rounded-lg">Incoming ({incoming.length})</TabsTrigger>
          <TabsTrigger value="outgoing" className="rounded-lg">Outgoing ({outgoing.length})</TabsTrigger>
          <TabsTrigger value="active" className="rounded-lg">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg">History</TabsTrigger>
        </TabsList>

        {/* Incoming Requests Tab */}
        <TabsContent value="incoming" className="space-y-4">
          {incoming.length === 0 ? (
            <EmptyState message="No incoming requests right now." />
          ) : (
            incoming.map(collab => (
              <RequestCard 
                key={collab.id} 
                collab={collab} 
                type="incoming" 
                onAccept={() => updateStatus({ id: collab.id, status: 'accepted' })}
                onReject={() => updateStatus({ id: collab.id, status: 'rejected' })}
                isProcessing={isPending}
              />
            ))
          )}
        </TabsContent>

        {/* Outgoing Requests Tab */}
        <TabsContent value="outgoing" className="space-y-4">
          {outgoing.length === 0 ? (
            <EmptyState message="You haven't sent any requests." />
          ) : (
            outgoing.map(collab => (
              <RequestCard key={collab.id} collab={collab} type="outgoing" />
            ))
          )}
        </TabsContent>

        {/* Active Tab */}
        <TabsContent value="active" className="space-y-4">
          {active.length === 0 ? (
            <EmptyState message="No active collaborations yet." />
          ) : (
            active.map(collab => (
              <RequestCard key={collab.id} collab={collab} type="active" />
            ))
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {history.length === 0 ? (
            <EmptyState message="No past collaborations." />
          ) : (
            history.map(collab => (
              <RequestCard key={collab.id} collab={collab} type="history" />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequestCard({ collab, type, onAccept, onReject, isProcessing }: any) {
  const { user } = useAuth();
  const otherUser = collab.requesterId === user?.id ? collab.receiver : collab.requester;
  const isIncoming = type === 'incoming';

  return (
    <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            {otherUser.profileImageUrl ? (
              <img src={otherUser.profileImageUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {otherUser.firstName?.[0]}
              </div>
            )}
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                {otherUser.firstName} {otherUser.lastName}
                {type === 'outgoing' && <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">Pending</Badge>}
                {type === 'active' && <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>}
                {type === 'history' && <Badge variant="outline" className="text-muted-foreground">Rejected</Badge>}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Calendar className="w-3 h-3" /> {format(new Date(collab.createdAt), 'PPP')}
              </CardDescription>
            </div>
          </div>
          
          {isIncoming && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onReject}
                disabled={isProcessing}
              >
                <X className="w-4 h-4 mr-1" /> Reject
              </Button>
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={onAccept}
                disabled={isProcessing}
              >
                <Check className="w-4 h-4 mr-1" /> Accept
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/30 p-4 rounded-lg text-sm border border-border/50">
          <div className="flex items-center gap-2 text-primary font-semibold mb-2">
            <MessageSquare className="w-4 h-4" /> Message:
          </div>
          <p className="text-muted-foreground leading-relaxed">"{collab.message}"</p>
        </div>
        
        {type === 'active' && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm">
              <MessageSquare className="w-4 h-4 mr-2" /> Open Chat
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
