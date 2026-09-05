import { BudgetCategory } from '../types';
import { BudgetVersionRecord, RoleApprovalItem, STANDARD_APPROVAL_ROLES } from '../components/BudgetApprovalWidget';
import { saveDocData } from '../services/firebaseService';

// In-memory versions store (Server-synced)
const memoryVersionsCache: Record<string, BudgetVersionRecord[]> = {};

// Format auto version string e.g. AUTO-VRSNXVBSA000001
export function formatVersionCode(sequence: number): string {
  const padded = String(sequence).padStart(6, '0');
  return `AUTO-VRSNXVBSA${padded}`;
}

// Generate default approvals array depending on creator role
export function initializeApprovalsForCreator(creatorRole: string): RoleApprovalItem[] {
  const normCreator = creatorRole.toUpperCase();

  // Standard hierarchy list
  return STANDARD_APPROVAL_ROLES.map(roleName => {
    if (roleName === normCreator) {
      return { role: roleName, status: 'CREATOR' };
    }

    if (normCreator.includes('PRODUCTION MANAGER') || normCreator.includes('PROD_MANAGER') || normCreator === 'PRODUCTION MANAGER') {
      // Production Manager sends to Production Controller, Head Accountant, Commercial Head, Executive Producer, Associate Producer, Producer
      if (['PRODUCER', 'ASSOCIATE PRODUCER', 'EXECUTIVE PRODUCER', 'COMMERCIAL HEAD', 'HEAD ACCOUNTANT', 'PRODUCTION CONTROLLER'].includes(roleName)) {
        return { role: roleName, status: 'SEND' };
      }
    } else if (normCreator.includes('EXECUTIVE PRODUCER') || normCreator === 'EXECUTIVE PRODUCER') {
      // Executive Producer sends to Associate Producer and Producer
      if (['PRODUCER', 'ASSOCIATE PRODUCER'].includes(roleName)) {
        return { role: roleName, status: 'SEND' };
      }
    } else if (normCreator.includes('PRODUCER') && !normCreator.includes('ASSOCIATE') && !normCreator.includes('EXECUTIVE')) {
      // Producer changes are auto-approved
      return { role: roleName, status: 'APPROVED' };
    } else {
      // Default fallback for other roles
      return { role: roleName, status: 'SEND' };
    }

    return { role: roleName, status: '' };
  });
}

// Load versions for a project from memory or Firestore
export function loadProjectBudgetVersions(projectId: string, defaultTotalAmount = 0): BudgetVersionRecord[] {
  if (!projectId) return [];

  if (memoryVersionsCache[projectId] && memoryVersionsCache[projectId].length > 0) {
    return memoryVersionsCache[projectId];
  }

  // Create initial baseline version V1
  const initialV1: BudgetVersionRecord = {
    id: `v_init_${projectId}_1`,
    versionName: formatVersionCode(1),
    versionNumber: 1,
    projectId,
    creatorRole: 'Production Manager',
    creatorName: 'Production Team',
    status: 'Approved',
    totalAmount: defaultTotalAmount,
    approvals: STANDARD_APPROVAL_ROLES.map(r => ({ role: r, status: r === 'PRODUCTION MANAGER' ? 'CREATOR' : 'APPROVED' })),
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  memoryVersionsCache[projectId] = [initialV1];
  setTimeout(() => {
    saveDocData('budgetVersions', projectId, { versions: [initialV1] });
  }, 100);
  return [initialV1];
}

// Save versions array to Firestore & memory cache
export function saveProjectBudgetVersions(projectId: string, versions: BudgetVersionRecord[]): void {
  if (!projectId) return;
  memoryVersionsCache[projectId] = versions;
  saveDocData('budgetVersions', projectId, { versions });
}

// Create a new budget version whenever budget changes are saved
export function createNewBudgetVersion(
  projectId: string,
  categories: BudgetCategory[],
  creatorRole = 'Production Manager',
  existingVersions?: BudgetVersionRecord[]
): { updatedVersions: BudgetVersionRecord[]; newVersion: BudgetVersionRecord } {
  const versions = existingVersions || loadProjectBudgetVersions(projectId);
  const nextSeq = versions.length + 1;
  const versionCode = formatVersionCode(nextSeq);

  // Calculate new total amount from categories rollups
  const totalAmount = categories.reduce((sum, cat) => {
    const subs = cat.subCategories || [];
    const catAlloc = subs.length > 0
      ? subs.reduce((sSum, s) => {
          const childs = s.childCategories || [];
          return sSum + (childs.length > 0 ? childs.reduce((cSum, ch) => cSum + (Number(ch.allocatedAmount) || 0), 0) : (Number(s.allocatedAmount) || 0));
        }, 0)
      : (Number(cat.allocatedAmount) || 0);
    return sum + catAlloc;
  }, 0);

  const initialApprovals = initializeApprovalsForCreator(creatorRole);
  const isAutoApproved = initialApprovals.every(a => a.status === 'APPROVED' || a.status === 'CREATOR' || a.status === '');

  const newVersion: BudgetVersionRecord = {
    id: `v_${projectId}_${Date.now()}`,
    versionName: versionCode,
    versionNumber: nextSeq,
    projectId,
    creatorRole,
    creatorName: `${creatorRole} User`,
    status: isAutoApproved ? 'Approved' : 'Under Review',
    totalAmount,
    approvals: initialApprovals,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    approvedAt: isAutoApproved ? new Date().toISOString().replace('T', ' ').substring(0, 19) : undefined
  };

  const updatedVersions = [newVersion, ...versions];
  saveProjectBudgetVersions(projectId, updatedVersions);

  return { updatedVersions, newVersion };
}

// Send approval for a specific role or all roles
export function updateApprovalSendStatus(
  version: BudgetVersionRecord,
  targetRole?: string
): BudgetVersionRecord {
  const updatedApprovals = version.approvals.map(item => {
    if (targetRole) {
      if (item.role === targetRole && item.status === 'SEND') {
        return { ...item, status: 'PENDING' as const };
      }
    } else {
      if (item.status === 'SEND') {
        return { ...item, status: 'PENDING' as const };
      }
    }
    return item;
  });

  return {
    ...version,
    approvals: updatedApprovals
  };
}

// Approve a role in the approval chain
export function grantRoleApproval(
  version: BudgetVersionRecord,
  roleToApprove: string
): { updatedVersion: BudgetVersionRecord; isNowFullyApproved: boolean } {
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const updatedApprovals = version.approvals.map(item => {
    if (item.role === roleToApprove) {
      return {
        ...item,
        status: 'APPROVED' as const,
        approvedAt: nowStr
      };
    }
    return item;
  });

  // Check if all non-creator/non-empty roles are now approved
  const requiredRoles = updatedApprovals.filter(a => a.status !== '' && a.status !== 'CREATOR');
  const isNowFullyApproved = requiredRoles.every(a => a.status === 'APPROVED');

  const updatedVersion: BudgetVersionRecord = {
    ...version,
    approvals: updatedApprovals,
    status: isNowFullyApproved ? 'Approved' : version.status,
    approvedAt: isNowFullyApproved ? nowStr : version.approvedAt
  };

  return { updatedVersion, isNowFullyApproved };
}
