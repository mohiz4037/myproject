import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle } from "lucide-react";

export function UserInfo() {
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="flex items-center space-x-2">
      <Avatar>
        <AvatarImage 
          src={user.avatar} 
          alt={user.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/default-avatar.png';
          }}
        />
        <AvatarFallback>
          {user.name?.[0] || <UserCircle className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium">{user.name || user.email?.split('@')[0] || 'User'}</p>
        {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
      </div>
    </div>
  );
}