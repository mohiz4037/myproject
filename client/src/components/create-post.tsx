
import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { logger } from "@/lib/logger";
import { User } from "@shared/schema";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ImageUpload } from "@/components/ui/image-upload";

// Schema for post creation validation
const insertPostSchema = z.object({
  content: z.string().min(1, "Post content is required"),
});

export function CreatePost({ user }: { user?: User }) {
  const queryClient = useQueryClient();
  const [images, setImages] = useState<string[]>([]);
  const form = useForm({
    resolver: zodResolver(insertPostSchema),
    defaultValues: { content: '' },
  });

  const createPostMutation = useMutation({
    mutationFn: async (values: { content: string }) => {
      const response = await apiRequest('POST', '/api/posts', {
        content: values.content,
        images: images.length > 0 ? images : undefined,
      });
      if (!response.ok) throw new Error('Failed to create post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
      form.reset();
      setImages([]);
    },
    onError: (error) => {
      logger.error('CreatePost', 'Post creation failed', error);
    },
  });

  if (!user) return null;

  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              createPostMutation.mutate(data)
            )}
            className="space-y-4"
          >
            <div className="flex gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="What's on your mind?"
                        className="border-none text-lg focus-visible:ring-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <ImageUpload
              value={images}
              onChange={setImages}
              maxFiles={4}
              disabled={createPostMutation.isPending}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="submit"
                disabled={createPostMutation.isPending}
              >
                {createPostMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Post
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
