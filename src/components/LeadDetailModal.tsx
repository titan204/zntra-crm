import React, { useState } from 'react';
import { InteractionLog, Lead, LeadStatus, PipelineStage, User } from '../types/crm';
import { calculateOpticsLeadScore, createWhatsAppLink, createTelLink, formatEGP } from '../utils/crmLogic';
import {
  X,
  Phone,
  MessageSquare,
  ExternalLink,
  MapPin,
  Clock,
  Sparkles,
  Layers,
  FileText,
  Send,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  DollarSign
} from 'lucide-react';

interface LeadDetailModalProps {
  lead: Lead;
  currentUser: User;
  interactions: InteractionLog[];
  onClose: () => void;
  onUpdateLead: (updated: Lead) => void;
  onAddInteraction: (log: Omit<InteractionLog, 'id' | 'timestamp'>) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  currentUser,
  interactions,
  onClose,
  onUpdateLead,
  onAddInteraction,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'quote' | 'timeline'>('overview');
  
  // Note form
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<InteractionLog['type']>('call');
  const [noteOutcome, setNoteOutcome] = useState('متابعة دورية');

  // Specs form state
  const [specs, setSpecs] = useState(lead.opticsSpecs || {
    branchesCount: 1,
    cashiersCount: 1,
    pcsCount: 1,
    currentSystem: 'دفتري يدوي',
    hasLab: false,
    hasOptometrist: false,
    dailyPrescriptionsAvg: 15,
    interestLevel: 'متوسط',
    painPoints: ['عدم دقة قياسات النظر وحساب أسعار العدسات المخصصة']
  });

  // Quotation state
  const [quotePlan, setQuotePlan] = useState<'Basic' | 'Pro' | 'Enterprise'>('Pro');
  const [quoteDiscount, setQuoteDiscount] = useState(10);
  const [includePrinter, setIncludePrinter] = useState(true);
  const [includeScanner, setIncludeScanner] = useState(true);

  const basePrice = quotePlan === 'Basic' ? 8000 : quotePlan === 'Pro' ? 16000 : 28000;
  const hardwarePrice = (includePrinter ? 3500 : 0) + (includeScanner ? 1500 : 0);
  const subtotal = basePrice + hardwarePrice;
  const discountAmount = Math.round((subtotal * quoteDiscount) / 100);
  const finalQuotePrice = subtotal - discountAmount;

  const scoreResult = calculateOpticsLeadScore({ ...lead, opticsSpecs: specs });

  const handleSaveSpecs = () => {
    const updated = {
      ...lead,
      opticsSpecs: specs,
      leadScore: scoreResult.score,
    };
    onUpdateLead(updated);
    onAddInteraction({
      leadId: lead.id,
      userId: currentUser.id,
      userName: currentUser.name,
      type: 'note',
      outcome: 'تحديث المواصفات الفنية للبصريات',
      notes: `تم تحديث المواصفات الفنية: ${specs.branchesCount} فروع، النظام الحالي: ${specs.currentSystem}.`,
    });
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddInteraction({
      leadId: lead.id,
      userId: currentUser.id,
      userName: currentUser.name,
      type: noteType,
      outcome: noteOutcome,
      notes: newNote.trim(),
    });
    setNewNote('');
  };

  const leadInteractions = interactions.filter(i => i.leadId === lead.id);

  const handleShareQuoteWhatsApp = () => {
    const msg = `عرض أسعار نظام Zntra Optics OS لـ ${lead.shopName || lead.name}:\n\n` +
      `• الباقة المختارة: Optics OS ${quotePlan}\n` +
      `• السعر الأساسي: ${formatEGP(basePrice)}\n` +
      `• الأجهزة الملحقة: طابعة فواتير حرارية (${includePrinter ? 'نعم' : 'لا'})، قارئ باركود (${includeScanner ? 'نعم' : 'لا'})\n` +
      `• نسبة الخصم: ${quoteDiscount}%\n` +
      `• الإجمالي النهائي: ${formatEGP(finalQuotePrice)}\n` +
      `• يشمل التدريب والدعم الفني السنوي ومزامنة الفروع السحابية.\n\n` +
      `تحياتنا، فريق مبيعات Zntra`;

    const cleaned = lead.phone.replace(/\D/g, '');
    const intl = cleaned.startsWith('0') ? '20' + cleaned.substring(1) : cleaned;
    window.open(`https://wa.me/${intl}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-white">{lead.shopName || lead.name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {lead.governorate} - {lead.city}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  lead.status === 'interested' ? 'bg-rose-500 text-white' :
                  lead.status === 'no_answer' ? 'bg-amber-600 text-white' :
                  lead.status === 'not_interested' ? 'bg-yellow-500 text-slate-950' : 'bg-slate-500 text-white'
                }`}>
                  {lead.status === 'interested' ? '🔴 مهتم ومتابعة' :
                   lead.status === 'no_answer' ? '🟤 لم يرد' :
                   lead.status === 'not_interested' ? '🟡 غير مهتم' : '⚪ لم يتم التواصل'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-300 mt-2 flex-wrap">
                <span className="font-mono" dir="ltr">{lead.phone}</span>
                <span>المسؤول: {lead.assignedTo.name}</span>
                {lead.googleMapsUrl && (
                  <a
                    href={lead.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-white flex items-center gap-1 underline"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>خرائط جوجل</span>
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={createWhatsAppLink(lead.phone, lead.shopName, currentUser.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">واتساب</span>
              </a>

              <a
                href={createTelLink(lead.phone)}
                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">اتصال</span>
              </a>

              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex space-x-2 space-x-reverse mt-4 border-t border-slate-800 pt-3 text-xs font-bold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              نظرة عامة والتقييم الذكي (Score)
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'specs' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              مواصفات مركز البصريات (Optics Specs)
            </button>
            <button
              onClick={() => setActiveTab('quote')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'quote' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              حاسبة عروض الأسعار (Quotation)
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'timeline' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              سجل التواصل والملاحظات ({leadInteractions.length})
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: Overview & AI Lead Score */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Optics Score Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-white border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-extrabold text-blue-950">
                      مؤشر فرصة الشراء لنظام Optics OS (Lead Score)
                    </h3>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-blue-700 font-mono">
                      {scoreResult.score}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">/ 100</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        scoreResult.score >= 75 ? 'bg-rose-500' : scoreResult.score >= 50 ? 'bg-blue-600' : 'bg-slate-400'
                      }`}
                      style={{ width: `${scoreResult.score}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-blue-200/60">
                  <p className="text-xs font-bold text-slate-700 mb-2">أسباب وعوامل هذا التقييم:</p>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {scoreResult.factors.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Location & Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-700 block">العنوان والبيانات الجغرافية:</span>
                  <p className="text-slate-600">{lead.address}</p>
                  <p className="text-slate-500">المنطقة: {lead.city} • المحافظة: {lead.governorate}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-700 block">مصدر العميل وتاريخ التسجيل:</span>
                  <p className="text-slate-600">المصدر: {lead.source}</p>
                  <p className="text-slate-500">تاريخ الإضافة: {new Date(lead.createdAt).toLocaleDateString('ar-EG')}</p>
                  {lead.notes && <p className="text-slate-700 italic font-medium">"{lead.notes}"</p>}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Optics Specs */}
          {activeTab === 'specs' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">عدد الفروع</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={specs.branchesCount}
                    onChange={e => setSpecs({ ...specs, branchesCount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">أجهزة الكاشير والكمبيوتر</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={specs.pcsCount}
                    onChange={e => setSpecs({ ...specs, pcsCount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">النظام الحالي المتبع</label>
                  <select
                    value={specs.currentSystem}
                    onChange={e => setSpecs({ ...specs, currentSystem: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                  >
                    <option value="دفتري يدوي">دفتري يدوي (كشاكيل)</option>
                    <option value="إكسيل شيت">شيتات إكسيل (Excel)</option>
                    <option value="برنامج محلي قديم">برنامج ديسكتوب قديم بدون سحابة</option>
                    <option value="برنامج منافس">برنامج منافس آخر</option>
                    <option value="لا يوجد نظام">لا يوجد نظام إطلاقاً</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={specs.hasLab}
                    onChange={e => setSpecs({ ...specs, hasLab: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">يمتلك ورشة أو معمل تقطيع عدسات خاص</span>
                    <span className="text-[11px] text-slate-500">يحتاج موديول توجيه أوامر التشغيل للمعمل</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={specs.hasOptometrist}
                    onChange={e => setSpecs({ ...specs, hasOptometrist: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">أخصائي فحص نظر مقيم داخل المحل</span>
                    <span className="text-[11px] text-slate-500">يحتاج موديول تسجيل قياسات النظر وكروت المرضى</span>
                  </div>
                </label>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleSaveSpecs}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  حفظ المواصفات وإعادة حساب التقييم
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Quotation Builder */}
          {activeTab === 'quote' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['Basic', 'Pro', 'Enterprise'] as const).map(plan => (
                  <div
                    key={plan}
                    onClick={() => setQuotePlan(plan)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      quotePlan === plan
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-slate-900">Optics OS {plan}</span>
                      {plan === 'Pro' && (
                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                          الأكثر طلباً
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-lg font-black text-blue-700 font-mono">
                      {formatEGP(plan === 'Basic' ? 8000 : plan === 'Pro' ? 16000 : 28000)}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {plan === 'Basic' ? 'فرع واحد مع كاشير ونظام كشوفات' : plan === 'Pro' ? 'حتى 3 فروع مع مزامنة سحابية وإدارة معمل' : 'سلسلة فروع غير محدودة مع لوحة تحكم مركزية'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Hardware add-ons */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <span className="font-bold text-slate-800 block">إضافات الأجهزة المتوافقة مع النظام:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includePrinter}
                      onChange={e => setIncludePrinter(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>طابعة إيصالات حرارية متوافقة (3,500 ج.م)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeScanner}
                      onChange={e => setIncludeScanner(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>قارئ باركود ليزري سريع للشنابر (1,500 ج.م)</span>
                  </label>
                </div>
              </div>

              {/* Summary and WhatsApp button */}
              <div className="p-4 bg-blue-900 text-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-blue-200 font-bold">إجمالي عرض السعر للعميل (بعد الخصم):</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                    {formatEGP(finalQuotePrice)}
                  </div>
                </div>
                <button
                  onClick={handleShareQuoteWhatsApp}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>إرسال العرض للعميل عبر الواتساب فوراً</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Timeline & Notes */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              {/* Add New Note */}
              <form onSubmit={handleAddNote} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <select
                    value={noteType}
                    onChange={e => setNoteType(e.target.value as InteractionLog['type'])}
                    className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="call">📞 مكالمة هاتفية</option>
                    <option value="whatsapp">💬 رسالة واتساب</option>
                    <option value="demo">💻 عرض ديمو</option>
                    <option value="visit">🚗 زيارة ميدانية للمحل</option>
                    <option value="note">📝 ملاحظة داخلية</option>
                  </select>

                  <input
                    type="text"
                    value={noteOutcome}
                    onChange={e => setNoteOutcome(e.target.value)}
                    placeholder="نتيجة المتابعة (مثال: طلب زيارة، مهتم، غير متفرغ)..."
                    className="flex-1 p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <textarea
                  rows={2}
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="اكتب تفاصيل الملاحظة أو المكالمة..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إضافة لسجل العميل</span>
                  </button>
                </div>
              </form>

              {/* Timeline List */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-700">التسلسل الزمني لجميع المحاولات والتواصل:</h4>
                {leadInteractions.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl text-center">
                    لم يتم تسجيل تفاعلات بعد لهذا العميل.
                  </p>
                ) : (
                  leadInteractions.map(item => (
                    <div key={item.id} className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                        {item.type === 'call' ? <Phone className="w-4 h-4" /> :
                         item.type === 'whatsapp' ? <MessageSquare className="w-4 h-4" /> :
                         item.type === 'demo' ? <Sparkles className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{item.outcome}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(item.timestamp).toLocaleString('ar-EG')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{item.notes}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">بواسطة: {item.userName}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
