import * as XLSX from 'xlsx';
import { Lead, LeadPriority, LeadStatus, PipelineStage } from '../types/crm';
import { cleanEgyptianPhone, calculateOpticsLeadScore } from './crmLogic';
import { PDF_INITIAL_LEADS } from './storage';

export interface ParsedImportResult {
  leads: Lead[];
  duplicates: {
    row: number;
    name: string;
    phone: string;
    existingLead?: Lead;
    reason: string;
  }[];
  missingData: {
    row: number;
    issues: string[];
    raw: unknown;
  }[];
  totalRows: number;
  colorCounts: {
    red: number;
    yellow: number;
    brown: number;
    white: number;
  };
}

function normalizeName(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^a-z0-9\u0621-\u064A]/g, '');
}

function classifyHexColor(rgbHex?: string): 'red' | 'yellow' | 'brown' | 'white' | null {
  if (!rgbHex) return null;
  const clean = rgbHex.replace(/^#/, '').trim().toUpperCase();
  const hex6 = clean.length === 8 ? clean.slice(2) : clean;
  if (hex6.length !== 6 || hex6 === 'FFFFFF' || hex6 === '000000') return null;

  const r = parseInt(hex6.slice(0, 2), 16);
  const g = parseInt(hex6.slice(2, 4), 16);
  const b = parseInt(hex6.slice(4, 6), 16);

  if (r > 200 && g < 80 && b < 80) return 'red';
  if (r > 200 && g > 200 && b < 100) return 'yellow';
  if (r > 240 && g > 240 && b > 240) return 'white';
  return 'brown';
}

/**
 * Parses uploaded Excel / CSV file into Zntra CRM Leads and matches colors from both
 * Excel cell styles and the reference PDF color map.
 */
export async function parseExcelUpload(
  file: File,
  existingLeads: Lead[],
  assignedUser: { id: string; name: string; email: string }
): Promise<ParsedImportResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellStyles: true });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

  // Build PDF color lookup maps
  const pdfByPhone = new Map<string, Lead>();
  const pdfByName = new Map<string, Lead>();
  for (const pdfLead of PDF_INITIAL_LEADS) {
    const cp = cleanEgyptianPhone(pdfLead.phone);
    if (cp) {
      const prev = pdfByPhone.get(cp);
      if (!prev || (prev.originalColor === 'white' && pdfLead.originalColor !== 'white')) {
        pdfByPhone.set(cp, pdfLead);
      }
    }
    const nn = normalizeName(pdfLead.shopName || pdfLead.name);
    if (nn) {
      const prev = pdfByName.get(nn);
      if (!prev || (prev.originalColor === 'white' && pdfLead.originalColor !== 'white')) {
        pdfByName.set(nn, pdfLead);
      }
    }
  }

  const existingPhoneMap = new Map<string, Lead>();
  existingLeads.forEach(l => {
    const clean = cleanEgyptianPhone(l.phone);
    if (clean) existingPhoneMap.set(clean, l);
  });

  const parsedLeads: Lead[] = [];
  const duplicates: ParsedImportResult['duplicates'] = [];
  const missingData: ParsedImportResult['missingData'] = [];
  const colorCounts = { red: 0, yellow: 0, brown: 0, white: 0 };
  const seenInFile = new Set<string>();

  jsonData.forEach((row, idx) => {
    const rowNum = idx + 2;

    const name = String(
      row['اسم العميل'] || row['الاسم'] || row['اسم المحل'] || row['محل النظارات'] || row['المحل'] || row['Name'] || row['Shop'] || ''
    ).trim();

    const phone = String(
      row['رقم الهاتف'] || row['الهاتف'] || row['الموبايل'] || row['رقم الموبايل'] || row['Phone'] || row['Mobile'] || ''
    ).trim();

    const address = String(
      row['العنوان'] || row['العنوان بالتفصيل'] || row['الموقع'] || row['Address'] || ''
    ).trim();

    const gov = String(
      row['المحافظة'] || row['محافظة'] || row['المنطقة'] || row['Governorate'] || ''
    ).trim() || 'القاهرة';

    const city = String(
      row['المدينة'] || row['المنطقة'] || row['City'] || row['Area'] || ''
    ).trim() || 'وسط البلد';

    const statusRaw = String(
      row['الحالة'] || row['اللون'] || row['Status'] || row['Color'] || ''
    ).trim().toLowerCase();

    if (!name) {
      missingData.push({ row: rowNum, issues: ['اسم المحل/العميل مفقود'], raw: row });
      return;
    }

    if (!phone) {
      missingData.push({ row: rowNum, issues: ['رقم الهاتف غير متوفر في هذا الصف'], raw: row });
    }

    const cleanPhone = cleanEgyptianPhone(phone);
    const normName = normalizeName(name);

    // 1. Check cell style color in worksheet (columns A or B on rowNum)
    let detectedColor: 'red' | 'yellow' | 'brown' | 'white' | null = null;
    for (const colLetter of ['A', 'B', 'C']) {
      const cellRef = `${colLetter}${rowNum}`;
      const cellObj = worksheet[cellRef] as { s?: { fgColor?: { rgb?: string }; bgColor?: { rgb?: string } } } | undefined;
      const rgb = cellObj?.s?.fgColor?.rgb || cellObj?.s?.bgColor?.rgb;
      const classified = classifyHexColor(rgb);
      if (classified && classified !== 'white') {
        detectedColor = classified;
        break;
      }
    }

    // 2. Check text column if provided
    if (!detectedColor) {
      if (statusRaw.includes('أحمر') || statusRaw.includes('red') || statusRaw.includes('مهتم') || statusRaw.includes('interested')) {
        detectedColor = 'red';
      } else if (statusRaw.includes('أصفر') || statusRaw.includes('yellow') || statusRaw.includes('غير مهتم') || statusRaw.includes('not interested')) {
        detectedColor = 'yellow';
      } else if (statusRaw.includes('بني') || statusRaw.includes('brown') || statusRaw.includes('لم يرد') || statusRaw.includes('no answer')) {
        detectedColor = 'brown';
      }
    }

    // 3. Match against PDF reference color map (by phone, name, or exact row index)
    if (!detectedColor) {
      const pdfMatch =
        (cleanPhone && pdfByPhone.get(cleanPhone)) ||
        (normName && pdfByName.get(normName)) ||
        (PDF_INITIAL_LEADS[idx] && normalizeName(PDF_INITIAL_LEADS[idx].shopName) === normName ? PDF_INITIAL_LEADS[idx] : undefined);
      if (pdfMatch && pdfMatch.originalColor !== 'white') {
        detectedColor = pdfMatch.originalColor;
      }
    }

    const originalColor: 'red' | 'yellow' | 'brown' | 'white' = detectedColor || 'white';
    let status: LeadStatus = 'not_contacted';
    let stage: PipelineStage = 'new';
    let priority: LeadPriority = 'medium';

    if (originalColor === 'red') {
      status = 'interested';
      stage = 'qualified';
      priority = 'high';
      colorCounts.red++;
    } else if (originalColor === 'yellow') {
      status = 'not_interested';
      stage = 'lost';
      priority = 'low';
      colorCounts.yellow++;
    } else if (originalColor === 'brown') {
      status = 'no_answer';
      stage = 'contacted';
      priority = 'medium';
      colorCounts.brown++;
    } else {
      status = 'not_contacted';
      stage = 'new';
      priority = 'medium';
      colorCounts.white++;
    }

    if (cleanPhone && seenInFile.has(cleanPhone)) {
      duplicates.push({
        row: rowNum,
        name,
        phone,
        reason: 'مكرر داخل نفس الملف المرفوع',
      });
      return;
    }

    if (cleanPhone && existingPhoneMap.has(cleanPhone)) {
      duplicates.push({
        row: rowNum,
        name,
        phone,
        existingLead: existingPhoneMap.get(cleanPhone),
        reason: 'مسجل مسبقاً في قاعدة بيانات CRM',
      });
      return;
    }

    if (cleanPhone) {
      seenInFile.add(cleanPhone);
    }

    const leadId = `lead-import-${Date.now()}-${idx}`;
    const newLead: Lead = {
      id: leadId,
      name,
      shopName: name,
      phone,
      alternatePhones: [],
      governorate: gov,
      city,
      address: address || `${gov}، جمهورية مصر العربية`,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}`,
      status,
      originalColor,
      stage,
      priority,
      source: `استيراد إكسيل (${file.name})`,
      leadScore: 60,
      dealValue: Number(row['قيمة الصفقة'] || row['السعر'] || row['Deal Value'] || 0) || 0,
      assignedTo: assignedUser,
      createdAt: new Date().toISOString(),
      notes: String(row['ملاحظات'] || row['الملاحظات'] || row['Notes'] || ''),
      opticsSpecs: {
        branchesCount: Number(row['عدد الفروع'] || row['الفروع']) || 1,
        cashiersCount: 1,
        pcsCount: 1,
        currentSystem: String(row['النظام الحالي'] || 'غير محدد'),
        hasLab: false,
        hasOptometrist: false,
        dailyPrescriptionsAvg: 0,
        interestLevel: status === 'interested' ? 'عالي جداً' : status === 'not_interested' ? 'منخفض' : 'متوسط',
        painPoints: []
      }
    };

    newLead.leadScore = calculateOpticsLeadScore(newLead).score;
    parsedLeads.push(newLead);
  });

  return {
    leads: parsedLeads,
    duplicates,
    missingData,
    totalRows: jsonData.length,
    colorCounts
  };
}

/**
 * Exports leads to real Excel file (.xlsx)
 */
export function exportLeadsToExcel(leads: Lead[], filename = 'Zntra_Optics_OS_Leads.xlsx') {
  const exportRows = leads.map(l => ({
    'معرف العميل': l.id,
    'اسم المحل / العميل': l.shopName || l.name,
    'رقم الهاتف الأساسي': l.phone,
    'المحافظة': l.governorate,
    'المنطقة / المدينة': l.city,
    'العنوان بالتفصيل': l.address,
    'حالة التواصل': l.status === 'interested' ? 'مهتم (أحمر)' : (l.status === 'no_answer' ? 'لم يرد (بني)' : (l.status === 'not_interested' ? 'غير مهتم (أصفر)' : 'لم يتم التواصل (أبيض)')),
    'مرحلة البيع': l.stage,
    'الأولوية': l.priority === 'high' ? 'عالية' : (l.priority === 'medium' ? 'متوسطة' : 'منخفضة'),
    'درجة العميل (Optics Score)': l.leadScore,
    'المسؤول من المبيعات': l.assignedTo.name,
    'عدد الفروع': l.opticsSpecs?.branchesCount || 1,
    'النظام الحالي': l.opticsSpecs?.currentSystem || 'غير محدد',
    'تاريخ الإضافة': l.createdAt ? new Date(l.createdAt).toLocaleDateString('ar-EG') : '',
    'آخر تواصل': l.lastContactDate ? new Date(l.lastContactDate).toLocaleDateString('ar-EG') : 'لا يوجد',
    'الملاحظات': l.notes || '',
    'رابط خرائط جوجل': l.googleMapsUrl || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'عملاء البصريات Zntra');
  XLSX.writeFile(workbook, filename);
}

/**
 * Downloads a sample template Excel file
 */
export function downloadExcelTemplate() {
  const templateRows = [
    {
      'اسم المحل': 'مركز المصطفى للبصريات',
      'رقم الهاتف': '01006999636',
      'المحافظة': 'القاهرة',
      'المدينة': 'عابدين',
      'العنوان بالتفصيل': 'حارة الشيخ فرج، الساحة، عابدين، محافظة القاهرة',
      'الحالة': 'أصفر (غير مهتم)',
      'عدد الفروع': 1,
      'النظام الحالي': 'غير محدد',
      'ملاحظات': ''
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'نموذج استيراد العملاء');
  XLSX.writeFile(workbook, 'Zntra_Optics_Import_Template.xlsx');
}
