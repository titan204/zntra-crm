import React, { useState } from 'react';
import { AuditLogEntry } from '../types/crm';
import { History, ShieldCheck, Search, Filter } from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.userName.toLowerCase().includes(term) ||
      log.target.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">
              سجل تدقيق العمليات (System Audit Log)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            سجل غير قابل للتعديل يوثق جميع تحركات الموظفين وتغيير الحالات وإعادة التعيين في CRM
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث في السجل..."
            className="w-full pr-3 pl-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3">الوقت والتاريخ</th>
              <th className="p-3">المستخدم والوظيفة</th>
              <th className="p-3">نوع العملية</th>
              <th className="p-3">الهدف</th>
              <th className="p-3">التفاصيل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/70">
                <td className="p-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString('ar-EG')}
                </td>
                <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                  {log.userName}
                  <span className="text-[10px] text-slate-400 block font-normal">{log.userRole}</span>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                    {log.action}
                  </span>
                </td>
                <td className="p-3 font-medium text-slate-700 whitespace-nowrap">
                  {log.target}
                </td>
                <td className="p-3 text-slate-600">
                  {log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
