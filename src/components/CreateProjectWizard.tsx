import React, { useState, useEffect, useMemo } from 'react';
import { 
  generateStandardCategoriesForProject, 
  generateDefaultPhasesForProject, 
  computeEndAndDays, 
  cleanYYYYMMDD,
  cleanProjectTitle,
  isProjectAdminRole
} from '../data';
import { 
  subscribeCompanies, 
  subscribeProjects,
  subscribeWorkspaceProjects,
  saveWorkspaceProject,
  saveDocData,
  saveProject,
  deleteDocData,
  deleteProject,
  deleteWorkspaceProject
} from '../services/firebaseService';
import { WorkspaceProject } from './WorkspaceView';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Wallet, 
  Check, 
  AlertCircle, 
  FolderPlus, 
  Info, 
  Building2, 
  Users, 
  Save, 
  Calendar, 
  Clock, 
  Film, 
  X, 
  FileText, 
  Briefcase, 
  Trash2, 
  CheckCircle2,
  ShieldCheck,
  Tv,
  Layers,
  Send,
  UserCheck
} from 'lucide-react';
import { Project, BudgetCategory, DBLog, Company, Season } from '../types';

interface CreateProjectWizardProps {
  onProjectCreated: (
    newProj: Project, 
    newCategories: BudgetCategory[], 
    mfgLog: DBLog
  ) => void;
  onCancel: () => void;
  onDeleteProject?: (projectId: string) => void;
  initialCompanyName?: string;
  projectToEdit?: any;
  userEmail?: string;
  currentRole?: string;
}

export const ALL_PROJECT_TYPES = [
  'Film',
  'OTT',
  'AD Film',
  'TV Series',
  'Non-Fiction TV Show',
  'Reality Show',
  'Talent Show',
  'Music Reality Show',
  'Dance Reality Show',
  'Cooking Show',
  'Quiz Show',
  'Game Show',
  'Talk Show',
  'Lifestyle Show',
  'Travel Show',
  'Award Show',
  'Sports Show',
  'Documentary Series',
  'Short Film',
  'Corporate Video',
  'Other'
];

export const NON_FICTION_PROJECT_TYPES = ALL_PROJECT_TYPES;

export const FORMAT_OPTIONS_BY_PROJECT_TYPE: Record<string, { label: string; options: string[] }> = {
  'Film': {
    label: 'Film Format / Release Type',
    options: [
      'Theatrical Feature Film',
      'Direct-to-OTT Feature',
      'Indie / Festival Feature',
      'Short Film',
      'Regional Feature Film',
      'Documentary Feature Film'
    ]
  },
  'OTT': {
    label: 'OTT Series Format',
    options: [
      'OTT Original Web Series (Multi-Episode)',
      'OTT Mini-Series (3-6 Episodes)',
      'OTT Limited Series',
      'OTT Direct Movie / Feature',
      'OTT Docuseries',
      'OTT Unscripted / Reality Series'
    ]
  },
  'AD Film': {
    label: 'AD / Commercial Format',
    options: [
      'TV Commercial (TVC 30s / 60s)',
      'Digital & Social Media Campaign',
      'Corporate Brand Anthem / Film',
      'Product Launch Video',
      'Digital Video Commercial (DVC)',
      'Promo / Teaser Spot'
    ]
  },
  'TV Series': {
    label: 'TV Series Format',
    options: [
      'Daily Soap / Serial (Mon-Fri / Mon-Sat)',
      'Prime Time Drama Series',
      'Weekly Special Fiction',
      'Mini Fiction Series',
      'Sitcom / Comedy Series',
      'Mythological / Historical Drama'
    ]
  },
  'Non-Fiction TV Show': {
    label: 'Show Format',
    options: [
      'Daily Strip (Mon-Fri)',
      'Weekend Prime Time',
      'Weekly Special',
      'Seasonal Special (10-15 Eps)',
      'Mega Reality Event',
      'Mini Series'
    ]
  }
};

export function getFormatConfigForProjectType(projType: string): { label: string; options: string[] } {
  const cleanType = (projType || '').trim().toLowerCase();

  if (cleanType === 'ad film' || cleanType.includes('ad film') || cleanType.includes('commercial')) {
    return FORMAT_OPTIONS_BY_PROJECT_TYPE['AD Film'];
  }
  if (cleanType === 'ott' || cleanType.includes('ott') || cleanType.includes('web series')) {
    return FORMAT_OPTIONS_BY_PROJECT_TYPE['OTT'];
  }
  if (cleanType === 'film' || cleanType.includes('film') || cleanType.includes('feature')) {
    return FORMAT_OPTIONS_BY_PROJECT_TYPE['Film'];
  }
  if (cleanType === 'tv series' || cleanType.includes('tv series') || cleanType.includes('fiction')) {
    return FORMAT_OPTIONS_BY_PROJECT_TYPE['TV Series'];
  }

  return FORMAT_OPTIONS_BY_PROJECT_TYPE['Non-Fiction TV Show'];
}

export function isSeasonNotRequiredForType(projType: string): boolean {
  const cleanType = (projType || '').trim().toLowerCase();
  if (!cleanType) return false;
  return (
    cleanType === 'film' ||
    cleanType === 'ott' ||
    cleanType === 'ad film' ||
    cleanType === 'short film' ||
    cleanType === 'corporate video' ||
    cleanType.includes('film') ||
    cleanType.includes('commercial')
  );
}

export const SHOW_FORMAT_OPTIONS = [
  'Daily Strip (Mon-Fri)',
  'Weekend Prime Time',
  'Weekly Special',
  'Seasonal Special (10-15 Eps)',
  'Mega Reality Event',
  'Mini Series',
  'Theatrical Feature Film',
  'OTT Original Web Series',
  'TV Commercial (TVC)',
  'Daily Soap / Serial'
];

interface InvitedTeamMember {
  id: string;
  name: string;
  email: string;
  mobile: string;
  designation: string;
  department: string;
  role: string;
  permissionTemplate: string;
  startDate: string;
  endDate: string;
}

export default function CreateProjectWizard({ 
  onProjectCreated, 
  onCancel, 
  onDeleteProject,
  initialCompanyName, 
  projectToEdit, 
  userEmail,
  currentRole
}: CreateProjectWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [fullCompanies, setFullCompanies] = useState<Company[]>([]);
  const [existingProjectsList, setExistingProjectsList] = useState<{ id: string; name: string }[]>([]);

  // STEP 1: PROJECT INFORMATION
  const [projName, setProjName] = useState<string>('');
  const [projCode, setProjCode] = useState<string>(() => `PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [projType, setProjType] = useState<string>('Film');
  const [showFormat, setShowFormat] = useState<string>('Theatrical Feature Film');
  const [execSummary, setExecSummary] = useState<string>('');

  const currentFormatConfig = getFormatConfigForProjectType(projType);
  const isSeasonNotRequired = isSeasonNotRequiredForType(projType);

  const handleProjectTypeChange = (newType: string) => {
    setProjType(newType);
    const newConfig = getFormatConfigForProjectType(newType);
    if (!newConfig.options.includes(showFormat)) {
      setShowFormat(newConfig.options[0]);
    }
    const seasonNotReq = isSeasonNotRequiredForType(newType);
    if (seasonNotReq && currentStep > 3) {
      setCurrentStep(3);
    }
  };
  const [defaultCurrency, setDefaultCurrency] = useState<string>('INR');
  const [timeZone, setTimeZone] = useState<string>('Asia/Kolkata');
  const [expectedStartDate, setExpectedStartDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [expectedEndDate, setExpectedEndDate] = useState<string>('');
  const [expectedSeasonsCount, setExpectedSeasonsCount] = useState<number>(1);
  const [projectStatus, setProjectStatus] = useState<string>('Pre-Production');

  // STEP 2: COMPANY REGISTRATION
  const [companyChoice, setCompanyChoice] = useState<'existing' | 'new'>('new');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [compName, setCompName] = useState<string>(initialCompanyName || '');
  const [compLegalName, setCompLegalName] = useState<string>('');
  const [compCode, setCompCode] = useState<string>('');
  const [compEntityType, setCompEntityType] = useState<string>('Private Limited (Pvt Ltd)');
  const [compRegNumber, setCompRegNumber] = useState<string>('');
  const [compGstin, setCompGstin] = useState<string>('');
  const [compPan, setCompPan] = useState<string>('');
  const [compEmail, setCompEmail] = useState<string>('');
  const [compPhone, setCompPhone] = useState<string>('');
  const [compAddress, setCompAddress] = useState<string>('');
  const [compCity, setCompCity] = useState<string>('Kolkata');
  const [compState, setCompState] = useState<string>('West Bengal');
  const [compPinCode, setCompPinCode] = useState<string>('700001');
  const [compCountry, setCompCountry] = useState<string>('India');
  const [compLogoUrl, setCompLogoUrl] = useState<string>('');
  const [authPersonName, setAuthPersonName] = useState<string>('');
  const [authPersonDesignation, setAuthPersonDesignation] = useState<string>('Director');
  const [bankName, setBankName] = useState<string>('');
  const [bankAccountNo, setBankAccountNo] = useState<string>('');
  const [bankIfsc, setBankIfsc] = useState<string>('');

  // STEP 3: SEASON SETUP
  const [createFirstSeason, setCreateFirstSeason] = useState<boolean>(true);
  const [seasonName, setSeasonName] = useState<string>('Season 01');
  const [seasonNumber, setSeasonNumber] = useState<number>(1);
  const [seasonCode, setSeasonCode] = useState<string>('S01');
  const [seasonDesc, setSeasonDesc] = useState<string>('Premier Launch Season');
  const [expectedEpisodes, setExpectedEpisodes] = useState<number>(26);
  const [expectedShootDays, setExpectedShootDays] = useState<number>(15);
  const [seasonStartDate, setSeasonStartDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [seasonEndDate, setSeasonEndDate] = useState<string>('');
  const [telecastStartDate, setTelecastStartDate] = useState<string>('');
  const [episodeDuration, setEpisodeDuration] = useState<string>('45 mins');
  const [channelPlatform, setChannelPlatform] = useState<string>('Star Jalsha / Disney+ Hotstar');
  const [seasonStatus, setSeasonStatus] = useState<'Planning' | 'Pre-Production' | 'In Production' | 'Post-Production' | 'Delivering' | 'Completed' | 'Archived' | 'Cancelled'>('Pre-Production');

  // STEP 4: PROJECT OWNER SETUP
  const activeLoginEmail = userEmail || (typeof window !== 'undefined' ? sessionStorage.getItem('erp_user_email') : null) || 'sujoy.production@gmail.com';
  const ownerEmail = (projectToEdit?.createdBy || activeLoginEmail).toLowerCase().trim();
  const ownerRole = 'Project Owner & Admin';

  // STEP 5: BUDGET SETUP
  const [budgetOption, setBudgetOption] = useState<'non_fiction_template' | 'excel' | 'copy' | 'blank'>('non_fiction_template');
  const [projBudget, setProjBudget] = useState<string | number>(0);

  // STEP 6: INVITE TEAM
  const [invitedMembers, setInvitedMembers] = useState<InvitedTeamMember[]>([
    {
      id: 'inv_1',
      name: 'Production Head',
      email: 'prodhead@studio.com',
      mobile: '+91 9876543210',
      designation: 'Executive Producer',
      department: 'Production',
      role: 'Executive Producer',
      permissionTemplate: 'Full Operational Control',
      startDate: new Date().toISOString().substring(0, 10),
      endDate: ''
    }
  ]);
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberEmail, setNewMemberEmail] = useState<string>('');
  const [newMemberMobile, setNewMemberMobile] = useState<string>('');
  const [newMemberDesignation, setNewMemberDesignation] = useState<string>('Production Manager');
  const [newMemberDepartment, setNewMemberDepartment] = useState<string>('Production');
  const [newMemberRole, setNewMemberRole] = useState<string>('Production Manager');

  // Fetch companies and existing projects to validate unique project names
  useEffect(() => {
    const unsubComp = subscribeCompanies((data) => {
      if (data && data.length > 0) {
        setFullCompanies(data);
        if (!selectedCompanyId && data[0]?.id && !projectToEdit) {
          setSelectedCompanyId(data[0].id);
          setCompName(data[0].name || '');
          setCompLegalName(data[0].legalName || data[0].name || '');
          setCompAddress(data[0].address || '');
          setCompEmail(data[0].email || '');
          setCompPhone(data[0].phone || '');
          setCompGstin(data[0].gstNumber || '');
          setCompPan(data[0].panNumber || '');
        }
      }
    });

    let pList: { id: string; name: string }[] = [];
    let wpList: { id: string; name: string }[] = [];

    const updateProjectsList = () => {
      const combined = [...pList, ...wpList];
      setExistingProjectsList(combined);
    };

    const unsubP = subscribeProjects((data) => {
      if (Array.isArray(data)) {
        pList = data.map(p => ({ id: p.id, name: p.name }));
        updateProjectsList();
      }
    });

    const unsubWp = subscribeWorkspaceProjects((data) => {
      if (Array.isArray(data)) {
        wpList = data.map(wp => ({ id: wp.id, name: wp.name }));
        updateProjectsList();
      }
    });

    return () => {
      unsubComp();
      unsubP();
      unsubWp();
    };
  }, []);

  // Duplicate project name validation check
  const isDuplicateName = useMemo(() => {
    const target = cleanProjectTitle(projName).toLowerCase().trim();
    if (!target) return false;

    return existingProjectsList.some(p => {
      if (projectToEdit) {
        const editCleanId = (projectToEdit.id || '').replace(/^(wp_|p_|proj_)/, '');
        const pCleanId = p.id.replace(/^(wp_|p_|proj_)/, '');
        const editCleanName = cleanProjectTitle(projectToEdit.name || '').toLowerCase().trim();
        if (p.id === projectToEdit.id || pCleanId === editCleanId || (editCleanName && editCleanName === target)) {
          return false;
        }
      }
      const existingClean = cleanProjectTitle(p.name || '').toLowerCase().trim();
      return existingClean === target;
    });
  }, [projName, existingProjectsList, projectToEdit]);

function parseBudgetValue(val: any): number {
  if (typeof val === 'number' && val > 0) return val;
  if (!val) return 0;
  const str = String(val).replace(/,/g, '').trim();
  const crMatch = str.match(/([0-9.]+)\s*Cr/i);
  if (crMatch) return Math.round(parseFloat(crMatch[1]) * 10000000);
  const lMatch = str.match(/([0-9.]+)\s*L/i);
  if (lMatch) return Math.round(parseFloat(lMatch[1]) * 100000);
  const numMatch = str.match(/[0-9]+/);
  if (numMatch) return parseInt(numMatch[0], 10);
  return 0;
}

  // When editing project or picking company
  useEffect(() => {
    if (projectToEdit) {
      const rawP = projectToEdit.rawProject || {};
      const targetProject = { ...rawP, ...projectToEdit };
      
      const rawName = targetProject.name || '';
      const cleanName = cleanProjectTitle(rawName).replace(/\s*\([^)]+\)$/, '').trim();
      setProjName(cleanName || rawName);
      
      const extractedCode = targetProject.projectCode || targetProject.ref || (rawName.match(/\(([^)]+)\)$/)?.[1]) || '';
      setProjCode(extractedCode || '');
      
      setProjType(targetProject.projectType || 'Film');
      setShowFormat(targetProject.showFormat || targetProject.format || 'Theatrical Feature Film');
      
      const cName = targetProject.companyName || targetProject.compName || '';
      setCompName(cName);
      
      setCompLegalName(rawP.compLegalName !== undefined ? rawP.compLegalName : (targetProject.compLegalName !== undefined ? targetProject.compLegalName : cName));
      setCompAddress(rawP.compAddress !== undefined ? rawP.compAddress : (targetProject.compAddress !== undefined ? targetProject.compAddress : ''));
      setCompEmail(rawP.compEmail !== undefined ? rawP.compEmail : (targetProject.compEmail !== undefined ? targetProject.compEmail : ''));
      setCompPhone(rawP.compPhone !== undefined ? rawP.compPhone : (targetProject.compPhone !== undefined ? targetProject.compPhone : ''));
      setCompGstin(rawP.compGstin !== undefined ? rawP.compGstin : (targetProject.compGstin !== undefined ? targetProject.compGstin : ''));
      setCompPan(rawP.compPan !== undefined ? rawP.compPan : (targetProject.compPan !== undefined ? targetProject.compPan : ''));
      setCompCity(rawP.compCity !== undefined ? rawP.compCity : (targetProject.compCity !== undefined ? targetProject.compCity : 'Kolkata'));
      setCompState(rawP.compState !== undefined ? rawP.compState : (targetProject.compState !== undefined ? targetProject.compState : 'West Bengal'));
      setCompCountry(rawP.compCountry !== undefined ? rawP.compCountry : (targetProject.compCountry !== undefined ? targetProject.compCountry : 'India'));
      setCompPinCode(rawP.compPinCode !== undefined ? rawP.compPinCode : (targetProject.compPinCode !== undefined ? targetProject.compPinCode : '700001'));
      setCompEntityType(rawP.compEntityType || targetProject.compEntityType || 'Private Limited (Pvt Ltd)');
      setCompRegNumber(rawP.compRegNumber !== undefined ? rawP.compRegNumber : (targetProject.compRegNumber !== undefined ? targetProject.compRegNumber : ''));
      setAuthPersonName(rawP.authPersonName !== undefined ? rawP.authPersonName : (targetProject.authPersonName !== undefined ? targetProject.authPersonName : ''));
      setAuthPersonDesignation(rawP.authPersonDesignation !== undefined ? rawP.authPersonDesignation : (targetProject.authPersonDesignation !== undefined ? targetProject.authPersonDesignation : 'Director'));
      setBankName(rawP.bankName !== undefined ? rawP.bankName : (targetProject.bankName !== undefined ? targetProject.bankName : ''));
      setBankAccountNo(rawP.bankAccountNo !== undefined ? rawP.bankAccountNo : (targetProject.bankAccountNo !== undefined ? targetProject.bankAccountNo : ''));
      setBankIfsc(rawP.bankIfsc !== undefined ? rawP.bankIfsc : (targetProject.bankIfsc !== undefined ? targetProject.bankIfsc : ''));
      
      let bVal: number = 0;
      if (typeof targetProject.totalBudget === 'number' && targetProject.totalBudget > 0) {
        bVal = targetProject.totalBudget;
      } else if (targetProject.budget) {
        bVal = parseBudgetValue(targetProject.budget);
      }
      setProjBudget(bVal);

      setExecSummary(rawP.execSummary !== undefined ? rawP.execSummary : (targetProject.description || targetProject.execSummary || ''));
      setExpectedStartDate(rawP.startDate || rawP.expectedStartDate || targetProject.startDate || targetProject.expectedStartDate || new Date().toISOString().substring(0, 10));
      setExpectedEndDate(rawP.endDate || rawP.expectedEndDate || targetProject.endDate || targetProject.expectedEndDate || '');
      setDefaultCurrency(rawP.currency || targetProject.currency || 'INR');
      setTimeZone(rawP.timeZone || targetProject.timeZone || 'Asia/Kolkata');
      setProjectStatus(rawP.status || targetProject.status || 'Pre-Production');
      setChannelPlatform(rawP.channelPlatform !== undefined ? rawP.channelPlatform : (targetProject.channelPlatform !== undefined ? targetProject.channelPlatform : 'Star Jalsha / Disney+ Hotstar'));
      setSeasonName(rawP.seasonName !== undefined ? rawP.seasonName : (targetProject.seasonName !== undefined ? targetProject.seasonName : 'Season 01'));
      setSeasonCode(rawP.seasonCode !== undefined ? rawP.seasonCode : (targetProject.seasonCode !== undefined ? targetProject.seasonCode : 'S01'));

      const sStartDate = rawP.seasonStartDate !== undefined
        ? rawP.seasonStartDate
        : (projectToEdit.seasonStartDate !== undefined
          ? projectToEdit.seasonStartDate
          : (rawP.schedule?.shootingStartDate || targetProject.schedule?.shootingStartDate || rawP.startDate || targetProject.startDate || ''));
      setSeasonStartDate(sStartDate);

      const tStartDate = rawP.telecastStartDate !== undefined
        ? rawP.telecastStartDate
        : (projectToEdit.telecastStartDate !== undefined
          ? projectToEdit.telecastStartDate
          : (rawP.schedule?.targetReleaseDate || targetProject.schedule?.targetReleaseDate || rawP.targetReleaseDate || targetProject.targetReleaseDate || ''));
      setTelecastStartDate(tStartDate);

      setEpisodeDuration(rawP.episodeDuration !== undefined ? rawP.episodeDuration : (targetProject.episodeDuration !== undefined ? targetProject.episodeDuration : '45 mins'));
      setExpectedEpisodes(rawP.expectedEpisodes !== undefined ? rawP.expectedEpisodes : (targetProject.expectedEpisodes !== undefined ? targetProject.expectedEpisodes : 26));
      setExpectedShootDays(rawP.expectedShootDays !== undefined ? rawP.expectedShootDays : (targetProject.expectedShootDays !== undefined ? targetProject.expectedShootDays : 15));
      setExpectedSeasonsCount(rawP.expectedSeasonsCount !== undefined ? rawP.expectedSeasonsCount : (targetProject.expectedSeasonsCount !== undefined ? targetProject.expectedSeasonsCount : 1));

      if (Array.isArray(targetProject.assignedUsers) && targetProject.assignedUsers.length > 0) {
        const mappedMembers: InvitedTeamMember[] = targetProject.assignedUsers.map((u: any, idx: number) => ({
          id: u.id || `inv_${idx}_${Date.now()}`,
          name: u.name || '',
          email: u.email || '',
          mobile: u.mobile || '',
          designation: u.role || 'Team Member',
          department: u.department || 'Production',
          role: u.role || 'Production Manager',
          permissionTemplate: u.access || 'Standard Department Access',
          startDate: targetProject.startDate || new Date().toISOString().substring(0, 10),
          endDate: ''
        }));
        setInvitedMembers(mappedMembers);
      }
    }
  }, [projectToEdit]);

  const handleSelectExistingCompany = (cId: string) => {
    setSelectedCompanyId(cId);
    const matched = fullCompanies.find(c => c.id === cId);
    if (matched) {
      setCompName(matched.name || '');
      setCompLegalName(matched.legalName || matched.name || '');
      setCompAddress(matched.address || '');
      setCompEmail(matched.email || '');
      setCompPhone(matched.phone || '');
      setCompGstin(matched.gstNumber || '');
      setCompPan(matched.panNumber || '');
    }
  };

  const handleAddMember = () => {
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      alert('Please enter member name and email');
      return;
    }
    const newMember: InvitedTeamMember = {
      id: `inv_${Date.now()}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      mobile: newMemberMobile.trim(),
      designation: newMemberDesignation,
      department: newMemberDepartment,
      role: newMemberRole,
      permissionTemplate: 'Standard Department Access',
      startDate: new Date().toISOString().substring(0, 10),
      endDate: ''
    };
    setInvitedMembers([...invitedMembers, newMember]);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberMobile('');
  };

  const handleRemoveMember = (id: string) => {
    setInvitedMembers(invitedMembers.filter(m => m.id !== id));
  };

  // Final submit handler
  const handleFinalize = async (isDraft: boolean = false) => {
    if (!projName.trim()) {
      alert('Project Name is required. Please fill out Step 1.');
      setCurrentStep(1);
      return;
    }

    if (isDuplicateName) {
      alert(`Cannot create project: A project named "${projName.trim()}" already exists. Duplicate project names are not allowed.`);
      setCurrentStep(1);
      return;
    }

    if (companyChoice === 'new' && !compName.trim()) {
      alert('Company Name is required. Please fill out Step 2.');
      setCurrentStep(2);
      return;
    }

    const targetTitle = cleanProjectTitle(projectToEdit?.name || '').toLowerCase().trim();
    const targetRawId = projectToEdit?.id || '';
    const targetBaseId = targetRawId.replace(/^(wp_|p_|proj_)/, '');

    const existingP = projectToEdit ? existingProjectsList.find(p => {
      const pCleanId = p.id.replace(/^(wp_|p_|proj_)/, '');
      const pCleanName = cleanProjectTitle(p.name || '').toLowerCase().trim();
      return p.id === targetRawId || (targetBaseId && pCleanId === targetBaseId) || (pCleanName && targetTitle && pCleanName === targetTitle);
    }) : undefined;

    let cleanId = projectToEdit
      ? (existingP?.id || (targetRawId.startsWith('p_') ? targetRawId : (targetRawId.startsWith('wp_') ? targetRawId.replace(/^wp_/, 'p_') : `p_${targetBaseId || targetRawId}`)))
      : `p_${Math.random().toString(36).substring(2, 9)}`;

    let wpId = projectToEdit
      ? (targetRawId.startsWith('wp_') ? targetRawId : `wp_${cleanId.replace(/^p_/, '')}`)
      : `wp_${cleanId.replace(/^p_/, '')}`;

    const nowStr = new Date().toISOString().substring(0, 10);
    const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const finalCompanyName = compName.trim() || 'Default Production Co';

    // 1. Company Record
    const matchedCompany = fullCompanies.find(c => c.id === selectedCompanyId || c.name.toLowerCase().trim() === finalCompanyName.toLowerCase().trim());
    const compId = matchedCompany?.id || `comp_${Date.now()}`;

    const companyData: Company = {
      id: compId,
      name: finalCompanyName,
      legalName: compLegalName || finalCompanyName,
      code: compCode.trim() || finalCompanyName.substring(0, 4).toUpperCase(),
      address: compAddress || 'Corporate Office',
      email: compEmail || '',
      phone: compPhone || '',
      gstNumber: compGstin || '19AABCF1234F1Z5',
      panNumber: compPan || 'ABCDE1234F',
      entityType: compEntityType,
      projectCount: (matchedCompany?.projectCount || 0) + 1,
      utilization: matchedCompany?.utilization || 0,
      status: matchedCompany?.status || 'Active',
      lastSynced: 'Just now'
    };

    try {
      await saveDocData('companies', compId, companyData, { immediate: true });
    } catch (e) {
      console.warn('Error saving company record:', e);
    }

    // 2. Project Object
    const numericBudget = Number(projBudget) || 0;
    const projectSchedule = {
      preProductionStartDate: seasonStartDate || expectedStartDate || nowStr,
      preProductionDays: 30,
      shootingStartDate: seasonStartDate || expectedStartDate || nowStr,
      shootingDays: expectedShootDays || 15,
      postProductionStartDate: seasonEndDate || nowStr,
      postProductionDays: 30,
      targetReleaseDate: telecastStartDate || expectedEndDate || nowStr
    };

    const ownerMember = {
      id: `owner_${cleanId}`,
      name: ownerEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      email: ownerEmail,
      role: 'Project Owner & Admin',
      access: 'Full Project Admin'
    };

    const finalAssignedUsers = [
      ownerMember,
      ...invitedMembers
        .filter(m => m.email.toLowerCase().trim() !== ownerEmail.toLowerCase().trim())
        .map(m => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role,
          access: m.permissionTemplate
        }))
    ];

    const newProject: Project = {
      id: cleanId,
      companyId: compId,
      projectCode: projCode.trim(),
      name: projCode ? `${projName.trim()} (${projCode.trim()})` : projName.trim(),
      description: execSummary || `${finalCompanyName} presents ${projName.trim()} (${projType}) - Format: ${showFormat}.`,
      totalBudget: numericBudget,
      spent: projectToEdit?.spent || 0,
      status: (isDraft ? 'Pre-Production' : (projectStatus as any)) || projectToEdit?.status || 'Pre-Production',
      startDate: expectedStartDate || projectToEdit?.startDate || nowStr,
      endDate: expectedEndDate || projectToEdit?.endDate || '',
      currency: defaultCurrency || projectToEdit?.currency || 'INR',
      timeZone: timeZone || 'Asia/Kolkata',
      companyName: finalCompanyName,
      projectType: projType,
      showFormat: showFormat,
      channelPlatform: channelPlatform || 'Television / OTT',
      seasonName: seasonName || 'Season 01',
      seasonCode: seasonCode || 'S01',
      seasonStartDate: seasonStartDate || '',
      telecastStartDate: telecastStartDate || '',
      episodeDuration: episodeDuration || '',
      expectedEpisodes: expectedEpisodes || 26,
      expectedShootDays: expectedShootDays || 15,
      expectedSeasonsCount: expectedSeasonsCount || 1,
      compLegalName: compLegalName || finalCompanyName,
      compRegNumber: compRegNumber || '',
      compAddress: compAddress || 'Corporate Office',
      compGstin: compGstin || '19AABCF1234F1Z5',
      compPan: compPan || 'ABCDE1234F',
      compEmail: compEmail || '',
      compPhone: compPhone || '',
      compCity: compCity || 'Kolkata',
      compState: compState || 'West Bengal',
      compCountry: compCountry || 'India',
      compPinCode: compPinCode || '700001',
      compEntityType: compEntityType,
      authPersonName: authPersonName,
      authPersonDesignation: authPersonDesignation,
      bankName: bankName || '',
      bankAccountNo: bankAccountNo || '',
      bankIfsc: bankIfsc || '',
      schedule: projectSchedule,
      assignedUsers: finalAssignedUsers,
      createdBy: ownerEmail,
      createdAt: projectToEdit?.createdAt || timeStr,
      updatedAt: timeStr,
      recordVersion: (projectToEdit?.recordVersion || 1) + 1
    };

    try {
      await saveDocData('projects', cleanId, newProject, { immediate: true });
      await saveProject(newProject);
    } catch (e) {
      console.warn('Error saving project record:', e);
    }

    // Save owner assignment in user_assignments collection
    try {
      const ownerAsgnId = `asgn_owner_${cleanId}`;
      const ownerAssignment = {
        id: ownerAsgnId,
        assignedEmail: ownerEmail.toLowerCase().trim(),
        assignedName: ownerMember.name,
        assignedRole: 'Project Owner & Admin',
        department: 'Executive Management',
        projectId: cleanId,
        projectName: newProject.name,
        companyId: compId,
        companyName: finalCompanyName,
        companyGstin: compGstin || '19AABCF1234F1Z5',
        assignedBy: ownerEmail,
        createdAt: new Date().toISOString(),
        status: 'Accepted',
        acceptedAt: new Date().toISOString(),
        isViewed: true
      };
      await saveDocData('user_assignments', ownerAsgnId, ownerAssignment, { immediate: true });

      // Save pending assignment notifications for invited team members
      for (const member of invitedMembers) {
        if (member.email.toLowerCase().trim() !== ownerEmail.toLowerCase().trim()) {
          const mAsgnId = `asgn_${member.id}_${cleanId}`;
          const memberAsgn = {
            id: mAsgnId,
            assignedEmail: member.email.toLowerCase().trim(),
            assignedName: member.name,
            assignedRole: member.role,
            department: member.department || 'Production',
            projectId: cleanId,
            projectName: newProject.name,
            companyId: compId,
            companyName: finalCompanyName,
            companyGstin: compGstin || '19AABCF1234F1Z5',
            assignedBy: ownerEmail,
            createdAt: new Date().toISOString(),
            status: 'Pending',
            isViewed: false
          };
          await saveDocData('user_assignments', mAsgnId, memberAsgn, { immediate: true });
        }
      }
    } catch (e) {
      console.warn('Error saving assignment records:', e);
    }

    // 3. Save workspace project folder
    const formattedBudget = numericBudget >= 10000000 
      ? `₹${(numericBudget / 10000000).toFixed(1)} Cr`
      : numericBudget >= 100000
      ? `₹${(numericBudget / 100000).toFixed(1)} L`
      : `₹${numericBudget.toLocaleString()}`;

    let pipelineStage: WorkspaceProject['pipelineStage'] = 'pre_prod';
    let wpStatus: WorkspaceProject['status'] = 'On Track';
    const sLow = (projectStatus || '').toLowerCase();
    if (sLow.includes('completed') || sLow.includes('done') || sLow.includes('archived')) {
      pipelineStage = 'completed';
      wpStatus = 'Done';
    } else if (sLow.includes('post') || sLow.includes('edit')) {
      pipelineStage = 'post_prod';
      wpStatus = 'Syncing';
    } else if (sLow.includes('prod') || sLow.includes('shoot') || sLow.includes('active')) {
      pipelineStage = 'in_prod';
      wpStatus = 'On Track';
    } else if (sLow.includes('pre') || sLow.includes('plan') || sLow.includes('upcoming')) {
      pipelineStage = 'pre_prod';
      wpStatus = 'Upcoming';
    }

    const workspaceProjectData: WorkspaceProject = {
      id: wpId,
      companyId: compId,
      companyName: finalCompanyName,
      name: newProject.name,
      projectType: projType,
      projectCode: projCode.trim(),
      showFormat: showFormat,
      channelPlatform: channelPlatform || 'Television / OTT',
      ref: projCode.trim() || cleanId.toUpperCase(),
      status: wpStatus,
      pipelineStage: pipelineStage,
      utilization: projectToEdit?.utilization ?? 0,
      budget: formattedBudget,
      totalBudget: numericBudget,
      compGstin: compGstin,
      compPan: compPan,
      compAddress: compAddress,
      compEmail: compEmail,
      compPhone: compPhone,
      compLegalName: compLegalName,
      compRegNumber: compRegNumber,
      compCity: compCity,
      compState: compState,
      compCountry: compCountry,
      compPinCode: compPinCode,
      seasonName: seasonName,
      seasonCode: seasonCode,
      seasonStartDate: seasonStartDate,
      telecastStartDate: telecastStartDate,
      episodeDuration: episodeDuration,
      expectedEpisodes: expectedEpisodes,
      expectedShootDays: expectedShootDays,
      expectedSeasonsCount: expectedSeasonsCount,
      createdBy: ownerEmail,
      createdAt: projectToEdit?.createdAt || timeStr,
      resources: projectToEdit?.resources || [ownerEmail.substring(0, 2).toUpperCase()],
      lastSync: 'Just now',
      imgUrl: projectToEdit?.imgUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=150&q=80',
      rawProject: newProject
    };

    try {
      await saveWorkspaceProject(workspaceProjectData as any);
    } catch (e) {
      console.warn('Error saving workspace project:', e);
    }

    if (projectToEdit) {
      existingProjectsList.forEach(p => {
        const pCleanId = p.id.replace(/^(wp_|p_|proj_)/, '');
        const pCleanName = cleanProjectTitle(p.name || '').toLowerCase().trim();
        if ((targetBaseId && pCleanId === targetBaseId) || (pCleanName && targetTitle && pCleanName === targetTitle)) {
          if (p.id !== cleanId && p.id !== wpId) {
            try {
              deleteDocData('projects', p.id);
              deleteProject(p.id);
              deleteDocData('workspaceProjects', p.id);
              deleteWorkspaceProject(p.id);
            } catch (e) {
              console.warn('Error purging duplicate project doc:', p.id, e);
            }
          }
        }
      });
    }

    // 4. Create First Season Record if requested
    if (createFirstSeason && !isSeasonNotRequired) {
      const seasonId = `season_1_${cleanId}`;
      const seasonData: Season = {
        id: seasonId,
        projectId: cleanId,
        companyId: compId,
        seasonName: seasonName || 'Season 01',
        seasonNumber: seasonNumber || 1,
        seasonCode: seasonCode || 'S01',
        description: seasonDesc || 'First Season',
        expectedEpisodes: expectedEpisodes || 26,
        expectedShootingDays: expectedShootDays || 15,
        startDate: seasonStartDate || nowStr,
        endDate: seasonEndDate || '',
        telecastStartDate: telecastStartDate || '',
        episodeDuration: episodeDuration || '45 mins',
        channelOrPlatform: channelPlatform || 'Television / OTT',
        status: seasonStatus || 'Planning',
        createdBy: ownerEmail,
        createdAt: timeStr
      };
      try {
        await saveDocData('seasons', seasonId, seasonData, { immediate: true });
      } catch (e) {
        console.warn('Error saving season record:', e);
      }

      // Synchronize initial project_controls in Firestore
      try {
        const initialEpCount = Math.min(Math.max(expectedEpisodes || 1, 1), 50);
        const generatedEpisodes = Array.from({ length: initialEpCount }, (_, idx) => {
          const epNum = idx + 1;
          const epCode = `${seasonCode || 'S01'}E${String(epNum).padStart(2, '0')}`;
          return {
            id: `ep_${cleanId}_${epNum}`,
            code: epCode,
            title: `Episode ${epNum}`,
            duration: episodeDuration || '45 mins',
            status: idx === 0 ? 'In Production' : 'Planning',
            airDate: telecastStartDate || nowStr,
            shootDay: `Day ${String(Math.min(epNum, expectedShootDays || 15)).padStart(2, '0')}`,
            theme: `${projName.trim()} Episode ${epNum}`
          };
        });

        const projectControlsPayload = {
          seasons: [
            {
              id: seasonId,
              name: seasonName || 'Season 01',
              code: seasonCode || 'S01',
              episodes: expectedEpisodes || 26,
              shootDays: expectedShootDays || 15,
              status: seasonStatus || 'In Production',
              platform: channelPlatform || 'Television / OTT',
              budget: numericBudget,
              duration: episodeDuration || '45 mins',
              startDate: seasonStartDate || nowStr,
              telecastStartDate: telecastStartDate || ''
            }
          ],
          episodes: generatedEpisodes,
          updatedAt: timeStr
        };
        await saveDocData('project_controls', cleanId, projectControlsPayload, { immediate: true });
      } catch (e) {
        console.warn('Error saving project_controls payload:', e);
      }
    }

    // 5. Timeline default phases setup
    const projPhases = generateDefaultPhasesForProject(newProject);
    const storageKey = `erp_timeline_${cleanId}`;
    const docId = `timeline_${cleanId}`;

    const timelinePayload = {
      phases: projPhases,
      milestones: [
        { id: `m1_${cleanId}`, title: 'Concept Bible & Pre-Prod Handover', desc: 'Format bible approved and budget frozen', status: 'Done', date: expectedStartDate || nowStr },
        { id: `m2_${cleanId}`, title: 'First Shoot Schedule (Day 1)', desc: 'Call sheet issued for Floor Shoot', status: 'In Review', date: seasonStartDate || nowStr },
        { id: `m3_${cleanId}`, title: 'Post-Production Cut Lock', desc: 'Offline cut and final audio mix approved', status: 'Pending', date: seasonEndDate || nowStr },
        { id: `m4_${cleanId}`, title: 'Broadcast Telecast On-Air', desc: 'Network Premiere', status: 'Pending', date: telecastStartDate || nowStr }
      ],
      teamMembers: invitedMembers
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(timelinePayload));
    } catch (e) {
      console.warn('Failed saving timeline payload:', e);
    }
    saveDocData('settings', docId, timelinePayload);

    const mfgLog: DBLog = {
      id: `l_proj_wizard_${Date.now()}`,
      timestamp: timeStr,
      action: isDraft ? 'SYS_PROJECT_DRAFT_SAVE' : 'SYS_PROJECT_WIZARD_PROVISION',
      sqlQuery: `INSERT INTO projects (id, name, companyName, projectType, totalBudget) VALUES ('${cleanId}', '${newProject.name}', '${finalCompanyName}', '${projType}', ${numericBudget});`,
      status: 'success'
    };

    const defaultCategories = generateStandardCategoriesForProject(cleanId, projType);
    onProjectCreated(newProject, defaultCategories, mfgLog);
  };

  const STEPS_NAV = [
    { id: 'info', title: 'Project Info', icon: Tv },
    { id: 'company', title: 'Company', icon: Building2 },
    ...(!isSeasonNotRequired ? [{ id: 'season', title: 'First Season', icon: Layers }] : []),
    ...(!projectToEdit ? [{ id: 'owner', title: 'Project Owner', icon: ShieldCheck }] : [])
  ];
  const totalSteps = STEPS_NAV.length;

  return (
    <div id="create-project-wizard-view" className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-w-[1050px] mx-auto animate-fade-in relative text-slate-100 my-4">
      
      {/* WIZARD HEADER */}
      <div className="bg-slate-950 border-b border-slate-800 px-5 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl shadow-md border border-blue-400/30">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
                <span>{projType ? `${projType.toUpperCase()} PRODUCTION ERP WIZARD` : 'PRODUCTION ERP WIZARD'}</span>
                <span className="text-[10px] px-2 py-0.5 bg-blue-950 text-blue-400 rounded-full border border-blue-800 font-mono">Step {currentStep} of {totalSteps}</span>
              </h2>
              <p className="text-xs text-slate-400">
                {projectToEdit ? 'Edit existing project details, company registration & team permissions' : (isSeasonNotRequired ? 'Setup new project, company registration & ownership' : 'Setup new show project, company registration, season roadmap & ownership')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {projectToEdit && onDeleteProject && (
              <button 
                type="button"
                onClick={() => {
                  if (!isProjectAdminRole(currentRole)) {
                    alert("Access Denied: Only a Project Admin (Producer / Executive Producer / Admin) can delete a project.");
                    return;
                  }
                  if (confirm(`Are you sure you want to delete project "${projName}"? This action cannot be undone.`)) {
                    onDeleteProject(projectToEdit.id);
                  }
                }}
                className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 border border-rose-800/60 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                title="Delete Project"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}

            <button 
              type="button"
              onClick={onCancel}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close Wizard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STEP PROGRESS INDICATOR */}
        <div className={`grid ${totalSteps === 3 ? 'grid-cols-3' : 'grid-cols-4'} gap-1 pt-1`}>
          {STEPS_NAV.map((step, idx) => {
            const stepNum = idx + 1;
            const Icon = step.icon;
            const isActive = currentStep === stepNum;
            const isCompleted = currentStep > stepNum;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(stepNum)}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500 shadow-xs' 
                    : isCompleted 
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60' 
                    : 'bg-slate-950/60 text-slate-500 border-slate-800/80 hover:text-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                  isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isCompleted ? <Check className="w-3 h-3" /> : stepNum}
                </div>
                <span className="hidden sm:inline truncate max-w-[90px]">{step.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FORM BODY */}
      <div className="p-5 min-h-[380px] max-h-[70vh] overflow-y-auto">
        
        {/* ========================================================================= */}
        {/* STEP 1: PROJECT INFORMATION */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Tv className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Step 1: Project Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Project Name <span className="text-rose-400">*</span>
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Bengal Superstar 2026"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className={`w-full h-8 px-3 bg-slate-950 border ${isDuplicateName ? 'border-rose-500' : 'border-slate-800'} rounded-lg text-xs text-white outline-none focus:border-blue-500`}
                />
                {isDuplicateName && (
                  <p className="mt-1.5 text-[11px] font-bold text-rose-400 flex items-center gap-1.5 animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>A project named "{projName.trim()}" already exists. Duplicate project names are not allowed.</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Project Code
                </label>
                <input 
                  type="text"
                  placeholder="e.g. NFTV-2026-001"
                  value={projCode}
                  onChange={(e) => setProjCode(e.target.value)}
                  className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none font-mono focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Project Type <span className="text-rose-400">*</span>
                </label>
                <select
                  value={projType}
                  onChange={(e) => handleProjectTypeChange(e.target.value)}
                  className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                >
                  {ALL_PROJECT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {currentFormatConfig.label}
                </label>
                <select
                  value={showFormat}
                  onChange={(e) => setShowFormat(e.target.value)}
                  className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                >
                  {currentFormatConfig.options.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Default Currency
                </label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                >
                  <option value="INR">INR (₹ Indian Rupee)</option>
                  <option value="USD">USD ($ US Dollar)</option>
                  <option value="GBP">GBP (£ British Pound)</option>
                  <option value="EUR">EUR (€ Euro)</option>
                  <option value="AED">AED (Direct Dirham)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Time Zone
                </label>
                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500 font-mono"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="Asia/Dhaka">Asia/Dhaka (BST +6:00)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                  <option value="UTC">UTC (GMT +0:00)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Expected Start Date
                </label>
                <input 
                  type="date"
                  value={expectedStartDate}
                  onChange={(e) => setExpectedStartDate(e.target.value)}
                  className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Expected End Date
                </label>
                <input 
                  type="date"
                  value={expectedEndDate}
                  onChange={(e) => setExpectedEndDate(e.target.value)}
                  className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              {!isSeasonNotRequired && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Expected Number of Seasons
                  </label>
                  <input 
                    type="number"
                    min={1}
                    max={20}
                    value={expectedSeasonsCount}
                    onChange={(e) => setExpectedSeasonsCount(parseInt(e.target.value) || 1)}
                    className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Project Status
                </label>
                <select
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value)}
                  className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                >
                  <option value="Planning">Planning</option>
                  <option value="Pre-Production">Pre-Production</option>
                  <option value="In Production">In Production</option>
                  <option value="Post-Production">Post-Production</option>
                  <option value="Delivering">Delivering</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Project / Show Executive Description
                </label>
                <textarea 
                  rows={2}
                  placeholder="Overview of the Non-Fiction TV show format, production scope, host/judge setup and target audience..."
                  value={execSummary}
                  onChange={(e) => setExecSummary(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: COMPANY REGISTRATION */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Step 2: Company Registration</h3>
              </div>

              {/* TOGGLE OPTIONS */}
              <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCompanyChoice('existing')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    companyChoice === 'existing' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Use Existing Company
                </button>
                <button
                  type="button"
                  onClick={() => setCompanyChoice('new')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    companyChoice === 'new' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Register New Company
                </button>
              </div>
            </div>

            {companyChoice === 'existing' ? (
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <label className="block text-xs font-bold text-slate-200">
                  Select Existing Registered Company
                </label>
                {fullCompanies.length === 0 ? (
                  <p className="text-xs text-slate-400">No previously registered companies found. Please switch to "Register New Company".</p>
                ) : (
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => handleSelectExistingCompany(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                  >
                    {fullCompanies.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.gstNumber || 'No GST'})</option>
                    ))}
                  </select>
                )}

                {selectedCompanyId && (
                  <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs space-y-1.5 text-slate-300">
                    <p><strong className="text-white">Legal Name:</strong> {compLegalName || compName}</p>
                    <p><strong className="text-white">GSTIN:</strong> {compGstin} | <strong className="text-white">PAN:</strong> {compPan}</p>
                    <p><strong className="text-white">Address:</strong> {compAddress}</p>
                    <p><strong className="text-white">Contact Email:</strong> {compEmail}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Company Display Name <span className="text-rose-400">*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. ABC Productions Kolkata"
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Legal Company Name
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. ABC Media & Entertainment Pvt Ltd"
                    value={compLegalName}
                    onChange={(e) => setCompLegalName(e.target.value)}
                    className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Company Entity Type
                  </label>
                  <select
                    value={compEntityType}
                    onChange={(e) => setCompEntityType(e.target.value)}
                    className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                  >
                    <option value="Private Limited (Pvt Ltd)">Private Limited (Pvt Ltd)</option>
                    <option value="Public Limited">Public Limited</option>
                    <option value="Limited Liability Partnership (LLP)">LLP</option>
                    <option value="Proprietorship">Proprietorship</option>
                    <option value="Partnership Firm">Partnership Firm</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Company Reg Number / CIN
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. U74999WB2020PTC234567"
                    value={compRegNumber}
                    onChange={(e) => setCompRegNumber(e.target.value)}
                    className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none font-mono focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    GST Number
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. 19AABCF1234F1Z5"
                    value={compGstin}
                    onChange={(e) => setCompGstin(e.target.value)}
                    className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none font-mono focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    PAN Number
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. ABCDE1234F"
                    value={compPan}
                    onChange={(e) => setCompPan(e.target.value)}
                    className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none font-mono focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Company Email
                  </label>
                  <input 
                    type="email"
                    placeholder="production@company.com"
                    value={compEmail}
                    onChange={(e) => setCompEmail(e.target.value)}
                    className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Company Phone
                  </label>
                  <input 
                    type="text"
                    placeholder="+91 98300 00000"
                    value={compPhone}
                    onChange={(e) => setCompPhone(e.target.value)}
                    className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Registered Corporate Address
                  </label>
                  <input 
                    type="text"
                    placeholder="Street, Studio Park, City, State..."
                    value={compAddress}
                    onChange={(e) => setCompAddress(e.target.value)}
                    className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: SEASON SETUP (Only if required) */}
        {/* ========================================================================= */}
        {!isSeasonNotRequired && currentStep === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Step 3: Season Setup</h3>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-bold">
                <input 
                  type="checkbox"
                  checked={createFirstSeason}
                  onChange={(e) => setCreateFirstSeason(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                />
                <span>Create Initial Season 01 Now</span>
              </label>
            </div>

            {createFirstSeason ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Season Name
                  </label>
                  <input 
                    type="text"
                    value={seasonName}
                    onChange={(e) => setSeasonName(e.target.value)}
                    className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Season Code
                  </label>
                  <input 
                    type="text"
                    value={seasonCode}
                    onChange={(e) => setSeasonCode(e.target.value)}
                    className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none font-mono focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Expected Number of Episodes
                  </label>
                  <input 
                    type="number"
                    min={1}
                    value={expectedEpisodes}
                    onChange={(e) => setExpectedEpisodes(parseInt(e.target.value) || 1)}
                    className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Expected Number of Shooting Days
                  </label>
                  <input 
                    type="number"
                    min={1}
                    value={expectedShootDays}
                    onChange={(e) => setExpectedShootDays(parseInt(e.target.value) || 1)}
                    className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Broadcast Channel or Platform
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Star Jalsha / Disney+ Hotstar"
                    value={channelPlatform}
                    onChange={(e) => setChannelPlatform(e.target.value)}
                    className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Target Episode Duration
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. 45 mins"
                    value={episodeDuration}
                    onChange={(e) => setEpisodeDuration(e.target.value)}
                    className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Season Start Date
                  </label>
                  <input 
                    type="date"
                    value={seasonStartDate}
                    onChange={(e) => setSeasonStartDate(e.target.value)}
                    className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Target Telecast Date
                  </label>
                  <input 
                    type="date"
                    value={telecastStartDate}
                    onChange={(e) => setTelecastStartDate(e.target.value)}
                    className="w-full h-8 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-950/60 rounded-xl border border-slate-800 text-center space-y-2">
                <Info className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-300">You can skip season creation now. Seasons can be added anytime later from the Seasons Module.</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4/3: PROJECT OWNER SETUP */}
        {/* ========================================================================= */}
        {!projectToEdit && ((isSeasonNotRequired && currentStep === 3) || (!isSeasonNotRequired && currentStep === 4)) && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Step {totalSteps}: Project Owner Setup</h3>
            </div>

            <div className="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">Project Ownership Assignment</h4>
                  <p className="text-[11px] text-slate-300">
                    The user creating this project automatically receives full Project Owner & Admin authority.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1.5 flex items-center justify-between">
                    <span>Owner Email (Current Login ID):</span>
                    <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-mono bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Active Session
                    </span>
                  </span>
                  <div className="w-full h-8 px-2.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-white font-mono font-bold flex items-center justify-between overflow-hidden">
                    <span className="truncate">{ownerEmail}</span>
                    <span className="text-[10px] text-slate-400 font-sans font-normal ml-2 shrink-0">(Creator)</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Assigned Authority Role:</span>
                  <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{ownerRole}</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                * Note: Project Ownership cannot be removed until explicitly transferred to another project member.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* FOOTER ACTIONS */}
      <div className="bg-slate-950 border-t border-slate-800 px-5 py-3 flex items-center justify-between">
        <button
          type="button"
          disabled={currentStep === 1}
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          className="h-8 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          {currentStep === totalSteps ? (
            projectToEdit ? (
              <>
                <button
                  type="button"
                  onClick={onCancel}
                  className="h-8 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleFinalize(false)}
                  className="h-8 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 shadow-md border border-emerald-400/30 transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleFinalize(true)}
                  className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleFinalize(false)}
                  className="h-8 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 shadow-md border border-emerald-400/30 transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create Project Now</span>
                </button>
              </>
            )
          ) : (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 1) {
                  if (!projName.trim()) {
                    alert('Project Name is required. Please fill out Step 1.');
                    return;
                  }
                  if (isDuplicateName) {
                    alert(`Cannot proceed: A project named "${projName.trim()}" already exists. Duplicate project names are not allowed.`);
                    return;
                  }
                }
                setCurrentStep(prev => Math.min(totalSteps, prev + 1));
              }}
              className="h-8 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
