import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  birthdate: text("birthdate"),
  department: text("department"),
  gender: text("gender"),
  maritalStatus: text("marital_status"),
  bio: text("bio"),
  avatar: text("avatar"),
  profileCompleted: integer("profile_completed").default(0),
});

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  images: text("images"),
  likesCount: integer("likes_count").default(0), // Existing likes count
  commentsCount: integer("comments_count").default(0), // Add comments count
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const likes = sqliteTable("likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => posts.id),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => posts.id),
  content: text("content").notNull(),
  // Remove timestamp mode and use raw integer
  createdAt: integer("created_at").notNull().default(sql`(strftime('%s', 'now'))`),
});

export const friends = sqliteTable("friends", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  friendId: integer("friend_id").notNull().references(() => users.id),
  status: text("status").notNull(),
});

export const loginSchema = z.object({
  email: z.string().email().refine((email) => email.endsWith(".edu.pk"), {
    message: "Only .edu.pk email addresses are allowed",
  }),
  password: z.string().min(8),
});

export const profileCompletionSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  birthdate: z.string().refine(val => new Date(val) < new Date(), {
    message: "Birthdate must be in the past",
  }),
  department: z.string().min(2, "Department is required"),
  gender: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Please select a gender" }),
  }),
  maritalStatus: z.enum(["single", "married"], {
    errorMap: () => ({ message: "Please select a marital status" }),
  }),
  avatar: z.string().optional(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    email: true,
    password: true,
    name: true,
  })
  .extend({
    email: z.string().email().refine((email) => email.endsWith(".edu.pk"), {
      message: "Only .edu.pk email addresses are allowed",
    }),
    password: z.string().min(8),
  });

export const insertPostSchema = createInsertSchema(posts)
  .pick({
    content: true,
  })
  .extend({
    images: z.array(z.string()).optional(),
  });

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
});

export type comments = {
  id: number;
  userId: number;
  postId: number;
  content: string;
  createdAt: number; // Unix timestamp in seconds
  author?: {  // Optional nested author info
    id: number;
    name: string;
    avatar: string;
  };
};

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
  sentFriendRequests: many(friends, { relationName: "userFriends" }),
  receivedFriendRequests: many(friends, { relationName: "friendUser" }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.userId], references: [users.id] }),
  comments: many(comments),
  likes: many(likes),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  author: one(users, { fields: [comments.userId], references: [users.id] }),
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, { fields: [likes.userId], references: [users.id] }),
  post: one(posts, { fields: [likes.postId], references: [posts.id] }),
}));

export const friendsRelations = relations(friends, ({ one }) => ({
  user: one(users, { fields: [friends.userId], references: [users.id], relationName: "userFriends" }),
  friend: one(users, { fields: [friends.friendId], references: [users.id], relationName: "friendUser" }),
}));

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Like = typeof likes.$inferSelect;
export type Friend = typeof friends.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type ProfileCompletionData = z.infer<typeof profileCompletionSchema>;