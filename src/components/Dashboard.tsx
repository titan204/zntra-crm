import React from 'react';
import { Lead, User } from '../types/crm';
import { calculateDashboardKPIs, formatEGP, createWhatsAppLink, createTelLink } from '../utils/crmLogic';
import {
  TrendingUp,
  Store,
  PhoneCall,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Award,
  Flame,
  ArrowUpRight,
  Phone,
  MessageSquare,
  MapPin,
  Glasses
} from 'lucide-react';

interface DashboardProps {
  leads: Lead[];
  currentUser: User;
  onSelectLead: (lead: Lead) => void;
  onQuickCall: (lead: Lead) => void;
  onViewAllLeads: (statusFilter?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  leads,
  currentUser,
  onSelectLead,
  onQuickCall,
  onViewAllLeads
}) => {
  const kpis = calculateDashboardKPIs(leads);

  // High priority leads needing follow-up
  const hotLeads = leads
    .filter(l => l.status === 'interested' || (l.leadScore >= 75 && l.status !== 'not_interested'))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold mb-2">
              <Glasses className="w-3.5 h-3.5" />
              <span>مرحبا، {currentUser.name} ({currentUser.role === 'super_admin' ? 'مدير عام النظام' : currentUser.role === 'sales_manager' ? 'مدير المبيعات' : 'مسؤول المبيعات'})</span>
            </div>
            <h1 className="text-2xl font-black text-white">
              لوحة متابعة مبيعات نظام Optics OS
            </h1>
            <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
              تحليل فوري لأداء قاعدة بيانات محلات ومراكز البصريات في محافظات القاهرة الكبرى والجيزة، مع تتبع مستمر للفرص البيعية ومعدلات الإغلاق.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/10 shrink-0">
            <div>
              <div className="text-[11px] text-blue-200 font-bold">قيمة الصفقات في خط المبيعات</div>
              <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                {formatEGP(kpis.pipelineValue)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (Color Code Aligned with PDF & Excel) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Red: Interested */}
        <div
          onClick={() => onViewAllLeads('interested')}
          className="bg-white p-5 rounded-2xl border-2 border-rose-200 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:border-rose-400 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-2 h-full bg-rose-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">عملاء مهتمون (🔴 أحمر)</span>
            <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono">{kpis.interested}</span>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
              متابعة فورية
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">محلات أبدت اهتماماً بنظام Optics OS أو جاهزة للديمو</p>
        </div>

        {/* Brown: No Answer */}
        <div
          onClick={() => onViewAllLeads('no_answer')}
          className="bg-white p-5 rounded-2xl border-2 border-amber-200 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:border-amber-400 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-2 h-full bg-amber-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">لم يرد (🟤 بني)</span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PhoneCall className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono">{kpis.noAnswer}</span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              إعادة اتصال
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">تم الاتصال مسبقاً ولم يتم الرد، تتطلب المحاولة مجدداً</p>
        </div>

        {/* Yellow: Not Interested */}
        <div
          onClick={() => onViewAllLeads('not_interested')}
          className="bg-white p-5 rounded-2xl border-2 border-yellow-200 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:border-yellow-400 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-2 h-full bg-yellow-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">غير مهتم حالياً (🟡 أصفر)</span>
            <span className="w-8 h-8 rounded-lg bg-yellow-50 text-yellow-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono">{kpis.notInterested}</span>
            <span className="text-xs font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-md">
              مؤجل / معترض
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">تم التحدث معهم واعتذروا حالياً (أسباب مثل السعر أو الاستقرار)</p>
        </div>

        {/* White: Uncontacted */}
        <div
          onClick={() => onViewAllLeads('not_contacted')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:border-slate-400 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-2 h-full bg-slate-300" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">لم يتم التواصل (⚪ أبيض)</span>
            <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Store className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono">{kpis.notContacted}</span>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              فرص جديدة
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">محلات مسجلة في الدليل الميداني بانتظار أول اتصال</p>
        </div>
      </div>

      {/* Middle Row: Hot Leads & Performance Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: High Priority Hot Leads */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  عملاء ذوو أولوية قصوى (Hot Leads)
                </h2>
                <p className="text-[11px] text-slate-400">محلات نظارات ذات احتمالية إغلاق وتعاقد مرتفعة</p>
              </div>
            </div>
            <button
              onClick={() => onViewAllLeads('interested')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>عرض الجميع</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {hotLeads.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                <Store className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-600">لا يوجد عملاء مسجلون حالياً</p>
                <p className="text-[11px] text-slate-400 mt-1">قم بإضافة عميل جديد أو استيراد ملف الإكسيل للبدء في متابعة المبيعات</p>
              </div>
            ) : (
              hotLeads.map(lead => (
                <div
                  key={lead.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900 hover:text-blue-600 cursor-pointer" onClick={() => onSelectLead(lead)}>
                        {lead.shopName || lead.name}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono">
                        {lead.leadScore} نقطة
                      </span>
                      {lead.opticsSpecs?.branchesCount > 1 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">
                          {lead.opticsSpecs.branchesCount} فروع
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{lead.city} - {lead.governorate}</span>
                      </span>
                      <span className="font-mono" dir="ltr">{lead.phone}</span>
                      <span className="text-[11px] text-slate-400">المسؤول: {lead.assignedTo.name}</span>
                    </div>
                  </div>

                  {/* Fast Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={createWhatsAppLink(lead.phone, lead.shopName, currentUser.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      title="محادثة واتساب سريعة"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px]">واتساب</span>
                    </a>

                    <a
                      href={createTelLink(lead.phone)}
                      className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      title="اتصال هاتفي"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px]">اتصال</span>
                    </a>

                    <button
                      onClick={() => onQuickCall(lead)}
                      className="px-2.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                    >
                      سجل النتيجة
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Reps Leaderboard & Governorate Breakdown */}
        <div className="space-y-6">
          {/* Reps Leaderboard */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-extrabold text-slate-900">ترتيب مسؤولي المبيعات</h3>
            </div>
            <div className="mt-3 space-y-3">
              {kpis.repStats.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">لا توجد بيانات مسندة للمندوبين بعد</p>
              ) : (
                kpis.repStats.map((rep, idx) => (
                  <div key={rep.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        idx === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800">{rep.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-rose-600 font-bold" title="مهتم">{rep.interested} مهتم</span>
                      <span className="text-slate-400">/</span>
                      <span className="text-slate-600">{rep.total} إجمالي</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Governorate Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-extrabold text-slate-900">توزيع المحافظات</h3>
            </div>
            <div className="mt-3 space-y-2.5">
              {Object.keys(kpis.govCounts).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">لا توجد بيانات جغرافية مسجلة بعد</p>
              ) : (
                Object.entries(kpis.govCounts).map(([gov, count]) => {
                  const pct = kpis.total > 0 ? Math.round((count / kpis.total) * 100) : 0;
                  return (
                    <div key={gov}>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>{gov}</span>
                        <span className="font-mono text-slate-500">{count} محل ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
