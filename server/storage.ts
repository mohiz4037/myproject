import { IStorage } from "./types";
import { db } from "./db";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { users, posts, InsertUser, comments, likes, friends } from "@shared/schema";
import session from "express-session";
import SQLiteStore from 'connect-sqlite3';
import Database from "better-sqlite3";
import { logger } from "./logger";

const SQLiteStoreFactory = SQLiteStore(session);
const sessionDb = new Database("sessions.db"); // Updated path

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new SQLiteStoreFactory({
      client: sessionDb,
      table: "sessions",
      concurrentDB: true,
      expired: {
        clear: true,
        intervalMs: 900_000 // 15 minutes
      }
    });
  }

  // Image Handling
  async uploadImage(image: string): Promise<string> {
    if (!image.startsWith('data:image')) {
      throw new Error('Invalid image format');
    }
    // TODO: Implement actual image upload
    return `https://placeholder.com/${Date.now()}.jpg`;
  }

  // User Operations
  async getUser(id: number): Promise<users | undefined> {
    return db.query.users.findFirst({ where: eq(users.id, id) });
  }

  async getUserByUsername(username: string): Promise<users | undefined> {
    return db.query.users.findFirst({ where: eq(users.username, username) });
  }

  async getUserByEmail(email: string): Promise<users | undefined> {
    return db.query.users.findFirst({ where: eq(users.email, email) });
  }

  async createUser(insertUser: InsertUser): Promise<users> {
    const [user] = await db.insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserProfile(userId: number, profileData: Partial<users>): Promise<users> {
    const [updatedUser] = await db.update(users)
      .set({ 
        ...profileData,
        profileCompleted: 1 // Use integer 1 instead of boolean
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Post Operations with Author Join
  async createPost({ userId, content, images }: { 
    userId: number; 
    content: string; 
    images?: string[] 
  }): Promise<posts> {
    const [post] = await db.insert(posts)
      .values({
        userId,
        content,
        images: images ? JSON.stringify(images) : null
      })
      .returning();
    return post;
  }

  async getPosts(): Promise<(posts & { author: users })[]> {
    try {
      const result = await db.query.posts.findMany({
        orderBy: desc(posts.createdAt),
        with: {
          author: true,
        },
      });

      // Ensure we're returning an array even if there are no posts
      return result || [];
    } catch (error) {
      console.error("Error getting posts:", error);
      // Throwing the error so it can be handled by the route handler
      throw new Error(`Failed to fetch posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPostsByUser(userId: number): Promise<(posts & { author: users })[]> {
    return db.query.posts.findMany({
      where: eq(posts.userId, userId),
      with: { author: true },
      orderBy: desc(posts.createdAt)
    });
  }

  // Comment Operations with Transactions
  async createComment(userId: number, postId: number, content: string): Promise<comments> {
    return db.transaction(async (tx) => {
      const [comment] = await tx.insert(comments)
        .values({
          userId,
          postId,
          content,
          createdAt: sql`CURRENT_TIMESTAMP`
        })
        .returning();

      await tx.update(posts)
        .set({ commentsCount: sql`${posts.commentsCount} + 1` })
        .where(eq(posts.id, postId));

      return comment;
    });
  }

  async getCommentsByPost(postId: number): Promise<(comments & { author: users })[]> {
    return db.query.comments.findMany({
      where: eq(comments.postId, postId),
      with: { author: true },
      orderBy: desc(comments.createdAt)
    });
  }

  // Like Operations with Type Safety
  async toggleLike(userId: number, postId: number): Promise<{ likesCount: number; hasLiked: boolean }> {
    return db.transaction(async (tx) => {
      const existing = await tx.query.likes.findFirst({
        where: and(eq(likes.userId, userId), eq(likes.postId, postId))
      });

      if (existing) {
        await tx.delete(likes)
          .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
      } else {
        await tx.insert(likes)
          .values({ userId, postId });
      }

      const [{ count }] = await tx.select({ count: sql<number>`count(*)` })
        .from(likes)
        .where(eq(likes.postId, postId));

      return {
        likesCount: Number(count),
        hasLiked: !existing
      };
    });
  }

  async getLikesByPost(postId: number, userId?: number): Promise<{ count: number; hasLiked: boolean }> {
    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(likes)
      .where(eq(likes.postId, postId));

    let hasLiked = false;
    if (userId) {
      const existing = await db.query.likes.findFirst({
        where: and(eq(likes.userId, userId), eq(likes.postId, postId))
      });
      hasLiked = !!existing;
    }

    return { 
      count: Number(count),
      hasLiked 
    };
  }

  // Friend Operations with Type Safety
  async addFriend(userId: number, friendId: number): Promise<friends> {
    const [friendship] = await db.insert(friends)
      .values({ 
        userId, 
        friendId, 
        status: "pending" as const 
      })
      .returning();
    return friendship;
  }

  async getFriends(userId: number): Promise<(friends & { friend: users })[]> {
    return db.query.friends.findMany({
      where: and(
        or(eq(friends.userId, userId), eq(friends.friendId, userId)),
        eq(friends.status, "accepted")
      ),
      with: { friend: true }
    });
  }

  async getPendingFriendRequests(userId: number): Promise<(friends & { user: users })[]> {
    return db.query.friends.findMany({
      where: and(
        eq(friends.friendId, userId),
        eq(friends.status, "pending")
      ),
      with: { user: true }
    });
  }

  async getFriendship(userId: number, friendId: number): Promise<friends | undefined> {
    return db.query.friends.findFirst({
      where: or(
        and(eq(friends.userId, userId), eq(friends.friendId, friendId)),
        and(eq(friends.userId, friendId), eq(friends.friendId, userId))
      )
    });
  }

  async updateFriendStatus(id: number, status: 'accepted' | 'rejected'): Promise<void> {
    await db.update(friends)
      .set({ status })
      .where(eq(friends.id, id));
  }

  // IStorage interface implementation compatibility
  async likePost(postId: number, userId: number) {
    const result = await this.toggleLike(userId, postId);
    if (result.hasLiked) {
      return { postId, userId, id: Date.now() }; // Simplified return
    }
    throw new Error("Failed to like post");
  }

  async unlikePost(postId: number, userId: number): Promise<void> {
    await this.toggleLike(userId, postId);
  }

  async createFriend(userId: number, friendId: number, status: string): Promise<friends> {
    const [friendship] = await db.insert(friends)
      .values({ 
        userId, 
        friendId, 
        status: status as any 
      })
      .returning();
    return friendship;
  }

  async getFriend(userId: number, friendId: number): Promise<friends | undefined> {
    return this.getFriendship(userId, friendId);
  }

  async updateFriend(id: number, status: string): Promise<void> {
    await this.updateFriendStatus(id, status as any);
  }
}

export const storage = new DatabaseStorage();