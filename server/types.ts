import session from 'express-session';

// Ensure these types are imported or defined
import { User, InsertUser, Post, Comment, Like, Friend } from './types'; 

export interface IStorage {
  sessionStore: session.Store;

  uploadImage(image: string): Promise<string>;

  getUser(id: number): Promise<User | undefined>;

  getUserByUsername(username: string): Promise<User | undefined>;

  getUserByEmail(email: string): Promise<User | undefined>;

  createUser(insertUser: InsertUser): Promise<User>;

  updateUserProfile(userId: number, profileData: Partial<User>): Promise<User>;

  createPost(post: { userId: number; content: string; images?: string[] }): Promise<Post>;

  getPosts(): Promise<Post[]>;

  getPostsByUser(userId: number): Promise<Post[]>;

  createComment(userId: number, postId: number, content: string): Promise<Comment>;

  getCommentsByPost(postId: number): Promise<Comment[]>;

  likePost(postId: number, userId: number): Promise<Like>;

  unlikePost(postId: number, userId: number): Promise<void>;

  createFriend(userId: number, friendId: number, status: string): Promise<Friend>;

  getFriend(userId: number, friendId: number): Promise<Friend | undefined>;

  updateFriend(id: number, status: string): Promise<void>;
}