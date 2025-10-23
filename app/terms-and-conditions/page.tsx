

'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

export default function TermsAndConditionsPage() {
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
              {language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
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
              {language === 'ar' ? '1. قبول الشروط' : '1. Acceptance of Terms'}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {language === 'ar' 
                ? 'باستخدام تطبيق Seamless Smile Tracker، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام التطبيق.'
                : 'By using the Seamless Smile Tracker app, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the app.'
              }
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '2. وصف الخدمة' : '2. Service Description'}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {language === 'ar' 
                ? 'Seamless Smile Tracker هو تطبيق لتتبع تقدم علاج التقويم الشفاف. يوفر التطبيق أدوات لتتبع الوقت المرتدي للمصففات، تسجيل الأعراض، التقاط الصور التقدمية، والتواصل مع طبيبك. التطبيق لا يحل محل المشورة أو التشخيص أو العلاج الطبي المهني.'
                : 'Seamless Smile Tracker is an app for tracking clear aligner treatment progress. The app provides tools for tracking wear time, logging symptoms, capturing progress photos, and communicating with your doctor. The app does not replace professional medical advice, diagnosis, or treatment.'
              }
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '3. حسابات المستخدمين' : '3. User Accounts'}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              {language === 'ar' 
                ? 'لاستخدام التطبيق، يجب عليك:'
                : 'To use the app, you must:'
              }
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
              <li>{language === 'ar' ? 'إنشاء حساب بمعلومات دقيقة' : 'Create an account with accurate information'}</li>
              <li>{language === 'ar' ? 'الحفاظ على سرية كلمة المرور الخاصة بك' : 'Maintain the confidentiality of your password'}</li>
              <li>{language === 'ar' ? 'إخطارنا على الفور بأي استخدام غير مصرح به' : 'Notify us immediately of any unauthorized use'}</li>
              <li>{language === 'ar' ? 'أن تكون 13 عاماً على الأقل أو لديك موافقة من ولي الأمر' : 'Be at least 13 years old or have parental consent'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '4. الاستخدام المقبول' : '4. Acceptable Use'}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              {language === 'ar' 
                ? 'أنت توافق على:'
                : 'You agree to:'
              }
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
              <li>{language === 'ar' ? 'استخدام التطبيق للأغراض المشروعة فقط' : 'Use the app for lawful purposes only'}</li>
              <li>{language === 'ar' ? 'عدم محاولة اختراق أو إساءة استخدام النظام' : 'Not attempt to hack or misuse the system'}</li>
              <li>{language === 'ar' ? 'عدم مشاركة محتوى غير قانوني أو ضار' : 'Not share illegal or harmful content'}</li>
              <li>{language === 'ar' ? 'احترام حقوق الخصوصية للمستخدمين الآخرين' : 'Respect the privacy rights of other users'}</li>
              <li>{language === 'ar' ? 'اتباع تعليمات طبيبك بخصوص علاجك' : 'Follow your doctor\'s instructions regarding your treatment'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '5. المحتوى الذي ينشئه المستخدم' : '5. User-Generated Content'}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {language === 'ar' 
                ? 'أنت تحتفظ بملكية المحتوى الذي تقوم بتحميله (الصور، السجلات، الرسائل). ومع ذلك، فإنك تمنحنا ترخيصاً محدوداً لاستخدام هذا المحتوى لتوفير الخدمة وتحسينها. لن نستخدم محتواك لأغراض أخرى دون موافقتك.'
                : 'You retain ownership of the content you upload (photos, logs, messages). However, you grant us a limited license to use this content to provide and improve the service. We will not use your content for other purposes without your consent.'
              }
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '6. إخلاء المسؤولية الطبية' : '6. Medical Disclaimer'}
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed font-medium">
                {language === 'ar' 
                  ? 'تحذير: هذا التطبيق ليس بديلاً عن المشورة الطبية المهنية. استشر دائماً طبيب الأسنان أو أخصائي تقويم الأسنان لأي مخاوف طبية. في حالة الطوارئ، اتصل بطبيبك أو خدمات الطوارئ على الفور.'
                  : 'Warning: This app is not a substitute for professional medical advice. Always consult your dentist or orthodontist for any medical concerns. In case of emergency, contact your doctor or emergency services immediately.'
                }
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '7. حدود المسؤولية' : '7. Limitation of Liability'}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {language === 'ar' 
                ? 'لن نكون مسؤولين عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية أو عقابية ناتجة عن استخدامك أو عدم قدرتك على استخدام التطبيق. مسؤوليتنا الكاملة محدودة بالمبلغ المدفوع لنا (إن وجد) خلال آخر 12 شهراً.'
                : 'We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the app. Our total liability is limited to the amount paid to us (if any) in the last 12 months.'
              }
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '8. الملكية الفكرية' : '8. Intellectual Property'}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {language === 'ar' 
                ? 'جميع حقوق الملكية الفكرية في التطبيق (بما في ذلك التصميم والشعار والكود) محفوظة. لا يجوز لك نسخ أو تعديل أو توزيع أو بيع أي جزء من التطبيق دون إذن كتابي مسبق منا.'
                : 'All intellectual property rights in the app (including design, logo, and code) are reserved. You may not copy, modify, distribute, or sell any part of the app without our prior written permission.'
              }
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '9. إنهاء الحساب' : '9. Account Termination'}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {language === 'ar' 
                ? 'نحتفظ بالحق في تعليق أو إنهاء حسابك في أي وقت إذا انتهكت هذه الشروط. يمكنك حذف حسابك في أي وقت من خلال إعدادات التطبيق.'
                : 'We reserve the right to suspend or terminate your account at any time if you violate these terms. You may delete your account at any time through the app settings.'
              }
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '10. التغييرات على الشروط' : '10. Changes to Terms'}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {language === 'ar' 
                ? 'قد نقوم بتحديث هذه الشروط من وقت لآخر. سنقوم بإعلامك بأي تغييرات مهمة من خلال التطبيق أو البريد الإلكتروني. استمرارك في استخدام التطبيق بعد التغييرات يعني قبولك للشروط الجديدة.'
                : 'We may update these terms from time to time. We will notify you of any significant changes through the app or email. Your continued use of the app after changes constitutes acceptance of the new terms.'
              }
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '11. القانون الحاكم' : '11. Governing Law'}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {language === 'ar' 
                ? 'تخضع هذه الشروط وتفسر وفقاً لقوانين الدولة التي تم تأسيس الشركة فيها، دون الإخلال بأحكام تنازع القوانين.'
                : 'These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the company is established, without regard to conflict of law provisions.'
              }
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? '12. اتصل بنا' : '12. Contact Us'}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {language === 'ar' 
                ? 'إذا كان لديك أي أسئلة حول هذه الشروط، يرجى الاتصال بنا:'
                : 'If you have any questions about these terms, please contact us:'
              }
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">
                <strong>{language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</strong> legal@seamlesssmile.com
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}


