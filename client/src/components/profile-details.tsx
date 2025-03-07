
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Briefcase, User2, Heart } from "lucide-react";

interface ProfileDetailsProps {
  user: User;
}

export function ProfileDetails({ user }: ProfileDetailsProps) {
  // Format birthdate if exists
  const formattedBirthdate = user.birthdate
    ? new Date(user.birthdate).toLocaleDateString()
    : "Not specified";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center">
          <User2 className="h-5 w-5 mr-2 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Full Name</p>
            <p className="text-sm text-muted-foreground">{user.name}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Birthdate</p>
            <p className="text-sm text-muted-foreground">{formattedBirthdate}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <Briefcase className="h-5 w-5 mr-2 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Department</p>
            <p className="text-sm text-muted-foreground">{user.department || "Not specified"}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <User2 className="h-5 w-5 mr-2 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Gender</p>
            <p className="text-sm text-muted-foreground">
              {user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : "Not specified"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center">
          <Heart className="h-5 w-5 mr-2 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Marital Status</p>
            <p className="text-sm text-muted-foreground">
              {user.maritalStatus ? user.maritalStatus.charAt(0).toUpperCase() + user.maritalStatus.slice(1) : "Not specified"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
