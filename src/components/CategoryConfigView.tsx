import { useState, useEffect, useMemo, useCallback, useRef, FormEvent, Fragment } from 'react';
import { Project, BudgetCategory, DBLog, SubCategory, ChildCategory } from '../types';
import { DEFAULT_FILM_BUDGET_STRUCTURE, PAYMENT_TERMS_OPTIONS, COOKING_SHOW_COST_TYPES, generateStandardCategoriesForProject, ensureStandardCategoriesForProject, sortCategoriesByStandardStructure, getBudgetStructureForProjectType, isCategoryStructureMismatched } from '../data';
import { saveCategoriesBatch, deleteCategoriesBatch } from '../services/firebaseService';
import BudgetApprovalWidget, { BudgetVersionRecord } from './BudgetApprovalWidget';
import { CookingShowAnalyticsBar } from './CookingShowAnalyticsBar';
import { BudgetAllocationFieldsModal } from './BudgetAllocationFieldsModal';
import { 
  FolderTree, 
  Search, 
  PlusCircle, 
  Trash2, 
  Edit2, 
  Receipt, 
  CheckCircle, 
  X, 
  Plus, 
  ChevronRight,
  ChevronDown,
  Sparkles,
  Layers,
  CornerDownRight,
  Calculator,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ListOrdered,
  Printer,
  Download,
  FileText,
  Tag,
  ChefHat
} from 'lucide-react';

interface CategoryConfigViewProps {
  projects: Project[];
  categories: BudgetCategory[];
  selectedProjectId?: string;
  onSelectProject?: (projectId: string) => void;
  onUpdateCategories: (updatedCategories: BudgetCategory[], dbLog: DBLog, targetProjectId?: string) => void;
  onAddLog: (log: DBLog) => void;
  currentVersion?: BudgetVersionRecord;
  lastApprovedVersion?: BudgetVersionRecord;
  activeRoleName?: string;
  onSendApproval?: (targetRole?: string) => void;
  onApproveRole?: (targetRole: string) => void;
  onSendAllApprovals?: () => void;
  onBackToBudget?: () => void;
}

// Helper to identify actor / character subcategories (e.g., Lead Actor / Actress, Character Artists, Supporting Actors)
export function isCharacterSubCategory(subName?: string): boolean {
  if (!subName) return false;
  const normalized = subName.trim().toLowerCase();
  return (
    normalized === 'lead actor / actress' ||
    normalized === 'character artists' ||
    normalized === 'supporting actors' ||
    normalized.includes('lead actor') ||
    normalized.includes('character artist') ||
    normalized.includes('supporting actor')
  );
}

// Helper to recalculate rollups and amounts for a single category tree
export function rollupCategory(cat: BudgetCategory): BudgetCategory {
  if (!cat.subCategories || cat.subCategories.length === 0) {
    const cnt = cat.count ?? 1;
    const rt = Number(cat.rate) || 0;
    const sh = cat.shifts ?? 1;
    return { ...cat, allocatedAmount: cnt * rt * sh };
  }

  const updatedSubs = cat.subCategories.map(sub => {
    if (sub.childCategories && sub.childCategories.length > 0) {
      const updatedChildren = sub.childCategories.map(ch => {
        const cnt = ch.count ?? 1;
        const rt = Number(ch.rate) || 0;
        const sh = ch.shifts ?? 1;
        return { ...ch, allocatedAmount: cnt * rt * sh };
      });
      const childAllocatedTotal = updatedChildren.reduce((sum, ch) => sum + (Number(ch.allocatedAmount) || 0), 0);
      const childSpentTotal = updatedChildren.reduce((sum, ch) => sum + (Number(ch.spentAmount) || 0), 0);
      return {
        ...sub,
        allocatedAmount: childAllocatedTotal,
        spentAmount: childSpentTotal,
        childCategories: updatedChildren
      };
    } else {
      const cnt = sub.count ?? 1;
      const rt = Number(sub.rate) || 0;
      const sh = sub.shifts ?? 1;
      return { ...sub, allocatedAmount: cnt * rt * sh };
    }
  });

  const subAllocatedTotal = updatedSubs.reduce((sum, sub) => sum + (Number(sub.allocatedAmount) || 0), 0);
  const subSpentTotal = updatedSubs.reduce((sum, sub) => sum + (Number(sub.spentAmount) || 0), 0);

  return {
    ...cat,
    allocatedAmount: subAllocatedTotal,
    spentAmount: subSpentTotal,
    subCategories: updatedSubs
  };
}

export default function CategoryConfigView({
  projects,
  categories,
  selectedProjectId: externalProjectId,
  onUpdateCategories,
  onAddLog,
  currentVersion,
  lastApprovedVersion,
  activeRoleName = 'Production Manager',
  onSendApproval,
  onApproveRole,
  onSendAllApprovals,
  onBackToBudget
}: CategoryConfigViewProps) {
  const [internalProjectId] = useState<string>('');
  const selectedProjectId = externalProjectId || internalProjectId || projects[0]?.id || '';
  const isReadOnlyRole = activeRoleName === 'Viewer' || activeRoleName === 'Auditor';

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({});
  const [expandedSubCategoryIds, setExpandedSubCategoryIds] = useState<Record<string, boolean>>({});
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Local state for categories to allow interactive editing and rollups
  const [localCategories, setLocalCategories] = useState<BudgetCategory[]>(() => {
    return categories.map(cat => rollupCategory(cat));
  });

  const activeProject = useMemo(() => {
    return projects.find(p => 
      p.id === selectedProjectId || 
      p.id.replace(/^wp_/, '') === (selectedProjectId || '').replace(/^wp_/, '') || 
      p.id.toLowerCase() === (selectedProjectId || '').toLowerCase()
    ) || projects[0];
  }, [projects, selectedProjectId]);

  const currentProjectId = useMemo(() => {
    return selectedProjectId || activeProject?.id || 'p_default';
  }, [selectedProjectId, activeProject]);

  // Resequence all S.NO serial numbers cleanly across categories, sub-categories, and child-categories
  const resequenceAllCategories = useCallback((cats: BudgetCategory[]): BudgetCategory[] => {
    const projId = selectedProjectId || activeProject?.id;
    const projType = activeProject?.type || activeProject?.projectType;
    const sorted = sortCategoriesByStandardStructure(cats, projType);
    return sorted.map((cat, catIdx) => {
      const catSerial = String(catIdx + 1);
      const updatedSubs = (cat.subCategories || []).map((sub, subIdx) => {
        const subSerial = `${catSerial}.${subIdx + 1}`;
        const updatedChildren = (sub.childCategories || []).map((ch, chIdx) => {
          const childSerial = `${subSerial}.${chIdx + 1}`;
          return {
            ...ch,
            code: childSerial,
            projectId: ch.projectId || projId,
            categoryId: ch.categoryId || cat.id,
            subCategoryId: ch.subCategoryId || sub.id
          };
        });
        return {
          ...sub,
          code: subSerial,
          projectId: sub.projectId || projId,
          categoryId: sub.categoryId || cat.id,
          childCategories: updatedChildren
        };
      });
      return rollupCategory({
        ...cat,
        code: catSerial,
        projectId: cat.projectId || projId,
        subCategories: updatedSubs
      });
    });
  }, [selectedProjectId, activeProject?.id, activeProject?.type, activeProject?.projectType]);

  const resequenceAllCategoriesRef = useRef(resequenceAllCategories);
  resequenceAllCategoriesRef.current = resequenceAllCategories;

  const isLocalEditingRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<any>(null);
  const pendingCategoriesRef = useRef<BudgetCategory[] | null>(null);
  const isInputFocusedRef = useRef<boolean>(false);
  const lastLoadedProjectIdRef = useRef<string>(selectedProjectId);

  // Sync to parent and Firestore with debounce to allow smooth typing without re-render stutter or focus loss
  const triggerDebouncedSync = useCallback((updatedCats: BudgetCategory[], actionName: string, queryDesc: string) => {
    isLocalEditingRef.current = true;
    pendingCategoriesRef.current = updatedCats;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const catsToSave = pendingCategoriesRef.current || updatedCats;
      const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      onUpdateCategories(catsToSave, {
        id: `l_field_${Date.now()}`,
        timestamp: nowTimestamp,
        action: actionName,
        sqlQuery: queryDesc,
        status: 'success'
      }, selectedProjectId);
      saveCategoriesBatch(catsToSave);
      debounceTimerRef.current = null;
      if (!isInputFocusedRef.current) {
        setTimeout(() => {
          if (!isInputFocusedRef.current) {
            isLocalEditingRef.current = false;
          }
        }, 400);
      }
    }, 300);
  }, [onUpdateCategories, selectedProjectId]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Keep localCategories in sync if categories prop updates externally (e.g., project change or cloud refresh)
  useEffect(() => {
    const projId = selectedProjectId || activeProject?.id;
    const isProjectSwitch = lastLoadedProjectIdRef.current !== projId;

    // If user is actively typing or focused in an input on this project, do NOT overwrite localCategories
    if (!isProjectSwitch && (isLocalEditingRef.current || isInputFocusedRef.current || debounceTimerRef.current !== null)) {
      return;
    }

    lastLoadedProjectIdRef.current = projId;

    const catMap = new Map<string, BudgetCategory>();
    (categories || []).forEach(cat => {
      const isMatch = cat.projectId && projId && (
        cat.projectId === projId || 
        cat.projectId.replace(/^wp_/, '') === projId.replace(/^wp_/, '')
      );
      if (isMatch && cat.id && !catMap.has(cat.id)) {
        catMap.set(cat.id, cat);
      }
    });
    let rawCategories = Array.from(catMap.values()).map(cat => rollupCategory(cat));
    const pType = activeProject?.type || activeProject?.projectType;
    const isMismatched = isCategoryStructureMismatched(rawCategories, pType);

    if ((rawCategories.length === 0 || isMismatched) && projId) {
      rawCategories = generateStandardCategoriesForProject(projId, pType);
    }
    const resequenced = resequenceAllCategoriesRef.current(rawCategories);
    setLocalCategories(prev => {
      if (prev.length === resequenced.length) {
        const isIdentical = prev.every((pCat, idx) => {
          const rCat = resequenced[idx];
          return pCat.id === rCat.id && pCat.allocatedAmount === rCat.allocatedAmount && pCat.name === rCat.name && (pCat.subCategories?.length || 0) === (rCat.subCategories?.length || 0);
        });
        if (isIdentical) return prev;
      }
      return resequenced;
    });
  }, [categories, selectedProjectId, activeProject?.id, activeProject?.type, activeProject?.projectType]);

  // Strict canonical ordering defined by user specification
  const CANONICAL_CATEGORY_ORDER = useMemo(() => [
    'story and other rights',
    'pre production expenses',
    'crew wages',
    'artist wages',
    'equipments',
    'location expenses',
    'art expenses',
    'wardrobe expenses',
    'transport expenses',
    'fuel expense',
    'genset & vanity',
    'accommodation expenses',
    'materials purchase expenses',
    'food & beverage',
    'picture vehicle & animals',
    'picture vehicle & others',
    'fight expenses',
    'post production expenses',
    'marketing & release'
  ], []);

  const getCategoryOrderIndex = useCallback((name: string): number => {
    const norm = (name || '').trim().toLowerCase();
    const idx = CANONICAL_CATEGORY_ORDER.indexOf(norm);
    if (idx !== -1) return idx;
    if (norm.includes('story')) return 0;
    if (norm.includes('pre production')) return 1;
    if (norm.includes('crew')) return 2;
    if (norm.includes('artist')) return 3;
    if (norm.includes('equipment')) return 4;
    if (norm.includes('location')) return 5;
    if (norm.includes('art') && !norm.includes('artist') && !norm.includes('smart')) return 6;
    if (norm.includes('wardrobe')) return 7;
    if (norm.includes('transport')) return 8;
    if (norm.includes('fuel')) return 9;
    if (norm.includes('genset') || norm.includes('vanity')) return 10;
    if (norm.includes('accommodation')) return 11;
    if (norm.includes('materials')) return 12;
    if (norm.includes('food') || norm.includes('beverage')) return 13;
    if (norm.includes('picture vehicle') || norm.includes('animals') || norm.includes('others')) return 14;
    if (norm.includes('fight') || norm.includes('stunt')) return 15;
    if (norm.includes('post production')) return 16;
    if (norm.includes('marketing') || norm.includes('release')) return 17;
    return 999;
  }, [CANONICAL_CATEGORY_ORDER]);

  // Filter categories for active project
  const projectCategories = useMemo(() => {
    return localCategories;
  }, [localCategories]);

  // Filtered by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return projectCategories;
    const q = searchQuery.toLowerCase();
    return projectCategories.filter(cat => {
      const matchCat = cat.name.toLowerCase().includes(q) || (cat.code && cat.code.toLowerCase().includes(q));
      const matchSub = cat.subCategories?.some(s => s.name.toLowerCase().includes(q) || (s.code && s.code.toLowerCase().includes(q)));
      return matchCat || matchSub;
    });
  }, [projectCategories, searchQuery]);

  // Preserve exact array order from localCategories so manual reordering is never overridden
  const sortedCategories = useMemo(() => {
    return filteredCategories;
  }, [filteredCategories]);

  // Total project budget from rollups
  const totalProjectBudget = useMemo(() => {
    return projectCategories.reduce((sum, cat) => sum + (Number(cat.allocatedAmount) || 0), 0);
  }, [projectCategories]);

  const totalProjectSpent = useMemo(() => {
    return projectCategories.reduce((sum, cat) => sum + (Number(cat.spentAmount) || 0), 0);
  }, [projectCategories]);

  // Detect whether current category structure deviates from standard for active project
  const isStructureOutdated = useMemo(() => {
    const pType = activeProject?.type || activeProject?.projectType;
    return isCategoryStructureMismatched(projectCategories, pType);
  }, [activeProject, projectCategories]);

  // Toggle collapse/expand
  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategoryIds(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const toggleSubCategoryExpand = (subId: string) => {
    setExpandedSubCategoryIds(prev => ({ ...prev, [subId]: !prev[subId] }));
  };

  // Inline Creation Row States
  const [inlineSubCatTargetCatId, setInlineSubCatTargetCatId] = useState<string | null>(null);
  const [inlineChildCatTargetSubId, setInlineChildCatTargetSubId] = useState<string | null>(null);
  const [inlineChildCatTargetCatId, setInlineChildCatTargetCatId] = useState<string | null>(null);

  const [inlineName, setInlineName] = useState<string>('');
  const [inlineCount, setInlineCount] = useState<number>(1);
  const [inlineRate, setInlineRate] = useState<number>(0);
  const [inlinePaymentTerms, setInlinePaymentTerms] = useState<string>('PER DAY');
  const [inlineShifts, setInlineShifts] = useState<number>(1);

  const startInlineAddSubCategory = (parentCatId: string) => {
    setInlineSubCatTargetCatId(parentCatId);
    setInlineChildCatTargetSubId(null);
    setInlineChildCatTargetCatId(null);
    setInlineName('');
    setInlineCount(1);
    setInlineRate(0);
    setInlinePaymentTerms('PER DAY');
    setInlineShifts(1);
    setExpandedCategoryIds(prev => ({ ...prev, [parentCatId]: true }));
  };

  const submitInlineSubCategory = (parentCatId: string) => {
    if (!inlineName.trim()) return;

    const parentCat = localCategories.find(c => c.id === parentCatId);
    const catCode = (parentCat?.code && !isNaN(Number(parentCat.code))) ? parentCat.code : String(localCategories.indexOf(parentCat!) + 1);
    const subIdx = (parentCat?.subCategories || []).length + 1;
    const autoSubCode = `${catCode}.${subIdx}`;

    const cnt = inlineCount || 1;
    const rt = inlineRate || 0;
    const sh = inlineShifts || 1;
    const computedAlloc = cnt * rt * sh;

    const newSub: SubCategory = {
      id: `sub_${parentCatId}_${Math.random().toString(36).substring(2, 7)}`,
      categoryId: parentCatId,
      projectId: parentCat?.projectId || selectedProjectId,
      name: inlineName.trim(),
      code: autoSubCode,
      count: cnt,
      rate: rt,
      paymentTerms: inlinePaymentTerms,
      shifts: sh,
      allocatedAmount: computedAlloc,
      spentAmount: 0,
      childCategories: []
    };

    const updated = localCategories.map(cat => {
      if (cat.id === parentCatId) {
        const subList = [...(cat.subCategories || []), newSub];
        return rollupCategory({ ...cat, subCategories: subList });
      }
      return cat;
    });

    setLocalCategories(updated);
    setInlineSubCatTargetCatId(null);

    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    onUpdateCategories(updated, {
      id: `l_sub_inline_add_${Date.now()}`,
      timestamp: nowTimestamp,
      action: 'ADD_SUB_CATEGORY',
      sqlQuery: `INSERT INTO sub_categories (id, categoryId, name, code, count, rate, paymentTerms, shifts, allocatedAmount) VALUES ('${newSub.id}', '${parentCatId}', '${newSub.name.replace(/'/g, "''")}', '${autoSubCode}', ${cnt}, ${rt}, '${inlinePaymentTerms}', ${sh}, ${computedAlloc});`,
      status: 'success'
    });
  };

  const startInlineAddChildCategory = (parentCatId: string, parentSubId: string) => {
    setInlineChildCatTargetSubId(parentSubId);
    setInlineChildCatTargetCatId(parentCatId);
    setInlineSubCatTargetCatId(null);
    setInlineName('');
    setInlineCount(1);
    setInlineRate(0);
    setInlinePaymentTerms('PER DAY');
    setInlineShifts(1);
    setExpandedSubCategoryIds(prev => ({ ...prev, [parentSubId]: true }));
  };

  const submitInlineChildCategory = (parentCatId: string, parentSubId: string) => {
    if (!inlineName.trim()) return;

    const parentCat = localCategories.find(c => c.id === parentCatId);
    const parentSub = (parentCat?.subCategories || []).find(s => s.id === parentSubId);
    const catCode = (parentCat?.code && !isNaN(Number(parentCat.code))) ? parentCat.code : String(localCategories.indexOf(parentCat!) + 1);
    const subIdx = parentCat?.subCategories ? (parentCat.subCategories.indexOf(parentSub!) + 1) : 1;
    const subCode = `${catCode}.${subIdx}`;
    const childIdx = (parentSub?.childCategories || []).length + 1;
    const autoChildCode = `${subCode}.${childIdx}`;

    const cnt = inlineCount || 1;
    const rt = inlineRate || 0;
    const sh = inlineShifts || 1;
    const computedAlloc = cnt * rt * sh;

    const newChild: ChildCategory = {
      id: `ch_${parentSubId}_${Math.random().toString(36).substring(2, 7)}`,
      subCategoryId: parentSubId,
      categoryId: parentCatId,
      projectId: parentCat?.projectId || selectedProjectId,
      name: inlineName.trim(),
      code: autoChildCode,
      count: cnt,
      rate: rt,
      paymentTerms: inlinePaymentTerms,
      shifts: sh,
      allocatedAmount: computedAlloc,
      spentAmount: 0
    };

    const updated = localCategories.map(cat => {
      if (cat.id === parentCatId) {
        const updatedSubs = (cat.subCategories || []).map(sub => {
          if (sub.id === parentSubId) {
            const childList = [...(sub.childCategories || []), newChild];
            return {
              ...sub,
              childCategories: childList
            };
          }
          return sub;
        });
        return rollupCategory({ ...cat, subCategories: updatedSubs });
      }
      return cat;
    });

    setLocalCategories(updated);
    setInlineChildCatTargetSubId(null);
    setInlineChildCatTargetCatId(null);

    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    onUpdateCategories(updated, {
      id: `l_child_inline_add_${Date.now()}`,
      timestamp: nowTimestamp,
      action: 'ADD_CHILD_CATEGORY',
      sqlQuery: `INSERT INTO child_categories (id, subCategoryId, name, count, rate, paymentTerms, shifts, allocatedAmount) VALUES ('${newChild.id}', '${parentSubId}', '${newChild.name.replace(/'/g, "''")}', ${cnt}, ${rt}, '${inlinePaymentTerms}', ${sh}, ${computedAlloc});`,
      status: 'success'
    });
  };

  // Modal States
  const [showAddCatModal, setShowAddCatModal] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatCode, setNewCatCode] = useState<string>('');
  const [newCatCount, setNewCatCount] = useState<number>(1);
  const [newCatRate, setNewCatRate] = useState<number>(0);
  const [newCatTerms, setNewCatTerms] = useState<string>('PACKAGE');
  const [newCatShifts, setNewCatShifts] = useState<number>(1);
  const [newCatAllocated, setNewCatAllocated] = useState<number>(0);

  const [showAddSubModal, setShowAddSubModal] = useState<boolean>(false);
  const [targetParentCatId, setTargetParentCatId] = useState<string>('');
  const [newSubName, setNewSubName] = useState<string>('');
  const [newSubCode, setNewSubCode] = useState<string>('');
  const [newSubCount, setNewSubCount] = useState<number>(1);
  const [newSubRate, setNewSubRate] = useState<number>(0);
  const [newSubTerms, setNewSubTerms] = useState<string>('PER DAY');
  const [newSubShifts, setNewSubShifts] = useState<number>(1);
  const [newSubAllocated, setNewSubAllocated] = useState<number>(0);

  const [showAddChildModal, setShowAddChildModal] = useState<boolean>(false);
  const [targetParentSubId, setTargetParentSubId] = useState<string>('');
  const [newChildName, setNewChildName] = useState<string>('');
  const [newChildCode, setNewChildCode] = useState<string>('');
  const [newChildCount, setNewChildCount] = useState<number>(1);
  const [newChildRate, setNewChildRate] = useState<number>(0);
  const [newChildTerms, setNewChildTerms] = useState<string>('PER DAY');
  const [newChildShifts, setNewChildShifts] = useState<number>(1);
  const [newChildAllocated, setNewChildAllocated] = useState<number>(0);

  // Budget Allocation & ERP Fields (Season, Episode, Station, Challenge, Contestant, Cost Type)
  const [newChildSeason, setNewChildSeason] = useState<string>('');
  const [newChildEpisode, setNewChildEpisode] = useState<string>('');
  const [newChildRound, setNewChildRound] = useState<string>('');
  const [newChildChallenge, setNewChildChallenge] = useState<string>('');
  const [newChildKitchenStation, setNewChildKitchenStation] = useState<string>('');
  const [newChildContestant, setNewChildContestant] = useState<string>('');
  const [newChildCostType, setNewChildCostType] = useState<string>('');
  const [showChildAllocationFields, setShowChildAllocationFields] = useState<boolean>(false);

  // Dedicated Allocation Modal State
  const [allocationModalChild, setAllocationModalChild] = useState<ChildCategory | null>(null);
  const [allocationModalCatId, setAllocationModalCatId] = useState<string>('');
  const [allocationModalSubId, setAllocationModalSubId] = useState<string>('');

  const openAllocationModal = (catId: string, subId: string, child: ChildCategory) => {
    setAllocationModalCatId(catId);
    setAllocationModalSubId(subId);
    setAllocationModalChild(child);
  };

  const handleSaveAllocationFields = (updatedFields: Partial<ChildCategory>) => {
    if (!allocationModalChild || !allocationModalCatId || !allocationModalSubId) return;

    const updated = localCategories.map(cat => {
      if (cat.id === allocationModalCatId) {
        const updatedSubs = (cat.subCategories || []).map(sub => {
          if (sub.id === allocationModalSubId) {
            const updatedChildren = (sub.childCategories || []).map(ch => {
              if (ch.id === allocationModalChild.id) {
                return { ...ch, ...updatedFields };
              }
              return ch;
            });
            return { ...sub, childCategories: updatedChildren };
          }
          return sub;
        });
        return rollupCategory({ ...cat, subCategories: updatedSubs });
      }
      return cat;
    });

    setLocalCategories(updated);
    setAllocationModalChild(null);

    onUpdateCategories(updated, {
      id: `l_alloc_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'UPDATE_ITEM_ALLOCATION',
      sqlQuery: `-- Updated allocation dimensions for ${allocationModalChild.name}`,
      status: 'success'
    });
  };

  // Edit / Rename Modal State
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editType, setEditType] = useState<'category' | 'subcategory' | 'childcategory'>('category');
  const [editTargetIds, setEditTargetIds] = useState<{ catId: string; subId?: string; childId?: string }>({ catId: '' });
  const [editName, setEditName] = useState<string>('');
  const [editCode, setEditCode] = useState<string>('');

  const openEditCategory = (cat: BudgetCategory) => {
    setEditType('category');
    setEditTargetIds({ catId: cat.id });
    setEditName(cat.name);
    setEditCode(cat.code || '');
    setShowEditModal(true);
  };

  const openEditSubCategory = (catId: string, sub: SubCategory) => {
    setEditType('subcategory');
    setEditTargetIds({ catId, subId: sub.id });
    setEditName(sub.name);
    setEditCode(sub.code || '');
    setShowEditModal(true);
  };

  const openEditChildCategory = (catId: string, subId: string, child: ChildCategory) => {
    setEditType('childcategory');
    setEditTargetIds({ catId, subId, childId: child.id });
    setEditName(child.name);
    setEditCode(child.code || '');
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const updated = localCategories.map(cat => {
      if (editType === 'category' && cat.id === editTargetIds.catId) {
        return { ...cat, name: editName.trim(), code: editCode.trim() || undefined };
      }
      if ((editType === 'subcategory' || editType === 'childcategory') && cat.id === editTargetIds.catId) {
        const updatedSubs = (cat.subCategories || []).map(sub => {
          if (editType === 'subcategory' && sub.id === editTargetIds.subId) {
            return { ...sub, name: editName.trim(), code: editCode.trim() || undefined };
          }
          if (editType === 'childcategory' && sub.id === editTargetIds.subId) {
            const updatedChildren = (sub.childCategories || []).map(ch => {
              if (ch.id === editTargetIds.childId) {
                return { ...ch, name: editName.trim(), code: editCode.trim() || undefined };
              }
              return ch;
            });
            return { ...sub, childCategories: updatedChildren };
          }
          return sub;
        });
        return rollupCategory({ ...cat, subCategories: updatedSubs });
      }
      return cat;
    });

    setLocalCategories(updated);
    setShowEditModal(false);

    onUpdateCategories(updated, {
      id: `l_edit_${Date.now()}`,
      timestamp: nowTimestamp,
      action: 'UPDATE_ITEM_NAME',
      sqlQuery: `-- Renamed item to ${editName.trim()}`,
      status: 'success'
    });
  };

  // Reset / Replace current categories with Standard Film Categories
  const handleResetToStandardCategories = () => {
    setShowResetConfirmModal(true);
  };

  const executeResetToStandardCategories = () => {
    // Purge existing category records for selected project (handling all potential prefix variants)
    const cleanId = (selectedProjectId || '').replace(/^wp_/, '');
    const oldCatIds = Array.from(new Set([
      ...categories
        .filter(c => c.projectId === selectedProjectId || (c.projectId && cleanId && (c.projectId.replace(/^wp_/, '') === cleanId || c.projectId === cleanId.replace(/^p_/, '') || cleanId === `p_${c.projectId}`)))
        .map(c => c.id),
      ...localCategories.map(c => c.id)
    ]));

    if (oldCatIds.length > 0) {
      deleteCategoriesBatch(oldCatIds);
    }

    const projType = activeProject?.type || activeProject?.projectType || 'Production';
    const standardCats = generateStandardCategoriesForProject(selectedProjectId, projType);

    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const log: DBLog = {
      id: `l_def_cats_${Date.now()}`,
      timestamp: nowTimestamp,
      action: 'SQL_RESET_STANDARD_CATEGORIES',
      sqlQuery: `-- Purged ${oldCatIds.length} old category records and re-created standard ${projType} Budget Structure (${standardCats.length} Categories, Sub-Categories & Child Items)`,
      status: 'success'
    };

    setLocalCategories(standardCats);
    onUpdateCategories(standardCats, log, selectedProjectId);
    saveCategoriesBatch(standardCats);
    setToastMsg(`Successfully re-created Standard ${projType} Budget Structure (${standardCats.length} Categories, Sub-Categories & Child Items)!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Sync / Apply App Default Category Config across ALL projects (old and new) & Purge Stale/Old Categories
  const executeSyncAllProjectsToStandardCategories = () => {
    const allSyncedCats: BudgetCategory[] = [];
    const allToDeleteCatIds: string[] = [];

    // Map project ID to its valid standard category names set
    const validNamesByProj = new Map<string, Set<string>>();
    projects.forEach(p => {
      const pIdClean = p.id.replace(/^wp_/, '');
      const struct = getBudgetStructureForProjectType(p.type || p.projectType);
      const namesSet = new Set(struct.map(c => c.name.trim().toLowerCase()));
      validNamesByProj.set(p.id, namesSet);
      validNamesByProj.set(pIdClean, namesSet);
    });

    // Identify stale/old categories that don't belong to the project's standard list
    categories.forEach(c => {
      const nameLower = c.name.trim().toLowerCase();
      const projClean = (c.projectId || '').replace(/^wp_/, '');
      const validSet = validNamesByProj.get(c.projectId) || validNamesByProj.get(projClean);

      const isInvalidForProj = validSet ? !validSet.has(nameLower) : false;

      if (isInvalidForProj ||
          nameLower.includes('automation') || 
          nameLower.includes('facility') || 
          nameLower.includes('engineering') || 
          nameLower.includes('cargo fleet') || 
          nameLower.includes('data center') ||
          c.id.startsWith('c_old_') ||
          c.name === 'Revenue & Recoveries' ||
          c.name === 'picture vehicle & animals' ||
          ((c.name === 'Production' || c.name === 'Talent' || c.name === 'Post-Prod') && (!c.subCategories || c.subCategories.length === 0))) {
        allToDeleteCatIds.push(c.id);
      }
    });

    if (allToDeleteCatIds.length > 0) {
      deleteCategoriesBatch(allToDeleteCatIds);
    }

    projects.forEach(proj => {
      const projCats = categories.filter(c => 
        (c.projectId === proj.id || 
        (c.projectId && proj.id && c.projectId.replace(/^wp_/, '') === proj.id.replace(/^wp_/, ''))) &&
        !allToDeleteCatIds.includes(c.id)
      );
      const synced = ensureStandardCategoriesForProject(proj.id, projCats, proj.type || proj.projectType);
      synced.forEach(c => allSyncedCats.push(c));
    });

    saveCategoriesBatch(allSyncedCats);

    const activeSynced = allSyncedCats.filter(c => 
      c.projectId === selectedProjectId || 
      (c.projectId && selectedProjectId && c.projectId.replace(/^wp_/, '') === selectedProjectId.replace(/^wp_/, ''))
    );

    if (activeSynced.length > 0) {
      setLocalCategories(activeSynced);
    }

    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const log: DBLog = {
      id: `l_sync_all_${Date.now()}`,
      timestamp: nowTimestamp,
      action: 'SQL_SYNC_ALL_PROJECTS_DEFAULT_CATEGORIES',
      sqlQuery: `-- Purged ${allToDeleteCatIds.length} old/dirty categories and synced standard category config across all ${projects.length} projects in Firestore server`,
      status: 'success'
    };

    onAddLog(log);
    setToastMsg(`Successfully purged ${allToDeleteCatIds.length} old category configs & applied App Default Category Config across ALL ${projects.length} projects on the server!`);
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Add Top Category Handler
  const handleAddCategorySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const cnt = newCatCount || 1;
    const rt = newCatRate || 0;
    const sh = newCatShifts || 1;
    const computedAlloc = rt > 0 ? cnt * rt * sh : (Number(newCatAllocated) || 0);

    const newCat: BudgetCategory = {
      id: `c_${selectedProjectId}_${Math.random().toString(36).substring(2, 8)}`,
      projectId: selectedProjectId,
      name: newCatName.trim(),
      code: newCatCode.trim() || undefined,
      count: cnt,
      rate: rt,
      paymentTerms: newCatTerms,
      shifts: sh,
      allocatedAmount: computedAlloc,
      spentAmount: 0,
      subCategories: []
    };

    const updated = [...localCategories, newCat];
    setLocalCategories(updated);
    setShowAddCatModal(false);
    setNewCatName('');
    setNewCatCode('');
    setNewCatCount(1);
    setNewCatRate(0);
    setNewCatTerms('PACKAGE');
    setNewCatShifts(1);
    setNewCatAllocated(0);

    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    onAddLog({
      id: `l_cat_add_${Date.now()}`,
      timestamp: nowTimestamp,
      action: 'SQL_INSERT_CATEGORY',
      sqlQuery: `INSERT INTO categories (id, projectId, name, code, allocatedAmount) VALUES ('${newCat.id}', '${selectedProjectId}', '${newCat.name.replace(/'/g, "''")}', '${newCat.code || ''}', ${newCat.allocatedAmount});`,
      status: 'success'
    });

    onUpdateCategories(updated, {
      id: `l_cat_upd_${Date.now()}`,
      timestamp: nowTimestamp,
      action: 'SAVE_CATEGORIES',
      sqlQuery: `-- Added top category ${newCat.name}`,
      status: 'success'
    });
  };

  // Open Sub Category Modal for a specific parent Category
  const openAddSubCategoryModal = (parentCatId: string) => {
    setTargetParentCatId(parentCatId);
    setShowAddSubModal(true);
  };

  // Add Sub Category Handler
  const handleAddSubCategorySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !targetParentCatId) return;

    const cnt = newSubCount || 1;
    const rt = newSubRate || 0;
    const sh = newSubShifts || 1;
    const computedAlloc = rt > 0 ? cnt * rt * sh : (Number(newSubAllocated) || 0);

    const newSub: SubCategory = {
      id: `sub_${targetParentCatId}_${Math.random().toString(36).substring(2, 7)}`,
      categoryId: targetParentCatId,
      projectId: selectedProjectId,
      name: newSubName.trim(),
      code: newSubCode.trim() || undefined,
      count: cnt,
      rate: rt,
      paymentTerms: newSubTerms,
      shifts: sh,
      allocatedAmount: computedAlloc,
      spentAmount: 0,
      childCategories: []
    };

    const updated = localCategories.map(cat => {
      if (cat.id === targetParentCatId) {
        const subList = [...(cat.subCategories || []), newSub];
        return rollupCategory({ ...cat, subCategories: subList });
      }
      return cat;
    });

    setLocalCategories(updated);
    setShowAddSubModal(false);
    setNewSubName('');
    setNewSubCode('');
    setNewSubCount(1);
    setNewSubRate(0);
    setNewSubTerms('PER DAY');
    setNewSubShifts(1);
    setNewSubAllocated(0);
    setExpandedCategoryIds(prev => ({ ...prev, [targetParentCatId]: true }));

    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    onUpdateCategories(updated, {
      id: `l_sub_add_${Date.now()}`,
      timestamp: nowTimestamp,
      action: 'ADD_SUB_CATEGORY',
      sqlQuery: `INSERT INTO sub_categories (id, categoryId, name, code, allocatedAmount) VALUES ('${newSub.id}', '${targetParentCatId}', '${newSub.name.replace(/'/g, "''")}', '${newSub.code || ''}', ${newSub.allocatedAmount});`,
      status: 'success'
    });
  };

  // Open Child Category Modal for a specific parent Sub Category
  const openAddChildCategoryModal = (parentCatId: string, parentSubId: string) => {
    setTargetParentCatId(parentCatId);
    setTargetParentSubId(parentSubId);
    setShowAddChildModal(true);
  };

  // Add Child Category Handler
  const handleAddChildCategorySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim() || !targetParentCatId || !targetParentSubId) return;

    const cnt = newChildCount || 1;
    const rt = newChildRate || 0;
    const sh = newChildShifts || 1;
    const computedAlloc = rt > 0 ? cnt * rt * sh : (Number(newChildAllocated) || 0);

    const newChild: ChildCategory = {
      id: `ch_${targetParentSubId}_${Math.random().toString(36).substring(2, 7)}`,
      subCategoryId: targetParentSubId,
      categoryId: targetParentCatId,
      projectId: selectedProjectId,
      name: newChildName.trim(),
      code: newChildCode.trim() || undefined,
      count: cnt,
      rate: rt,
      paymentTerms: newChildTerms,
      shifts: sh,
      allocatedAmount: computedAlloc,
      spentAmount: 0,
      season: newChildSeason.trim() || undefined,
      episode: newChildEpisode.trim() || undefined,
      round: newChildRound.trim() || undefined,
      challenge: newChildChallenge.trim() || undefined,
      kitchenStation: newChildKitchenStation.trim() || undefined,
      contestant: newChildContestant.trim() || undefined,
      costType: newChildCostType.trim() || undefined
    };

    const updated = localCategories.map(cat => {
      if (cat.id === targetParentCatId) {
        const updatedSubs = (cat.subCategories || []).map(sub => {
          if (sub.id === targetParentSubId) {
            const childList = [...(sub.childCategories || []), newChild];
            return {
              ...sub,
              childCategories: childList
            };
          }
          return sub;
        });
        return rollupCategory({ ...cat, subCategories: updatedSubs });
      }
      return cat;
    });

    setLocalCategories(updated);
    setShowAddChildModal(false);
    setNewChildName('');
    setNewChildCode('');
    setNewChildCount(1);
    setNewChildRate(0);
    setNewChildTerms('PER DAY');
    setNewChildShifts(1);
    setNewChildAllocated(0);
    setNewChildSeason('');
    setNewChildEpisode('');
    setNewChildRound('');
    setNewChildChallenge('');
    setNewChildKitchenStation('');
    setNewChildContestant('');
    setNewChildCostType('');
    setShowChildAllocationFields(false);
    setExpandedSubCategoryIds(prev => ({ ...prev, [targetParentSubId]: true }));

    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    onUpdateCategories(updated, {
      id: `l_child_add_${Date.now()}`,
      timestamp: nowTimestamp,
      action: 'ADD_CHILD_CATEGORY',
      sqlQuery: `INSERT INTO child_categories (id, subCategoryId, name, code, allocatedAmount) VALUES ('${newChild.id}', '${targetParentSubId}', '${newChild.name.replace(/'/g, "''")}', '${newChild.code || ''}', ${newChild.allocatedAmount});`,
      status: 'success'
    });
  };

  // Interactive inline editing for Child Category fields
  const handleChildFieldChange = (
    catId: string, 
    subId: string, 
    childId: string, 
    field: 'count' | 'rate' | 'paymentTerms' | 'shifts' | 'allocatedAmount', 
    val: any
  ) => {
    const updated = localCategories.map(cat => {
      if (cat.id === catId) {
        const updatedSubs = (cat.subCategories || []).map(sub => {
          if (sub.id === subId) {
            const updatedChildren = (sub.childCategories || []).map(ch => {
              if (ch.id === childId) {
                const updatedCh = { ...ch, [field]: val };
                if (field === 'count' || field === 'rate' || field === 'shifts') {
                  const cnt = field === 'count' ? (Number(val) || 0) : (Number(ch.count) || 1);
                  const rt = field === 'rate' ? (Number(val) || 0) : (Number(ch.rate) || 0);
                  const sh = field === 'shifts' ? (Number(val) || 0) : (Number(ch.shifts) || 1);
                  updatedCh.allocatedAmount = cnt * rt * (sh || 1);
                }
                return updatedCh;
              }
              return ch;
            });
            return { ...sub, childCategories: updatedChildren };
          }
          return sub;
        });
        return rollupCategory({ ...cat, subCategories: updatedSubs });
      }
      return cat;
    });

    setLocalCategories(updated);
    triggerDebouncedSync(updated, 'UPDATE_CHILD_FIELD', `-- Updated child field ${field}`);
  };

  // Interactive inline editing for Sub Category fields
  const handleSubFieldChange = (
    catId: string, 
    subId: string, 
    field: 'count' | 'rate' | 'paymentTerms' | 'shifts' | 'allocatedAmount', 
    val: any
  ) => {
    const updated = localCategories.map(cat => {
      if (cat.id === catId) {
        const updatedSubs = (cat.subCategories || []).map(sub => {
          if (sub.id === subId) {
            const updatedSub = { ...sub, [field]: val };
            if (field === 'count' || field === 'rate' || field === 'shifts') {
              const cnt = field === 'count' ? (Number(val) || 0) : (Number(sub.count) || 1);
              const rt = field === 'rate' ? (Number(val) || 0) : (Number(sub.rate) || 0);
              const sh = field === 'shifts' ? (Number(val) || 0) : (Number(sub.shifts) || 1);
              updatedSub.allocatedAmount = cnt * rt * (sh || 1);
            }
            return updatedSub;
          }
          return sub;
        });
        return rollupCategory({ ...cat, subCategories: updatedSubs });
      }
      return cat;
    });

    setLocalCategories(updated);
    triggerDebouncedSync(updated, 'UPDATE_SUB_FIELD', `-- Updated sub field ${field}`);
  };

  // Interactive inline editing for Top Category fields
  const handleCategoryFieldChange = (
    catId: string, 
    field: 'count' | 'rate' | 'paymentTerms' | 'shifts' | 'allocatedAmount', 
    val: any
  ) => {
    const updated = localCategories.map(cat => {
      if (cat.id === catId) {
        const updatedCat = { ...cat, [field]: val };
        if (field === 'count' || field === 'rate' || field === 'shifts') {
          const cnt = field === 'count' ? (Number(val) || 0) : (Number(cat.count) || 1);
          const rt = field === 'rate' ? (Number(val) || 0) : (Number(cat.rate) || 0);
          const sh = field === 'shifts' ? (Number(val) || 0) : (Number(cat.shifts) || 1);
          updatedCat.allocatedAmount = cnt * rt * (sh || 1);
        }
        return rollupCategory(updatedCat);
      }
      return cat;
    });

    setLocalCategories(updated);
    triggerDebouncedSync(updated, 'UPDATE_CAT_FIELD', `-- Updated category field ${field}`);
  };

  // Delete confirmation modal state
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'category' | 'subcategory' | 'childcategory';
    catId: string;
    subId?: string;
    childId?: string;
    name: string;
  } | null>(null);

  // Delete category / sub / child triggers
  const handleDeleteCategory = (catId: string, catName: string) => {
    setDeleteConfirmTarget({
      type: 'category',
      catId,
      name: catName
    });
  };

  const handleDeleteSubCategory = (catId: string, subId: string, subName: string) => {
    setDeleteConfirmTarget({
      type: 'subcategory',
      catId,
      subId,
      name: subName
    });
  };

  const handleDeleteChildCategory = (catId: string, subId: string, childId: string, childName: string) => {
    setDeleteConfirmTarget({
      type: 'childcategory',
      catId,
      subId,
      childId,
      name: childName
    });
  };

  // Perform deletion when user clicks "Yes" in modal
  const confirmDeleteAction = () => {
    if (!deleteConfirmTarget) return;
    const { type, catId, subId, childId } = deleteConfirmTarget;
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (type === 'category') {
      const updated = localCategories.filter(c => c.id !== catId);
      const resequenced = resequenceAllCategories(updated);
      setLocalCategories(resequenced);
      onUpdateCategories(resequenced, {
        id: `l_del_${Date.now()}`,
        timestamp: nowTimestamp,
        action: 'DELETE_CATEGORY',
        sqlQuery: `DELETE FROM categories WHERE id = '${catId}';`,
        status: 'warning'
      }, selectedProjectId);
    } else if (type === 'subcategory' && subId) {
      const updated = localCategories.map(cat => {
        if (cat.id === catId) {
          const updatedSubs = (cat.subCategories || []).filter(s => s.id !== subId);
          return rollupCategory({ ...cat, subCategories: updatedSubs });
        }
        return cat;
      });
      const resequenced = resequenceAllCategories(updated);
      setLocalCategories(resequenced);
      onUpdateCategories(resequenced, {
        id: `l_del_sub_${Date.now()}`,
        timestamp: nowTimestamp,
        action: 'DELETE_SUB_CATEGORY',
        sqlQuery: `DELETE FROM sub_categories WHERE id = '${subId}';`,
        status: 'warning'
      }, selectedProjectId);
    } else if (type === 'childcategory' && subId && childId) {
      const updated = localCategories.map(cat => {
        if (cat.id === catId) {
          const updatedSubs = (cat.subCategories || []).map(sub => {
            if (sub.id === subId) {
              const updatedChildren = (sub.childCategories || []).filter(ch => ch.id !== childId);
              return { ...sub, childCategories: updatedChildren };
            }
            return sub;
          });
          return rollupCategory({ ...cat, subCategories: updatedSubs });
        }
        return cat;
      });
      const resequenced = resequenceAllCategories(updated);
      setLocalCategories(resequenced);
      onUpdateCategories(resequenced, {
        id: `l_del_child_${Date.now()}`,
        timestamp: nowTimestamp,
        action: 'DELETE_CHILD_CATEGORY',
        sqlQuery: `DELETE FROM child_categories WHERE id = '${childId}';`,
        status: 'warning'
      }, selectedProjectId);
    }

    setDeleteConfirmTarget(null);
  };

  // Move / Reorder Row handlers with automatic S.NO resequencing
  const handleMoveCategory = (catIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? catIdx - 1 : catIdx + 1;
    if (targetIdx < 0 || targetIdx >= sortedCategories.length) return;

    const currentCat = sortedCategories[catIdx];
    const targetCat = sortedCategories[targetIdx];

    const currentLocalIdx = localCategories.findIndex(c => c.id === currentCat.id);
    const targetLocalIdx = localCategories.findIndex(c => c.id === targetCat.id);

    if (currentLocalIdx === -1 || targetLocalIdx === -1) return;

    const newCategories = [...localCategories];
    const temp = newCategories[currentLocalIdx];
    newCategories[currentLocalIdx] = newCategories[targetLocalIdx];
    newCategories[targetLocalIdx] = temp;

    // Resequence all S.NO serial numbers sequentially
    const resequenced = resequenceAllCategories(newCategories);

    setLocalCategories(resequenced);
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    onUpdateCategories(resequenced, {
      id: `l_reorder_cat_${Date.now()}`,
      timestamp: nowTimestamp,
      action: 'REORDER_CATEGORIES',
      sqlQuery: `-- Reordered category "${currentCat.name}" ${direction} and resequenced S.NO`,
      status: 'info'
    }, selectedProjectId);
  };

  const handleMoveSubCategory = (catId: string, subIdOrIdx: string | number, direction: 'up' | 'down') => {
    const updated = localCategories.map(cat => {
      if (cat.id === catId || (cat.id && catId && cat.id.replace(/^c_def_/, '') === catId.replace(/^c_def_/, ''))) {
        const subs = [...(cat.subCategories || [])];
        const subIdx = typeof subIdOrIdx === 'number'
          ? subIdOrIdx
          : subs.findIndex(s => s.id === subIdOrIdx);

        if (subIdx !== -1) {
          const targetIdx = direction === 'up' ? subIdx - 1 : subIdx + 1;
          if (targetIdx >= 0 && targetIdx < subs.length) {
            const temp = subs[subIdx];
            subs[subIdx] = subs[targetIdx];
            subs[targetIdx] = temp;
          }
        }
        return { ...cat, subCategories: subs };
      }
      return cat;
    });

    const resequenced = resequenceAllCategories(updated);

    setLocalCategories(resequenced);
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    onUpdateCategories(resequenced, {
      id: `l_reorder_sub_${Date.now()}`,
      timestamp: nowTimestamp,
      action: 'REORDER_SUB_CATEGORIES',
      sqlQuery: `-- Reordered sub-category ${direction} and resequenced S.NO`,
      status: 'info'
    }, selectedProjectId);
  };

  const handleMoveChildCategory = (catId: string, subId: string, childIdOrIdx: string | number, direction: 'up' | 'down') => {
    const updated = localCategories.map(cat => {
      if (cat.id === catId || (cat.id && catId && cat.id.replace(/^c_def_/, '') === catId.replace(/^c_def_/, ''))) {
        const updatedSubs = (cat.subCategories || []).map(sub => {
          if (sub.id === subId) {
            const children = [...(sub.childCategories || [])];
            const chIdx = typeof childIdOrIdx === 'number'
              ? childIdOrIdx
              : children.findIndex(c => c.id === childIdOrIdx);

            if (chIdx !== -1) {
              const targetIdx = direction === 'up' ? chIdx - 1 : chIdx + 1;
              if (targetIdx >= 0 && targetIdx < children.length) {
                const temp = children[chIdx];
                children[chIdx] = children[targetIdx];
                children[targetIdx] = temp;
              }
            }
            return { ...sub, childCategories: children };
          }
          return sub;
        });
        return { ...cat, subCategories: updatedSubs };
      }
      return cat;
    });

    const resequenced = resequenceAllCategories(updated);

    setLocalCategories(resequenced);
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    onUpdateCategories(resequenced, {
      id: `l_reorder_child_${Date.now()}`,
      timestamp: nowTimestamp,
      action: 'REORDER_CHILD_CATEGORIES',
      sqlQuery: `-- Reordered child category ${direction} and resequenced S.NO`,
      status: 'info'
    }, selectedProjectId);
  };

  // Explicit handler to manually re-sequence S.NO for the whole sheet
  const handleResequenceSNO = () => {
    const resequenced = resequenceAllCategories(localCategories);
    setLocalCategories(resequenced);
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    onUpdateCategories(resequenced, {
      id: `l_reseq_${Date.now()}`,
      timestamp: nowTimestamp,
      action: 'RESEQUENCE_SNO',
      sqlQuery: `-- Resequenced all S.NO serial numbers sequentially for project`,
      status: 'info'
    }, selectedProjectId);
  };

  // Save all category updates to database
  const handleSaveCategoryChanges = () => {
    const updatedWithCodes = resequenceAllCategories(localCategories);

    setLocalCategories(updatedWithCodes);
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    onUpdateCategories(updatedWithCodes, {
      id: `l_save_all_${Date.now()}`,
      timestamp: nowTimestamp,
      action: 'SQL_BATCH_UPDATE_HIERARCHICAL_CATEGORIES',
      sqlQuery: `-- Saved ${updatedWithCodes.length} categories with auto-rollup totals and resequenced S.NO to database`,
      status: 'success'
    }, selectedProjectId);
    setToastMsg('All category hierarchies, serial numbers, allocations, and rollups saved to database successfully!');
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Clear / purge all categories for current project so user can build new custom config from scratch
  const handleClearAllCategories = () => {
    const projName = activeProject?.name || 'this project';
    if (window.confirm(`Are you sure you want to CLEAR ALL categories for ${projName}?\n\nThis will remove all categories, sub-categories, and line items so you can create a brand new custom category structure from scratch.`)) {
      const projId = selectedProjectId || activeProject?.id;
      if (!projId) return;

      const toDeleteCatIds = categories
        .filter(c => c.projectId === projId || (c.projectId && projId && c.projectId.replace(/^wp_/, '') === projId.replace(/^wp_/, '')))
        .map(c => c.id);

      if (toDeleteCatIds.length > 0) {
        deleteCategoriesBatch(toDeleteCatIds);
      }

      const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const log: DBLog = {
        id: `l_clear_cats_${Date.now()}`,
        timestamp: nowTimestamp,
        action: 'SQL_CLEAR_ALL_CATEGORIES',
        sqlQuery: `-- Cleared all ${toDeleteCatIds.length} categories for project ${projId} to allow fresh custom category configuration`,
        status: 'success'
      };

      onUpdateCategories([], log, projId);
      setLocalCategories([]);
      setToastMsg('Successfully cleared category configuration! You can now create custom categories using "+ Add Category".');
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const currentProjectStandardStructure = useMemo(() => {
    return getBudgetStructureForProjectType(activeProject?.type || activeProject?.projectType);
  }, [activeProject]);

  const isCookingShow = useMemo(() => {
    const typeStr = ((activeProject?.projectType || activeProject?.type || '') + ' ' + (activeProject?.name || '')).toLowerCase();
    const hasCookingKeywords = typeStr.includes('cook') || typeStr.includes('culinary') || typeStr.includes('food');
    const hasCookingCategories = projectCategories.some(c => 
      c.name.toLowerCase().includes('kitchen station') || 
      c.name.toLowerCase().includes('ingredient') ||
      c.name.toLowerCase().includes('culinary')
    );
    return hasCookingKeywords || hasCookingCategories;
  }, [activeProject, projectCategories]);

  return (
    <div className="flex flex-col gap-3.5 animate-in fade-in duration-300">
      
      {/* Header, Breadcrumbs & Inline KPI Metric Widgets - Compact High-Density Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400 mb-0.5">
            <span>Projects</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
            <span className="text-slate-300 max-w-[180px] truncate">{activeProject?.name || 'Project'}</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
            <span className="text-blue-400">Category Setup</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold font-sans text-white tracking-tight">Category Setup</h3>
            <span className="px-1.5 py-0.2 bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[9px] font-mono font-bold rounded uppercase">
              {activeProject?.projectType || activeProject?.type || 'Production'} Structure
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-medium rounded">
              Project Isolation Active
            </span>
          </div>
        </div>

        {/* Compact Inline Metric Strip & Back Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric 1: Total Budget */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
            <div className="text-left">
              <p className="text-[8px] font-bold font-mono text-slate-400 uppercase tracking-wider">BUDGET</p>
              <p className="font-mono text-xs font-bold text-white">₹{totalProjectBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Metric 2: Total Spent */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
            <div className="text-left">
              <p className="text-[8px] font-bold font-mono text-slate-400 uppercase tracking-wider">SPENT</p>
              <p className="font-mono text-xs font-bold text-emerald-400">₹{totalProjectSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Metric 3: Active Categories */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
            <div className="text-left">
              <p className="text-[8px] font-bold font-mono text-slate-400 uppercase tracking-wider">CATEGORIES</p>
              <p className="font-mono text-xs font-bold text-purple-300">
                {projectCategories.length} <span className="text-[9px] text-slate-400 font-normal">({projectCategories.reduce((s, c) => s + (c.subCategories?.length || 0), 0)} subs)</span>
              </p>
            </div>
          </div>

          {onBackToBudget && (
            <button
              onClick={onBackToBudget}
              className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-sans text-[11px] font-semibold rounded-lg border border-slate-700 flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
              title="Return to Approved Budget Overview"
            >
              ← Back
            </button>
          )}
        </div>
      </div>

      {/* Cooking Show Compact Ribbon */}
      {isCookingShow && (
        <CookingShowAnalyticsBar
          project={activeProject}
          categories={projectCategories}
        />
      )}

      {/* Compact Outdated Structure Warning Banner */}
      {isStructureOutdated && !isReadOnlyRole && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg px-3 py-1.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-amber-200 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-amber-300">Category Structure Notice:</span> Current project has {projectCategories.length} categories vs {currentProjectStandardStructure.length} standard categories for {activeProject?.type || activeProject?.projectType || 'this type'}.
            </div>
          </div>
          <button
            onClick={executeResetToStandardCategories}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[10.5px] font-bold rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Re-create ({currentProjectStandardStructure.length} Categories)
          </button>
        </div>
      )}

      {/* Main Content Area: Spreadsheet Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xs">
        
        {/* Table Filter & Action Bar - Compact Unified Theme */}
        <div className="p-2 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text"
              placeholder="Search category, subcategory, child item or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7.5 pr-6 py-1 bg-slate-900 border border-slate-800 rounded-md text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 flex-wrap">
            <button 
              onClick={() => {
                const catMap: Record<string, boolean> = {};
                const subMap: Record<string, boolean> = {};
                projectCategories.forEach(c => {
                  catMap[c.id] = true;
                  (c.subCategories || []).forEach(s => { subMap[s.id] = true; });
                });
                setExpandedCategoryIds(catMap);
                setExpandedSubCategoryIds(subMap);
              }}
              className="h-6.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-sans text-[10.5px] font-medium rounded border border-slate-800 flex items-center gap-1 transition-all cursor-pointer"
              title="Expand all category and sub-category rows"
            >
              <ChevronDown className="w-3 h-3 text-slate-400" />
              <span>Expand</span>
            </button>

            <button 
              onClick={() => {
                setExpandedCategoryIds({});
                setExpandedSubCategoryIds({});
              }}
              className="h-6.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-sans text-[10.5px] font-medium rounded border border-slate-800 flex items-center gap-1 transition-all cursor-pointer"
              title="Collapse all rows"
            >
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span>Collapse</span>
            </button>

            {!isReadOnlyRole && (
              <button 
                id="btn-recreate-budget-structure"
                onClick={handleResetToStandardCategories}
                className="h-6.5 px-2 bg-amber-950/30 hover:bg-amber-900/50 text-amber-300 font-sans text-[10.5px] font-medium rounded border border-amber-600/30 flex items-center gap-1 transition-all cursor-pointer"
                title="Re-create and synchronize standard 3-tier budget categories for this project"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span className="hidden md:inline">Reset</span>
              </button>
            )}

            {!isReadOnlyRole && (
              <button 
                onClick={handleClearAllCategories}
                className="h-6.5 px-2 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 font-sans text-[10.5px] font-medium rounded border border-rose-700/30 flex items-center gap-1 transition-all cursor-pointer"
                title="Clear all categories for this project to build a fresh custom category structure"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span className="hidden md:inline">Clear</span>
              </button>
            )}

            {!isReadOnlyRole && (
              <button 
                onClick={() => setShowAddCatModal(true)}
                className="h-6.5 px-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-sans text-[10.5px] font-semibold rounded border border-blue-500/40 flex items-center gap-1 transition-all cursor-pointer"
              >
                <PlusCircle className="w-3 h-3 text-blue-400" />
                <span>+ Category</span>
              </button>
            )}

            <button 
              onClick={() => setShowPdfPreviewModal(true)}
              className="h-6.5 px-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 font-sans text-[10.5px] font-semibold rounded border border-emerald-600/40 flex items-center gap-1 transition-all cursor-pointer"
              title="Preview and print complete budget sheet with all categories, subcategories, child categories, and amounts"
            >
              <Printer className="w-3 h-3 text-emerald-300" />
              <span>Export</span>
            </button>

            {!isReadOnlyRole && (
              <button 
                onClick={handleSaveCategoryChanges}
                className="h-6.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-sans text-[10.5px] font-bold rounded shadow-xs flex items-center gap-1 transition-all cursor-pointer"
              >
                <CheckCircle className="w-3 h-3" />
                <span>Save</span>
              </button>
            )}
          </div>
        </div>

        {isReadOnlyRole && (
          <div className="mx-3 mt-2.5 mb-1 p-2.5 bg-amber-950/40 border border-amber-500/30 text-amber-200 rounded-lg text-xs font-medium flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">🔒 Shared Project Clearance Notice:</span>
              <span>Your active role (<strong>{activeRoleName}</strong>) has read-only clearance. Category configuration changes are saved on a per-project basis by authorized Editors, Producers, and Admins.</span>
            </div>
          </div>
        )}

        {/* Spreadsheet Grid Table */}
        <div 
          className="overflow-x-auto"
          onFocusCapture={() => {
            isInputFocusedRef.current = true;
            isLocalEditingRef.current = true;
          }}
          onBlurCapture={() => {
            setTimeout(() => {
              const activeEl = document.activeElement;
              const isStillInside = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA');
              if (!isStillInside) {
                isInputFocusedRef.current = false;
                if (!debounceTimerRef.current) {
                  isLocalEditingRef.current = false;
                }
              }
            }, 300);
          }}
        >
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 font-mono text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                <th className="py-1.5 px-2 w-12 text-center border-r border-slate-800/80">S.NO</th>
                <th className="py-1.5 px-2 min-w-[220px] border-r border-slate-800/80">CATEGORY / SUB CATEGORY / CHILD CATEGORY</th>
                <th className="py-1.5 px-1.5 w-16 text-center border-r border-slate-800/80">COUNT</th>
                <th className="py-1.5 px-2 w-22 text-right border-r border-slate-800/80">RATE (₹)</th>
                <th className="py-1.5 px-1.5 w-24 text-center border-r border-slate-800/80">PAYMENT TERMS</th>
                <th className="py-1.5 px-1.5 w-18 text-center border-r border-slate-800/80">TIMELINE / SHIFTS</th>
                <th className="py-1.5 px-2 w-26 text-right border-r border-slate-800/80">AMOUNT (₹)</th>
                <th className="py-1.5 px-1.5 w-24 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans text-xs">
              {sortedCategories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FolderTree className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    No budget categories found for this project. Click <strong>"Reset Structure"</strong> or <strong>"+ Category"</strong> above to start.
                  </td>
                </tr>
              ) : (
                sortedCategories.map((cat, catIdx) => {
                  const isCatExpanded = searchQuery.trim() ? true : !!expandedCategoryIds[cat.id];
                  const hasSubCategories = (cat.subCategories || []).length > 0;
                  const catSerial = String(catIdx + 1);

                  return (
                    <Fragment key={cat.id ? `${cat.id}-${catIdx}` : `cat-${catIdx}`}>
                      {/* LEVEL 1: TOP CATEGORY ROW - SLEEK DARK ACCENT & PIPELINE TRUNK */}
                      <tr className="bg-slate-900/95 hover:bg-slate-850 text-white font-bold border-t border-b border-slate-750 transition-colors border-l-[3px] border-l-blue-500 group">
                        <td className="py-1.5 px-2 text-center font-mono font-bold text-blue-400 border-r border-slate-800/80 text-[11px]">
                          {catSerial}
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-800/80">
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => toggleCategoryExpand(cat.id)}
                              className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                            >
                              {hasSubCategories ? (
                                isCatExpanded ? <ChevronDown className="w-3.5 h-3.5 text-blue-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <span className="w-3.5 inline-block text-center text-slate-600 text-[10px]">•</span>
                              )}
                            </button>
                            <span className="font-bold text-white text-[11.5px] uppercase tracking-tight truncate max-w-[260px]" title={cat.name}>{cat.name}</span>
                            {hasSubCategories && (
                              <span className="px-1.5 py-0.2 bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[8.5px] font-mono font-bold rounded">
                                {cat.subCategories?.length} Subs
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Count / Rate / Terms / Shifts for Category */}
                        {hasSubCategories ? (
                          <>
                            <td className="py-1.5 px-1.5 text-center font-mono text-[9.5px] text-slate-500 border-r border-slate-800/80 font-normal italic">Auto-Sum</td>
                            <td className="py-1.5 px-2 text-right font-mono text-[9.5px] text-slate-500 border-r border-slate-800/80 font-normal italic">—</td>
                            <td className="py-1.5 px-1.5 text-center font-mono text-[9.5px] text-slate-500 border-r border-slate-800/80 font-normal italic">—</td>
                            <td className="py-1.5 px-1.5 text-center font-mono text-[9.5px] text-slate-500 border-r border-slate-800/80 font-normal italic">—</td>
                          </>
                        ) : (
                          <>
                            <td className="py-1.5 px-1.5 text-center border-r border-slate-800/80">
                              <input 
                                type="number" 
                                min="1" 
                                value={cat.count !== undefined && cat.count !== null ? cat.count : ''} 
                                onChange={(e) => handleCategoryFieldChange(cat.id, 'count', e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-12 h-6 text-center px-1 bg-slate-950 border border-slate-750 rounded font-mono font-bold text-[11px] text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                              />
                            </td>
                            <td className="py-1.5 px-2 text-right border-r border-slate-800/80">
                              <input 
                                type="number" 
                                min="0" 
                                value={cat.rate !== undefined && cat.rate !== null ? cat.rate : ''} 
                                onChange={(e) => handleCategoryFieldChange(cat.id, 'rate', e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-18 h-6 text-right px-1 bg-slate-950 border border-slate-750 rounded font-mono font-bold text-[11px] text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                              />
                            </td>
                            <td className="py-1.5 px-1.5 text-center border-r border-slate-800/80">
                              <select 
                                value={cat.paymentTerms || 'PACKAGE'} 
                                onChange={(e) => handleCategoryFieldChange(cat.id, 'paymentTerms', e.target.value)}
                                className="w-22 h-6 text-center px-0.5 bg-slate-950 border border-slate-750 rounded font-mono text-[9px] font-bold text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                              >
                                {PAYMENT_TERMS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            </td>
                            <td className="py-1.5 px-1.5 text-center border-r border-slate-800/80">
                              <input 
                                type="number" 
                                min="1" 
                                value={cat.shifts !== undefined && cat.shifts !== null ? cat.shifts : ''} 
                                onChange={(e) => handleCategoryFieldChange(cat.id, 'shifts', e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-12 h-6 text-center px-1 bg-slate-950 border border-slate-750 rounded font-mono font-bold text-[11px] text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                              />
                            </td>
                          </>
                        )}

                        {/* Amount */}
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-white border-r border-slate-800/80 text-xs">
                          ₹{(Number(cat.allocatedAmount) || 0).toLocaleString('en-IN')}
                        </td>

                        {/* Actions */}
                        <td className="py-1.5 px-1.5 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              onClick={() => handleMoveCategory(catIdx, 'up')}
                              disabled={catIdx === 0}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed rounded cursor-pointer"
                              title="Move Category Up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleMoveCategory(catIdx, 'down')}
                              disabled={catIdx === sortedCategories.length - 1}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed rounded cursor-pointer"
                              title="Move Category Down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => startInlineAddSubCategory(cat.id)}
                              className="px-1.5 py-0.5 bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white font-bold text-[9px] rounded border border-blue-500/40 flex items-center gap-0.5 transition-all cursor-pointer"
                              title="Add Sub Category row below"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Sub</span>
                            </button>
                            <button 
                              onClick={() => openEditCategory(cat)}
                              className="p-1 text-slate-400 hover:text-blue-400 rounded cursor-pointer"
                              title="Rename Category"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="p-1 text-slate-400 hover:text-rose-400 rounded cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* LEVEL 2: SUB CATEGORIES */}
                      {isCatExpanded && (
                        <>
                          {(cat.subCategories || []).map((sub, subIdx) => {
                            const isSubExpanded = searchQuery.trim() ? true : !!expandedSubCategoryIds[sub.id];
                            const hasChildCategories = (sub.childCategories || []).length > 0;
                            const subSerial = `${catSerial}.${subIdx + 1}`;

                            return (
                              <Fragment key={sub.id ? `${sub.id}-${subIdx}` : `sub-${subIdx}`}>
                                <tr className="bg-slate-900/40 hover:bg-slate-850/50 border-t border-slate-800/60 transition-colors border-l-[3px] border-l-cyan-500/50">
                                  <td className="py-1 px-1.5 text-center font-mono text-cyan-400 text-[10.5px] font-semibold border-r border-slate-800/80">
                                    {subSerial}
                                  </td>
                                  <td className="py-1 px-2 border-r border-slate-800/80 pl-4">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-slate-500 text-[11px] select-none">├─</span>
                                      <button 
                                        onClick={() => toggleSubCategoryExpand(sub.id)}
                                        className="p-0.5 rounded text-slate-400 hover:text-white cursor-pointer"
                                      >
                                        {hasChildCategories ? (
                                          isSubExpanded ? <ChevronDown className="w-3 h-3 text-cyan-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />
                                        ) : (
                                          <span className="w-3 inline-block"></span>
                                        )}
                                      </button>
                                      <span className="font-semibold text-slate-200 text-xs truncate max-w-[240px]" title={sub.name}>{sub.name}</span>
                                      {hasChildCategories && (
                                        <span className="px-1.5 py-0.2 bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[8.5px] font-mono font-bold rounded">
                                          {sub.childCategories?.length} Children
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Sub Category Count / Rate / Terms / Shifts */}
                                  {hasChildCategories ? (
                                    <>
                                      <td className="py-1 px-1.5 text-center font-mono text-[9px] text-slate-500 border-r border-slate-800/80 italic">Auto-Sum</td>
                                      <td className="py-1 px-2 text-right font-mono text-[9px] text-slate-500 border-r border-slate-800/80 italic">—</td>
                                      <td className="py-1 px-1.5 text-center font-mono text-[9px] text-slate-500 border-r border-slate-800/80 italic">—</td>
                                      <td className="py-1 px-1.5 text-center font-mono text-[9px] text-slate-500 border-r border-slate-800/80 italic">—</td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="py-1 px-1.5 text-center border-r border-slate-800/80">
                                        <input 
                                          type="number" 
                                          min="1" 
                                          value={sub.count !== undefined && sub.count !== null ? sub.count : ''} 
                                          onChange={(e) => handleSubFieldChange(cat.id, sub.id, 'count', e.target.value === '' ? '' : Number(e.target.value))}
                                          className="w-12 h-6 text-center px-1 bg-slate-950 border border-slate-750 rounded font-mono font-bold text-[11px] text-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none"
                                        />
                                      </td>
                                      <td className="py-1 px-2 text-right border-r border-slate-800/80">
                                        <input 
                                          type="number" 
                                          min="0" 
                                          value={sub.rate !== undefined && sub.rate !== null ? sub.rate : ''} 
                                          onChange={(e) => handleSubFieldChange(cat.id, sub.id, 'rate', e.target.value === '' ? '' : Number(e.target.value))}
                                          className="w-18 h-6 text-right px-1 bg-slate-950 border border-slate-750 rounded font-mono font-bold text-[11px] text-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none"
                                        />
                                      </td>
                                      <td className="py-1 px-1.5 text-center border-r border-slate-800/80">
                                        <select 
                                          value={sub.paymentTerms || 'PACKAGE'} 
                                          onChange={(e) => handleSubFieldChange(cat.id, sub.id, 'paymentTerms', e.target.value)}
                                          className="w-22 h-6 text-center px-0.5 bg-slate-950 border border-slate-750 rounded font-mono text-[9px] font-bold text-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none"
                                        >
                                          {PAYMENT_TERMS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                      </td>
                                      <td className="py-1 px-1.5 text-center border-r border-slate-800/80">
                                        <input 
                                          type="number" 
                                          min="1" 
                                          value={sub.shifts !== undefined && sub.shifts !== null ? sub.shifts : ''} 
                                          onChange={(e) => handleSubFieldChange(cat.id, sub.id, 'shifts', e.target.value === '' ? '' : Number(e.target.value))}
                                          className="w-12 h-6 text-center px-1 bg-slate-950 border border-slate-750 rounded font-mono font-bold text-[11px] text-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none"
                                        />
                                      </td>
                                    </>
                                  )}

                                  {/* Amount */}
                                  <td className="py-1 px-2 text-right font-mono font-semibold text-slate-200 border-r border-slate-800/80 text-[11.5px]">
                                    ₹{(Number(sub.allocatedAmount) || 0).toLocaleString('en-IN')}
                                  </td>

                                  {/* Actions */}
                                  <td className="py-1 px-1.5 text-center">
                                    <div className="flex items-center justify-center gap-0.5">
                                      <button
                                        onClick={() => handleMoveSubCategory(cat.id, subIdx, 'up')}
                                        disabled={subIdx === 0}
                                        className="p-1 text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed rounded cursor-pointer"
                                        title="Move Sub Category Up"
                                      >
                                        <ArrowUp className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleMoveSubCategory(cat.id, subIdx, 'down')}
                                        disabled={subIdx === (cat.subCategories || []).length - 1}
                                        className="p-1 text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed rounded cursor-pointer"
                                        title="Move Sub Category Down"
                                      >
                                        <ArrowDown className="w-3 h-3" />
                                      </button>
                                      <button 
                                        onClick={() => startInlineAddChildCategory(cat.id, sub.id)}
                                        className="px-1.5 py-0.5 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white font-bold text-[8.5px] rounded border border-purple-500/40 flex items-center gap-0.5 transition-all cursor-pointer"
                                        title="Add Child Category row below"
                                      >
                                        <Plus className="w-2.5 h-2.5" />
                                        <span>Child</span>
                                      </button>
                                      <button 
                                        onClick={() => openEditSubCategory(cat.id, sub)}
                                        className="p-1 text-slate-400 hover:text-cyan-400 rounded cursor-pointer"
                                        title="Rename Sub Category"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteSubCategory(cat.id, sub.id, sub.name)}
                                        className="p-1 text-slate-400 hover:text-rose-400 rounded cursor-pointer"
                                        title="Delete Sub Category"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>

                                {/* LEVEL 3: CHILD CATEGORIES */}
                                {isSubExpanded && (
                                  <>
                                    {(sub.childCategories || []).map((ch, chIdx) => {
                                      const childSerial = `${subSerial}.${chIdx + 1}`;
                                      const hasAllocations = Boolean(ch.episode || ch.kitchenStation || ch.challenge || ch.contestant || ch.costType);

                                      return (
                                        <tr key={ch.id ? `${ch.id}-${chIdx}` : `ch-${chIdx}`} className="bg-slate-950/60 hover:bg-slate-900/60 border-t border-slate-850/60 border-l-[3px] border-l-purple-500/40 text-[10.5px] transition-colors">
                                          <td className="py-1 px-1.5 text-center font-mono text-purple-400/80 font-medium border-r border-slate-800/80 text-[10px]">
                                            {childSerial}
                                          </td>
                                          <td className="py-1 px-2 border-r border-slate-800/80 pl-8">
                                            <div className="flex flex-col gap-0.5">
                                              <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-slate-600 text-[11px] select-none">│  └─</span>
                                                <span className="font-medium text-slate-300 text-[11px] truncate max-w-[220px]" title={ch.name}>{ch.name}</span>
                                              </div>
                                              {hasAllocations && (
                                                <div className="flex flex-wrap items-center gap-1 pl-6 pt-0.5">
                                                  {ch.episode && (
                                                    <span className="px-1 py-0.2 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded text-[8px] font-mono">
                                                      {ch.episode}
                                                    </span>
                                                  )}
                                                  {ch.kitchenStation && (
                                                    <span className="px-1 py-0.2 bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded text-[8px] font-mono">
                                                      {ch.kitchenStation}
                                                    </span>
                                                  )}
                                                  {ch.challenge && (
                                                    <span className="px-1 py-0.2 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded text-[8px] font-mono">
                                                      {ch.challenge}
                                                    </span>
                                                  )}
                                                  {ch.contestant && (
                                                    <span className="px-1 py-0.2 bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded text-[8px] font-mono">
                                                      {ch.contestant}
                                                    </span>
                                                  )}
                                                  {ch.costType && (
                                                    <span className="px-1 py-0.2 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded text-[8px] font-mono">
                                                      {ch.costType}
                                                    </span>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </td>

                                          {/* Child Category Count */}
                                          <td className="py-1 px-1.5 text-center border-r border-slate-800/80">
                                            <input 
                                              type="number" 
                                              min="1" 
                                              value={ch.count !== undefined && ch.count !== null ? ch.count : ''} 
                                              onChange={(e) => handleChildFieldChange(cat.id, sub.id, ch.id, 'count', e.target.value === '' ? '' : Number(e.target.value))}
                                              className="w-12 h-5.5 text-center px-0.5 bg-slate-950 border border-slate-800 rounded font-mono font-medium text-[10.5px] text-slate-200 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
                                            />
                                          </td>

                                          {/* Child Category Rate */}
                                          <td className="py-1 px-2 text-right border-r border-slate-800/80">
                                            <input 
                                              type="number" 
                                              min="0" 
                                              value={ch.rate !== undefined && ch.rate !== null ? ch.rate : ''} 
                                              onChange={(e) => handleChildFieldChange(cat.id, sub.id, ch.id, 'rate', e.target.value === '' ? '' : Number(e.target.value))}
                                              className="w-18 h-5.5 text-right px-1 bg-slate-950 border border-slate-800 rounded font-mono font-medium text-[10.5px] text-slate-200 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
                                            />
                                          </td>

                                          {/* Child Category Payment Terms */}
                                          <td className="py-1 px-1.5 text-center border-r border-slate-800/80">
                                            <select 
                                              value={ch.paymentTerms || 'PER DAY'} 
                                              onChange={(e) => handleChildFieldChange(cat.id, sub.id, ch.id, 'paymentTerms', e.target.value)}
                                              className="w-22 h-5.5 text-center px-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-[8.5px] font-medium text-slate-200 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
                                            >
                                              {PAYMENT_TERMS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                          </td>

                                          {/* Child Category Time Line / Shifts */}
                                          <td className="py-1 px-1.5 text-center border-r border-slate-800/80">
                                            <input 
                                              type="number" 
                                              min="1" 
                                              value={ch.shifts !== undefined && ch.shifts !== null ? ch.shifts : ''} 
                                              onChange={(e) => handleChildFieldChange(cat.id, sub.id, ch.id, 'shifts', e.target.value === '' ? '' : Number(e.target.value))}
                                              className="w-12 h-5.5 text-center px-0.5 bg-slate-950 border border-slate-800 rounded font-mono font-medium text-[10.5px] text-slate-200 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
                                            />
                                          </td>

                                          {/* Child Category Amount */}
                                          <td className="py-1 px-2 text-right font-mono font-medium text-slate-300 border-r border-slate-800/80 text-[11px]">
                                            ₹{(Number(ch.allocatedAmount) || 0).toLocaleString('en-IN')}
                                          </td>

                                          {/* Actions */}
                                          <td className="py-1 px-1.5 text-center">
                                            <div className="flex items-center justify-center gap-0.5">
                                              <button
                                                onClick={() => handleMoveChildCategory(cat.id, sub.id, chIdx, 'up')}
                                                disabled={chIdx === 0}
                                                className="p-1 text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed rounded cursor-pointer"
                                                title="Move Child Category Up"
                                              >
                                                <ArrowUp className="w-3 h-3" />
                                              </button>
                                              <button
                                                onClick={() => handleMoveChildCategory(cat.id, sub.id, chIdx, 'down')}
                                                disabled={chIdx === (sub.childCategories || []).length - 1}
                                                className="p-1 text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed rounded cursor-pointer"
                                                title="Move Child Category Down"
                                              >
                                                <ArrowDown className="w-3 h-3" />
                                              </button>
                                              <button 
                                                onClick={() => openAllocationModal(cat.id, sub.id, ch)}
                                                className={`p-1 rounded cursor-pointer transition-colors ${
                                                  hasAllocations 
                                                    ? 'text-amber-400 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30' 
                                                    : 'text-slate-500 hover:text-amber-400'
                                                }`}
                                                title="Tag Budget Allocation (Season, Episode, Station, Challenge, Contestant, Cost Type)"
                                              >
                                                <Tag className="w-3 h-3" />
                                              </button>
                                              <button 
                                                onClick={() => openEditChildCategory(cat.id, sub.id, ch)}
                                                className="p-1 text-slate-400 hover:text-purple-400 rounded cursor-pointer"
                                                title="Rename Child Category"
                                              >
                                                <Edit2 className="w-3 h-3" />
                                              </button>
                                              <button 
                                                onClick={() => handleDeleteChildCategory(cat.id, sub.id, ch.id, ch.name)}
                                                className="p-1 text-slate-400 hover:text-rose-400 rounded cursor-pointer"
                                                title="Delete Child Category"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}

                                    {/* INLINE CHILD CATEGORY CREATION ROW */}
                                    {inlineChildCatTargetSubId === sub.id && (
                                      <tr className="bg-purple-950/40 border-2 border-purple-500/60 font-sans text-xs transition-all animate-in fade-in duration-200">
                                        <td className="py-1 px-1.5 text-center font-mono text-purple-300 font-bold border-r border-purple-900/60 text-[10px]">
                                          + Child
                                        </td>
                                        <td className="py-1 px-2 border-r border-purple-900/60 pl-8">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-mono text-purple-400 font-bold text-xs select-none">│  └─</span>
                                            <input 
                                              type="text" 
                                              autoFocus
                                              placeholder={isCharacterSubCategory(sub.name) ? "Character Name..." : "Child category name..."}
                                              value={inlineName}
                                              onChange={(e) => setInlineName(e.target.value)}
                                              onKeyDown={(e) => { if (e.key === 'Enter') submitInlineChildCategory(cat.id, sub.id); }}
                                              className="w-full h-6 px-1.5 bg-slate-950 border border-purple-500/50 rounded font-medium text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                                            />
                                          </div>
                                        </td>
                                        <td className="py-1 px-1.5 text-center border-r border-purple-900/60">
                                          <input 
                                            type="number" 
                                            min="1" 
                                            value={inlineCount} 
                                            onChange={(e) => setInlineCount(Number(e.target.value))}
                                            className="w-12 h-6 text-center px-0.5 bg-slate-950 border border-purple-500/40 rounded font-mono font-medium text-[11px] text-white"
                                          />
                                        </td>
                                        <td className="py-1 px-2 text-right border-r border-purple-900/60">
                                          <input 
                                            type="number" 
                                            min="0" 
                                            value={inlineRate} 
                                            onChange={(e) => setInlineRate(Number(e.target.value))}
                                            className="w-18 h-6 text-right px-1 bg-slate-950 border border-purple-500/40 rounded font-mono font-medium text-[11px] text-white"
                                          />
                                        </td>
                                        <td className="py-1 px-1.5 text-center border-r border-purple-900/60">
                                          <select 
                                            value={inlinePaymentTerms} 
                                            onChange={(e) => setInlinePaymentTerms(e.target.value)}
                                            className="w-22 h-6 text-center px-0.5 bg-slate-950 border border-purple-500/40 rounded font-mono text-[9px] font-medium text-white"
                                          >
                                            {PAYMENT_TERMS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                          </select>
                                        </td>
                                        <td className="py-1 px-1.5 text-center border-r border-purple-900/60">
                                          <input 
                                            type="number" 
                                            min="1" 
                                            value={inlineShifts} 
                                            onChange={(e) => setInlineShifts(Number(e.target.value))}
                                            className="w-12 h-6 text-center px-0.5 bg-slate-950 border border-purple-500/40 rounded font-mono font-medium text-[11px] text-white"
                                          />
                                        </td>
                                        <td className="py-1 px-2 text-right font-mono font-bold text-purple-300 border-r border-purple-900/60 text-xs">
                                          ₹{(inlineCount * inlineRate * inlineShifts).toLocaleString()}
                                        </td>
                                        <td className="py-1 px-1.5 text-center">
                                          <div className="flex items-center justify-center gap-1">
                                            <button 
                                              type="button"
                                              onClick={() => submitInlineChildCategory(cat.id, sub.id)}
                                              className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] rounded cursor-pointer flex items-center gap-0.5"
                                            >
                                              <CheckCircle className="w-3 h-3" />
                                              Add
                                            </button>
                                            <button 
                                              type="button"
                                              onClick={() => { setInlineChildCatTargetSubId(null); setInlineChildCatTargetCatId(null); }}
                                              className="p-1 text-slate-400 hover:text-rose-400 rounded cursor-pointer"
                                              title="Cancel"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </>
                                )}
                              </Fragment>
                            );
                          })}

                          {/* INLINE SUB CATEGORY CREATION ROW */}
                          {inlineSubCatTargetCatId === cat.id && (
                            <tr className="bg-cyan-950/40 border-2 border-cyan-500/60 font-sans text-xs transition-all animate-in fade-in duration-200">
                              <td className="py-1 px-1.5 text-center font-mono text-cyan-300 font-bold border-r border-cyan-900/60 text-[10px]">
                                + Sub
                              </td>
                              <td className="py-1 px-2 border-r border-cyan-900/60 pl-4">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-cyan-400 font-bold text-xs select-none">├─</span>
                                  <input 
                                    type="text" 
                                    autoFocus
                                    placeholder="Sub Category Name..." 
                                    value={inlineName}
                                    onChange={(e) => setInlineName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') submitInlineSubCategory(cat.id); }}
                                    className="w-full h-6 px-1.5 bg-slate-950 border border-cyan-500/50 rounded font-medium text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                                  />
                                </div>
                              </td>
                              <td className="py-1 px-1.5 text-center border-r border-cyan-900/60">
                                <input 
                                  type="number" 
                                  min="1" 
                                  value={inlineCount} 
                                  onChange={(e) => setInlineCount(Number(e.target.value))}
                                  className="w-12 h-6 text-center px-0.5 bg-slate-950 border border-cyan-500/40 rounded font-mono font-medium text-[11px] text-white"
                                />
                              </td>
                              <td className="py-1 px-2 text-right border-r border-cyan-900/60">
                                <input 
                                  type="number" 
                                  min="0" 
                                  value={inlineRate} 
                                  onChange={(e) => setInlineRate(Number(e.target.value))}
                                  className="w-18 h-6 text-right px-1 bg-slate-950 border border-cyan-500/40 rounded font-mono font-medium text-[11px] text-white"
                                />
                              </td>
                              <td className="py-1 px-1.5 text-center border-r border-cyan-900/60">
                                <select 
                                  value={inlinePaymentTerms} 
                                  onChange={(e) => setInlinePaymentTerms(e.target.value)}
                                  className="w-22 h-6 text-center px-0.5 bg-slate-950 border border-cyan-500/40 rounded font-mono text-[9px] font-medium text-white"
                                >
                                  {PAYMENT_TERMS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              </td>
                              <td className="py-1 px-1.5 text-center border-r border-cyan-900/60">
                                <input 
                                  type="number" 
                                  min="1" 
                                  value={inlineShifts} 
                                  onChange={(e) => setInlineShifts(Number(e.target.value))}
                                  className="w-12 h-6 text-center px-0.5 bg-slate-950 border border-cyan-500/40 rounded font-mono font-medium text-[11px] text-white"
                                />
                              </td>
                              <td className="py-1 px-2 text-right font-mono font-bold text-cyan-300 border-r border-cyan-900/60 text-xs">
                                ₹{(inlineCount * inlineRate * inlineShifts).toLocaleString()}
                              </td>
                              <td className="py-1 px-1.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button 
                                    type="button"
                                    onClick={() => submitInlineSubCategory(cat.id)}
                                    className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] rounded cursor-pointer flex items-center gap-0.5"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    Add
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => setInlineSubCatTargetCatId(null)}
                                    className="p-1 text-slate-400 hover:text-rose-400 rounded cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="px-3 py-2 bg-slate-950 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-2 font-mono text-[10.5px]">
            <span className="text-slate-500">Rollup Logic:</span>
            <span className="text-slate-300 font-medium">Child (Count × Rate × Shifts) &rarr; Sub Category &rarr; Category &rarr; Project Budget</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Total Allocated: <strong className="text-white font-bold">₹{(Number(totalProjectBudget) || 0).toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD TOP CATEGORY */}
      {showAddCatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <form 
            onSubmit={handleAddCategorySubmit}
            className="w-full max-w-lg bg-slate-900 border border-slate-750 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-white"
          >
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-400" />
                Add Top Level Category
              </h3>
              <button type="button" onClick={() => setShowAddCatModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Category Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Story and Other Rights, Pre Production Expenses"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Code / S.No (Optional)</label>
                  <input 
                    type="text"
                    placeholder="e.g. 1"
                    value={newCatCode}
                    onChange={(e) => setNewCatCode(e.target.value)}
                    className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs font-mono text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Count (Units)</label>
                  <input 
                    type="number"
                    min="1"
                    value={newCatCount}
                    onChange={(e) => setNewCatCount(Number(e.target.value))}
                    className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs font-mono text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Rate (₹)</label>
                  <input 
                    type="number"
                    min="0"
                    value={newCatRate}
                    onChange={(e) => setNewCatRate(Number(e.target.value))}
                    className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs font-mono text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Payment Terms</label>
                  <select 
                    value={newCatTerms}
                    onChange={(e) => setNewCatTerms(e.target.value)}
                    className="w-full h-8 px-2 bg-slate-950 border border-slate-750 text-xs font-mono text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {PAYMENT_TERMS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Timeline / Shifts</label>
                  <input 
                    type="number"
                    min="1"
                    value={newCatShifts}
                    onChange={(e) => setNewCatShifts(Number(e.target.value))}
                    className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs font-mono text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {newCatRate > 0 && (
                <div className="p-2.5 bg-blue-950/40 border border-blue-500/30 rounded-lg flex items-center justify-between text-xs font-mono text-blue-200">
                  <span>Calculated Initial Amount:</span>
                  <strong className="text-white">₹{(newCatCount * newCatRate * newCatShifts).toLocaleString()}</strong>
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setShowAddCatModal(false)}
                className="px-3 py-1.5 border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
              >
                Create Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: ADD SUB CATEGORY */}
      {showAddSubModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <form 
            onSubmit={handleAddSubCategorySubmit}
            className="w-full max-w-lg bg-slate-900 border border-slate-750 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-white"
          >
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-400" />
                Add Sub Category
              </h3>
              <button type="button" onClick={() => setShowAddSubModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Parent Category</label>
                <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-blue-300">
                  {projectCategories.find(c => c.id === targetParentCatId)?.name || 'Selected Category'}
                </div>
              </div>

              <div>
                <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Sub Category Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Writer Fee, Recce Expense Transport"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Sub Code (Optional)</label>
                  <input 
                    type="text"
                    placeholder="e.g. 1.1"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs font-mono text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Count (Units)</label>
                  <input 
                    type="number"
                    min="1"
                    value={newSubCount}
                    onChange={(e) => setNewSubCount(Number(e.target.value))}
                    className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs font-mono text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Rate (₹)</label>
                  <input 
                    type="number"
                    min="0"
                    value={newSubRate}
                    onChange={(e) => setNewSubRate(Number(e.target.value))}
                    className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs font-mono text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Payment Terms</label>
                  <select 
                    value={newSubTerms}
                    onChange={(e) => setNewSubTerms(e.target.value)}
                    className="w-full h-8 px-2 bg-slate-950 border border-slate-750 text-xs font-mono text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {PAYMENT_TERMS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Timeline / Shifts</label>
                  <input 
                    type="number"
                    min="1"
                    value={newSubShifts}
                    onChange={(e) => setNewSubShifts(Number(e.target.value))}
                    className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs font-mono text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {newSubRate > 0 && (
                <div className="p-2.5 bg-blue-950/40 border border-blue-500/30 rounded-lg flex items-center justify-between text-xs font-mono text-blue-200">
                  <span>Calculated Sub Total:</span>
                  <strong className="text-white">₹{(newSubCount * newSubRate * newSubShifts).toLocaleString()}</strong>
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setShowAddSubModal(false)}
                className="px-3 py-1.5 border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
              >
                Add Sub Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: ADD CHILD CATEGORY */}
      {showAddChildModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <form 
            onSubmit={handleAddChildCategorySubmit}
            className="w-full max-w-lg bg-slate-900 border border-slate-750 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-white"
          >
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-purple-400" />
                Add Child Category
              </h3>
              <button type="button" onClick={() => setShowAddChildModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Parent Sub Category</label>
                <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-purple-300">
                  {projectCategories.find(c => c.id === targetParentCatId)?.subCategories?.find(s => s.id === targetParentSubId)?.name || 'Selected Sub Category'}
                </div>
              </div>

              {(() => {
                const targetSubName = projectCategories.find(c => c.id === targetParentCatId)?.subCategories?.find(s => s.id === targetParentSubId)?.name;
                const isCharSub = isCharacterSubCategory(targetSubName);
                return (
                  <div>
                    <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">
                      {isCharSub ? "Character Name *" : "Child Category Name *"}
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder={isCharSub ? "Type Character Name" : "e.g. Travels Car, Studio Rent, Lights Rent"}
                      value={newChildName}
                      onChange={(e) => setNewChildName(e.target.value)}
                      className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Child Code (Optional)</label>
                  <input 
                    type="text"
                    placeholder="e.g. 1.1.1"
                    value={newChildCode}
                    onChange={(e) => setNewChildCode(e.target.value)}
                    className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs font-mono text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Count (Units)</label>
                  <input 
                    type="number"
                    min="1"
                    value={newChildCount}
                    onChange={(e) => setNewChildCount(Number(e.target.value))}
                    className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs font-mono text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Rate (₹)</label>
                  <input 
                    type="number"
                    min="0"
                    value={newChildRate}
                    onChange={(e) => setNewChildRate(Number(e.target.value))}
                    className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs font-mono text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Payment Terms</label>
                  <select 
                    value={newChildTerms}
                    onChange={(e) => setNewChildTerms(e.target.value)}
                    className="w-full h-8 px-2 bg-slate-950 border border-slate-750 text-xs font-mono text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    {PAYMENT_TERMS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Timeline / Shifts</label>
                  <input 
                    type="number"
                    min="1"
                    value={newChildShifts}
                    onChange={(e) => setNewChildShifts(Number(e.target.value))}
                    className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs font-mono text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {newChildRate > 0 && (
                <div className="p-2.5 bg-purple-950/40 border border-purple-500/30 rounded-lg flex items-center justify-between text-xs font-mono text-purple-200">
                  <span>Calculated Child Total:</span>
                  <strong className="text-white">₹{(newChildCount * newChildRate * newChildShifts).toLocaleString()}</strong>
                </div>
              )}

              {/* Collapsible ERP Allocation Tags */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowChildAllocationFields(!showChildAllocationFields)}
                  className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{showChildAllocationFields ? 'Hide' : '+ Add'} ERP &amp; Budget Allocation Tags (Episode, Station, Challenge, Contestant)</span>
                </button>
                {showChildAllocationFields && (
                  <div className="mt-2.5 p-2.5 bg-slate-950 border border-slate-800 rounded-lg grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase block mb-1">Episode</label>
                      <input 
                        type="text"
                        placeholder="e.g. Episode 04"
                        value={newChildEpisode}
                        onChange={(e) => setNewChildEpisode(e.target.value)}
                        className="w-full h-7 px-2 bg-slate-900 border border-slate-750 rounded text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase block mb-1">Kitchen Station</label>
                      <input 
                        type="text"
                        placeholder="e.g. Station 03"
                        value={newChildKitchenStation}
                        onChange={(e) => setNewChildKitchenStation(e.target.value)}
                        className="w-full h-7 px-2 bg-slate-900 border border-slate-750 rounded text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase block mb-1">Challenge / Round</label>
                      <input 
                        type="text"
                        placeholder="e.g. Mystery Box"
                        value={newChildChallenge}
                        onChange={(e) => setNewChildChallenge(e.target.value)}
                        className="w-full h-7 px-2 bg-slate-900 border border-slate-750 rounded text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase block mb-1">Contestant</label>
                      <input 
                        type="text"
                        placeholder="e.g. Contestant 01"
                        value={newChildContestant}
                        onChange={(e) => setNewChildContestant(e.target.value)}
                        className="w-full h-7 px-2 bg-slate-900 border border-slate-750 rounded text-xs text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase block mb-1">Cost Type</label>
                      <select
                        value={newChildCostType}
                        onChange={(e) => setNewChildCostType(e.target.value)}
                        className="w-full h-7 px-2 bg-slate-900 border border-slate-750 rounded text-xs text-white"
                      >
                        <option value="">-- Standard / General --</option>
                        {COOKING_SHOW_COST_TYPES.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setShowAddChildModal(false)}
                className="px-3 py-1.5 border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
              >
                Add Child Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: RENAME / EDIT CATEGORY ITEM */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <form 
            onSubmit={handleEditSubmit}
            className="w-full max-w-md bg-slate-900 border border-slate-750 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-white"
          >
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-400" />
                Rename / Edit {editType === 'category' ? 'Category' : editType === 'subcategory' ? 'Sub Category' : 'Child Category'}
              </h3>
              <button type="button" onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Item Name *</label>
                <input 
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">Code / Ref Number</label>
                <input 
                  type="text"
                  placeholder="e.g. 1 or 1.1 or 1.1.1"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs font-mono text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setShowEditModal(false)}
                className="px-3 py-1.5 border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 5: DELETE CONFIRMATION MODAL */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-750 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-white">
            <div className="p-4 border-b border-slate-800 flex items-start gap-3 bg-slate-950/60">
              <div className="p-2 bg-rose-950/60 border border-rose-500/30 text-rose-400 rounded-lg shrink-0 mt-0.5">
                <Trash2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Delete Item?</h3>
                <p className="text-[11.5px] text-slate-400 mt-1 leading-relaxed">
                  This will remove <span className="font-semibold text-rose-300">"{deleteConfirmTarget.name}"</span> from your budget hierarchy.
                </p>
              </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-950/80 flex items-center justify-end gap-2 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-3 py-1.5 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-lg transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={confirmDeleteAction}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: READY-TO-PRINT PDF / BUDGET DOCUMENT PREVIEW */}
      {showPdfPreviewModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in duration-200 overflow-y-auto">
          {/* Printable style overrides when calling window.print() */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-budget-document, #printable-budget-document * {
                visibility: visible !important;
              }
              #printable-budget-document {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 16px !important;
                box-shadow: none !important;
                background: white !important;
                color: black !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Control Header (no-print) */}
            <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between no-print shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Ready-to-Print Budget Document
                  </h3>
                  <p className="text-xs text-slate-400">
                    Preview complete category hierarchy, sub-categories, child items & amounts for {activeProject?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const csvRows: string[] = [
                      'S.NO,Category Name,Type,Count,Rate (INR),Payment Terms,Shifts/Days,Total Amount (INR)'
                    ];
                    sortedCategories.forEach((cat, cIdx) => {
                      const cSerial = cat.code || String(cIdx + 1);
                      csvRows.push(`"${cSerial}","${cat.name.replace(/"/g, '""')}","Category",,,,"${cat.allocatedAmount || 0}"`);
                      (cat.subCategories || []).forEach((sub, sIdx) => {
                        const sSerial = sub.code || `${cSerial}.${sIdx + 1}`;
                        csvRows.push(`"${sSerial}","${sub.name.replace(/"/g, '""')}","SubCategory","${sub.count || ''}","${sub.rate || ''}","${(sub.paymentTerms || '').replace(/"/g, '""')}","${sub.shifts || ''}","${sub.allocatedAmount || 0}"`);
                        (sub.childCategories || []).forEach((ch, chIdx) => {
                          const chSerial = ch.code || `${sSerial}.${chIdx + 1}`;
                          csvRows.push(`"${chSerial}","${ch.name.replace(/"/g, '""')}","ChildCategory","${ch.count || ''}","${ch.rate || ''}","${(ch.paymentTerms || '').replace(/"/g, '""')}","${ch.shifts || ''}","${ch.allocatedAmount || 0}"`);
                        });
                      });
                    });
                    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', `${(activeProject?.name || 'Project').replace(/\s+/g, '_')}_Budget_Sheet.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg border border-slate-600 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save PDF
                </button>

                <button
                  type="button"
                  onClick={() => setShowPdfPreviewModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-all cursor-pointer ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Container */}
            <div className="p-6 sm:p-10 overflow-y-auto bg-slate-100 flex-1">
              <div 
                id="printable-budget-document"
                className="w-full max-w-4xl mx-auto bg-white border border-slate-300 rounded-xl shadow-lg p-8 text-slate-900 font-sans"
              >
                {/* Official Sheet Header */}
                <div className="border-b-2 border-slate-900 pb-5 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-mono font-bold tracking-widest text-emerald-800 uppercase mb-1">
                      PRODUCTION BUDGET ERP • OFFICIAL ESTIMATE
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                      {activeProject?.name || 'Project Budget Sheet'}
                    </h1>
                    <p className="text-xs text-slate-600 mt-1">
                      Code: <span className="font-mono font-semibold text-slate-800">{activeProject?.projectCode || activeProject?.id || 'LOG-2026-001'}</span> • Status: <span className="font-semibold">{activeProject?.status || 'Active'}</span>
                    </p>
                  </div>

                  <div className="sm:text-right bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Grand Total Budget</div>
                    <div className="text-2xl font-black text-emerald-800 font-mono">
                      ₹{sortedCategories.reduce((sum, c) => sum + (Number(c.allocatedAmount) || 0), 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Export Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Summary Metadata Metrics */}
                <div className="grid grid-cols-4 gap-3 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Top Categories</div>
                    <div className="text-sm font-bold text-slate-800">{sortedCategories.length}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Sub-Categories</div>
                    <div className="text-sm font-bold text-slate-800">
                      {sortedCategories.reduce((acc, c) => acc + (c.subCategories || []).length, 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Child Items</div>
                    <div className="text-sm font-bold text-slate-800">
                      {sortedCategories.reduce((acc, c) => acc + (c.subCategories || []).reduce((chAcc, sub) => chAcc + (sub.childCategories || []).length, 0), 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Currency</div>
                    <div className="text-sm font-bold text-slate-800">{activeProject?.currency || 'INR (₹)'}</div>
                  </div>
                </div>

                {/* Main Hierarchical Categories Print Table */}
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-mono text-[10px] uppercase border-b-2 border-slate-900">
                      <th className="py-2.5 px-3 w-16 text-center">S.NO</th>
                      <th className="py-2.5 px-3">CATEGORY / SUB CATEGORY / CHILD CATEGORY</th>
                      <th className="py-2.5 px-3 w-16 text-center">COUNT</th>
                      <th className="py-2.5 px-3 w-24 text-right">RATE (₹)</th>
                      <th className="py-2.5 px-3 w-28 text-center">TERMS</th>
                      <th className="py-2.5 px-3 w-20 text-center">SHIFTS/DAYS</th>
                      <th className="py-2.5 px-3 w-32 text-right">AMOUNT (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCategories.map((cat, cIdx) => {
                      const cSerial = cat.code || String(cIdx + 1);

                      return (
                        <Fragment key={`sum-cat-${cat.id || cIdx}-${cIdx}`}>
                          {/* Top Level Category Row */}
                          <tr className="bg-slate-800 text-white font-bold border-t border-slate-700">
                            <td className="py-2 px-3 text-center font-mono text-amber-300">{cSerial}</td>
                            <td className="py-2 px-3 uppercase tracking-wide text-xs">{cat.name}</td>
                            <td className="py-2 px-3 text-center text-slate-300 text-[10px] italic">Auto-Sum</td>
                            <td className="py-2 px-3 text-right text-slate-400">—</td>
                            <td className="py-2 px-3 text-center text-slate-400">—</td>
                            <td className="py-2 px-3 text-center text-slate-400">—</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-300">
                              ₹{(Number(cat.allocatedAmount) || 0).toLocaleString('en-IN')}
                            </td>
                          </tr>

                          {/* Sub Categories & Child Categories */}
                          {(cat.subCategories || []).map((sub, sIdx) => {
                            const sSerial = sub.code || `${cSerial}.${sIdx + 1}`;

                            return (
                              <Fragment key={`sum-sub-${sub.id || sIdx}-${sIdx}`}>
                                {/* Sub Category Row */}
                                <tr className="bg-slate-100 font-semibold border-t border-slate-200 text-slate-900">
                                  <td className="py-1.5 px-3 text-center font-mono text-slate-700 text-[11px]">{sSerial}</td>
                                  <td className="py-1.5 px-3 pl-6 font-semibold text-slate-800 text-xs">
                                    ↳ {sub.name}
                                  </td>
                                  <td className="py-1.5 px-3 text-center font-mono text-slate-600">{sub.count || '—'}</td>
                                  <td className="py-1.5 px-3 text-right font-mono text-slate-600">
                                    {sub.rate ? `₹${Number(sub.rate).toLocaleString('en-IN')}` : '—'}
                                  </td>
                                  <td className="py-1.5 px-3 text-center text-[10px] text-slate-600 font-mono">
                                    {sub.paymentTerms || 'Standard'}
                                  </td>
                                  <td className="py-1.5 px-3 text-center font-mono text-slate-600">{sub.shifts || 1}</td>
                                  <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                                    ₹{(Number(sub.allocatedAmount) || 0).toLocaleString('en-IN')}
                                  </td>
                                </tr>

                                {/* Child Categories */}
                                {(sub.childCategories || []).map((child, chIdx) => {
                                  const chSerial = child.code || `${sSerial}.${chIdx + 1}`;

                                  return (
                                    <tr key={`sum-ch-${child.id || chIdx}-${chIdx}`} className="border-t border-slate-100 hover:bg-slate-50 text-slate-700 text-[11px]">
                                      <td className="py-1.5 px-3 text-center font-mono text-slate-500 text-[10px]">{chSerial}</td>
                                      <td className="py-1.5 px-3 pl-10 text-slate-700">
                                        • {child.name}
                                      </td>
                                      <td className="py-1.5 px-3 text-center font-mono text-slate-600">{child.count || 1}</td>
                                      <td className="py-1.5 px-3 text-right font-mono text-slate-600">
                                        {child.rate ? `₹${Number(child.rate).toLocaleString('en-IN')}` : '₹0'}
                                      </td>
                                      <td className="py-1.5 px-3 text-center text-[10px] text-slate-500">
                                        {child.paymentTerms || '—'}
                                      </td>
                                      <td className="py-1.5 px-3 text-center font-mono text-slate-600">{child.shifts || 1}</td>
                                      <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-800">
                                        ₹{(Number(child.allocatedAmount) || 0).toLocaleString('en-IN')}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </Fragment>
                            );
                          })}
                        </Fragment>
                      );
                    })}

                    {/* Grand Total Footer Row */}
                    <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-900">
                      <td colSpan={6} className="py-3 px-4 text-right uppercase tracking-wider font-mono">
                        GRAND TOTAL PROJECT ESTIMATE:
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-sm text-emerald-300 underline underline-offset-4 decoration-emerald-400">
                        ₹{sortedCategories.reduce((sum, c) => sum + (Number(c.allocatedAmount) || 0), 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Sign-Off & Approval Section */}
                <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-3 gap-8 text-center text-xs">
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-400 mb-2"></div>
                    <div className="font-bold text-slate-800">Prepared By</div>
                    <div className="text-[10px] text-slate-500">Line Producer / Accountant</div>
                  </div>
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-400 mb-2"></div>
                    <div className="font-bold text-slate-800">Verified By</div>
                    <div className="text-[10px] text-slate-500">Production Controller</div>
                  </div>
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-400 mb-2"></div>
                    <div className="font-bold text-slate-800">Approved By</div>
                    <div className="text-[10px] text-slate-500">Executive Producer</div>
                  </div>
                </div>

                <div className="mt-8 text-center text-[10px] text-slate-400 font-mono">
                  Production Budget ERP • Generated automatically • Confidential Document
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200 text-slate-900 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                <RotateCcw className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset Category Configuration?</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to replace ALL categories for this project with the default <strong>{activeProject?.type || activeProject?.projectType || 'Standard'}</strong> budget structure ({currentProjectStandardStructure.length} Top Categories, Sub-Categories, and Child Categories)?
                </p>
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2 mt-2 font-medium">
                  ⚠️ This action will re-populate all {currentProjectStandardStructure.length} top categories with their standard sub-categories and child items.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirmModal(false);
                  executeResetToStandardCategories();
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm Reset ({currentProjectStandardStructure.length} Categories)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Budget Allocation & ERP Tags Modal */}
      {allocationModalChild && (
        <BudgetAllocationFieldsModal
          child={allocationModalChild}
          isOpen={Boolean(allocationModalChild)}
          onClose={() => setAllocationModalChild(null)}
          onSave={handleSaveAllocationFields}
        />
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-700 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
          <button 
            type="button" 
            onClick={() => setToastMsg(null)}
            className="ml-2 text-slate-400 hover:text-white font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
