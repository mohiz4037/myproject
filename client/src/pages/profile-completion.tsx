import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter"; // ✅ Correct import for Wouter's navigation
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { profileCompletionSchema, type ProfileCompletionData } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth"; // ✅ Correct import path
import { ImageUploader } from "@/components/image-uploader";
import { apiRequest } from "@/lib/api";
import { Navbar } from "@/components/navbar"; // Added Navbar import

export default function ProfileCompletionPage() {
  const { user, setUser } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation(); // ✅ Correct usage of Wouter's navigation

  const form = useForm<ProfileCompletionData>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      name: user?.name || "",
      birthdate: "",
      department: "",
      gender: undefined,
      maritalStatus: undefined,
    },
    mode: "onBlur", // Added validation mode
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (data: ProfileCompletionData) => {
    try {
      const payload = {
        ...data,
        ...(avatar && { avatar }),
      };

      const res = await apiRequest("POST", "/api/complete-profile", payload);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const updatedUser = await res.json();

      setUser(updatedUser);

      toast({
        title: "Profile Completed!",
        description: "Your profile has been updated successfully.",
      });

      setLocation("/");
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to update profile due to an unexpected error";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Navbar /> {/* Added Navbar */}
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col items-center">
            <div className="w-32 h-32 mb-4 relative rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                  onError={() => setAvatar(null)} // Handle image loading errors
                />
              ) : (
                <span className="text-4xl text-muted-foreground">👤</span>
              )}
            </div>
            <ImageUploader 
              onImageSelected={setAvatar}
              isUploading={isUploading}
              setIsUploading={setIsUploading}
              buttonText="Upload Profile Picture"
              maxSize={5 * 1024 * 1024} // 5MB limit
            />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthdate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birthdate</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Computer Science" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maritalStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marital Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || isUploading}
              >
                {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}