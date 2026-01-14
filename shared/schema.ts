import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, date, real } from "drizzle-orm/pg-core";
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
  latitude: real("latitude"),
  longitude: real("longitude"),
  locationUpdatedAt: timestamp("location_updated_at"),
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

export const forumTopics = pgTable("forum_topics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull().references(() => forumTopics.id),
  authorId: text("author_id").references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  isPinned: boolean("is_pinned").notNull().default(false),
  likesCount: integer("likes_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const postReplies = pgTable("post_replies", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => forumPosts.id),
  authorId: text("author_id").references(() => users.id),
  content: text("content").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  creatorId: text("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  eventDate: timestamp("event_date").notNull(),
  isVirtual: boolean("is_virtual").notNull().default(false),
  virtualLink: text("virtual_link"),
  maxAttendees: integer("max_attendees"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventAttendees = pgTable("event_attendees", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  userId: text("user_id").notNull().references(() => users.id),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const safetyAlerts = pgTable("safety_alerts", {
  id: serial("id").primaryKey(),
  reporterId: text("reporter_id").notNull().references(() => users.id),
  alertType: text("alert_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  evidenceUrls: text("evidence_urls").array().notNull().default(sql`'{}'::text[]`),
  suspectName: text("suspect_name"),
  suspectHandle: text("suspect_handle"),
  isVerified: boolean("is_verified").notNull().default(false),
  isResolved: boolean("is_resolved").notNull().default(false),
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
  forumPosts: many(forumPosts, { relationName: "forumPostAuthor" }),
  postReplies: many(postReplies, { relationName: "postReplyAuthor" }),
  createdEvents: many(events, { relationName: "eventCreator" }),
  eventAttendances: many(eventAttendees, { relationName: "eventAttendee" }),
  safetyAlerts: many(safetyAlerts, { relationName: "safetyAlertReporter" }),
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

export const forumTopicsRelations = relations(forumTopics, ({ many }) => ({
  posts: many(forumPosts),
}));

export const forumPostsRelations = relations(forumPosts, ({ one, many }) => ({
  topic: one(forumTopics, {
    fields: [forumPosts.topicId],
    references: [forumTopics.id],
  }),
  author: one(users, {
    fields: [forumPosts.authorId],
    references: [users.id],
    relationName: "forumPostAuthor",
  }),
  replies: many(postReplies),
}));

export const postRepliesRelations = relations(postReplies, ({ one }) => ({
  post: one(forumPosts, {
    fields: [postReplies.postId],
    references: [forumPosts.id],
  }),
  author: one(users, {
    fields: [postReplies.authorId],
    references: [users.id],
    relationName: "postReplyAuthor",
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.creatorId],
    references: [users.id],
    relationName: "eventCreator",
  }),
  attendees: many(eventAttendees),
}));

export const eventAttendeesRelations = relations(eventAttendees, ({ one }) => ({
  event: one(events, {
    fields: [eventAttendees.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventAttendees.userId],
    references: [users.id],
    relationName: "eventAttendee",
  }),
}));

export const safetyAlertsRelations = relations(safetyAlerts, ({ one }) => ({
  reporter: one(users, {
    fields: [safetyAlerts.reporterId],
    references: [users.id],
    relationName: "safetyAlertReporter",
  }),
}));

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, userId: true, lastActive: true });
export const insertLikeSchema = createInsertSchema(likes).omit({ id: true, likerId: true, createdAt: true });
export const insertMatchSchema = createInsertSchema(matches).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, senderId: true, createdAt: true, isRead: true });
export const insertBlockSchema = createInsertSchema(blocks).omit({ id: true, blockerId: true, createdAt: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, reporterId: true, createdAt: true, status: true });
export const insertCollaborationSchema = createInsertSchema(collaborations).omit({ id: true, requesterId: true, createdAt: true, status: true });
export const insertForumTopicSchema = createInsertSchema(forumTopics).omit({ id: true, createdAt: true });
export const insertForumPostSchema = createInsertSchema(forumPosts).omit({ id: true, createdAt: true, updatedAt: true, likesCount: true });
export const insertPostReplySchema = createInsertSchema(postReplies).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertEventAttendeeSchema = createInsertSchema(eventAttendees).omit({ id: true, createdAt: true });
export const insertSafetyAlertSchema = createInsertSchema(safetyAlerts).omit({ id: true, createdAt: true, isVerified: true, isResolved: true });

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
export type ForumTopic = typeof forumTopics.$inferSelect;
export type InsertForumTopic = z.infer<typeof insertForumTopicSchema>;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type PostReply = typeof postReplies.$inferSelect;
export type InsertPostReply = z.infer<typeof insertPostReplySchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventAttendee = typeof eventAttendees.$inferSelect;
export type InsertEventAttendee = z.infer<typeof insertEventAttendeeSchema>;
export type SafetyAlert = typeof safetyAlerts.$inferSelect;
export type InsertSafetyAlert = z.infer<typeof insertSafetyAlertSchema>;
