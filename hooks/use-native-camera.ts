import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNativePlatform } from '@/lib/capacitor';
import { toast } from 'sonner';

interface UseNativeCameraReturn {
  takePhoto: () => Promise<string | null>;
  pickPhoto: () => Promise<string | null>;
  isLoading: boolean;
}

export const useNativeCamera = (): UseNativeCameraReturn => {
  const [isLoading, setIsLoading] = useState(false);

  const takePhoto = async (): Promise<string | null> => {
    try {
      setIsLoading(true);

      if (!isNativePlatform()) {
        // Fallback to web file input
        return null;
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      return image.dataUrl || null;
    } catch (error) {
      console.error('Error taking photo:', error);
      toast.error('Failed to take photo');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const pickPhoto = async (): Promise<string | null> => {
    try {
      setIsLoading(true);

      if (!isNativePlatform()) {
        // Fallback to web file input
        return null;
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      return image.dataUrl || null;
    } catch (error) {
      console.error('Error picking photo:', error);
      toast.error('Failed to pick photo');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { takePhoto, pickPhoto, isLoading };
};
