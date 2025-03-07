import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { toast } from "@/hooks/use-toast";
import { ImagePlus, X } from "lucide-react";

interface ImageUploadProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  onRemove?: (index: number) => void;
  maxImages?: number;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  value = [],
  onChange,
  onRemove,
  maxImages = 4,
  disabled,
  className,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [value, onChange, maxImages]
  );

  const handleFiles = (files: File[]) => {
    if (disabled) return;

    // Check if the total number of images exceeds the limit
    if (value.length + files.length > maxImages) {
      toast({
        title: "Maximum images reached",
        description: `You can only upload up to ${maxImages} images`,
        variant: "destructive",
      });
      return;
    }

    // Filter out non-image files
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length !== files.length) {
      toast({
        title: "Invalid files",
        description: "Please upload only image files",
        variant: "destructive",
      });
      return;
    }

    // Convert image files to base64 URLs
    const promises = imageFiles.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    });

    // Update the state with new images
    Promise.all(promises)
      .then((urls) => {
        onChange?.([...value, ...urls]);
      })
      .catch((error) => {
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
      });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleRemove = (index: number) => {
    if (disabled) return;
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange?.(newValue);
    onRemove?.(index);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed p-4 transition-colors",
          dragActive && "border-primary bg-muted/50",
          disabled && "cursor-not-allowed opacity-60",
          "min-h-[150px] flex flex-col items-center justify-center gap-2"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <ImagePlus className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag and drop images here, or{" "}
          <Button
            type="button"
            variant="link"
            className="px-1 text-primary"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            browse
          </Button>
        </p>
        <p className="text-xs text-muted-foreground">
          Upload up to {maxImages} images
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleChange}
          disabled={disabled}
        />
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((url, i) => (
            <div key={i} className="group relative aspect-square">
              <img
                src={url}
                alt={`Uploaded image ${i + 1}`}
                className="h-full w-full rounded-lg object-cover"
              />
              <button
                type="button"
                className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => handleRemove(i)}
                disabled={disabled}
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}