import React, { useEffect } from 'react';
import { ReminderItem } from '../types/crm';
import { alarmAudio } from '../utils/alarmService';
import { createWhatsAppLink, createTelLink } from '../utils/crmLogic';
import { Bell, Volume2, Phone, MessageSquare, Clock, CheckCircle2, X } from 'lucide-react';

interface AlarmModalProps {
  reminder: ReminderItem;
  onClose: () => void;
  onSnooze: (reminderId: string, minutes: number) => void;
  onComplete: (reminderId: string) => void;
}

export const AlarmModal: React.FC<AlarmModalProps> = ({
  reminder,
  onClose,
  onSnooze,
  onComplete
}) => {
  useEffect(() => {
    // Play chime upon opening
    alarmAudio.playReminderChime();
    const interval = setInterval(() => {
      alarmAudio.playReminderChime();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-rose-400 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Pulsing Alarm Banner */}
        <div className="p-6 bg-gradient-to-r from-rose-600 to-red-600 text-white text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-white/20 mx-auto flex items-center justify-center mb-3 animate-bounce">
            <Bell className="w-8 h-8 text-white animate-pulse" />
          </div>
          <span className="text-xs uppercase tracking-wider font-extrabold bg-white/20 px-3 py-1 rounded-full">
            تنبيه موعد مستحق الآن!
          </span>
          <h2 className="text-xl font-black mt-2">{reminder.shopName || reminder.leadName}</h2>
          <p className="text-xs text-rose-100 mt-1 font-mono" dir="ltr">{reminder.phone}</p>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-500 block">المهمة المطلوبة:</span>
            <p className="font-extrabold text-slate-900 text-sm">{reminder.title}</p>
            <div className="flex items-center gap-2 text-slate-500 pt-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>المسؤول: {reminder.userName}</span>
            </div>
          </div>

          {/* Instant Connect Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={createWhatsAppLink(reminder.phone, reminder.shopName, reminder.userName)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all text-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>محادثة واتساب</span>
            </a>

            <a
              href={createTelLink(reminder.phone)}
              className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all text-xs"
            >
              <Phone className="w-4 h-4" />
              <span>اتصال هاتفي</span>
            </a>
          </div>

          {/* Alarm controls */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => onSnooze(reminder.id, 10)}
              className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>تأجيل 10 دقائق (Snooze)</span>
            </button>

            <button
              onClick={() => onComplete(reminder.id)}
              className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>تمت المهمة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
