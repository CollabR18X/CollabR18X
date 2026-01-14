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
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // === Profiles ===
  
  // Get My Profile
  app.get(api.profiles.me.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const profile = await storage.getProfileByUserId(userId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json(profile);
  });

  // Update My Profile
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

  // List Profiles (Directory)
  app.get(api.profiles.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile?.ageVerified) {
      return res.status(403).json({ message: "Age verification required" });
    }

    const profiles = await storage.getAllProfiles();
    res.json(profiles);
  });

  // Get Profile by ID
  app.get(api.profiles.get.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const myProfile = await storage.getProfileByUserId(userId);
    
    if (!myProfile?.ageVerified) {
      return res.status(403).json({ message: "Age verification required" });
    }

    const profile = await storage.getProfile(Number(req.params.id));
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json(profile);
  });

  // === Collaborations ===

  // List Collaborations
  app.get(api.collaborations.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const collabs = await storage.getCollaborationsForUser(userId);
    res.json(collabs);
  });

  // Create Collaboration Request
  app.post(api.collaborations.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const input = api.collaborations.create.input.parse(req.body);
      
      // Prevent self-collaboration
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

  // Update Collaboration Status
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

      // Only the receiver can update the status (accept/reject)
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

// Helper to seed data (can be called from index.ts or just rely on manual creation)
async function seedData() {
  // Seeding logic here if needed
}
