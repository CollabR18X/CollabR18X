import { db } from "./db";
import {
  profiles, collaborations, users, likes, matches, messages, blocks, reports,
  forumTopics, forumPosts, postReplies, events, eventAttendees, safetyAlerts,
  collaborationWorkspaces,
  type Profile, type InsertProfile,
  type Collaboration, type InsertCollaboration,
  type User,
  type Like, type InsertLike,
  type Match, type InsertMatch,
  type Message, type InsertMessage,
  type Block, type InsertBlock,
  type Report, type InsertReport,
  type ForumTopic, type InsertForumTopic,
  type ForumPost, type InsertForumPost,
  type PostReply, type InsertPostReply,
  type Event, type InsertEvent,
  type EventAttendee, type InsertEventAttendee,
  type SafetyAlert, type InsertSafetyAlert,
  type CollaborationWorkspace, type InsertCollaborationWorkspace
} from "@shared/schema";
import { eq, or, and, desc, ne, notInArray, sql, gte, lte, asc, count } from "drizzle-orm";

export interface IStorage {
  // Profiles
  getProfile(id: number): Promise<(Profile & { user: User }) | undefined>;
  getProfileByUserId(userId: string): Promise<Profile | undefined>;
  getAllProfiles(): Promise<(Profile & { user: User })[]>;
  getDiscoverProfiles(userId: string): Promise<(Profile & { user: User; matchScore: number })[]>;
  createProfile(userId: string, profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile>;
  updateProfileLocation(userId: string, lat: number, lng: number): Promise<Profile>;
  getNearbyProfiles(lat: number, lng: number, maxDistance: number, userId: string): Promise<(Profile & { user: User; distance: number })[]>;

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
  acknowledgeCollaboration(id: number, userId: string): Promise<Collaboration | undefined>;

  // Similar Interests
  getSimilarInterestsProfiles(userId: string): Promise<(Profile & { user: User; sharedInterests: string[]; sharedCount: number })[]>;

  // Location Hubs
  getProfilesByLocation(): Promise<{ location: string; count: number; profiles: (Profile & { user: User })[] }[]>;
  getProfilesInLocation(location: string): Promise<(Profile & { user: User })[]>;

  // Forum Topics
  getForumTopics(): Promise<(ForumTopic & { postCount: number })[]>;
  getForumTopic(id: number): Promise<(ForumTopic & { postCount: number }) | undefined>;
  createForumTopic(data: InsertForumTopic): Promise<ForumTopic>;

  // Forum Posts
  getForumPosts(topicId: number, options?: { limit?: number; offset?: number }): Promise<(ForumPost & { author: User | null; replyCount: number })[]>;
  getForumPost(id: number): Promise<(ForumPost & { author: User | null; replies: (PostReply & { author: User | null })[] }) | undefined>;
  createForumPost(authorId: string | null, data: InsertForumPost): Promise<ForumPost>;
  updateForumPost(id: number, userId: string, data: Partial<Pick<ForumPost, 'title' | 'content'>>): Promise<ForumPost | undefined>;
  deleteForumPost(id: number, userId: string): Promise<boolean>;
  likeForumPost(postId: number): Promise<ForumPost | undefined>;

  // Post Replies
  createPostReply(authorId: string | null, data: InsertPostReply): Promise<PostReply>;
  deletePostReply(id: number, userId: string): Promise<boolean>;

  // Events
  getEvents(filters?: { startDate?: Date; endDate?: Date; isVirtual?: boolean }): Promise<(Event & { creator: User; attendeeCount: number })[]>;
  getEvent(id: number): Promise<(Event & { creator: User; attendees: (EventAttendee & { user: User })[] }) | undefined>;
  createEvent(creatorId: string, data: InsertEvent): Promise<Event>;
  updateEvent(id: number, creatorId: string, data: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number, creatorId: string): Promise<boolean>;
  rsvpEvent(eventId: number, userId: string, status: string): Promise<EventAttendee>;

  // Safety Alerts
  getSafetyAlerts(filters?: { alertType?: string; isVerified?: boolean; isResolved?: boolean }): Promise<(SafetyAlert & { reporter: User })[]>;
  getSafetyAlert(id: number): Promise<(SafetyAlert & { reporter: User }) | undefined>;
  createSafetyAlert(reporterId: string, data: InsertSafetyAlert): Promise<SafetyAlert>;
  verifySafetyAlert(id: number): Promise<SafetyAlert | undefined>;
  resolveSafetyAlert(id: number): Promise<SafetyAlert | undefined>;

  // Seed Data
  seedForumTopics(): Promise<void>;

  // Collaboration Workspaces
  getWorkspace(collaborationId: number): Promise<CollaborationWorkspace | undefined>;
  createWorkspace(collaborationId: number): Promise<CollaborationWorkspace>;
  updateWorkspace(collaborationId: number, userId: string, data: Partial<InsertCollaborationWorkspace>): Promise<CollaborationWorkspace | undefined>;
  acknowledgeWorkspaceBoundaries(collaborationId: number, userId: string): Promise<CollaborationWorkspace | undefined>;
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

  async getDiscoverProfiles(userId: string): Promise<(Profile & { user: User; matchScore: number })[]> {
    const myProfile = await this.getProfileByUserId(userId);
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
    });

    const scoredProfiles = results.map(profile => {
      const score = this.calculateMatchScore(myProfile, profile);
      return { ...profile, matchScore: score };
    });

    scoredProfiles.sort((a, b) => b.matchScore - a.matchScore);
    
    return scoredProfiles as (Profile & { user: User; matchScore: number })[];
  }

  private calculateMatchScore(myProfile: Profile | undefined, otherProfile: Profile): number {
    if (!myProfile) return 50;
    
    let score = 0;
    const weights = {
      location: 20,
      interests: 30,
      genderPreference: 25,
      agePreference: 15,
      relationshipType: 10
    };

    if (myProfile.location && otherProfile.location) {
      const myLoc = myProfile.location.toLowerCase().trim();
      const otherLoc = otherProfile.location.toLowerCase().trim();
      if (myLoc === otherLoc) {
        score += weights.location;
      } else {
        const myParts = myLoc.split(/[,\s]+/).filter(Boolean);
        const otherParts = otherLoc.split(/[,\s]+/).filter(Boolean);
        const commonParts = myParts.filter(p => otherParts.some(op => op.includes(p) || p.includes(op)));
        if (commonParts.length > 0) {
          score += weights.location * (commonParts.length / Math.max(myParts.length, otherParts.length));
        }
      }
    }

    const myInterests = myProfile.interests || [];
    const otherInterests = otherProfile.interests || [];
    if (myInterests.length > 0 && otherInterests.length > 0) {
      const mySet = new Set(myInterests.map(i => i.toLowerCase().trim()));
      const matchingInterests = otherInterests.filter(i => mySet.has(i.toLowerCase().trim()));
      const interestScore = matchingInterests.length / Math.max(myInterests.length, 1);
      score += weights.interests * Math.min(interestScore * 1.5, 1);
    }

    const myGenderPref = myProfile.genderPreference || [];
    const otherGender = otherProfile.gender?.toLowerCase().trim();
    const otherGenderPref = otherProfile.genderPreference || [];
    const myGender = myProfile.gender?.toLowerCase().trim();
    
    let genderMatch = true;
    if (myGenderPref.length > 0 && otherGender) {
      genderMatch = myGenderPref.some(g => g.toLowerCase().trim() === otherGender);
    }
    if (genderMatch && otherGenderPref.length > 0 && myGender) {
      genderMatch = otherGenderPref.some(g => g.toLowerCase().trim() === myGender);
    }
    if (genderMatch) {
      score += weights.genderPreference;
    }

    const calculateAge = (birthDate: string | Date | null): number | null => {
      if (!birthDate) return null;
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    const myAge = calculateAge(myProfile.birthDate);
    const otherAge = calculateAge(otherProfile.birthDate);
    
    let ageMatch = true;
    if (otherAge !== null) {
      const myMinAge = myProfile.minAgePreference || 18;
      const myMaxAge = myProfile.maxAgePreference || 99;
      if (otherAge < myMinAge || otherAge > myMaxAge) {
        ageMatch = false;
      }
    }
    if (ageMatch && myAge !== null) {
      const otherMinAge = otherProfile.minAgePreference || 18;
      const otherMaxAge = otherProfile.maxAgePreference || 99;
      if (myAge < otherMinAge || myAge > otherMaxAge) {
        ageMatch = false;
      }
    }
    if (ageMatch) {
      score += weights.agePreference;
    }

    if (myProfile.relationshipType && otherProfile.relationshipType) {
      if (myProfile.relationshipType.toLowerCase() === otherProfile.relationshipType.toLowerCase()) {
        score += weights.relationshipType;
      }
    } else {
      score += weights.relationshipType * 0.5;
    }

    return Math.round(score);
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

  async updateProfileLocation(userId: string, lat: number, lng: number): Promise<Profile> {
    const existing = await this.getProfileByUserId(userId);
    if (!existing) {
      const newProfile = { 
        userId, 
        latitude: lat,
        longitude: lng,
        locationUpdatedAt: new Date(),
        ageVerified: false,
        socialsVerified: false,
        isNsfw: false,
        isVisible: true,
        lastActive: new Date()
      } as typeof profiles.$inferInsert;
      const [profile] = await db.insert(profiles).values(newProfile).returning();
      return profile;
    }
    const [updated] = await db.update(profiles)
      .set({ latitude: lat, longitude: lng, locationUpdatedAt: new Date(), lastActive: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return updated;
  }

  private calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async getNearbyProfiles(lat: number, lng: number, maxDistance: number, userId: string): Promise<(Profile & { user: User; distance: number })[]> {
    const blockedByMe = await db.select({ blockedId: blocks.blockedId }).from(blocks).where(eq(blocks.blockerId, userId));
    const blockedMe = await db.select({ blockerId: blocks.blockerId }).from(blocks).where(eq(blocks.blockedId, userId));
    
    const excludeIds = [
      userId,
      ...blockedByMe.map(b => b.blockedId),
      ...blockedMe.map(b => b.blockerId)
    ];

    const uniqueExcludeIds = Array.from(new Set(excludeIds));

    const results = await db.query.profiles.findMany({
      where: and(
        eq(profiles.isVisible, true),
        uniqueExcludeIds.length > 0 ? notInArray(profiles.userId, uniqueExcludeIds) : undefined
      ),
      with: { user: true },
    });

    const profilesWithDistance = results
      .filter(profile => profile.latitude !== null && profile.longitude !== null)
      .map(profile => {
        const distance = this.calculateHaversineDistance(lat, lng, profile.latitude!, profile.longitude!);
        return { ...profile, distance: Math.round(distance * 10) / 10 };
      })
      .filter(profile => profile.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);

    return profilesWithDistance as (Profile & { user: User; distance: number })[];
  }

  // === Location Hubs ===
  async getProfilesByLocation(): Promise<{ location: string; count: number; profiles: (Profile & { user: User })[] }[]> {
    const results = await db.query.profiles.findMany({
      where: and(
        eq(profiles.isVisible, true),
        sql`${profiles.location} IS NOT NULL AND ${profiles.location} != ''`
      ),
      with: { user: true },
    });

    const locationMap = new Map<string, (Profile & { user: User })[]>();
    
    for (const profile of results) {
      const location = profile.location?.trim();
      if (location) {
        if (!locationMap.has(location)) {
          locationMap.set(location, []);
        }
        locationMap.get(location)!.push(profile as Profile & { user: User });
      }
    }

    const hubs = Array.from(locationMap.entries()).map(([location, profilesList]) => ({
      location,
      count: profilesList.length,
      profiles: profilesList,
    }));

    hubs.sort((a, b) => b.count - a.count);

    return hubs;
  }

  async getProfilesInLocation(location: string): Promise<(Profile & { user: User })[]> {
    const results = await db.query.profiles.findMany({
      where: and(
        eq(profiles.isVisible, true),
        sql`LOWER(${profiles.location}) = LOWER(${location})`
      ),
      with: { user: true },
    });

    return results as (Profile & { user: User })[];
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

  async acknowledgeCollaboration(id: number, userId: string): Promise<Collaboration | undefined> {
    const [collab] = await db.select().from(collaborations).where(eq(collaborations.id, id));
    if (!collab) return undefined;

    const updates: Partial<{ acknowledgedByRequester: boolean; acknowledgedByReceiver: boolean }> = {};
    if (collab.requesterId === userId) {
      updates.acknowledgedByRequester = true;
    } else if (collab.receiverId === userId) {
      updates.acknowledgedByReceiver = true;
    } else {
      return undefined;
    }

    const [updated] = await db.update(collaborations).set(updates).where(eq(collaborations.id, id)).returning();
    return updated;
  }

  // === Similar Interests ===
  async getSimilarInterestsProfiles(userId: string): Promise<(Profile & { user: User; sharedInterests: string[]; sharedCount: number })[]> {
    const myProfile = await this.getProfileByUserId(userId);
    const myInterests = myProfile?.interests || [];
    
    if (myInterests.length === 0) {
      return [];
    }

    // Build exclusion list - always include at least the current user to avoid SQL issues
    const excludeUserIds = [userId];

    // Add blocked users (both directions)
    const blockedByMe = await db.select({ blockedId: blocks.blockedId })
      .from(blocks)
      .where(eq(blocks.blockerId, userId));
    const blockedMe = await db.select({ blockerId: blocks.blockerId })
      .from(blocks)
      .where(eq(blocks.blockedId, userId));

    excludeUserIds.push(...blockedByMe.map(b => b.blockedId));
    excludeUserIds.push(...blockedMe.map(b => b.blockerId));

    const results = await db.query.profiles.findMany({
      where: and(
        eq(profiles.isVisible, true),
        notInArray(profiles.userId, excludeUserIds)
      ),
      with: { user: true },
    });

    const myInterestsLower = new Set(myInterests.map(i => i.toLowerCase().trim()));
    
    const profilesWithSharedInterests = results
      .map(profile => {
        const otherInterests = profile.interests || [];
        const sharedInterests = otherInterests.filter(i => myInterestsLower.has(i.toLowerCase().trim()));
        return {
          ...profile,
          sharedInterests,
          sharedCount: sharedInterests.length
        };
      })
      .filter(profile => profile.sharedCount > 0)
      .sort((a, b) => b.sharedCount - a.sharedCount);

    return profilesWithSharedInterests as (Profile & { user: User; sharedInterests: string[]; sharedCount: number })[];
  }

  // === Forum Topics ===
  async getForumTopics(): Promise<(ForumTopic & { postCount: number })[]> {
    const topics = await db.select().from(forumTopics).orderBy(forumTopics.id);
    const topicsWithCounts = await Promise.all(
      topics.map(async (topic) => {
        const [result] = await db.select({ count: count() }).from(forumPosts).where(eq(forumPosts.topicId, topic.id));
        return { ...topic, postCount: result?.count || 0 };
      })
    );
    return topicsWithCounts;
  }

  async getForumTopic(id: number): Promise<(ForumTopic & { postCount: number }) | undefined> {
    const [topic] = await db.select().from(forumTopics).where(eq(forumTopics.id, id));
    if (!topic) return undefined;
    const [result] = await db.select({ count: count() }).from(forumPosts).where(eq(forumPosts.topicId, id));
    return { ...topic, postCount: result?.count || 0 };
  }

  async createForumTopic(data: InsertForumTopic): Promise<ForumTopic> {
    const [topic] = await db.insert(forumTopics).values(data).returning();
    return topic;
  }

  // === Forum Posts ===
  async getForumPosts(topicId: number, options?: { limit?: number; offset?: number }): Promise<(ForumPost & { author: User | null; replyCount: number })[]> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    
    const results = await db.query.forumPosts.findMany({
      where: eq(forumPosts.topicId, topicId),
      with: { author: true },
      orderBy: [desc(forumPosts.isPinned), desc(forumPosts.createdAt)],
      limit,
      offset
    });

    const postsWithReplyCounts = await Promise.all(
      results.map(async (post) => {
        const [result] = await db.select({ count: count() }).from(postReplies).where(eq(postReplies.postId, post.id));
        return {
          ...post,
          author: post.isAnonymous ? null : post.author,
          replyCount: result?.count || 0
        };
      })
    );

    return postsWithReplyCounts as (ForumPost & { author: User | null; replyCount: number })[];
  }

  async getForumPost(id: number): Promise<(ForumPost & { author: User | null; replies: (PostReply & { author: User | null })[] }) | undefined> {
    const result = await db.query.forumPosts.findFirst({
      where: eq(forumPosts.id, id),
      with: {
        author: true,
        replies: {
          with: { author: true },
          orderBy: [asc(postReplies.createdAt)]
        }
      }
    });

    if (!result) return undefined;

    const processedReplies = result.replies.map(reply => ({
      ...reply,
      author: reply.isAnonymous ? null : reply.author
    }));

    return {
      ...result,
      author: result.isAnonymous ? null : result.author,
      replies: processedReplies
    } as ForumPost & { author: User | null; replies: (PostReply & { author: User | null })[] };
  }

  async createForumPost(authorId: string | null, data: InsertForumPost): Promise<ForumPost> {
    const [post] = await db.insert(forumPosts).values({
      ...data,
      authorId: data.isAnonymous ? null : authorId
    }).returning();
    return post;
  }

  async updateForumPost(id: number, userId: string, data: Partial<Pick<ForumPost, 'title' | 'content'>>): Promise<ForumPost | undefined> {
    const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, id));
    if (!post || post.authorId !== userId) return undefined;
    
    const [updated] = await db.update(forumPosts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(forumPosts.id, id))
      .returning();
    return updated;
  }

  async deleteForumPost(id: number, userId: string): Promise<boolean> {
    const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, id));
    if (!post || post.authorId !== userId) return false;
    
    await db.delete(postReplies).where(eq(postReplies.postId, id));
    const [deleted] = await db.delete(forumPosts).where(eq(forumPosts.id, id)).returning();
    return !!deleted;
  }

  async likeForumPost(postId: number): Promise<ForumPost | undefined> {
    const [updated] = await db.update(forumPosts)
      .set({ likesCount: sql`${forumPosts.likesCount} + 1` })
      .where(eq(forumPosts.id, postId))
      .returning();
    return updated;
  }

  // === Post Replies ===
  async createPostReply(authorId: string | null, data: InsertPostReply): Promise<PostReply> {
    const [reply] = await db.insert(postReplies).values({
      ...data,
      authorId: data.isAnonymous ? null : authorId
    }).returning();
    return reply;
  }

  async deletePostReply(id: number, userId: string): Promise<boolean> {
    const [reply] = await db.select().from(postReplies).where(eq(postReplies.id, id));
    if (!reply || reply.authorId !== userId) return false;
    
    const [deleted] = await db.delete(postReplies).where(eq(postReplies.id, id)).returning();
    return !!deleted;
  }

  // === Events ===
  async getEvents(filters?: { startDate?: Date; endDate?: Date; isVirtual?: boolean }): Promise<(Event & { creator: User; attendeeCount: number })[]> {
    const conditions = [];
    if (filters?.startDate) {
      conditions.push(gte(events.eventDate, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(events.eventDate, filters.endDate));
    }
    if (filters?.isVirtual !== undefined) {
      conditions.push(eq(events.isVirtual, filters.isVirtual));
    }

    const results = await db.query.events.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { creator: true },
      orderBy: [asc(events.eventDate)]
    });

    const eventsWithCounts = await Promise.all(
      results.map(async (event) => {
        const [result] = await db.select({ count: count() }).from(eventAttendees).where(eq(eventAttendees.eventId, event.id));
        return { ...event, attendeeCount: result?.count || 0 };
      })
    );

    return eventsWithCounts as (Event & { creator: User; attendeeCount: number })[];
  }

  async getEvent(id: number): Promise<(Event & { creator: User; attendees: (EventAttendee & { user: User })[] }) | undefined> {
    const result = await db.query.events.findFirst({
      where: eq(events.id, id),
      with: {
        creator: true,
        attendees: {
          with: { user: true }
        }
      }
    });
    return result as (Event & { creator: User; attendees: (EventAttendee & { user: User })[] }) | undefined;
  }

  async createEvent(creatorId: string, data: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values({
      ...data,
      creatorId
    }).returning();
    return event;
  }

  async updateEvent(id: number, creatorId: string, data: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    if (!event || event.creatorId !== creatorId) return undefined;
    
    const [updated] = await db.update(events)
      .set(data)
      .where(eq(events.id, id))
      .returning();
    return updated;
  }

  async deleteEvent(id: number, creatorId: string): Promise<boolean> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    if (!event || event.creatorId !== creatorId) return false;
    
    await db.delete(eventAttendees).where(eq(eventAttendees.eventId, id));
    const [deleted] = await db.delete(events).where(eq(events.id, id)).returning();
    return !!deleted;
  }

  async rsvpEvent(eventId: number, userId: string, status: string): Promise<EventAttendee> {
    const [existing] = await db.select().from(eventAttendees).where(
      and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.userId, userId))
    );

    if (existing) {
      const [updated] = await db.update(eventAttendees)
        .set({ status })
        .where(eq(eventAttendees.id, existing.id))
        .returning();
      return updated;
    }

    const [attendee] = await db.insert(eventAttendees).values({
      eventId,
      userId,
      status
    }).returning();
    return attendee;
  }

  // === Safety Alerts ===
  async getSafetyAlerts(filters?: { alertType?: string; isVerified?: boolean; isResolved?: boolean }): Promise<(SafetyAlert & { reporter: User })[]> {
    const conditions = [];
    if (filters?.alertType) {
      conditions.push(eq(safetyAlerts.alertType, filters.alertType));
    }
    if (filters?.isVerified !== undefined) {
      conditions.push(eq(safetyAlerts.isVerified, filters.isVerified));
    }
    if (filters?.isResolved !== undefined) {
      conditions.push(eq(safetyAlerts.isResolved, filters.isResolved));
    }

    const results = await db.query.safetyAlerts.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { reporter: true },
      orderBy: [desc(safetyAlerts.createdAt)]
    });

    return results as (SafetyAlert & { reporter: User })[];
  }

  async getSafetyAlert(id: number): Promise<(SafetyAlert & { reporter: User }) | undefined> {
    const result = await db.query.safetyAlerts.findFirst({
      where: eq(safetyAlerts.id, id),
      with: { reporter: true }
    });
    return result as (SafetyAlert & { reporter: User }) | undefined;
  }

  async createSafetyAlert(reporterId: string, data: InsertSafetyAlert): Promise<SafetyAlert> {
    const [alert] = await db.insert(safetyAlerts).values({
      ...data,
      reporterId
    }).returning();
    return alert;
  }

  async verifySafetyAlert(id: number): Promise<SafetyAlert | undefined> {
    const [updated] = await db.update(safetyAlerts)
      .set({ isVerified: true })
      .where(eq(safetyAlerts.id, id))
      .returning();
    return updated;
  }

  async resolveSafetyAlert(id: number): Promise<SafetyAlert | undefined> {
    const [updated] = await db.update(safetyAlerts)
      .set({ isResolved: true })
      .where(eq(safetyAlerts.id, id))
      .returning();
    return updated;
  }

  // === Seed Data ===
  async seedForumTopics(): Promise<void> {
    const existingTopics = await db.select().from(forumTopics);
    if (existingTopics.length > 0) return;

    const defaultTopics = [
      { name: "Collabs & Networking", description: "Find collaborators and connect with other creators", icon: "Users" },
      { name: "Content Tips", description: "Share and discover content creation tips and tricks", icon: "Lightbulb" },
      { name: "Brand Deals", description: "Discuss brand partnerships and sponsorship opportunities", icon: "Briefcase" },
      { name: "Platform Updates", description: "Stay updated on platform news and changes", icon: "Bell" },
      { name: "Off Topic", description: "General discussions and community chat", icon: "MessageCircle" }
    ];

    await db.insert(forumTopics).values(defaultTopics);
  }

  // === Collaboration Workspaces ===
  async getWorkspace(collaborationId: number): Promise<CollaborationWorkspace | undefined> {
    const [workspace] = await db.select().from(collaborationWorkspaces).where(eq(collaborationWorkspaces.collaborationId, collaborationId));
    return workspace;
  }

  async createWorkspace(collaborationId: number): Promise<CollaborationWorkspace> {
    const existing = await this.getWorkspace(collaborationId);
    if (existing) return existing;

    const [workspace] = await db.insert(collaborationWorkspaces).values({
      collaborationId,
      boundariesAcknowledged: { user1Acknowledged: false, user2Acknowledged: false }
    }).returning();
    return workspace;
  }

  async updateWorkspace(collaborationId: number, userId: string, data: Partial<InsertCollaborationWorkspace>): Promise<CollaborationWorkspace | undefined> {
    const [collab] = await db.select().from(collaborations).where(eq(collaborations.id, collaborationId));
    if (!collab) return undefined;

    if (collab.requesterId !== userId && collab.receiverId !== userId) {
      return undefined;
    }

    let workspace = await this.getWorkspace(collaborationId);
    if (!workspace) {
      workspace = await this.createWorkspace(collaborationId);
    }

    const { collaborationId: _collabId, ...updateData } = data;
    const [updated] = await db.update(collaborationWorkspaces)
      .set({ ...updateData, updatedAt: new Date() } as Partial<typeof collaborationWorkspaces.$inferInsert>)
      .where(eq(collaborationWorkspaces.collaborationId, collaborationId))
      .returning();
    return updated;
  }

  async acknowledgeWorkspaceBoundaries(collaborationId: number, userId: string): Promise<CollaborationWorkspace | undefined> {
    const [collab] = await db.select().from(collaborations).where(eq(collaborations.id, collaborationId));
    if (!collab) return undefined;

    if (collab.requesterId !== userId && collab.receiverId !== userId) {
      return undefined;
    }

    let workspace = await this.getWorkspace(collaborationId);
    if (!workspace) {
      workspace = await this.createWorkspace(collaborationId);
    }

    const currentAck = workspace.boundariesAcknowledged || { user1Acknowledged: false, user2Acknowledged: false };
    const currentAckedAt = currentAck.acknowledgedAt || {};
    const now = new Date().toISOString();

    const isUser1 = collab.requesterId === userId;
    const newAck = {
      user1Acknowledged: isUser1 ? true : currentAck.user1Acknowledged,
      user2Acknowledged: isUser1 ? currentAck.user2Acknowledged : true,
      acknowledgedAt: {
        ...currentAckedAt,
        [isUser1 ? 'user1' : 'user2']: now
      }
    };

    const [updated] = await db.update(collaborationWorkspaces)
      .set({ boundariesAcknowledged: newAck, updatedAt: new Date() })
      .where(eq(collaborationWorkspaces.collaborationId, collaborationId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
