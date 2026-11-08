import React, { useState } from 'react';
import { User } from '../types/crm';
import { Glasses, Lock, Mail, ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthScreenProps {
  allUsers: User[];
  onLoginSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ allUsers, onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('12121212ydam');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const user = allUsers.find(
      u => u.email.toLowerCase().trim() === email.toLowerCase().trim()
    );

    if (!user) {
      setError('البريد الإلكتروني غير مسجل في النظام. تأكد من إدخال admin@gmail.com');
      return;
    }

    if (user.password && user.password !== password) {
      setError('كلمة المرور غير صحيحة. كلمة مرور حساب المدير العام هي: 12121212ydam');
      return;
    }

    if (!user.isActive) {
      setError('هذا الحساب معطل حالياً من قبل الإدارة.');
      return;
    }

    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Background glowing subtle effects */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 mb-4">
          <Glasses className="w-9 h-9 stroke-[2.2]" />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white">
          Zntra Optics OS
        </h2>
        <p className="mt-2 text-sm text-slate-400 font-medium">
          نظام إدارة المبيعات وفريق العمل المخصص لمحلات ومراكز البصريات
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-700/80">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  className="block w-full pr-10 pl-3.5 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  dir="ltr"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pr-10 pl-3.5 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
            >
              <span>تسجيل الدخول للنظام</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Security Notice */}
        <p className="mt-4 text-center text-xs text-slate-500">
          Zntra Optics OS CRM v2.4 • نظام مصمم خصيصاً لسوق البصريات والنظارات في مصر
        </p>
      </div>
    </div>
  );
};
