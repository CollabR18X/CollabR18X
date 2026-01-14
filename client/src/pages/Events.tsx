import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { Calendar, MapPin, Video, Users, Plus, Clock, ArrowLeft, Trash2, Edit, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event, EventAttendee, User as UserType } from "@shared/schema";

type EventWithDetails = Event & { 
  creator: UserType; 
  attendees: (EventAttendee & { user: UserType })[];
  attendeeCount: number;
};

function EventsListView() {
  const [filter, setFilter] = useState<"upcoming" | "past" | "virtual">("upcoming");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const { data: events, isLoading } = useQuery<EventWithDetails[]>({
    queryKey: ["/api/events", { filter }],
    queryFn: async () => {
      const now = new Date().toISOString();
      let url = "/api/events";
      if (filter === "upcoming") {
        url += `?startDate=${now}`;
      } else if (filter === "past") {
        url += `?endDate=${now}`;
      } else if (filter === "virtual") {
        url += `?isVirtual=true`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  const filteredEvents = events?.filter(event => {
    const eventDate = new Date(event.eventDate);
    if (filter === "upcoming") return !isPast(eventDate);
    if (filter === "past") return isPast(eventDate);
    if (filter === "virtual") return event.isVirtual;
    return true;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <Skeleton className="h-10 w-80 mb-6" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="events-list-view">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold">Community Events</h1>
          <p className="text-muted-foreground mt-2">Discover and join events with fellow creators.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-event">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <CreateEventForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
        <TabsList data-testid="tabs-filter">
          <TabsTrigger value="upcoming" data-testid="tab-upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past" data-testid="tab-past">Past</TabsTrigger>
          <TabsTrigger value="virtual" data-testid="tab-virtual">Virtual Only</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents?.map((event) => (
          <Link key={event.id} href={`/community/events/${event.id}`}>
            <Card 
              className="cursor-pointer hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              data-testid={`card-event-${event.id}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-lg line-clamp-2" data-testid={`text-event-title-${event.id}`}>
                    {event.title}
                  </h3>
                  {event.isVirtual && (
                    <Badge variant="secondary" className="shrink-0">
                      <Video className="h-3 w-3 mr-1" />
                      Virtual
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2" data-testid={`text-event-date-${event.id}`}>
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>{format(new Date(event.eventDate), "PPP")}</span>
                  </div>
                  <div className="flex items-center gap-2" data-testid={`text-event-time-${event.id}`}>
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>{format(new Date(event.eventDate), "p")}</span>
                  </div>
                  <div className="flex items-center gap-2" data-testid={`text-event-location-${event.id}`}>
                    {event.isVirtual ? (
                      <>
                        <Video className="h-4 w-4 shrink-0" />
                        <span>Virtual Event</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="line-clamp-1">{event.location}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={event.creator?.profileImageUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {event.creator?.firstName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground" data-testid={`text-event-creator-${event.id}`}>
                      {event.creator?.firstName || "Creator"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground" data-testid={`text-event-attendees-${event.id}`}>
                    <Users className="h-4 w-4" />
                    <span>{event.attendeeCount || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {filteredEvents?.length === 0 && (
          <div className="col-span-full text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground">No events found</h3>
            <p className="text-muted-foreground mt-2">
              {filter === "upcoming" && "No upcoming events. Be the first to create one!"}
              {filter === "past" && "No past events to show."}
              {filter === "virtual" && "No virtual events available."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateEventForm({ onSuccess, editEvent }: { onSuccess: () => void; editEvent?: EventWithDetails }) {
  const [title, setTitle] = useState(editEvent?.title || "");
  const [description, setDescription] = useState(editEvent?.description || "");
  const [location, setLocation] = useState(editEvent?.location || "");
  const [eventDate, setEventDate] = useState(
    editEvent?.eventDate ? format(new Date(editEvent.eventDate), "yyyy-MM-dd'T'HH:mm") : ""
  );
  const [isVirtual, setIsVirtual] = useState(editEvent?.isVirtual || false);
  const [virtualLink, setVirtualLink] = useState(editEvent?.virtualLink || "");
  const [maxAttendees, setMaxAttendees] = useState(editEvent?.maxAttendees?.toString() || "");
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      location: string;
      eventDate: string;
      isVirtual: boolean;
      virtualLink?: string;
      maxAttendees?: number;
    }) => {
      if (editEvent) {
        const res = await apiRequest("PUT", `/api/events/${editEvent.id}`, data);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/events", data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      if (editEvent) {
        queryClient.invalidateQueries({ queryKey: ["/api/events", editEvent.id] });
      }
      toast({ title: editEvent ? "Event updated successfully!" : "Event created successfully!" });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save event", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !eventDate) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (!isVirtual && !location.trim()) {
      toast({ title: "Please provide a location or mark as virtual", variant: "destructive" });
      return;
    }
    if (isVirtual && !virtualLink.trim()) {
      toast({ title: "Please provide a virtual link", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      title,
      description,
      location: isVirtual ? "Virtual" : location,
      eventDate: new Date(eventDate).toISOString(),
      isVirtual,
      virtualLink: isVirtual ? virtualLink : undefined,
      maxAttendees: maxAttendees ? parseInt(maxAttendees) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-event">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          data-testid="input-event-title"
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe your event..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          data-testid="input-event-description"
        />
      </div>

      <div>
        <Label htmlFor="eventDate">Date & Time *</Label>
        <Input
          id="eventDate"
          type="datetime-local"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          data-testid="input-event-date"
        />
      </div>

      <div className="flex items-center gap-3 py-2">
        <Switch
          id="isVirtual"
          checked={isVirtual}
          onCheckedChange={setIsVirtual}
          data-testid="switch-virtual"
        />
        <Label htmlFor="isVirtual" className="cursor-pointer">Virtual event</Label>
      </div>

      {isVirtual ? (
        <div>
          <Label htmlFor="virtualLink">Virtual Link *</Label>
          <Input
            id="virtualLink"
            type="url"
            placeholder="https://zoom.us/..."
            value={virtualLink}
            onChange={(e) => setVirtualLink(e.target.value)}
            data-testid="input-virtual-link"
          />
        </div>
      ) : (
        <div>
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            placeholder="Event location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            data-testid="input-location"
          />
        </div>
      )}

      <div>
        <Label htmlFor="maxAttendees">Max Attendees (optional)</Label>
        <Input
          id="maxAttendees"
          type="number"
          placeholder="Leave empty for unlimited"
          value={maxAttendees}
          onChange={(e) => setMaxAttendees(e.target.value)}
          min={1}
          data-testid="input-max-attendees"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={createMutation.isPending}
        data-testid="button-submit-event"
      >
        {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {editEvent ? "Update Event" : "Create Event"}
      </Button>
    </form>
  );
}

function SingleEventView() {
  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: event, isLoading } = useQuery<EventWithDetails>({
    queryKey: ["/api/events", eventId],
    queryFn: async () => {
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) throw new Error("Failed to fetch event");
      return res.json();
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: async (status: "going" | "maybe" | "not_going") => {
      const res = await apiRequest("POST", `/api/events/${eventId}/rsvp`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "RSVP updated!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to RSVP", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/events/${eventId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Event deleted" });
      navigate("/community/events");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete event", description: error.message, variant: "destructive" });
    }
  });

  const isCreator = user?.id && event?.creatorId === user.id;
  const userRsvp = event?.attendees?.find(a => a.userId === user?.id);
  const goingAttendees = event?.attendees?.filter(a => a.status === "going") || [];
  const interestedAttendees = event?.attendees?.filter(a => a.status === "maybe") || [];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/3 mb-6" />
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-8 w-48" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold">Event not found</h2>
        <Link href="/community/events">
          <Button className="mt-4">Back to Events</Button>
        </Link>
      </div>
    );
  }

  const eventDate = new Date(event.eventDate);
  const isPastEvent = isPast(eventDate);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" data-testid="single-event-view">
      <Link href="/community/events">
        <Button variant="ghost" className="mb-6" data-testid="button-back-events">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
      </Link>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {event.isVirtual && (
                      <Badge variant="secondary">
                        <Video className="h-3 w-3 mr-1" />
                        Virtual
                      </Badge>
                    )}
                    {isPastEvent && (
                      <Badge variant="outline">Past Event</Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl" data-testid="text-event-title">
                    {event.title}
                  </CardTitle>
                </div>
                {isCreator && (
                  <div className="flex items-center gap-2">
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" data-testid="button-edit-event">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Edit Event</DialogTitle>
                        </DialogHeader>
                        <CreateEventForm 
                          editEvent={event} 
                          onSuccess={() => setIsEditOpen(false)} 
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                      data-testid="button-delete-event"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-sm" data-testid="text-event-datetime">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{format(eventDate, "EEEE, MMMM d, yyyy")}</p>
                    <p className="text-muted-foreground">{format(eventDate, "h:mm a")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm" data-testid="text-event-location-detail">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {event.isVirtual ? (
                      <Video className="h-5 w-5 text-primary" />
                    ) : (
                      <MapPin className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    {event.isVirtual ? (
                      <>
                        <p className="font-medium">Virtual Event</p>
                        {event.virtualLink && (
                          <a 
                            href={event.virtualLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                            data-testid="link-virtual"
                          >
                            Join Link <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </>
                    ) : (
                      <p className="font-medium">{event.location}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">About this event</h3>
                <p className="text-muted-foreground whitespace-pre-wrap" data-testid="text-event-description">
                  {event.description}
                </p>
              </div>

              {event.latitude && event.longitude && !event.isVirtual && (
                <div data-testid="map-placeholder">
                  <h3 className="font-semibold mb-2">Location</h3>
                  <div className="h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MapPin className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Map showing {event.location}</p>
                      <p className="text-xs">Coordinates: {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}</p>
                    </div>
                  </div>
                </div>
              )}

              {!isPastEvent && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-3">RSVP</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={userRsvp?.status === "going" ? "default" : "outline"}
                      onClick={() => rsvpMutation.mutate("going")}
                      disabled={rsvpMutation.isPending}
                      data-testid="button-rsvp-going"
                    >
                      {rsvpMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Going
                    </Button>
                    <Button
                      variant={userRsvp?.status === "maybe" ? "default" : "outline"}
                      onClick={() => rsvpMutation.mutate("maybe")}
                      disabled={rsvpMutation.isPending}
                      data-testid="button-rsvp-interested"
                    >
                      Interested
                    </Button>
                    <Button
                      variant={userRsvp?.status === "not_going" ? "default" : "outline"}
                      onClick={() => rsvpMutation.mutate("not_going")}
                      disabled={rsvpMutation.isPending}
                      data-testid="button-rsvp-not-going"
                    >
                      Not Going
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hosted by</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/profile/${event.creator?.id || event.creatorId}`}>
                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" data-testid="link-creator-profile">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={event.creator?.profileImageUrl || undefined} />
                    <AvatarFallback>
                      {event.creator?.firstName?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium" data-testid="text-creator-name">
                      {event.creator?.firstName} {event.creator?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created {formatDistanceToNow(new Date(event.createdAt!), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Attendees ({goingAttendees.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {goingAttendees.length > 0 ? (
                <div className="space-y-3" data-testid="attendee-list-going">
                  {goingAttendees.map((attendee) => (
                    <Link key={attendee.id} href={`/profile/${attendee.user?.id}`}>
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                        data-testid={`attendee-going-${attendee.id}`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={attendee.user?.profileImageUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {attendee.user?.firstName?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {attendee.user?.firstName} {attendee.user?.lastName}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No one has RSVP'd yet.</p>
              )}

              {interestedAttendees.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Interested ({interestedAttendees.length})</p>
                  <div className="flex flex-wrap gap-1" data-testid="attendee-list-interested">
                    {interestedAttendees.slice(0, 5).map((attendee) => (
                      <Avatar key={attendee.id} className="h-6 w-6" data-testid={`attendee-interested-${attendee.id}`}>
                        <AvatarImage src={attendee.user?.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {attendee.user?.firstName?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {interestedAttendees.length > 5 && (
                      <span className="text-xs text-muted-foreground self-center ml-1">
                        +{interestedAttendees.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {event.maxAttendees && (
                <p className="text-xs text-muted-foreground mt-4">
                  Max attendees: {event.maxAttendees}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function Events() {
  const params = useParams<{ id?: string }>();
  
  if (params.id) {
    return <SingleEventView />;
  }
  
  return <EventsListView />;
}
