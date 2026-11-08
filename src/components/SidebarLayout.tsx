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
  ChevronRight,
  ChevronLeft,
  Plus,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';

interface SidebarLayoutProps {
  currentUser: User;
  allUsers: User[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchUser: (user: User) => void;
  onLogout: () => void;
  reminders: ReminderItem[];
  onOpenQuickAdd: () => void;
  onOpenAlarmModal: (reminder: ReminderItem) => void;
  totalLeadsCount: number;
  interestedLeadsCount: number;
  children: React.ReactNode;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  currentUser,
  allUsers,
  activeTab,
  setActiveTab,
  onSwitchUser,
  onLogout,
  reminders,
  onOpenQuickAdd,
  onOpenAlarmModal,
  totalLeadsCount,
  interestedLeadsCount,
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cairoTime, setCairoTime] = useState(getCairoCurrentTimeFormatted());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCairoTime(getCairoCurrentTimeFormatted());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pendingReminders = reminders.filter(r => !r.completed);
  const dueReminders = pendingReminders.filter(r => new Date(r.dueTime).getTime() <= Date.now() + 60000);

  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, badge: null },
    { id: 'leads', label: 'إدارة العملاء', icon: Glasses, badge: totalLeadsCount },
    { id: 'pipeline', label: 'مراحل البيع (Kanban)', icon: Kanban, badge: interestedLeadsCount },
    { id: 'calendar', label: 'التقويم والمواعيد', icon: Calendar, badge: pendingReminders.length || null },
    { id: 'excel', label: 'استيراد وتصدير إكسيل', icon: FileSpreadsheet, badge: null },
    ...(currentUser.role === 'super_admin' || currentUser.role === 'sales_manager'
      ? [{ id: 'team', label: 'فريق العمل والتوزيع', icon: Users, badge: allUsers.length }]
      : []),
    { id: 'ai', label: 'مساعد Zntra الذكي', icon: Bot, badge: 'AI' },
    ...(currentUser.role === 'super_admin'
      ? [{ id: 'audit', label: 'سجل العمليات', icon: History, badge: null }]
      : []),
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">مدير عام النظام</span>;
      case 'sales_manager':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">مدير المبيعات</span>;
      case 'sales_rep':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">مسؤول مبيعات</span>;
      default:
        return null;
    }
  };

  const currentTabObj = navItems.find(i => i.id === activeTab) || navItems[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-['Cairo',sans-serif]" dir="rtl">
      {/* Mobile Sidebar Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Right-Hand RTL Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 right-0 z-50 h-screen bg-slate-900 text-white flex flex-col border-l border-slate-800 transition-all duration-300 select-none shrink-0 ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
              <Glasses className="w-6 h-6 stroke-[2.2]" />
            </div>
            {!isCollapsed && (
              <div className="whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-tight text-white">Zntra CRM</span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Optics OS
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">نظام مبيعات البصريات</p>
              </div>
            )}
          </div>

          {/* Collapse Button (Desktop) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
          >
            {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {/* Close Button (Mobile) */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Add Lead CTA inside Sidebar */}
        <div className="p-3 border-b border-slate-800/80">
          <button
            onClick={() => {
              onOpenQuickAdd();
              setMobileOpen(false);
            }}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all active:scale-95 ${
              isCollapsed ? 'px-0' : ''
            }`}
            title="إضافة محل نظارات جديد"
          >
            <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" />
            {!isCollapsed && <span>إضافة عميل بصريات جديد</span>}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-none">
          {!isCollapsed && (
            <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              القائمة الرئيسية
            </div>
          )}
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge !== null && (
                  <span
                    className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white text-blue-700'
                        : item.badge === 'AI'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom User Profile & Quick Switcher in Sidebar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
                {currentUser.name.charAt(0)}
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <div className="text-xs font-extrabold text-white truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate" dir="ltr">
                    {currentUser.email}
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={onLogout}
                title="تسجيل الخروج"
                className="p-2 text-rose-400 hover:text-white hover:bg-rose-600 rounded-lg transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center justify-between pt-1">
              {getRoleBadge(currentUser.role)}
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5 font-bold"
              >
                <span>تبديل الحساب</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Quick Role Switcher Popup inside Sidebar */}
          {!isCollapsed && showUserMenu && (
            <div className="pt-2 mt-2 border-t border-slate-800 space-y-1 max-h-44 overflow-y-auto">
              <p className="text-[10px] text-slate-400 font-bold px-1">اختر حساباً للتبديل الفوري:</p>
              {allUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    onSwitchUser(u);
                    setShowUserMenu(false);
                  }}
                  className={`w-full text-right px-2 py-1.5 rounded-lg text-[11px] flex items-center justify-between transition-colors ${
                    u.id === currentUser.id
                      ? 'bg-blue-600/30 text-blue-200 font-bold border border-blue-500/40'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="truncate">{u.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {u.role === 'super_admin' ? 'Admin' : u.role === 'sales_manager' ? 'Manager' : 'Rep'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Clean Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Right side: Mobile menu button + Active Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <currentTabObj.icon className="w-5 h-5 text-blue-600 hidden sm:block" />
              <h1 className="text-base sm:text-lg font-black text-slate-900">
                {currentTabObj.label}
              </h1>
            </div>
          </div>

          {/* Left side: Cairo Clock, Alarm Sound Test, Notifications Bell, Logout */}
          <div className="flex items-center gap-2.5">
            {/* Cairo Live Clock */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span className="text-slate-500">توقيت القاهرة:</span>
              <span className="font-mono text-slate-900 font-extrabold" dir="ltr">{cairoTime}</span>
            </div>

            {/* Test Alarm Button */}
            <button
              onClick={() => alarmAudio.playReminderChime()}
              title="اختبار جرس التنبيه الصوتي"
              className="px-2.5 py-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <Volume2 className="w-4 h-4 text-blue-600" />
              <span className="hidden md:inline">اختبار الجرس</span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                title="مواعيد ومتابعات اليوم"
              >
                <Bell className="w-5 h-5" />
                {pendingReminders.length > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                      dueReminders.length > 0 ? 'bg-rose-600 animate-bounce' : 'bg-blue-600'
                    }`}
                  >
                    {pendingReminders.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-right">
                  <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800">
                      مواعيد ومتابعات اليوم ({pendingReminders.length})
                    </span>
                    <button
                      onClick={() => alarmAudio.playReminderChime()}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Volume2 className="w-3 h-3" /> رنين الجرس
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
                            <span className="text-xs font-extrabold text-slate-900">{rem.shopName}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                              {rem.type === 'call' ? '📞 مكالمة' : rem.type === 'visit' ? '🚗 زيارة' : '💻 ديمو'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{rem.title}</p>
                          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                            <span>المسؤول: {rem.userName}</span>
                            <span className="font-mono text-blue-700 font-bold" dir="ltr">
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
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
