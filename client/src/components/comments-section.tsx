
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logger } from "@/lib/logger";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
};

export function CommentsSection({ postId }: { postId: string }) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/posts/${postId}/comments`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/posts/${postId}/comments`, {
        content,
      });
      if (!response.ok) throw new Error("Failed to add comment");
      return response.json();
    },
    onSuccess: (newComment) => {
      queryClient.setQueryData(["comments", postId], (oldComments: Comment[] = []) => [
        ...oldComments,
        newComment,
      ]);
      
      // Update post comment count
      queryClient.setQueryData<Post[]>(["posts"], (oldPosts = []) =>
        oldPosts.map((post) =>
          post.id.toString() === postId
            ? { ...post, commentsCount: (post.commentsCount || 0) + 1 }
            : post
        )
      );
      
      setNewComment("");
    },
    onError: (error) => {
      logger.error("CommentsSection", "Add comment failed", error);
    },
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      commentMutation.mutate(newComment);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="mt-4 pt-4 border-t">
      <h3 className="font-medium mb-2">Comments</h3>
      
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet</p>
      ) : (
        <div className="space-y-4 mb-4">
          {comments.map((comment: Comment) => (
            <div key={comment.id} className="flex gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.author?.avatar} />
                <AvatarFallback>
                  {comment.author?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {comment.author?.name || "Unknown User"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {user && (
        <form onSubmit={handleAddComment} className="flex gap-2">
          <Input
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || commentMutation.isPending}
          >
            Post
          </Button>
        </form>
      )}
    </div>
  );
}
