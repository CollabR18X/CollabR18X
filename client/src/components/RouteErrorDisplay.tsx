import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface RouteError {
  message: string;
  route?: string;
  status?: number;
  timestamp: number;
}

export function RouteErrorDisplay() {
  const [errors, setErrors] = useState<RouteError[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Listen for unhandled fetch errors
    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      if (error?.message && (error.message.includes("404") || error.message.includes("Route:") || error.message.includes("Not found"))) {
        const routeMatch = error.message.match(/Route:\s*([^\n]+)/);
        const statusMatch = error.message.match(/\[(\d+)\]/);
        const route = routeMatch ? routeMatch[1].trim() : (error.url || "Unknown route");
        const status = statusMatch ? parseInt(statusMatch[1]) : (error.status || 404);
        
        const errorObj: RouteError = {
          message: error.message,
          route: route,
          status: status,
          timestamp: Date.now()
        };
        
        setErrors(prev => [errorObj, ...prev.slice(0, 4)]); // Keep last 5 errors
        
        // Show toast notification
        toast({
          title: `Route Error ${status}`,
          description: `Failed to load: ${route}`,
          variant: "destructive",
        });
      }
    };

    // Also listen for unhandled promise rejections (from fetch)
    const handleRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      if (error?.message && (error.message.includes("404") || error.message.includes("Route:"))) {
        const routeMatch = error.message.match(/Route:\s*([^\n]+)/);
        const statusMatch = error.message.match(/\[(\d+)\]/);
        const route = routeMatch ? routeMatch[1].trim() : (error.url || "Unknown route");
        const status = statusMatch ? parseInt(statusMatch[1]) : 404;
        
        const errorObj: RouteError = {
          message: error.message,
          route: route,
          status: status,
          timestamp: Date.now()
        };
        
        setErrors(prev => [errorObj, ...prev.slice(0, 4)]);
        
        toast({
          title: `Route Error ${status}`,
          description: `Failed to load: ${route}`,
          variant: "destructive",
        });
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [toast]);

  const copyErrorDetails = (error: RouteError, errorId: number) => {
    const details = `Route: ${error.route}\nStatus: ${error.status}\nMessage: ${error.message}`;
    navigator.clipboard.writeText(details);
    setCopiedId(errorId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (errors.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {errors.map((error, idx) => {
        const errorId = error.timestamp;
        return (
        <Alert key={idx} variant="destructive" className="shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>Route Error {error.status ? `(${error.status})` : ""}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setErrors(prev => prev.filter((_, i) => i !== idx))}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertTitle>
          <AlertDescription className="space-y-2">
            {error.route && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <strong className="text-xs">Route:</strong>
                  <code className="text-xs bg-destructive/20 px-1 rounded block truncate mt-1" title={error.route}>
                    {error.route}
                  </code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 flex-shrink-0"
                  onClick={() => copyErrorDetails(error, errorId)}
                  title="Copy error details"
                >
                  {copiedId === errorId ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              {error.message.split("\n")[0]}
            </div>
            <div className="text-xs text-muted-foreground/70 mt-1">
              Check the browser console (F12) for full details
            </div>
          </AlertDescription>
        </Alert>
        );
      })}
    </div>
  );
}
