
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  Loader2, 
  History, 
  Upload, 
  Trash2,
  ChevronDown,
  ChevronUp,
  FileJson,
  Copy,
  RotateCw
} from 'lucide-react';

interface ExportSnapshot {
  id: string;
  fileName: string;
  fileSize: number;
  description?: string;
  toothCount: number;
  exportedByName: string;
  exportedByRole: string;
  createdAt: string;
}

export default function ViewerPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const planId = searchParams?.get('planId');

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<any>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [exports, setExports] = useState<ExportSnapshot[]>([]);
  const [showExports, setShowExports] = useState(false);
  const [loadingExports, setLoadingExports] = useState(false);
  const [currentOrientation, setCurrentOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isMobile, setIsMobile] = useState(false);
  const [autoRotateTriggered, setAutoRotateTriggered] = useState(false);

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Detect current orientation
  useEffect(() => {
    const updateOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      setCurrentOrientation(isLandscape ? 'landscape' : 'portrait');
    };
    
    // Initial check
    updateOrientation();
    
    // Listen for orientation changes
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
    
    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  // Auto-trigger rotation on mobile when page loads
  useEffect(() => {
    if (isMobile && !autoRotateTriggered && plan) {
      // Wait a bit for the page to fully load
      const timer = setTimeout(() => {
        handleRotateScreen();
        setAutoRotateTriggered(true);
      }, 1000); // 1 second delay
      
      return () => clearTimeout(timer);
    }
  }, [isMobile, autoRotateTriggered, plan]);

  // Set viewport meta tag for proper mobile handling and rotation support
  useEffect(() => {
    // Add viewport meta tag for better mobile handling with rotation support
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      const originalContent = metaViewport.getAttribute('content');
      // Allow user scaling and don't lock zoom - this helps with orientation changes
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover');
      
      // Restore on unmount
      return () => {
        if (originalContent) {
          metaViewport.setAttribute('content', originalContent);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && planId) {
      fetchPlan();
      fetchExports();
    }
  }, [status, planId]);

  useEffect(() => {
    // Listen for messages from iframe
    const handleMessage = async (event: MessageEvent) => {
      // Security: verify origin if needed
      // if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'EXPORT_DATA') {
        handleExportData(event.data.data, event.data.filename);
      } else if (event.data?.type === 'IMPORT_SUCCESS') {
        toast.success('Import completed successfully!');
      } else if (event.data?.type === 'IMPORT_MANUAL') {
        toast('Import data loaded. Check console (F12) for window.__importData', {
          duration: 5000,
          icon: 'ℹ️',
        });
        console.log('[Viewer Page] Manual import required:', event.data.message);
        console.log('[Viewer Page] You can inspect the import data using: window.__importData');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [planId]);

  const fetchPlan = async () => {
    try {
      const response = await fetch(`/api/3d-plans/view?planId=${planId}`);
      const data = await response.json();

      if (response.ok) {
        setPlan(data.plan);
      } else {
        toast.error('Failed to load 3D treatment plan');
        router.push('/3d-plans');
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
      toast.error('Failed to load 3D treatment plan');
      router.push('/3d-plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchExports = async () => {
    try {
      setLoadingExports(true);
      const response = await fetch(`/api/3d-plans/exports/list?planId=${planId}`);
      const data = await response.json();

      if (response.ok) {
        setExports(data.snapshots || []);
      }
    } catch (error) {
      console.error('Error fetching exports:', error);
    } finally {
      setLoadingExports(false);
    }
  };

  // Send signed URLs to iframe when plan is loaded and iframe is ready
  useEffect(() => {
    if (plan && iframeLoaded && iframeRef.current?.contentWindow) {
      const assetsConfig = {
        type: 'ASSET_URLS',
        payload: {
          unitedModelUrl: plan.unitedModelUrl,
          separateModelUrl: plan.separateModelUrl,
          pdfUrl: plan.pdfUrl,
        },
      };
      
      console.log('Sending asset URLs to iframe:', assetsConfig);
      iframeRef.current.contentWindow.postMessage(assetsConfig, '*');
    }
  }, [plan, iframeLoaded]);

  const handleExportData = async (exportData: any, filename?: string) => {
    try {
      const response = await fetch('/api/3d-plans/exports/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          exportData,
          filename,
          description: `Export saved on ${new Date().toLocaleString()}`,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Export saved successfully!');
        
        // Refresh exports list
        fetchExports();
        setShowExports(true);
        
        // Send success message back to iframe
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            { type: 'EXPORT_SUCCESS', message: 'Data saved successfully!' },
            '*'
          );
        }
      } else {
        toast.error('Failed to save export');
        
        // Send error message back to iframe
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            { type: 'EXPORT_ERROR', message: 'Failed to save data' },
            '*'
          );
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to save export');
    }
  };

  const handleImportExport = async (snapshotId: string) => {
    try {
      const response = await fetch(`/api/3d-plans/exports/get?snapshotId=${snapshotId}`);
      const data = await response.json();

      if (response.ok && iframeRef.current?.contentWindow) {
        console.log('[Viewer Page] Sending import data to iframe:', {
          snapshotId,
          fileName: data.snapshot.fileName,
          hasExportData: !!data.exportData,
          exportDataKeys: Object.keys(data.exportData || {})
        });
        
        // Send import data to iframe
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'IMPORT_DATA',
            exportData: data.exportData,
          },
          '*'
        );
        
        toast.success(`Import sent to viewer: ${data.snapshot.fileName}`);
        console.log('[Viewer Page] Watch the iframe console for import status');
      } else {
        toast.error('Failed to load export');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import export');
    }
  };

  const handleCopyToClipboard = async (snapshotId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/3d-plans/exports/get?snapshotId=${snapshotId}`);
      const data = await response.json();

      if (response.ok) {
        const jsonString = JSON.stringify(data.exportData, null, 2);
        await navigator.clipboard.writeText(jsonString);
        toast.success(`Copied ${fileName} to clipboard!`);
      } else {
        toast.error('Failed to load export data');
      }
    } catch (error) {
      console.error('Copy error:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDownloadExport = async (snapshotId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/3d-plans/exports/get?snapshotId=${snapshotId}`);
      const data = await response.json();

      if (response.ok) {
        const jsonString = JSON.stringify(data.exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success(`Downloaded ${fileName}`);
      } else {
        toast.error('Failed to download export');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download export');
    }
  };

  const handleDeleteExport = async (snapshotId: string) => {
    if (!confirm('Are you sure you want to delete this export?')) {
      return;
    }

    try {
      const response = await fetch(`/api/3d-plans/exports/delete?snapshotId=${snapshotId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Export deleted successfully');
        fetchExports();
      } else {
        toast.error('Failed to delete export');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete export');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDownloadPDF = () => {
    if (plan?.pdfUrl) {
      window.open(plan.pdfUrl, '_blank');
    }
  };

  const handleRotateScreen = async () => {
    try {
      const elem = document.documentElement;
      
      // Check if already in fullscreen
      const isFullscreen = document.fullscreenElement !== null;
      
      // If in fullscreen, exit it
      if (isFullscreen) {
        try {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          } else if ((document as any).mozCancelFullScreen) {
            await (document as any).mozCancelFullScreen();
          } else if ((document as any).msExitFullscreen) {
            await (document as any).msExitFullscreen();
          }
          
          // Unlock orientation when exiting fullscreen
          if ('orientation' in screen && 'unlock' in screen.orientation) {
            try {
              (screen.orientation as any).unlock();
            } catch (err) {
              console.log('Orientation unlock failed:', err);
            }
          }
          
          toast.success('Exited fullscreen', {
            duration: 2000,
          });
          return;
        } catch (err) {
          console.log('Exit fullscreen failed:', err);
          toast.error('Failed to exit fullscreen', {
            duration: 2000,
          });
          return;
        }
      }
      
      // Not in fullscreen, so enter fullscreen and try to rotate
      // Check if we can use the Screen Orientation API
      if ('orientation' in screen && 'lock' in screen.orientation) {
        // Request fullscreen first, as orientation lock requires it
        try {
          if (elem.requestFullscreen) {
            await elem.requestFullscreen();
          } else if ((elem as any).webkitRequestFullscreen) {
            await (elem as any).webkitRequestFullscreen();
          } else if ((elem as any).mozRequestFullScreen) {
            await (elem as any).mozRequestFullScreen();
          } else if ((elem as any).msRequestFullscreen) {
            await (elem as any).msRequestFullscreen();
          }
          
          // Wait a bit for fullscreen to activate
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
          console.log('Fullscreen request failed:', err);
          // Continue to try orientation lock anyway
        }
        
        // Now try to lock orientation to landscape
        try {
          await (screen.orientation as any).lock('landscape-primary');
          toast.success('Switched to landscape mode', {
            duration: 2000,
          });
        } catch (orientErr) {
          console.log('Orientation lock failed:', orientErr);
          // Show user instructions
          toast('Please rotate your device manually to change orientation', {
            icon: '🔄',
            duration: 4000,
          });
        }
      } else {
        // API not supported - just enter fullscreen which helps with viewing
        try {
          if (elem.requestFullscreen) {
            await elem.requestFullscreen();
            toast.success('Entered fullscreen. Now rotate your device manually.', {
              duration: 3000,
            });
          } else if ((elem as any).webkitRequestFullscreen) {
            await (elem as any).webkitRequestFullscreen();
            toast.success('Entered fullscreen. Now rotate your device manually.', {
              duration: 3000,
            });
          } else {
            toast('Please rotate your device manually', {
              icon: '🔄',
              duration: 3000,
            });
          }
        } catch (err) {
          toast('Please rotate your device manually', {
            icon: '🔄',
            duration: 3000,
          });
        }
      }
    } catch (error) {
      console.error('Rotation error:', error);
      toast('Please rotate your device manually', {
        icon: '🔄',
        duration: 3000,
      });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!session || !plan) {
    router.push('/signin');
    return null;
  }

  return (
    <>
      {/* Optimize for mobile viewing - allow rotation */}
      <style jsx global>{`
        @media (max-width: 768px) {
          /* Allow body to resize naturally for rotation */
          body {
            width: 100%;
            min-height: 100vh;
            overflow-x: hidden;
          }
          
          /* Optimize for landscape orientation */
          @media (orientation: landscape) {
            body {
              -webkit-overflow-scrolling: touch;
            }
          }
        }
        
        /* Floating rotation button for fullscreen mode */
        .floating-rotate-btn {
          position: fixed;
          top: 10px;
          right: 10px;
          z-index: 9999;
          background: rgba(255, 255, 255, 0.95);
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          padding: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          touch-action: manipulation;
        }
        
        .floating-rotate-btn:hover {
          background: rgba(255, 255, 255, 1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
          transform: scale(1.1);
        }
        
        .floating-rotate-btn:active {
          transform: scale(0.95);
        }
        
        /* Show floating button only in fullscreen on mobile */
        .floating-rotate-btn {
          display: none;
        }
        
        @media (max-width: 768px) {
          :fullscreen .floating-rotate-btn,
          :-webkit-full-screen .floating-rotate-btn,
          :-moz-full-screen .floating-rotate-btn,
          :-ms-fullscreen .floating-rotate-btn {
            display: flex !important;
          }
        }
      `}</style>

      <div className="flex flex-col h-screen bg-background">
        {/* Compact Header for Mobile */}
        <div className="border-b bg-card shadow-sm">
          <div className="container mx-auto px-2 sm:px-4 py-1.5 sm:py-3">
            {/* Mobile Layout */}
            <div className="flex md:hidden items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/3d-plans')}
                className="h-8 px-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex-1 min-w-0 mx-2">
                <h1 className="text-sm font-semibold truncate">{plan.patientName}</h1>
                <p className="text-xs text-muted-foreground truncate">
                  {plan.doctorName && `Dr. ${plan.doctorName}`}
                </p>
              </div>

              <div className="flex items-center gap-1">
                {/* View counter - admin only */}
                {(session?.user as any)?.role === 'admin' && (
                  <div className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Eye className="w-3 h-3" />
                    {plan.viewCount}
                  </div>
                )}
                
                {/* Rotation button - mobile only */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRotateScreen}
                  className="h-8 px-2"
                  title={`Rotate to ${currentOrientation === 'portrait' ? 'landscape' : 'portrait'}`}
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowExports(!showExports)}
                  className="h-8 px-2"
                >
                  <History className="w-4 h-4" />
                  {showExports ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                </Button>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/3d-plans')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                <div>
                  <h1 className="text-lg font-semibold">{plan.patientName}</h1>
                  <p className="text-sm text-muted-foreground">
                    {plan.doctorName && `Dr. ${plan.doctorName} • `}
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View counter - admin only */}
                {(session?.user as any)?.role === 'admin' && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {plan.viewCount} views
                  </div>
                )}
                
                {/* No rotation button on desktop - it's mobile only */}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowExports(!showExports)}
                >
                  <History className="w-4 h-4 mr-2" />
                  Export History ({exports.length})
                  {showExports ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                </Button>
                
                {plan.pdfUrl && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDownloadPDF}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF Report
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Export History Panel */}
      {showExports && (
        <div className="border-b bg-muted/50">
          <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 max-h-48 sm:max-h-64 overflow-y-auto">
            <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3">Saved Exports</h3>
            
            {loadingExports ? (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              </div>
            ) : exports.length === 0 ? (
              <div className="text-center py-4">
                <FileJson className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No exports yet. Export your changes from the 3D viewer to save them here.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 sm:space-y-2">
                {exports.map((exp) => (
                  <Card key={exp.id} className="p-2 sm:p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                          <FileJson className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                          <p className="font-medium text-xs sm:text-sm truncate">{exp.fileName}</p>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5 hidden sm:block">
                          <p>{exp.toothCount} tooth movements</p>
                          <p>{formatFileSize(exp.fileSize)} • {new Date(exp.createdAt).toLocaleString()}</p>
                          <p>By: {exp.exportedByName} ({exp.exportedByRole})</p>
                          {exp.description && <p className="italic">{exp.description}</p>}
                        </div>
                        <div className="text-[10px] text-muted-foreground sm:hidden">
                          <p>{exp.toothCount} movements • {formatFileSize(exp.fileSize)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-0.5 sm:gap-1 ml-1 sm:ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleImportExport(exp.id)}
                          title="Import this export into viewer"
                          className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                        >
                          <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyToClipboard(exp.id, exp.fileName)}
                          title="Copy JSON to clipboard"
                          className="h-7 w-7 p-0 sm:h-8 sm:w-8 hidden sm:flex"
                        >
                          <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadExport(exp.id, exp.fileName)}
                          title="Download JSON file"
                          className="h-7 w-7 p-0 sm:h-8 sm:w-8 hidden sm:flex"
                        >
                          <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        
                        {(session?.user as any)?.role === 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExport(exp.id)}
                            title="Delete this export"
                            className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Iframe Container - Optimized for mobile */}
      <div className="flex-1 relative overflow-hidden">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <div className="text-center">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-muted-foreground">Loading 3D viewer...</p>
            </div>
          </div>
        )}
        
        {plan.htmlUrl ? (
          <iframe
            ref={iframeRef}
            src={plan.htmlUrl}
            className="w-full h-full border-0 absolute inset-0"
            style={{ 
              border: 'none', 
              margin: 0, 
              padding: 0,
              display: 'block',
              width: '100%',
              height: '100%'
            }}
            onLoad={() => setIframeLoaded(true)}
            title="3D Treatment Plan Viewer"
            sandbox="allow-scripts allow-same-origin allow-forms"
            allow="accelerometer; gyroscope"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Card className="p-6">
              <p className="text-muted-foreground">
                HTML viewer file not available for this plan.
              </p>
            </Card>
          </div>
        )}
      </div>
      
      {/* Floating rotation button - shows only in fullscreen on mobile */}
      {isMobile && (
        <button
          className="floating-rotate-btn"
          onClick={handleRotateScreen}
          title="Rotate screen or exit fullscreen"
          aria-label="Rotate screen or exit fullscreen"
        >
          <RotateCw className="w-5 h-5 text-gray-700" />
        </button>
      )}
    </div>
    </>
  );
}
