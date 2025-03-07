import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCard } from "@/components/ui/user-card";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Users, UserCheck, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

type Friendship = {
  id: number;
  status: "pending" | "accepted" | "rejected";
  isRequester: boolean;
  friend: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    department?: string;
  };
};

type UserSuggestion = {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  department?: string;
  friendshipStatus?: Friendship["status"];
  friendshipId?: number;
  isRequester?: boolean;
};

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "requests" | "sent" | "suggestions">("all");

  const { data: friendships, isLoading } = useQuery<Friendship[]>({
    queryKey: ["friends"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/friends");
      if (!res.ok) throw new Error("Failed to fetch friends");
      return res.json();
    }
  });

  const { data: userSuggestions, isLoading: suggestionsLoading } = useQuery<UserSuggestion[]>({
    queryKey: ["userSuggestions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users/suggestions");
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      return res.json();
    }
  });

  // Memoized counts
  const [pendingRequestsCount, sentRequestsCount, acceptedFriendsCount] = [
    friendships?.filter(f => f.status === "pending" && !f.isRequester).length || 0,
    friendships?.filter(f => f.status === "pending" && f.isRequester).length || 0,
    friendships?.filter(f => f.status === "accepted").length || 0
  ];

  const getFilteredFriendships = (): Friendship[] => {
    if (!friendships) return [];

    switch(activeTab) {
      case "requests":
        return friendships.filter(f => f.status === "pending" && !f.isRequester);
      case "sent":
        return friendships.filter(f => f.status === "pending" && f.isRequester);
      case "all":
        return friendships.filter(f => f.status === "accepted");
      default:
        return [];
    }
  };

  const renderEmptyState = (icon: React.ReactNode, title: string, message: string, action?: React.ReactNode) => (
    <div className="text-center py-8 px-4 border rounded-lg">
      <div className="mx-auto mb-2 text-muted-foreground">{icon}</div>
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      {action}
    </div>
  );

  const renderFriendCard = (friendship: Friendship, showStatusIcon?: boolean) => (
    <Card key={friendship.id} className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={friendship.friend.avatar} />
            <AvatarFallback>
              {friendship.friend.name[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Link 
              href={`/profile/${friendship.friend.id}`} 
              className="hover:underline"
            >
              <h3 className="text-sm font-semibold cursor-pointer truncate">
                {friendship.friend.name}
              </h3>
            </Link>
            <p className="text-xs text-muted-foreground truncate">
              {friendship.friend.department || "Student"}
            </p>
          </div>
          {showStatusIcon && (
            friendship.status === "accepted" ? (
              <UserCheck className="h-5 w-5 text-green-500" />
            ) : (
              <Clock className="h-5 w-5 text-muted-foreground" />
            )
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container py-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Friends</h1>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="mb-6 grid grid-cols-4 w-full">
            <TabsTrigger value="all" className="relative">
              All Friends
              {acceptedFriendsCount > 0 && (
                <span className="ml-2 badge-count">
                  {acceptedFriendsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              Requests
              {pendingRequestsCount > 0 && (
                <span className="ml-2 badge-count destructive">
                  {pendingRequestsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="relative">
              Sent
              {sentRequestsCount > 0 && (
                <span className="ml-2 badge-count">
                  {sentRequestsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="suggestions">
              Suggestions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            {getFilteredFriendships().length === 0 ? (
              renderEmptyState(
                <Users className="h-8 w-8" />,
                "No friends yet",
                "You don't have any friends yet. Browse suggestions to connect with others.",
                <button 
                  onClick={() => setActiveTab("suggestions")}
                  className="text-primary hover:underline"
                >
                  Browse suggestions
                </button>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredFriendships().map(f => renderFriendCard(f, true))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-0">
            {getFilteredFriendships().length === 0 ? (
              renderEmptyState(
                <Clock className="h-8 w-8" />,
                "No pending requests",
                "You don't have any pending friend requests."
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredFriendships().map(friendship => (
                  <UserCard 
                    key={friendship.id}
                    user={{
                      ...friendship.friend,
                      friendshipStatus: friendship.status,
                      friendshipId: friendship.id,
                      isRequester: false
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-0">
            {getFilteredFriendships().length === 0 ? (
              renderEmptyState(
                <Clock className="h-8 w-8" />,
                "No sent requests",
                "You haven't sent any friend requests."
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredFriendships().map(f => renderFriendCard(f))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="mt-0">
            {suggestionsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (userSuggestions?.length ?? 0) === 0 ? (
              renderEmptyState(
                <Users className="h-8 w-8" />,
                "No suggestions",
                "There are no user suggestions at the moment."
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userSuggestions?.map(user => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}