              import type { Express, Request, Response, NextFunction } from "express";
              import { createServer, type Server } from "http";
              import express from "express";
              import { setupAuth } from "./auth";
              import { storage } from "./storage";
              import { db } from "./db";
              import { posts, comments, users, friends } from "../shared/schema";
              import { eq, and, count, sql, ne, like, or } from "drizzle-orm";

              export async function registerRoutes(app: Express): Promise<Server> {
                setupAuth(app);
                const router = express.Router();

                // Middleware
                router.use((req: Request, res: Response, next: NextFunction) => {
                  res.set("Cache-Control", "no-store, max-age=0");
                  next();
                });

                // Posts Endpoints
                router.get("/posts", async (req: Request, res: Response) => {
                  try {
                    const posts = await storage.getPosts();

                    if (posts?.length > 0) {
                      const userIds = [...new Set(posts.map(post => post.userId))];
                      const users = await Promise.all(userIds.map(id => storage.getUser(id)));
                      const usersMap = Object.fromEntries(users.filter(Boolean).map(u => [u.id, u]));

                      const postsWithAuthors = posts.map(post => ({
                        ...post,
                        author: usersMap[post.userId] ? {
                          id: usersMap[post.userId].id,
                          name: usersMap[post.userId].name || usersMap[post.userId].email?.split('@')[0] || 'User',
                          avatar: usersMap[post.userId].avatar || '/default-avatar.png'
                        } : null
                      }));

                      return res.json(postsWithAuthors);
                    }
                    res.json(posts || []);
                  } catch (error) {
                    console.error("Failed to fetch posts:", error);
                    res.status(500).json({ error: "Failed to fetch posts" });
                  }
                });

                router.post("/posts", async (req: Request, res: Response) => {
                  if (!req.isAuthenticated()) return res.sendStatus(401);
                  if (!req.body.content?.trim() && !req.body.images?.length) {
                    return res.status(400).json({ error: "Post must have content or images" });
                  }

                  try {
                    const processedImages = req.body.images?.length
                      ? await Promise.all(req.body.images.map((img: string) => storage.uploadImage(img)))
                      : [];

                    const post = await storage.createPost({
                      userId: req.user.id,
                      content: req.body.content?.trim() || "",
                      images: processedImages.length ? processedImages : null,
                    });

                    res.status(201).json(post);
                  } catch (error) {
                    console.error("Error creating post:", error);
                    res.status(500).json({ error: "Failed to create post" });
                  }
                });

                router.post("/posts/:postId/like", async (req: Request, res: Response) => {
                  if (!req.isAuthenticated()) return res.sendStatus(401);

                  try {
                    const postId = Number(req.params.postId);
                    const userId = req.user.id;
                    const result = await storage.toggleLike(userId, postId);
                    res.json(result);
                  } catch (error) {
                    console.error("Error toggling like:", error);
                    res.status(500).json({ error: "Failed to toggle like" });
                  }
                });

                router.delete("/posts/:postId", async (req: Request, res: Response) => {
                  if (!req.isAuthenticated()) return res.sendStatus(401);

                  try {
                    const postId = Number(req.params.postId);
                    const post = await db.query.posts.findFirst({
                      where: eq(posts.id, postId)
                    });

                    if (!post) return res.status(404).json({ error: "Post not found" });
                    if (post.userId !== req.user.id) return res.status(403).json({ error: "Not authorized" });

                    await db.delete(posts).where(eq(posts.id, postId));
                    res.json({ success: true });
                  } catch (error) {
                    console.error("Error deleting post:", error);
                    res.status(500).json({ error: "Failed to delete post" });
                  }
                });

                // Comments Endpoints
                router.post("/posts/:postId/comments", async (req: Request, res: Response) => {
                  if (!req.isAuthenticated()) return res.sendStatus(401);
                  if (!req.body.content?.trim()) return res.status(400).json({ error: "Comment content required" });

                  try {
                    const postId = Number(req.params.postId);
                    const result = await db.transaction(async (tx) => {
                      const [comment] = await tx.insert(comments).values({
                        userId: req.user.id,
                        postId,
                        content: req.body.content.trim()
                      }).returning();

                      const [updatedPost] = await tx.update(posts)
                        .set({ commentsCount: sql`${posts.commentsCount} + 1` })
                        .where(eq(posts.id, postId))
                        .returning();

                      return { comment, commentsCount: updatedPost.commentsCount };
                    });

                    res.status(201).json(result);
                  } catch (error) {
                    console.error("Error creating comment:", error);
                    res.status(500).json({ error: "Failed to create comment" });
                  }
                });

                router.get("/posts/:postId/comments", async (req: Request, res: Response) => {
                  try {
                    const postId = Number(req.params.postId);
                    const commentsList = await db.query.comments.findMany({
                      where: eq(comments.postId, postId),
                      orderBy: (comments, { desc }) => [desc(comments.createdAt)]
                    });

                    if (commentsList?.length > 0) {
                      const userIds = [...new Set(commentsList.map(c => c.userId))];
                      const users = await Promise.all(userIds.map(id => storage.getUser(id)));
                      const usersMap = Object.fromEntries(users.filter(Boolean).map(u => [u.id, u]));

                      const enhancedComments = commentsList.map(comment => ({
                        ...comment,
                        author: usersMap[comment.userId] ? {
                          id: usersMap[comment.userId].id,
                          name: usersMap[comment.userId].name || usersMap[comment.userId].email?.split('@')[0] || 'User',
                          avatar: usersMap[comment.userId].avatar || '/default-avatar.png'
                        } : null
                      }));

                      return res.json(enhancedComments);
                    }
                    res.json(commentsList || []);
                  } catch (error) {
                    console.error("Failed to fetch comments:", error);
                    res.status(500).json({ error: "Failed to fetch comments" });
                  }
                });

                router.get("/posts/:postId/comments/count", async (req: Request, res: Response) => {
                  try {
                    const postId = Number(req.params.postId);
                    const [result] = await db.select({ count: count() })
                      .from(comments)
                      .where(eq(comments.postId, postId));
                    res.json({ count: result?.count || 0 });
                  } catch (error) {
                    console.error("Failed to fetch comment count:", error);
                    res.status(500).json({ error: "Failed to fetch comment count" });
                  }
                });

                // User Endpoints
                router.get("/user", (req: Request, res: Response) => {
                  if (!req.isAuthenticated()) return res.sendStatus(401);
                  res.json(req.user);
                });

                router.post("/complete-profile", async (req: Request, res: Response, next: NextFunction) => {
                  if (!req.isAuthenticated()) return res.sendStatus(401);

                  try {
                    const profileData = req.body;
                    
                    // Handle image upload separately
                    if (profileData.avatar?.startsWith('data:image')) {
                      try {
                        profileData.avatar = await storage.uploadImage(profileData.avatar);
                      } catch (error) {
                        console.error("Image upload error:", error);
                        profileData.avatar = null; // Set to null if upload fails
                      }
                    }

                    // Update user profile with sanitized data
                    const updatedUser = await storage.updateUserProfile(req.user.id, profileData);

                    // Update session with new user data
                    req.login(updatedUser, (err) => {
                      if (err) return next(err);
                      res.json(updatedUser);
                    });
                  } catch (error) {
                    console.error("Profile completion error:", error);
                    res.status(500).json({ 
                      error: "Failed to complete profile", 
                      message: error.message 
                    });
                  }
                });

                // Friends Endpoints
router.get("/users/suggestions", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
        const currentUser = req.user as any; // Ensure proper typing
        const domain = currentUser.email.split('@')[1];

        const suggestedUsers = await db.query.users.findMany({
            where: and(
                like(users.email, `%@${domain}%`), // Ensure proper wildcard placement
                ne(users.id, currentUser.id)
            )
        });

        // Fetch friendships after getting suggested users
        const friendships = await db.select()
            .from(friends)
            .where(or(
                eq(friends.userId, currentUser.id),
                eq(friends.friendId, currentUser.id)
            ));

        // Enhance suggested users with friendship status
        const enhanced = suggestedUsers.map(user => {
            const friendship = friendships.find(f =>
                [f.userId, f.friendId].includes(user.id)
            );
            return {
                ...user,
                friendshipStatus: friendship?.status || null,
                isRequester: friendship?.userId === currentUser.id
            };
        });

        res.json(enhanced);
    } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        res.status(500).json({ error: "Failed to fetch suggestions" });
    }
});


                router.post("/friends/request", async (req: Request, res: Response) => {
                  if (!req.isAuthenticated()) return res.sendStatus(401);
                  const friendId = Number(req.body.friendId);
                  if (!friendId) return res.status(400).json({ error: "Invalid friend ID" });

                  try {
                    const existing = await db.query.friends.findFirst({
                      where: or(
                        and(eq(friends.userId, req.user.id), eq(friends.friendId, friendId)),
                        and(eq(friends.userId, friendId), eq(friends.friendId, req.user.id))
                      )
                    });

                    if (existing) return res.status(409).json({ 
                      error: "Existing relationship", 
                      status: existing.status 
                    });

                    const [friendship] = await db.insert(friends)
                      .values({ 
                        userId: req.user.id, 
                        friendId, 
                        status: "pending" 
                      })
                      .returning();

                    res.status(201).json(friendship);
                  } catch (error) {
                    console.error("Failed to send request:", error);
                    res.status(500).json({ error: "Failed to send request" });
                  }
                });

                router.patch("/friends/:id", async (req: Request, res: Response) => {
                  if (!req.isAuthenticated()) return res.sendStatus(401);
                  const friendshipId = Number(req.params.id);
                  const { status } = req.body;

                  if (!["accepted", "rejected"].includes(status)) {
                    return res.status(400).json({ error: "Invalid status" });
                  }

                  try {
                    const friendship = await db.query.friends.findFirst({
                      where: and(
                        eq(friends.id, friendshipId),
                        eq(friends.friendId, req.user.id),
                        eq(friends.status, "pending")
                      )
                    });

                    if (!friendship) return res.status(404).json({ error: "Request not found" });

                    const [updated] = await db.update(friends)
                      .set({ status })
                      .where(eq(friends.id, friendshipId))
                      .returning();

                    res.json(updated);
                  } catch (error) {
                    console.error("Failed to update request:", error);
                    res.status(500).json({ error: "Failed to update request" });
                  }
                });

                router.get("/friends", async (req: Request, res: Response) => {
                  if (!req.isAuthenticated()) return res.sendStatus(401);

                  try {
                    const friendships = await db.select()
                      .from(friends)
                      .where(or(
                        eq(friends.userId, req.user.id),
                        eq(friends.friendId, req.user.id)
                      ));

                    const enhanced = await Promise.all(friendships.map(async f => {
                      const friendId = f.userId === req.user.id ? f.friendId : f.userId;
                      const friend = await storage.getUser(friendId);
                      return {
                        ...f,
                        friend: friend ? {
                          id: friend.id,
                          name: friend.name || friend.email.split('@')[0],
                          avatar: friend.avatar
                        } : null
                      };
                    }));

                    res.json(enhanced);
                  } catch (error) {
                    console.error("Failed to fetch friends:", error);
                    res.status(500).json({ error: "Failed to fetch friends" });
                  }
                });

                // Error Handling
                router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
                  console.error("API Error:", err);
                  res.status(500).json({ 
                    error: process.env.NODE_ENV === "production" ? "Server error" : err.message 
                  });
                });

                router.all("*", (req: Request, res: Response) => {
                  res.status(404).json({ message: "Endpoint not found" });
                });

                // Database Timeout Middleware
                app.use((req: Request, res: Response, next: NextFunction) => {
                  const timeout = setTimeout(() => {
                    if (!res.headersSent) {
                      res.status(504).json({ error: "Request timeout" });
                    }
                  }, 10000);

                  res.on("finish", () => clearTimeout(timeout));
                  next();
                });

                app.use("/api", router);
                return createServer(app);
              }