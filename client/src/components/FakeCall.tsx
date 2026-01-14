import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, PhoneOff, PhoneIncoming } from "lucide-react";

interface FakeCallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callerName?: string;
}

export function FakeCall({ open, onOpenChange, callerName = "Mom" }: FakeCallProps) {
  const [callState, setCallState] = useState<"incoming" | "active" | "ended">("incoming");
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!open) {
      setCallState("incoming");
      setCallDuration(0);
    }
  }, [open]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (callState === "active") {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAccept = () => {
    setCallState("active");
  };

  const handleDecline = () => {
    onOpenChange(false);
  };

  const handleEndCall = () => {
    setCallState("ended");
    setTimeout(() => {
      onOpenChange(false);
    }, 500);
  };

  const getCallerInitial = () => {
    return callerName.charAt(0).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/95" />
      <DialogContent 
        className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black border-none rounded-none max-w-none w-screen h-screen p-0 sm:rounded-none"
        data-testid="fake-call-modal"
      >
        <div className="flex flex-col items-center justify-between h-full w-full py-16 px-8">
          {callState === "incoming" && (
            <>
              <div className="flex flex-col items-center space-y-4 mt-12">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
                  <div className="absolute inset-0 rounded-full bg-green-500/10 animate-pulse" style={{ animationDelay: "0.5s" }} />
                  <Avatar className="h-32 w-32 border-4 border-white/20 relative z-10">
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {getCallerInitial()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-center space-y-2 mt-8">
                  <h2 className="text-3xl font-semibold text-white" data-testid="text-caller-name">
                    {callerName}
                  </h2>
                  <p className="text-lg text-gray-400 flex items-center gap-2 justify-center">
                    <PhoneIncoming className="h-5 w-5 animate-pulse" />
                    Incoming call...
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-16 mb-12">
                <button
                  onClick={handleDecline}
                  className="flex flex-col items-center gap-2 group"
                  data-testid="button-decline-call"
                >
                  <div className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center hover-elevate active-elevate-2 transition-transform">
                    <PhoneOff className="h-7 w-7 text-white" />
                  </div>
                  <span className="text-sm text-gray-400">Decline</span>
                </button>

                <button
                  onClick={handleAccept}
                  className="flex flex-col items-center gap-2 group"
                  data-testid="button-accept-call"
                >
                  <div className="h-20 w-20 rounded-full bg-green-500 flex items-center justify-center transition-transform relative">
                    <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-50" />
                    <Phone className="h-8 w-8 text-white relative z-10" />
                  </div>
                  <span className="text-sm text-gray-400">Accept</span>
                </button>
              </div>
            </>
          )}

          {callState === "active" && (
            <>
              <div className="flex flex-col items-center space-y-4 mt-12">
                <Avatar className="h-32 w-32 border-4 border-green-500/50">
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {getCallerInitial()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center space-y-2 mt-8">
                  <h2 className="text-3xl font-semibold text-white" data-testid="text-caller-name-active">
                    {callerName}
                  </h2>
                  <p className="text-xl text-green-400 font-mono" data-testid="text-call-duration">
                    {formatDuration(callDuration)}
                  </p>
                  <div className="flex items-center gap-2 justify-center text-gray-400">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm">Call in progress</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 mb-12">
                <button
                  onClick={handleEndCall}
                  className="flex flex-col items-center gap-2"
                  data-testid="button-end-call"
                >
                  <div className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center hover-elevate active-elevate-2 transition-transform">
                    <PhoneOff className="h-7 w-7 text-white" />
                  </div>
                  <span className="text-sm text-gray-400">End Call</span>
                </button>
              </div>
            </>
          )}

          {callState === "ended" && (
            <div className="flex flex-col items-center justify-center flex-1">
              <Avatar className="h-24 w-24 opacity-50">
                <AvatarFallback className="text-3xl bg-gray-600 text-white">
                  {getCallerInitial()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-semibold text-white mt-6">Call Ended</h2>
              <p className="text-gray-400 mt-2">{formatDuration(callDuration)}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
