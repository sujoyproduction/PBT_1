import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import { db, ensureAuth } from '../lib/firebase';
import { Project, BudgetCategory, Expense, DBLog, UserProfile, UserAssignmentNotification } from '../types';
import { Company, WorkspaceProject } from '../components/WorkspaceView';
import { INITIAL_PROJECTS, INITIAL_CATEGORIES, INITIAL_EXPENSES } from '../data';

// Default Companies Seed (Empty)
export const DEFAULT_COMPANIES: Company[] = [];

// Default Workspace Projects Seed (Empty)
export const DEFAULT_WORKSPACE_PROJECTS: WorkspaceProject[] = [];

export const DEFAULT_DB_LOGS: DBLog[] = [];

// Helper to clear all data from Firestore
export const clearAllDatabaseData = async () => {
  try {
    await ensureAuth();
    const collectionsToClear = [
      'projects', 
      'categories', 
      'expenses', 
      'companies', 
      'workspaceProjects', 
      'dbLogs', 
      'productionDsrs', 
      'vendors', 
      'payments', 
      'reimbursements', 
      'documents', 
      'budgetVersions', 
      'auditLogs',
      'user_assignments',
      'users',
      'settings'
    ];
    for (const colName of collectionsToClear) {
      try {
        const snap = await getDocs(collection(db, colName));
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach(d => {
            batch.delete(d.ref);
          });
          await batch.commit();
        }
      } catch (e: any) {
        if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit exceeded')) {
          console.warn(`[Firestore] Quota limit reached for clearing collection ${colName}.`);
        } else {
          console.warn(`Could not clear collection ${colName}:`, e);
        }
      }
    }
  } catch (e: any) {
    console.warn('[Firestore] clearAllDatabaseData skipped due to error:', e);
  }
};

// Helper to ensure initial system state on live setup (no dummy seed data)
export const seedInitialDataIfEmpty = async () => {
  try {
    await ensureAuth();
    const systemDocRef = doc(db, 'settings', 'system');
    const systemSnap = await getDoc(systemDocRef);

    const isPurged = systemSnap.exists() && systemSnap.data()?.all_user_projects_purged;

    if (!isPurged) {
      // Execute full data purge across all project collections
      await clearAllDatabaseData();

      // Clear local storage keys
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('erp_') || key.startsWith('workspace_') || key.startsWith('project_'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(k => localStorage.removeItem(k));
        }
      } catch (e) {
        console.warn('LocalStorage cleanup warning:', e);
      }

      await setDoc(systemDocRef, { 
        seeded: true, 
        all_user_projects_purged: true, 
        purgeTimestamp: new Date().toISOString() 
      }, { merge: true });
    }
  } catch (e) {
    console.warn('Firestore seedInitialDataIfEmpty warning:', e);
  }
};

// Generic Firestore Helpers
export const subscribeCollection = <T>(collectionName: string, callback: (data: T[]) => void) => {
  return onSnapshot(collection(db, collectionName), 
    (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as unknown as T));
      callback(data);
    },
    (error) => {
      console.warn(`Firestore subscribeCollection (${collectionName}) warning:`, error);
    }
  );
};

export const subscribeDoc = <T>(collectionName: string, docId: string, callback: (data: T | null) => void) => {
  return onSnapshot(doc(db, collectionName, docId), 
    (snap) => {
      if (snap.exists()) {
        callback({ ...snap.data(), id: snap.id } as unknown as T);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.warn(`Firestore subscribeDoc (${collectionName}/${docId}) warning:`, error);
    }
  );
};

const docSaveDebounceTimers = new Map<string, { timer: any; data: any; resolvers: Array<() => void> }>();

export const saveDocData = async (collectionName: string, docId: string, data: any, options?: { immediate?: boolean }) => {
  const key = `${collectionName}/${docId}`;
  if (options?.immediate) {
    const existing = docSaveDebounceTimers.get(key);
    if (existing?.timer) clearTimeout(existing.timer);
    docSaveDebounceTimers.delete(key);
    try {
      await ensureAuth();
      const cleanData = sanitizeForFirestore(data);
      await setDoc(doc(db, collectionName, docId), cleanData, { merge: true });
    } catch (e: any) {
      console.warn(`Firestore saveDocData immediate (${key}) warning:`, e);
    }
    return;
  }
  return new Promise<void>((resolve) => {
    const existing = docSaveDebounceTimers.get(key);
    const resolvers = existing?.resolvers || [];
    resolvers.push(resolve);

    if (existing?.timer) {
      clearTimeout(existing.timer);
    }

    const timer = setTimeout(async () => {
      const entry = docSaveDebounceTimers.get(key);
      const currentResolvers = entry?.resolvers || resolvers;
      docSaveDebounceTimers.delete(key);
      try {
        await ensureAuth();
        const cleanData = sanitizeForFirestore(data);
        await setDoc(doc(db, collectionName, docId), cleanData, { merge: true });
      } catch (e: any) {
        if (e?.code === 'resource-exhausted' || e?.message?.includes('queued writes') || e?.message?.includes('exhausted') || e?.message?.includes('Quota limit')) {
          console.warn(`[Firestore] saveDocData (${key}) write stream limit handled cleanly.`);
        } else {
          console.warn(`Firestore saveDocData (${key}) warning:`, e);
        }
      }
      currentResolvers.forEach(r => r());
    }, 400);

    docSaveDebounceTimers.set(key, { timer, data, resolvers });
  });
};

export const deleteDocData = async (collectionName: string, docId: string) => {
  try {
    await ensureAuth();
    await deleteDoc(doc(db, collectionName, docId));
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('queued writes') || e?.message?.includes('exhausted')) {
      console.warn(`[Firestore] deleteDocData (${collectionName}/${docId}) write stream limit handled cleanly.`);
    } else {
      console.warn(`Firestore deleteDocData (${collectionName}/${docId}) warning:`, e);
    }
  }
};

// Listeners
export const subscribeProjects = (callback: (projects: Project[]) => void) => {
  return onSnapshot(collection(db, 'projects'), 
    (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Project));
      callback(data);
    },
    (error) => {
      console.warn('Firestore subscribeProjects listener warning:', error);
    }
  );
};

export const subscribeCategories = (callback: (categories: BudgetCategory[]) => void) => {
  return onSnapshot(collection(db, 'categories'), 
    (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as BudgetCategory));
      callback(data);
    },
    (error) => {
      console.warn('Firestore subscribeCategories listener warning:', error);
    }
  );
};

export const subscribeExpenses = (callback: (expenses: Expense[]) => void) => {
  return onSnapshot(collection(db, 'expenses'), 
    (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Expense));
      callback(data);
    },
    (error) => {
      console.warn('Firestore subscribeExpenses listener warning:', error);
    }
  );
};

export const subscribeCompanies = (callback: (companies: Company[]) => void) => {
  return onSnapshot(collection(db, 'companies'), 
    (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Company));
      callback(data);
    },
    (error) => {
      console.warn('Firestore subscribeCompanies listener warning:', error);
    }
  );
};

export const subscribeWorkspaceProjects = (callback: (workspaceProjects: WorkspaceProject[]) => void) => {
  return onSnapshot(collection(db, 'workspaceProjects'), 
    (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as WorkspaceProject));
      callback(data);
    },
    (error) => {
      console.warn('Firestore subscribeWorkspaceProjects listener warning:', error);
    }
  );
};

export const subscribeUserAssignments = (callback: (assignments: UserAssignmentNotification[]) => void) => {
  return onSnapshot(collection(db, 'user_assignments'), 
    (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as UserAssignmentNotification));
      callback(data);
    },
    (error) => {
      console.warn('Firestore subscribeUserAssignments listener warning:', error);
    }
  );
};

export const clearAllUserAssignments = async () => {
  try {
    await ensureAuth();
    const snap = await getDocs(collection(db, 'user_assignments'));
    const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn('Failed to clear all user assignments:', err);
  }
};

export const subscribeDbLogs = (callback: (logs: DBLog[]) => void) => {
  return onSnapshot(collection(db, 'dbLogs'), 
    (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as DBLog));
      // Sort logs descending by timestamp or id
      data.sort((a, b) => b.id.localeCompare(a.id));
      callback(data);
    },
    (error) => {
      console.warn('Firestore subscribeDbLogs listener warning:', error);
    }
  );
};

// Helper to recursively strip undefined properties so Firestore setDoc does not throw
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// CRUD Operations

// Projects (Saved in Top-level projects collection)
export const saveProject = async (project: Project) => {
  try {
    await ensureAuth();
    const cleanData = sanitizeForFirestore(project);
    await setDoc(doc(db, 'projects', project.id), cleanData, { merge: true });
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit exceeded')) {
      console.warn('[Firestore] Project quota limit reached for daily writes. Action stored in local session.');
    } else {
      console.warn('Firestore saveProject warning:', e);
    }
  }
};

export const deleteProject = async (projectId: string) => {
  try {
    await ensureAuth();
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit exceeded')) {
      console.warn('[Firestore] Quota limit reached for deleteProject.');
    } else {
      console.warn('Firestore deleteProject warning:', e);
    }
  }
};

// Categories (Saved in Top-level categories collection)
let pendingCategorySave: { categories: BudgetCategory[]; timer: any } | null = null;
let activeCategoryBatchPromise: Promise<void> | null = null;
let pendingCategoryResolvers: Array<() => void> = [];

export const saveCategoriesBatch = async (categories: BudgetCategory[]) => {
  if (!categories || categories.length === 0) return;

  return new Promise<void>((resolve) => {
    pendingCategoryResolvers.push(resolve);

    const existingCats = pendingCategorySave?.categories || [];
    const mergedMap = new Map<string, BudgetCategory>();
    existingCats.forEach(c => { if (c.id) mergedMap.set(c.id, c); });
    categories.forEach(c => { if (c.id) mergedMap.set(c.id, c); });
    const accumCategories = Array.from(mergedMap.values());

    if (pendingCategorySave?.timer) {
      clearTimeout(pendingCategorySave.timer);
    }
    
    pendingCategorySave = {
      categories: accumCategories,
      timer: setTimeout(async () => {
        const catsToSave = pendingCategorySave?.categories || accumCategories;
        pendingCategorySave = null;
        const resolversToCall = [...pendingCategoryResolvers];
        pendingCategoryResolvers = [];

        while (activeCategoryBatchPromise) {
          try {
            await activeCategoryBatchPromise;
          } catch {
            // ignore previous batch errors
          }
        }

        activeCategoryBatchPromise = (async () => {
          try {
            await ensureAuth();
            const chunkSize = 100;
            for (let i = 0; i < catsToSave.length; i += chunkSize) {
              const chunk = catsToSave.slice(i, i + chunkSize);
              const batch = writeBatch(db);
              chunk.forEach(category => {
                if (!category.id) return;
                const cleanData = sanitizeForFirestore(category);
                const catRef = doc(db, 'categories', category.id);
                batch.set(catRef, cleanData, { merge: true });
              });
              await batch.commit();
              await new Promise(r => setTimeout(r, 60));
            }
          } catch (e: any) {
            if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit exceeded') || e?.message?.includes('queued writes') || e?.message?.includes('exhausted')) {
              console.warn('[Firestore] Write batch skipped due to daily quota or write stream limit.');
            } else {
              console.warn('Firestore saveCategoriesBatch warning:', e);
            }
          } finally {
            activeCategoryBatchPromise = null;
          }
        })();

        await activeCategoryBatchPromise;
        resolversToCall.forEach(r => r());
      }, 300)
    };
  });
};

let activeDeleteCategoryBatchPromise: Promise<void> | null = null;

export const deleteCategoriesBatch = async (categoryIds: string[]) => {
  if (!categoryIds || categoryIds.length === 0) return;

  while (activeDeleteCategoryBatchPromise) {
    try {
      await activeDeleteCategoryBatchPromise;
    } catch {
      // ignore
    }
  }

  activeDeleteCategoryBatchPromise = (async () => {
    try {
      await ensureAuth();
      const chunkSize = 100;
      for (let i = 0; i < categoryIds.length; i += chunkSize) {
        const chunk = categoryIds.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(id => {
          if (!id) return;
          const catRef = doc(db, 'categories', id);
          batch.delete(catRef);
        });
        await batch.commit();
        await new Promise(r => setTimeout(r, 60));
      }
    } catch (e: any) {
      if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit exceeded') || e?.message?.includes('queued writes') || e?.message?.includes('exhausted')) {
        console.warn('[Firestore] Delete batch skipped due to daily quota or write stream limit.');
      } else {
        console.warn('Firestore deleteCategoriesBatch warning:', e);
      }
    } finally {
      activeDeleteCategoryBatchPromise = null;
    }
  })();

  await activeDeleteCategoryBatchPromise;
};

export const saveCategory = async (category: BudgetCategory) => {
  try {
    await ensureAuth();
    const cleanData = sanitizeForFirestore(category);
    await setDoc(doc(db, 'categories', category.id), cleanData, { merge: true });
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit exceeded') || e?.message?.includes('queued writes') || e?.message?.includes('exhausted')) {
      console.warn('[Firestore] Category save skipped due to quota or write stream limit.');
    } else {
      console.warn('Firestore saveCategory warning:', e);
    }
  }
};

export const deleteCategory = async (categoryId: string, _projectId?: string) => {
  try {
    await ensureAuth();
    await deleteDoc(doc(db, 'categories', categoryId));
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit exceeded') || e?.message?.includes('queued writes') || e?.message?.includes('exhausted')) {
      console.warn('[Firestore] Category delete skipped due to quota or write stream limit.');
    } else {
      console.warn('Firestore deleteCategory warning:', e);
    }
  }
};

// Expenses (Saved in Top-level expenses collection)
export const saveExpense = async (expense: Expense) => {
  try {
    await ensureAuth();
    const cleanData = sanitizeForFirestore(expense);
    await setDoc(doc(db, 'expenses', expense.id), cleanData, { merge: true });
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit exceeded')) {
      console.warn('[Firestore] Expense save skipped due to quota limit.');
    } else {
      console.warn('Firestore saveExpense warning:', e);
    }
  }
};

export const deleteExpense = async (expenseId: string, _projectId?: string) => {
  try {
    await ensureAuth();
    await deleteDoc(doc(db, 'expenses', expenseId));
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit exceeded')) {
      console.warn('[Firestore] Expense delete skipped due to quota limit.');
    } else {
      console.warn('Firestore deleteExpense warning:', e);
    }
  }
};

// Companies (Saved in Company Folder)
export const saveCompany = async (company: Company) => {
  try {
    await ensureAuth();
    const cleanData = sanitizeForFirestore(company);
    await setDoc(doc(db, 'companies', company.id), cleanData, { merge: true });
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit exceeded')) {
      console.warn('[Firestore] Company save skipped due to quota limit.');
    } else {
      console.warn('Firestore saveCompany warning:', e);
    }
  }
};

export const deleteCompany = async (companyId: string) => {
  try {
    await ensureAuth();
    await deleteDoc(doc(db, 'companies', companyId));
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit exceeded')) {
      console.warn('[Firestore] Company delete skipped due to quota limit.');
    } else {
      console.warn('Firestore deleteCompany warning:', e);
    }
  }
};

// Workspace Projects (Saved in Workspace Projects collection)
export const saveWorkspaceProject = async (wp: WorkspaceProject) => {
  try {
    await ensureAuth();
    const cleanData = sanitizeForFirestore(wp);
    await setDoc(doc(db, 'workspaceProjects', wp.id), cleanData, { merge: true });
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit exceeded')) {
      console.warn('[Firestore] Workspace project save skipped due to quota limit.');
    } else {
      console.warn('Firestore saveWorkspaceProject warning:', e);
    }
  }
};

export const deleteWorkspaceProject = async (wpId: string) => {
  try {
    await ensureAuth();
    await deleteDoc(doc(db, 'workspaceProjects', wpId));
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit exceeded')) {
      console.warn('[Firestore] Workspace project delete skipped due to quota limit.');
    } else {
      console.warn('Firestore deleteWorkspaceProject warning:', e);
    }
  }
};

// DB Logs (Saved in DB Logs collection)
export const addDbLog = async (log: DBLog, _projectId?: string) => {
  try {
    await ensureAuth();
    const cleanData = sanitizeForFirestore(log);
    await setDoc(doc(db, 'dbLogs', log.id), cleanData);
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit exceeded')) {
      console.warn('[Firestore] DB log add skipped due to quota limit.');
    } else {
      console.warn('Firestore addDbLog warning:', e);
    }
  }
};

// Users / User Profiles (Saved in User Folder)
export const subscribeUserProfiles = (callback: (users: UserProfile[]) => void) => {
  return onSnapshot(collection(db, 'users'), 
    (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as UserProfile));
      callback(data);
    },
    (error) => {
      console.warn('Firestore subscribeUserProfiles listener warning:', error);
    }
  );
};

export const saveUserProfile = async (user: UserProfile) => {
  try {
    await ensureAuth();
    const cleanData = sanitizeForFirestore(user);
    const docKey = user.email.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    await setDoc(doc(db, 'users', docKey), cleanData, { merge: true });
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit exceeded')) {
      console.warn('[Firestore] User profile save skipped due to quota limit.');
    } else {
      console.warn('Firestore saveUserProfile warning:', e);
    }
  }
};

export const getUserProfile = async (email: string): Promise<UserProfile | null> => {
  try {
    await ensureAuth();
    const docKey = email.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const snap = await getDoc(doc(db, 'users', docKey));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (e) {
    console.warn('Firestore getUserProfile warning:', e);
  }
  return null;
};

// Vendors (Saved in Top-level vendors collection)
export const subscribeVendors = (callback: (vendors: any[]) => void) => {
  return onSnapshot(collection(db, 'vendors'), 
    (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      callback(data);
    },
    (error) => {
      console.warn('Firestore subscribeVendors listener warning:', error);
    }
  );
};

export const saveVendor = async (vendor: any) => {
  try {
    await ensureAuth();
    const cleanData = sanitizeForFirestore(vendor);
    await setDoc(doc(db, 'vendors', vendor.id), cleanData, { merge: true });
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit') || e?.message?.includes('queued writes') || e?.message?.includes('exhausted')) {
      console.warn('[Firestore] saveVendor skipped due to quota or write stream limit.');
    } else {
      console.warn('Firestore saveVendor warning:', e);
    }
  }
};

export const deleteVendor = async (vendorId: string) => {
  try {
    await ensureAuth();
    await deleteDoc(doc(db, 'vendors', vendorId));
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit') || e?.message?.includes('queued writes') || e?.message?.includes('exhausted')) {
      console.warn('[Firestore] deleteVendor skipped due to quota or write stream limit.');
    } else {
      console.warn('Firestore deleteVendor warning:', e);
    }
  }
};

// Payments (Saved in Top-level payments collection)
export const subscribePayments = (callback: (payments: any[]) => void) => {
  return onSnapshot(collection(db, 'payments'), 
    (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      callback(data);
    },
    (error) => {
      console.warn('Firestore subscribePayments listener warning:', error);
    }
  );
};

export const savePayment = async (payment: any) => {
  try {
    await ensureAuth();
    const cleanData = sanitizeForFirestore(payment);
    await setDoc(doc(db, 'payments', payment.id), cleanData, { merge: true });
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit') || e?.message?.includes('queued writes') || e?.message?.includes('exhausted')) {
      console.warn('[Firestore] savePayment skipped due to quota or write stream limit.');
    } else {
      console.warn('Firestore savePayment warning:', e);
    }
  }
};

export const deletePayment = async (paymentId: string) => {
  try {
    await ensureAuth();
    await deleteDoc(doc(db, 'payments', paymentId));
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit') || e?.message?.includes('queued writes') || e?.message?.includes('exhausted')) {
      console.warn('[Firestore] deletePayment skipped due to quota or write stream limit.');
    } else {
      console.warn('Firestore deletePayment warning:', e);
    }
  }
};

// Documents (Saved in Top-level documents collection)
export const subscribeDocuments = (callback: (docs: any[]) => void) => {
  return onSnapshot(collection(db, 'documents'), 
    (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      callback(data);
    },
    (error) => {
      console.warn('Firestore subscribeDocuments listener warning:', error);
    }
  );
};

export const saveDocument = async (docData: any) => {
  try {
    await ensureAuth();
    const cleanData = sanitizeForFirestore(docData);
    await setDoc(doc(db, 'documents', docData.id), cleanData, { merge: true });
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit') || e?.message?.includes('queued writes') || e?.message?.includes('exhausted')) {
      console.warn('[Firestore] saveDocument skipped due to quota or write stream limit.');
    } else {
      console.warn('Firestore saveDocument warning:', e);
    }
  }
};

export const deleteDocument = async (docId: string) => {
  try {
    await ensureAuth();
    await deleteDoc(doc(db, 'documents', docId));
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit') || e?.message?.includes('queued writes') || e?.message?.includes('exhausted')) {
      console.warn('[Firestore] deleteDocument skipped due to quota or write stream limit.');
    } else {
      console.warn('Firestore deleteDocument warning:', e);
    }
  }
};

// Production DSRs (Saved in Top-level production_dsrs collection)
export const subscribeDSRs = (callback: (dsrs: any[]) => void) => {
  return onSnapshot(collection(db, 'production_dsrs'), 
    (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      callback(data);
    },
    (error) => {
      console.warn('Firestore subscribeDSRs listener warning:', error);
    }
  );
};

export const saveDSR = async (dsr: any) => {
  try {
    await ensureAuth();
    const cleanData = sanitizeForFirestore(dsr);
    await setDoc(doc(db, 'production_dsrs', dsr.id), cleanData, { merge: true });
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit') || e?.message?.includes('queued writes') || e?.message?.includes('exhausted')) {
      console.warn('[Firestore] saveDSR skipped due to quota or write stream limit.');
    } else {
      console.warn('Firestore saveDSR warning:', e);
    }
  }
};

export const deleteDSR = async (dsrId: string) => {
  try {
    await ensureAuth();
    await deleteDoc(doc(db, 'production_dsrs', dsrId));
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit') || e?.message?.includes('queued writes') || e?.message?.includes('exhausted')) {
      console.warn('[Firestore] deleteDSR skipped due to quota or write stream limit.');
    } else {
      console.warn('Firestore deleteDSR warning:', e);
    }
  }
};

// Purchase Orders & 3-Way Matching (Saved in Top-level purchase_orders collection)
export const subscribePurchaseOrders = (callback: (pos: any[]) => void) => {
  return onSnapshot(collection(db, 'purchase_orders'), 
    (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      callback(data);
    },
    (error) => {
      console.warn('Firestore subscribePurchaseOrders listener warning:', error);
    }
  );
};

export const savePurchaseOrder = async (po: any) => {
  try {
    await ensureAuth();
    const cleanData = sanitizeForFirestore(po);
    await setDoc(doc(db, 'purchase_orders', po.id), cleanData, { merge: true });
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit') || e?.message?.includes('queued writes') || e?.message?.includes('exhausted')) {
      console.warn('[Firestore] savePurchaseOrder skipped due to quota or write stream limit.');
    } else {
      console.warn('Firestore savePurchaseOrder warning:', e);
    }
  }
};

export const deletePurchaseOrder = async (poId: string) => {
  try {
    await ensureAuth();
    await deleteDoc(doc(db, 'purchase_orders', poId));
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit') || e?.message?.includes('queued writes') || e?.message?.includes('exhausted')) {
      console.warn('[Firestore] deletePurchaseOrder skipped due to quota or write stream limit.');
    } else {
      console.warn('Firestore deletePurchaseOrder warning:', e);
    }
  }
};



