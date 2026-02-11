/**
 * Renders a profile image with fallback when the image fails to load (e.g. 404 on ephemeral storage).
 * Prevents broken images and React errors when uploads are lost after deploy.
 */
import { useState } from "react";

interface SafeProfileImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLetter?: string;
}

export function SafeProfileImage({ src, alt, className = "", fallbackLetter }: SafeProfileImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-primary/20 text-primary text-2xl font-bold ${className}`}
        aria-label={alt}
      >
        {fallbackLetter || alt?.[0] || "?"}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
