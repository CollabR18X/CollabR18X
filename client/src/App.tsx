import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Directory from "@/pages/Directory";
import MyProfile from "@/pages/MyProfile";
import Profile from "@/pages/Profile";
import Collaborations from "@/pages/Collaborations";
import BlockedUsers from "@/pages/BlockedUsers";
import Chat from "@/pages/Chat";
import { Loader2 } from "lucide-react";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} /> {/* Redirect all unauth to landing */}
      </Switch>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-64px)] bg-background">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/directory" component={Directory} />
          <Route path="/profile/me" component={MyProfile} />
          <Route path="/profile/:id" component={Profile} />
          <Route path="/collaborations" component={Collaborations} />
          <Route path="/chat" component={Chat} />
          <Route path="/chat/:matchId" component={Chat} />
          <Route path="/blocked" component={BlockedUsers} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
