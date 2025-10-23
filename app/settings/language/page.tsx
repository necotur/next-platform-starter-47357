

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';

const languages = [
  { code: 'en' as const, name: 'English', nativeName: 'English' },
  { code: 'ar' as const, name: 'Arabic', nativeName: 'العربية' },
  { code: 'tr' as const, name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'ku' as const, name: 'Kurdish', nativeName: 'Kurdî' },
];

export default function LanguageSettingsPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(language);

  const handleSave = () => {
    setLanguage(selectedLanguage);
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-[#3F0F22] text-white px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">{t.settings.languageSettings}</h1>
          </div>
        </div>
      </div>

      {/* Language Selection */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-900">{t.settings.selectLanguage}</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="text-left">
                  <div className="font-medium text-gray-900">{lang.nativeName}</div>
                  <div className="text-sm text-gray-500">{lang.name}</div>
                </div>
                {selectedLanguage === lang.code && (
                  <Check className="w-5 h-5 text-[#AF4B6C]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6">
          <Button
            onClick={handleSave}
            disabled={selectedLanguage === language}
            className="w-full bg-[#AF4B6C] hover:bg-[#8f3d58] text-white"
          >
            {t.common.save}
          </Button>
        </div>
      </div>
    </div>
  );
}
