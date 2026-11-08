import React, { useState } from 'react';
import { Lead, LeadStatus, PipelineStage, User } from '../types/crm';
import { Phone, X, Calendar, Clock, Check, MessageSquare, AlertCircle } from 'lucide-react';

interface QuickCallModalProps {
  lead: Lead;
  currentUser: User;
  onClose: () => void;
  onSaveCall: (data: {
    status: LeadStatus;
    stage: PipelineStage;
    outcome: string;
    notes: string;
    followUpDate?: string;
  }) => void;
}

export const QuickCallModal: React.FC<QuickCallModalProps> = ({
  lead,
  currentUser,
  onClose,
  onSaveCall,
}) => {
  const [outcome, setOutcome] = useState('رد ومهتم بنظام Optics OS');
  const [status, setStatus] = useState<LeadStatus>('interested');
  const [stage, setStage] = useState<PipelineStage>('qualified');
  const [notes, setNotes] = useState('');
  const [hasFollowUp, setHasFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16)
  );

  const outcomesPreset = [
    {
      id: 'interested',
      label: '📞 رد ومهتم (🔴 أحمر)',
      status: 'interested' as LeadStatus,
      stage: 'qualified' as PipelineStage,
      defaultOutcome: 'رد ومهتم بنظام Optics OS وطلب تفاصيل',
      color: 'bg-rose-50 text-rose-700 border-rose-300',
    },
    {
      id: 'demo',
      label: '💻 حجز موعد ديمو تجريبي',
      status: 'interested' as LeadStatus,
      stage: 'demo_scheduled' as PipelineStage,
      defaultOutcome: 'تم حجز موعد ديمو تجريبي لشاشات النظام',
      color: 'bg-blue-50 text-blue-700 border-blue-300',
      autoFollowUp: true,
    },
    {
      id: 'callback',
      label: '⏳ طلب التواصل لاحقاً',
      status: 'interested' as LeadStatus,
      stage: 'contacted' as PipelineStage,
      defaultOutcome: 'طلب إعادة الاتصال في وقت لاحق',
      color: 'bg-purple-50 text-purple-700 border-purple-300',
      autoFollowUp: true,
    },
    {
      id: 'no_answer',
      label: '📴 لم يرد / مغلق (🟤 بني)',
      status: 'no_answer' as LeadStatus,
      stage: 'contacted' as PipelineStage,
      defaultOutcome: 'تم الاتصال ولم يتم الرد',
      color: 'bg-amber-50 text-amber-800 border-amber-300',
    },
    {
      id: 'not_interested',
      label: '❌ غير مهتم حالياً (🟡 أصفر)',
      status: 'not_interested' as LeadStatus,
      stage: 'lost' as PipelineStage,
      defaultOutcome: 'أبدى عدم اهتمام أو اعتذر في الوقت الحالي',
      color: 'bg-yellow-50 text-yellow-800 border-yellow-300',
    },
  ];

  const quickNotes = [
    'مهتم بربط كشوفات النظر ومطابقة الفروع',
    'طلب إرسال البروفايل وعرض الأسعار على الواتساب',
    'المدير غير متواجد، إعادة الاتصال مساءً',
    'يستخدم دفاتر ومهتم ببرنامج كاشير سهل للشنابر والعدسات',
  ];

  const handleSelectPreset = (p: typeof outcomesPreset[0]) => {
    setStatus(p.status);
    setStage(p.stage);
    setOutcome(p.defaultOutcome);
    if (p.autoFollowUp) {
      setHasFollowUp(true);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCall({
      status,
      stage,
      outcome,
      notes: notes || outcome,
      followUpDate: hasFollowUp ? new Date(followUpDate).toISOString() : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold">تسجيل مكالمة سريعة</h3>
              <p className="text-[11px] text-slate-300">{lead.shopName || lead.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Quick Outcome Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              نتيجة المكالمة (تحديث فوري للحالة ولون العميل):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {outcomesPreset.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`p-2 rounded-xl border text-xs font-bold text-right flex items-center justify-between transition-all ${
                    status === p.status && outcome === p.defaultOutcome
                      ? 'ring-2 ring-blue-600 bg-white shadow-xs'
                      : p.color
                  }`}
                >
                  <span>{p.label}</span>
                  {status === p.status && outcome === p.defaultOutcome && (
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quick note inserts */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              ملاحظات سريعة جاهزة:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickNotes.map((qn, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setNotes(prev => (prev ? `${prev} - ${qn}` : qn))}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md font-medium transition-colors"
                >
                  + {qn}
                </button>
              ))}
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              تفاصيل المكالمة والملاحظات:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="اكتب ملاحظاتك عن احتياجات المحل، الشنابر، الفروع، أو رد العميل..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Next Follow-up with Alarm */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-blue-900">
                <input
                  type="checkbox"
                  checked={hasFollowUp}
                  onChange={e => setHasFollowUp(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>تحديد موعد متابعة قادم مع تفعيل جرس التنبيه (Alarm)</span>
              </label>
            </div>

            {hasFollowUp && (
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-blue-800 mb-1">
                  تاريخ ووقت المتابعة (بتوقيت القاهرة):
                </label>
                <input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  className="w-full p-2 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold text-slate-800"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              حفظ وتحديث العميل
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
