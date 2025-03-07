
import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api";
import { logger } from "@/lib/logger";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare } from "lucide-react";
import { CommentsSection } from "@/components/comments-section";
import type { Post } from "@/types/post";

export function PostCard({ post }: { post: Post }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);

  const postImages = useMemo(() => {
    try {
      if (!post.images) return [];
      
      // Handle case where post.images might already be an array
      if (Array.isArray(post.images)) return post.images;
      
      // Handle string JSON parsing
      const parsed = typeof post.images === 'string' 
        ? JSON.parse(post.images) 
        : post.images;
      
      // Ensure parsed result is an array
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      logger.error('PostCard', 'Failed to parse images', { postId: post.id, error });
      return [];
    }
  }, [post.images, post.id]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/posts/${post.id}/like`);
      if (!response.ok) throw new Error('Failed to like post');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Post[]>(["posts"], (oldPosts) =>
        oldPosts?.map(p => p.id === post.id ? {
          ...p,
          hasLiked: data.hasLiked,
          likesCount: data.likesCount
        } : p)
      );
    },
    onError: (error) => {
      logger.error('PostCard', 'Like failed', error);
    },
  });

  const formatDateTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={post.author?.avatar}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/default-avatar.png';
              }}
            />
            <AvatarFallback>
              {post.author?.name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">
              {post.author?.name || 'Unknown User'}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(post.createdAt)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
        
        {postImages.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4 sm:grid-cols-3">
            {postImages.map((image: string, index: number) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={image}
                  alt={`Post ${post.id} image ${index + 1}`}
                  className="rounded-lg object-cover w-full h-full"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/image-error-placeholder.png';
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
          >
            <Heart
              className={`h-5 w-5 ${
                post.hasLiked
                  ? 'fill-red-500 text-red-500'
                  : 'fill-none text-current'
              }`}
            />
            <span className="ml-1">{post.likesCount}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="ml-1">{post.commentsCount}</span>
          </Button>
        </div>

        {showComments && <CommentsSection postId={post.id.toString()} />}
      </CardContent>
    </Card>
  );
}
