import React, { useState } from 'react';
import { Lead, User, UserRole } from '../types/crm';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Award,
  RefreshCw,
  Mail,
  Phone,
  CheckCircle2,
  Trash2
} from 'lucide-react';

interface TeamManagementProps {
  allUsers: User[];
  leads: Lead[];
  currentUser: User;
  onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  onUpdateUser: (user: User) => void;
  onDistributeRoundRobin: (batchCount: number) => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  allUsers,
  leads,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDistributeRoundRobin
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [distributeCount, setDistributeCount] = useState(100);

  // New user form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('sales_rep');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    onAddUser({
      name,
      email,
      password,
      role,
      phone,
      isActive: true
    });

    setShowAddModal(false);
    setName('');
    setEmail('');
    setPhone('');
  };

  // Calculate workloads
  const repWorkloads = allUsers.map(u => {
    const userLeads = leads.filter(l => l.assignedTo.id === u.id);
    const interested = userLeads.filter(l => l.status === 'interested').length;
    const won = userLeads.filter(l => l.stage === 'won').length;
    return {
      user: u,
      total: userLeads.length,
      interested,
      won,
      conversionRate: userLeads.length > 0 ? ((won / userLeads.length) * 100).toFixed(1) : '0'
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">
              إدارة فريق المبيعات وتوزيع العملاء
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            مراقبة أحمال العمل وتوزيع العملاء المحتملين تلقائياً بين مناديب المبيعات
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role === 'super_admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة موظف مبيعات جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Round-Robin Automatic Distribution Tool */}
      <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-300 animate-spin-slow" />
            <span className="text-sm font-extrabold">التوزيع التلقائي العادل للعملاء (Round-Robin)</span>
          </div>
          <span className="text-xs bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded-full font-bold">
            خاص بالإدارة
          </span>
        </div>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          يقوم هذا الإجراء بسحب العملاء غير المتصل بهم وتوزيعهم بالتساوي وبشكل دوري بين جميع مناديب المبيعات النشطين لضمان سرعة الاتصال وعدم تكدس العملاء.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs">
            <span>عدد العملاء للتوزيع:</span>
            <input
              type="number"
              min={10}
              max={500}
              step={10}
              value={distributeCount}
              onChange={e => setDistributeCount(Number(e.target.value))}
              className="w-20 p-1.5 bg-white/10 border border-white/20 rounded-lg text-white font-mono font-bold text-center"
            />
          </div>
          <button
            onClick={() => onDistributeRoundRobin(distributeCount)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            توزيع {distributeCount} عميل بالتساوي الآن
          </button>
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {repWorkloads.map(({ user, total, interested, won, conversionRate }) => (
          <div
            key={user.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">{user.name}</h3>
                <div className="text-[11px] text-slate-500 font-mono" dir="ltr">{user.email}</div>
                <div className="mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    user.role === 'super_admin' ? 'bg-rose-100 text-rose-800' :
                    user.role === 'sales_manager' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role === 'super_admin' ? 'مدير عام (Super Admin)' :
                     user.role === 'sales_manager' ? 'مدير مبيعات (Manager)' : 'مندوب مبيعات (Sales Rep)'}
                  </span>
                </div>
              </div>

              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                {user.name.charAt(0)}
              </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center font-mono">
              <div className="p-2 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-500 block">العملاء</span>
                <span className="font-bold text-slate-900 text-sm">{total}</span>
              </div>
              <div className="p-2 bg-rose-50 rounded-xl">
                <span className="text-[10px] text-rose-700 block">مهتم</span>
                <span className="font-bold text-rose-700 text-sm">{interested}</span>
              </div>
              <div className="p-2 bg-emerald-50 rounded-xl">
                <span className="text-[10px] text-emerald-700 block">تعاقد</span>
                <span className="font-bold text-emerald-700 text-sm">{won}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">إضافة عضو جديد لفريق العمل</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="مثال: يوسف حسام"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني للـ CRM</label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="youssef.sales@zntra.com"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">كلمة المرور الافتراضية</label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  dir="ltr"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الدور والصلاحية</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                >
                  <option value="sales_rep">مسؤول مبيعات (Sales Rep)</option>
                  <option value="sales_manager">مدير مبيعات (Sales Manager)</option>
                  <option value="super_admin">مدير عام للنظام (Super Admin)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-lg font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                >
                  إنشاء الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
