import React, { useState, useEffect } from 'react';
import { User, ReminderItem } from '../types/crm';
import { alarmAudio, getCairoCurrentTimeFormatted } from '../utils/alarmService';
import {
  Glasses,
  Bell,
  Users,
  LayoutDashboard,
  Calendar,
  Kanban,
  FileSpreadsheet,
  Bot,
  History,
  LogOut,
  Clock,
  Volume2,
  ChevronDown,
  UserCheck,
  CheckCircle2,
  Plus
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchUser: (user: User) => void;
  onLogout: () => void;
  reminders: ReminderItem[];
  onOpenQuickAdd: () => void;
  onOpenAlarmModal: (reminder: ReminderItem) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  activeTab,
  setActiveTab,
  onSwitchUser,
  onLogout,
  reminders,
  onOpenQuickAdd,
  onOpenAlarmModal
}) => {
  const [cairoTime, setCairoTime] = useState(getCairoCurrentTimeFormatted());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCairoTime(getCairoCurrentTimeFormatted());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter pending reminders
  const pendingReminders = reminders.filter(r => !r.completed);
  const dueReminders = pendingReminders.filter(r => new Date(r.dueTime).getTime() <= Date.now() + 60000);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-bold">مدير عام (Super Admin)</span>;
      case 'sales_manager':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-bold">مدير مبيعات (Sales Manager)</span>;
      case 'sales_rep':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">مسؤول مبيعات (Sales Rep)</span>;
      default:
        return null;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'leads', label: 'إدارة العملاء', icon: Glasses },
    { id: 'pipeline', label: 'المراحل (Kanban)', icon: Kanban },
    { id: 'calendar', label: 'التقويم والمواعيد', icon: Calendar },
    { id: 'excel', label: 'استيراد وتصدير إكسيل', icon: FileSpreadsheet },
    ...(currentUser.role === 'super_admin' || currentUser.role === 'sales_manager'
      ? [{ id: 'team', label: 'فريق العمل', icon: Users }]
      : []),
    { id: 'ai', label: 'مساعد Zntra الذكي', icon: Bot },
    ...(currentUser.role === 'super_admin'
      ? [{ id: 'audit', label: 'سجل العمليات', icon: History }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs select-none">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Glasses className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">
                  Zntra CRM
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Optics OS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">نظام مبيعات محلات ومراكز البصريات</p>
            </div>
          </div>

          {/* Center Info: Cairo Clock & Quick Action */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>توقيت القاهرة:</span>
              <span className="font-mono text-slate-900 font-bold" dir="ltr">{cairoTime}</span>
            </div>

            <button
              onClick={onOpenQuickAdd}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all hover:shadow-blue-500/25 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عميل بصريات جديد</span>
            </button>
          </div>

          {/* Right Action Icons: Sound Alarm Test, Notifications, User Profile */}
          <div className="flex items-center gap-3">
            {/* Alarm Sound Tester */}
            <button
              onClick={() => alarmAudio.playReminderChime()}
              title="تجربة صوت جرس التنبيه (Web Audio Synth)"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden lg:inline text-[11px] font-semibold">اختبار الجرس</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="تنبيهات المتابعات والمواعيد"
              >
                <Bell className="w-5 h-5" />
                {pendingReminders.length > 0 && (
                  <span className={`absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                    dueReminders.length > 0 ? 'bg-rose-600 animate-ping' : 'bg-blue-600'
                  }`}>
                    {pendingReminders.length}
                  </span>
                )}
                {pendingReminders.length > 0 && dueReminders.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white bg-rose-600">
                    {pendingReminders.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden text-right animate-in fade-in duration-150">
                  <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      مواعيد ومتابعات اليوم ({pendingReminders.length})
                    </span>
                    <button
                      onClick={() => alarmAudio.playReminderChime()}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Volume2 className="w-3 h-3" /> رنين
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {pendingReminders.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        لا توجد مواعيد معلقة حالياً 🎉
                      </div>
                    ) : (
                      pendingReminders.map(rem => (
                        <div
                          key={rem.id}
                          className="p-3 hover:bg-blue-50/50 cursor-pointer transition-colors"
                          onClick={() => {
                            setShowNotifications(false);
                            onOpenAlarmModal(rem);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-xs font-bold text-slate-900">{rem.shopName}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                              {rem.type === 'call' ? '📞 مكالمة' : rem.type === 'visit' ? '🚗 زيارة' : '💻 ديمو'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{rem.title}</p>
                          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                            <span>المسؤول: {rem.userName}</span>
                            <span className="font-mono text-blue-700 font-semibold" dir="ltr">
                              {new Date(rem.dueTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Active User Menu / Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500">{currentUser.email}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden text-right">
                  <div className="p-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono" dir="ltr">{currentUser.email}</p>
                    <div className="mt-1">{getRoleBadge(currentUser.role)}</div>
                  </div>

                  {/* Switch user role / profile */}
                  <div className="p-2 border-b border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500 px-2 py-1">تبديل المستخدم أو الصلاحية:</p>
                    <div className="space-y-1">
                      {allUsers.map(user => (
                        <button
                          key={user.id}
                          onClick={() => {
                            onSwitchUser(user);
                            setShowUserMenu(false);
                          }}
                          className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            user.id === currentUser.id
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>{user.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {user.role === 'super_admin' ? 'Super Admin' : user.role === 'sales_manager' ? 'Manager' : 'Rep'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-right px-2.5 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>تسجيل الخروج من الحساب</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Tab Navigation */}
        <div className="flex space-x-1 space-x-reverse overflow-x-auto py-1 scrollbar-none border-t border-slate-100">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
