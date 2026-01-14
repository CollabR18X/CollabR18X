import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCollaborations, useWorkspace, useUpdateWorkspace, useAcknowledgeWorkspaceBoundaries } from "@/hooks/use-collaborations";
import { useProfiles } from "@/hooks/use-profiles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  Users,
  Lightbulb,
  CalendarDays,
  MapPin,
  Briefcase,
  DollarSign,
  Shield,
  FlaskConical,
  FileText,
  Download,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  CalendarIcon
} from "lucide-react";
import type { CollaborationWorkspace as WorkspaceType, Profile, User } from "@shared/schema";

type ShootDate = { date: string; time?: string; description?: string };
type Role = { userId: string; role: string; responsibilities: string[] };
type RevenueSplit = {
  type: 'equal' | 'percentage' | 'fixed';
  splits: { userId: string; percentage?: number; fixedAmount?: number }[];
};

export default function CollaborationWorkspace() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const collaborationId = Number(id);
  
  const { data: collabs, isLoading: collabsLoading } = useCollaborations();
  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(collaborationId);
  const { mutate: updateWorkspace } = useUpdateWorkspace();
  const { mutate: acknowledgeBoundaries, isPending: isAcknowledging } = useAcknowledgeWorkspaceBoundaries();
  const { data: profiles } = useProfiles();

  const collaboration = collabs?.find(c => c.id === collaborationId);
  const requester = collaboration?.requester;
  const receiver = collaboration?.receiver;
  
  const requesterProfile = profiles?.find(p => p.userId === requester?.id);
  const receiverProfile = profiles?.find(p => p.userId === receiver?.id);

  const [concept, setConcept] = useState("");
  const [shootDates, setShootDates] = useState<ShootDate[]>([]);
  const [location, setLocation] = useState("");
  const [locationDetails, setLocationDetails] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [revenueSplit, setRevenueSplit] = useState<RevenueSplit>({ type: 'equal', splits: [] });
  const [testingConfirmed, setTestingConfirmed] = useState(false);
  const [testingNotes, setTestingNotes] = useState("");
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);

  useEffect(() => {
    if (workspace) {
      setConcept(workspace.concept || "");
      setShootDates(workspace.shootDates || []);
      setLocation(workspace.location || "");
      setLocationDetails(workspace.locationDetails || "");
      setRoles(workspace.roles || []);
      setRevenueSplit(workspace.revenueSplit || { type: 'equal', splits: [] });
      setTestingConfirmed(workspace.testingDiscussionConfirmed || false);
      setTestingNotes(workspace.testingDiscussionNotes || "");
      setNotes(workspace.notes || "");
      setAttachments(workspace.attachments || []);
    }
  }, [workspace]);

  useEffect(() => {
    if (requester && receiver && roles.length === 0) {
      setRoles([
        { userId: requester.id, role: "", responsibilities: [] },
        { userId: receiver.id, role: "", responsibilities: [] }
      ]);
    }
    if (requester && receiver && revenueSplit.splits.length === 0) {
      setRevenueSplit({
        type: 'equal',
        splits: [
          { userId: requester.id, percentage: 50 },
          { userId: receiver.id, percentage: 50 }
        ]
      });
    }
  }, [requester, receiver, roles.length, revenueSplit.splits.length]);

  const saveField = (field: string, value: any) => {
    updateWorkspace({ collaborationId, data: { [field]: value } });
  };

  const isLoading = collabsLoading || workspaceLoading;
  
  if (isLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  if (!collaboration) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Collaboration not found.</p>
            <Button onClick={() => navigate("/collaborations")} className="mt-4" data-testid="button-back-to-collaborations">
              Back to Collaborations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isFullyAcknowledged = collaboration.acknowledgedByRequester && collaboration.acknowledgedByReceiver;
  const otherUser = collaboration.requesterId === user.id ? receiver : requester;
  const otherProfile = collaboration.requesterId === user.id ? receiverProfile : requesterProfile;
  const myProfile = collaboration.requesterId === user.id ? requesterProfile : receiverProfile;
  
  const boundariesAck = workspace?.boundariesAcknowledged || { user1Acknowledged: false, user2Acknowledged: false };
  const isUser1 = collaboration.requesterId === user.id;
  const myBoundariesAcknowledged = isUser1 ? boundariesAck.user1Acknowledged : boundariesAck.user2Acknowledged;
  const otherBoundariesAcknowledged = isUser1 ? boundariesAck.user2Acknowledged : boundariesAck.user1Acknowledged;

  const addShootDate = () => {
    const newDates = [...shootDates, { date: new Date().toISOString().split('T')[0], description: "" }];
    setShootDates(newDates);
    saveField('shootDates', newDates);
  };

  const removeShootDate = (index: number) => {
    const newDates = shootDates.filter((_, i) => i !== index);
    setShootDates(newDates);
    saveField('shootDates', newDates);
  };

  const updateShootDate = (index: number, field: keyof ShootDate, value: string) => {
    const newDates = [...shootDates];
    newDates[index] = { ...newDates[index], [field]: value };
    setShootDates(newDates);
  };

  const saveShootDates = () => {
    const sorted = [...shootDates].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setShootDates(sorted);
    saveField('shootDates', sorted);
  };

  const updateRole = (userId: string, field: 'role' | 'responsibilities', value: any) => {
    const newRoles = roles.map(r => r.userId === userId ? { ...r, [field]: value } : r);
    setRoles(newRoles);
  };

  const saveRoles = () => saveField('roles', roles);

  const addResponsibility = (userId: string) => {
    const newRoles = roles.map(r => 
      r.userId === userId 
        ? { ...r, responsibilities: [...r.responsibilities, ""] }
        : r
    );
    setRoles(newRoles);
  };

  const updateResponsibility = (userId: string, index: number, value: string) => {
    const newRoles = roles.map(r => {
      if (r.userId === userId) {
        const newResponsibilities = [...r.responsibilities];
        newResponsibilities[index] = value;
        return { ...r, responsibilities: newResponsibilities };
      }
      return r;
    });
    setRoles(newRoles);
  };

  const removeResponsibility = (userId: string, index: number) => {
    const newRoles = roles.map(r => {
      if (r.userId === userId) {
        return { ...r, responsibilities: r.responsibilities.filter((_, i) => i !== index) };
      }
      return r;
    });
    setRoles(newRoles);
    saveField('roles', newRoles);
  };

  const updateRevenueSplitType = (type: 'equal' | 'percentage' | 'fixed') => {
    let newSplits = revenueSplit.splits;
    if (type === 'equal') {
      newSplits = newSplits.map(s => ({ ...s, percentage: 50, fixedAmount: undefined }));
    } else if (type === 'percentage') {
      newSplits = newSplits.map(s => ({ ...s, fixedAmount: undefined }));
    } else {
      newSplits = newSplits.map(s => ({ ...s, percentage: undefined }));
    }
    const newRevenue = { type, splits: newSplits };
    setRevenueSplit(newRevenue);
    saveField('revenueSplit', newRevenue);
  };

  const updateSplitValue = (userId: string, field: 'percentage' | 'fixedAmount', value: number) => {
    const newSplits = revenueSplit.splits.map(s => 
      s.userId === userId ? { ...s, [field]: value } : s
    );
    const newRevenue = { ...revenueSplit, splits: newSplits };
    setRevenueSplit(newRevenue);
  };

  const saveRevenueSplit = () => saveField('revenueSplit', revenueSplit);

  const totalPercentage = revenueSplit.splits.reduce((sum, s) => sum + (s.percentage || 0), 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    const lineHeight = 7;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(20);
    doc.text("Collaboration Agreement", margin, y);
    y += lineHeight * 2;

    doc.setFontSize(12);
    doc.text(`Collaboration ID: ${collaborationId}`, margin, y);
    y += lineHeight;
    doc.text(`Date Generated: ${format(new Date(), 'PPP')}`, margin, y);
    y += lineHeight * 2;

    doc.setFontSize(14);
    doc.text("Participants", margin, y);
    y += lineHeight;
    doc.setFontSize(11);
    doc.text(`1. ${requester?.firstName} ${requester?.lastName || ''}`, margin + 5, y);
    y += lineHeight;
    doc.text(`2. ${receiver?.firstName} ${receiver?.lastName || ''}`, margin + 5, y);
    y += lineHeight * 2;

    doc.setFontSize(14);
    doc.text("Acknowledgement Status", margin, y);
    y += lineHeight;
    doc.setFontSize(11);
    doc.text(`${requester?.firstName}: ${collaboration.acknowledgedByRequester ? 'Acknowledged' : 'Pending'}`, margin + 5, y);
    y += lineHeight;
    doc.text(`${receiver?.firstName}: ${collaboration.acknowledgedByReceiver ? 'Acknowledged' : 'Pending'}`, margin + 5, y);
    y += lineHeight * 2;

    if (concept) {
      doc.setFontSize(14);
      doc.text("Concept", margin, y);
      y += lineHeight;
      doc.setFontSize(11);
      const conceptLines = doc.splitTextToSize(concept, pageWidth - margin * 2);
      doc.text(conceptLines, margin + 5, y);
      y += conceptLines.length * lineHeight + lineHeight;
    }

    if (shootDates.length > 0) {
      doc.setFontSize(14);
      doc.text("Shoot Dates", margin, y);
      y += lineHeight;
      doc.setFontSize(11);
      shootDates.forEach(sd => {
        doc.text(`- ${format(new Date(sd.date), 'PPP')}${sd.time ? ` at ${sd.time}` : ''}${sd.description ? `: ${sd.description}` : ''}`, margin + 5, y);
        y += lineHeight;
      });
      y += lineHeight;
    }

    if (location) {
      doc.setFontSize(14);
      doc.text("Location", margin, y);
      y += lineHeight;
      doc.setFontSize(11);
      doc.text(location, margin + 5, y);
      y += lineHeight;
      if (locationDetails) {
        const detailLines = doc.splitTextToSize(`Details: ${locationDetails}`, pageWidth - margin * 2 - 5);
        doc.text(detailLines, margin + 5, y);
        y += detailLines.length * lineHeight;
      }
      y += lineHeight;
    }

    if (roles.some(r => r.role)) {
      doc.setFontSize(14);
      doc.text("Roles & Responsibilities", margin, y);
      y += lineHeight;
      doc.setFontSize(11);
      roles.forEach(r => {
        const userName = r.userId === requester?.id ? requester?.firstName : receiver?.firstName;
        if (r.role) {
          doc.text(`${userName}: ${r.role}`, margin + 5, y);
          y += lineHeight;
          r.responsibilities.forEach(resp => {
            if (resp) {
              doc.text(`  - ${resp}`, margin + 10, y);
              y += lineHeight;
            }
          });
        }
      });
      y += lineHeight;
    }

    doc.setFontSize(14);
    doc.text("Revenue Split", margin, y);
    y += lineHeight;
    doc.setFontSize(11);
    doc.text(`Type: ${revenueSplit.type === 'equal' ? 'Equal Split' : revenueSplit.type === 'percentage' ? 'Percentage Split' : 'Fixed Amount'}`, margin + 5, y);
    y += lineHeight;
    revenueSplit.splits.forEach(s => {
      const userName = s.userId === requester?.id ? requester?.firstName : receiver?.firstName;
      if (revenueSplit.type === 'fixed') {
        doc.text(`${userName}: $${s.fixedAmount || 0}`, margin + 5, y);
      } else {
        doc.text(`${userName}: ${s.percentage || 0}%`, margin + 5, y);
      }
      y += lineHeight;
    });
    y += lineHeight;

    if (testingConfirmed) {
      doc.setFontSize(14);
      doc.text("Testing Discussion", margin, y);
      y += lineHeight;
      doc.setFontSize(11);
      doc.text("Testing discussion has been confirmed.", margin + 5, y);
      y += lineHeight;
      if (testingNotes) {
        const notesLines = doc.splitTextToSize(`Notes: ${testingNotes}`, pageWidth - margin * 2 - 5);
        doc.text(notesLines, margin + 5, y);
        y += notesLines.length * lineHeight;
      }
      y += lineHeight;
    }

    if (notes) {
      doc.setFontSize(14);
      doc.text("Additional Notes", margin, y);
      y += lineHeight;
      doc.setFontSize(11);
      const notesLines = doc.splitTextToSize(notes, pageWidth - margin * 2);
      doc.text(notesLines, margin + 5, y);
    }

    doc.save(`collaboration-agreement-${collaborationId}.pdf`);
    toast({ title: "PDF Exported", description: "Your collaboration agreement has been downloaded." });
  };

  const getUserName = (userId: string) => {
    if (userId === requester?.id) return requester?.firstName || "User 1";
    if (userId === receiver?.id) return receiver?.firstName || "User 2";
    return "Unknown";
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <Button
        variant="ghost"
        onClick={() => navigate("/collaborations")}
        className="mb-6"
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Collaborations
      </Button>

      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              <Avatar className="border-2 border-background">
                <AvatarImage src={requester?.profileImageUrl || undefined} />
                <AvatarFallback>{requester?.firstName?.[0]}</AvatarFallback>
              </Avatar>
              <Avatar className="border-2 border-background">
                <AvatarImage src={receiver?.profileImageUrl || undefined} />
                <AvatarFallback>{receiver?.firstName?.[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold" data-testid="text-workspace-title">
                {requester?.firstName} & {receiver?.firstName}
              </h1>
              <p className="text-muted-foreground text-sm">Collaboration Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isFullyAcknowledged ? (
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50" data-testid="badge-status-active">
                <CheckCircle className="w-3 h-3 mr-1" />
                Workspace Active
              </Badge>
            ) : (
              <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50" data-testid="badge-status-pending">
                <Clock className="w-3 h-3 mr-1" />
                Pending Acknowledgements
              </Badge>
            )}
            <Button onClick={exportPDF} data-testid="button-export-pdf">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="concept" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="concept" className="rounded-lg gap-1">
            <Lightbulb className="w-4 h-4" />
            <span className="hidden sm:inline">Concept</span>
          </TabsTrigger>
          <TabsTrigger value="dates" className="rounded-lg gap-1">
            <CalendarDays className="w-4 h-4" />
            <span className="hidden sm:inline">Dates</span>
          </TabsTrigger>
          <TabsTrigger value="location" className="rounded-lg gap-1">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Location</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="rounded-lg gap-1">
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:inline">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="revenue" className="rounded-lg gap-1">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Revenue</span>
          </TabsTrigger>
          <TabsTrigger value="boundaries" className="rounded-lg gap-1">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Boundaries</span>
          </TabsTrigger>
          <TabsTrigger value="testing" className="rounded-lg gap-1">
            <FlaskConical className="w-4 h-4" />
            <span className="hidden sm:inline">Testing</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-lg gap-1">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Notes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="concept">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                Concept
              </CardTitle>
              <CardDescription>
                Describe the collaboration concept and vision
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe your collaboration concept, vision, goals, and creative direction..."
                className="min-h-[200px]"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                onBlur={() => saveField('concept', concept)}
                data-testid="textarea-concept"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                Shoot Dates
              </CardTitle>
              <CardDescription>
                Plan your shoot dates and schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {shootDates.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No dates added yet</p>
              ) : (
                shootDates.map((sd, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/30 rounded-lg border" data-testid={`shoot-date-${index}`}>
                    <div className="flex-1 space-y-2">
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal" data-testid={`button-date-picker-${index}`}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {sd.date ? format(new Date(sd.date), 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={sd.date ? new Date(sd.date) : undefined}
                            onSelect={(date) => {
                              if (date) updateShootDate(index, 'date', date.toISOString().split('T')[0]);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="w-full sm:w-32 space-y-2">
                      <Label>Time (optional)</Label>
                      <Input
                        type="time"
                        value={sd.time || ""}
                        onChange={(e) => updateShootDate(index, 'time', e.target.value)}
                        onBlur={saveShootDates}
                        data-testid={`input-time-${index}`}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>Description</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="What's planned for this date?"
                          value={sd.description || ""}
                          onChange={(e) => updateShootDate(index, 'description', e.target.value)}
                          onBlur={saveShootDates}
                          data-testid={`input-description-${index}`}
                        />
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => removeShootDate(index)}
                          className="text-destructive"
                          data-testid={`button-remove-date-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <Button onClick={addShootDate} variant="outline" className="w-full" data-testid="button-add-date">
                <Plus className="w-4 h-4 mr-2" />
                Add Shoot Date
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Location
              </CardTitle>
              <CardDescription>
                Specify the shoot location and logistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Downtown Los Angeles Studio"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onBlur={() => saveField('location', location)}
                  data-testid="input-location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationDetails">Additional Details</Label>
                <Textarea
                  id="locationDetails"
                  placeholder="Parking information, access instructions, building codes, etc."
                  value={locationDetails}
                  onChange={(e) => setLocationDetails(e.target.value)}
                  onBlur={() => saveField('locationDetails', locationDetails)}
                  data-testid="textarea-location-details"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Roles & Responsibilities
              </CardTitle>
              <CardDescription>
                Define each participant's role and responsibilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {roles.map((role) => (
                <div key={role.userId} className="p-4 bg-muted/30 rounded-lg border space-y-4" data-testid={`role-${role.userId}`}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={role.userId === requester?.id ? requester?.profileImageUrl || undefined : receiver?.profileImageUrl || undefined} />
                      <AvatarFallback>{getUserName(role.userId)?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{getUserName(role.userId)}</p>
                      <Input
                        placeholder="Role (e.g., Photographer, Model, Director)"
                        value={role.role}
                        onChange={(e) => updateRole(role.userId, 'role', e.target.value)}
                        onBlur={saveRoles}
                        className="mt-2"
                        data-testid={`input-role-${role.userId}`}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 pl-13">
                    <Label className="text-sm text-muted-foreground">Responsibilities</Label>
                    {role.responsibilities.map((resp, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          placeholder="Add a responsibility"
                          value={resp}
                          onChange={(e) => updateResponsibility(role.userId, idx, e.target.value)}
                          onBlur={saveRoles}
                          data-testid={`input-responsibility-${role.userId}-${idx}`}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeResponsibility(role.userId, idx)}
                          className="text-destructive"
                          data-testid={`button-remove-responsibility-${role.userId}-${idx}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addResponsibility(role.userId)}
                      data-testid={`button-add-responsibility-${role.userId}`}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Responsibility
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Revenue Split
              </CardTitle>
              <CardDescription>
                Agree on how revenue will be divided
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Split Type</Label>
                <Select value={revenueSplit.type} onValueChange={(v) => updateRevenueSplitType(v as any)} data-testid="select-revenue-type">
                  <SelectTrigger data-testid="select-trigger-revenue-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">Equal Split (50/50)</SelectItem>
                    <SelectItem value="percentage">Percentage Split</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {revenueSplit.splits.map((split) => (
                  <div key={split.userId} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border" data-testid={`split-${split.userId}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={split.userId === requester?.id ? requester?.profileImageUrl || undefined : receiver?.profileImageUrl || undefined} />
                      <AvatarFallback>{getUserName(split.userId)?.[0]}</AvatarFallback>
                    </Avatar>
                    <p className="font-medium flex-1">{getUserName(split.userId)}</p>
                    {revenueSplit.type === 'equal' ? (
                      <Badge variant="secondary">50%</Badge>
                    ) : revenueSplit.type === 'percentage' ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={split.percentage || 0}
                          onChange={(e) => updateSplitValue(split.userId, 'percentage', Number(e.target.value))}
                          onBlur={saveRevenueSplit}
                          className="w-20"
                          data-testid={`input-percentage-${split.userId}`}
                        />
                        <span>%</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>$</span>
                        <Input
                          type="number"
                          min={0}
                          value={split.fixedAmount || 0}
                          onChange={(e) => updateSplitValue(split.userId, 'fixedAmount', Number(e.target.value))}
                          onBlur={saveRevenueSplit}
                          className="w-24"
                          data-testid={`input-fixed-amount-${split.userId}`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {revenueSplit.type === 'percentage' && (
                <div className={`text-sm ${totalPercentage === 100 ? 'text-green-600' : 'text-destructive'}`}>
                  {totalPercentage === 100 ? (
                    <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Total: 100%</span>
                  ) : (
                    <span className="flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Total: {totalPercentage}% (must equal 100%)</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boundaries">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Boundary Acknowledgements
              </CardTitle>
              <CardDescription>
                Review and acknowledge each participant's boundaries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { profile: otherProfile, user: otherUser, acknowledged: otherBoundariesAcknowledged, isOther: true },
                { profile: myProfile, user: user.id === requester?.id ? requester : receiver, acknowledged: myBoundariesAcknowledged, isOther: false }
              ].map(({ profile, user: u, acknowledged, isOther }) => (
                <div key={u?.id} className="p-4 bg-muted/30 rounded-lg border space-y-4" data-testid={`boundaries-${u?.id}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={u?.profileImageUrl || undefined} />
                        <AvatarFallback>{(u as any)?.firstName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{(u as any)?.firstName}'s Boundaries</p>
                        {acknowledged ? (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Acknowledged
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {profile?.boundaries && (
                    <div className="space-y-3 text-sm">
                      {profile.boundaries.contentTypes && profile.boundaries.contentTypes.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Content Types</p>
                          <div className="flex flex-wrap gap-1">
                            {profile.boundaries.contentTypes.map((ct, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{ct}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {profile.boundaries.collaborationTypes && profile.boundaries.collaborationTypes.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Collaboration Types</p>
                          <div className="flex flex-wrap gap-1">
                            {profile.boundaries.collaborationTypes.map((ct, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{ct}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {profile.boundaries.dealBreakers && profile.boundaries.dealBreakers.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Deal Breakers</p>
                          <div className="flex flex-wrap gap-1">
                            {profile.boundaries.dealBreakers.map((db, i) => (
                              <Badge key={i} variant="outline" className="text-xs text-destructive border-destructive/20">{db}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {profile.boundaries.safetyRequirements && profile.boundaries.safetyRequirements.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Safety Requirements</p>
                          <div className="flex flex-wrap gap-1">
                            {profile.boundaries.safetyRequirements.map((sr, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{sr}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!profile?.boundaries || Object.values(profile.boundaries).every(v => !v || v.length === 0) && (
                    <p className="text-sm text-muted-foreground">No boundaries specified in profile</p>
                  )}
                </div>
              ))}

              <Separator />

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="acknowledge-boundaries"
                    checked={myBoundariesAcknowledged}
                    disabled={myBoundariesAcknowledged || isAcknowledging}
                    onCheckedChange={() => {
                      if (!myBoundariesAcknowledged) {
                        acknowledgeBoundaries(collaborationId);
                      }
                    }}
                    data-testid="checkbox-acknowledge-boundaries"
                  />
                  <Label htmlFor="acknowledge-boundaries" className="text-sm leading-relaxed cursor-pointer">
                    I acknowledge and respect {otherUser?.firstName}'s boundaries and agree to communicate openly about any concerns during our collaboration.
                  </Label>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {myBoundariesAcknowledged && otherBoundariesAcknowledged
                      ? "Both parties have acknowledged boundaries"
                      : myBoundariesAcknowledged
                      ? `Waiting for ${otherUser?.firstName} to acknowledge`
                      : otherBoundariesAcknowledged
                      ? "Please acknowledge the boundaries above"
                      : "Neither party has acknowledged yet"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-primary" />
                Testing Discussion
              </CardTitle>
              <CardDescription>
                Confirm testing requirements have been discussed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border">
                <Checkbox
                  id="testing-confirmed"
                  checked={testingConfirmed}
                  onCheckedChange={(checked) => {
                    setTestingConfirmed(checked === true);
                    saveField('testingDiscussionConfirmed', checked === true);
                  }}
                  data-testid="checkbox-testing-confirmed"
                />
                <Label htmlFor="testing-confirmed" className="cursor-pointer">
                  <p className="font-medium">Testing discussion has occurred</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Confirm that you have discussed any relevant testing requirements, health considerations, and safety measures.
                  </p>
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testing-notes">Testing Notes</Label>
                <Textarea
                  id="testing-notes"
                  placeholder="Document any testing-related agreements, timelines, or notes..."
                  value={testingNotes}
                  onChange={(e) => setTestingNotes(e.target.value)}
                  onBlur={() => saveField('testingDiscussionNotes', testingNotes)}
                  data-testid="textarea-testing-notes"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Notes & Attachments
              </CardTitle>
              <CardDescription>
                Add general notes and attach relevant files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="notes">General Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes, agreements, or important information..."
                  className="min-h-[150px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => saveField('notes', notes)}
                  data-testid="textarea-notes"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Attachments</Label>
                {attachments.length === 0 ? (
                  <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed">
                    <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No attachments yet</p>
                    <p className="text-xs text-muted-foreground mt-1">File upload coming soon</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((attachment, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded" data-testid={`attachment-${i}`}>
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{attachment}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="outline" className="w-full" disabled data-testid="button-upload-attachment">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Attachment (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
