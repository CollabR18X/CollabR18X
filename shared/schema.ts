import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id), 
  bio: text("bio"),
  niche: text("niche"), // e.g., Tech, Beauty, Gaming
  portfolioUrl: text("portfolio_url"),
  location: text("location"),
  socialLinks: jsonb("social_links").$type<{ instagram?: string; twitter?: string; youtube?: string; tiktok?: string }>(),
  ageVerified: boolean("age_verified").notNull().default(false),
  socialsVerified: boolean("socials_verified").notNull().default(false),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
});

export const collaborations = pgTable("collaborations", {
  id: serial("id").primaryKey(),
  requesterId: text("requester_id").notNull().references(() => users.id),
  receiverId: text("receiver_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
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
  sentCollaborations: many(collaborations, { relationName: "requester" }),
  receivedCollaborations: many(collaborations, { relationName: "receiver" }),
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

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, userId: true });
export const insertCollaborationSchema = createInsertSchema(collaborations).omit({ id: true, requesterId: true, createdAt: true, status: true });

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Collaboration = typeof collaborations.$inferSelect;
export type InsertCollaboration = z.infer<typeof insertCollaborationSchema>;
