
import session from 'express-session';
import { users, posts, comments, likes, friends } from '../shared/schema';

export interface IStorage {
  sessionStore: session.Store;

  uploadImage(image: string): Promise<string>;

  getUser(id: number): Promise<users | undefined>;

  getUserByUsername(username: string): Promise<users | undefined>;

  getUserByEmail(email: string): Promise<users | undefined>;

  createUser(insertUser: any): Promise<users>;

  updateUserProfile(userId: number, profileData: Partial<users>): Promise<users>;

  createPost(post: { userId: number; content: string; images?: string[] }): Promise<posts>;

  getPosts(): Promise<(posts & { author: any })[]>;

  getPostsByUser(userId: number): Promise<(posts & { author: any })[]>;

  createComment(userId: number, postId: number, content: string): Promise<comments>;

  getCommentsByPost(postId: number): Promise<(comments & { author: any })[]>;

  likePost(postId: number, userId: number): Promise<likes>;

  unlikePost(postId: number, userId: number): Promise<void>;

  createFriend(userId: number, friendId: number, status: string): Promise<friends>;

  getFriend(userId: number, friendId: number): Promise<friends | undefined>;

  updateFriend(id: number, status: string): Promise<void>;
}
