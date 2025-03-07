

import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Home, LogOut, UserCircle, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  // Get friend requests
  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/friends");
      if (!res.ok) return [];
      const friendships = await res.json();
      // Filter to get only pending requests where current user is recipient
      return friendships.filter(f => 
        f.status === "pending" && f.friendId === user?.id
      );
    },
    enabled: !!user,
  });

  const pendingRequestsCount = friendRequests?.length || 0;

  if (!user) return null;

  const displayName = user.name || user.email?.split('@')[0] || "User";

  return (
    <nav className="border-b">
      <div className="container flex h-16 items-center px-4">
        <Link href="/" className="font-semibold">
          Campus Connect
        </Link>

        <div className="ml-auto flex items-center space-x-4">
          <Link href="/">
            <Button
              variant={location === "/" ? "default" : "ghost"}
              size="icon"
              className="w-9 px-0"
            >
              <Home className="h-5 w-5" />
              <span className="sr-only">Home</span>
            </Button>
          </Link>

          <Link href="/friends">
            <Button
              variant={location === "/friends" ? "default" : "ghost"}
              size="icon"
              className="w-9 px-0 relative"
            >
              <Users className="h-5 w-5" />
              {pendingRequestsCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {pendingRequestsCount}
                </Badge>
              )}
              <span className="sr-only">Friends</span>
            </Button>
          </Link>

          <Link href="/complete-profile">
            <Button
              variant={location === "/complete-profile" ? "default" : "ghost"}
              size="icon"
              className="w-9 px-0"
            >
              <UserCircle className="h-5 w-5" />
              <span className="sr-only">Profile</span>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="w-9 px-0"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
