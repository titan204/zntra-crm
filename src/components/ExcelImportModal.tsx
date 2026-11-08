import React, { useState } from 'react';
import { Lead, User } from '../types/crm';
import { parseExcelUpload, ParsedImportResult, downloadExcelTemplate } from '../utils/excelService';
import {
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Flame,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ExcelImportModalProps {
  existingLeads: Lead[];
  currentUser: User;
  onImportComplete: (newLeads: Lead[], reportSummary: string) => void;
  onClose: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  existingLeads,
  currentUser,
  onImportComplete,
  onClose
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedImportResult | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update' | 'keep_both'>('skip');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setIsProcessing(true);

    try {
      const result = await parseExcelUpload(selected, existingLeads, {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email
      });
      setParsedResult(result);
    } catch (err) {
      console.error('Error parsing file:', err);
      alert('حدث خطأ أثناء قراءة ملف الإكسيل. تأكد من أن الملف سليم وبصيغة .xlsx أو .csv');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedResult) return;
    
    // Finalize import based on duplicate strategy
    let finalLeads = [...parsedResult.leads];
    if (duplicateStrategy === 'keep_both') {
      // Also add duplicate records as secondary leads
      const duplicateLeads: Lead[] = parsedResult.duplicates.map((dup, i) => ({
        id: `lead-dup-import-${Date.now()}-${i}`,
        name: dup.name,
        shopName: dup.name,
        phone: dup.phone,
        alternatePhones: [],
        governorate: 'القاهرة',
        city: 'وسط البلد',
        address: 'مكرر من الاستيراد',
        status: 'not_contacted',
        originalColor: 'white',
        stage: 'new',
        priority: 'medium',
        source: 'مستورد مكرر',
        leadScore: 40,
        assignedTo: { id: currentUser.id, name: currentUser.name, email: currentUser.email },
        createdAt: new Date().toISOString(),
        notes: `تم الإبقاء على هذا العميل كمكرر: ${dup.reason}`,
        opticsSpecs: {
          branchesCount: 1,
          cashiersCount: 1,
          pcsCount: 1,
          currentSystem: 'دفتري يدوي',
          hasLab: false,
          hasOptometrist: false,
          dailyPrescriptionsAvg: 10,
          interestLevel: 'منخفض',
          painPoints: []
        }
      }));
      finalLeads = [...finalLeads, ...duplicateLeads];
    }

    const report = `تم استيراد ${finalLeads.length} عميل جديد بنجاح. تم اكتشاف ${parsedResult.duplicates.length} أرقام مكررة وتطبيق خيار (${duplicateStrategy === 'skip' ? 'تخطي المكرر' : 'الإبقاء على المكرر'}).`;
    onImportComplete(finalLeads, report);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold">استيراد وتدقيق ملف إكسيل العملاء</h3>
              <p className="text-xs text-slate-300">
                فحص تطابق أرقام الهواتف، توزيع الألوان والحالات، وتوليد تقرير الاستيراد
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Step 1: Upload or Download Template */}
          <div className="p-5 border-2 border-dashed border-slate-300 rounded-2xl text-center bg-slate-50/70 hover:bg-slate-50 transition-colors">
            <Upload className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <span className="font-extrabold text-sm text-slate-800 block mb-1">
              اختر أو اسحب ملف Excel (.xlsx / .csv)
            </span>
            <p className="text-slate-500 mb-3 text-[11px]">
              يتعرف النظام تلقائياً على أعمدة: اسم المحل، رقم الهاتف، المحافظة، العنوان، والحالة/اللون
            </p>

            <div className="flex items-center justify-center gap-3">
              <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs">
                <span>اختيار ملف من جهازك</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={downloadExcelTemplate}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>تحميل نموذج إكسيل فارغ (Template)</span>
              </button>
            </div>

            {file && (
              <div className="mt-3 text-xs font-bold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-lg inline-block">
                تم تحميل الملف: {file.name}
              </div>
            )}
          </div>

          {/* Step 2: Audit & Inspection Report */}
          {parsedResult && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>تقرير فحص وتدقيق البيانات المستوردة:</span>
                </h4>

                {/* KPI numbers */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-bold">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">إجمالي الصفوف</span>
                    <span className="text-lg font-mono text-slate-900">{parsedResult.totalRows}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                    <span className="text-emerald-700 block text-[10px]">جاهزة للإضافة</span>
                    <span className="text-lg font-mono text-emerald-700">{parsedResult.leads.length}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                    <span className="text-amber-800 block text-[10px]">أرقام مكررة</span>
                    <span className="text-lg font-mono text-amber-800">{parsedResult.duplicates.length}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-rose-200">
                    <span className="text-rose-700 block text-[10px]">بيانات ناقصة</span>
                    <span className="text-lg font-mono text-rose-700">{parsedResult.missingData.length}</span>
                  </div>
                </div>

                {/* Color Status breakdown */}
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-2">توزيع الحالات حسب ألوان الملف:</span>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="px-2 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                      🔴 مهتم: {parsedResult.colorCounts.red}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                      🟤 لم يرد: {parsedResult.colorCounts.brown}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200 font-bold">
                      🟡 غير مهتم: {parsedResult.colorCounts.yellow}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                      ⚪ لم يتم التواصل: {parsedResult.colorCounts.white}
                    </span>
                  </div>
                </div>

                {/* Duplicate Policy Selection */}
                {parsedResult.duplicates.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>كيف ترغب في التعامل مع العملاء المكررين ({parsedResult.duplicates.length})؟</span>
                    </div>

                    <div className="space-y-1.5 pr-6 text-slate-700 font-medium">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="duplicateStrategy"
                          checked={duplicateStrategy === 'skip'}
                          onChange={() => setDuplicateStrategy('skip')}
                          className="text-blue-600"
                        />
                        <span>(مستحسن) استبعاد المكرر والإبقاء على بيانات العميل المسجل مسبقاً</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="duplicateStrategy"
                          checked={duplicateStrategy === 'keep_both'}
                          onChange={() => setDuplicateStrategy('keep_both')}
                          className="text-blue-600"
                        />
                        <span>إضافة العميل المكرر في سجل منفصل مع تمييزه بملاحظة</span>
                      </label>
                    </div>

                    {/* Preview first 3 duplicates */}
                    <div className="mt-2 pt-2 border-t border-amber-200/60 max-h-32 overflow-y-auto space-y-1">
                      {parsedResult.duplicates.slice(0, 5).map((d, idx) => (
                        <div key={idx} className="text-[10px] text-amber-900 bg-white/70 p-1.5 rounded flex justify-between">
                          <span>{d.name} ({d.phone})</span>
                          <span>{d.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs"
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={!parsedResult || parsedResult.leads.length === 0}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs disabled:opacity-50 transition-all"
          >
            تأكيد استيراد البيانات إلى CRM
          </button>
        </div>
      </div>
    </div>
  );
};
