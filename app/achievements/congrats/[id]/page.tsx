
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import { Award, ArrowLeft, Share2 } from 'lucide-react';
import Image from 'next/image';
import html2canvas from 'html2canvas';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export default function CongratsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const { t, language } = useLanguage();
  
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      
      // Only patients can access this page
      if (userRole !== 'patient') {
        router.push('/dashboard');
        return;
      }
      
      fetchAchievement();
    }
  }, [status, router, session, params.id, language]);

  const fetchAchievement = async () => {
    try {
      const response = await fetch(`/api/achievements?lang=${language}`);
      if (response.ok) {
        const achievements = await response.json();
        const found = achievements.find((a: Achievement) => a.id === params.id);
        
        if (found && found.unlocked) {
          setAchievement(found);
        } else {
          router.push('/achievements');
        }
      }
    } catch (error) {
      console.error('Failed to fetch achievement:', error);
      router.push('/achievements');
    } finally {
      setLoading(false);
    }
  };

  const shareToSocial = async (platform: 'instagram' | 'facebook') => {
    setSharing(true);
    
    // Hide confetti before capturing to avoid faint look
    setShowConfetti(false);
    
    // Wait a brief moment for the confetti to be removed from DOM
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      // Get the achievement card element
      const element = document.getElementById('achievement-card');
      if (!element) return;

      // Target dimensions for Instagram/social media (1080x1920 portrait)
      const targetWidth = 1080;
      const targetHeight = 1920;
      
      // Get current dimensions
      const currentWidth = element.offsetWidth;
      const currentHeight = element.offsetHeight;
      
      // Calculate the scale needed to make the width match 1080px
      // We'll use a high scale factor to ensure quality
      const baseScale = 3; // High quality capture
      
      // Temporarily scale up the element visually for capture
      const originalTransform = element.style.transform;
      const originalTransformOrigin = element.style.transformOrigin;
      
      // Calculate how much we need to scale to fill the target dimensions
      const scaleToFit = Math.min(targetWidth / currentWidth, targetHeight / currentHeight) * 0.95; // 95% to add some padding
      
      element.style.transformOrigin = 'top center';
      element.style.transform = `scale(${scaleToFit})`;
      
      // Wait for the transform to apply
      await new Promise(resolve => setTimeout(resolve, 50));

      // Capture at high resolution
      const canvas = await html2canvas(element, {
        backgroundColor: '#F5F5F5',
        scale: baseScale,
        width: currentWidth,
        height: currentHeight,
        windowWidth: currentWidth,
        windowHeight: currentHeight,
      });

      // Restore original transform
      element.style.transform = originalTransform;
      element.style.transformOrigin = originalTransformOrigin;

      // Create final canvas with exact social media dimensions
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = targetWidth;
      finalCanvas.height = targetHeight;
      const ctx = finalCanvas.getContext('2d');
      
      if (ctx) {
        // Fill with background color
        ctx.fillStyle = '#F5F5F5';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        
        // Calculate dimensions to fit the canvas properly
        const scaledWidth = canvas.width * scaleToFit / baseScale * targetWidth / currentWidth;
        const scaledHeight = canvas.height * scaleToFit / baseScale * targetHeight / currentHeight;
        
        // Center the image
        const x = (targetWidth - scaledWidth) / 2;
        const y = (targetHeight - scaledHeight) / 2;
        
        ctx.drawImage(canvas, x, y, scaledWidth, scaledHeight);
      }

      // Convert to blob
      finalCanvas.toBlob(async (blob) => {
        if (!blob) return;

        // Create file
        const file = new File([blob], `achievement-${achievement?.name}.png`, {
          type: 'image/png',
        });

        // Check if Web Share API is supported
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: t.achievementCongrats.title,
              text: `${t.achievementCongrats.youUnlocked} ${achievement?.name}! 🎉`,
            });
          } catch (err) {
            console.error('Error sharing:', err);
            // Fallback to download
            downloadImage(finalCanvas);
          }
        } else {
          // Fallback to download
          downloadImage(finalCanvas);
        }
        
        // Show confetti again after sharing
        setShowConfetti(true);
        setSharing(false);
      });
    } catch (error) {
      console.error('Failed to share:', error);
      // Show confetti again on error
      setShowConfetti(true);
      setSharing(false);
    }
  };

  const downloadImage = (canvas: HTMLCanvasElement) => {
    const link = document.createElement('a');
    link.download = `achievement-${achievement?.name}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#AF4B6C' }} />
      </div>
    );
  }

  if (!achievement) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 py-8" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Confetti animation - Only show when showConfetti is true */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-3 h-3 rotate-45"
                style={{
                  backgroundColor: ['#AF4B6C', '#3F0F22', '#FFD700', '#FFA500', '#FF69B4'][Math.floor(Math.random() * 5)],
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => router.push('/achievements')}
        className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all"
      >
        <ArrowLeft className="w-6 h-6" style={{ color: '#3F0F22' }} />
      </button>

      {/* Achievement Card - This will be captured for sharing */}
      <div
        id="achievement-card"
        className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full mb-4 animate-scale-in relative overflow-hidden"
      >
        {/* Decorative clear aligner image - top right */}
        <div className="absolute top-4 right-4 opacity-60 rotate-12 z-0">
          <div className="relative w-28 h-28">
            <Image
              src="/retainer2.png"
              alt=""
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Decorative clear aligner image - top left */}
        <div className="absolute top-8 left-2 opacity-50 -rotate-6 z-0">
          <div className="relative w-20 h-20">
            <Image
              src="/clear-aligner.png"
              alt=""
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Decorative clear aligner image - bottom left */}
        <div className="absolute bottom-4 left-4 opacity-60 -rotate-12 z-0">
          <div className="relative w-24 h-24">
            <Image
              src="/dental-clear-aligners-teeth-replacement-retainer2.png"
              alt=""
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Decorative clear aligner image - bottom right */}
        <div className="absolute bottom-8 right-2 opacity-50 rotate-6 z-0">
          <div className="relative w-20 h-20">
            <Image
              src="/retainer2.png"
              alt=""
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Additional decorative images in corners */}
        <div className="absolute top-1/3 right-2 opacity-40 rotate-45 z-0">
          <div className="relative w-16 h-16">
            <Image
              src="/clear-aligner.png"
              alt=""
              fill
              className="object-contain"
            />
          </div>
        </div>

        <div className="absolute top-1/2 left-2 opacity-40 -rotate-45 z-0">
          <div className="relative w-16 h-16">
            <Image
              src="/dental-clear-aligners-teeth-replacement-retainer2.png"
              alt=""
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Logo - Larger */}
        <div className="flex justify-center mb-6 relative z-10">
          <div className="relative w-40 h-40">
            <Image
              src="/logo1v.png"
              alt="Seamless Smile"
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-2xl font-bold text-center mb-2 relative z-10"
          style={{ color: '#3F0F22' }}
        >
          {t.achievementCongrats.title}
        </h1>
        
        <p className="text-center text-gray-600 mb-6 relative z-10">
          {t.achievementCongrats.congrats}
        </p>

        {/* Achievement Icon with side decorations */}
        <div className="flex justify-center items-center mb-6 relative z-10 gap-6">
          {/* Left clear aligner decoration */}
          <div className="opacity-60 rotate-[-15deg] hidden sm:block">
            <div className="relative w-20 h-20">
              <Image
                src="/clear-aligner.png"
                alt=""
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Central Achievement Icon - Bright and clear, no overlay from confetti */}
          <div
            className="relative w-44 h-44 rounded-full flex items-center justify-center text-7xl shadow-2xl z-50"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 0 40px rgba(175, 75, 108, 0.4)',
              border: '4px solid #FFF5F8',
            }}
          >
            <span style={{ filter: 'none', opacity: 1, position: 'relative', zIndex: 51 }}>{achievement.icon}</span>
          </div>

          {/* Right clear aligner decoration */}
          <div className="opacity-60 rotate-[15deg] hidden sm:block">
            <div className="relative w-20 h-20">
              <Image
                src="/retainer2.png"
                alt=""
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Achievement Name */}
        <h2
          className="text-3xl font-bold text-center mb-3 relative z-10"
          style={{ color: '#AF4B6C' }}
        >
          {achievement.name}
        </h2>

        {/* Achievement Description */}
        <p className="text-center text-gray-600 mb-6 px-4 relative z-10">
          {achievement.description}
        </p>

        {/* Unlocked Date */}
        {achievement.unlockedAt && (
          <p className="text-center text-sm text-gray-500 relative z-10">
            {new Date(achievement.unlockedAt).toLocaleDateString(
              language === 'ar' ? 'ar-SA' : language === 'tr' ? 'tr-TR' : language === 'ku' ? 'ku-TR' : 'en-US',
              { year: 'numeric', month: 'long', day: 'numeric' }
            )}
          </p>
        )}

        {/* Motivational Message */}
        <div
          className="mt-6 p-4 rounded-xl text-center relative z-10"
          style={{ backgroundColor: '#FFF5F8' }}
        >
          <p className="text-sm font-medium" style={{ color: '#AF4B6C' }}>
            {t.achievementCongrats.keepGoing}
          </p>
        </div>
      </div>

      {/* Share Buttons - OUTSIDE the achievement-card so they won't be captured in screenshots */}
      <div className="space-y-3 w-full max-w-md mb-4">
        <button
          onClick={() => shareToSocial('instagram')}
          disabled={sharing}
          className="w-full py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #E1306C 0%, #C13584 50%, #833AB4 100%)',
          }}
        >
          <Share2 className="w-5 h-5" />
          {sharing ? '...' : t.achievementCongrats.shareToInstagram}
        </button>

        <button
          onClick={() => shareToSocial('facebook')}
          disabled={sharing}
          className="w-full py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: '#1877F2' }}
        >
          <Share2 className="w-5 h-5" />
          {sharing ? '...' : t.achievementCongrats.shareToFacebook}
        </button>
      </div>

      {/* Back to Achievements Button - Outside card */}
      <div className="w-full max-w-md mt-4">
        <button
          onClick={() => router.push('/achievements')}
          className="w-full py-3 rounded-xl font-semibold border-2 transition-all transform hover:scale-105 bg-white"
          style={{
            borderColor: '#AF4B6C',
            color: '#AF4B6C',
          }}
        >
          {t.achievementCongrats.backToAchievements}
        </button>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes scale-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-confetti {
          animation: confetti linear forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
