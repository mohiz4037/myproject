import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, UserCheck, Clock, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import { Link } from "wouter";

type FriendshipStatus = "pending" | "accepted" | "rejected" | null;

interface UserCardProps {
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
    department?: string;
    friendshipStatus: FriendshipStatus;
    friendshipId?: number | null;
    isRequester?: boolean | null;
  };
}

export function UserCard({ user }: UserCardProps) {
  const queryClient = useQueryClient();

  const sendFriendRequestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/friends/request", {
        friendId: user.id
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed to send friend request" }));
        throw new Error(error.error || "Failed to send friend request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSuggestions"] });
      toast({
        title: "Friend request sent",
        description: `A friend request has been sent to ${user.name}`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const respondToRequestMutation = useMutation({
    mutationFn: async (status: "accepted" | "rejected") => {
      if (!user.friendshipId) {
        throw new Error("Friendship ID is missing");
      }

      const res = await apiRequest("PATCH", `/api/friends/${user.friendshipId}`, {
        status
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed to update friend request" }));
        throw new Error(error.error || "Failed to update friend request");
      }
      return res.json();
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["userSuggestions", "friends"] });
      toast({
        title: status === "accepted" ? "Friend request accepted" : "Friend request rejected",
        description: status === "accepted" 
          ? `You are now friends with ${user.name}` 
          : `You rejected ${user.name}'s friend request`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const getAvatarFallback = () => {
    const initials = user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    return initials.length >= 2 ? initials.slice(0, 2) : "US";
  };

  return (
    <Card className="w-full transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback className="bg-muted">
              {getAvatarFallback()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${user.id}`} className="hover:underline">
              <h3 className="text-sm font-semibold text-primary cursor-pointer truncate">
                {user.name}
              </h3>
            </Link>
            <p className="text-xs text-muted-foreground truncate">
              {user.department || "Student"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!user.friendshipStatus && (
          <Button 
            variant="secondary" 
            size="sm" 
            className="w-full"
            onClick={() => sendFriendRequestMutation.mutate()}
            disabled={sendFriendRequestMutation.isPending}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {sendFriendRequestMutation.isPending ? "Sending..." : "Add Friend"}
          </Button>
        )}

        {user.friendshipStatus === "pending" && user.isRequester && (
          <Button 
            variant="secondary" 
            size="sm" 
            className="w-full" 
            disabled
          >
            <Clock className="h-4 w-4 mr-2" />
            Request Sent
          </Button>
        )}

        {user.friendshipStatus === "pending" && !user.isRequester && (
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={() => respondToRequestMutation.mutate("accepted")}
              disabled={respondToRequestMutation.isPending}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Accept
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => respondToRequestMutation.mutate("rejected")}
              disabled={respondToRequestMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Decline
            </Button>
          </div>
        )}

        {user.friendshipStatus === "accepted" && (
          <Button 
            variant="secondary" 
            size="sm" 
            className="w-full" 
            disabled
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Friends
          </Button>
        )}
      </CardContent>
    </Card>
  );
}