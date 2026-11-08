import React, { useState } from 'react';
import { Bot, Sparkles, Send, Copy, Check, MessageSquare, ShieldAlert, Award } from 'lucide-react';

interface AiAssistantProps {
  onClose?: () => void;
}

export const AiAssistantModal: React.FC<AiAssistantProps> = () => {
  const [selectedTopic, setSelectedTopic] = useState<'objections' | 'pitch' | 'whatsapp' | 'roi'>('objections');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const objectionStrategies = [
    {
      id: 'obj-price',
      title: 'معالجة اعتراض: "سعر البرنامج غالي علينا"',
      question: 'صاحب المحل شايف إن سعر النظام مرتفع مقارنة بميزانيته الحالية.',
      response: `يا دكتور، تكلفة النظام مش مصروف، دي استثمار بيرجعلك في أول شهرين!
فكر معايا: كمية أخطاء أسعار العدسات المخصصة، أو عدسة تتقص غلط في الورشة ومحدش يحاسب عليها، أو كشف نظر يضيع وعميل يرجع يشتكي.. كل خطأ من دول بيكلفك من 500 لـ 2000 جنيه!
نظام Optics OS بيمنع أي تسريب مالي، وبيوفرلك وقت الجرد من أسبوع كامل لساعتين بس، غير إنه بيجيبلك عملاء قدامى برسائل تذكير تلقائية لمواعيد فحص النظر السنوية.`,
    },
    {
      id: 'obj-manual',
      title: 'معالجة اعتراض: "إحنا شغالين بالدفاتر الورقية ومرتاحين"',
      question: 'المحل شغال من سنين بدفاتر كشوفات يدوية ورافض التغيير.',
      response: `كل الاحترام لخبرتكم يا فندم، والدفاتر هي اللي بنتكوا لحد النهاردة.. بس السوق بيتغير بسرعة والعميل بقى متوقع فاتورة إلكترونية وباركود على الشنبر ورسالة sms لما نظارته تجهز!
لو حبيت تعرف دلوقتي حالا رصيدك من شنابر ماركة معينة أو العدسات البلو كات عندك منها كام حبة، هتحتاج تقلب في كام دفتر؟
مع Optics OS، بضغطة زرار واحدة ومن موبايلك وأنت في البيت هتعرف كل فرع باع بكام وعندك نواقص إيه بالظبط بدون أي مجهود.`,
    },
    {
      id: 'obj-migration',
      title: 'معالجة اعتراض: "عندي برنامج قديم وخايف من نقل البيانات"',
      question: 'المحل عنده داتا في برنامج ديسكتوب متهالك وخايف يعطل شغله.',
      response: `دي أهم نقطة عندنا! إحنا في شركة Zntra فريقنا الفني بينقلك كل داتا العملاء وكشوفات النظر وأرصدة الشنابر من برنامجك القديم أو ملفات الإكسيل في أقل من 24 ساعة بدون ما توقف شغلك ساعة واحدة، ومع تدريب كامل لموظفيك حتى الإتقان.`,
    }
  ];

  const pitchScripts = [
    {
      id: 'pitch-cold-call',
      title: 'سكربت المكالمة الهاتفية الافتتاحية الأولى (Cold Call)',
      text: `مساء الخير يا فندم، معاك [اسمك] من شركة Zntra المتخصصة في أنظمة إدارة محلات ومراكز البصريات في مصر.
بكلم حضرتك بخصوص نظام Optics OS، لأننا بنساعد محلات النظارات في حل أهم 3 مشاكل بتضيع وقتهم وفلوسهم:
1. مزامنة ومطابقة الفروع وأرصدة الشنابر بدون تلاعب.
2. حساب أسعار العدسات وكشوفات النظر المعقدة تلقائياً.
3. إرسال إشعار فوري للعميل على الواتساب أول ما النظارة تجهز من الورشة.
هل يناسب حضرتك نحدد موعد تجربة مجانية ديمو مدته 10 دقائق نعرضلك فيه الشاشات عملياً؟`,
    },
    {
      id: 'pitch-chain',
      title: 'عرض مخصص لسلاسل النظارات المتعددة الفروع (Chains)',
      text: `أهلاً بحضرتك يا فندم، كصاحب سلسلة محلات نظارات، أكبر تحدي هو معرفة المبيعات اللحظية لكل فرع، ومتابعة حركة الشنابر والعدسات بين الفروع بدون عجز أو نقص.
نظام Optics OS بيقدملك:
• لوحة تحكم مركزية (Dashboard) على موبايلك لحظة بلحظة.
• تحويلات مخزنية بنظام الباركود بين الفروع ومعمل التقطيع المركزي.
• صلاحيات صارمة لكل كاشير لمنع التلاعب في الخصومات أو التعديل بعد الطباعة.`,
    }
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold mb-2">
            <Bot className="w-3.5 h-3.5" />
            <span>Zntra Sales AI Engine</span>
          </div>
          <h2 className="text-xl font-black text-white">المساعد الذكي لمبيعات Optics OS</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            استراتيجيات إقناع أصحاب محلات النظارات، الرد على الاعتراضات، وتوليد نصوص تسويقية حصرية للسوق المصري
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 space-x-reverse border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setSelectedTopic('objections')}
          className={`px-4 py-2 rounded-xl transition-all ${
            selectedTopic === 'objections'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          معالجة الاعتراضات الشائعة (Objection Handling)
        </button>
        <button
          onClick={() => setSelectedTopic('pitch')}
          className={`px-4 py-2 rounded-xl transition-all ${
            selectedTopic === 'pitch'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          سكربتات المكالمات الافتتاحية (Sales Scripts)
        </button>
      </div>

      {/* Tab 1: Objections */}
      {selectedTopic === 'objections' && (
        <div className="space-y-4">
          {objectionStrategies.map(item => (
            <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">{item.title}</h3>
                </div>
                <button
                  onClick={() => handleCopy(item.id, item.response)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === item.id ? 'تم النسخ' : 'نسخ الرد'}</span>
                </button>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
                <strong>الموقف: </strong> {item.question}
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                {item.response}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Pitches */}
      {selectedTopic === 'pitch' && (
        <div className="space-y-4">
          {pitchScripts.map(item => (
            <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">{item.title}</h3>
                </div>
                <button
                  onClick={() => handleCopy(item.id, item.text)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === item.id ? 'تم النسخ' : 'نسخ النص'}</span>
                </button>
              </div>

              <div className="p-4 bg-blue-50/40 border border-blue-200 rounded-xl text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                {item.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
