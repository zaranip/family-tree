import { useState, useRef, type ChangeEvent } from 'react';
import { Upload, X, User } from 'lucide-react';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageSelect: (file: File) => void;
  onImageRemove?: () => void;
  isUploading?: boolean;
  label?: string;
  hint?: string;
  error?: string;
}

export function ImageUpload({
  currentImageUrl,
  onImageSelect,
  onImageRemove,
  isUploading = false,
  label = 'Photo',
  hint,
  error,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = previewUrl || currentImageUrl;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    onImageSelect(file);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemove?.();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-base font-medium text-[rgb(var(--color-text-main))] mb-2">
          {label}
        </label>
      )}

      <div className="flex items-start gap-6">
        {/* Preview */}
        <div className="relative flex-shrink-0">
          <div
            className={`
              w-32 h-32 rounded-xl overflow-hidden bg-[rgb(var(--color-bg-elevated))] 
              flex items-center justify-center border-2 border-dashed
              ${error ? 'border-red-300' : 'border-[rgb(var(--color-border))]'}
            `}
          >
            {isUploading ? (
              <LoadingSpinner size="lg" />
            ) : displayUrl ? (
              <img
                src={displayUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-[rgb(var(--color-text-muted))]" />
            )}
          </div>

          {displayUrl && !isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full 
                       hover:bg-red-600 transition-colors shadow-md"
              aria-label="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />

          <Button
            type="button"
            variant="secondary"
            onClick={handleClick}
            disabled={isUploading}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            {displayUrl ? 'Change Photo' : 'Upload Photo'}
          </Button>

          <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
            {hint || 'JPG, PNG or GIF. Max 5MB.'}
          </p>

          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
