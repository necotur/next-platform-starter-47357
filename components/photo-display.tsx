

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

interface PhotoDisplayProps {
  cloudStoragePath: string;
  alt?: string;
  className?: string;
  onLoad?: () => void;
  onClick?: () => void;
}

export function PhotoDisplay({ 
  cloudStoragePath, 
  alt = 'Photo', 
  className = '',
  onLoad,
  onClick 
}: PhotoDisplayProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadPhoto() {
      try {
        setLoading(true);
        setError(false);
        
        // Call API to get signed URL
        const response = await fetch(`/api/photos/signed-url?path=${encodeURIComponent(cloudStoragePath)}`);
        
        if (!response.ok) {
          throw new Error('Failed to get signed URL');
        }
        
        const data = await response.json();
        setSignedUrl(data.url);
        onLoad?.();
      } catch (err) {
        console.error('Error loading photo:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (cloudStoragePath) {
      loadPhoto();
    }
  }, [cloudStoragePath, onLoad]);

  if (loading) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <p className="text-xs text-gray-500 px-2 text-center">Failed to load</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      <Image
        src={signedUrl}
        alt={alt}
        fill
        className="object-cover"
        unoptimized
      />
    </div>
  );
}
