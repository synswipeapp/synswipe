import { relations } from "drizzle-orm";
import { users, avatars, ratings, socialLinks, reviews, notifications, localUsers, subscriptions } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  avatars: many(avatars),
  socialLinks: many(socialLinks),
}));

export const avatarsRelations = relations(avatars, ({ one, many }) => ({
  creator: one(users, { fields: [avatars.creatorId], references: [users.id] }),
  ratings: many(ratings),
  reviews: many(reviews),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  avatar: one(avatars, { fields: [ratings.avatarId], references: [avatars.id] }),
}));

export const socialLinksRelations = relations(socialLinks, ({ one }) => ({
  user: one(users, { fields: [socialLinks.userId], references: [users.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  avatar: one(avatars, { fields: [reviews.avatarId], references: [avatars.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const localUsersRelations = relations(localUsers, ({ many }) => ({
  avatars: many(avatars),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}));
