

'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

export default function PrivacyPolicyPage() {
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
              {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </h1>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-6 md:p-8 space-y-6">
          <div className="text-sm text-gray-600 mb-4">
            {language === 'ar' ? 'آخر تحديث: 17 أكتوبر 2025' : 'Last Updated: October 17, 2025'}
          </div>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '1. المقدمة' : '1. Introduction'}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {language === 'ar' 
                ? 'مرحباً بك في Seamless Smile Tracker. نحن ملتزمون بحماية خصوصيتك وضمان أمان معلوماتك الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية بياناتك.'
                : 'Welcome to Seamless Smile Tracker. We are committed to protecting your privacy and ensuring the security of your personal information. This policy explains how we collect, use, and protect your data.'
              }
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '2. المعلومات التي نجمعها' : '2. Information We Collect'}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              {language === 'ar' 
                ? 'نقوم بجمع الأنواع التالية من المعلومات:'
                : 'We collect the following types of information:'
              }
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
              <li>{language === 'ar' ? 'معلومات الحساب (الاسم، البريد الإلكتروني، اسم المستخدم)' : 'Account information (name, email, username)'}</li>
              <li>{language === 'ar' ? 'معلومات خطة العلاج (عدد المصففات، تواريخ التغيير)' : 'Treatment plan information (aligner numbers, change dates)'}</li>
              <li>{language === 'ar' ? 'صور التقدم (صور للأسنان لتتبع العلاج)' : 'Progress photos (dental photos for treatment tracking)'}</li>
              <li>{language === 'ar' ? 'سجلات الوقت المرتدي للمصففات' : 'Wear time logs'}</li>
              <li>{language === 'ar' ? 'سجلات الأعراض' : 'Symptom logs'}</li>
              <li>{language === 'ar' ? 'رسائل الدردشة مع طبيبك' : 'Chat messages with your doctor'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '3. كيفية استخدام معلوماتك' : '3. How We Use Your Information'}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              {language === 'ar' 
                ? 'نستخدم معلوماتك من أجل:'
                : 'We use your information to:'
              }
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
              <li>{language === 'ar' ? 'توفير وتحسين خدماتنا' : 'Provide and improve our services'}</li>
              <li>{language === 'ar' ? 'تتبع تقدم علاجك' : 'Track your treatment progress'}</li>
              <li>{language === 'ar' ? 'تسهيل التواصل مع طبيبك' : 'Facilitate communication with your doctor'}</li>
              <li>{language === 'ar' ? 'إرسال تذكيرات مهمة للعلاج' : 'Send important treatment reminders'}</li>
              <li>{language === 'ar' ? 'إنشاء رؤى وتقارير' : 'Generate insights and reports'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '4. مشاركة البيانات' : '4. Data Sharing'}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {language === 'ar' 
                ? 'لا نبيع أو نشارك معلوماتك الشخصية مع أطراف ثالثة باستثناء:'
                : 'We do not sell or share your personal information with third parties except:'
              }
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4 mt-2">
              <li>{language === 'ar' ? 'طبيبك (للمعلومات المتعلقة بالعلاج فقط)' : 'Your doctor (for treatment-related information only)'}</li>
              <li>{language === 'ar' ? 'مقدمي الخدمات الذين يساعدوننا في تشغيل التطبيق' : 'Service providers who help us operate the app'}</li>
              <li>{language === 'ar' ? 'عند الحاجة للامتثال للقانون' : 'When required by law'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '5. أمان البيانات' : '5. Data Security'}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {language === 'ar' 
                ? 'نستخدم تشفير من الدرجة الصناعية وإجراءات أمان قوية لحماية بياناتك. جميع البيانات مخزنة بشكل آمن ومشفرة أثناء النقل والتخزين.'
                : 'We use industry-standard encryption and robust security measures to protect your data. All data is stored securely and encrypted both in transit and at rest.'
              }
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '6. حقوقك' : '6. Your Rights'}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              {language === 'ar' 
                ? 'لديك الحق في:'
                : 'You have the right to:'
              }
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
              <li>{language === 'ar' ? 'الوصول إلى بياناتك الشخصية' : 'Access your personal data'}</li>
              <li>{language === 'ar' ? 'تصحيح المعلومات غير الدقيقة' : 'Correct inaccurate information'}</li>
              <li>{language === 'ar' ? 'طلب حذف حسابك وبياناتك' : 'Request deletion of your account and data'}</li>
              <li>{language === 'ar' ? 'تصدير بياناتك' : 'Export your data'}</li>
              <li>{language === 'ar' ? 'إلغاء الاشتراك في الإشعارات' : 'Opt-out of notifications'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '7. الاحتفاظ بالبيانات' : '7. Data Retention'}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {language === 'ar' 
                ? 'نحتفظ ببياناتك طالما كان حسابك نشطاً أو حسب الحاجة لتوفير الخدمات. يمكنك طلب حذف بياناتك في أي وقت من خلال إعدادات الحساب أو الاتصال بنا.'
                : 'We retain your data for as long as your account is active or as needed to provide services. You may request deletion of your data at any time through account settings or by contacting us.'
              }
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '8. ملفات تعريف الارتباط' : '8. Cookies'}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {language === 'ar' 
                ? 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك وحفظ تفضيلاتك. يمكنك التحكم في استخدام ملفات تعريف الارتباط من خلال إعدادات المتصفح الخاص بك.'
                : 'We use cookies to enhance your experience and remember your preferences. You can control cookie usage through your browser settings.'
              }
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '9. خصوصية الأطفال' : '9. Children\'s Privacy'}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {language === 'ar' 
                ? 'خدمتنا غير مخصصة للأطفال دون سن 13 عاماً. نحن لا نجمع عن قصد معلومات شخصية من الأطفال دون سن 13 عاماً.'
                : 'Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.'
              }
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '10. التغييرات على هذه السياسة' : '10. Changes to This Policy'}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {language === 'ar' 
                ? 'قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنقوم بإعلامك بأي تغييرات من خلال نشر السياسة الجديدة على هذه الصفحة وتحديث تاريخ "آخر تحديث".'
                : 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.'
              }
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '11. اتصل بنا' : '11. Contact Us'}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {language === 'ar' 
                ? 'إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بنا:'
                : 'If you have any questions about this Privacy Policy, please contact us:'
              }
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">
                <strong>{language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</strong> privacy@seamlesssmile.com
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}


