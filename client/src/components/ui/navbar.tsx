import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./button";
import { LogOut, Home, User } from "lucide-react";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              UniConnect
            </Link>
          </div>

          <div className="flex items-center gap-4">
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

            <Link href={`/profile/${user.id}`}>
              <Button
                variant={location.startsWith("/profile") ? "default" : "ghost"}
                size="icon"
                className="w-9 px-0"
              >
                <User className="h-5 w-5" />
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
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}