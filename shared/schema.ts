import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  bio: text("bio"),
  niche: text("niche"),
  portfolioUrl: text("portfolio_url"),
  location: text("location"),
  socialLinks: jsonb("social_links").$type<{ instagram?: string; twitter?: string; youtube?: string; tiktok?: string }>(),
  ageVerified: boolean("age_verified").notNull().default(false),
  socialsVerified: boolean("socials_verified").notNull().default(false),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  isNsfw: boolean("is_nsfw").notNull().default(false),
  birthDate: date("birth_date"),
  gender: text("gender"),
  lookingFor: text("looking_for"),
  interests: text("interests").array().notNull().default(sql`'{}'::text[]`),
  relationshipType: text("relationship_type"),
  height: integer("height"),
  occupation: text("occupation"),
  education: text("education"),
  photos: text("photos").array().notNull().default(sql`'{}'::text[]`),
  isVisible: boolean("is_visible").notNull().default(true),
  lastActive: timestamp("last_active").defaultNow(),
  privacySettings: jsonb("privacy_settings").$type<{
    showAge?: boolean;
    showLocation?: boolean;
    showBirthDate?: boolean;
    showOccupation?: boolean;
    showEducation?: boolean;
    showHeight?: boolean;
  }>().default({}),
  minAgePreference: integer("min_age_preference").default(18),
  maxAgePreference: integer("max_age_preference").default(99),
  maxDistance: integer("max_distance").default(100),
  genderPreference: text("gender_preference").array().notNull().default(sql`'{}'::text[]`),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  likerId: text("liker_id").notNull().references(() => users.id),
  likedId: text("liked_id").notNull().references(() => users.id),
  isSuperLike: boolean("is_super_like").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  user1Id: text("user1_id").notNull().references(() => users.id),
  user2Id: text("user2_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id),
  senderId: text("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  blockerId: text("blocker_id").notNull().references(() => users.id),
  blockedId: text("blocked_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: text("reporter_id").notNull().references(() => users.id),
  reportedId: text("reported_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const collaborations = pgTable("collaborations", {
  id: serial("id").primaryKey(),
  requesterId: text("requester_id").notNull().references(() => users.id),
  receiverId: text("receiver_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  sentLikes: many(likes, { relationName: "liker" }),
  receivedLikes: many(likes, { relationName: "liked" }),
  sentCollaborations: many(collaborations, { relationName: "requester" }),
  receivedCollaborations: many(collaborations, { relationName: "receiver" }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  liker: one(users, {
    fields: [likes.likerId],
    references: [users.id],
    relationName: "liker",
  }),
  liked: one(users, {
    fields: [likes.likedId],
    references: [users.id],
    relationName: "liked",
  }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  user1: one(users, {
    fields: [matches.user1Id],
    references: [users.id],
    relationName: "matchUser1",
  }),
  user2: one(users, {
    fields: [matches.user2Id],
    references: [users.id],
    relationName: "matchUser2",
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  match: one(matches, {
    fields: [messages.matchId],
    references: [matches.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const blocksRelations = relations(blocks, ({ one }) => ({
  blocker: one(users, {
    fields: [blocks.blockerId],
    references: [users.id],
    relationName: "blocker",
  }),
  blocked: one(users, {
    fields: [blocks.blockedId],
    references: [users.id],
    relationName: "blocked",
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
    relationName: "reporter",
  }),
  reported: one(users, {
    fields: [reports.reportedId],
    references: [users.id],
    relationName: "reported",
  }),
}));

export const collaborationsRelations = relations(collaborations, ({ one }) => ({
  requester: one(users, {
    fields: [collaborations.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  receiver: one(users, {
    fields: [collaborations.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, userId: true, lastActive: true });
export const insertLikeSchema = createInsertSchema(likes).omit({ id: true, likerId: true, createdAt: true });
export const insertMatchSchema = createInsertSchema(matches).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, senderId: true, createdAt: true, isRead: true });
export const insertBlockSchema = createInsertSchema(blocks).omit({ id: true, blockerId: true, createdAt: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, reporterId: true, createdAt: true, status: true });
export const insertCollaborationSchema = createInsertSchema(collaborations).omit({ id: true, requesterId: true, createdAt: true, status: true });

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Block = typeof blocks.$inferSelect;
export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Collaboration = typeof collaborations.$inferSelect;
export type InsertCollaboration = z.infer<typeof insertCollaborationSchema>;
