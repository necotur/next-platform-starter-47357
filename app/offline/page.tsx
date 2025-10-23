
'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">📡</div>
        <h1 className="text-3xl font-bold mb-4" style={{ color: '#3F0F22' }}>
          You're Offline
        </h1>
        <p className="text-gray-600 mb-6">
          It looks like you've lost your internet connection. Some features may not be available until you're back online.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-lg text-white font-medium"
          style={{ backgroundColor: '#AF4B6C' }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
