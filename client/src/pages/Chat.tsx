import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useScreenshotDetection } from "@/hooks/use-screenshot-detection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Send, MessageCircle, Phone, Video, ArrowLeft, MoreVertical, Lock, Paperclip, Mic, FileText, Image, VideoIcon, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Link, useRoute, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Match {
  id: number;
  user1Id: string;
  user2Id: string;
  createdAt: string;
  user1: { id: string; firstName: string; lastName: string; profileImageUrl: string | null };
  user2: { id: string; firstName: string; lastName: string; profileImageUrl: string | null };
}

interface Message {
  id: number;
  matchId: number;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  messageType?: "text" | "image" | "video" | "voice" | "template";
}

interface CollabTemplate {
  id: number;
  name: string;
  content: string;
  category: string;
}

export default function Chat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, params] = useRoute("/chat/:matchId");
  const [, setLocation] = useLocation();

  useScreenshotDetection({
    onScreenshotDetected: () => {
      toast({
        title: "Screenshot Detected",
        description: "Please respect privacy - screenshots may violate trust.",
        variant: "destructive",
      });
    },
    enabled: !!selectedMatchId,
  });

  useEffect(() => {
    if (params?.matchId) {
      setSelectedMatchId(parseInt(params.matchId));
    }
  }, [params?.matchId]);

  const { data: matches, isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: [api.matches.list.path],
    queryFn: async () => {
      const res = await fetch(api.matches.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch matches");
      return res.json();
    },
  });

  const { data: currentMatch, isLoading: messagesLoading } = useQuery({
    queryKey: [api.matches.get.path, selectedMatchId],
    queryFn: async () => {
      if (!selectedMatchId) return null;
      const url = buildUrl(api.matches.get.path, { id: selectedMatchId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!selectedMatchId,
    refetchInterval: 3000,
  });

  const { data: templates } = useQuery<CollabTemplate[]>({
    queryKey: ["/api/templates"],
    queryFn: async () => {
      const res = await fetch("/api/templates", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedMatchId) return;
      const res = await fetch(`/api/matches/${selectedMatchId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.matches.get.path, selectedMatchId] });
      setMessageInput("");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMatch?.messages]);

  const getOtherUser = (match: Match) => {
    return match.user1Id === user?.id ? match.user2 : match.user1;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendMessage.mutate(messageInput.trim());
    }
  };

  const selectMatch = (matchId: number) => {
    setSelectedMatchId(matchId);
    setLocation(`/chat/${matchId}`);
  };

  const handleTemplateSelect = (template: CollabTemplate) => {
    setMessageInput(template.content);
    setTemplatesOpen(false);
  };

  const handleAttachment = (type: "photo" | "video") => {
    setAttachmentOpen(false);
    toast({
      title: "Coming Soon",
      description: `${type === "photo" ? "Photo" : "Video"} sharing will be available soon.`,
    });
  };

  const handleVoiceNote = () => {
    toast({
      title: "Coming Soon",
      description: "Voice notes will be available soon.",
    });
  };

  const getMessageTypeIcon = (type?: string) => {
    switch (type) {
      case "image":
        return <Image className="h-3 w-3" />;
      case "video":
        return <VideoIcon className="h-3 w-3" />;
      case "voice":
        return <Mic className="h-3 w-3" />;
      case "template":
        return <FileText className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (matchesLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className={cn(
        "w-full md:w-80 lg:w-96 border-r bg-card flex flex-col",
        selectedMatchId && "hidden md:flex"
      )}>
        <div className="p-4 border-b">
          <h2 className="font-display text-xl font-bold">Messages</h2>
          <p className="text-sm text-muted-foreground">{matches?.length || 0} conversations</p>
        </div>
        
        <ScrollArea className="flex-1">
          {matches?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No matches yet</p>
              <p className="text-sm mt-1">Start swiping to find your matches!</p>
              <Link href="/directory">
                <Button className="mt-4" variant="outline" size="sm">
                  Discover Creators
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {matches?.map((match) => {
                const otherUser = getOtherUser(match);
                return (
                  <button
                    key={match.id}
                    onClick={() => selectMatch(match.id)}
                    className={cn(
                      "w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left",
                      selectedMatchId === match.id && "bg-muted"
                    )}
                    data-testid={`conversation-${match.id}`}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={otherUser.profileImageUrl || undefined} />
                      <AvatarFallback>{otherUser.firstName?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {otherUser.firstName} {otherUser.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        Matched {format(new Date(match.createdAt), "MMM d")}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className={cn(
        "flex-1 flex flex-col",
        !selectedMatchId && "hidden md:flex"
      )}>
        {!selectedMatchId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Select a conversation</p>
              <p className="text-sm">Choose from your matches to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {currentMatch && (
              <div className="p-4 border-b flex flex-col gap-2 bg-card">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => {
                      setSelectedMatchId(null);
                      setLocation("/chat");
                    }}
                    data-testid="button-back"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getOtherUser(currentMatch)?.profileImageUrl || undefined} />
                    <AvatarFallback>{getOtherUser(currentMatch)?.firstName?.[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <p className="font-medium">
                      {getOtherUser(currentMatch)?.firstName} {getOtherUser(currentMatch)?.lastName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" data-testid="button-voice-call" title="Voice call (coming soon)" disabled>
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" data-testid="button-video-call" title="Video call (coming soon)" disabled>
                      <Video className="h-5 w-5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid="button-more-options">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/profile/${matches?.find(m => m.id === selectedMatchId)?.user1Id === user?.id 
                          ? matches?.find(m => m.id === selectedMatchId)?.user2.id 
                          : matches?.find(m => m.id === selectedMatchId)?.user1.id}`}>
                          <DropdownMenuItem data-testid="menu-item-view-profile">View Profile</DropdownMenuItem>
                        </Link>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Messages are encrypted</span>
                  <ShieldCheck className="h-3 w-3 ml-2 text-green-500" />
                </div>
              </div>
            )}

            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin h-6 w-6 text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {currentMatch?.messages?.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No messages yet. Say hello!</p>
                    </div>
                  )}
                  {currentMatch?.messages?.map((message: Message) => {
                    const isMe = message.senderId === user?.id;
                    const messageType = message.messageType || "text";
                    const isTemplate = messageType === "template";
                    const isMedia = messageType === "image" || messageType === "video";
                    const isVoice = messageType === "voice";
                    
                    return (
                      <div
                        key={message.id}
                        className={cn("flex", isMe ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2",
                            isMe
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted",
                            isTemplate && "border-2 border-dashed border-primary/30"
                          )}
                          data-testid={`message-${message.id}`}
                        >
                          {isTemplate && (
                            <div className="flex items-center gap-1 mb-1">
                              <Badge variant="secondary" className="text-xs">
                                <FileText className="h-2 w-2 mr-1" />
                                Template
                              </Badge>
                            </div>
                          )}
                          
                          {isMedia && (
                            <div className="flex items-center gap-2 mb-2 p-3 rounded-lg bg-background/20">
                              {getMessageTypeIcon(messageType)}
                              <span className="text-sm opacity-80">
                                {messageType === "image" ? "Photo" : "Video"} attachment
                              </span>
                            </div>
                          )}
                          
                          {isVoice && (
                            <div className="flex items-center gap-2 mb-2 p-3 rounded-lg bg-background/20">
                              <Mic className="h-4 w-4" />
                              <div className="flex-1 h-1 bg-current/20 rounded-full overflow-hidden">
                                <div className="h-full w-1/2 bg-current rounded-full" />
                              </div>
                              <span className="text-xs">0:30</span>
                            </div>
                          )}
                          
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          
                          <div className={cn(
                            "flex items-center gap-1 mt-1",
                            isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            <Lock className="h-2 w-2" />
                            <span className="text-xs">
                              {format(new Date(message.createdAt), "h:mm a")}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <form onSubmit={handleSendMessage} className="p-4 border-t bg-card">
              <div className="flex items-center gap-2">
                <Popover open={attachmentOpen} onOpenChange={setAttachmentOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      data-testid="button-attachment"
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 p-2" align="start">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start"
                        onClick={() => handleAttachment("photo")}
                        data-testid="button-attach-photo"
                      >
                        <Image className="h-4 w-4 mr-2" />
                        Photo
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start"
                        onClick={() => handleAttachment("video")}
                        data-testid="button-attach-video"
                      >
                        <VideoIcon className="h-4 w-4 mr-2" />
                        Video
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover open={templatesOpen} onOpenChange={setTemplatesOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      data-testid="button-templates"
                    >
                      <FileText className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-2" align="start">
                    <div className="mb-2 px-2">
                      <p className="font-medium text-sm">Collab Templates</p>
                      <p className="text-xs text-muted-foreground">Quick messages for collabs</p>
                    </div>
                    <ScrollArea className="max-h-60">
                      <div className="flex flex-col gap-1">
                        {templates?.map((template) => (
                          <Button
                            key={template.id}
                            variant="ghost"
                            size="sm"
                            className="justify-start h-auto py-2 px-2"
                            onClick={() => handleTemplateSelect(template)}
                            data-testid={`template-${template.id}`}
                          >
                            <div className="text-left">
                              <p className="font-medium text-sm">{template.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {template.content}
                              </p>
                            </div>
                          </Button>
                        ))}
                        {(!templates || templates.length === 0) && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No templates available
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>

                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  data-testid="input-message"
                  disabled={sendMessage.isPending}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleVoiceNote}
                  data-testid="button-voice-note"
                >
                  <Mic className="h-5 w-5" />
                </Button>

                <Button
                  type="submit"
                  disabled={!messageInput.trim() || sendMessage.isPending}
                  data-testid="button-send-message"
                >
                  {sendMessage.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
