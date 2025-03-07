
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { storage } from "@/lib/api";

interface ImageUploaderProps {
  onImageSelected: (imageUrl: string) => void;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
  buttonText?: string;
}

export function ImageUploader({
  onImageSelected,
  isUploading,
  setIsUploading,
  buttonText = "Upload Image"
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Convert the file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onImageSelected(reader.result);
          setIsUploading(false);
        }
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {buttonText}
      </Button>
    </div>
  );
}
