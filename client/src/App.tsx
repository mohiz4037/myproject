import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import NotFound from "./pages/not-found";
import AuthPage from "./pages/auth-page";
import HomePage from "./pages/home-page";
import ProfilePage from "./pages/profile-page";
import ProfileCompletionPage from "./pages/profile-completion";
import { ProtectedRoute } from "./lib/protected-route";
import { CheckProfileCompletion } from "./lib/check-profile-completion";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CheckProfileCompletion>
          <div className="min-h-screen bg-background">
            <Switch>
              <Route path="/auth" component={AuthPage} />

              <ProtectedRoute path="/">
                <HomePage />
              </ProtectedRoute>

              <ProtectedRoute path="/profile/:id">
                <ProfilePage />
              </ProtectedRoute>

              <ProtectedRoute path="/complete-profile">
                <ProfileCompletionPage />
              </ProtectedRoute>

              <Route component={NotFound} />
            </Switch>
          </div>
          <Toaster />
        </CheckProfileCompletion>
      </AuthProvider>
    </QueryClientProvider>
  );
}