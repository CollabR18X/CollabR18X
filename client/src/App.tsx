import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import React from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
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
import TermsOfService from "@/pages/TermsOfService";
import Feed from "@/pages/Feed";
import Help from "@/pages/Help";
import Collaborators from "@/pages/Collaborators";
import Followers from "@/pages/Followers";
import Following from "@/pages/Following";
import Muted from "@/pages/Muted";
import Recent from "@/pages/Recent";
import Bookmarks from "@/pages/Bookmarks";
import Tagged from "@/pages/Tagged";
import Restricted from "@/pages/Restricted";
import AccountSettings from "@/pages/AccountSettings";
import Vault from "@/pages/Vault";
import Statistics from "@/pages/Statistics";
import { CookieConsent } from "@/components/CookieConsent";
import { Loader2 } from "lucide-react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { RouteErrorDisplay } from "@/components/RouteErrorDisplay";

function Router() {
  const { user, isLoading } = useAuth();

  // Add a timeout fallback to prevent infinite loading
  const [showFallback, setShowFallback] = React.useState(false);
  
  React.useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowFallback(true);
      }, 8000); // Show fallback after 8 seconds
      return () => clearTimeout(timer);
    } else {
      setShowFallback(false);
    }
  }, [isLoading]);

  if (isLoading && !showFallback) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If loading for too long, show landing page
  if (isLoading && showFallback) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route component={Landing} />
      </Switch>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route component={Landing} /> {/* Redirect all unauth to landing */}
      </Switch>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-64px)] bg-background">
        <Switch>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/" component={Dashboard} /> {/* Also show dashboard at root */}
          <Route path="/discovery" component={Discovery} />
          <Route path="/directory" component={Directory} />
          <Route path="/nearby" component={Nearby} />
          <Route path="/similar-interests" component={SimilarInterests} />
          <Route path="/profile/me/edit" component={MyProfile} />
          <Route path="/profile/me" component={Profile} />
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
          <Route path="/terms" component={TermsOfService} />
          <Route path="/help" component={Help} />
          <Route path="/feed" component={Feed} />
          <Route path="/connections/collaborators" component={Collaborators} />
          <Route path="/connections/followers" component={Followers} />
          <Route path="/connections/following" component={Following} />
          <Route path="/connections/muted" component={Muted} />
          <Route path="/connections/recent" component={Recent} />
          <Route path="/connections/bookmarks" component={Bookmarks} />
          <Route path="/connections/tagged" component={Tagged} />
          <Route path="/connections/restricted" component={Restricted} />
          <Route path="/account/settings" component={AccountSettings} />
          <Route path="/vault" component={Vault} />
          <Route path="/statistics" component={Statistics} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
          <CookieConsent />
          <RouteErrorDisplay />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
