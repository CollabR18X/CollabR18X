import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { getApiUrl, isApiUrlConfigured } from "@/lib/queryClient";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
  });

  const signupMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; first_name: string; last_name: string }) => {
      const apiUrl = getApiUrl("/api/auth/register");
      console.log("Registration attempt - API URL:", apiUrl);
      
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include",
        });

        console.log("Registration response status:", response.status, response.statusText);

        if (!response.ok) {
          let errorMessage = "Registration failed";
          try {
            const errorData = await response.json();
            console.error("Registration error data:", errorData);
            errorMessage = errorData.detail || errorData.message || `Registration failed: ${response.status} ${response.statusText}`;
          } catch (parseError) {
            const text = await response.text().catch(() => "");
            console.error("Registration error (non-JSON):", text);
            errorMessage = `Registration failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`;
          }
          const err = new Error(errorMessage) as Error & { status?: number; url?: string };
          err.status = response.status;
          err.url = apiUrl;
          throw err;
        }

        const result = await response.json();
        console.log("Registration successful:", result);
        return result;
      } catch (error: unknown) {
        console.error("Registration error:", error);
        const err = error as Error & { status?: number; url?: string };
        // Network or 404 usually means API URL not set or backend down
        if (err instanceof TypeError && err.message?.includes("fetch")) {
          throw new Error(
            "Cannot reach the server. If this site is on GitHub Pages or Render, set VITE_API_URL to your backend URL when building (e.g. https://collabr18x-api.onrender.com)."
          );
        }
        if (err.status === 404 || err.status === 405) {
          throw new Error(
            "Registration can't reach the API (404/405). This usually means the site was built without the backend URL. Set VITE_API_URL to your API URL (e.g. https://collabr18x-api.onrender.com) when building, then rebuild and redeploy."
          );
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Registration successful",
        description: "Account created! Redirecting to dashboard...",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      // Only show error message, not duplicate title
      const errorMessage = error.message || "An unexpected error occurred. Please try again.";
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    // Check password length in bytes (UTF-8 encoding)
    const passwordBytes = new TextEncoder().encode(formData.password).length;
    if (passwordBytes < 8 || passwordBytes > 100) {
      toast({
        title: "Invalid password",
        description: "Password must be between 8 and 100 bytes",
        variant: "destructive",
      });
      return;
    }

    signupMutation.mutate({
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name,
      last_name: formData.last_name,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
              <CardDescription>Sign up to start collaborating</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isApiUrlConfigured() && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Registration will not work</AlertTitle>
              <AlertDescription>
                This site was built without the backend API URL. Set <strong>VITE_API_URL</strong> to your API URL (e.g.{" "}
                <code className="text-xs">https://collabr18x-api.onrender.com</code>) when building the frontend, then
                rebuild and redeploy. GitHub: Settings → Secrets and variables → Actions → Variables.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first-name" className="text-sm font-medium">
                  First Name
                </label>
                <Input
                  id="first-name"
                  type="text"
                  placeholder="John"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              
              <div>
                <label htmlFor="last-name" className="text-sm font-medium">
                  Last Name
                </label>
                <Input
                  id="last-name"
                  type="text"
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Special characters are allowed and recommended
              </p>
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm Password
              </label>
              <div className="relative mt-1">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login">
              <Button variant="link" className="p-0 h-auto font-semibold">
                Sign in
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
