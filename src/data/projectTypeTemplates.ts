import { Project } from '../types';
import { DEFAULT_COOKING_SHOW_BUDGET_STRUCTURE } from '../defaultCookingShowBudget';

export interface ProjectTypeModule {
  id: string;
  name: string;
  icon?: string;
  subItems?: { id: string; name: string }[];
}

export interface DepartmentWorkspaceConfig {
  id: string;
  name: string;
  description: string;
  items: { id: string; name: string }[];
}

export interface ProjectTypeTemplate {
  typeKey: string;
  displayName: string;
  category: 'Film' | 'Fiction TV' | 'Non-Fiction TV' | 'Commercial' | 'Documentary' | 'Custom';
  description: string;
  modules: ProjectTypeModule[];
  departmentWorkspaces: DepartmentWorkspaceConfig[];
  dashboardCards: {
    title: string;
    value: string | number;
    subtext: string;
    badge?: string;
    type: 'metric' | 'progress' | 'status' | 'financial';
  }[];
  dsrExtraFields: {
    fieldKey: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'boolean';
    options?: string[];
  }[];
  budgetCategories: {
    name: string;
    subCategories: {
      name: string;
      childCategories: { name: string; count: number; rate: number; paymentTerms: string; shifts: number }[];
    }[];
  }[];
}

export const COMMON_CORE_NAV = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: 'BarChart'
  },
  {
    id: 'project-control',
    name: 'Project Control',
    icon: 'Sliders'
  },
  {
    id: 'budget',
    name: 'Budget',
    icon: 'Wallet'
  },
  {
    id: 'expenses',
    name: 'Expenses',
    icon: 'Receipt'
  },
  {
    id: 'production',
    name: 'Production',
    icon: 'Film'
  },
  {
    id: 'vendors',
    name: 'Vendors & POs',
    icon: 'Building2'
  },
  {
    id: 'three-way-matching',
    name: '3-Way PO Matching',
    icon: 'FileCheck2'
  },
  {
    id: 'payments',
    name: 'Payments',
    icon: 'Coins'
  },
  {
    id: 'documents',
    name: 'Documents',
    icon: 'HardDrive'
  },
  {
    id: 'approvals',
    name: 'Approvals',
    icon: 'CheckSquare'
  },
  {
    id: 'team-permissions',
    name: 'Team & Permissions',
    icon: 'UserCheck'
  },
  {
    id: 'audit',
    name: 'Audit',
    icon: 'ShieldCheck'
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    icon: 'Layers'
  }
];

export const STANDARD_DEPARTMENT_WORKSPACES: DepartmentWorkspaceConfig[] = [
  {
    id: 'dept-production',
    name: 'Production Team Workspace',
    description: 'Daily planning, call sheets, DSR, transport & catering logistics',
    items: [
      { id: 'prod-daily-planning', name: 'Daily Planning' },
      { id: 'prod-unit-planning', name: 'Unit Planning' },
      { id: 'prod-schedule', name: 'Schedule' },
      { id: 'prod-call-sheet', name: 'Call Sheet' },
      { id: 'prod-dsr', name: 'DSR' },
      { id: 'prod-crew-count', name: 'Crew Count' },
      { id: 'prod-transport', name: 'Transport' },
      { id: 'prod-accommodation', name: 'Accommodation' },
      { id: 'prod-food', name: 'Food' },
      { id: 'prod-genset-fuel', name: 'Genset & Fuel' },
      { id: 'prod-vanity', name: 'Vanity' },
      { id: 'prod-daily-req', name: 'Daily Requirement' },
      { id: 'prod-issue-tracker', name: 'Daily Issue Tracker' }
    ]
  },
  {
    id: 'dept-director',
    name: 'Director Team Workspace',
    description: 'Script, scene breakdown, shot list, rehearsals & continuity',
    items: [
      { id: 'dir-script-content', name: 'Script / Content' },
      { id: 'dir-breakdown', name: 'Scene / Segment Breakdown' },
      { id: 'dir-shot-list', name: 'Shot List' },
      { id: 'dir-notes', name: 'Director Notes' },
      { id: 'dir-rehearsal', name: 'Rehearsal' },
      { id: 'dir-progress', name: 'Shooting Progress' },
      { id: 'dir-pending', name: 'Pending Work' },
      { id: 'dir-continuity', name: 'Continuity' },
      { id: 'dir-completion-report', name: 'Daily Completion Report' }
    ]
  },
  {
    id: 'dept-art',
    name: 'Art Team Workspace',
    description: 'Set construction, design, props, materials & set maintenance',
    items: [
      { id: 'art-overview', name: 'Art Overview' },
      { id: 'art-set-list', name: 'Set List' },
      { id: 'art-design', name: 'Design' },
      { id: 'art-construction', name: 'Construction' },
      { id: 'art-dressing', name: 'Set Dressing' },
      { id: 'art-props', name: 'Props' },
      { id: 'art-graphics', name: 'Graphics' },
      { id: 'art-materials', name: 'Materials' },
      { id: 'art-labour', name: 'Labour' },
      { id: 'art-maintenance', name: 'Set Maintenance' },
      { id: 'art-dismantling', name: 'Dismantling' },
      { id: 'art-budget', name: 'Art Budget' },
      { id: 'art-expenses', name: 'Art Expenses' },
      { id: 'art-dsr', name: 'Art DSR' }
    ]
  },
  {
    id: 'dept-look',
    name: 'Look Management Workspace',
    description: 'Costume, makeup, hair, jewellery, look tests & continuity',
    items: [
      { id: 'look-talent-looks', name: 'Character / Talent Looks' },
      { id: 'look-costume', name: 'Costume' },
      { id: 'look-makeup', name: 'Makeup' },
      { id: 'look-hair', name: 'Hair' },
      { id: 'look-jewellery', name: 'Jewellery' },
      { id: 'look-accessories', name: 'Accessories' },
      { id: 'look-footwear', name: 'Footwear' },
      { id: 'look-test', name: 'Look Test' },
      { id: 'look-continuity', name: 'Continuity' },
      { id: 'look-daily-plan', name: 'Daily Look Plan' },
      { id: 'look-purchase-rental', name: 'Purchase & Rental' },
      { id: 'look-laundry', name: 'Laundry' },
      { id: 'look-returns', name: 'Return Tracking' },
      { id: 'look-budget-exp', name: 'Look Budget & Expenses' }
    ]
  },
  {
    id: 'dept-camera',
    name: 'Camera Team Workspace',
    description: 'Camera package, shot requirements, media & DIT footage logs',
    items: [
      { id: 'cam-plan', name: 'Camera Plan' },
      { id: 'cam-positions', name: 'Camera Positions' },
      { id: 'cam-shot-req', name: 'Shot Requirement' },
      { id: 'cam-package', name: 'Camera Package' },
      { id: 'cam-lens-req', name: 'Lens Requirement' },
      { id: 'cam-crew', name: 'Camera Crew' },
      { id: 'cam-daily-equip', name: 'Daily Equipment' },
      { id: 'cam-media-cards', name: 'Media & Cards' },
      { id: 'cam-dit', name: 'DIT' },
      { id: 'cam-footage', name: 'Footage' },
      { id: 'cam-data-backup', name: 'Data Backup' },
      { id: 'cam-report', name: 'Camera Report' }
    ]
  },
  {
    id: 'dept-lighting',
    name: 'Lighting & Grip Workspace',
    description: 'Light package, grip rigging, power distribution & genset mapping',
    items: [
      { id: 'light-plan', name: 'Lighting Plan' },
      { id: 'light-equip', name: 'Light Equipment' },
      { id: 'light-grip-equip', name: 'Grip Equipment' },
      { id: 'light-rigging', name: 'Rigging' },
      { id: 'light-power-req', name: 'Power Requirement' },
      { id: 'light-genset-map', name: 'Genset Mapping' },
      { id: 'light-daily-equip', name: 'Daily Equipment' },
      { id: 'light-consumables', name: 'Consumables' },
      { id: 'light-report', name: 'Lighting Report' }
    ]
  },
  {
    id: 'dept-accounts',
    name: 'Accounts Workspace',
    description: 'Budget verification, bills, cash/bank books, TDS & GST ledger',
    items: [
      { id: 'acc-budget-verify', name: 'Budget Verification' },
      { id: 'acc-exp-verify', name: 'Expense Verification' },
      { id: 'acc-bills', name: 'Bills' },
      { id: 'acc-on-account', name: 'On Account' },
      { id: 'acc-reimbursement', name: 'Reimbursement' },
      { id: 'acc-vendor-accounts', name: 'Vendor Accounts' },
      { id: 'acc-payment-booking', name: 'Payment Booking' },
      { id: 'acc-tds-gst', name: 'TDS & GST' },
      { id: 'acc-cash-book', name: 'Cash Book' },
      { id: 'acc-bank-book', name: 'Bank Book' },
      { id: 'acc-outstanding', name: 'Outstanding' },
      { id: 'acc-fin-reports', name: 'Financial Reports' }
    ]
  },
  {
    id: 'dept-audit',
    name: 'Audit Workspace',
    description: 'Budget, expense, payment & document compliance audits',
    items: [
      { id: 'audit-budget', name: 'Budget Audit' },
      { id: 'audit-expense', name: 'Expense Audit' },
      { id: 'audit-vendor', name: 'Vendor Audit' },
      { id: 'audit-payment', name: 'Payment Audit' },
      { id: 'audit-on-account', name: 'On-Account Audit' },
      { id: 'audit-document', name: 'Document Audit' },
      { id: 'audit-approval', name: 'Approval Audit' },
      { id: 'audit-exceptions', name: 'Exceptions' },
      { id: 'audit-final-report', name: 'Final Audit Report' }
    ]
  }
];

export const PROJECT_TYPE_TEMPLATES: Record<string, ProjectTypeTemplate> = {
  'Film': {
    typeKey: 'Film',
    displayName: 'Film Project',
    category: 'Film',
    description: 'Full-length theatrical or direct-to-OTT feature film template',
    modules: [
      {
        id: 'script-breakdown',
        name: 'Script & Breakdown',
        icon: 'FileText',
        subItems: [
          { id: 'script', name: 'Script' },
          { id: 'scenes', name: 'Scenes' },
          { id: 'scene-breakdown', name: 'Scene Breakdown' },
          { id: 'characters', name: 'Characters' },
          { id: 'scene-characters', name: 'Scene Characters' },
          { id: 'props-breakdown', name: 'Props Breakdown' },
          { id: 'costume-breakdown', name: 'Costume Breakdown' },
          { id: 'makeup-breakdown', name: 'Makeup Breakdown' },
          { id: 'hair-breakdown', name: 'Hair Breakdown' },
          { id: 'location-breakdown', name: 'Location Breakdown' },
          { id: 'vehicle-breakdown', name: 'Vehicle Breakdown' },
          { id: 'action-vfx-breakdown', name: 'Action & VFX Breakdown' },
          { id: 'dood', name: 'Day Out of Days (DOOD)' }
        ]
      },
      {
        id: 'direction',
        name: 'Direction & Shot List',
        icon: 'Video',
        subItems: [
          { id: 'dir-notes', name: 'Director Notes' },
          { id: 'scene-planning', name: 'Scene Planning' },
          { id: 'shot-list', name: 'Shot List' },
          { id: 'storyboard', name: 'Storyboard' },
          { id: 'rehearsal', name: 'Rehearsal' },
          { id: 'scene-progress', name: 'Scene Progress' },
          { id: 'pending-scenes', name: 'Pending Scenes' },
          { id: 'reshoot-scenes', name: 'Reshoot Scenes' }
        ]
      },
      {
        id: 'cast-management',
        name: 'Cast & Talent',
        icon: 'Crown',
        subItems: [
          { id: 'cast-directory', name: 'Cast Directory' },
          { id: 'character-mapping', name: 'Character Mapping' },
          { id: 'artist-availability', name: 'Artist Availability' },
          { id: 'working-days', name: 'Working Days' },
          { id: 'cast-agreements', name: 'Agreements & Fees' },
          { id: 'cast-stay-vanity', name: 'Travel, Stay & Vanity' }
        ]
      },
      {
        id: 'post-production',
        name: 'Post-Production',
        icon: 'Sparkles',
        subItems: [
          { id: 'editing', name: 'Editing' },
          { id: 'dubbing', name: 'Dubbing' },
          { id: 'sound-design', name: 'Sound Design & Foley' },
          { id: 'music-bgm', name: 'Music & Score' },
          { id: 'vfx', name: 'VFX' },
          { id: 'di-colour', name: 'DI & Colour Grading' },
          { id: 'titles-subtitles', name: 'Titles & Subtitles' },
          { id: 'censor-masters', name: 'Censor & Masters' },
          { id: 'delivery', name: 'Final Delivery' }
        ]
      },
      {
        id: 'publicity-release',
        name: 'Publicity & Release',
        icon: 'Tag',
        subItems: [
          { id: 'posters-trailers', name: 'Posters & Trailers' },
          { id: 'promotions', name: 'Promotional Events' },
          { id: 'press-media', name: 'Press & Media' },
          { id: 'distribution', name: 'Distribution & Release' }
        ]
      }
    ],
    departmentWorkspaces: STANDARD_DEPARTMENT_WORKSPACES,
    dashboardCards: [
      { title: 'Total Script Scenes', value: '0 Scenes', subtext: 'Script breakdown log', type: 'metric' },
      { title: 'Completed Scenes', value: '0 Shot', subtext: 'DSR scene tracking', badge: 'Live', type: 'progress' },
      { title: 'Cast Working Days', value: '0 Days', subtext: 'Artist call sheets', type: 'metric' },
      { title: 'Post-Production', value: 'Planning', subtext: 'Edit & QC status', badge: 'Active', type: 'status' }
    ],
    dsrExtraFields: [
      { fieldKey: 'scenes_shot', label: 'Scenes Shot Today', type: 'text' },
      { fieldKey: 'script_pages', label: 'Script Pages Completed', type: 'number' },
      { fieldKey: 'shots_taken', label: 'Shots Completed', type: 'number' }
    ],
    budgetCategories: []
  },

  'Short Film': {
    typeKey: 'Short Film',
    displayName: 'Short Film',
    category: 'Film',
    description: 'Streamlined short film template with fast-track production tools',
    modules: [
      {
        id: 'script-breakdown',
        name: 'Script & Shot List',
        icon: 'FileText',
        subItems: [
          { id: 'script', name: 'Script' },
          { id: 'scenes', name: 'Scenes' },
          { id: 'shot-list', name: 'Shot List' },
          { id: 'storyboard', name: 'Storyboard' }
        ]
      },
      {
        id: 'cast-crew-short',
        name: 'Cast & Crew',
        icon: 'Users',
        subItems: [
          { id: 'cast', name: 'Cast' },
          { id: 'crew', name: 'Crew' },
          { id: 'locations', name: 'Locations' }
        ]
      },
      {
        id: 'post-production-short',
        name: 'Post & Deliverables',
        icon: 'Sparkles',
        subItems: [
          { id: 'edit-sound', name: 'Edit & Sound' },
          { id: 'color-vfx', name: 'Color & VFX' },
          { id: 'deliverables', name: 'Festival Deliverables' }
        ]
      }
    ],
    departmentWorkspaces: STANDARD_DEPARTMENT_WORKSPACES,
    dashboardCards: [
      { title: 'Total Scenes', value: '0 Scenes', subtext: 'Script breakdown log', type: 'metric' },
      { title: 'Shots Completed', value: '0 / 0 Shots', subtext: 'DSR shot tracking', badge: 'Live', type: 'progress' },
      { title: 'Shoot Days', value: '0 Days', subtext: 'Production schedule', type: 'status' }
    ],
    dsrExtraFields: [
      { fieldKey: 'scenes_shot', label: 'Scenes Shot', type: 'text' },
      { fieldKey: 'shots_taken', label: 'Shots Taken', type: 'number' }
    ],
    budgetCategories: []
  },

  'OTT': {
    typeKey: 'OTT',
    displayName: 'OTT / Web Series',
    category: 'Fiction TV',
    description: 'Multi-season and episode web series production platform',
    modules: [
      {
        id: 'series-bible',
        name: 'Series & Episodes',
        icon: 'Tv',
        subItems: [
          { id: 'series-overview', name: 'Series Overview' },
          { id: 'seasons', name: 'Seasons' },
          { id: 'episodes', name: 'Episodes Roadmap' },
          { id: 'production-blocks', name: 'Production Blocks' },
          { id: 'series-bible-doc', name: 'Series Bible' },
          { id: 'season-arc', name: 'Season Arc' },
          { id: 'episode-scripts', name: 'Episode Scripts' }
        ]
      },
      {
        id: 'series-cast',
        name: 'Regular & Guest Cast',
        icon: 'Crown',
        subItems: [
          { id: 'regular-cast', name: 'Regular Cast' },
          { id: 'episode-cast', name: 'Episode Cast' },
          { id: 'guest-cast', name: 'Guest Cast' },
          { id: 'artist-availability', name: 'Artist Dates' }
        ]
      },
      {
        id: 'episode-post',
        name: 'Episode Post-Production',
        icon: 'Sparkles',
        subItems: [
          { id: 'episode-edit', name: 'Episode Editing' },
          { id: 'episode-vfx', name: 'Episode VFX' },
          { id: 'episode-dubbing', name: 'Dubbing & Audio' },
          { id: 'episode-qc', name: 'Episode QC & Platform Delivery' }
        ]
      }
    ],
    departmentWorkspaces: STANDARD_DEPARTMENT_WORKSPACES,
    dashboardCards: [
      { title: 'Total Seasons', value: '0 Seasons', subtext: 'Series configuration', type: 'metric' },
      { title: 'Episodes Shot', value: '0 / 0 Shot', subtext: 'DSR episode tracking', badge: 'Live', type: 'progress' },
      { title: 'Episodes in Post', value: '0 Episodes', subtext: 'QC & Dubbing Phase', type: 'status' }
    ],
    dsrExtraFields: [
      { fieldKey: 'season_number', label: 'Season', type: 'text' },
      { fieldKey: 'episode_numbers', label: 'Episode(s) Shot', type: 'text' },
      { fieldKey: 'scenes_completed', label: 'Scenes Completed', type: 'number' }
    ],
    budgetCategories: []
  },

  'Cooking Show': {
    typeKey: 'Cooking Show',
    displayName: 'Cooking Show',
    category: 'Non-Fiction TV',
    description: 'Culinary competition & recipe show workspace',
    modules: [
      {
        id: 'recipes-menu',
        name: 'Recipes & Ingredients',
        icon: 'Utensils',
        subItems: [
          { id: 'recipe-list', name: 'Recipe List' },
          { id: 'ingredients', name: 'Ingredients & Quantities' },
          { id: 'measurements', name: 'Measurements & Specs' },
          { id: 'preparation-method', name: 'Preparation & Cooking Steps' },
          { id: 'plating', name: 'Plating & Presentation' },
          { id: 'allergens', name: 'Allergens & Health Safety' },
          { id: 'recipe-approval', name: 'Recipe Approval Workflow' }
        ]
      },
      {
        id: 'kitchen-stations',
        name: 'Kitchen Stations & Equipment',
        icon: 'Home',
        subItems: [
          { id: 'station-allocation', name: 'Kitchen Station Allocation' },
          { id: 'appliances', name: 'Cooking Appliances' },
          { id: 'utensils', name: 'Utensils & Cookware' },
          { id: 'gas-induction', name: 'Gas & Induction Lines' },
          { id: 'station-water', name: 'Water & Waste Management' },
          { id: 'station-safety', name: 'Fire & Food Safety Setup' },
          { id: 'station-cleaning', name: 'Station Deep Cleaning' }
        ]
      },
      {
        id: 'ingredients-procurement',
        name: 'Fresh Food & Sourcing',
        icon: 'Package',
        subItems: [
          { id: 'ingredient-requirements', name: 'Daily Grocery Requirements' },
          { id: 'fresh-vendors', name: 'Fresh Food Vendors' },
          { id: 'purchase-orders', name: 'Daily Grocery POs' },
          { id: 'pantry-stock', name: 'Pantry Stock & Cold Storage' },
          { id: 'waste-tracking', name: 'Food Waste Tracking' },
          { id: 'pantry-returns', name: 'Unused Returns' }
        ]
      },
      {
        id: 'contestants-judges-cooking',
        name: 'Contestants & Chefs',
        icon: 'Crown',
        subItems: [
          { id: 'chef-profiles', name: 'Chefs & Judges' },
          { id: 'contestants', name: 'Contestants' },
          { id: 'apron-costume', name: 'Chef Aprons & Look' }
        ]
      }
    ],
    departmentWorkspaces: STANDARD_DEPARTMENT_WORKSPACES,
    dashboardCards: [
      { title: 'Kitchen Stations', value: '0 Stations', subtext: 'Floor configuration', type: 'metric' },
      { title: 'Recipes Logged', value: '0 Recipes', subtext: 'Active recipe database', badge: 'Live', type: 'progress' },
      { title: 'Fresh Grocery POs', value: '₹0', subtext: 'Daily fresh sourcing', type: 'financial' },
      { title: 'Food Safety Audit', value: 'Active', subtext: 'Hygiene & waste logs', badge: 'Compliant', type: 'status' }
    ],
    dsrExtraFields: [
      { fieldKey: 'episode_round', label: 'Cooking Round / Challenge', type: 'text' },
      { fieldKey: 'recipes_filmed', label: 'Recipes Filmed', type: 'text' },
      { fieldKey: 'food_safety_check', label: 'Food Safety Audit Done', type: 'boolean' }
    ],
    budgetCategories: DEFAULT_COOKING_SHOW_BUDGET_STRUCTURE
  },

  'Quiz Show': {
    typeKey: 'Quiz Show',
    displayName: 'Quiz Show',
    category: 'Non-Fiction TV',
    description: 'Question bank management, timer, lifelines & scoring engine',
    modules: [
      {
        id: 'question-bank-module',
        name: 'Question Bank (Restricted)',
        icon: 'FileText',
        subItems: [
          { id: 'question-bank', name: 'Question Bank' },
          { id: 'question-categories', name: 'Question Categories' },
          { id: 'difficulty-levels', name: 'Difficulty Levels' },
          { id: 'question-verification', name: 'Editorial Verification' },
          { id: 'legal-verification', name: 'Legal & Fact Check Clearance' }
        ]
      },
      {
        id: 'quiz-engine',
        name: 'Game Rules & Lifelines',
        icon: 'Clock',
        subItems: [
          { id: 'round-structure', name: 'Round Structure' },
          { id: 'scoring-system', name: 'Scoring System' },
          { id: 'lifelines', name: 'Lifelines & Power-ups' },
          { id: 'payout-tree', name: 'Prize Money Structure' },
          { id: 'buzzer-timer', name: 'Buzzer & Timer Controls' }
        ]
      },
      {
        id: 'contestants-quiz',
        name: 'Contestants & Host',
        icon: 'Users',
        subItems: [
          { id: 'quiz-host', name: 'Host & Experts' },
          { id: 'quiz-contestants', name: 'Contestant Roster' },
          { id: 'fastest-finger', name: 'Fastest Finger First Setup' }
        ]
      }
    ],
    departmentWorkspaces: STANDARD_DEPARTMENT_WORKSPACES,
    dashboardCards: [
      { title: 'Question Bank', value: '0 Questions', subtext: 'Fact checked question base', badge: 'Locked', type: 'metric' },
      { title: 'Verified Questions', value: '0 Ready', subtext: 'Clear for broadcast', type: 'progress' },
      { title: 'Prize Pool Sanctioned', value: '₹0', subtext: 'Sanctioned pool', type: 'financial' }
    ],
    dsrExtraFields: [
      { fieldKey: 'episode_round', label: 'Episode & Round', type: 'text' },
      { fieldKey: 'questions_used', label: 'Questions Played Today', type: 'number' },
      { fieldKey: 'prize_won', label: 'Prize Money Awarded', type: 'number' }
    ],
    budgetCategories: []
  },

  'Reality Show': {
    typeKey: 'Reality Show',
    displayName: 'Reality Show',
    category: 'Non-Fiction TV',
    description: 'House camera surveillance, contestant journey, voting & confession room',
    modules: [
      {
        id: 'house-contestants',
        name: 'Contestant Journey & House',
        icon: 'Home',
        subItems: [
          { id: 'active-contestants', name: 'Active Contestants' },
          { id: 'contestant-journey', name: 'Contestant Journey & Logs' },
          { id: 'auditions-selection', name: 'Auditions & Selection' },
          { id: 'elimination-voting', name: 'Elimination & Voting Matrix' },
          { id: 'tasks-challenges', name: 'Daily Tasks & Challenges' },
          { id: 'main-set-house', name: 'House / Main Set Setup' },
          { id: 'confession-room', name: 'Confession Room Logs' }
        ]
      },
      {
        id: 'pcr-surveillance',
        name: 'PCR & 24/7 Surveillance',
        icon: 'Video',
        subItems: [
          { id: 'camera-surveillance', name: 'Surveillance Camera Plan' },
          { id: 'pcr-feeds', name: 'PCR Live Feeds & Isolation' },
          { id: 'audio-mics', name: 'Body Mic & Ambient Audio' },
          { id: 'medical-welfare', name: 'Medical & Contestant Welfare' },
          { id: 'house-security', name: 'House Perimeter Security' }
        ]
      }
    ],
    departmentWorkspaces: STANDARD_DEPARTMENT_WORKSPACES,
    dashboardCards: [
      { title: 'Active Contestants', value: '0 Contestants', subtext: 'In reality house', type: 'metric' },
      { title: 'Confession Logs', value: '0 Hours', subtext: 'Multi-cam feed log', type: 'status' },
      { title: 'Eliminations', value: '0 Eliminated', subtext: 'Voting matrix', badge: 'Live', type: 'progress' }
    ],
    dsrExtraFields: [
      { fieldKey: 'house_day', label: 'House Day Number', type: 'number' },
      { fieldKey: 'task_name', label: 'Daily Task / Challenge', type: 'text' },
      { fieldKey: 'medical_alerts', label: 'Medical / Welfare Alerts', type: 'text' }
    ],
    budgetCategories: []
  },

  'Music Reality Show': {
    typeKey: 'Music Reality Show',
    displayName: 'Music Reality Show',
    category: 'Non-Fiction TV',
    description: 'Live band, song library, keys, rehearsals & track clearance',
    modules: [
      {
        id: 'song-library-module',
        name: 'Song Library & Music Rights',
        icon: 'Music',
        subItems: [
          { id: 'song-library', name: 'Song Library' },
          { id: 'original-key', name: 'Original Key & Scales' },
          { id: 'performance-key', name: 'Performance Key Allocation' },
          { id: 'music-rights', name: 'Music Rights & Clearances' },
          { id: 'track-status', name: 'Minus One & Track Production' },
          { id: 'band-musicians', name: 'Live Band & Musicians' },
          { id: 'rehearsal-status', name: 'Music Rehearsal Schedule' }
        ]
      },
      {
        id: 'performers-judges',
        name: 'Singers, Judges & Mentors',
        icon: 'Crown',
        subItems: [
          { id: 'singer-roster', name: 'Singers & Contestants' },
          { id: 'judges-mentors', name: 'Judges & Guest Mentors' },
          { id: 'scoring-voting', name: 'Scores & Voting Results' }
        ]
      }
    ],
    departmentWorkspaces: STANDARD_DEPARTMENT_WORKSPACES,
    dashboardCards: [
      { title: 'Songs Cleared', value: '0 Songs', subtext: 'Rights approved base', badge: 'Live', type: 'metric' },
      { title: 'Live Band Members', value: '0 Musicians', subtext: 'Orchestration roster', type: 'status' },
      { title: 'Rehearsals Done', value: '0 Hours', subtext: 'Pre-shoot prep log', type: 'progress' }
    ],
    dsrExtraFields: [
      { fieldKey: 'songs_filmed', label: 'Songs Filmed Today', type: 'text' },
      { fieldKey: 'band_shift', label: 'Live Band Shift Hours', type: 'text' }
    ],
    budgetCategories: []
  },

  'Dance Reality Show': {
    typeKey: 'Dance Reality Show',
    displayName: 'Dance Reality Show',
    category: 'Non-Fiction TV',
    description: 'Choreography, floor specifications, stage safety & costume looks',
    modules: [
      {
        id: 'dance-choreography',
        name: 'Choreography & Rehearsals',
        icon: 'Users',
        subItems: [
          { id: 'dancers-groups', name: 'Dancers & Dance Groups' },
          { id: 'choreographers', name: 'Choreographers' },
          { id: 'dance-styles', name: 'Dance Styles & Themes' },
          { id: 'rehearsal-halls', name: 'Rehearsal Hall Booking' },
          { id: 'floor-req', name: 'Stage Floor & Rigging Specs' },
          { id: 'stage-props', name: 'Dance Props & Harnesses' },
          { id: 'dancer-safety', name: 'Stage Safety & Physio' }
        ]
      }
    ],
    departmentWorkspaces: STANDARD_DEPARTMENT_WORKSPACES,
    dashboardCards: [
      { title: 'Choreography Acts', value: '0 Performances', subtext: 'Choreography roster', type: 'metric' },
      { title: 'Rehearsal Hours', value: '0 Hours', subtext: 'Hall booking log', type: 'progress' },
      { title: 'Stage Floor Safety', value: 'Active', subtext: 'Anti-skid & safety audit', badge: 'Safe', type: 'status' }
    ],
    dsrExtraFields: [
      { fieldKey: 'performances_shot', label: 'Dance Acts Shot', type: 'text' },
      { fieldKey: 'physio_incidents', label: 'Physio / Injury Incidents', type: 'text' }
    ],
    budgetCategories: []
  },

  'Ad Film': {
    typeKey: 'Ad Film',
    displayName: 'Ad Film',
    category: 'Commercial',
    description: 'Commercial film workflow with client/agency approvals & cutdowns',
    modules: [
      {
        id: 'ad-campaign',
        name: 'Campaign & Brief',
        icon: 'Tag',
        subItems: [
          { id: 'campaign-overview', name: 'Campaign Overview' },
          { id: 'client-brief', name: 'Client Brief' },
          { id: 'agency-brief', name: 'Agency Brief' },
          { id: 'brand-guidelines', name: 'Brand Guidelines' },
          { id: 'film-versions', name: 'Film Durations (30s, 15s, 6s)' },
          { id: 'delivery-dates', name: 'Client Delivery Deadlines' }
        ]
      },
      {
        id: 'ad-creative',
        name: 'Director Treatment & Storyboard',
        icon: 'Video',
        subItems: [
          { id: 'director-treatment', name: 'Director Treatment' },
          { id: 'ad-storyboard', name: 'Storyboard & Animatic' },
          { id: 'client-agency-approval', name: 'Client & Agency Approval History' }
        ]
      },
      {
        id: 'hero-product',
        name: 'Product & Hero Shots',
        icon: 'Package',
        subItems: [
          { id: 'product-list', name: 'Product Roster' },
          { id: 'product-styling', name: 'Product Styling & Rigging' },
          { id: 'hero-product-handling', name: 'Hero Product Handling' },
          { id: 'product-continuity', name: 'Product Label Continuity' }
        ]
      },
      {
        id: 'ad-post',
        name: 'Post & Adaptations',
        icon: 'Sparkles',
        subItems: [
          { id: 'offline-edit', name: 'Offline Edit & Client Reviews' },
          { id: 'online-retouching', name: 'Online & Product Retouching' },
          { id: 'cutdowns-vertical', name: 'Cutdowns & Social Formats (9:16)' },
          { id: 'language-dubbing', name: 'Language Masters & VO' }
        ]
      }
    ],
    departmentWorkspaces: STANDARD_DEPARTMENT_WORKSPACES,
    dashboardCards: [
      { title: 'Client Approvals', value: 'Pending', subtext: 'Treatment & storyboard', badge: 'Live', type: 'status' },
      { title: 'Versions Planned', value: '0 Deliverables', subtext: 'Cutdowns & language master', type: 'metric' },
      { title: 'Product Shots', value: '0 / 0 Shot', subtext: 'Hero product logs', type: 'progress' }
    ],
    dsrExtraFields: [
      { fieldKey: 'version_shot', label: 'Version / Spot Filmed', type: 'text' },
      { fieldKey: 'client_present', label: 'Client / Agency Attendees', type: 'text' }
    ],
    budgetCategories: []
  },

  'Documentary Series': {
    typeKey: 'Documentary Series',
    displayName: 'Documentary Series',
    category: 'Documentary',
    description: 'Research, subjects, interview transcripts, archive & rights clearances',
    modules: [
      {
        id: 'doc-research',
        name: 'Research & Fact Verification',
        icon: 'FileText',
        subItems: [
          { id: 'research-topics', name: 'Research Topics' },
          { id: 'research-sources', name: 'Sources & References' },
          { id: 'chronology', name: 'Historical Timeline' },
          { id: 'fact-verification', name: 'Fact Verification Logs' }
        ]
      },
      {
        id: 'subjects-interviews',
        name: 'Subjects & Interview Logs',
        icon: 'Users',
        subItems: [
          { id: 'subjects-directory', name: 'Subjects & Contributors' },
          { id: 'consent-releases', name: 'Consent & Release Forms' },
          { id: 'interview-plan', name: 'Interview Plan & Questions' },
          { id: 'transcripts', name: 'Transcripts & Translations' }
        ]
      },
      {
        id: 'archive-rights',
        name: 'Archive & Rights Clearance',
        icon: 'HardDrive',
        subItems: [
          { id: 'archive-footage', name: 'Archive Footage Library' },
          { id: 'archive-stills', name: 'Archive Stills & Photos' },
          { id: 'licence-agreements', name: 'Licensing & Copyright Clearances' },
          { id: 'legal-review', name: 'Legal Review & Fair Use' }
        ]
      }
    ],
    departmentWorkspaces: STANDARD_DEPARTMENT_WORKSPACES,
    dashboardCards: [
      { title: 'Subjects Interviewed', value: '0 Subjects', subtext: 'Interview logs recorded', type: 'metric' },
      { title: 'Transcripts Done', value: '0 Completed', subtext: 'Searchable transcript bank', badge: 'Live', type: 'progress' },
      { title: 'Archive Licensing', value: '0 Cleared', subtext: 'Rights verified base', type: 'status' }
    ],
    dsrExtraFields: [
      { fieldKey: 'interviewee_name', label: 'Interview Subject Name', type: 'text' },
      { fieldKey: 'interview_duration', label: 'Interview Duration (Mins)', type: 'number' },
      { fieldKey: 'archive_referenced', label: 'Archive Clips Used', type: 'text' }
    ],
    budgetCategories: []
  },

  'Travel Show': {
    typeKey: 'Travel Show',
    displayName: 'Travel Show',
    category: 'Non-Fiction TV',
    description: 'Destinations, visas, local fixers, weather tracking & field logistics',
    modules: [
      {
        id: 'travel-logistics',
        name: 'Destinations & Fixers',
        icon: 'MapPin',
        subItems: [
          { id: 'destinations', name: 'Destinations & Locations' },
          { id: 'travel-routes', name: 'Travel Routes & Itinerary' },
          { id: 'local-fixers', name: 'Local Fixers & Guides' },
          { id: 'location-permissions', name: 'Location Filming Permits' },
          { id: 'visa-documents', name: 'Visa & Customs Carnet' },
          { id: 'flights-hotels', name: 'Flights & Hotel Bookings' },
          { id: 'weather-tracking', name: 'Weather Risk Tracking' }
        ]
      }
    ],
    departmentWorkspaces: STANDARD_DEPARTMENT_WORKSPACES,
    dashboardCards: [
      { title: 'Destinations Covered', value: '0 Locations', subtext: 'Itinerary route tracking', type: 'metric' },
      { title: 'Filming Permits', value: 'Pending', subtext: 'Carnet & permit logs', badge: 'Live', type: 'status' },
      { title: 'Field Crew Travel', value: '0 Members', subtext: 'Active transit roster', type: 'progress' }
    ],
    dsrExtraFields: [
      { fieldKey: 'city_location', label: 'City / Location Filmed', type: 'text' },
      { fieldKey: 'weather_status', label: 'Weather Conditions', type: 'text' }
    ],
    budgetCategories: []
  },

  'Award Show': {
    typeKey: 'Award Show',
    displayName: 'Award Show',
    category: 'Non-Fiction TV',
    description: 'Categories, nominees, jury voting, stage LED, red carpet & VIPs',
    modules: [
      {
        id: 'award-categories-module',
        name: 'Nominees, Jury & Winners',
        icon: 'Crown',
        subItems: [
          { id: 'award-categories', name: 'Award Categories' },
          { id: 'nominees-roster', name: 'Nominees Roster' },
          { id: 'jury-voting', name: 'Jury & Voting Audit' },
          { id: 'winners-locked', name: 'Sealed Winners List' }
        ]
      },
      {
        id: 'event-production',
        name: 'Stage, Red Carpet & VIPs',
        icon: 'Sparkles',
        subItems: [
          { id: 'performers-presenters', name: 'Performers & Presenters' },
          { id: 'red-carpet', name: 'Red Carpet Logistics' },
          { id: 'vip-hospitality', name: 'VIP Hospitality & Security' },
          { id: 'show-rundown', name: 'Live Event Minute-by-Minute Rundown' },
          { id: 'stage-led-lighting', name: 'Stage, LED Screens & Lighting' },
          { id: 'ob-van-broadcast', name: 'OB Van & Live Broadcast Setup' }
        ]
      }
    ],
    departmentWorkspaces: STANDARD_DEPARTMENT_WORKSPACES,
    dashboardCards: [
      { title: 'Award Categories', value: '0 Categories', subtext: 'Nominee categories log', type: 'metric' },
      { title: 'Celebrity Performers', value: '0 Live Acts', subtext: 'Rehearsal schedule', type: 'status' },
      { title: 'VIP Attendance', value: '0 Confirmed', subtext: 'Red carpet RSVP list', badge: 'Live', type: 'progress' }
    ],
    dsrExtraFields: [
      { fieldKey: 'rehearsal_act', label: 'Rehearsal Act / Segment', type: 'text' },
      { fieldKey: 'stage_readiness', label: 'Stage / LED Readiness %', type: 'number' }
    ],
    budgetCategories: []
  },

  'Other': {
    typeKey: 'Other',
    displayName: 'Custom Project (Template Builder)',
    category: 'Custom',
    description: 'Fully customizable project hierarchy and module builder',
    modules: [
      {
        id: 'custom-template-builder',
        name: 'Custom Template Builder',
        icon: 'Sliders',
        subItems: [
          { id: 'base-template-select', name: 'Select Base Template' },
          { id: 'custom-hierarchy', name: 'Create Custom Hierarchy' },
          { id: 'enable-disable-modules', name: 'Enable / Disable Modules' },
          { id: 'custom-departments', name: 'Create Custom Departments' },
          { id: 'custom-workflows', name: 'Create Approval Workflows' },
          { id: 'save-reusable-template', name: 'Save as Reusable Template' }
        ]
      }
    ],
    departmentWorkspaces: STANDARD_DEPARTMENT_WORKSPACES,
    dashboardCards: [
      { title: 'Custom Configuration', value: 'Active Template', subtext: 'User defined hierarchy', badge: 'Custom', type: 'status' },
      { title: 'Modules Enabled', value: '0 Modules', subtext: 'Tailored to project', type: 'metric' }
    ],
    dsrExtraFields: [
      { fieldKey: 'custom_notes', label: 'Custom Operations Log', type: 'text' }
    ],
    budgetCategories: []
  }
};

// Helper function to resolve template for ANY given projectType string safely
export function getTemplateForProjectType(projectType?: string): ProjectTypeTemplate {
  if (!projectType) return PROJECT_TYPE_TEMPLATES['Film'];

  const norm = projectType.trim().toLowerCase();

  for (const [key, tpl] of Object.entries(PROJECT_TYPE_TEMPLATES)) {
    if (key.toLowerCase() === norm || tpl.displayName.toLowerCase().includes(norm)) {
      return tpl;
    }
  }

  if (norm.includes('cook')) return PROJECT_TYPE_TEMPLATES['Cooking Show'];
  if (norm.includes('quiz')) return PROJECT_TYPE_TEMPLATES['Quiz Show'];
  if (norm.includes('reality')) return PROJECT_TYPE_TEMPLATES['Reality Show'];
  if (norm.includes('music')) return PROJECT_TYPE_TEMPLATES['Music Reality Show'];
  if (norm.includes('dance')) return PROJECT_TYPE_TEMPLATES['Dance Reality Show'];
  if (norm.includes('ad film') || norm.includes('commercial')) return PROJECT_TYPE_TEMPLATES['Ad Film'];
  if (norm.includes('doc')) return PROJECT_TYPE_TEMPLATES['Documentary Series'];
  if (norm.includes('travel')) return PROJECT_TYPE_TEMPLATES['Travel Show'];
  if (norm.includes('award')) return PROJECT_TYPE_TEMPLATES['Award Show'];
  if (norm.includes('ott') || norm.includes('web series')) return PROJECT_TYPE_TEMPLATES['OTT'];
  if (norm.includes('short')) return PROJECT_TYPE_TEMPLATES['Short Film'];
  if (norm.includes('other') || norm.includes('custom')) return PROJECT_TYPE_TEMPLATES['Other'];

  return PROJECT_TYPE_TEMPLATES['Film'];
}
