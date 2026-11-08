import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanEgyptianPhone,
  calculateOpticsLeadScore,
  filterLeadsByRole,
  findDuplicatePhoneMap,
  calculateDashboardKPIs
} from '../utils/crmLogic.ts';
import { Lead, User } from '../types/crm.ts';

test('cleanEgyptianPhone normalizes various Egyptian phone formats', () => {
  assert.equal(cleanEgyptianPhone('+201006999636'), '01006999636');
  assert.equal(cleanEgyptianPhone('0100-699-9636'), '01006999636');
  assert.equal(cleanEgyptianPhone('201114348247'), '01114348247');
  assert.equal(cleanEgyptianPhone('00201227292077'), '01227292077');
  assert.equal(cleanEgyptianPhone('0227959994'), '0227959994');
});

test('calculateOpticsLeadScore increases score for multi-branch, manual system, and interested status', () => {
  const interestedLead: Partial<Lead> = {
    status: 'interested',
    rating: 4.8,
    opticsSpecs: {
      branchesCount: 3,
      cashiersCount: 2,
      pcsCount: 2,
      currentSystem: 'دفتري يدوي',
      hasLab: true,
      hasOptometrist: true,
      dailyPrescriptionsAvg: 25,
      interestLevel: 'عالي جداً',
      painPoints: []
    }
  };

  const result = calculateOpticsLeadScore(interestedLead);
  assert.ok(result.score >= 80, `Expected high score for high value lead, got ${result.score}`);
  assert.ok(result.factors.some(f => f.includes('فروع')));
  assert.ok(result.factors.some(f => f.includes('دفتري')));

  const coldLead: Partial<Lead> = {
    status: 'not_interested',
    opticsSpecs: {
      branchesCount: 1,
      cashiersCount: 1,
      pcsCount: 1,
      currentSystem: 'برنامج حديث',
      hasLab: false,
      hasOptometrist: false,
      dailyPrescriptionsAvg: 5,
      interestLevel: 'منخفض',
      painPoints: []
    }
  };

  const coldResult = calculateOpticsLeadScore(coldLead);
  assert.ok(coldResult.score < 30, `Expected low score for uninterested lead, got ${coldResult.score}`);
});

test('filterLeadsByRole isolates sales rep data and grants full access to super_admin and sales_manager', () => {
  const dummyLeads: Lead[] = [
    {
      id: 'lead-1',
      name: 'محل 1',
      shopName: 'نظارات النور',
      phone: '01000000001',
      alternatePhones: [],
      governorate: 'القاهرة',
      city: 'عابدين',
      address: 'شارع قصر النيل',
      status: 'interested',
      originalColor: 'red',
      stage: 'new',
      priority: 'high',
      source: 'test',
      leadScore: 80,
      assignedTo: { id: 'rep-1', name: 'أحمد', email: 'ahmed@zntra.com' },
      createdAt: new Date().toISOString(),
      opticsSpecs: { branchesCount: 1, cashiersCount: 1, pcsCount: 1, currentSystem: '', hasLab: false, hasOptometrist: false, dailyPrescriptionsAvg: 10, interestLevel: '', painPoints: [] }
    },
    {
      id: 'lead-2',
      name: 'محل 2',
      shopName: 'نظارات النيل',
      phone: '01000000002',
      alternatePhones: [],
      governorate: 'الجيزة',
      city: 'الدقي',
      address: 'ميدان المساحة',
      status: 'not_contacted',
      originalColor: 'white',
      stage: 'new',
      priority: 'medium',
      source: 'test',
      leadScore: 50,
      assignedTo: { id: 'rep-2', name: 'سارة', email: 'sara@zntra.com' },
      createdAt: new Date().toISOString(),
      opticsSpecs: { branchesCount: 1, cashiersCount: 1, pcsCount: 1, currentSystem: '', hasLab: false, hasOptometrist: false, dailyPrescriptionsAvg: 10, interestLevel: '', painPoints: [] }
    }
  ];

  const adminUser: User = {
    id: 'admin-1',
    name: 'Admin',
    email: 'admin@gmail.com',
    role: 'super_admin',
    isActive: true,
    createdAt: ''
  };

  const rep1User: User = {
    id: 'rep-1',
    name: 'أحمد',
    email: 'ahmed@zntra.com',
    role: 'sales_rep',
    isActive: true,
    createdAt: ''
  };

  assert.equal(filterLeadsByRole(dummyLeads, adminUser).length, 2);
  assert.equal(filterLeadsByRole(dummyLeads, rep1User).length, 1);
  assert.equal(filterLeadsByRole(dummyLeads, rep1User)[0].id, 'lead-1');
});

test('findDuplicatePhoneMap detects leads sharing the same phone number', () => {
  const leads: Lead[] = [
    { id: '1', phone: '01006999636', name: 'A', shopName: '', alternatePhones: [], governorate: '', city: '', address: '', status: 'interested', originalColor: 'red', stage: 'new', priority: 'high', source: '', leadScore: 50, assignedTo: { id: '', name: '', email: '' }, createdAt: '', opticsSpecs: { branchesCount: 1, cashiersCount: 1, pcsCount: 1, currentSystem: '', hasLab: false, hasOptometrist: false, dailyPrescriptionsAvg: 10, interestLevel: '', painPoints: [] } },
    { id: '2', phone: '+20 100-699-9636', name: 'B', shopName: '', alternatePhones: [], governorate: '', city: '', address: '', status: 'no_answer', originalColor: 'brown', stage: 'new', priority: 'medium', source: '', leadScore: 50, assignedTo: { id: '', name: '', email: '' }, createdAt: '', opticsSpecs: { branchesCount: 1, cashiersCount: 1, pcsCount: 1, currentSystem: '', hasLab: false, hasOptometrist: false, dailyPrescriptionsAvg: 10, interestLevel: '', painPoints: [] } },
    { id: '3', phone: '01227292077', name: 'C', shopName: '', alternatePhones: [], governorate: '', city: '', address: '', status: 'not_contacted', originalColor: 'white', stage: 'new', priority: 'low', source: '', leadScore: 50, assignedTo: { id: '', name: '', email: '' }, createdAt: '', opticsSpecs: { branchesCount: 1, cashiersCount: 1, pcsCount: 1, currentSystem: '', hasLab: false, hasOptometrist: false, dailyPrescriptionsAvg: 10, interestLevel: '', painPoints: [] } }
  ];

  const duplicates = findDuplicatePhoneMap(leads);
  assert.equal(duplicates.size, 1);
  assert.equal(duplicates.get('01006999636')?.length, 2);
});

test('calculateDashboardKPIs computes stats and conversion accurately', () => {
  const leads: Lead[] = [
    { id: '1', status: 'interested', stage: 'won', dealValue: 15000, governorate: 'القاهرة', assignedTo: { id: 'r1', name: 'أحمد', email: '' } } as Lead,
    { id: '2', status: 'interested', stage: 'demo_scheduled', dealValue: 12000, governorate: 'الجيزة', assignedTo: { id: 'r1', name: 'أحمد', email: '' } } as Lead,
    { id: '3', status: 'not_contacted', stage: 'new', dealValue: 10000, governorate: 'القاهرة', assignedTo: { id: 'r2', name: 'سارة', email: '' } } as Lead
  ];

  const kpis = calculateDashboardKPIs(leads);
  assert.equal(kpis.total, 3);
  assert.equal(kpis.wonCount, 1);
  assert.equal(kpis.totalWonValue, 15000);
  assert.equal(kpis.govCounts['القاهرة'], 2);
  assert.equal(kpis.repStats.length, 2);
});
