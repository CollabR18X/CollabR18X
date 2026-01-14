import { useState } from "react";
import { useCreateCollaboration } from "@/hooks/use-collaborations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";

interface CollabRequestModalProps {
  receiverId: string;
  receiverName: string;
  trigger?: React.ReactNode;
}

export function CollabRequestModal({ receiverId, receiverName, trigger }: CollabRequestModalProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { mutate, isPending } = useCreateCollaboration();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      { receiverId, message },
      {
        onSuccess: () => {
          setOpen(false);
          setMessage("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Connect</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Collaborate with {receiverName}</DialogTitle>
            <DialogDescription>
              Send a pitch to start a conversation. Be specific about your idea!
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label htmlFor="message">Your Pitch</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi! I love your content on tech reviews. I'm planning a video about AI tools and would love to feature you..."
                className="min-h-[150px] resize-none focus-visible:ring-primary"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isPending || !message.trim()}
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Request
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
