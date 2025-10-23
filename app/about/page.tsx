

'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Shield, Users, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import Image from 'next/image';

export default function AboutPage() {
  const router = useRouter();
  const { language } = useLanguage();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" style={{ color: '#3F0F22' }} />
            </button>
            <h1 className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? 'حول التطبيق' : 'About App'}
            </h1>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Logo Section */}
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="relative w-48 h-24 mx-auto mb-4">
            <Image
              src="/logo1v.png"
              alt="Seamless Smile"
              fill
              className="object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#3F0F22' }}>
            {language === 'ar' ? 'تتبع الابتسامة السلس' : 'Seamless Smile Tracker'}
          </h2>
          <p className="text-gray-600">
            {language === 'ar' ? 'الإصدار 1.0.0' : 'Version 1.0.0'}
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold mb-4" style={{ color: '#3F0F22' }}>
            {language === 'ar' ? 'مهمتنا' : 'Our Mission'}
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {language === 'ar' 
              ? 'في Seamless Smile، نهدف إلى جعل رحلتك مع التقويم الشفاف سلسة وممتعة قدر الإمكان. نحن نؤمن بأن كل ابتسامة تستحق أفضل رعاية، ونسعى لتمكين المرضى والأطباء بالأدوات التي يحتاجونها لتحقيق نتائج مذهلة.'
              : 'At Seamless Smile, we aim to make your clear aligner journey as smooth and enjoyable as possible. We believe that every smile deserves the best care, and we strive to empower both patients and doctors with the tools they need to achieve amazing results.'
            }
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: '#FFF5F8' }}
            >
              <Heart className="w-6 h-6" style={{ color: '#AF4B6C' }} />
            </div>
            <h4 className="text-lg font-bold mb-2" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? 'صُنع بحب' : 'Made with Love'}
            </h4>
            <p className="text-gray-600 text-sm">
              {language === 'ar' 
                ? 'كل ميزة مصممة بعناية لتحسين تجربة علاجك.'
                : 'Every feature is carefully designed to improve your treatment experience.'
              }
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: '#FFF5F8' }}
            >
              <Shield className="w-6 h-6" style={{ color: '#AF4B6C' }} />
            </div>
            <h4 className="text-lg font-bold mb-2" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? 'آمن ومحمي' : 'Secure & Private'}
            </h4>
            <p className="text-gray-600 text-sm">
              {language === 'ar' 
                ? 'بياناتك مشفرة ومحمية باستخدام أحدث تقنيات الأمان.'
                : 'Your data is encrypted and protected with the latest security technologies.'
              }
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: '#FFF5F8' }}
            >
              <Users className="w-6 h-6" style={{ color: '#AF4B6C' }} />
            </div>
            <h4 className="text-lg font-bold mb-2" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? 'التواصل السهل' : 'Easy Communication'}
            </h4>
            <p className="text-gray-600 text-sm">
              {language === 'ar' 
                ? 'ابق على اتصال مع طبيبك من خلال الدردشة المدمجة.'
                : 'Stay connected with your doctor through integrated chat.'
              }
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: '#FFF5F8' }}
            >
              <Zap className="w-6 h-6" style={{ color: '#AF4B6C' }} />
            </div>
            <h4 className="text-lg font-bold mb-2" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? 'سريع وسهل' : 'Fast & Easy'}
            </h4>
            <p className="text-gray-600 text-sm">
              {language === 'ar' 
                ? 'واجهة بسيطة تجعل تتبع علاجك أمراً سهلاً.'
                : 'Simple interface makes tracking your treatment a breeze.'
              }
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold mb-4" style={{ color: '#3F0F22' }}>
            {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
          </h3>
          <p className="text-gray-700 mb-4">
            {language === 'ar' 
              ? 'هل لديك أسئلة أو اقتراحات؟ نحب أن نسمع منك!'
              : 'Have questions or suggestions? We\'d love to hear from you!'
            }
          </p>
          <a 
            href="mailto:support@seamlesssmile.com"
            className="text-decoration-none inline-block px-6 py-3 rounded-lg font-medium transition-all"
            style={{ 
              backgroundColor: '#AF4B6C',
              color: 'white'
            }}
          >
            support@seamlesssmile.com
          </a>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-6">
          <p>© 2025 Seamless Smile Tracker</p>
          <p className="mt-1">
            {language === 'ar' ? 'صُنع بـ' : 'Made with'} ❤️ {language === 'ar' ? 'بواسطة سيمليس' : 'by Seamless'}
          </p>
        </div>
      </main>
    </div>
  );
}


