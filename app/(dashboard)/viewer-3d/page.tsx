
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

function Viewer3DContent() {
  const { data: session } = useSession() || {};
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');
  
  const [plan, setPlan] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPlanList, setShowPlanList] = useState(false);

  useEffect(() => {
    if (planId) {
      // Load specific plan
      fetch(`/api/treatment-plan-3d?planId=${planId}`)
        .then(res => res.json())
        .then(data => {
          if (data.plan) {
            setPlan(data.plan);
          } else {
            setError('Plan not found');
          }
          setLoading(false);
        })
        .catch(err => {
          setError('Failed to load plan');
          setLoading(false);
        });
    } else {
      // Load all available plans
      fetch('/api/treatment-plan-3d')
        .then(res => res.json())
        .then(data => {
          if (data.plans && data.plans.length > 0) {
            setPlans(data.plans);
            setShowPlanList(true);
          } else {
            // No plans exist, show message
            setPlans([]);
            setShowPlanList(true);
          }
          setLoading(false);
        })
        .catch(err => {
          setError('Failed to load plans');
          setLoading(false);
        });
    }
  }, [planId]);

  useEffect(() => {
    if (!plan) return;

    // Inject the viewer HTML into the iframe
    const iframe = document.getElementById('viewer-iframe') as HTMLIFrameElement;
    if (!iframe) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // Generate the HTML with the plan data
    const userId = session?.user ? (session.user as any).id : '';
    const htmlContent = generateViewerHTML(plan, userId);
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
  }, [plan, session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#AF4B6C' }}></div>
          <p className="mt-4 text-gray-600">Loading 3D Viewer...</p>
        </div>
      </div>
    );
  }

  if (error && !showPlanList) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="text-center p-6">
          <p className="text-red-500 text-lg">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-6 py-2 rounded-lg text-white"
            style={{ backgroundColor: '#AF4B6C' }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Show plan list if no specific plan is selected
  if (showPlanList) {
    return (
      <div className="min-h-screen pb-20" style={{ backgroundColor: '#F5F5F5' }}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="max-w-screen-xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" style={{ color: '#AF4B6C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
                3D Treatment Plans
              </h1>
            </div>
          </div>
        </div>

        <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
          {plans.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFF5F8' }}>
                <svg className="w-8 h-8" style={{ color: '#AF4B6C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: '#3F0F22' }}>
                No 3D Treatment Plans Yet
              </h2>
              <p className="text-gray-600 mb-4">
                Your doctor will create a 3D treatment plan for you to visualize your aligner therapy progress.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {plans.map((p: any) => (
                <a
                  key={p.id}
                  href={`/viewer-3d?planId=${p.id}`}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2" style={{ color: '#3F0F22' }}>
                        {p.patientName}
                      </h3>
                      {p.doctorName && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Doctor:</span> {p.doctorName}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Created:</span> {new Date(p.createdAt).toLocaleDateString()}
                      </p>
                      {p.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          {p.notes}
                        </p>
                      )}
                    </div>
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // Show the 3D viewer
  return (
    <div className="w-full h-screen overflow-hidden">
      <iframe
        id="viewer-iframe"
        className="w-full h-full border-0"
        title="3D Dental Viewer"
        style={{
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
        scrolling="yes"
      />
    </div>
  );
}

export default function Viewer3DPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <Viewer3DContent />
    </Suspense>
  );
}

function generateViewerHTML(plan: any, userId: string) {
  // This is a simplified version - you would include the full HTML from the uploaded file
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>${plan.patientName} - Seamless Smile 3D Portal</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f0f0; }
      #viewer-container { width: 100%; height: 100vh; background: #7a7a7a; position: relative; }
      .info-overlay {
        position: absolute;
        top: 20px;
        left: 20px;
        background: rgba(63, 15, 34, 0.9);
        color: white;
        padding: 15px;
        border-radius: 8px;
        z-index: 100;
      }
      .export-btn {
        position: absolute;
        top: 20px;
        right: 20px;
        background: #ff6b35;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        border: none;
        cursor: pointer;
        z-index: 100;
      }
      .export-btn:hover { background: #ff8659; }
    </style>
</head>
<body>
    <div id="viewer-container">
      <div class="info-overlay">
        <p><strong>Patient:</strong> ${plan.patientName}</p>
        ${plan.doctorName ? `<p><strong>Doctor:</strong> ${plan.doctorName}</p>` : ''}
      </div>
      <button class="export-btn" onclick="exportToBackend()">Save Changes</button>
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: white; flex-direction: column;">
        <h2>3D Viewer Loading...</h2>
        <p style="margin-top: 10px;">Please wait while we load the 3D model</p>
        <p style="margin-top: 20px; font-size: 0.9em; opacity: 0.8;">Model URLs configured: ${plan.unitedModelUrl ? 'Yes' : 'No'}</p>
      </div>
    </div>

    <script>
      // This would contain the full Three.js viewer code
      // For now, this is a placeholder showing the structure
      
      const planId = '${plan.id}';
      const userId = '${userId}';
      
      // Mock tooth movements data
      let toothMovements = new Map();
      
      async function exportToBackend() {
        const movements = [];
        
        // Extract data from toothMovements Map
        toothMovements.forEach((movement) => {
          const current = movement.current;
          const hasAnyMovement =
            Math.abs(current.md) > 0.05 ||
            Math.abs(current.bl) > 0.05 ||
            Math.abs(current.ie) > 0.05 ||
            Math.abs(current.tip) > 0.5 ||
            Math.abs(current.torque) > 0.5 ||
            Math.abs(current.rotation) > 0.5;
          
          if (hasAnyMovement) {
            movements.push({
              toothNumber: getToothNumber(movement.object),
              toothName: getToothName(movement.object),
              mesialDistal: current.md.toFixed(1),
              buccalLingual: current.bl.toFixed(1),
              intrusionExtrusion: current.ie.toFixed(1),
              tip: current.tip.toFixed(1),
              torque: current.torque.toFixed(1),
              rotation: current.rotation.toFixed(1)
            });
          }
        });
        
        if (movements.length === 0) {
          alert('No tooth movements to save');
          return;
        }
        
        try {
          const response = await fetch('/api/tooth-movements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              planId: planId,
              movements: movements,
              notes: 'Saved from 3D viewer'
            })
          });
          
          const data = await response.json();
          
          if (response.ok) {
            alert(\`Successfully saved \${data.count} tooth movements!\`);
          } else {
            alert('Failed to save: ' + (data.error || 'Unknown error'));
          }
        } catch (error) {
          console.error('Error saving to backend:', error);
          alert('Failed to save tooth movements');
        }
      }
      
      function getToothNumber(obj) {
        if (!obj || !obj.name) return 'unknown';
        const match = obj.name.match(/(?:tooth[\\s_-]*)?#?([1-9]|[12][0-9]|3[0-2])\\b/i);
        return match ? match[1] : 'unknown';
      }
      
      function getToothName(obj) {
        return obj?.name || 'Unknown Tooth';
      }
    </script>
</body>
</html>
  `;
}
