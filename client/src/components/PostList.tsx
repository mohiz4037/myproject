
import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface Author {
  id: number;
  name: string;
  avatar: string;
}

interface Post {
  id: number;
  content: string;
  userId: number;
  author?: Author;
  createdAt: number;
  likesCount: number;
  commentsCount: number;
  images?: string[];
}

export function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/posts');
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error('Server returned invalid data format');
        }
        
        setPosts(data);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        toast({
          title: "Error",
          description: "Failed to load posts. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [toast]);

  if (loading) {
    return <div className="flex justify-center p-8">Loading posts...</div>;
  }

  if (error) {
    return (
      <Card className="my-4">
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Failed to load posts: {error}
          </div>
          <button 
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="my-4">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No posts available. Be the first to create a post!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id} className="overflow-hidden">
          <CardHeader className="p-4 pb-0">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage 
                  src={post.author?.avatar || '/default-avatar.png'} 
                  alt={post.author?.name || 'User'} 
                />
                <AvatarFallback>
                  {post.author?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{post.author?.name || 'Unknown User'}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(post.createdAt * 1000).toLocaleString()}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <p className="whitespace-pre-wrap mb-2">{post.content}</p>
            {post.images && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Array.isArray(post.images) ? (
                  post.images.map((img, i) => (
                    <img 
                      key={i}
                      src={img} 
                      alt={`Post attachment ${i+1}`}
                      className="rounded-md w-full h-auto"
                    />
                  ))
                ) : (
                  <img 
                    src={post.images} 
                    alt="Post attachment"
                    className="rounded-md w-full h-auto"
                  />
                )}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Badge variant="secondary">❤️ {post.likesCount || 0}</Badge>
              <Badge variant="secondary">💬 {post.commentsCount || 0}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
