import { Lead, LeadStatus, User, UserRole } from '../types/crm';

/**
 * Normalizes Egyptian phone number format (removes spaces, dashes, +2, etc.)
 */
export function cleanEgyptianPhone(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('+20')) {
    cleaned = '0' + cleaned.substring(3);
  } else if (cleaned.startsWith('20') && cleaned.length > 10) {
    cleaned = '0' + cleaned.substring(2);
  } else if (cleaned.startsWith('0020')) {
    cleaned = '0' + cleaned.substring(4);
  }
  return cleaned;
}

/**
 * Calculates Optics OS Lead Score (0 - 100) with explainable factors
 */
export function calculateOpticsLeadScore(lead: Partial<Lead>): { score: number; factors: string[] } {
  let score = 30; // base score
  const factors: string[] = ['النقاط الأساسية للمحل: +30'];

  // Status weight
  if (lead.status === 'interested') {
    score += 35;
    factors.push('عميل مهتم (اللون الأحمر): +35');
  } else if (lead.status === 'no_answer') {
    score += 5;
    factors.push('لم يرد يحتاج متابعة (اللون البني): +5');
  } else if (lead.status === 'not_interested') {
    score -= 15;
    factors.push('أبدى عدم اهتمام حالياً (اللون الأصفر): -15');
  }

  // Optics Specs weight
  const specs = lead.opticsSpecs;
  if (specs) {
    if (specs.branchesCount > 1) {
      const branchBonus = Math.min(20, specs.branchesCount * 5);
      score += branchBonus;
      factors.push(`سلسلة فروع (${specs.branchesCount} فروع تحتاج مزامنة): +${branchBonus}`);
    }

    if (specs.currentSystem === 'دفتري يدوي' || specs.currentSystem === 'إكسيل شيت') {
      score += 15;
      factors.push('نظام بدائي (دفتري/إكسيل) يحتاج للتحول الرقمي فوراً: +15');
    }

    if (specs.dailyPrescriptionsAvg && specs.dailyPrescriptionsAvg >= 15) {
      score += 10;
      factors.push(`حجم كشوفات يومية عالي (${specs.dailyPrescriptionsAvg} كشف): +10`);
    }

    if (specs.hasLab) {
      score += 5;
      factors.push('يمتلك معمل تقطيع عدسات خاص: +5');
    }
  }

  // High rating bonus (indicates active reputed store)
  if (lead.rating && lead.rating >= 4.3) {
    score += 5;
    factors.push(`تقييم عالي على خرائط جوجل (${lead.rating}★): +5`);
  }

  // Bound score between 0 and 100
  const finalScore = Math.min(100, Math.max(5, score));
  return { score: finalScore, factors };
}

/**
 * Filter leads based on user role security boundaries
 */
export function filterLeadsByRole(leads: Lead[], user: User): Lead[] {
  if (!user) return [];
  if (user.role === 'super_admin' || user.role === 'sales_manager') {
    return leads;
  }
  // Sales Rep: only see their assigned leads
  return leads.filter(lead => lead.assignedTo.id === user.id || lead.assignedTo.email === user.email);
}

/**
 * Detect duplicates by phone number
 */
export function findDuplicatePhoneMap(leads: Lead[]): Map<string, Lead[]> {
  const map = new Map<string, Lead[]>();
  for (const lead of leads) {
    const clean = cleanEgyptianPhone(lead.phone);
    if (!clean) continue;
    const existing = map.get(clean) || [];
    existing.push(lead);
    map.set(clean, existing);
  }
  
  // Keep only groups with more than 1 lead
  const duplicatesOnly = new Map<string, Lead[]>();
  for (const [phone, group] of map.entries()) {
    if (group.length > 1) {
      duplicatesOnly.set(phone, group);
    }
  }
  return duplicatesOnly;
}

/**
 * Calculates Dashboard KPIs from live leads
 */
export function calculateDashboardKPIs(leads: Lead[]) {
  const total = leads.length;
  const interested = leads.filter(l => l.status === 'interested').length;
  const notContacted = leads.filter(l => l.status === 'not_contacted').length;
  const noAnswer = leads.filter(l => l.status === 'no_answer').length;
  const notInterested = leads.filter(l => l.status === 'not_interested').length;

  const wonLeads = leads.filter(l => l.stage === 'won');
  const demoLeads = leads.filter(l => l.stage === 'demo_scheduled');
  const proposalLeads = leads.filter(l => l.stage === 'proposal_sent');

  const totalWonValue = wonLeads.reduce((acc, l) => acc + (l.dealValue || 0), 0);
  const pipelineValue = leads
    .filter(l => l.stage !== 'lost' && l.stage !== 'won')
    .reduce((acc, l) => acc + (l.dealValue || 0), 0);

  // Conversion rate (won / total contacted)
  const contactedTotal = total - notContacted;
  const conversionRate = contactedTotal > 0 ? ((wonLeads.length / contactedTotal) * 100).toFixed(1) : '0';

  // Governorate distribution
  const govCounts: Record<string, number> = {};
  leads.forEach(l => {
    const gov = l.governorate || 'أخرى';
    govCounts[gov] = (govCounts[gov] || 0) + 1;
  });

  // Rep performance
  const repStats: Record<string, { name: string; total: number; interested: number; won: number; calls: number }> = {};
  leads.forEach(l => {
    const repName = l.assignedTo.name || 'غير محدد';
    if (!repStats[repName]) {
      repStats[repName] = { name: repName, total: 0, interested: 0, won: 0, calls: 0 };
    }
    repStats[repName].total++;
    if (l.status === 'interested') repStats[repName].interested++;
    if (l.stage === 'won') repStats[repName].won++;
  });

  return {
    total,
    interested,
    notContacted,
    noAnswer,
    notInterested,
    wonCount: wonLeads.length,
    demoCount: demoLeads.length,
    proposalCount: proposalLeads.length,
    totalWonValue,
    pipelineValue,
    conversionRate,
    govCounts,
    repStats: Object.values(repStats),
  };
}

/**
 * Format currency to Egyptian Pounds
 */
export function formatEGP(amount: number): string {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generates an Egyptian WhatsApp direct link with Arabic encoded greeting
 */
export function createWhatsAppLink(phone: string, shopName: string, repName: string): string {
  const cleaned = cleanEgyptianPhone(phone);
  let intlPhone = cleaned;
  if (intlPhone.startsWith('0')) {
    intlPhone = '20' + intlPhone.substring(1);
  }
  const message = `السلام عليكم ورحمة الله، أستاذنا في ${shopName} 👓\nمعاك ${repName} من فريق أنظمة Zntra Optics OS المتخصصة في إدارة محلات ومراكز البصريات.\n\nكنا حابين نعرض لحضرتك حل لمشكلة مزامنة الفروع وكشوفات العدسات والشنابر بنظام سحابي ذكي. هل يناسبك موعد تجربة سريعة مجانية (Demo) هذا الأسبوع؟`;
  return `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates direct tel: protocol link
 */
export function createTelLink(phone: string): string {
  const cleaned = cleanEgyptianPhone(phone);
  return `tel:${cleaned}`;
}
