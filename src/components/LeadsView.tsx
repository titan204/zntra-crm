import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus, User } from '../types/crm';
import { createWhatsAppLink, createTelLink } from '../utils/crmLogic';
import { exportLeadsToExcel } from '../utils/excelService';
import {
  Search,
  Filter,
  Download,
  Phone,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Glasses,
  Flame,
  CheckCircle2,
  XCircle,
  PhoneCall,
  UserCheck,
  Plus,
  Trash2,
  MapPin,
  Star
} from 'lucide-react';

interface LeadsViewProps {
  leads: Lead[];
  currentUser: User;
  allUsers: User[];
  onSelectLead: (lead: Lead) => void;
  onQuickCall: (lead: Lead) => void;
  onOpenAddModal: () => void;
  onUpdateLead: (updated: Lead) => void;
  onBulkAssign: (leadIds: string[], rep: { id: string; name: string; email: string }) => void;
  onBulkStatusChange: (leadIds: string[], status: LeadStatus) => void;
  initialStatusFilter?: string;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  currentUser,
  allUsers,
  onSelectLead,
  onQuickCall,
  onOpenAddModal,
  onBulkAssign,
  onBulkStatusChange,
  initialStatusFilter = 'all'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [govFilter, setGovFilter] = useState<string>('all');
  const [repFilter, setRepFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Bulk action state
  const [bulkRepId, setBulkRepId] = useState('');
  const [bulkStatus, setBulkStatus] = useState<LeadStatus>('interested');

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search
      if (searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const matchesName = (lead.shopName || lead.name).toLowerCase().includes(term);
        const matchesPhone = lead.phone.includes(term);
        const matchesAddress = lead.address.toLowerCase().includes(term);
        const matchesCity = lead.city.toLowerCase().includes(term);
        if (!matchesName && !matchesPhone && !matchesAddress && !matchesCity) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'all' && lead.status !== statusFilter) {
        return false;
      }

      // Governorate
      if (govFilter !== 'all' && lead.governorate !== govFilter) {
        return false;
      }

      // Rep
      if (repFilter !== 'all' && lead.assignedTo.id !== repFilter) {
        return false;
      }

      // Priority
      if (priorityFilter !== 'all' && lead.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [leads, searchTerm, statusFilter, govFilter, repFilter, priorityFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, currentPage, pageSize]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(new Set(paginatedLeads.map(l => l.id)));
    } else {
      setSelectedLeadIds(new Set());
    }
  };

  const handleToggleLead = (id: string) => {
    const next = new Set(selectedLeadIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedLeadIds(next);
  };

  const handleApplyBulkAssign = () => {
    if (!bulkRepId || selectedLeadIds.size === 0) return;
    const targetRep = allUsers.find(u => u.id === bulkRepId);
    if (!targetRep) return;
    onBulkAssign(Array.from(selectedLeadIds), {
      id: targetRep.id,
      name: targetRep.name,
      email: targetRep.email
    });
    setSelectedLeadIds(new Set());
  };

  const handleApplyBulkStatus = () => {
    if (selectedLeadIds.size === 0) return;
    onBulkStatusChange(Array.from(selectedLeadIds), bulkStatus);
    setSelectedLeadIds(new Set());
  };

  const getStatusBadge = (status: LeadStatus, originalColor?: string) => {
    switch (status) {
      case 'interested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            <span>مهتم (🔴 أحمر)</span>
          </span>
        );
      case 'no_answer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-700" />
            <span>لم يرد (🟤 بني)</span>
          </span>
        );
      case 'not_interested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-900 border border-yellow-300">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>غير مهتم (🟡 أصفر)</span>
          </span>
        );
      case 'not_contacted':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>لم يتصل (⚪ أبيض)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ابحث باسم محل النظارات، رقم الهاتف، الشارع، أو المنطقة..."
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Buttons: Add Lead & Export Excel */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => exportLeadsToExcel(filteredLeads)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors"
              title="تصدير النتائج المفلترة إلى ملف إكسيل (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>تصدير إكسيل ({filteredLeads.length})</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة محل نظارات</span>
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              حالة العميل (نظام الألوان)
            </label>
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
            >
              <option value="all">جميع الحالات ({leads.length})</option>
              <option value="interested">🔴 مهتم ومتابعة (Red)</option>
              <option value="no_answer">🟤 لم يرد (Brown)</option>
              <option value="not_interested">🟡 غير مهتم (Yellow)</option>
              <option value="not_contacted">⚪ لم يتم التواصل (White)</option>
            </select>
          </div>

          {/* Governorate Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              المحافظة
            </label>
            <select
              value={govFilter}
              onChange={e => {
                setGovFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
            >
              <option value="all">كل المحافظات</option>
              <option value="القاهرة">القاهرة</option>
              <option value="الجيزة">الجيزة</option>
              <option value="القليوبية">القليوبية</option>
              <option value="الشرقية">الشرقية</option>
              <option value="الإسكندرية">الإسكندرية</option>
            </select>
          </div>

          {/* Rep Filter (Visible to Admin/Manager) */}
          {(currentUser.role === 'super_admin' || currentUser.role === 'sales_manager') && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                المسؤول من المبيعات
              </label>
              <select
                value={repFilter}
                onChange={e => {
                  setRepFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
              >
                <option value="all">جميع مسؤولي المبيعات</option>
                {allUsers
                  .filter(u => u.role === 'sales_rep')
                  .map(rep => (
                    <option key={rep.id} value={rep.id}>{rep.name}</option>
                  ))}
              </select>
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              الأولوية
            </label>
            <select
              value={priorityFilter}
              onChange={e => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
            >
              <option value="all">كل الأولويات</option>
              <option value="high">أولوية عالية</option>
              <option value="medium">أولوية متوسطة</option>
              <option value="low">أولوية منخفضة</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Bar (when rows are selected) */}
        {selectedLeadIds.size > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-blue-900">
              تم تحديد ({selectedLeadIds.size}) محل نظارات
            </span>

            <div className="flex items-center gap-3">
              {/* Bulk Assign */}
              {(currentUser.role === 'super_admin' || currentUser.role === 'sales_manager') && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={bulkRepId}
                    onChange={e => setBulkRepId(e.target.value)}
                    className="p-1.5 bg-white border border-blue-300 rounded-lg text-xs font-medium"
                  >
                    <option value="">اختر مندوب للتعيين...</option>
                    {allUsers
                      .filter(u => u.role === 'sales_rep')
                      .map(rep => (
                        <option key={rep.id} value={rep.id}>{rep.name}</option>
                      ))}
                  </select>
                  <button
                    onClick={handleApplyBulkAssign}
                    disabled={!bulkRepId}
                    className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50"
                  >
                    تعيين
                  </button>
                </div>
              )}

              {/* Bulk Status */}
              <div className="flex items-center gap-1.5">
                <select
                  value={bulkStatus}
                  onChange={e => setBulkStatus(e.target.value as LeadStatus)}
                  className="p-1.5 bg-white border border-blue-300 rounded-lg text-xs font-medium"
                >
                  <option value="interested">تغيير إلى: 🔴 مهتم</option>
                  <option value="no_answer">تغيير إلى: 🟤 لم يرد</option>
                  <option value="not_interested">تغيير إلى: 🟡 غير مهتم</option>
                  <option value="not_contacted">تغيير إلى: ⚪ لم يتم التواصل</option>
                </select>
                <button
                  onClick={handleApplyBulkStatus}
                  className="px-2.5 py-1.5 bg-slate-800 text-white rounded-lg font-bold"
                >
                  تطبيق الحالة
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 select-none">
              <tr>
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    checked={paginatedLeads.length > 0 && selectedLeadIds.size === paginatedLeads.length}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="p-3">محل النظارات / العميل</th>
                <th className="p-3">رقم الهاتف والتواصل</th>
                <th className="p-3">الموقع والعنوان</th>
                <th className="p-3">حالة العميل (اللون)</th>
                <th className="p-3">درجة الاهتمام (Score)</th>
                <th className="p-3">بيانات البصريات</th>
                <th className="p-3">المسؤول</th>
                <th className="p-3 text-center">إجراءات سريعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    لا توجد محلات نظارات مطابقة لشروط البحث أو الفلتر الحالية.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map(lead => {
                  const isSelected = selectedLeadIds.has(lead.id);
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isSelected ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleLead(lead.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Shop Name & Rating */}
                      <td className="p-3">
                        <div
                          className="font-extrabold text-slate-900 hover:text-blue-600 cursor-pointer flex items-center gap-1.5"
                          onClick={() => onSelectLead(lead)}
                        >
                          <span>{lead.shopName || lead.name}</span>
                          {lead.pageInPdf && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              (ص {lead.pageInPdf})
                            </span>
                          )}
                        </div>
                        {lead.rating && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-600 mt-0.5">
                            <Star className="w-3 h-3 fill-amber-400 stroke-amber-500" />
                            <span className="font-bold">{lead.rating}</span>
                          </div>
                        )}
                      </td>

                      {/* Phone & Direct Connect */}
                      <td className="p-3">
                        <div className="font-mono text-slate-800 font-bold" dir="ltr">
                          {lead.phone}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={createWhatsAppLink(lead.phone, lead.shopName, currentUser.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded font-bold flex items-center gap-1"
                            title="فتح محادثة واتساب"
                          >
                            <MessageSquare className="w-2.5 h-2.5" />
                            <span>واتساب</span>
                          </a>

                          <a
                            href={createTelLink(lead.phone)}
                            className="text-[10px] text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded font-bold flex items-center gap-1"
                            title="اتصال هاتفي مباشر"
                          >
                            <Phone className="w-2.5 h-2.5" />
                            <span>اتصال</span>
                          </a>
                        </div>
                      </td>

                      {/* Location & Maps */}
                      <td className="p-3 max-w-[200px]">
                        <div className="flex items-center gap-1 text-slate-800 font-bold">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{lead.city} - {lead.governorate}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {lead.address}
                        </div>
                        {lead.googleMapsUrl && (
                          <a
                            href={lead.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 mt-0.5"
                          >
                            <span>عرض في خرائط جوجل</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>

                      {/* Status (Color) */}
                      <td className="p-3 whitespace-nowrap">
                        {getStatusBadge(lead.status, lead.originalColor)}
                      </td>

                      {/* Lead Score */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono font-black text-xs ${
                              lead.leadScore >= 75
                                ? 'bg-rose-100 text-rose-800'
                                : lead.leadScore >= 50
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {lead.leadScore}
                          </span>
                        </div>
                      </td>

                      {/* Optics Specs */}
                      <td className="p-3">
                        <div className="text-[11px] text-slate-700 font-medium">
                          <span>{lead.opticsSpecs?.branchesCount || 1} فروع</span>
                          <span className="mx-1 text-slate-300">•</span>
                          <span className="text-slate-500">{lead.opticsSpecs?.currentSystem || 'دفتري'}</span>
                        </div>
                        {lead.opticsSpecs?.hasLab && (
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded">معمل تقطيع</span>
                        )}
                      </td>

                      {/* Rep */}
                      <td className="p-3 whitespace-nowrap text-slate-700 font-medium">
                        {lead.assignedTo.name}
                      </td>

                      {/* Fast Actions */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onQuickCall(lead)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                            title="تسجيل نتيجة مكالمة سريعة في 3 ثواني"
                          >
                            تسجيل مكالمة
                          </button>
                          <button
                            onClick={() => onSelectLead(lead)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                            title="عرض ملف العميل الشامل 360"
                          >
                            الملف 360°
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            إجمالي النتائج: <strong className="font-mono text-slate-900">{filteredLeads.length}</strong> محل نظارات
            (الصفحة <strong className="font-mono">{currentPage}</strong> من <strong className="font-mono">{totalPages}</strong>)
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span>عرض:</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded p-1 text-xs font-bold"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40 hover:bg-slate-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40 hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
