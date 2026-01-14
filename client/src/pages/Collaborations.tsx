import { useCollaborations, useUpdateCollaborationStatus, useAcknowledgeCollaboration } from "@/hooks/use-collaborations";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X, Clock, MessageSquare, User, Calendar, Shield, CheckCircle, AlertTriangle, Lock } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Collaborations() {
  const { user } = useAuth();
  const { data: collabs, isLoading } = useCollaborations();
  const { mutate: updateStatus, isPending } = useUpdateCollaborationStatus();
  const { mutate: acknowledge, isPending: isAcknowledging } = useAcknowledgeCollaboration();
  const [acknowledgementDialog, setAcknowledgementDialog] = useState<{
    open: boolean;
    collabId: number | null;
    otherUserName: string;
  }>({ open: false, collabId: null, otherUserName: "" });
  const [acceptedChecks, setAcceptedChecks] = useState<{ understand: boolean; respect: boolean }>({ understand: false, respect: false });

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

  const needsAcknowledgement = (collab: any) => {
    if (collab.status !== 'accepted') return false;
    const isRequester = collab.requesterId === user?.id;
    return isRequester ? !collab.acknowledgedByRequester : !collab.acknowledgedByReceiver;
  };

  const isFullyAcknowledged = (collab: any) => {
    return collab.status === 'accepted' && collab.acknowledgedByRequester && collab.acknowledgedByReceiver;
  };

  const handleOpenAcknowledgement = (collab: any) => {
    const otherUser = collab.requesterId === user?.id ? collab.receiver : collab.requester;
    setAcknowledgementDialog({
      open: true,
      collabId: collab.id,
      otherUserName: otherUser.firstName || "Creator",
    });
    setAcceptedChecks({ understand: false, respect: false });
  };

  const handleAcknowledge = () => {
    if (acknowledgementDialog.collabId) {
      acknowledge(acknowledgementDialog.collabId);
      setAcknowledgementDialog({ open: false, collabId: null, otherUserName: "" });
    }
  };

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
              <RequestCard 
                key={collab.id} 
                collab={collab} 
                type="active" 
                needsAcknowledgement={needsAcknowledgement(collab)}
                isFullyAcknowledged={isFullyAcknowledged(collab)}
                onAcknowledge={() => handleOpenAcknowledgement(collab)}
              />
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

      <Dialog open={acknowledgementDialog.open} onOpenChange={(open) => setAcknowledgementDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Acknowledge Collaboration Terms
            </DialogTitle>
            <DialogDescription>
              Before the collaboration workspace activates, please confirm you understand the terms.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted/30 p-4 rounded-lg border">
              <h4 className="text-sm font-medium mb-2">Collaboration Guidelines</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  Respect all boundaries set by {acknowledgementDialog.otherUserName}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  Communicate clearly and professionally
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  Follow agreed-upon safety requirements
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                  Report any concerning behavior immediately
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={acceptedChecks.understand}
                  onCheckedChange={(checked) => setAcceptedChecks(prev => ({ ...prev, understand: checked === true }))}
                  data-testid="checkbox-acknowledge-understand"
                />
                <span className="text-sm">I understand the collaboration terms</span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={acceptedChecks.respect}
                  onCheckedChange={(checked) => setAcceptedChecks(prev => ({ ...prev, respect: checked === true }))}
                  data-testid="checkbox-acknowledge-respect"
                />
                <span className="text-sm">I agree to respect {acknowledgementDialog.otherUserName}'s preferences and boundaries</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAcknowledgementDialog({ open: false, collabId: null, otherUserName: "" })}>
              Cancel
            </Button>
            <Button 
              onClick={handleAcknowledge} 
              disabled={!acceptedChecks.understand || !acceptedChecks.respect || isAcknowledging}
              data-testid="button-acknowledge-collab"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isAcknowledging ? "Acknowledging..." : "Acknowledge Terms"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RequestCard({ collab, type, onAccept, onReject, isProcessing, needsAcknowledgement, isFullyAcknowledged, onAcknowledge }: any) {
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
              <CardTitle className="text-lg font-bold flex items-center gap-2 flex-wrap">
                {otherUser.firstName} {otherUser.lastName}
                {type === 'outgoing' && <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">Pending</Badge>}
                {type === 'active' && isFullyAcknowledged && (
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                )}
                {type === 'active' && !isFullyAcknowledged && (
                  <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending Acknowledgement
                  </Badge>
                )}
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
          <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            {needsAcknowledgement && (
              <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg">
                <Shield className="h-4 w-4" />
                <span>Please acknowledge the collaboration terms to activate workspace</span>
              </div>
            )}
            {!isFullyAcknowledged && !needsAcknowledgement && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Waiting for {otherUser.firstName} to acknowledge</span>
              </div>
            )}
            {isFullyAcknowledged && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Both parties have acknowledged - workspace active</span>
              </div>
            )}
            <div className="flex gap-2">
              {needsAcknowledgement && (
                <Button 
                  size="sm" 
                  onClick={onAcknowledge}
                  data-testid={`button-acknowledge-${collab.id}`}
                >
                  <Shield className="w-4 h-4 mr-2" /> Acknowledge Terms
                </Button>
              )}
              {isFullyAcknowledged && (
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" /> Open Chat
                </Button>
              )}
            </div>
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
