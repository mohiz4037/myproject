
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2, UserPlus, Users, UserCheck } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { logger } from "@/lib/logger";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function FriendSuggestions() {
  const queryClient = useQueryClient();
  const [limit, setLimit] = useState(3);

  // Fetch user suggestions
  const { data: userSuggestions, isLoading } = useQuery({
    queryKey: ["userSuggestions", limit],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/suggestions?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      return res.json();
    }
  });

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", "/api/friends", { friendId: userId });
      if (!res.ok) throw new Error("Failed to send friend request");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSuggestions"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: (error) => {
      logger.error("FriendSuggestions", "Failed to send friend request", error);
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!userSuggestions || userSuggestions.length === 0) {
    return (
      <div className="text-center p-4 border rounded-lg">
        <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        <h3 className="text-sm font-medium">No suggestions</h3>
        <p className="text-xs text-muted-foreground">There are no user suggestions at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {userSuggestions.map((user) => (
          <Card key={user.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>
                    {user.name[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <Link 
                    href={`/profile/${user.id}`}
                    className="hover:underline"
                  >
                    <h3 className="text-sm font-semibold cursor-pointer truncate">
                      {user.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.department || "Student"}
                  </p>
                </div>
                
                {user.friendshipStatus === "pending" ? (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled
                    className="flex-shrink-0"
                  >
                    <UserCheck className="h-5 w-5 text-muted-foreground" />
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="flex-shrink-0"
                    disabled={sendRequestMutation.isPending}
                    onClick={() => sendRequestMutation.mutate(user.id)}
                  >
                    {sendRequestMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <UserPlus className="h-5 w-5" />
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {userSuggestions.length >= limit && (
        <div className="text-center">
          <Button 
            variant="link" 
            onClick={() => setLimit(prev => prev + 3)}
            className="text-xs"
          >
            Show more
          </Button>
        </div>
      )}
    </div>
  );
}
