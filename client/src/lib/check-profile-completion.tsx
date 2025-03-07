
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export function CheckProfileCompletion({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Skip if loading or on profile completion page or auth page
    if (
      isLoading || 
      !user || 
      location === "/complete-profile" || 
      location === "/auth"
    ) {
      return;
    }
    
    // Check if profile is not completed
    if (user.profileCompleted !== 1) {
      setLocation("/complete-profile");
    }
  }, [user, isLoading, location, setLocation]);
  
  return <>{children}</>;
}
