import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { 
  AlertTriangle, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink, 
  Plus, 
  ArrowLeft,
  Loader2,
  X,
  UserX,
  MessageSquareWarning
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SafetyAlert, User as UserType } from "@shared/schema";

type SafetyAlertWithReporter = SafetyAlert & { reporter: UserType };

const ALERT_TYPES = {
  scam: { label: "Scam", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: AlertTriangle },
  impersonator: { label: "Impersonator", color: "bg-orange-500/10 text-orange-600 border-orange-500/20", icon: UserX },
  harassment: { label: "Harassment", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: MessageSquareWarning },
  other: { label: "Other", color: "bg-gray-500/10 text-gray-600 border-gray-500/20", icon: AlertCircle },
} as const;

type AlertType = keyof typeof ALERT_TYPES;

function getAlertTypeConfig(type: string) {
  return ALERT_TYPES[type as AlertType] || ALERT_TYPES.other;
}

function AlertsListView() {
  const [filter, setFilter] = useState<"all" | AlertType>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const { data: alerts, isLoading } = useQuery<SafetyAlertWithReporter[]>({
    queryKey: ["/api/safety-alerts", { filter }],
    queryFn: async () => {
      let url = "/api/safety-alerts";
      if (filter !== "all") {
        url += `?alertType=${filter}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <Skeleton className="h-24 w-full mb-6" />
        <Skeleton className="h-10 w-80 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="safety-alerts-list-view">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold">Safety Alerts</h1>
          <p className="text-muted-foreground mt-2">Community-reported safety concerns and warnings.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-report-alert">
              <Plus className="h-4 w-4 mr-2" />
              Report Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Report Safety Alert</DialogTitle>
            </DialogHeader>
            <ReportAlertForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Alert className="mb-6 border-yellow-500/30 bg-yellow-500/5" data-testid="alert-warning-banner">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-sm text-muted-foreground">
          This section contains community-reported safety alerts to help protect members from scams, impersonators, and harassment. 
          Always verify information independently and exercise caution when engaging with unfamiliar accounts.
        </AlertDescription>
      </Alert>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
        <TabsList data-testid="tabs-filter">
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          <TabsTrigger value="scam" data-testid="tab-scams">Scams</TabsTrigger>
          <TabsTrigger value="impersonator" data-testid="tab-impersonators">Impersonators</TabsTrigger>
          <TabsTrigger value="harassment" data-testid="tab-harassment">Harassment</TabsTrigger>
          <TabsTrigger value="other" data-testid="tab-other">Other</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {alerts?.map((alert) => {
          const typeConfig = getAlertTypeConfig(alert.alertType);
          const TypeIcon = typeConfig.icon;
          
          return (
            <Link key={alert.id} href={`/community/safety/${alert.id}`}>
              <Card 
                className="cursor-pointer hover:shadow-lg hover:border-primary/20 transition-all duration-300"
                data-testid={`card-alert-${alert.id}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="outline" className={typeConfig.color} data-testid={`badge-type-${alert.id}`}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {typeConfig.label}
                        </Badge>
                        {alert.isVerified && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20" data-testid={`badge-verified-${alert.id}`}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        {alert.isResolved && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20" data-testid={`badge-resolved-${alert.id}`}>
                            <Shield className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-1" data-testid={`text-title-${alert.id}`}>
                        {alert.title}
                      </h3>
                      
                      <p className="text-muted-foreground text-sm line-clamp-2" data-testid={`text-description-${alert.id}`}>
                        {alert.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={alert.reporter?.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {alert.reporter?.firstName?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground" data-testid={`text-reporter-${alert.id}`}>
                        {alert.reporter?.firstName || "Anonymous"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground" data-testid={`text-time-${alert.id}`}>
                      {alert.createdAt ? formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true }) : ""}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}

        {alerts?.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground">No alerts found</h3>
            <p className="text-muted-foreground mt-2">
              {filter === "all" 
                ? "No safety alerts have been reported yet." 
                : `No ${ALERT_TYPES[filter as AlertType]?.label.toLowerCase() || filter} alerts found.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportAlertForm({ onSuccess }: { onSuccess: () => void }) {
  const [alertType, setAlertType] = useState<AlertType>("scam");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [suspectName, setSuspectName] = useState("");
  const [suspectHandle, setSuspectHandle] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([""]);
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: {
      alertType: string;
      title: string;
      description: string;
      suspectName?: string;
      suspectHandle?: string;
      evidenceUrls?: string[];
    }) => {
      const res = await apiRequest("POST", "/api/safety-alerts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/safety-alerts"] });
      toast({ title: "Safety alert reported successfully!" });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to report alert", description: error.message, variant: "destructive" });
    }
  });

  const handleAddEvidenceUrl = () => {
    setEvidenceUrls([...evidenceUrls, ""]);
  };

  const handleRemoveEvidenceUrl = (index: number) => {
    setEvidenceUrls(evidenceUrls.filter((_, i) => i !== index));
  };

  const handleEvidenceUrlChange = (index: number, value: string) => {
    const newUrls = [...evidenceUrls];
    newUrls[index] = value;
    setEvidenceUrls(newUrls);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const filteredUrls = evidenceUrls.filter(url => url.trim() !== "");

    createMutation.mutate({
      alertType,
      title,
      description,
      suspectName: suspectName.trim() || undefined,
      suspectHandle: suspectHandle.trim() || undefined,
      evidenceUrls: filteredUrls.length > 0 ? filteredUrls : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-report-alert">
      <div>
        <Label htmlFor="alertType">Alert Type *</Label>
        <Select value={alertType} onValueChange={(v) => setAlertType(v as AlertType)}>
          <SelectTrigger data-testid="select-alert-type">
            <SelectValue placeholder="Select alert type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scam" data-testid="option-scam">Scam</SelectItem>
            <SelectItem value="impersonator" data-testid="option-impersonator">Impersonator</SelectItem>
            <SelectItem value="harassment" data-testid="option-harassment">Harassment</SelectItem>
            <SelectItem value="other" data-testid="option-other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Brief summary of the alert"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          data-testid="input-title"
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe the safety concern in detail..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          data-testid="input-description"
        />
      </div>

      <div>
        <Label htmlFor="suspectName">Suspect Name (optional)</Label>
        <Input
          id="suspectName"
          placeholder="Name of the suspected individual"
          value={suspectName}
          onChange={(e) => setSuspectName(e.target.value)}
          data-testid="input-suspect-name"
        />
      </div>

      <div>
        <Label htmlFor="suspectHandle">Suspect Handle/Username (optional)</Label>
        <Input
          id="suspectHandle"
          placeholder="@username or profile link"
          value={suspectHandle}
          onChange={(e) => setSuspectHandle(e.target.value)}
          data-testid="input-suspect-handle"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Evidence URLs (optional)</Label>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={handleAddEvidenceUrl}
            data-testid="button-add-evidence"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add URL
          </Button>
        </div>
        <div className="space-y-2">
          {evidenceUrls.map((url, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => handleEvidenceUrlChange(index, e.target.value)}
                data-testid={`input-evidence-url-${index}`}
              />
              {evidenceUrls.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveEvidenceUrl(index)}
                  data-testid={`button-remove-evidence-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={createMutation.isPending}
        data-testid="button-submit-alert"
      >
        {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Submit Alert
      </Button>
    </form>
  );
}

function SingleAlertView() {
  const params = useParams<{ id: string }>();
  const alertId = Number(params.id);
  const [, navigate] = useLocation();

  const { data: alert, isLoading } = useQuery<SafetyAlertWithReporter>({
    queryKey: ["/api/safety-alerts", alertId],
    queryFn: async () => {
      const res = await fetch(`/api/safety-alerts/${alertId}`);
      if (!res.ok) throw new Error("Failed to fetch alert");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-8 w-48" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold">Alert not found</h2>
        <Link href="/community/safety">
          <Button className="mt-4">Back to Alerts</Button>
        </Link>
      </div>
    );
  }

  const typeConfig = getAlertTypeConfig(alert.alertType);
  const TypeIcon = typeConfig.icon;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" data-testid="single-alert-view">
      <Link href="/community/safety">
        <Button variant="ghost" className="mb-6" data-testid="button-back-alerts">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Alerts
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={typeConfig.color} data-testid="badge-alert-type">
                <TypeIcon className="h-4 w-4 mr-1" />
                {typeConfig.label}
              </Badge>
              {alert.isVerified && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20" data-testid="badge-verified">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Verified by Moderators
                </Badge>
              )}
              {alert.isResolved && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20" data-testid="badge-resolved">
                  <Shield className="h-4 w-4 mr-1" />
                  Resolved
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground" data-testid="text-time">
              {alert.createdAt ? formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true }) : ""}
            </span>
          </div>
          <CardTitle className="text-2xl mt-4" data-testid="text-alert-title">
            {alert.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap" data-testid="text-alert-description">
              {alert.description}
            </p>
          </div>

          {(alert.suspectName || alert.suspectHandle) && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50" data-testid="section-suspect-info">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <UserX className="h-5 w-5 text-muted-foreground" />
                Suspect Information
              </h3>
              <div className="space-y-2 text-sm">
                {alert.suspectName && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium" data-testid="text-suspect-name">{alert.suspectName}</span>
                  </div>
                )}
                {alert.suspectHandle && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Handle:</span>
                    <span className="font-medium" data-testid="text-suspect-handle">{alert.suspectHandle}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {alert.evidenceUrls && alert.evidenceUrls.length > 0 && (
            <div data-testid="section-evidence">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
                Evidence Links
              </h3>
              <div className="space-y-2">
                {alert.evidenceUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline text-sm"
                    data-testid={`link-evidence-${index}`}
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    <span className="truncate">{url}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border/50">
            <h3 className="font-semibold mb-3">Reported by</h3>
            <div className="flex items-center gap-3" data-testid="section-reporter">
              <Avatar className="h-10 w-10">
                <AvatarImage src={alert.reporter?.profileImageUrl || undefined} />
                <AvatarFallback>
                  {alert.reporter?.firstName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium" data-testid="text-reporter-name">
                  {alert.reporter?.firstName} {alert.reporter?.lastName}
                </p>
                <p className="text-sm text-muted-foreground">Community Member</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SafetyAlerts() {
  const params = useParams<{ id: string }>();
  
  if (params.id) {
    return <SingleAlertView />;
  }
  
  return <AlertsListView />;
}
