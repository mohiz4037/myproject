
export interface Post {
  id: number | string;
  content: string;
  createdAt: string | Date;
  hasLiked?: boolean;
  likesCount: number;
  commentsCount: number;
  images?: string;
  author?: {
    id?: string | number;
    name?: string;
    avatar?: string;
  };
}
