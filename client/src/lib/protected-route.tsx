import { useLocation, Route, Redirect } from "wouter";
import { useAuth } from "../hooks/use-auth";
import HomePage from "../pages/home-page";
import LoginPage from "../pages/auth-page";
import RegisterPage from "../pages/auth-page";
import CompleteProfilePage from "../pages/profile-completion";
import FriendsPage from "../pages/friends-page";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  path: string;
  children: React.ReactNode;
}

export function ProtectedRoute({ path, children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user && location !== "/auth") {
    return <Redirect to="/auth" />;
  }

  return (
    <Route path={path}>
      {children}
    </Route>
  );
}

export default function AppRoutes() {
  return (
    <>
      <Route path="/auth" component={LoginPage} /> {/* AuthPage handles both login and register */}
      <ProtectedRoute path="/complete-profile">
        <CompleteProfilePage />
      </ProtectedRoute>
      <ProtectedRoute path="/">
        <HomePage />
      </ProtectedRoute>
      <ProtectedRoute path="/friends">
        <FriendsPage />
      </ProtectedRoute>
    </>
  );
}