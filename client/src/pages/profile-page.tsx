import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Post, Friendship } from "@shared/schema"; // Added Friendship type
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams, Link } from "wouter";
import { Loader2, UserPlus, UserCheck, Mail, UserCircle, Pencil } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const userId = parseInt(id);

  // Improved query structure with proper typing and error handling
  const { data: profileUser, isLoading: loadingUser, error: userError } = useQuery<User>({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    }
  });

  const { data: posts, isLoading: loadingPosts, error: postsError } = useQuery<Post[]>({
    queryKey: ["user-posts", userId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${userId}/posts`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    }
  });

  const { data: friends, isLoading: loadingFriends, error: friendsError } = useQuery<Friendship[]>({
    queryKey: ["friends", userId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${userId}/friends`);
      if (!res.ok) throw new Error("Failed to fetch friends");
      return res.json();
    }
  });

  // Unified mutation handling
  const handleMutationError = (error: unknown) => {
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "An error occurred",
      variant: "destructive",
    });
  };

  const addFriendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/friends/${userId}`);
      if (!res.ok) throw new Error("Failed to send friend request");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends", userId] });
      toast({ title: "Friend request sent" });
    },
    onError: handleMutationError
  });

  const acceptFriendMutation = useMutation({
    mutationFn: async (friendshipId: number) => {
      const res = await apiRequest("PATCH", `/api/friends/${friendshipId}`, {
        status: "accepted"
      });
      if (!res.ok) throw new Error("Failed to accept friend request");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends", userId] });
      toast({ title: "Friend request accepted" });
    },
    onError: handleMutationError
  });

  // Loading and error states
  if (loadingUser || loadingPosts || loadingFriends) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userError || !profileUser) {
    return <div className="text-center p-8">User not found</div>;
  }

  // Friendship status calculation
  const friendships = friends || [];
  const isFriend = friendships.some(f => 
    f.status === "accepted" && 
    ((f.userId === currentUser?.id && f.friendId === userId) ||
     (f.friendId === currentUser?.id && f.userId === userId))
  );

  const pendingFriendship = friendships.find(f => 
    f.status === "pending" && 
    (f.userId === currentUser?.id || f.friendId === currentUser?.id)
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl mx-auto py-8">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
              <Avatar className="h-32 w-32">
                <AvatarImage
                  src={profileUser.avatar}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-avatar.png';
                  }}
                />
                <AvatarFallback>
                  {profileUser.name?.[0] || <UserCircle className="h-16 w-16" />}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold">{profileUser.name}</h1>
                <p className="text-muted-foreground">@{profileUser.username}</p>
                <div className="flex items-center justify-center gap-2 mt-2 md:justify-start">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{profileUser.email}</span>
                </div>
                {profileUser.bio && (
                  <p className="mt-4 text-sm text-muted-foreground">{profileUser.bio}</p>
                )}
                {/* Add Edit Profile button if the profile belongs to the current user */}
                {currentUser && currentUser.id === profileUser.id && (
                  <div className="mt-4">
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/complete-profile">
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              {currentUser?.id !== userId && (
                <div className="flex gap-2">
                  {!isFriend && !pendingFriendship && (
                    <Button
                      onClick={() => addFriendMutation.mutate()}
                      disabled={addFriendMutation.isPending}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {addFriendMutation.isPending ? "Sending..." : "Add Friend"}
                    </Button>
                  )}
                  {pendingFriendship?.friendId === currentUser?.id && (
                    <Button
                      onClick={() => acceptFriendMutation.mutate(pendingFriendship.id)}
                      disabled={acceptFriendMutation.isPending}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      {acceptFriendMutation.isPending ? "Accepting..." : "Accept Request"}
                    </Button>
                  )}
                  {(isFriend || pendingFriendship?.userId === currentUser?.id) && (
                    <Button variant="secondary" disabled>
                      <UserCheck className="h-4 w-4 mr-2" />
                      {isFriend ? "Friends" : "Request Sent"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="posts" className="mt-8">
          <TabsList className="w-full">
            <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
            <TabsTrigger value="friends" className="flex-1">Friends</TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="mt-4 space-y-4">
            {postsError && <div className="text-center p-4">Error loading posts</div>}
            {posts?.map((post) => {
              const images = post.images ? JSON.parse(post.images) : [];
              return (
                <Card key={post.id}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar>
                      <AvatarImage src={profileUser.avatar} />
                      <AvatarFallback>{profileUser.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{profileUser.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">{post.content}</p>
                    {images.map((img: string, index: number) => (
                      <img
                        key={index}
                        src={img}
                        alt=""
                        className="rounded-lg max-h-96 w-full object-cover mb-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {friendsError && <div className="text-center p-4">Error loading friends</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friendships
                    .filter(f => f.status === "accepted")
                    .map((friendship) => {
                      const friendId = friendship.userId === userId ? friendship.friendId : friendship.userId;
                      return (
                        <div
                          key={friendship.id}
                          className="flex items-center gap-4 p-4 rounded-lg border"
                        >
                          <Avatar>
                            <AvatarImage src={`/api/users/${friendId}/avatar`} />
                            <AvatarFallback>
                              <UserCircle className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{friendId === userId ? "You" : "Friend Name"}</p>
                            <Button 
                              variant="link" 
                              className="p-0 h-auto"
                              onClick={() => window.location.href = `/profile/${friendId}`}
                            >
                              View Profile
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}