import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import { PublicNavbar } from "@/components/PublicNavbar";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Directory from "@/pages/Directory";
import Discovery from "@/pages/Discovery";
import MyProfile from "@/pages/MyProfile";
import Profile from "@/pages/Profile";
import Collaborations from "@/pages/Collaborations";
import BlockedUsers from "@/pages/BlockedUsers";
import Chat from "@/pages/Chat";
import Nearby from "@/pages/Nearby";
import SimilarInterests from "@/pages/SimilarInterests";
import Forums from "@/pages/Forums";
import Events from "@/pages/Events";
import SafetyAlerts from "@/pages/SafetyAlerts";
import LocalHubs from "@/pages/LocalHubs";
import Community from "@/pages/Community";
import CollaborationWorkspace from "@/pages/CollaborationWorkspace";
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
      <>
        <PublicNavbar />
        <main className="min-h-[calc(100vh-80px)] bg-background">
          <Switch>
            <Route path="/" component={Landing} />
            <Route path="/directory" component={Directory} />
            <Route path="/profile/:id" component={Profile} />
            <Route path="/community" component={Community} />
            <Route path="/community/forums" component={Forums} />
            <Route path="/community/forums/:topicId" component={Forums} />
            <Route path="/community/forums/posts/:postId" component={Forums} />
            <Route path="/community/events" component={Events} />
            <Route path="/community/events/:id" component={Events} />
            <Route path="/community/safety" component={SafetyAlerts} />
            <Route path="/community/safety/:id" component={SafetyAlerts} />
            <Route path="/community/hubs" component={LocalHubs} />
            <Route path="/community/hubs/:location" component={LocalHubs} />
            <Route component={Landing} />
          </Switch>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-64px)] bg-background">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/discovery" component={Discovery} />
          <Route path="/directory" component={Directory} />
          <Route path="/nearby" component={Nearby} />
          <Route path="/similar-interests" component={SimilarInterests} />
          <Route path="/profile/me" component={MyProfile} />
          <Route path="/profile/:id" component={Profile} />
          <Route path="/collaborations" component={Collaborations} />
          <Route path="/collaborations/:id/workspace" component={CollaborationWorkspace} />
          <Route path="/chat" component={Chat} />
          <Route path="/chat/:matchId" component={Chat} />
          <Route path="/blocked" component={BlockedUsers} />
          <Route path="/community" component={Community} />
          <Route path="/community/forums" component={Forums} />
          <Route path="/community/forums/:topicId" component={Forums} />
          <Route path="/community/forums/posts/:postId" component={Forums} />
          <Route path="/community/events" component={Events} />
          <Route path="/community/events/:id" component={Events} />
          <Route path="/community/safety" component={SafetyAlerts} />
          <Route path="/community/safety/:id" component={SafetyAlerts} />
          <Route path="/community/hubs" component={LocalHubs} />
          <Route path="/community/hubs/:location" component={LocalHubs} />
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
