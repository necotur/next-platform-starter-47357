

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { QrCode, Link as LinkIcon, Hash, Copy, Check, Calendar, Loader2, Download, ArrowLeft } from 'lucide-react';
import QRCode from 'qrcode';
import { formatDateWithSolarMonth } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';
import { BottomNav } from '@/components/bottom-nav';

interface Invitation {
  id: string;
  code: string;
  type: string;
  expiresAt: string | null;
  inviteLink: string;
}

export default function GenerateInvitationCodePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { language } = useLanguage();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'link' | 'code' | 'qr'>('code');
  const [expiresIn, setExpiresIn] = useState<number | null>(7);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const user = session?.user as any;
      if (user?.role !== 'doctor') {
        router.push('/dashboard');
      } else {
        fetchInvitations();
      }
    }
  }, [status, session, router]);

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/doctor/invitations');
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const generateInvitation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/doctor/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteType: selectedType,
          expiresIn,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newInvitation = data.invitation;
        
        // Generate QR code if type is 'qr'
        if (selectedType === 'qr') {
          const qrDataUrl = await QRCode.toDataURL(newInvitation.inviteLink, {
            width: 300,
            margin: 2,
          });
          setQrCodeDataUrl(qrDataUrl);
        }
        
        await fetchInvitations();
      }
    } catch (error) {
      console.error('Error generating invitation:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = 'doctor-invitation-qr.png';
    link.href = qrCodeDataUrl;
    link.click();
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#AF4B6C' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 safe-top">
        <div className="max-w-screen-xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/more')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <ArrowLeft className="w-6 h-6" style={{ color: '#3F0F22' }} />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? 'إنشاء رمز دعوة' : 'Generate Invitation Code'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {language === 'ar' ? 'إنشاء رموز دعوة للمرضى الجدد' : 'Create invitation codes for new patients'}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Generate New Invitation */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#3F0F22' }}>
            {language === 'ar' ? 'إنشاء دعوة جديدة' : 'Create New Invitation'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                {language === 'ar' ? 'نوع الدعوة' : 'Invitation Type'}
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedType('link')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedType === 'link' ? 'border-opacity-100' : 'border-gray-200'
                  }`}
                  style={selectedType === 'link' ? { borderColor: '#AF4B6C' } : {}}
                >
                  <LinkIcon className="w-6 h-6 mx-auto mb-2" style={{ color: '#AF4B6C' }} />
                  <p className="text-sm font-medium">{language === 'ar' ? 'رابط' : 'Link'}</p>
                </button>
                <button
                  onClick={() => setSelectedType('code')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedType === 'code' ? 'border-opacity-100' : 'border-gray-200'
                  }`}
                  style={selectedType === 'code' ? { borderColor: '#AF4B6C' } : {}}
                >
                  <Hash className="w-6 h-6 mx-auto mb-2" style={{ color: '#AF4B6C' }} />
                  <p className="text-sm font-medium">{language === 'ar' ? 'رمز' : 'Code'}</p>
                </button>
                <button
                  onClick={() => setSelectedType('qr')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedType === 'qr' ? 'border-opacity-100' : 'border-gray-200'
                  }`}
                  style={selectedType === 'qr' ? { borderColor: '#AF4B6C' } : {}}
                >
                  <QrCode className="w-6 h-6 mx-auto mb-2" style={{ color: '#AF4B6C' }} />
                  <p className="text-sm font-medium">{language === 'ar' ? 'رمز QR' : 'QR Code'}</p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                {language === 'ar' ? 'انتهاء الصلاحية' : 'Expiration'}
              </label>
              <select
                value={expiresIn || ''}
                onChange={(e) => setExpiresIn(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              >
                <option value="1">{language === 'ar' ? '1 يوم' : '1 day'}</option>
                <option value="7">{language === 'ar' ? '7 أيام' : '7 days'}</option>
                <option value="30">{language === 'ar' ? '30 يوم' : '30 days'}</option>
                <option value="">{language === 'ar' ? 'لا تنتهي صلاحيته' : 'Never expires'}</option>
              </select>
            </div>

            <button
              onClick={generateInvitation}
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#AF4B6C' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {language === 'ar' ? 'جاري الإنشاء...' : 'Generating...'}
                </>
              ) : (
                language === 'ar' ? 'إنشاء دعوة' : 'Generate Invitation'
              )}
            </button>
          </div>

          {qrCodeDataUrl && selectedType === 'qr' && (
            <div className="mt-6 p-6 border-2 rounded-lg text-center" style={{ borderColor: '#AF4B6C' }}>
              <img src={qrCodeDataUrl} alt="QR Code" className="mx-auto mb-4" />
              <button
                onClick={downloadQRCode}
                className="px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 mx-auto hover:opacity-90 transition-all"
                style={{ backgroundColor: '#AF4B6C' }}
              >
                <Download className="w-4 h-4" />
                {language === 'ar' ? 'تنزيل رمز QR' : 'Download QR Code'}
              </button>
            </div>
          )}
        </div>

        {/* Recent Invitations */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#3F0F22' }}>
            {language === 'ar' ? 'الدعوات الأخيرة' : 'Recent Invitations'}
          </h2>

          {invitations.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              {language === 'ar' ? 'لم يتم إنشاء دعوات بعد' : 'No invitations generated yet'}
            </p>
          ) : (
            <div className="space-y-3">
              {invitations.slice(0, 10).map((invitation) => (
                <div
                  key={invitation.id}
                  className="p-4 border border-gray-200 rounded-lg flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {invitation.type === 'link' && <LinkIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                      {invitation.type === 'code' && <Hash className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                      {invitation.type === 'qr' && <QrCode className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                      <span className="font-mono font-semibold truncate selectable-text">{invitation.code}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {invitation.expiresAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {language === 'ar' ? 'ينتهي:' : 'Expires:'} {formatDateWithSolarMonth(invitation.expiresAt, language)}
                          </span>
                        </div>
                      )}
                      {!invitation.expiresAt && (
                        <span>{language === 'ar' ? 'لا انتهاء للصلاحية' : 'No expiration'}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(invitation.type === 'link' ? invitation.inviteLink : invitation.code, invitation.code)}
                    className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all hover:bg-gray-100 flex-shrink-0 ml-2"
                  >
                    {copiedCode === invitation.code ? (
                      <>
                        <Check className="w-4 h-4" style={{ color: '#10B981' }} />
                        <span className="hidden sm:inline">{language === 'ar' ? 'تم النسخ' : 'Copied'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="hidden sm:inline">{language === 'ar' ? 'نسخ' : 'Copy'}</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

