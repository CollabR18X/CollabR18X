import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sparkles, Users, Zap, ArrowRight, MessageSquare } from "lucide-react";

export default function Landing() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-background/50 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
              C
            </div>
            <span className="font-display text-2xl font-bold">CreatorSync</span>
          </div>
          <a href="/api/login">
            <Button variant="outline" className="font-semibold border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
              Login
            </Button>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[120px] rounded-full -z-10 opacity-50" />
        
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="text-center space-y-8"
          >
            <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent border border-accent/20 font-medium text-sm">
              <Sparkles className="w-4 h-4" />
              <span>The #1 Platform for Creator Collabs</span>
            </motion.div>
            
            <motion.h1 variants={item} className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1]">
              Create Better <br />
              <span className="text-gradient">Together</span>
            </motion.h1>
            
            <motion.p variants={item} className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Stop creating in isolation. Find like-minded creators, organize collaborations, and grow your audience exponentially through shared content.
            </motion.p>
            
            <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a href="/api/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-14 px-8 text-lg rounded-2xl bg-gradient-to-r from-primary to-accent shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all">
                  Start Collaborating <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
              <Button size="lg" variant="ghost" className="w-full sm:w-auto h-14 px-8 text-lg rounded-2xl hover:bg-muted/50">
                View Directory
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Find Your Tribe",
                desc: "Search creators by niche, audience size, and platform to find your perfect match."
              },
              {
                icon: MessageSquare,
                title: "Manage Requests",
                desc: "Keep track of all your collaboration offers in one organized dashboard."
              },
              {
                icon: Zap,
                title: "Grow Faster",
                desc: "Leverage audience cross-pollination to skyrocket your growth metrics."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Showcase */}
      <section className="py-24 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="relative rounded-[2.5rem] overflow-hidden aspect-video shadow-2xl shadow-primary/20 border border-border">
            {/* Unsplash image: Diverse group of content creators working together in a studio */}
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop" 
              alt="Creators collaborating" 
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-12">
              <div className="max-w-xl text-white">
                <h2 className="font-display text-3xl font-bold mb-2">Join 10,000+ Creators</h2>
                <p className="text-white/80 text-lg">From YouTubers to TikTokers, everyone is here.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
