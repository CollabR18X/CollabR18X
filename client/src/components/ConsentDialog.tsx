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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle, Lock } from "lucide-react";

interface Boundaries {
  contentTypes?: string[];
  communicationPrefs?: string[];
  collaborationTypes?: string[];
  dealBreakers?: string[];
  safetyRequirements?: string[];
}

interface ConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  boundaries?: Boundaries;
  onConfirm: () => void;
}

export function ConsentDialog({
  open,
  onOpenChange,
  userId,
  userName,
  boundaries = {},
  onConfirm,
}: ConsentDialogProps) {
  const [understandBoundaries, setUnderstandBoundaries] = useState(false);
  const [respectPreferences, setRespectPreferences] = useState(false);

  useEffect(() => {
    if (open) {
      setUnderstandBoundaries(false);
      setRespectPreferences(false);
    }
  }, [open]);

  const hasBoundaries =
    (boundaries.contentTypes?.length ?? 0) > 0 ||
    (boundaries.communicationPrefs?.length ?? 0) > 0 ||
    (boundaries.collaborationTypes?.length ?? 0) > 0 ||
    (boundaries.dealBreakers?.length ?? 0) > 0 ||
    (boundaries.safetyRequirements?.length ?? 0) > 0;

  const canProceed = understandBoundaries && respectPreferences;

  const handleConfirm = () => {
    const consentKey = `consent_acknowledged_${userId}`;
    localStorage.setItem(consentKey, new Date().toISOString());
    onConfirm();
    onOpenChange(false);
  };

  const hasAcknowledgedConsent = (targetUserId: string): boolean => {
    const consentKey = `consent_acknowledged_${targetUserId}`;
    return !!localStorage.getItem(consentKey);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Review {userName}'s Boundaries
          </DialogTitle>
          <DialogDescription>
            Before proceeding, please review their boundaries and confirm you understand them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {hasBoundaries ? (
            <>
              {boundaries.contentTypes && boundaries.contentTypes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Content Comfort Level</h4>
                  <div className="flex flex-wrap gap-2">
                    {boundaries.contentTypes.map((type) => (
                      <Badge key={type} variant="secondary" className="bg-primary/10 text-primary">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {boundaries.communicationPrefs && boundaries.communicationPrefs.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Communication</h4>
                  <div className="flex flex-wrap gap-2">
                    {boundaries.communicationPrefs.map((pref) => (
                      <Badge key={pref} variant="outline">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {pref}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {boundaries.safetyRequirements && boundaries.safetyRequirements.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Safety Requirements
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {boundaries.safetyRequirements.map((req) => (
                      <Badge
                        key={req}
                        variant="secondary"
                        className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                      >
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {boundaries.dealBreakers && boundaries.dealBreakers.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                    Deal Breakers
                  </h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {boundaries.dealBreakers.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {userName} hasn't set specific boundaries yet, but please be respectful in all interactions.
            </p>
          )}

          <div className="space-y-3 pt-4 border-t">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={understandBoundaries}
                onCheckedChange={(checked) => setUnderstandBoundaries(checked === true)}
                data-testid="checkbox-understand-boundaries"
              />
              <span className="text-sm">I understand {userName}'s boundaries</span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={respectPreferences}
                onCheckedChange={(checked) => setRespectPreferences(checked === true)}
                data-testid="checkbox-respect-preferences"
              />
              <span className="text-sm">I agree to respect their preferences</span>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-consent">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canProceed} data-testid="button-confirm-consent">
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirm & Proceed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useConsentCheck(userId: string): boolean {
  const consentKey = `consent_acknowledged_${userId}`;
  return !!localStorage.getItem(consentKey);
}
