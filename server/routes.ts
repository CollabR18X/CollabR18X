import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { insertForumTopicSchema, insertForumPostSchema, insertPostReplySchema, insertEventSchema, insertSafetyAlertSchema } from "@shared/schema";

// Rate limiting for messages - 30 messages per minute per user
const messageRateLimits = new Map<string, { count: number; resetTime: number }>();
const MESSAGE_RATE_LIMIT = 30;
const MESSAGE_RATE_WINDOW = 60 * 1000; // 1 minute in ms

function checkMessageRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = messageRateLimits.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    messageRateLimits.set(userId, { count: 1, resetTime: now + MESSAGE_RATE_WINDOW });
    return true;
  }
  
  if (userLimit.count >= MESSAGE_RATE_LIMIT) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);

  // === Profiles ===
  
  app.get(api.profiles.me.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const profile = await storage.getProfileByUserId(userId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json(profile);
  });

  app.put(api.profiles.update.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const input = api.profiles.update.input.parse(req.body);
      const profile = await storage.updateProfile(userId, input);
      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get("/api/profiles/discover", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const filterSchema = z.object({
        maxDistance: z.coerce.number().optional(),
        contentType: z.string().optional(),
        experienceLevel: z.string().transform(s => s ? s.split(',') : undefined).optional(),
        availability: z.string().transform(s => s ? s.split(',') : undefined).optional(),
        travelMode: z.string().transform(s => s ? s.split(',') : undefined).optional(),
        monetization: z.string().transform(s => s ? s.split(',') : undefined).optional(),
      });
      const filters = filterSchema.parse(req.query);
      const profiles = await storage.getDiscoverProfiles(userId, {
        maxDistance: filters.maxDistance,
        contentType: filters.contentType,
        experienceLevel: filters.experienceLevel,
        availability: filters.availability,
        travelMode: filters.travelMode,
        monetization: filters.monetization,
      });
      res.json(profiles);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.profiles.list.path, isAuthenticated, async (req, res) => {
    const profiles = await storage.getAllProfiles();
    res.json(profiles);
  });

  app.get(api.profiles.get.path, isAuthenticated, async (req, res) => {
    const profile = await storage.getProfile(Number(req.params.id));
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json(profile);
  });

  app.put("/api/profiles/location", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const schema = z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      });
      const input = schema.parse(req.body);
      const profile = await storage.updateProfileLocation(userId, input.latitude, input.longitude);
      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get("/api/profiles/similar-interests", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const profiles = await storage.getSimilarInterestsProfiles(userId);
      res.json(profiles);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get("/api/profiles/nearby", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const schema = z.object({
        lat: z.coerce.number().min(-90).max(90),
        lng: z.coerce.number().min(-180).max(180),
        maxDistance: z.coerce.number().min(1).max(500).default(50),
      });
      const input = schema.parse(req.query);
      const profiles = await storage.getNearbyProfiles(input.lat, input.lng, input.maxDistance, userId);
      res.json(profiles);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === Location Hubs ===

  app.get("/api/profiles/by-location", isAuthenticated, async (req, res) => {
    try {
      const hubs = await storage.getProfilesByLocation();
      res.json(hubs);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get("/api/profiles/by-location/:location", isAuthenticated, async (req, res) => {
    try {
      const location = decodeURIComponent(req.params.location);
      const profiles = await storage.getProfilesInLocation(location);
      res.json(profiles);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === Saved Profiles ===

  app.get("/api/profiles/saved", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const saved = await storage.getSavedProfiles(userId);
      res.json(saved);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/profiles/:id/save", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const savedUserId = req.params.id;
      
      if (savedUserId === userId) {
        return res.status(400).json({ message: "Cannot save your own profile" });
      }

      const saved = await storage.saveProfile(userId, savedUserId);
      res.status(201).json(saved);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete("/api/profiles/:id/save", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const savedUserId = req.params.id;
      const success = await storage.unsaveProfile(userId, savedUserId);
      res.json({ success });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === Likes ===

  app.post(api.likes.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const input = api.likes.create.input.parse(req.body);
      
      if (input.likedId === userId) {
        return res.status(400).json({ message: "Cannot like yourself" });
      }

      const isBlocked = await storage.isBlocked(userId, input.likedId);
      if (isBlocked) {
        return res.status(400).json({ message: "Cannot like this user" });
      }

      const alreadyLiked = await storage.hasLiked(userId, input.likedId);
      if (alreadyLiked) {
        return res.status(400).json({ message: "Already liked this user" });
      }

      const like = await storage.createLike(userId, input.likedId, input.isSuperLike ?? false);
      
      const isMutual = await storage.checkMutualLike(userId, input.likedId);
      if (isMutual) {
        const match = await storage.createMatch(userId, input.likedId);
        return res.status(200).json({ match });
      }

      res.status(201).json(like);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.likes.received.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const likes = await storage.getLikesReceived(userId);
    res.json(likes);
  });

  app.post(api.likes.pass.path, isAuthenticated, async (req, res) => {
    res.json({ success: true });
  });

  // === Matches ===

  app.get(api.matches.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const matches = await storage.getMatches(userId);
    res.json(matches);
  });

  app.get("/api/matches/:id", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const matchId = Number(req.params.id);
    
    const isInMatch = await storage.isUserInMatch(userId, matchId);
    if (!isInMatch) {
      return res.status(403).json({ message: "Not authorized to view this match" });
    }

    const match = await storage.getMatch(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }
    res.json(match);
  });

  app.delete("/api/matches/:id", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const matchId = Number(req.params.id);
    
    const isInMatch = await storage.isUserInMatch(userId, matchId);
    if (!isInMatch) {
      return res.status(403).json({ message: "Not authorized to unmatch" });
    }

    const success = await storage.unmatch(matchId);
    res.json({ success });
  });

  // === Messages ===

  app.post("/api/matches/:matchId/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const matchId = Number(req.params.matchId);
      const input = api.messages.send.input.parse(req.body);
      
      // Rate limiting check - 30 messages per minute per user
      if (!checkMessageRateLimit(userId)) {
        return res.status(429).json({ message: "Too Many Requests. Please slow down." });
      }
      
      // Verify user is part of this match and match is active (prevents cold DMs)
      const match = await storage.getMatch(matchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      if (!match.isActive) {
        return res.status(403).json({ message: "This match is no longer active" });
      }
      
      // Explicit check that the user is one of the two parties in the match
      if (match.user1Id !== userId && match.user2Id !== userId) {
        return res.status(403).json({ message: "Not authorized to send messages in this match" });
      }

      const message = await storage.sendMessage(matchId, userId, input.content);
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get("/api/matches/:matchId/messages", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const matchId = Number(req.params.matchId);
    
    const isInMatch = await storage.isUserInMatch(userId, matchId);
    if (!isInMatch) {
      return res.status(403).json({ message: "Not authorized to view these messages" });
    }

    const messages = await storage.getMessages(matchId);
    res.json(messages);
  });

  app.patch("/api/matches/:matchId/messages/read", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const matchId = Number(req.params.matchId);
    
    const isInMatch = await storage.isUserInMatch(userId, matchId);
    if (!isInMatch) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const success = await storage.markMessagesAsRead(matchId, userId);
    res.json({ success });
  });

  // === Blocks ===

  app.post(api.blocks.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const input = api.blocks.create.input.parse(req.body);
      
      if (input.blockedId === userId) {
        return res.status(400).json({ message: "Cannot block yourself" });
      }

      const block = await storage.createBlock(userId, input.blockedId);
      res.status(201).json(block);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.blocks.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const blocks = await storage.getBlocks(userId);
    res.json(blocks);
  });

  app.delete("/api/blocks/:id", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const blockId = Number(req.params.id);
    
    const blocks = await storage.getBlocks(userId);
    const block = blocks.find(b => b.id === blockId);
    
    if (!block) {
      return res.status(404).json({ message: "Block not found" });
    }

    const success = await storage.removeBlock(blockId);
    res.json({ success });
  });

  // === Reports ===

  app.post(api.reports.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const input = api.reports.create.input.parse(req.body);
      
      if (input.reportedId === userId) {
        return res.status(400).json({ message: "Cannot report yourself" });
      }

      const report = await storage.createReport(userId, input.reportedId, input.reason, input.description ?? undefined);
      res.status(201).json(report);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === Collaborations ===

  app.get(api.collaborations.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const collabs = await storage.getCollaborationsForUser(userId);
    res.json(collabs);
  });

  app.post(api.collaborations.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const input = api.collaborations.create.input.parse(req.body);
      
      if (input.receiverId === userId) {
        return res.status(400).json({ message: "Cannot collaborate with yourself" });
      }

      const collab = await storage.createCollaboration(userId, input.receiverId, input.message);
      res.status(201).json(collab);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.patch(api.collaborations.updateStatus.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const input = api.collaborations.updateStatus.input.parse(req.body);
      const collabId = Number(req.params.id);

      const collabs = await storage.getCollaborationsForUser(userId);
      const collab = collabs.find(c => c.id === collabId);

      if (!collab) {
        return res.status(404).json({ message: "Collaboration not found" });
      }

      if (collab.receiverId !== userId) {
        return res.status(403).json({ message: "Only the receiver can update status" });
      }
      
      const updated = await storage.updateCollaborationStatus(collabId, input.status);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.patch("/api/collaborations/:id/acknowledge", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const collabId = Number(req.params.id);

      const collabs = await storage.getCollaborationsForUser(userId);
      const collab = collabs.find(c => c.id === collabId);

      if (!collab) {
        return res.status(404).json({ message: "Collaboration not found" });
      }

      if (collab.status !== 'accepted') {
        return res.status(400).json({ message: "Can only acknowledge accepted collaborations" });
      }

      const updated = await storage.acknowledgeCollaboration(collabId, userId);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === Collaboration Workspaces ===

  app.get("/api/collaborations/:id/workspace", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const collabId = Number(req.params.id);

      const collabs = await storage.getCollaborationsForUser(userId);
      const collab = collabs.find(c => c.id === collabId);

      if (!collab) {
        return res.status(404).json({ message: "Collaboration not found" });
      }

      let workspace = await storage.getWorkspace(collabId);
      if (!workspace) {
        workspace = await storage.createWorkspace(collabId);
      }

      res.json(workspace);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put("/api/collaborations/:id/workspace", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const collabId = Number(req.params.id);

      const collabs = await storage.getCollaborationsForUser(userId);
      const collab = collabs.find(c => c.id === collabId);

      if (!collab) {
        return res.status(404).json({ message: "Collaboration not found" });
      }

      const updated = await storage.updateWorkspace(collabId, userId, req.body);
      if (!updated) {
        return res.status(403).json({ message: "Not authorized to update this workspace" });
      }

      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/collaborations/:id/workspace/acknowledge-boundaries", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const collabId = Number(req.params.id);

      const collabs = await storage.getCollaborationsForUser(userId);
      const collab = collabs.find(c => c.id === collabId);

      if (!collab) {
        return res.status(404).json({ message: "Collaboration not found" });
      }

      const updated = await storage.acknowledgeWorkspaceBoundaries(collabId, userId);
      if (!updated) {
        return res.status(403).json({ message: "Not authorized to acknowledge boundaries" });
      }

      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === Forum Topics ===

  app.get("/api/forums", async (req, res) => {
    try {
      const topics = await storage.getForumTopics();
      res.json(topics);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/forums", isAuthenticated, async (req, res) => {
    try {
      const input = insertForumTopicSchema.parse(req.body);
      const topic = await storage.createForumTopic(input);
      res.status(201).json(topic);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === Forum Posts ===

  app.get("/api/forums/:topicId/posts", async (req, res) => {
    try {
      const topicId = Number(req.params.topicId);
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const offset = req.query.offset ? Number(req.query.offset) : undefined;
      const posts = await storage.getForumPosts(topicId, { limit, offset });
      res.json(posts);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/forums/:topicId/posts", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const topicId = Number(req.params.topicId);
      const input = insertForumPostSchema.parse({ ...req.body, topicId });
      const authorId = input.isAnonymous ? null : userId;
      const post = await storage.createForumPost(authorId, input);
      res.status(201).json(post);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get("/api/forums/posts/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const post = await storage.getForumPost(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put("/api/forums/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const id = Number(req.params.id);
      const schema = z.object({
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional()
      });
      const input = schema.parse(req.body);
      const post = await storage.updateForumPost(id, userId, input);
      if (!post) {
        return res.status(403).json({ message: "Not authorized to update this post" });
      }
      res.json(post);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete("/api/forums/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const id = Number(req.params.id);
      const success = await storage.deleteForumPost(id, userId);
      if (!success) {
        return res.status(403).json({ message: "Not authorized to delete this post" });
      }
      res.json({ success });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/forums/posts/:id/like", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const post = await storage.likeForumPost(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === Post Replies ===

  app.post("/api/forums/posts/:id/replies", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const postId = Number(req.params.id);
      const input = insertPostReplySchema.parse({ ...req.body, postId });
      const authorId = input.isAnonymous ? null : userId;
      const reply = await storage.createPostReply(authorId, input);
      res.status(201).json(reply);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete("/api/forums/replies/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const id = Number(req.params.id);
      const success = await storage.deletePostReply(id, userId);
      if (!success) {
        return res.status(403).json({ message: "Not authorized to delete this reply" });
      }
      res.json({ success });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === Events ===

  app.get("/api/events", async (req, res) => {
    try {
      const filters: { startDate?: Date; endDate?: Date; isVirtual?: boolean } = {};
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }
      if (req.query.isVirtual !== undefined) {
        filters.isVirtual = req.query.isVirtual === 'true';
      }
      const events = await storage.getEvents(filters);
      res.json(events);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/events", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const input = insertEventSchema.omit({ creatorId: true }).parse(req.body);
      const event = await storage.createEvent(userId, { ...input, creatorId: userId });
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put("/api/events/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const id = Number(req.params.id);
      const input = insertEventSchema.omit({ creatorId: true }).partial().parse(req.body);
      const event = await storage.updateEvent(id, userId, input);
      if (!event) {
        return res.status(403).json({ message: "Not authorized to update this event" });
      }
      res.json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete("/api/events/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const id = Number(req.params.id);
      const success = await storage.deleteEvent(id, userId);
      if (!success) {
        return res.status(403).json({ message: "Not authorized to delete this event" });
      }
      res.json({ success });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/events/:id/rsvp", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const eventId = Number(req.params.id);
      const schema = z.object({
        status: z.enum(["going", "maybe", "not_going"])
      });
      const input = schema.parse(req.body);
      const attendee = await storage.rsvpEvent(eventId, userId, input.status);
      res.json(attendee);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === Safety Alerts ===

  app.get("/api/safety-alerts", async (req, res) => {
    try {
      const filters: { alertType?: string; isVerified?: boolean; isResolved?: boolean } = {};
      if (req.query.alertType) {
        filters.alertType = req.query.alertType as string;
      }
      if (req.query.isVerified !== undefined) {
        filters.isVerified = req.query.isVerified === 'true';
      }
      if (req.query.isResolved !== undefined) {
        filters.isResolved = req.query.isResolved === 'true';
      }
      const alerts = await storage.getSafetyAlerts(filters);
      res.json(alerts);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/safety-alerts", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const input = insertSafetyAlertSchema.omit({ reporterId: true }).parse(req.body);
      const alert = await storage.createSafetyAlert(userId, { ...input, reporterId: userId });
      res.status(201).json(alert);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get("/api/safety-alerts/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const alert = await storage.getSafetyAlert(id);
      if (!alert) {
        return res.status(404).json({ message: "Safety alert not found" });
      }
      res.json(alert);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === Collab Templates ===

  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getCollabTemplates();
      res.json(templates);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Seed data on startup
  await storage.seedForumTopics();
  await storage.seedCollabTemplates();

  return httpServer;
}
