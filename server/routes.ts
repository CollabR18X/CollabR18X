import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

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
    const userId = (req.user as any).claims.sub;
    const profiles = await storage.getDiscoverProfiles(userId);
    res.json(profiles);
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
      
      const isInMatch = await storage.isUserInMatch(userId, matchId);
      if (!isInMatch) {
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

  return httpServer;
}
