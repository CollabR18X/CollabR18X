import { db } from "./db";
import {
  profiles, collaborations, users, likes, matches, messages, blocks, reports,
  type Profile, type InsertProfile,
  type Collaboration, type InsertCollaboration,
  type User,
  type Like, type InsertLike,
  type Match, type InsertMatch,
  type Message, type InsertMessage,
  type Block, type InsertBlock,
  type Report, type InsertReport
} from "@shared/schema";
import { eq, or, and, desc, ne, notInArray, sql } from "drizzle-orm";

export interface IStorage {
  // Profiles
  getProfile(id: number): Promise<(Profile & { user: User }) | undefined>;
  getProfileByUserId(userId: string): Promise<Profile | undefined>;
  getAllProfiles(): Promise<(Profile & { user: User })[]>;
  getDiscoverProfiles(userId: string): Promise<(Profile & { user: User })[]>;
  createProfile(userId: string, profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile>;

  // Likes
  createLike(likerId: string, likedId: string, isSuperLike?: boolean): Promise<Like>;
  getLikesReceived(userId: string): Promise<(Like & { liker: User })[]>;
  checkMutualLike(user1Id: string, user2Id: string): Promise<boolean>;
  hasLiked(likerId: string, likedId: string): Promise<boolean>;

  // Matches
  createMatch(user1Id: string, user2Id: string): Promise<Match>;
  getMatches(userId: string): Promise<(Match & { user1: User, user2: User })[]>;
  getMatch(matchId: number): Promise<(Match & { user1: User, user2: User, messages: Message[] }) | undefined>;
  unmatch(matchId: number): Promise<boolean>;
  isUserInMatch(userId: string, matchId: number): Promise<boolean>;

  // Messages
  sendMessage(matchId: number, senderId: string, content: string): Promise<Message>;
  getMessages(matchId: number): Promise<Message[]>;
  markMessagesAsRead(matchId: number, userId: string): Promise<boolean>;

  // Blocks
  createBlock(blockerId: string, blockedId: string): Promise<Block>;
  getBlocks(userId: string): Promise<(Block & { blocked: User })[]>;
  removeBlock(blockId: number): Promise<boolean>;
  isBlocked(user1Id: string, user2Id: string): Promise<boolean>;

  // Reports
  createReport(reporterId: string, reportedId: string, reason: string, description?: string): Promise<Report>;

  // Collaborations
  getCollaborationsForUser(userId: string): Promise<(Collaboration & { requester: User, receiver: User })[]>;
  createCollaboration(requesterId: string, receiverId: string, message: string): Promise<Collaboration>;
  updateCollaborationStatus(id: number, status: string): Promise<Collaboration | undefined>;
}

export class DatabaseStorage implements IStorage {
  // === Profiles ===
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
      where: eq(profiles.isVisible, true),
      with: { user: true }
    });
    return results as (Profile & { user: User })[];
  }

  async getDiscoverProfiles(userId: string): Promise<(Profile & { user: User })[]> {
    const blockedByMe = await db.select({ blockedId: blocks.blockedId }).from(blocks).where(eq(blocks.blockerId, userId));
    const blockedMe = await db.select({ blockerId: blocks.blockerId }).from(blocks).where(eq(blocks.blockedId, userId));
    const likedByMe = await db.select({ likedId: likes.likedId }).from(likes).where(eq(likes.likerId, userId));
    const myMatches = await this.getMatches(userId);
    
    const excludeIds = [
      userId,
      ...blockedByMe.map(b => b.blockedId),
      ...blockedMe.map(b => b.blockerId),
      ...likedByMe.map(l => l.likedId),
      ...myMatches.flatMap(m => [m.user1Id, m.user2Id])
    ];

    const uniqueExcludeIds = Array.from(new Set(excludeIds));

    const results = await db.query.profiles.findMany({
      where: and(
        eq(profiles.isVisible, true),
        uniqueExcludeIds.length > 0 ? notInArray(profiles.userId, uniqueExcludeIds) : undefined
      ),
      with: { user: true },
      orderBy: desc(profiles.lastActive)
    });
    return results as (Profile & { user: User })[];
  }

  async createProfile(userId: string, profileData: InsertProfile): Promise<Profile> {
    const values = { ...profileData, userId } as typeof profiles.$inferInsert;
    const [profile] = await db.insert(profiles).values(values).returning();
    return profile;
  }

  async updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile> {
    const existing = await this.getProfileByUserId(userId);
    if (!existing) {
      const newProfile = { 
        ...updates, 
        userId, 
        ageVerified: updates.ageVerified ?? false,
        socialsVerified: updates.socialsVerified ?? false,
        isNsfw: updates.isNsfw ?? false,
        isVisible: updates.isVisible ?? true,
        lastActive: new Date()
      } as typeof profiles.$inferInsert;
      const [profile] = await db.insert(profiles).values(newProfile).returning();
      return profile;
    }
    const updateData = { ...updates, lastActive: new Date() } as Partial<typeof profiles.$inferInsert>;
    const [updated] = await db.update(profiles)
      .set(updateData)
      .where(eq(profiles.userId, userId))
      .returning();
    return updated;
  }

  // === Likes ===
  async createLike(likerId: string, likedId: string, isSuperLike = false): Promise<Like> {
    const existing = await this.hasLiked(likerId, likedId);
    if (existing) {
      const [existingLike] = await db.select().from(likes).where(and(eq(likes.likerId, likerId), eq(likes.likedId, likedId)));
      return existingLike;
    }
    const [like] = await db.insert(likes).values({ likerId, likedId, isSuperLike }).returning();
    return like;
  }

  async getLikesReceived(userId: string): Promise<(Like & { liker: User })[]> {
    const results = await db.query.likes.findMany({
      where: eq(likes.likedId, userId),
      with: { liker: true },
      orderBy: desc(likes.createdAt)
    });
    return results as (Like & { liker: User })[];
  }

  async checkMutualLike(user1Id: string, user2Id: string): Promise<boolean> {
    const [like1] = await db.select().from(likes).where(and(eq(likes.likerId, user1Id), eq(likes.likedId, user2Id)));
    const [like2] = await db.select().from(likes).where(and(eq(likes.likerId, user2Id), eq(likes.likedId, user1Id)));
    return !!like1 && !!like2;
  }

  async hasLiked(likerId: string, likedId: string): Promise<boolean> {
    const [like] = await db.select().from(likes).where(and(eq(likes.likerId, likerId), eq(likes.likedId, likedId)));
    return !!like;
  }

  // === Matches ===
  async createMatch(user1Id: string, user2Id: string): Promise<Match> {
    const existingMatch = await db.select().from(matches).where(
      or(
        and(eq(matches.user1Id, user1Id), eq(matches.user2Id, user2Id)),
        and(eq(matches.user1Id, user2Id), eq(matches.user2Id, user1Id))
      )
    );
    if (existingMatch.length > 0) {
      return existingMatch[0];
    }
    const [match] = await db.insert(matches).values({ user1Id, user2Id }).returning();
    return match;
  }

  async getMatches(userId: string): Promise<(Match & { user1: User, user2: User })[]> {
    const results = await db.query.matches.findMany({
      where: and(
        or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)),
        eq(matches.isActive, true)
      ),
      with: { user1: true, user2: true },
      orderBy: desc(matches.createdAt)
    });
    return results as (Match & { user1: User, user2: User })[];
  }

  async getMatch(matchId: number): Promise<(Match & { user1: User, user2: User, messages: Message[] }) | undefined> {
    const result = await db.query.matches.findFirst({
      where: eq(matches.id, matchId),
      with: { user1: true, user2: true, messages: true }
    });
    return result as (Match & { user1: User, user2: User, messages: Message[] }) | undefined;
  }

  async unmatch(matchId: number): Promise<boolean> {
    const [updated] = await db.update(matches).set({ isActive: false }).where(eq(matches.id, matchId)).returning();
    return !!updated;
  }

  async isUserInMatch(userId: string, matchId: number): Promise<boolean> {
    const [match] = await db.select().from(matches).where(
      and(
        eq(matches.id, matchId),
        or(eq(matches.user1Id, userId), eq(matches.user2Id, userId))
      )
    );
    return !!match;
  }

  // === Messages ===
  async sendMessage(matchId: number, senderId: string, content: string): Promise<Message> {
    const [message] = await db.insert(messages).values({ matchId, senderId, content }).returning();
    return message;
  }

  async getMessages(matchId: number): Promise<Message[]> {
    const results = await db.select().from(messages).where(eq(messages.matchId, matchId)).orderBy(messages.createdAt);
    return results;
  }

  async markMessagesAsRead(matchId: number, recipientId: string): Promise<boolean> {
    await db.update(messages)
      .set({ isRead: true })
      .where(and(
        eq(messages.matchId, matchId), 
        ne(messages.senderId, recipientId),
        eq(messages.isRead, false)
      ));
    return true;
  }

  // === Blocks ===
  async createBlock(blockerId: string, blockedId: string): Promise<Block> {
    const [block] = await db.insert(blocks).values({ blockerId, blockedId }).returning();
    return block;
  }

  async getBlocks(userId: string): Promise<(Block & { blocked: User })[]> {
    const results = await db.query.blocks.findMany({
      where: eq(blocks.blockerId, userId),
      with: { blocked: true }
    });
    return results as (Block & { blocked: User })[];
  }

  async removeBlock(blockId: number): Promise<boolean> {
    const [deleted] = await db.delete(blocks).where(eq(blocks.id, blockId)).returning();
    return !!deleted;
  }

  async isBlocked(user1Id: string, user2Id: string): Promise<boolean> {
    const [block] = await db.select().from(blocks).where(
      or(
        and(eq(blocks.blockerId, user1Id), eq(blocks.blockedId, user2Id)),
        and(eq(blocks.blockerId, user2Id), eq(blocks.blockedId, user1Id))
      )
    );
    return !!block;
  }

  // === Reports ===
  async createReport(reporterId: string, reportedId: string, reason: string, description?: string): Promise<Report> {
    const [report] = await db.insert(reports).values({ reporterId, reportedId, reason, description }).returning();
    return report;
  }

  // === Collaborations ===
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
