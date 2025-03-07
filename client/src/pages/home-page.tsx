import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Comment } from "@shared/schema";
import { Navbar } from "@/components/navbar";
import { Loader2, Heart, MessageSquare } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ImageUpload } from "@/components/ui/image-upload";
import { logger } from "@/lib/logger";
import { PostCard } from "@/components/post-card";
import { CreatePost } from "@/components/create-post";
import FriendSuggestions from "@/components/friend-suggestions";
import type { Post } from "@/types/post";


function CommentsSection({ postId }: { postId: string }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [showAll, setShowAll] = useState(false);

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: ['posts', postId, 'comments'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/posts/${postId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', `/api/posts/${postId}/comments`, { content });
      if (!response.ok) throw new Error('Failed to post comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['posts', postId, 'comments']);
      queryClient.invalidateQueries(['posts']);
      setComment('');
    },
    onError: (error) => {
      logger.error('CommentsSection', 'Comment failed', error);
    },
  });

  const displayedComments = showAll ? comments || [] : comments?.slice(0, 2) || [];

  return (
    <div className="mt-4 space-y-4">
      <div className="flex gap-4">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.avatar} />
          <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-2 border rounded-md resize-none focus:ring-2 focus:ring-primary"
            rows={2}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => commentMutation.mutate(comment)}
              disabled={!comment.trim() || commentMutation.isPending}
            >
              {commentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Post Comment
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
      ) : (
        <>
          {displayedComments.map((comment) => (
            <div key={comment.id} className="flex gap-3 items-start">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{comment.author?.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{comment.author?.name || 'User'}</p>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))}

          {(comments?.length || 0) > 2 && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-muted-foreground"
            >
              {showAll ? 'Show fewer comments' : `Show all ${comments?.length} comments`}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function HomePage() {
  const { user } = useAuth();

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['/api/posts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/posts');
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-4 text-destructive">
          Failed to load posts: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-2xl mx-auto py-8 px-4">
        <CreatePost user={user} />

        <section className="mt-8 space-y-6">
          {posts?.map((post: Post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">People You May Know</h2>
          <FriendSuggestions />
        </section>
      </main>
    </div>
  );
}


export default HomePage;