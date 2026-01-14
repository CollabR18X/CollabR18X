import { db } from "./db";
import {
  profiles, collaborations, users,
  type Profile, type InsertProfile,
  type Collaboration, type InsertCollaboration,
  type User
} from "@shared/schema";
import { eq, or, and, desc } from "drizzle-orm";

export interface IStorage {
  // Profiles
  getProfile(id: number): Promise<(Profile & { user: User }) | undefined>;
  getProfileByUserId(userId: string): Promise<Profile | undefined>;
  getAllProfiles(): Promise<(Profile & { user: User })[]>;
  createProfile(userId: string, profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile>;

  // Collaborations
  getCollaborationsForUser(userId: string): Promise<(Collaboration & { requester: User, receiver: User })[]>;
  createCollaboration(requesterId: string, receiverId: string, message: string): Promise<Collaboration>;
  updateCollaborationStatus(id: number, status: string): Promise<Collaboration | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getProfile(id: number): Promise<(Profile & { user: User }) | undefined> {
    const result = await db.query.profiles.findFirst({
      where: eq(profiles.id, id),
      with: { user: true }
    });
    return result as (Profile & { user: User }) | undefined;
  }

  async getProfileByUserId(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async getAllProfiles(): Promise<(Profile & { user: User })[]> {
    const results = await db.query.profiles.findMany({
      with: { user: true }
    });
    return results as (Profile & { user: User })[];
  }

  async createProfile(userId: string, profileData: InsertProfile): Promise<Profile> {
    const [profile] = await db.insert(profiles).values({ ...profileData, userId }).returning();
    return profile;
  }

  async updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile> {
    // Check if profile exists, if not create it (upsert-ish logic for 'me' endpoint flexibility)
    const existing = await this.getProfileByUserId(userId);
    if (!existing) {
       // Should ideally be create, but strictly update here.
       // For simplicity, we assume profile is created on first login or handled elsewhere.
       // Actually, let's just insert if not exists for robustness in 'update' if that's the primary way to edit.
       // But schema requires userId which we have.
       const [profile] = await db.insert(profiles).values({ ...updates, userId }).returning();
       return profile;
    }
    const [updated] = await db.update(profiles).set(updates).where(eq(profiles.userId, userId)).returning();
    return updated;
  }

  async getCollaborationsForUser(userId: string): Promise<(Collaboration & { requester: User, receiver: User })[]> {
    const results = await db.query.collaborations.findMany({
      where: or(eq(collaborations.requesterId, userId), eq(collaborations.receiverId, userId)),
      with: { requester: true, receiver: true },
      orderBy: desc(collaborations.createdAt)
    });
    return results as (Collaboration & { requester: User, receiver: User })[];
  }

  async createCollaboration(requesterId: string, receiverId: string, message: string): Promise<Collaboration> {
    const [collab] = await db.insert(collaborations).values({
      requesterId,
      receiverId,
      message,
      status: "pending"
    }).returning();
    return collab;
  }

  async updateCollaborationStatus(id: number, status: string): Promise<Collaboration | undefined> {
    const [updated] = await db.update(collaborations).set({ status }).where(eq(collaborations.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
