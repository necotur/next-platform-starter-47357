

'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { DashboardHeader } from '@/components/dashboard-header';
import { PhotoDisplay } from '@/components/photo-display';
import { useLanguage } from '@/contexts/language-context';
import { 
  Camera, 
  Download,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Info,
  X,
  ZoomIn
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ProgressPhoto {
  id: string;
  alignerNumber: number;
  photoType: string;
  cloudStoragePath: string;
  capturedAt: string;
}

const PHOTO_TYPES = ['front', 'left', 'right'];

export default function PhotosPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const PHOTO_TYPE_LABELS: Record<string, string> = {
    front: t.photos.photoTypeLabels.front,
    left: t.photos.photoTypeLabels.left,
    right: t.photos.photoTypeLabels.right,
  };
  
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [treatmentPlan, setTreatmentPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('front');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<ProgressPhoto | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const [photosRes, planRes] = await Promise.all([
        fetch('/api/photos'),
        fetch('/api/treatment-plan'),
      ]);

      if (photosRes.ok) {
        setPhotos(await photosRes.json());
      }

      if (planRes.ok) {
        setTreatmentPlan(await planRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhoto(file);
    }
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alignerNumber', treatmentPlan?.currentAlignerNumber?.toString() || '1');
      formData.append('photoType', selectedType);

      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newPhoto = await response.json();
        setPhotos([newPhoto, ...photos]);
        setShowUploadModal(false);
      }
    } catch (error) {
      console.error('Failed to upload photo:', error);
      alert(t.photos.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  const downloadPhoto = async (photo: ProgressPhoto) => {
    try {
      const response = await fetch(`/api/photos/${photo.id}/download`);
      if (response.ok) {
        const { url } = await response.json();
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.download = `aligner-${photo.alignerNumber}-${photo.photoType}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Failed to download photo:', error);
      alert(t.photos.downloadFailed);
    }
  };

  const deletePhoto = async (photoId: string) => {
    if (!confirm(t.photos.deleteConfirm)) return;

    try {
      const response = await fetch(`/api/photos?id=${photoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPhotos(photos.filter(p => p.id !== photoId));
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
      alert(t.photos.deleteFailed);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#AF4B6C' }} />
      </div>
    );
  }

  // Group photos by aligner number
  const photosByAligner = photos?.reduce((acc: Record<number, ProgressPhoto[]>, photo) => {
    if (!acc[photo.alignerNumber]) {
      acc[photo.alignerNumber] = [];
    }
    acc[photo.alignerNumber].push(photo);
    return acc;
  }, {});

  const alignerNumbers = Object.keys(photosByAligner || {})
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F5F5F5' }}>
      <DashboardHeader title={t.photos.title} />
      
      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <div 
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ backgroundColor: '#FFF5F8' }}
        >
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#AF4B6C' }} />
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: '#3F0F22' }}>
              {t.photos.trackTransformation}
            </p>
            <p className="text-xs text-gray-600">
              {t.photos.trackDesc}
            </p>
            <button
              onClick={() => setShowGuidelines(!showGuidelines)}
              className="text-xs font-medium mt-2"
              style={{ color: '#AF4B6C' }}
            >
              {showGuidelines ? t.photos.hidePhotoGuidelines : t.photos.viewPhotoGuidelines}
            </button>
          </div>
        </div>

        {/* Photo Guidelines */}
        {showGuidelines && (
          <div className="bg-white rounded-xl p-5 shadow-md space-y-3 animate-slide-in-up">
            <h3 className="font-semibold mb-2" style={{ color: '#3F0F22' }}>
              {t.photos.photoTips}
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="flex-shrink-0">•</span>
                <span>{t.photos.tip1}</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0">•</span>
                <span>{t.photos.tip2}</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0">•</span>
                <span>{t.photos.tip3}</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0">•</span>
                <span>{t.photos.tip4}</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0">•</span>
                <span>{t.photos.tip5}</span>
              </li>
            </ul>
          </div>
        )}

        {/* Add Photo Button */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="w-full py-4 rounded-xl text-white font-medium shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: '#AF4B6C' }}
        >
          <Camera className="w-5 h-5" />
          {t.photos.addNewPhoto}
        </button>

        {/* Photo Timeline */}
        <div>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#3F0F22' }}>
            {t.photos.photoTimeline}
          </h3>
          
          {alignerNumbers.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-md">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: '#AF4B6C' }} />
              <p className="text-gray-500 mb-2">{t.photos.noPhotos}</p>
              <p className="text-sm text-gray-400">
                {t.photos.startTaking}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alignerNumbers.map((alignerNum) => (
                <div key={alignerNum} className="bg-white rounded-xl p-4 shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold" style={{ color: '#3F0F22' }}>
                        {t.photos.aligner} {alignerNum}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {formatDate(photosByAligner?.[alignerNum]?.[0]?.capturedAt ?? new Date())}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {photosByAligner?.[alignerNum]?.length || 0} {language === 'ar' ? 'صورة' : language === 'tr' ? 'fotoğraf' : language === 'ku' ? 'wêne' : 'photo(s)'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {PHOTO_TYPES.map((type) => {
                      const photo = photosByAligner?.[alignerNum]?.find(p => p.photoType === type);
                      
                      return (
                        <div key={type} className="relative">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative group">
                            {photo ? (
                              <>
                                <PhotoDisplay 
                                  cloudStoragePath={photo.cloudStoragePath}
                                  alt={`${PHOTO_TYPE_LABELS[type]} - Aligner ${alignerNum}`}
                                  className="w-full h-full cursor-pointer"
                                  onClick={() => setFullscreenPhoto(photo)}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFullscreenPhoto(photo);
                                    }}
                                    className="p-2 bg-white rounded-full hover:scale-110 transition-transform"
                                  >
                                    <ZoomIn className="w-4 h-4" style={{ color: '#3F0F22' }} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadPhoto(photo);
                                    }}
                                    className="p-2 bg-white rounded-full hover:scale-110 transition-transform"
                                  >
                                    <Download className="w-4 h-4" style={{ color: '#3F0F22' }} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deletePhoto(photo.id);
                                    }}
                                    className="p-2 bg-white rounded-full hover:scale-110 transition-transform"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Camera className="w-6 h-6 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-center mt-1 text-gray-600">
                            {PHOTO_TYPE_LABELS[type]}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-slide-in-up">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#3F0F22' }}>
              {t.photos.addProgressPhoto}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                {t.photos.selectPhotoType}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PHOTO_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`py-3 rounded-lg border-2 transition-all ${
                      selectedType === type ? 'border-opacity-100' : 'border-gray-200'
                    }`}
                    style={{
                      borderColor: selectedType === type ? '#AF4B6C' : undefined,
                      backgroundColor: selectedType === type ? '#FFF5F8' : 'white',
                    }}
                  >
                    <p className="text-sm font-medium" style={{ color: '#3F0F22' }}>
                      {PHOTO_TYPE_LABELS[type]}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="flex-1 py-3 rounded-lg border-2 font-medium"
                style={{ borderColor: '#AF4B6C', color: '#AF4B6C' }}
              >
                {t.common.cancel}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2"
                style={{ backgroundColor: '#AF4B6C' }}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.photos.uploading}
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    {t.photos.takePhoto}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Modal */}
      {fullscreenPhoto && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
          onClick={() => setFullscreenPhoto(null)}
        >
          <button
            onClick={() => setFullscreenPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative w-full max-w-4xl aspect-square">
            <PhotoDisplay 
              cloudStoragePath={fullscreenPhoto.cloudStoragePath}
              alt={`Aligner ${fullscreenPhoto.alignerNumber} - ${PHOTO_TYPE_LABELS[fullscreenPhoto.photoType]}`}
              className="w-full h-full rounded-lg overflow-hidden"
            />
          </div>

          <div className="absolute bottom-4 left-0 right-0 text-center text-white">
            <p className="text-lg font-semibold">
              {t.photos.aligner} {fullscreenPhoto.alignerNumber} - {PHOTO_TYPE_LABELS[fullscreenPhoto.photoType]}
            </p>
            <p className="text-sm opacity-80">
              {formatDate(fullscreenPhoto.capturedAt)}
            </p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
