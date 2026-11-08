import React, { useState, useEffect } from 'react';
import {
  AuditLogEntry,
  InteractionLog,
  Lead,
  LeadStatus,
  PipelineStage,
  ReminderItem,
  User
} from './types/crm';
import {
  getCurrentUser,
  getStoredAuditLogs,
  getStoredInteractions,
  getStoredLeads,
  getStoredReminders,
  getStoredUsers,
  logAuditEvent,
  saveInteractions,
  saveLeads,
  saveReminders,
  saveUsers,
  setCurrentUser,
  applyPdfColorsToLeads,
  PDF_INITIAL_LEADS
} from './utils/storage';
import { filterLeadsByRole, calculateOpticsLeadScore } from './utils/crmLogic';
import { alarmAudio } from './utils/alarmService';
import { SidebarLayout } from './components/SidebarLayout';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { LeadsView } from './components/LeadsView';
import { PipelineBoard } from './components/PipelineBoard';
import { CalendarView } from './components/CalendarView';
import { ExcelImportModal } from './components/ExcelImportModal';
import { TeamManagement } from './components/TeamManagement';
import { AiAssistantModal } from './components/AiAssistantModal';
import { AuditLogView } from './components/AuditLogView';
import { QuickCallModal } from './components/QuickCallModal';
import { LeadDetailModal } from './components/LeadDetailModal';
import { AddLeadModal } from './components/AddLeadModal';
import { AlarmModal } from './components/AlarmModal';

export default function App() {
  const [allUsers, setAllUsers] = useState<User[]>(getStoredUsers());
  const [currentUser, setCurrentUserState] = useState<User | null>(getCurrentUser());
  const [leads, setLeads] = useState<Lead[]>(getStoredLeads());
  const [interactions, setInteractions] = useState<InteractionLog[]>(getStoredInteractions());
  const [reminders, setReminders] = useState<ReminderItem[]>(getStoredReminders());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(getStoredAuditLogs());

  // Active view tab
  const [activeTab, setActiveTab] = useState('dashboard');
  const [statusFilterInLeads, setStatusFilterInLeads] = useState<string>('all');

  // Modals state
  const [selectedLeadFor360, setSelectedLeadFor360] = useState<Lead | null>(null);
  const [quickCallLead, setQuickCallLead] = useState<Lead | null>(null);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [activeAlarmReminder, setActiveAlarmReminder] = useState<ReminderItem | null>(null);

  // Background reminder checker for audible alarm
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const due = reminders.find(
        r => !r.completed && new Date(r.dueTime).getTime() <= now && (!r.snoozedUntil || new Date(r.snoozedUntil).getTime() <= now)
      );

      if (due && !activeAlarmReminder) {
        setActiveAlarmReminder(due);
        alarmAudio.playUrgentAlarm();
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [reminders, activeAlarmReminder]);

  // Handle Authentication
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentUserState(user);
    logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'تسجيل دخول للنظام',
      target: 'جلسة المستخدم',
      details: `تم تسجيل الدخول بنجاح بحساب (${user.email}).`
    });
    setAuditLogs(getStoredAuditLogs());
  };

  const handleLogout = () => {
    if (currentUser) {
      logAuditEvent({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'تسجيل خروج',
        target: 'جلسة المستخدم',
        details: 'قام المستخدم بتسجيل الخروج من النظام.'
      });
    }
    setCurrentUser(null);
    setCurrentUserState(null);
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    setCurrentUserState(user);
    logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'تبديل الحساب النشط',
      target: 'صلاحيات المستخدم',
      details: `تم التبديل إلى حساب (${user.name} - ${user.role}).`
    });
    setAuditLogs(getStoredAuditLogs());
  };

  // Filter leads based on user role isolation
  const visibleLeads = currentUser ? filterLeadsByRole(leads, currentUser) : [];

  // Update lead
  const handleUpdateLead = (updated: Lead) => {
    const nextLeads = leads.map(l => (l.id === updated.id ? updated : l));
    setLeads(nextLeads);
    saveLeads(nextLeads);

    if (selectedLeadFor360 && selectedLeadFor360.id === updated.id) {
      setSelectedLeadFor360(updated);
    }
  };

  // Quick Call logging
  const handleSaveQuickCall = (data: {
    status: LeadStatus;
    stage: PipelineStage;
    outcome: string;
    notes: string;
    followUpDate?: string;
  }) => {
    if (!quickCallLead || !currentUser) return;

    const originalColor: 'red' | 'brown' | 'yellow' | 'white' = data.status === 'interested' ? 'red' :
      data.status === 'no_answer' ? 'brown' :
      data.status === 'not_interested' ? 'yellow' : 'white';

    const updatedLead: Lead = {
      ...quickCallLead,
      status: data.status,
      originalColor,
      stage: data.stage,
      lastContactDate: new Date().toISOString(),
      nextFollowUpDate: data.followUpDate,
      notes: data.notes ? `${quickCallLead.notes || ''}\n${data.notes}` : quickCallLead.notes,
      leadScore: calculateOpticsLeadScore({ ...quickCallLead, status: data.status }).score
    };

    handleUpdateLead(updatedLead);

    // Save interaction log
    const newLog: InteractionLog = {
      id: `log-${Date.now()}`,
      leadId: quickCallLead.id,
      userId: currentUser.id,
      userName: currentUser.name,
      type: 'call',
      outcome: data.outcome,
      notes: data.notes,
      timestamp: new Date().toISOString(),
      nextFollowUpDate: data.followUpDate
    };

    const nextInteractions = [newLog, ...interactions];
    setInteractions(nextInteractions);
    saveInteractions(nextInteractions);

    // Schedule reminder if follow-up set
    if (data.followUpDate) {
      const newReminder: ReminderItem = {
        id: `rem-${Date.now()}`,
        leadId: quickCallLead.id,
        leadName: quickCallLead.name,
        shopName: quickCallLead.shopName,
        phone: quickCallLead.phone,
        userId: currentUser.id,
        userName: currentUser.name,
        title: `متابعة: ${data.outcome}`,
        dueTime: data.followUpDate,
        type: 'call',
        completed: false,
        priority: 'high'
      };
      const nextReminders = [newReminder, ...reminders];
      setReminders(nextReminders);
      saveReminders(nextReminders);
    }

    logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'تسجيل مكالمة سريعة',
      target: quickCallLead.shopName,
      details: `تم تحديث الحالة إلى (${data.status}) والنتيجة: ${data.outcome}`
    });
    setAuditLogs(getStoredAuditLogs());
  };

  // Bulk Reassign Leads
  const handleBulkAssign = (leadIds: string[], rep: { id: string; name: string; email: string }) => {
    if (!currentUser) return;
    const nextLeads = leads.map(l => {
      if (leadIds.includes(l.id)) {
        return {
          ...l,
          assignedTo: rep
        };
      }
      return l;
    });

    setLeads(nextLeads);
    saveLeads(nextLeads);

    logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'إعادة تعيين مجمعة للعملاء',
      target: `${leadIds.length} محل نظارات`,
      details: `تم نقل وإسناد ${leadIds.length} عميل إلى (${rep.name}).`
    });
    setAuditLogs(getStoredAuditLogs());
  };

  // Bulk Status Change
  const handleBulkStatusChange = (leadIds: string[], newStatus: LeadStatus) => {
    if (!currentUser) return;
    const originalColor: 'red' | 'brown' | 'yellow' | 'white' = newStatus === 'interested' ? 'red' :
      newStatus === 'no_answer' ? 'brown' :
      newStatus === 'not_interested' ? 'yellow' : 'white';

    const nextLeads = leads.map(l => {
      if (leadIds.includes(l.id)) {
        return {
          ...l,
          status: newStatus,
          originalColor,
          leadScore: calculateOpticsLeadScore({ ...l, status: newStatus }).score
        };
      }
      return l;
    });

    setLeads(nextLeads);
    saveLeads(nextLeads);

    logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'تغيير حالة مجمعة',
      target: `${leadIds.length} عميل`,
      details: `تم تغيير الحالة إلى (${newStatus}).`
    });
    setAuditLogs(getStoredAuditLogs());
  };

  // Round-robin distribution
  const handleDistributeRoundRobin = (batchCount: number) => {
    if (!currentUser) return;
    const reps = allUsers.filter(u => u.role === 'sales_rep');
    if (reps.length === 0) return;

    let distributed = 0;
    const nextLeads = [...leads];

    for (let i = 0; i < nextLeads.length && distributed < batchCount; i++) {
      if (nextLeads[i].status === 'not_contacted') {
        const targetRep = reps[distributed % reps.length];
        nextLeads[i] = {
          ...nextLeads[i],
          assignedTo: {
            id: targetRep.id,
            name: targetRep.name,
            email: targetRep.email
          }
        };
        distributed++;
      }
    }

    setLeads(nextLeads);
    saveLeads(nextLeads);

    logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'توزيع دوري تلقائي (Round-Robin)',
      target: `${distributed} عميل`,
      details: `تم توزيع ${distributed} عميل غير متصل بالتساوي بين ${reps.length} مندوب مبيعات.`
    });
    setAuditLogs(getStoredAuditLogs());
    alert(`تم توزيع ${distributed} عميل بنجاح بين فريق المبيعات!`);
  };

  // Render Auth screen if not logged in
  if (!currentUser) {
    return <AuthScreen allUsers={allUsers} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      <SidebarLayout
        currentUser={currentUser}
        allUsers={allUsers}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        reminders={reminders}
        onOpenQuickAdd={() => setShowAddLeadModal(true)}
        onOpenAlarmModal={rem => setActiveAlarmReminder(rem)}
        totalLeadsCount={visibleLeads.length}
        interestedLeadsCount={visibleLeads.filter(l => l.status === 'interested').length}
      >
        {activeTab === 'dashboard' && (
          <Dashboard
            leads={visibleLeads}
            currentUser={currentUser}
            onSelectLead={lead => setSelectedLeadFor360(lead)}
            onQuickCall={lead => setQuickCallLead(lead)}
            onViewAllLeads={statusFilter => {
              if (statusFilter) setStatusFilterInLeads(statusFilter);
              setActiveTab('leads');
            }}
          />
        )}

        {activeTab === 'leads' && (
          <LeadsView
            leads={visibleLeads}
            currentUser={currentUser}
            allUsers={allUsers}
            onSelectLead={lead => setSelectedLeadFor360(lead)}
            onQuickCall={lead => setQuickCallLead(lead)}
            onOpenAddModal={() => setShowAddLeadModal(true)}
            onUpdateLead={handleUpdateLead}
            onBulkAssign={handleBulkAssign}
            onBulkStatusChange={handleBulkStatusChange}
            initialStatusFilter={statusFilterInLeads}
          />
        )}

        {activeTab === 'pipeline' && (
          <PipelineBoard
            leads={visibleLeads}
            currentUser={currentUser}
            onSelectLead={lead => setSelectedLeadFor360(lead)}
            onUpdateLeadStage={(id, stage) => {
              const target = leads.find(l => l.id === id);
              if (target) {
                handleUpdateLead({ ...target, stage });
              }
            }}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            reminders={reminders}
            currentUser={currentUser}
            onAddReminder={newRem => {
              const r: ReminderItem = { ...newRem, id: `rem-${Date.now()}` };
              const updated = [r, ...reminders];
              setReminders(updated);
              saveReminders(updated);
            }}
            onToggleComplete={id => {
              const updated = reminders.map(r => (r.id === id ? { ...r, completed: !r.completed } : r));
              setReminders(updated);
              saveReminders(updated);
            }}
            onTriggerAlarm={rem => {
              setActiveAlarmReminder(rem);
              alarmAudio.playUrgentAlarm();
            }}
          />
        )}

        {activeTab === 'excel' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 mb-1">
                    إدارة ملفات إكسيل ومزامنة ألوان الملف الأصلي
                  </h2>
                  <p className="text-xs text-slate-500">
                    تم ربط وتطبيق ألوان الحالات تلقائياً من ملف (optical_shops_cairo_giza) على جميع محلات النظارات
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      const synced = applyPdfColorsToLeads(leads.length > 0 ? leads : PDF_INITIAL_LEADS);
                      setLeads(synced);
                      saveLeads(synced);
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    مزامنة ألوان الملف على البيانات الحالية
                  </button>
                  <button
                    onClick={() => {
                      setLeads(PDF_INITIAL_LEADS);
                      saveLeads(PDF_INITIAL_LEADS);
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    استعادة كامل بيانات وألوان الملف الأصلي ({PDF_INITIAL_LEADS.length} محل)
                  </button>
                  <button
                    onClick={() => setShowExcelModal(true)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    استيراد ملف إكسيل جديد
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs font-bold">
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between">
                  <span>🔴 أحمر (عميل محتمل / مهتم)</span>
                  <span className="font-mono text-base">{visibleLeads.filter(l => l.originalColor === 'red').length}</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between">
                  <span>🟤 بني (تم الاتصال ولم يرد)</span>
                  <span className="font-mono text-base">{visibleLeads.filter(l => l.originalColor === 'brown').length}</span>
                </div>
                <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-900 flex items-center justify-between">
                  <span>🟡 أصفر (غير مهتم حالياً)</span>
                  <span className="font-mono text-base">{visibleLeads.filter(l => l.originalColor === 'yellow').length}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-between">
                  <span>⚪ أبيض (لم يتم التواصل بعد)</span>
                  <span className="font-mono text-base">{visibleLeads.filter(l => l.originalColor === 'white').length}</span>
                </div>
              </div>
            </div>

            {/* Quick Leads Table embedded in excel view for verification */}
            <LeadsView
              leads={visibleLeads}
              currentUser={currentUser}
              allUsers={allUsers}
              onSelectLead={lead => setSelectedLeadFor360(lead)}
              onQuickCall={lead => setQuickCallLead(lead)}
              onOpenAddModal={() => setShowAddLeadModal(true)}
              onUpdateLead={handleUpdateLead}
              onBulkAssign={handleBulkAssign}
              onBulkStatusChange={handleBulkStatusChange}
            />
          </div>
        )}

        {activeTab === 'team' && (currentUser.role === 'super_admin' || currentUser.role === 'sales_manager') && (
          <TeamManagement
            allUsers={allUsers}
            leads={leads}
            currentUser={currentUser}
            onAddUser={newUser => {
              const u: User = { ...newUser, id: `user-${Date.now()}`, createdAt: new Date().toISOString() };
              const next = [...allUsers, u];
              setAllUsers(next);
              saveUsers(next);
            }}
            onUpdateUser={updatedUser => {
              const next = allUsers.map(u => (u.id === updatedUser.id ? updatedUser : u));
              setAllUsers(next);
              saveUsers(next);
            }}
            onDistributeRoundRobin={handleDistributeRoundRobin}
          />
        )}

        {activeTab === 'ai' && <AiAssistantModal />}

        {activeTab === 'audit' && currentUser.role === 'super_admin' && (
          <AuditLogView logs={auditLogs} />
        )}
      </SidebarLayout>

      {/* MODAL 1: Quick Call Logger */}
      {quickCallLead && (
        <QuickCallModal
          lead={quickCallLead}
          currentUser={currentUser}
          onClose={() => setQuickCallLead(null)}
          onSaveCall={handleSaveQuickCall}
        />
      )}

      {/* MODAL 2: Full Customer 360 */}
      {selectedLeadFor360 && (
        <LeadDetailModal
          lead={selectedLeadFor360}
          currentUser={currentUser}
          interactions={interactions}
          onClose={() => setSelectedLeadFor360(null)}
          onUpdateLead={handleUpdateLead}
          onAddInteraction={newLog => {
            const entry: InteractionLog = {
              ...newLog,
              id: `log-${Date.now()}`,
              timestamp: new Date().toISOString()
            };
            const updated = [entry, ...interactions];
            setInteractions(updated);
            saveInteractions(updated);
          }}
        />
      )}

      {/* MODAL 3: Add Lead Modal */}
      {showAddLeadModal && (
        <AddLeadModal
          currentUser={currentUser}
          allUsers={allUsers}
          onClose={() => setShowAddLeadModal(false)}
          onSaveLead={newLead => {
            const next = [newLead, ...leads];
            setLeads(next);
            saveLeads(next);
            logAuditEvent({
              userId: currentUser.id,
              userName: currentUser.name,
              userRole: currentUser.role,
              action: 'إضافة عميل بصريات جديد يدوياً',
              target: newLead.shopName,
              details: `تمت إضافة المحل في (${newLead.governorate} - ${newLead.city}) بحالة (${newLead.status}).`
            });
            setAuditLogs(getStoredAuditLogs());
          }}
        />
      )}

      {/* MODAL 4: Excel Import Modal */}
      {showExcelModal && (
        <ExcelImportModal
          existingLeads={leads}
          currentUser={currentUser}
          onClose={() => setShowExcelModal(false)}
          onImportComplete={(importedLeads, report) => {
            const next = [...importedLeads, ...leads];
            setLeads(next);
            saveLeads(next);
            logAuditEvent({
              userId: currentUser.id,
              userName: currentUser.name,
              userRole: currentUser.role,
              action: 'استيراد عملاء من إكسيل',
              target: `${importedLeads.length} محل`,
              details: report
            });
            setAuditLogs(getStoredAuditLogs());
            alert(report);
          }}
        />
      )}

      {/* MODAL 5: Alarm / Follow-up Ringing Modal */}
      {activeAlarmReminder && (
        <AlarmModal
          reminder={activeAlarmReminder}
          onClose={() => setActiveAlarmReminder(null)}
          onSnooze={(id, minutes) => {
            const snoozedTime = new Date(Date.now() + minutes * 60000).toISOString();
            const next = reminders.map(r => (r.id === id ? { ...r, snoozedUntil: snoozedTime } : r));
            setReminders(next);
            saveReminders(next);
            setActiveAlarmReminder(null);
          }}
          onComplete={id => {
            const next = reminders.map(r => (r.id === id ? { ...r, completed: true } : r));
            setReminders(next);
            saveReminders(next);
            setActiveAlarmReminder(null);
          }}
        />
      )}
    </>
  );
}
