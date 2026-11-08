import React, { useState } from 'react';
import { Lead, PipelineStage, User } from '../types/crm';
import { formatEGP, createWhatsAppLink } from '../utils/crmLogic';
import {
  Kanban,
  CheckCircle,
  Clock,
  Send,
  Sparkles,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface PipelineBoardProps {
  leads: Lead[];
  currentUser: User;
  onSelectLead: (lead: Lead) => void;
  onUpdateLeadStage: (leadId: string, newStage: PipelineStage) => void;
}

const STAGES: { id: PipelineStage; label: string; color: string; headerBg: string }[] = [
  { id: 'new', label: 'عميل جديد', color: 'border-slate-300', headerBg: 'bg-slate-100 text-slate-800' },
  { id: 'contacted', label: 'تم التواصل أولياً', color: 'border-amber-300', headerBg: 'bg-amber-100 text-amber-900' },
  { id: 'qualified', label: 'مؤهل ومهتم', color: 'border-rose-300', headerBg: 'bg-rose-100 text-rose-900' },
  { id: 'demo_scheduled', label: 'موعد ديمو محدد', color: 'border-blue-300', headerBg: 'bg-blue-100 text-blue-900' },
  { id: 'proposal_sent', label: 'تم إرسال عرض السعر', color: 'border-indigo-300', headerBg: 'bg-indigo-100 text-indigo-900' },
  { id: 'negotiation', label: 'مفاوضات الإغلاق', color: 'border-purple-300', headerBg: 'bg-purple-100 text-purple-900' },
  { id: 'won', label: 'تم التعاقد بنجاح 🎉', color: 'border-emerald-300', headerBg: 'bg-emerald-100 text-emerald-900' },
  { id: 'lost', label: 'صفقة مستبعدة', color: 'border-slate-300', headerBg: 'bg-slate-200 text-slate-700' },
];

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  leads,
  currentUser,
  onSelectLead,
  onUpdateLeadStage
}) => {
  const [filterRep, setFilterRep] = useState<string>('all');

  const displayedLeads = leads.filter(l => {
    if (filterRep !== 'all' && l.assignedTo.id !== filterRep) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Board Header & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <Kanban className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              خط المبيعات وتدفق الصفقات (Sales Pipeline)
            </h2>
            <p className="text-xs text-slate-500">
              تتبع مسار كل مركز بصريات من أول اتصال حتى إغلاق الصفقة والتعاقد
            </p>
          </div>
        </div>

        <div className="text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center gap-2">
          <span>إجمالي الصفقات الجارية:</span>
          <span className="font-mono text-blue-700 font-black">
            {displayedLeads.filter(l => l.stage !== 'lost' && l.stage !== 'won').length} فرصة
          </span>
        </div>
      </div>

      {/* Kanban Board Columns Container */}
      <div className="flex space-x-3 space-x-reverse overflow-x-auto pb-4 pt-1 scrollbar-thin">
        {STAGES.map(stage => {
          const stageLeads = displayedLeads.filter(l => l.stage === stage.id);
          const stageValue = stageLeads.reduce((acc, l) => acc + (l.dealValue || 0), 0);

          return (
            <div
              key={stage.id}
              className="w-72 shrink-0 bg-slate-100/70 rounded-2xl p-3 border border-slate-200 flex flex-col max-h-[75vh]"
            >
              {/* Column Header */}
              <div className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-between ${stage.headerBg} mb-3 shadow-xs`}>
                <span>{stage.label}</span>
                <span className="font-mono text-[11px] bg-white/70 px-2 py-0.5 rounded-full font-black">
                  {stageLeads.length}
                </span>
              </div>

              {/* Total Value in Column */}
              <div className="mb-2 px-1 text-[11px] text-slate-500 font-medium flex justify-between font-mono">
                <span>القيمة المتوقعة:</span>
                <span className="font-bold text-slate-800">{formatEGP(stageValue)}</span>
              </div>

              {/* Lead Cards List */}
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5">
                {stageLeads.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs border border-dashed border-slate-300 rounded-xl">
                    فارغ حالياً
                  </div>
                ) : (
                  stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <span
                          onClick={() => onSelectLead(lead)}
                          className="font-extrabold text-xs text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-1"
                        >
                          {lead.shopName || lead.name}
                        </span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">
                          {lead.leadScore}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>{lead.city}</span>
                        <span className="font-mono text-emerald-700 font-bold">
                          {formatEGP(lead.dealValue || 0)}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400">{lead.assignedTo.name}</span>

                        {/* Stage Shift Controls */}
                        <div className="flex items-center gap-1">
                          {stage.id !== 'new' && (
                            <button
                              onClick={() => {
                                const currIdx = STAGES.findIndex(s => s.id === stage.id);
                                if (currIdx > 0) onUpdateLeadStage(lead.id, STAGES[currIdx - 1].id);
                              }}
                              className="p-1 hover:bg-slate-100 rounded text-slate-500"
                              title="المرحلة السابقة"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {stage.id !== 'won' && stage.id !== 'lost' && (
                            <button
                              onClick={() => {
                                const currIdx = STAGES.findIndex(s => s.id === stage.id);
                                if (currIdx < STAGES.length - 1) onUpdateLeadStage(lead.id, STAGES[currIdx + 1].id);
                              }}
                              className="p-1 hover:bg-blue-50 text-blue-600 rounded font-bold"
                              title="الترقية للمرحلة التالية"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
