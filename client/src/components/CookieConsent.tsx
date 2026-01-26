import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

const COOKIE_CONSENT_KEY = "cookie_consent";

export function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Show dialog after a short delay for better UX
      const timer = setTimeout(() => {
        setOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setOpen(false);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    setOpen(false);
    // Optionally clear any existing cookies here if needed
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Prevent closing without making a choice
      if (!newOpen && !localStorage.getItem(COOKIE_CONSENT_KEY)) {
        return;
      }
      setOpen(newOpen);
    }}>
      <DialogContent 
        className="sm:max-w-[500px] [&>button]:hidden" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Cookie className="h-6 w-6 text-primary" />
            <DialogTitle>Cookie Preferences</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
            By clicking "Accept All", you consent to our use of cookies.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-3">
          <div className="text-sm space-y-2">
            <p className="font-medium">We use cookies for:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Authentication and session management</li>
              <li>Remembering your preferences</li>
              <li>Improving site functionality</li>
              <li>Analytics and performance monitoring</li>
            </ul>
          </div>
          
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>
              You can change your cookie preferences at any time. 
              For more information, please see our{" "}
              <a href="/terms" className="text-primary hover:underline">
                Terms of Service
              </a>
              .
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleReject}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Reject All
          </Button>
          <Button
            onClick={handleAccept}
            className="w-full sm:w-auto"
          >
            <Cookie className="h-4 w-4 mr-2" />
            Accept All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
