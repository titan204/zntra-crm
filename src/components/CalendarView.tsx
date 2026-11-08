import React, { useState } from 'react';
import { ReminderItem, User } from '../types/crm';
import { alarmAudio, getCairoCurrentTimeFormatted, getCairoCurrentDateFormatted } from '../utils/alarmService';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Volume2,
  Phone,
  Sparkles,
  Car,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface CalendarViewProps {
  reminders: ReminderItem[];
  currentUser: User;
  onAddReminder: (reminder: Omit<ReminderItem, 'id'>) => void;
  onToggleComplete: (id: string) => void;
  onTriggerAlarm: (reminder: ReminderItem) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  reminders,
  currentUser,
  onAddReminder,
  onToggleComplete,
  onTriggerAlarm
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Reminder form
  const [newTitle, setNewTitle] = useState('');
  const [newShopName, setNewShopName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newType, setNewType] = useState<ReminderItem['type']>('call');
  const [newDueTime, setNewDueTime] = useState(
    new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newShopName) return;

    onAddReminder({
      leadId: `lead-custom-${Date.now()}`,
      leadName: newShopName,
      shopName: newShopName,
      phone: newPhone || '01000000000',
      userId: currentUser.id,
      userName: currentUser.name,
      title: newTitle,
      dueTime: new Date(newDueTime).toISOString(),
      type: newType,
      completed: false,
      priority: 'high'
    });

    setShowAddModal(false);
    setNewTitle('');
    setNewShopName('');
    setNewPhone('');
  };

  const pendingReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed);

  return (
    <div className="space-y-6">
      {/* Top Banner with Cairo Time & Audio Alarm Test */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">
              تقويم المتابعات والمواعيد (Zntra Schedule)
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>اليوم: {getCairoCurrentDateFormatted()}</span>
            <span>•</span>
            <span className="font-mono text-slate-700 font-bold" dir="ltr">{getCairoCurrentTimeFormatted()} (توقيت القاهرة)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => alarmAudio.playUrgentAlarm()}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors"
            title="تجربة رنين جرس المتابعات بصوت اصطناعي واضح"
          >
            <Volume2 className="w-4 h-4 text-amber-700" />
            <span>تجربة صوت المنبه (Alarm Chime)</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>جدولة موعد جديد</span>
          </button>
        </div>
      </div>

      {/* Main Reminders List & Today Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Reminders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900">
              المواعيد والمتابعات القادمة ({pendingReminders.length})
            </h3>
            <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
              مرتبة زمنياً حسب توقيت القاهرة
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingReminders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                لا توجد مواعيد معلقة مجدولة حالياً. انقر على "جدولة موعد جديد" للبدء.
              </div>
            ) : (
              pendingReminders.map(rem => {
                const isDue = new Date(rem.dueTime).getTime() <= Date.now();
                return (
                  <div
                    key={rem.id}
                    className={`py-3.5 px-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isDue ? 'bg-rose-50/70 border border-rose-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        rem.type === 'call' ? 'bg-blue-100 text-blue-700' :
                        rem.type === 'visit' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {rem.type === 'call' ? <Phone className="w-4 h-4" /> :
                         rem.type === 'visit' ? <Car className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{rem.shopName}</span>
                          {isDue && (
                            <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                              موعد مستحق الآن!
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">{rem.title}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span className="font-mono text-slate-700 font-bold" dir="ltr">
                            {new Date(rem.dueTime).toLocaleString('ar-EG', {
                              weekday: 'short',
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span>المسؤول: {rem.userName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onTriggerAlarm(rem)}
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3 text-amber-600" />
                        <span>رنين</span>
                      </button>

                      <button
                        onClick={() => onToggleComplete(rem.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                      >
                        تمت المتابعة ✓
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Tips & Completed */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-xs font-extrabold text-slate-900 pb-2 border-b border-slate-100">
              المتابعات المكتملة حديثاً ({completedReminders.length})
            </h3>
            <div className="mt-3 space-y-2">
              {completedReminders.slice(0, 5).map(rem => (
                <div key={rem.id} className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                  <div>
                    <span className="font-bold line-through text-slate-400 block">{rem.shopName}</span>
                    <span className="text-[10px] text-slate-400">{rem.title}</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
              ))}
              {completedReminders.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">لا توجد متابعات مكتملة بعد</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">جدولة متابعة جديدة مع منبه صوتي</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم محل النظارات / العميل</label>
                <input
                  type="text"
                  required
                  value={newShopName}
                  onChange={e => setNewShopName(e.target.value)}
                  placeholder="مثال: مركز الأهرام للبصريات"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع المتابعة</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as ReminderItem['type'])}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                >
                  <option value="call">📞 اتصال هاتفي للمتابعة</option>
                  <option value="demo">💻 جلسة ديمو تجريبية أونلاين</option>
                  <option value="visit">🚗 زيارة ميدانية لمقر المحل</option>
                  <option value="meeting">🤝 اجتماع عمل مع المالك</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان المتابعة / الغرض</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="مثال: مناقشة سعر باقة الفروع الثلاثة"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تاريخ ووقت التنبيه (توقيت القاهرة)</label>
                <input
                  type="datetime-local"
                  required
                  value={newDueTime}
                  onChange={e => setNewDueTime(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                />
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
                  حفظ وتفعيل التنبيه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
