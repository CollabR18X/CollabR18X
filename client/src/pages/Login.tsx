import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { getApiUrl } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await fetch(getApiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        let errorMessage = "Login failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || `Login failed: ${response.status} ${response.statusText}`;
        } catch {
          errorMessage = `Login failed: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; first_name: string; last_name: string }) => {
      try {
        const response = await fetch(getApiUrl("/api/auth/register"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ detail: "Registration failed" }));
          throw new Error(error.detail || "Registration failed");
        }

        return response.json();
      } catch (error) {
        if (error instanceof TypeError && error.message.includes("fetch")) {
          throw new Error("Failed to connect to server. Please check if the backend is running.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Registration successful",
        description: "Account created! Redirecting...",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    // Check password length in bytes (UTF-8 encoding)
    const passwordBytes = new TextEncoder().encode(signupData.password).length;
    if (passwordBytes < 8 || passwordBytes > 100) {
      toast({
        title: "Invalid password",
        description: "Password must be between 8 and 100 bytes",
        variant: "destructive",
      });
      return;
    }

    signupMutation.mutate({
      email: signupData.email,
      password: signupData.password,
      first_name: signupData.first_name,
      last_name: signupData.last_name,
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
              <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
              <CardDescription>Sign in to your account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label htmlFor="login-password" className="text-sm font-medium">
                    Password
                  </label>
                  <div className="relative mt-1">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
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
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Log In"
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="signup-first-name" className="text-sm font-medium">
                      First Name
                    </label>
                    <Input
                      id="signup-first-name"
                      type="text"
                      placeholder="John"
                      value={signupData.first_name}
                      onChange={(e) => setSignupData({ ...signupData, first_name: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="signup-last-name" className="text-sm font-medium">
                      Last Name
                    </label>
                    <Input
                      id="signup-last-name"
                      type="text"
                      placeholder="Doe"
                      value={signupData.last_name}
                      onChange={(e) => setSignupData({ ...signupData, last_name: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="signup-email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label htmlFor="signup-password" className="text-sm font-medium">
                    Password
                  </label>
                  <div className="relative mt-1">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters (special characters allowed)"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
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
                  <label htmlFor="signup-confirm-password" className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <div className="relative mt-1">
                    <Input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
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
                    "Sign Up"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/register">
              <Button variant="link" className="p-0 h-auto font-semibold">
                Sign up
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
