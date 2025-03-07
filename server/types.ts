
import type { User } from "@shared/schema";
import type { Store } from "express-session";

export interface IStorage {
  sessionStore: Store;
  
  // Image handling
  uploadImage(image: string): Promise<string>;
  
  // User operations
  getUser(id: number): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id">): Promise<User>;
  updateUserProfile(userId: number, profileData: Partial<User>): Promise<User>;
  
  // Post operations
  createPost(data: { userId: number; content: string; images?: string[] }): Promise<any>;
  getPosts(): Promise<any[]>;
  getPostsByUser(userId: number): Promise<any[]>;
  
  // Comment operations
  createComment(userId: number, postId: number, content: string): Promise<any>;
  getCommentsByPost(postId: number): Promise<any[]>;
  
  // Like operations
  likePost(postId: number, userId: number): Promise<any>;
  unlikePost(postId: number, userId: number): Promise<void>;
  toggleLike(userId: number, postId: number): Promise<{ likesCount: number; hasLiked: boolean }>;
  getLikesByPost(postId: number, userId?: number): Promise<{ count: number; hasLiked: boolean }>;
  
  // Friend operations
  createFriend(userId: number, friendId: number, status: string): Promise<any>;
  getFriend(userId: number, friendId: number): Promise<any>;
  updateFriend(id: number, status: string): Promise<void>;
  addFriend(userId: number, friendId: number): Promise<any>;
  getFriends(userId: number): Promise<any[]>;
  getPendingFriendRequests(userId: number): Promise<any[]>;
  getFriendship(userId: number, friendId: number): Promise<any>;
  updateFriendStatus(id: number, status: 'accepted' | 'rejected'): Promise<void>;
}

// Profile data interface
export interface ProfileData {
  name?: string;
  username?: string;
  avatar?: string | null;
  birthdate?: string | null;
  department?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  profileCompleted?: number;
}
