import { AuditLogEntry, InteractionLog, Lead, Quotation, ReminderItem, User } from '../types/crm';
import initialLeadsData from '../data/initialLeads.json';
import { cleanEgyptianPhone, calculateOpticsLeadScore } from './crmLogic';

const OLD_STORAGE_KEYS = [
  'zntra_crm_leads_v2',
  'zntra_crm_users_v2',
  'zntra_crm_current_user_v2',
  'zntra_crm_interactions_v2',
  'zntra_crm_reminders_v2',
  'zntra_crm_quotes_v2',
  'zntra_crm_audit_v2',
];

const STORAGE_KEYS = {
  LEADS: 'zntra_crm_leads_v3_clean',
  USERS: 'zntra_crm_users_v3_clean',
  CURRENT_USER: 'zntra_crm_current_user_v3_clean',
  INTERACTIONS: 'zntra_crm_interactions_v3_clean',
  REMINDERS: 'zntra_crm_reminders_v3_clean',
  QUOTES: 'zntra_crm_quotes_v3_clean',
  AUDIT_LOGS: 'zntra_crm_audit_v3_clean',
};

// Purge legacy v2 dummy data from browser localStorage
try {
  OLD_STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
} catch {
  // Ignore storage errors in restricted environments
}

export const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'المدير العام (Admin)',
    email: 'admin@gmail.com',
    password: '12121212ydam',
    role: 'super_admin',
    phone: '',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export const PDF_INITIAL_LEADS: Lead[] = initialLeadsData as unknown as Lead[];

function normalizeNameForMatch(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^a-z0-9\u0621-\u064A]/g, '');
}

/**
 * Applies exact cell colors & statuses from the attached PDF file (optical_shops_cairo_giza (1).pdf)
 * to any existing leads in localStorage or Excel imports.
 */
export function applyPdfColorsToLeads(leads: Lead[]): Lead[] {
  if (!Array.isArray(leads) || leads.length === 0) {
    return PDF_INITIAL_LEADS;
  }

  // Build lookup maps from PDF_INITIAL_LEADS (prefer colored entries when duplicate phones exist)
  const byPhone = new Map<string, Lead>();
  const byName = new Map<string, Lead>();

  for (const pdfLead of PDF_INITIAL_LEADS) {
    const cleanP = cleanEgyptianPhone(pdfLead.phone);
    if (cleanP) {
      const existing = byPhone.get(cleanP);
      if (!existing || (existing.originalColor === 'white' && pdfLead.originalColor !== 'white')) {
        byPhone.set(cleanP, pdfLead);
      }
    }
    const normN = normalizeNameForMatch(pdfLead.shopName || pdfLead.name);
    if (normN) {
      const existing = byName.get(normN);
      if (!existing || (existing.originalColor === 'white' && pdfLead.originalColor !== 'white')) {
        byName.set(normN, pdfLead);
      }
    }
  }

  const updatedLeads = leads.map((lead, idx) => {
    const safeAssignedTo =
      lead.assignedTo && typeof lead.assignedTo === 'object' && lead.assignedTo.email
        ? lead.assignedTo
        : {
            id: 'user-admin',
            name: 'المدير العام (Admin)',
            email: 'admin@gmail.com'
          };

    const cleanP = cleanEgyptianPhone(lead.phone);
    const normN = normalizeNameForMatch(lead.shopName || lead.name);

    let matchedPdf: Lead | undefined;
    if (leads.length === PDF_INITIAL_LEADS.length && PDF_INITIAL_LEADS[idx]) {
      matchedPdf = PDF_INITIAL_LEADS[idx];
    } else if (normN && byName.has(normN)) {
      matchedPdf = byName.get(normN);
    } else if (cleanP && byPhone.has(cleanP)) {
      matchedPdf = byPhone.get(cleanP);
    }

    if (matchedPdf && !lead.lastContactDate) {
      const updated: Lead = {
        ...lead,
        assignedTo: safeAssignedTo,
        originalColor: matchedPdf.originalColor,
        status: matchedPdf.status,
        stage: matchedPdf.stage,
        priority: matchedPdf.priority,
        opticsSpecs: {
          ...(lead.opticsSpecs || matchedPdf.opticsSpecs),
          interestLevel:
            matchedPdf.status === 'interested'
              ? 'عالي جداً'
              : matchedPdf.status === 'not_interested'
              ? 'منخفض'
              : 'متوسط'
        }
      };
      updated.leadScore = calculateOpticsLeadScore(updated).score;
      return updated;
    }

    return {
      ...lead,
      assignedTo: safeAssignedTo
    };
  });

  // If the previous Excel import skipped rows without phone numbers, append any missing colored PDF leads
  const existingNames = new Set(updatedLeads.map(l => normalizeNameForMatch(l.shopName || l.name)));
  for (const pdfLead of PDF_INITIAL_LEADS) {
    const normN = normalizeNameForMatch(pdfLead.shopName || pdfLead.name);
    if (normN && !existingNames.has(normN)) {
      updatedLeads.push(pdfLead);
      existingNames.add(normN);
    }
  }

  return updatedLeads;
}

export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const adminExists = parsed.some((u: User) => u.email.toLowerCase() === 'admin@gmail.com');
    if (!adminExists) {
      const merged = [DEFAULT_USERS[0], ...parsed];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  const defaultUser = DEFAULT_USERS[0];
  setCurrentUser(defaultUser);
  return defaultUser;
}

export function setCurrentUser(user: User | null): void {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  } else {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }
}

export function getStoredLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEADS);
    if (raw) {
      const leads = JSON.parse(raw);
      if (Array.isArray(leads) && leads.length > 0) {
        const synced = applyPdfColorsToLeads(leads);
        localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(synced));
        return synced;
      }
    }
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(PDF_INITIAL_LEADS));
  return PDF_INITIAL_LEADS;
}

export function saveLeads(leads: Lead[]): void {
  localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
}

export function getStoredInteractions(): InteractionLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INTERACTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(STORAGE_KEYS.INTERACTIONS, JSON.stringify([]));
  return [];
}

export function saveInteractions(logs: InteractionLog[]): void {
  localStorage.setItem(STORAGE_KEYS.INTERACTIONS, JSON.stringify(logs));
}

export function getStoredReminders(): ReminderItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify([]));
  return [];
}

export function saveReminders(reminders: ReminderItem[]): void {
  localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
}

export function getStoredQuotes(): Quotation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUOTES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveQuotes(quotes: Quotation[]): void {
  localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
}

export function getStoredAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
  return [];
}

export function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
  const current = getStoredAuditLogs();
  const newEntry: AuditLogEntry = {
    ...entry,
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString()
  };
  const updated = [newEntry, ...current].slice(0, 500);
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
}
