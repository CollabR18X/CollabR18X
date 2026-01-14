import { Link } from "wouter";
import { MessageSquare, Calendar, Building, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Community() {
  const communityOptions = [
    {
      title: "Forums",
      description: "Join discussions with fellow creators on various topics and collaborate.",
      icon: MessageSquare,
      href: "/community/forums",
      color: "text-blue-500",
      testId: "card-forums",
    },
    {
      title: "Events",
      description: "Discover and join events with fellow creators in your community.",
      icon: Calendar,
      href: "/community/events",
      color: "text-purple-500",
      testId: "card-events",
    },
    {
      title: "Local Hubs",
      description: "Connect with creators in your area and find local collaboration opportunities.",
      icon: Building,
      href: "/community/hubs",
      color: "text-green-500",
      testId: "card-hubs",
    },
    {
      title: "Safety Alerts",
      description: "Stay informed about community safety concerns and warnings.",
      icon: Shield,
      href: "/community/safety",
      color: "text-red-500",
      testId: "card-safety",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-12 min-h-screen">
      {/* Header Section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="font-display text-4xl md:text-5xl font-bold">Community</h1>
        <p className="text-lg text-muted-foreground">
          Connect, collaborate, and grow with creators in our vibrant community.
        </p>
      </div>

      {/* Community Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {communityOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Link key={option.href} href={option.href}>
              <Card
                className="cursor-pointer hover:shadow-lg hover:border-primary/20 transition-all duration-300 h-full"
                data-testid={option.testId}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className={`p-3 rounded-lg bg-muted/50`}>
                      <Icon className={`h-6 w-6 ${option.color}`} />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-semibold">
                    {option.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {option.description}
                  </p>
                  <Button
                    variant="ghost"
                    className="mt-4 -ml-4 text-primary hover:text-primary hover:bg-primary/5"
                    data-testid={`button-${option.title.toLowerCase()}`}
                  >
                    Explore
                    <span className="ml-2">→</span>
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
