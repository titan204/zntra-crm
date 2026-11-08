export type UserRole = 'super_admin' | 'sales_manager' | 'sales_rep';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  assignedGovernorates?: string[];
  createdAt: string;
}

export type LeadStatus = 'interested' | 'not_interested' | 'no_answer' | 'not_contacted';

export type PipelineStage = 
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'demo_scheduled'
  | 'proposal_sent'
  | 'negotiation'
  | 'won'
  | 'lost';

export type LeadPriority = 'high' | 'medium' | 'low';

export interface OpticsSpecs {
  branchesCount: number;
  cashiersCount: number;
  pcsCount: number;
  currentSystem: string; // e.g. "دفتري يدوي", "إكسيل شيت", "برنامج محلي قديم", "لا يوجد"
  hasLab: boolean;
  hasOptometrist: boolean;
  dailyPrescriptionsAvg: number;
  interestLevel: string;
  painPoints: string[];
}

export interface Quotation {
  id: string;
  planName: 'Optics OS Basic' | 'Optics OS Pro' | 'Optics OS Enterprise';
  basePrice: number;
  discount: number;
  finalPrice: number;
  annualMaintenance: number;
  includesHardware: boolean;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface InteractionLog {
  id: string;
  leadId: string;
  userId: string;
  userName: string;
  type: 'call' | 'whatsapp' | 'meeting' | 'demo' | 'visit' | 'note' | 'status_change';
  outcome?: string; // 'رد ومهتم', 'لم يرد', 'مشغول', 'طلب تواصل لاحقاً', etc.
  notes: string;
  timestamp: string;
  nextFollowUpDate?: string;
  audioDurationSeconds?: number;
}

export interface ReminderItem {
  id: string;
  leadId: string;
  leadName: string;
  shopName: string;
  phone: string;
  userId: string;
  userName: string;
  title: string;
  dueTime: string; // ISO string
  type: 'call' | 'demo' | 'meeting' | 'visit';
  completed: boolean;
  snoozedUntil?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Lead {
  id: string;
  name: string;
  shopName: string;
  phone: string;
  alternatePhones: string[];
  governorate: string;
  city: string;
  address: string;
  googleMapsUrl?: string;
  rating?: number;
  status: LeadStatus;
  originalColor: 'red' | 'yellow' | 'brown' | 'white';
  stage: PipelineStage;
  priority: LeadPriority;
  source: string;
  pageInPdf?: number;
  leadScore: number;
  assignedTo: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  notes?: string;
  opticsSpecs: OpticsSpecs;
  dealValue?: number;
  lostReason?: string;
}

export interface DuplicateLeadRecord {
  id: string;
  name: string;
  phone: string;
  address: string;
  originalLeadId: string;
  page?: number;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

export interface ImportSummary {
  totalProcessed: number;
  totalImported: number;
  duplicatesFound: number;
  missingDataCount: number;
  errors: string[];
  colorBreakdown: {
    red: number;
    yellow: number;
    brown: number;
    white: number;
  };
}
