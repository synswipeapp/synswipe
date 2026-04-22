import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  boolean,
  json,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

// ─── Users ───
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }).unique(),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  creatorMode: boolean("creator_mode").default(false),
  bio: varchar("bio", { length: 500 }),
  handle: varchar("handle", { length: 50 }).unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Avatars ───
export const avatars = mysqlTable("avatars", {
  id: serial("id").primaryKey(),
  creatorId: bigint("creator_id", { mode: "number", unsigned: true }).notNull(),
  imageUrl: varchar("image_url", { length: 500 }).notNull(),
  caption: varchar("caption", { length: 500 }),
  tags: json("tags").$type<string[]>(),
  isPublic: boolean("is_public").default(true),
  isPrimary: boolean("is_primary").default(false),
  qualityScore: int("quality_score"),
  avatarStyle: mysqlEnum("avatar_style", ["photorealistic", "animated"]).default("photorealistic").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_avatars_creator").on(table.creatorId, table.isPublic),
  index("idx_avatars_style").on(table.avatarStyle, table.isPublic),
]);

export type Avatar = typeof avatars.$inferSelect;

// ─── Ratings ───
export const ratings = mysqlTable("ratings", {
  id: serial("id").primaryKey(),
  avatarId: bigint("avatar_id", { mode: "number", unsigned: true }).notNull(),
  voterId: bigint("voter_id", { mode: "number", unsigned: true }),
  verdict: mysqlEnum("verdict", ["fire", "ice"]).notNull(),
  ratingValue: int("rating_value"), // 1-10 scale
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_ratings_unique").on(table.avatarId, table.voterId),
  index("idx_ratings_avatar_verdict").on(table.avatarId, table.verdict),
]);

export type Rating = typeof ratings.$inferSelect;

// ─── Social Links ───
export const socialLinks = mysqlTable("social_links", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  platform: varchar("platform", { length: 20 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  label: varchar("label", { length: 100 }),
  sortOrder: int("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_social_links_user").on(table.userId),
]);

export type SocialLink = typeof socialLinks.$inferSelect;

// ─── Reviews ───
export const reviews = mysqlTable("reviews", {
  id: serial("id").primaryKey(),
  avatarId: bigint("avatar_id", { mode: "number", unsigned: true }).notNull(),
  reviewerId: bigint("reviewer_id", { mode: "number", unsigned: true }).notNull(),
  rating: int("rating").notNull(),
  text: varchar("text", { length: 1000 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_reviews_avatar").on(table.avatarId),
]);

export type Review = typeof reviews.$inferSelect;

// ─── Notifications ───
export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("type", ["hot_vote", "review", "milestone", "system"]).notNull(),
  message: varchar("message", { length: 500 }).notNull(),
  read: boolean("read").default(false),
  relatedId: bigint("related_id", { mode: "number", unsigned: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_notifications_user_read").on(table.userId, table.read),
]);

export type Notification = typeof notifications.$inferSelect;

// ─── Local Auth Users ───
export const localUsers = mysqlTable("local_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  bio: varchar("bio", { length: 500 }),
  avatar: text("avatar"),
  creatorMode: boolean("creator_mode").default(false),
  handle: varchar("handle", { length: 50 }).unique(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type LocalUser = typeof localUsers.$inferSelect;

// ─── Subscriptions ───
export const subscriptions = mysqlTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().unique(),
  status: mysqlEnum("status", ["active", "cancelled", "expired"]).default("active").notNull(),
  plan: varchar("plan", { length: 50 }).default("creator_monthly").notNull(),
  price: varchar("price", { length: 20 }).default("6.99").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_subscriptions_user").on(table.userId),
  index("idx_subscriptions_status").on(table.status),
]);

export type Subscription = typeof subscriptions.$inferSelect;

// ─── Password Resets ───
export const passwordResets = mysqlTable("password_resets", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PasswordReset = typeof passwordResets.$inferSelect;

// ─── User Preferences ───
export const userPreferences = mysqlTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().unique(),
  preferredStyle: mysqlEnum("preferred_style", ["photorealistic", "animated", "all"]).default("all").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type UserPreference = typeof userPreferences.$inferSelect;

// ─── Reports ───
export const reports = mysqlTable("reports", {
  id: serial("id").primaryKey(),
  avatarId: bigint("avatar_id", { mode: "number", unsigned: true }).notNull(),
  reporterId: bigint("reporter_id", { mode: "number", unsigned: true }),
  reason: varchar("reason", { length: 255 }).notNull(),
  details: varchar("details", { length: 1000 }),
  status: mysqlEnum("status", ["pending", "reviewed", "resolved", "dismissed"]).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
