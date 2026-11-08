import React, { useState } from 'react';
import { Lead, LeadPriority, LeadStatus, PipelineStage, User } from '../types/crm';
import { calculateOpticsLeadScore } from '../utils/crmLogic';
import { Store, X, MapPin, Phone, Glasses } from 'lucide-react';

interface AddLeadModalProps {
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onSaveLead: (newLead: Lead) => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  currentUser,
  allUsers,
  onClose,
  onSaveLead
}) => {
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState('القاهرة');
  const [city, setCity] = useState('وسط البلد');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<LeadStatus>('interested');
  const [priority, setPriority] = useState<LeadPriority>('high');
  const [branchesCount, setBranchesCount] = useState(1);
  const [currentSystem, setCurrentSystem] = useState('دفتري يدوي');
  const [assignedRepId, setAssignedRepId] = useState(currentUser.id);
  const [dealValue, setDealValue] = useState<string>('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName || !phone) return;

    const assignedUser = allUsers.find(u => u.id === assignedRepId) || currentUser;

    const partialLead: Partial<Lead> = {
      status,
      priority,
      opticsSpecs: {
        branchesCount,
        cashiersCount: 1,
        pcsCount: 1,
        currentSystem,
        hasLab: false,
        hasOptometrist: false,
        dailyPrescriptionsAvg: 0,
        interestLevel: status === 'interested' ? 'عالي جداً' : 'متوسط',
        painPoints: []
      }
    };

    const score = calculateOpticsLeadScore(partialLead).score;

    const newLead: Lead = {
      id: `lead-manual-${Date.now()}`,
      name: shopName,
      shopName,
      phone,
      alternatePhones: [],
      governorate,
      city,
      address: address || `${governorate}، ${city}`,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shopName + ' ' + address)}`,
      status,
      originalColor: status === 'interested' ? 'red' : status === 'no_answer' ? 'brown' : status === 'not_interested' ? 'yellow' : 'white',
      stage: status === 'interested' ? 'qualified' : 'new',
      priority,
      source: 'إضافة يدوية مباشرة',
      leadScore: score,
      dealValue: dealValue ? Number(dealValue) : 0,
      assignedTo: {
        id: assignedUser.id,
        name: assignedUser.name,
        email: assignedUser.email
      },
      createdAt: new Date().toISOString(),
      notes,
      opticsSpecs: partialLead.opticsSpecs!
    };

    onSaveLead(newLead);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold">إضافة محل نظارات / عميل جديد</h3>
              <p className="text-[11px] text-slate-300">تسجيل بيانات مركز بصريات جديد في قاعدة بيانات CRM</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم محل النظارات *</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                placeholder="مثال: نظارات الأهرام"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">رقم الهاتف الأساسي *</label>
              <input
                type="text"
                required
                dir="ltr"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="010XXXXXXXX"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">المحافظة</label>
              <select
                value={governorate}
                onChange={e => setGovernorate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
              >
                <option value="القاهرة">القاهرة</option>
                <option value="الجيزة">الجيزة</option>
                <option value="القليوبية">القليوبية</option>
                <option value="الشرقية">الشرقية</option>
                <option value="الإسكندرية">الإسكندرية</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">المنطقة / الحي</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="مثال: الدقي، المهندسين، عابدين..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">العنوان بالتفصيل</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="الشارع، رقم العمارة، علامة مميزة بجوار..."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">حالة العميل (اللون)</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as LeadStatus)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
              >
                <option value="interested">🔴 مهتم (أحمر)</option>
                <option value="no_answer">🟤 لم يرد (بني)</option>
                <option value="not_interested">🟡 غير مهتم (أصفر)</option>
                <option value="not_contacted">⚪ لم يتصل (أبيض)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">عدد الفروع</label>
              <input
                type="number"
                min={1}
                max={20}
                value={branchesCount}
                onChange={e => setBranchesCount(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">النظام الحالي</label>
              <select
                value={currentSystem}
                onChange={e => setCurrentSystem(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="دفتري يدوي">دفتري يدوي</option>
                <option value="إكسيل شيت">إكسيل شيت</option>
                <option value="برنامج قديم">برنامج محلي قديم</option>
                <option value="لا يوجد">لا يوجد</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">قيمة الصفقة المتوقعة (ج.م)</label>
              <input
                type="number"
                min={0}
                value={dealValue}
                onChange={e => setDealValue(e.target.value)}
                placeholder="0"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>

            {/* Rep assignment (for manager/admin) */}
            {(currentUser.role === 'super_admin' || currentUser.role === 'sales_manager') && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">المسؤول من المبيعات</label>
                <select
                  value={assignedRepId}
                  onChange={e => setAssignedRepId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                >
                  {allUsers
                    .filter(u => u.role === 'sales_rep' || u.id === currentUser.id)
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">ملاحظات أولية</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="أي تفاصيل إضافية عن المحل أو التواصل..."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 rounded-lg font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
            >
              حفظ العميل
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
