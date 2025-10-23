
'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, Download, Key } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import QRCode from 'qrcode';

interface OneTimeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientEmail: string;
  apiPath?: string; // 'doctor' or 'admin'
}

interface Credentials {
  username: string;
  password: string;
  fullName: string;
  expiresAt: string;
  validityHours: number;
}

export function OneTimeLoginModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  patientEmail,
  apiPath = 'doctor',
}: OneTimeLoginModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [validityHours, setValidityHours] = useState(24);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateCredentials = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/${apiPath}/patients/${patientId}/one-time-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validityHours }),
      });

      if (response.ok) {
        const data = await response.json();
        setCredentials(data.credentials);
      }
    } catch (error) {
      console.error('Error generating credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate QR code when credentials are available
  useEffect(() => {
    if (credentials) {
      // Create URL with query parameters for auto-login
      const loginUrl = `https://tracker.seamlesssmile.com/auth/signin?username=${encodeURIComponent(credentials.username)}&password=${encodeURIComponent(credentials.password)}`;

      QRCode.toDataURL(loginUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#3F0F22',
          light: '#FFFFFF',
        },
      })
        .then((url) => {
          setQrDataUrl(url);
        })
        .catch((err) => {
          console.error('Error generating QR code:', err);
        });
    }
  }, [credentials]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAllCredentials = () => {
    if (!credentials) return;
    
    const text = `Login Credentials for ${credentials.fullName || patientName}

Login at: https://tracker.seamlesssmile.com
    
Username: ${credentials.username}
Password: ${credentials.password}
Valid until: ${new Date(credentials.expiresAt).toLocaleString()}

Note: This password is valid for ${credentials.validityHours} hours.`;
    
    navigator.clipboard.writeText(text);
    setCopiedField('all');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadCredentials = () => {
    if (!credentials) return;

    const content = `Login Credentials for ${credentials.fullName || patientName}

Login at: https://tracker.seamlesssmile.com
    
Username: ${credentials.username}
Password: ${credentials.password}
Valid until: ${new Date(credentials.expiresAt).toLocaleString()}

Note: This password is valid for ${credentials.validityHours} hours.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `login-credentials-${patientEmail}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setCredentials(null);
    setCopiedField(null);
    setQrDataUrl('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5" style={{ color: '#AF4B6C' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#3F0F22' }}>
              {t.invitations.oneTimeLogin}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!credentials ? (
            <>
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  {t.invitations.generateOneTime} for <strong>{patientName}</strong>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  {t.invitations.oneTimeNote}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                  {t.invitations.validFor}
                </label>
                <select
                  value={validityHours}
                  onChange={(e) => setValidityHours(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                >
                  <option value={6}>6 {t.invitations.hours}</option>
                  <option value={12}>12 {t.invitations.hours}</option>
                  <option value={24}>24 {t.invitations.hours}</option>
                  <option value={48}>48 {t.invitations.hours}</option>
                  <option value={72}>72 {t.invitations.hours}</option>
                </select>
              </div>

              <button
                onClick={generateCredentials}
                disabled={loading}
                className="w-full py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#AF4B6C' }}
              >
                {loading ? t.invitations.generating : t.invitations.generateOneTime}
              </button>
            </>
          ) : (
            <>
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: '#FFF5F8' }}
              >
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#3F0F22' }}>
                  {t.invitations.oneTimeLoginGenerated}
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  {t.invitations.shareTheseCreds}
                </p>

                {/* QR Code Display */}
                {qrDataUrl && (
                  <div className="mb-4 flex justify-center">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <img 
                        src={qrDataUrl} 
                        alt="QR Code for login credentials" 
                        className="w-48 h-48"
                      />
                      <p className="text-xs text-center text-gray-500 mt-2">
                        {t.invitations.qrCode}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">
                      Login URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value="https://tracker.seamlesssmile.com"
                        readOnly
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard('https://tracker.seamlesssmile.com', 'url')}
                        className="p-2 hover:bg-white rounded-lg transition-all"
                      >
                        {copiedField === 'url' ? (
                          <Check className="w-4 h-4" style={{ color: '#10B981' }} />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">
                      {t.invitations.username}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={credentials.username}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(credentials.username, 'username')}
                        className="p-2 hover:bg-white rounded-lg transition-all"
                      >
                        {copiedField === 'username' ? (
                          <Check className="w-4 h-4" style={{ color: '#10B981' }} />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">
                      {t.invitations.password}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={credentials.password}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(credentials.password, 'password')}
                        className="p-2 hover:bg-white rounded-lg transition-all"
                      >
                        {copiedField === 'password' ? (
                          <Check className="w-4 h-4" style={{ color: '#10B981' }} />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                    {t.invitations.validFor}: {credentials.validityHours} {t.invitations.hours}
                    <br />
                    Expires: {new Date(credentials.expiresAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={copyAllCredentials}
                  className="flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all hover:bg-gray-50 flex items-center justify-center gap-2"
                  style={{ borderColor: '#AF4B6C', color: '#AF4B6C' }}
                >
                  {copiedField === 'all' ? (
                    <>
                      <Check className="w-4 h-4" />
                      {t.invitations.copied}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      {t.invitations.copyAll}
                    </>
                  )}
                </button>
                <button
                  onClick={downloadCredentials}
                  className="flex-1 py-3 px-4 rounded-lg text-white font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#AF4B6C' }}
                >
                  <Download className="w-4 h-4" />
                  {t.invitations.downloadCreds}
                </button>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 transition-all"
              >
                {t.common.close || 'Close'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
