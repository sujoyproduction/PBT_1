import React, { useState, useEffect, useMemo } from 'react';
import { 
  Film, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Wrench, 
  Truck, 
  Zap, 
  Utensils, 
  Plus, 
  Search, 
  Download, 
  Printer, 
  CheckCircle2, 
  Lock, 
  AlertCircle, 
  AlertTriangle,
  Edit3, 
  Trash2, 
  Copy, 
  Eye, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown,
  ChevronUp,
  RotateCcw,
  LayoutGrid, 
  Columns, 
  CalendarDays, 
  Fuel, 
  Video, 
  FileText, 
  X, 
  ShieldCheck, 
  TrendingUp, 
  Building2, 
  Sparkles, 
  Send, 
  ArrowRight,
  Info,
  Package,
  Filter,
  CreditCard,
  Receipt,
  Check,
  Share2,
  Mail,
  BarChart3,
  Layers,
  UserCheck
} from 'lucide-react';
import { ProductionDSR, DSRCrewEntry, DSREquipmentEntry, DSRGoodsEntry, DSRTransportEntry, DSRGensetEntry, DSRVanityEntry, DSRFoodEntry, DSRFootageEntry, DSRDepartmentCallTime, Project, Expense } from '../types';
import { subscribeDSRs, saveDSR, deleteDSR, addDbLog, saveExpense } from '../services/firebaseService';
import { getIndianHolidayForDate } from '../utils/indianHolidays';
import CallSheetDsrDispatcher from './CallSheetDsrDispatcher';

// Department Logistics & Operation Modules for Production Subtabs
import { ProductionDsrSummary } from './departmentModules/ProductionDsrSummary';
import { ProductionSchedule } from './departmentModules/ProductionSchedule';
import { ProductionUnitPlanning } from './departmentModules/ProductionUnitPlanning';
import { ProductionCrewCount } from './departmentModules/ProductionCrewCount';
import { ProductionArtistAttendance } from './departmentModules/ProductionArtistAttendance';
import { ProductionEquipment } from './departmentModules/ProductionEquipment';
import { ProductionTransport } from './departmentModules/ProductionTransport';
import { ProductionGensetFuel } from './departmentModules/ProductionGensetFuel';
import { ProductionVanity } from './departmentModules/ProductionVanity';
import { ProductionFood } from './departmentModules/ProductionFood';
import { ProductionCallSheet } from './departmentModules/ProductionCallSheet';
import { ProductionDailyRequirement } from './departmentModules/ProductionDailyRequirement';
import { ProductionAccommodation } from './departmentModules/ProductionAccommodation';
import { ProductionIssueTracker } from './departmentModules/ProductionIssueTracker';

export interface StandardDepartment {
  department: string;
  designations: string[];
}

export const STANDARD_CREW_DEPARTMENTS: StandardDepartment[] = [
  {
    department: 'Story & Development',
    designations: ['Writers']
  },
  {
    department: 'Production Team',
    designations: [
      'Producer',
      'Associate Producer',
      'Commercial Head',
      'Executive Producer',
      'Line Producer',
      'Production Controller',
      'Production Manager',
      'Assistant Production Manager',
      'Production Coordinator',
      'Production Assistant',
      'Unit Manager',
      'Spot Boys',
      'Spot Boys (Av Shoot, Dubb)',
      'Office Boys',
      'Spot Boy (Personal)'
    ]
  },
  {
    department: 'Direction Team',
    designations: [
      'Director',
      'Associate Director',
      'Chief Assistant Director',
      'Assistant Directors',
      'Director Assistant',
      'Director Driver'
    ]
  },
  {
    department: 'Camera Team',
    designations: [
      'Director of Photography',
      'Camera Operator',
      'Online Editor',
      'Iso Attendant',
      'Focus Puller',
      'First AC',
      'Second AC',
      'DIT',
      'Data Wrangler',
      'Camera Attendant',
      'Ronin Attendant',
      'Jimmy Attendant',
      'Still Photographer'
    ]
  },
  {
    department: 'Lighting Team',
    designations: [
      'Gaffer',
      'Electrician',
      'Trolley Setting',
      'Catwalk',
      'Lightman',
      'Crane Attendant',
      'Intelligent Light Attendant'
    ]
  },
  {
    department: 'Key & Grip',
    designations: [
      'Key Grip',
      'Dolly Grip',
      'Crane Operator',
      'Rigging Crew',
      'Truss & Pillar'
    ]
  },
  {
    department: 'Sound Team',
    designations: [
      'Sound Designer',
      'Sound Engineer',
      'Guide Track recorder',
      'Sound Recordist',
      'Assistant Sound Recordist',
      'Boom man',
      'Sound Attendant',
      'PA Attendant',
      'Walkie & Clearcom Attendant'
    ]
  },
  {
    department: 'Art Team',
    designations: [
      'Production Designer',
      'Assistant Production Designer',
      'Art Director',
      'Assistant Art Director',
      'Shooting Set Decorator',
      'Art Setting',
      'Art Setting (Extra)',
      'Carpenter',
      'Painter',
      'Modeller',
      'Welder',
      'Fabricator',
      'Local Labour (Art)'
    ]
  },
  {
    department: 'Costume Team',
    designations: [
      'Costume Designer',
      'Costume Assistant',
      'Dresser',
      'Dresser Extra',
      'Laundry Man',
      'Tailor Master'
    ]
  },
  {
    department: 'Makeup & Hair Team',
    designations: [
      'Makeup Artist',
      'Assistant Makeup Artist',
      'Assistant Makeup Artist (Extra)',
      'Makeup Artist (Personal)',
      'Prosthetic Artist',
      'Hair Stylist',
      'Hair Stylist (Personal)',
      'Hair Dresser'
    ]
  },
  {
    department: 'VFX Team',
    designations: ['VFX Supervisor', 'On-set VFX']
  },
  {
    department: 'Stunts',
    designations: [
      'Action Director',
      'Fight Master',
      'Assistant Fight Master',
      'Fighters',
      'Safety Officer',
      'Stunt Coordinator',
      'Rope & Grip Attendant',
      'Effect Master',
      'Assistant Effect Master',
      'Effect Attendant',
      'Stunt Driver'
    ]
  },
  {
    department: 'Dance',
    designations: [
      'Choreographer',
      'Assistant Choreographer',
      'Dance Assistant',
      'Dancers',
      'Special Act Dancer',
      'Dance Props Maker Team'
    ]
  },
  {
    department: 'Medical',
    designations: ['Doctor', 'Nurse', 'Ambulance']
  },
  {
    department: 'Security',
    designations: ['Security Guards', 'Bouncers']
  },
  {
    department: 'Others / Attendants',
    designations: [
      'Genset Attendant',
      'Vanity Attendant',
      'Honda Attendants',
      'Rostrum Attendant',
      'Rain Attendant',
      'Propeller Attendant',
      'Truss',
      'AC Attendant',
      'Fire Safety',
      'LED Attendant',
      'LCD & Others Attendant',
      'Decorators & Pandal',
      'Facility Boys',
      'Electrician',
      'Cleaning Man',
      'Fan Attendant'
    ]
  },
  {
    department: 'Transport',
    designations: [
      'Travels Car Driver',
      'Guest Driver',
      "HOD's Driver",
      'Matador Driver',
      'Hydra & Crane',
      'Boat & Ship',
      'Van & Rickshaw'
    ]
  },
  {
    department: 'Lead Cast',
    designations: ['Hero', 'Heroine', 'Villain']
  },
  {
    department: 'Supporting Cast',
    designations: ['Supporting Actors', 'Character Actors']
  },
  {
    department: 'Junior Artists',
    designations: [
      'Junior Artists (Cat A)',
      'Junior Artists (Cat B)',
      'Junior Artists (Cat C)'
    ]
  },
  {
    department: 'Special Appearance',
    designations: ['Guest Actor', 'Celebrity Cameo']
  }
];

export interface UnitPresetCrewConfig {
  departmentNames: string[];
  designationFilter?: Record<string, string[]>;
}

export const UNIT_PRESET_CREW_MAPPING: Record<string, UnitPresetCrewConfig> = {
  'Shooting Unit': {
    departmentNames: [
      'Story & Development',
      'Production Team',
      'Direction Team',
      'Camera Team',
      'Lighting Team',
      'Key & Grip',
      'Sound Team',
      'Art Team',
      'Costume Team',
      'Makeup & Hair Team',
      'VFX Team',
      'Stunts',
      'Dance',
      'Medical',
      'Security',
      'Others / Attendants',
      'Transport',
      'Lead Cast',
      'Supporting Cast',
      'Junior Artists',
      'Special Appearance'
    ]
  },
  'Set Construction Unit': {
    departmentNames: [
      'Art Team',
      'Production Team',
      'Lighting Team',
      'Key & Grip',
      'Others / Attendants',
      'Transport',
      'Security',
      'Medical'
    ],
    designationFilter: {
      'Art Team': [
        'Production Designer',
        'Assistant Production Designer',
        'Art Director',
        'Assistant Art Director',
        'Shooting Set Decorator',
        'Art Setting',
        'Art Setting (Extra)',
        'Carpenter',
        'Painter',
        'Modeller',
        'Welder',
        'Fabricator',
        'Local Labour (Art)'
      ],
      'Production Team': [
        'Production Manager',
        'Assistant Production Manager',
        'Production Coordinator',
        'Production Assistant',
        'Unit Manager',
        'Spot Boys',
        'Office Boys'
      ],
      'Lighting Team': [
        'Electrician',
        'Catwalk',
        'Lightman'
      ],
      'Key & Grip': [
        'Key Grip',
        'Crane Operator',
        'Rigging Crew',
        'Truss & Pillar'
      ],
      'Others / Attendants': [
        'Genset Attendant',
        'Honda Attendants',
        'Rostrum Attendant',
        'Fire Safety',
        'Decorators & Pandal',
        'Facility Boys',
        'Electrician',
        'Cleaning Man'
      ],
      'Transport': [
        'Matador Driver',
        'Hydra & Crane',
        'Travels Car Driver',
        'Van & Rickshaw'
      ],
      'Security': [
        'Security Guards'
      ],
      'Medical': [
        'Doctor',
        'Ambulance'
      ]
    }
  },
  'Recce Unit': {
    departmentNames: [
      'Direction Team',
      'Camera Team',
      'Production Team',
      'Art Team',
      'Sound Team',
      'Lighting Team',
      'Key & Grip',
      'Transport',
      'Security'
    ],
    designationFilter: {
      'Direction Team': [
        'Director',
        'Associate Director',
        'Chief Assistant Director',
        'Assistant Directors'
      ],
      'Camera Team': [
        'Director of Photography',
        'Camera Operator',
        'Focus Puller',
        'Still Photographer'
      ],
      'Production Team': [
        'Producer',
        'Executive Producer',
        'Line Producer',
        'Production Controller',
        'Production Manager',
        'Unit Manager',
        'Spot Boys'
      ],
      'Art Team': [
        'Production Designer',
        'Art Director',
        'Shooting Set Decorator'
      ],
      'Sound Team': [
        'Sound Designer',
        'Sound Recordist'
      ],
      'Lighting Team': [
        'Gaffer'
      ],
      'Key & Grip': [
        'Key Grip'
      ],
      'Transport': [
        'Travels Car Driver',
        'Guest Driver',
        "HOD's Driver"
      ],
      'Security': [
        'Security Guards'
      ]
    }
  },
  'Audition Unit': {
    departmentNames: [
      'Direction Team',
      'Production Team',
      'Camera Team',
      'Sound Team',
      'Costume Team',
      'Makeup & Hair Team',
      'Lead Cast',
      'Supporting Cast',
      'Junior Artists',
      'Transport'
    ],
    designationFilter: {
      'Direction Team': [
        'Associate Director',
        'Chief Assistant Director',
        'Assistant Directors',
        'Director Assistant'
      ],
      'Production Team': [
        'Production Controller',
        'Production Manager',
        'Production Coordinator',
        'Production Assistant',
        'Spot Boys',
        'Office Boys'
      ],
      'Camera Team': [
        'Camera Operator',
        'First AC',
        'Still Photographer'
      ],
      'Sound Team': [
        'Sound Recordist',
        'Boom man'
      ],
      'Costume Team': [
        'Costume Assistant',
        'Dresser'
      ],
      'Makeup & Hair Team': [
        'Makeup Artist',
        'Hair Stylist'
      ],
      'Lead Cast': [
        'Hero',
        'Heroine',
        'Villain'
      ],
      'Supporting Cast': [
        'Supporting Actors',
        'Character Actors'
      ],
      'Junior Artists': [
        'Junior Artists (Cat A)',
        'Junior Artists (Cat B)'
      ],
      'Transport': [
        'Travels Car Driver'
      ]
    }
  },
  'AV Shoot Unit': {
    departmentNames: [
      'Camera Team',
      'Sound Team',
      'Direction Team',
      'Production Team',
      'Lighting Team',
      'Makeup & Hair Team',
      'Costume Team',
      'Transport'
    ],
    designationFilter: {
      'Camera Team': [
        'Director of Photography',
        'Camera Operator',
        'First AC',
        'Second AC',
        'DIT',
        'Data Wrangler',
        'Still Photographer'
      ],
      'Sound Team': [
        'Sound Recordist',
        'Assistant Sound Recordist',
        'Boom man'
      ],
      'Direction Team': [
        'Director',
        'Associate Director',
        'Assistant Directors'
      ],
      'Production Team': [
        'Production Manager',
        'Production Assistant',
        'Spot Boys (Av Shoot, Dubb)',
        'Spot Boys'
      ],
      'Lighting Team': [
        'Gaffer',
        'Electrician',
        'Lightman'
      ],
      'Makeup & Hair Team': [
        'Makeup Artist',
        'Hair Stylist'
      ],
      'Costume Team': [
        'Costume Assistant',
        'Dresser'
      ],
      'Transport': [
        'Travels Car Driver'
      ]
    }
  },
  'Stock Shoot Unit': {
    departmentNames: [
      'Camera Team',
      'Direction Team',
      'Production Team',
      'Key & Grip',
      'Transport',
      'Others / Attendants'
    ],
    designationFilter: {
      'Camera Team': [
        'Director of Photography',
        'Camera Operator',
        'Focus Puller',
        'First AC',
        'DIT',
        'Data Wrangler',
        'Still Photographer'
      ],
      'Direction Team': [
        'Chief Assistant Director',
        'Assistant Directors'
      ],
      'Production Team': [
        'Production Manager',
        'Production Assistant',
        'Unit Manager',
        'Spot Boys'
      ],
      'Key & Grip': [
        'Key Grip',
        'Dolly Grip'
      ],
      'Transport': [
        'Travels Car Driver',
        'Matador Driver'
      ],
      'Others / Attendants': [
        'Facility Boys',
        'Security Guards'
      ]
    }
  },
  'Custom': {
    departmentNames: [
      'Story & Development',
      'Production Team',
      'Direction Team',
      'Camera Team',
      'Lighting Team',
      'Key & Grip',
      'Sound Team',
      'Art Team',
      'Costume Team',
      'Makeup & Hair Team',
      'VFX Team',
      'Stunts',
      'Dance',
      'Medical',
      'Security',
      'Others / Attendants',
      'Transport',
      'Lead Cast',
      'Supporting Cast',
      'Junior Artists',
      'Special Appearance'
    ]
  }
};

// Preset Mappings for Equipment
export interface UnitPresetEquipmentConfig {
  categoryNames: string[];
  itemFilter?: Record<string, string[]>;
}

export const UNIT_PRESET_EQUIPMENT_MAPPING: Record<string, UnitPresetEquipmentConfig> = {
  'Shooting Unit': {
    categoryNames: ['Camera', 'Camera Support', 'Lighting', 'Sound Equipment', 'Others Equipment']
  },
  'Set Construction Unit': {
    categoryNames: ['Others Equipment', 'Lighting', 'Sound Equipment'],
    itemFilter: {
      'Others Equipment': ['Rostrum', 'Trust & Piller', 'Hydra Crane', 'Rain', 'Smoke & Haze', 'Storm', 'Propeller', 'Cutter', 'Blender', 'Driller', 'Sprayer'],
      'Lighting': ['Working Light', 'Set Light (Camera)'],
      'Sound Equipment': ['Walkie Talkie', 'Pa System', 'Speaker']
    }
  },
  'Recce Unit': {
    categoryNames: ['Camera', 'Camera Support', 'Sound Equipment'],
    itemFilter: {
      'Camera': ['Prime Lens', 'Zoom Lens'],
      'Camera Support': ['Drone', 'Osmo', 'Go Pro'],
      'Sound Equipment': ['Zoom Recorder', 'Walkie Talkie']
    }
  },
  'Audition Unit': {
    categoryNames: ['Camera', 'Camera Support', 'Lighting', 'Sound Equipment'],
    itemFilter: {
      'Camera': ['A Camera', 'Prime Lens', 'Zoom Lens'],
      'Camera Support': ['Slider', 'Dolly'],
      'Lighting': ['Set Light (Camera)', 'Cine Light', 'Working Light'],
      'Sound Equipment': ['Zoom Recorder', 'Mixer', 'Walkie Talkie', 'Speaker']
    }
  },
  'AV Shoot Unit': {
    categoryNames: ['Camera', 'Camera Support', 'Lighting', 'Sound Equipment'],
    itemFilter: {
      'Camera': ['A Camera', 'B Camera', 'Prime Lens', 'Zoom Lens', 'Macro'],
      'Camera Support': ['Slider', 'Gimbal', 'Ronin', 'Drone'],
      'Lighting': ['Cine Light', 'Intelegent Light', 'Set Light (Camera)', 'Working Light'],
      'Sound Equipment': ['Zoom Recorder', 'Mixer', 'Walkie Talkie', 'Speaker']
    }
  },
  'Stock Shoot Unit': {
    categoryNames: ['Camera', 'Camera Support', 'Sound Equipment', 'Lighting'],
    itemFilter: {
      'Camera': ['A Camera', 'Prime Lens', 'Zoom Lens', 'Anamorphic'],
      'Camera Support': ['Gimbal', 'Steadicam', 'Drone', 'Go Pro', 'Osmo'],
      'Lighting': ['Set Light (Camera)', 'Working Light'],
      'Sound Equipment': ['Zoom Recorder', 'Walkie Talkie']
    }
  },
  'Custom': {
    categoryNames: ['Camera', 'Camera Support', 'Lighting', 'Sound Equipment', 'Others Equipment']
  }
};

// Preset Mappings for Goods
export interface UnitPresetGoodsConfig {
  categoryNames: string[];
  itemFilter?: Record<string, string[]>;
}

export const UNIT_PRESET_GOODS_MAPPING: Record<string, UnitPresetGoodsConfig> = {
  'Shooting Unit': {
    categoryNames: ['FURNITURE & TENTS', 'KITCHEN & CATERING APPLIANCES']
  },
  'Set Construction Unit': {
    categoryNames: ['FURNITURE & TENTS', 'KITCHEN & CATERING APPLIANCES'],
    itemFilter: {
      'FURNITURE & TENTS': ['Tent', 'Stand Fan', 'Table', 'Chair', 'Carpet', 'Portable Ac', 'Dustbin', 'Mirror', 'Umbrella'],
      'KITCHEN & CATERING APPLIANCES': ['Gas', 'Ice Box', 'Dustbin']
    }
  },
  'Recce Unit': {
    categoryNames: ['FURNITURE & TENTS', 'KITCHEN & CATERING APPLIANCES'],
    itemFilter: {
      'FURNITURE & TENTS': ['Stand Fan', 'Chair', 'Umbrella', 'Portable Ac', 'Dustbin'],
      'KITCHEN & CATERING APPLIANCES': ['Ice Box', 'Dustbin']
    }
  },
  'Audition Unit': {
    categoryNames: ['FURNITURE & TENTS', 'KITCHEN & CATERING APPLIANCES'],
    itemFilter: {
      'FURNITURE & TENTS': ['Sofa', 'Chair', 'Table', 'Stand Fan', 'Carpet', 'Mirror', 'Portable Ac', 'Dustbin', 'Umbrella'],
      'KITCHEN & CATERING APPLIANCES': ['Coffe Machine', 'Ice Box', 'Dustbin']
    }
  },
  'AV Shoot Unit': {
    categoryNames: ['FURNITURE & TENTS', 'KITCHEN & CATERING APPLIANCES'],
    itemFilter: {
      'FURNITURE & TENTS': ['Sofa', 'Chair', 'Table', 'Tent', 'Stand Fan', 'Portable Ac', 'Mirror', 'Umbrella', 'Dustbin'],
      'KITCHEN & CATERING APPLIANCES': ['Coffe Machine', 'Ice Box', 'Dustbin']
    }
  },
  'Stock Shoot Unit': {
    categoryNames: ['FURNITURE & TENTS', 'KITCHEN & CATERING APPLIANCES'],
    itemFilter: {
      'FURNITURE & TENTS': ['Chair', 'Stand Fan', 'Tent', 'Umbrella', 'Portable Ac', 'Dustbin', 'Mirror'],
      'KITCHEN & CATERING APPLIANCES': ['Ice Box', 'Dustbin']
    }
  },
  'Custom': {
    categoryNames: ['FURNITURE & TENTS', 'KITCHEN & CATERING APPLIANCES']
  }
};

// Preset Mappings for Transport
export interface UnitPresetTransportConfig {
  categoryNames: string[];
  vehicleFilter?: Record<string, string[]>;
}

export const UNIT_PRESET_TRANSPORT_MAPPING: Record<string, UnitPresetTransportConfig> = {
  'Shooting Unit': {
    categoryNames: ['Travels Car', 'Matador', 'Others']
  },
  'Set Construction Unit': {
    categoryNames: ['Matador', 'Others', 'Travels Car'],
    vehicleFilter: {
      'Matador': ['Dala 807', 'Dala 407', 'Chota Hati', 'Pickup Van', 'Tracktore'],
      'Others': ['Hydra', 'JCB', 'Water Tank', 'Fire Van', 'Tempo Travera', 'Guild Van'],
      'Travels Car': ['Bolero', 'Sumo', 'Qualish', 'Van / Rixo', 'Scopio', 'Innova']
    }
  },
  'Recce Unit': {
    categoryNames: ['Travels Car', 'Others'],
    vehicleFilter: {
      'Travels Car': ['Innova', 'Chrysta', 'Fortuner', 'Scopio', 'Artiga', 'Dzire', 'BMW', 'Audi', 'Van / Rixo'],
      'Others': ['Tempo Travera', 'Guild Car']
    }
  },
  'Audition Unit': {
    categoryNames: ['Travels Car', 'Matador'],
    vehicleFilter: {
      'Travels Car': ['Innova', 'Chrysta', 'Artiga', 'Dzire', 'Van / Rixo'],
      'Matador': ['Pickup Van', 'Chota Hati']
    }
  },
  'AV Shoot Unit': {
    categoryNames: ['Travels Car', 'Matador', 'Others'],
    vehicleFilter: {
      'Travels Car': ['Innova', 'Chrysta', 'Fortuner', 'Artiga', 'Dzire'],
      'Matador': ['Dala 407', 'Chota Hati', 'Pickup Van'],
      'Others': ['Guild Car', 'Guild Van']
    }
  },
  'Stock Shoot Unit': {
    categoryNames: ['Travels Car', 'Matador'],
    vehicleFilter: {
      'Travels Car': ['Innova', 'Fortuner', 'Scopio', 'Artiga', 'Dzire'],
      'Matador': ['Pickup Van', 'Chota Hati']
    }
  },
  'Custom': {
    categoryNames: ['Travels Car', 'Matador', 'Others']
  }
};

// Preset Mappings for Genset & Vanity
export interface UnitPresetGensetVanityConfig {
  allowedItemNames: string[];
}

export const UNIT_PRESET_GENSET_VANITY_MAPPING: Record<string, UnitPresetGensetVanityConfig> = {
  'Shooting Unit': {
    allowedItemNames: [
      'Celebrity Vanity',
      'Double Door vanity',
      'Single Door Vanity',
      'Genset 125kVa Rent',
      'Genset 82kVa Rent',
      'Genset 62kVa Rent',
      'Genset 42kVa Rent',
      'Genset 25kVa Rent',
      'Honda Genset'
    ]
  },
  'Set Construction Unit': {
    allowedItemNames: [
      'Genset 125kVa Rent',
      'Genset 82kVa Rent',
      'Genset 62kVa Rent',
      'Genset 42kVa Rent',
      'Genset 25kVa Rent',
      'Honda Genset'
    ]
  },
  'Recce Unit': {
    allowedItemNames: [
      'Honda Genset',
      'Genset 25kVa Rent'
    ]
  },
  'Audition Unit': {
    allowedItemNames: [
      'Single Door Vanity',
      'Double Door vanity',
      'Genset 42kVa Rent',
      'Genset 25kVa Rent',
      'Honda Genset'
    ]
  },
  'AV Shoot Unit': {
    allowedItemNames: [
      'Single Door Vanity',
      'Double Door vanity',
      'Genset 82kVa Rent',
      'Genset 62kVa Rent',
      'Genset 42kVa Rent',
      'Honda Genset'
    ]
  },
  'Stock Shoot Unit': {
    allowedItemNames: [
      'Genset 42kVa Rent',
      'Genset 25kVa Rent',
      'Honda Genset'
    ]
  },
  'Custom': {
    allowedItemNames: [
      'Celebrity Vanity',
      'Double Door vanity',
      'Single Door Vanity',
      'Genset 125kVa Rent',
      'Genset 82kVa Rent',
      'Genset 62kVa Rent',
      'Genset 42kVa Rent',
      'Genset 25kVa Rent',
      'Honda Genset'
    ]
  }
};

// Preset Mappings for Food
export interface UnitPresetFoodConfig {
  categoryNames: string[];
  itemFilter?: Record<string, string[]>;
}

export const UNIT_PRESET_FOOD_MAPPING: Record<string, UnitPresetFoodConfig> = {
  'Shooting Unit': {
    categoryNames: ['BREAKFAST MEALS', 'LUNCH MEALS', 'SNACKS & HIGH TEA', 'DINNER MEALS', 'ALLOWANCES & REIMBURSEMENTS']
  },
  'Set Construction Unit': {
    categoryNames: ['LUNCH MEALS', 'SNACKS & HIGH TEA', 'DINNER MEALS', 'BREAKFAST MEALS', 'ALLOWANCES & REIMBURSEMENTS'],
    itemFilter: {
      'LUNCH MEALS': ['Lunch Crew A', 'Lunch Crew B', 'Extra Lunch'],
      'SNACKS & HIGH TEA': ['Snacks Crew A', 'Snacks Crew B', 'Extra Snacks'],
      'DINNER MEALS': ['Dinner Crew A', 'Dinner Crew B', 'Extra Dinner'],
      'BREAKFAST MEALS': ['Breakfast Crew A', 'Breakfast Crew B', 'Extra Breakfast'],
      'ALLOWANCES & REIMBURSEMENTS': ['Food Allowance']
    }
  },
  'Recce Unit': {
    categoryNames: ['BREAKFAST MEALS', 'LUNCH MEALS', 'SNACKS & HIGH TEA', 'ALLOWANCES & REIMBURSEMENTS'],
    itemFilter: {
      'BREAKFAST MEALS': ['Breakfast Crew A', 'Extra Breakfast'],
      'LUNCH MEALS': ['Lunch Crew A', 'Extra Lunch'],
      'SNACKS & HIGH TEA': ['Snacks Crew A', 'Extra Snacks'],
      'ALLOWANCES & REIMBURSEMENTS': ['Food Allowance']
    }
  },
  'Audition Unit': {
    categoryNames: ['BREAKFAST MEALS', 'LUNCH MEALS', 'SNACKS & HIGH TEA', 'DINNER MEALS', 'ALLOWANCES & REIMBURSEMENTS'],
    itemFilter: {
      'BREAKFAST MEALS': ['Breakfast Artist', 'Breakfast Crew A'],
      'LUNCH MEALS': ['Lunch Artist', 'Lunch Crew A', 'Extra Lunch'],
      'SNACKS & HIGH TEA': ['Snacks Artist', 'Snacks Crew A', 'Extra Snacks'],
      'DINNER MEALS': ['Dinner Artist', 'Dinner Crew A'],
      'ALLOWANCES & REIMBURSEMENTS': ['Food Allowance']
    }
  },
  'AV Shoot Unit': {
    categoryNames: ['BREAKFAST MEALS', 'LUNCH MEALS', 'SNACKS & HIGH TEA', 'DINNER MEALS', 'ALLOWANCES & REIMBURSEMENTS']
  },
  'Stock Shoot Unit': {
    categoryNames: ['BREAKFAST MEALS', 'LUNCH MEALS', 'SNACKS & HIGH TEA', 'DINNER MEALS', 'ALLOWANCES & REIMBURSEMENTS']
  },
  'Custom': {
    categoryNames: ['BREAKFAST MEALS', 'LUNCH MEALS', 'SNACKS & HIGH TEA', 'DINNER MEALS', 'ALLOWANCES & REIMBURSEMENTS']
  }
};

export interface StandardTransportCategory {
  category: string;
  vehicles: string[];
}

export const STANDARD_TRANSPORT_CATEGORIES: StandardTransportCategory[] = [
  {
    category: 'Travels Car',
    vehicles: [
      'Audi',
      'BMW',
      'Fortuner',
      'Chrysta',
      'Innova',
      'Scopio',
      'Artiga',
      'Sumo',
      'Qualish',
      'Bolero',
      'Dzire',
      'Van / Rixo'
    ]
  },
  {
    category: 'Matador',
    vehicles: [
      'Dala 807',
      'Dala 407',
      'Chota Hati',
      'Pickup Van',
      'Tracktore'
    ]
  },
  {
    category: 'Others',
    vehicles: [
      'Hydra',
      'JCB',
      'Ambulace',
      'Water Tank',
      'Fire Van',
      'Bus',
      'Tempo Travera',
      'Guild Car',
      'Guild Van'
    ]
  }
];

export interface StandardGensetVanityItem {
  name: string;
  category: 'Vanity' | 'Genset';
  defaultLph?: number;
}

export const STANDARD_GENSET_VANITY_ITEMS: StandardGensetVanityItem[] = [
  { name: 'Celebrity Vanity', category: 'Vanity', defaultLph: 6 },
  { name: 'Double Door vanity', category: 'Vanity', defaultLph: 5 },
  { name: 'Single Door Vanity', category: 'Vanity', defaultLph: 4 },
  { name: 'Genset 125kVa Rent', category: 'Genset', defaultLph: 15 },
  { name: 'Genset 82kVa Rent', category: 'Genset', defaultLph: 12 },
  { name: 'Genset 62kVa Rent', category: 'Genset', defaultLph: 9 },
  { name: 'Genset 42kVa Rent', category: 'Genset', defaultLph: 7 },
  { name: 'Genset 25kVa Rent', category: 'Genset', defaultLph: 5 },
  { name: 'Honda Genset', category: 'Genset', defaultLph: 2 }
];

export interface StandardEquipmentCategory {
  category: string;
  items: string[];
}

export const STANDARD_EQUIPMENT_CATEGORIES: StandardEquipmentCategory[] = [
  {
    category: 'Camera',
    items: [
      'A Camera',
      'B Camera',
      'Prime Lens',
      'Zoom Lens',
      'Macro',
      'Anamorphic'
    ]
  },
  {
    category: 'Camera Support',
    items: [
      'Slider',
      'Dolly',
      'Gimbal',
      'Steadicam',
      'Crane',
      'Jimmy Jib',
      'Ronin',
      'Go Pro',
      'Osmo',
      'Drone'
    ]
  },
  {
    category: 'Lighting',
    items: [
      'Intelegent Light',
      'Cine Light',
      'Set Light (Camera)',
      'Working Light'
    ]
  },
  {
    category: 'Sound Equipment',
    items: [
      'Zoom Recorder',
      'Mixer',
      'Srink Sound Setup',
      'Pa System',
      'Walkie Talkie',
      'Clearcom',
      'Speaker'
    ]
  },
  {
    category: 'Others Equipment',
    items: [
      'Rostrum',
      'Propeller',
      'Rain',
      'Smoke & Haze',
      'Storm',
      'Trust & Piller',
      'Hydra Crane',
      'Cutter',
      'Blender',
      'Driller',
      'Sprayer'
    ]
  }
];

export interface StandardFoodCategory {
  category: string;
  items: string[];
}

export const STANDARD_FOOD_CATEGORIES: StandardFoodCategory[] = [
  {
    category: 'BREAKFAST MEALS',
    items: [
      'Breakfast Artist',
      'Breakfast Crew A',
      'Breakfast Crew B',
      'Extra Breakfast'
    ]
  },
  {
    category: 'LUNCH MEALS',
    items: [
      'Lunch Artist',
      'Lunch Crew A',
      'Lunch Crew B',
      'Extra Lunch'
    ]
  },
  {
    category: 'SNACKS & HIGH TEA',
    items: [
      'Snacks Artist',
      'Snacks Crew A',
      'Snacks Crew B',
      'Extra Snacks'
    ]
  },
  {
    category: 'DINNER MEALS',
    items: [
      'Dinner Artist',
      'Dinner Crew A',
      'Dinner Crew B',
      'Extra Dinner'
    ]
  },
  {
    category: 'ALLOWANCES & REIMBURSEMENTS',
    items: [
      'Food Allowance'
    ]
  }
];

export const STANDARD_FOOD_ITEMS = STANDARD_FOOD_CATEGORIES.flatMap(c => c.items);

export const createDefaultFoodEntries = (existingEntries: DSRFoodEntry[] = []): DSRFoodEntry[] => {
  const map = new Map<string, DSRFoodEntry>();
  existingEntries.forEach(f => {
    if (f && f.mealType) {
      map.set(f.mealType.trim().toLowerCase(), f);
    }
  });

  const list: DSRFoodEntry[] = [];
  STANDARD_FOOD_CATEGORIES.forEach(cat => {
    cat.items.forEach(item => {
      const key = item.trim().toLowerCase();
      const match = map.get(key);
      if (match) {
        list.push({ ...match, category: match.category || cat.category });
      } else {
        let defaultRate = 150;
        if (item.includes('Breakfast')) defaultRate = 120;
        else if (item.includes('Lunch')) defaultRate = 220;
        else if (item.includes('Snacks')) defaultRate = 80;
        else if (item.includes('Dinner')) defaultRate = 220;
        else if (item.includes('Allowance')) defaultRate = 300;

        list.push({
          id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          category: cat.category,
          mealType: item,
          plannedCount: 0,
          actualCount: 0,
          vegCount: 0,
          nonVegCount: 0,
          artistCount: 0,
          crewCount: 0,
          driverCount: 0,
          guestCount: 0,
          ratePerPlate: defaultRate,
          totalCost: 0
        });
      }
    });
  });

  const standardSet = new Set(STANDARD_FOOD_ITEMS.map(s => s.trim().toLowerCase()));
  existingEntries.forEach(f => {
    if (f && f.mealType && !standardSet.has(f.mealType.trim().toLowerCase())) {
      list.push({ ...f });
    }
  });

  return list;
};

export interface StandardGoodsCategory {
  category: string;
  items: string[];
}

export const STANDARD_GOODS_CATEGORIES: StandardGoodsCategory[] = [
  {
    category: 'FURNITURE & TENTS',
    items: [
      'Sofa',
      'Chair',
      'Table',
      'Tent',
      'Carpet',
      'Stand Fan',
      'Portable Ac',
      'Dustbin',
      'Mirror',
      'Umbrella'
    ]
  },
  {
    category: 'KITCHEN & CATERING APPLIANCES',
    items: [
      'Gas',
      'Oven',
      'Mixer',
      'Coffe Machine',
      'Ice Box',
      'Dustbin'
    ]
  }
];

export const STANDARD_PRODUCTION_GOODS = STANDARD_GOODS_CATEGORIES.flatMap(c => c.items);

export const createDefaultGoodsEntries = (existingEntries: DSRGoodsEntry[] = []): DSRGoodsEntry[] => {
  const map = new Map<string, DSRGoodsEntry>();
  existingEntries.forEach(g => {
    if (g && g.itemName) {
      map.set(g.itemName.trim().toLowerCase(), g);
    }
  });

  const list: DSRGoodsEntry[] = STANDARD_PRODUCTION_GOODS.map(item => {
    const key = item.trim().toLowerCase();
    const match = map.get(key);
    if (match) return { ...match };

    return {
      id: `goods_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      itemName: item,
      plannedQty: 0,
      actualQty: 0,
      vendor: '',
      remarks: ''
    };
  });

  const standardSet = new Set(STANDARD_PRODUCTION_GOODS.map(s => s.trim().toLowerCase()));
  existingEntries.forEach(g => {
    if (g && g.itemName && !standardSet.has(g.itemName.trim().toLowerCase())) {
      list.push({ ...g });
    }
  });

  return list;
};

export const DEPARTMENT_OPTIONS = [
  'Direction Call',
  'Camera & DIT Call',
  'Lighting Call',
  'Sound Call',
  'Art Dept Call',
  'Makeup Call',
  'Costume Call',
  'Action & Stunts Call',
  'Catering Call',
  'Transport Call',
  'Production Call',
  'Grip Call',
  'Special FX Call',
  'Custom Department'
];

export const getDepartmentTag = (name: string) => {
  if (!name || !name.trim()) return 'DEPARTMENT CALL TIME';
  const clean = name.trim().toUpperCase();
  if (clean.endsWith('CALL TIME')) return clean;
  if (clean.endsWith('CALL')) return `${clean} TIME`;
  return `${clean} CALL TIME`;
};

export const parseTimeStringToMinutes = (timeStr: string): number | null => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim().toUpperCase();
  if (!trimmed) return null;

  // 1. Check 12-hour format with AM/PM (e.g., "08:00 AM", "8:00 PM", "8:30PM", "8.30 PM", "8 AM", "8PM", "8.00AM")
  const match12 = trimmed.match(/^(\d{1,2})(?:[:.](\d{1,2}))?(?::\d{1,2})?\s*(AM|PM|A\.M\.|P\.M\.|A|P)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const meridian = match12[3].toUpperCase();
    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
    if (meridian.includes('P') && hours !== 12) {
      hours += 12;
    } else if (meridian.includes('A') && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  }

  // 2. Check 24-hour format (e.g., "08:00", "20:00", "08.00", "20.30", "23:59")
  const match24 = trimmed.match(/^(\d{1,2})[:.](\d{1,2})(?::\d{1,2})?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    if (hours >= 0 && hours <= 24 && minutes >= 0 && minutes <= 59) {
      return (hours % 24) * 60 + minutes;
    }
  }

  return null;
};

export const calculateShiftDuration = (callTime: string, packupTime: string, baseShiftHours: number = 12): { workingHours: number; overtimeHours: number } | null => {
  const callMinutes = parseTimeStringToMinutes(callTime);
  const packupMinutes = parseTimeStringToMinutes(packupTime);

  if (callMinutes === null || packupMinutes === null) {
    return null;
  }

  let diffMinutes = packupMinutes - callMinutes;
  // Handle wrap-around / overnight shoots (e.g. Call 06:00 PM to Packup 06:00 AM next day -> 12 hours)
  if (diffMinutes <= 0) {
    diffMinutes += 24 * 60;
  }

  const totalHours = Math.round((diffMinutes / 60) * 100) / 100;
  const cleanWorkingHours = totalHours % 1 === 0 ? totalHours : Math.round(totalHours * 10) / 10;
  const rawOvertime = Math.max(0, cleanWorkingHours - baseShiftHours);
  const cleanOvertime = rawOvertime % 1 === 0 ? rawOvertime : Math.round(rawOvertime * 10) / 10;

  return {
    workingHours: cleanWorkingHours,
    overtimeHours: cleanOvertime
  };
};

export const DEFAULT_DEPARTMENT_CALL_TIMES: DSRDepartmentCallTime[] = [
  { id: 'dept_prod', department: 'Production Call', callTime: '06:00 AM', packupTime: '09:00 PM', notes: 'General Unit Call / Set Operations' },
  { id: 'dept_direction', department: 'Direction & Script Call', callTime: '05:45 AM', packupTime: '09:00 PM', notes: 'Blockings & Director Briefing' },
  { id: 'dept_camera', department: 'Camera & DIT Call', callTime: '05:45 AM', packupTime: '09:15 PM', notes: 'Rigging, Lenses & DIT Check' },
  { id: 'dept_lighting', department: 'Lighting Call', callTime: '05:30 AM', packupTime: '09:30 PM', notes: 'Pre-light & Power Genset' },
  { id: 'dept_art', department: 'Art Dept Call', callTime: '05:00 AM', packupTime: '09:00 PM', notes: 'Set Prep & Props Dressing' },
  { id: 'dept_makeup', department: 'Makeup Call', callTime: '05:00 AM', packupTime: '08:30 PM', notes: 'Hair, Makeup & SFX Prep' },
  { id: 'dept_costume', department: 'Costume Call', callTime: '05:15 AM', packupTime: '08:30 PM', notes: 'Wardrobe Ironing & Dressing' },
  { id: 'dept_sound', department: 'Sound Call', callTime: '05:45 AM', packupTime: '09:00 PM', notes: 'Walkies & Lapel Mic Setup' },
  { id: 'dept_action', department: 'Action & Stunts Call', callTime: '06:00 AM', packupTime: '09:00 PM', notes: 'Safety Harness & Rigging Check' },
  { id: 'dept_catering', department: 'Catering Call', callTime: '04:30 AM', packupTime: '09:30 PM', notes: 'Hot Breakfast Service' },
  { id: 'dept_transport', department: 'Transport Call', callTime: '04:30 AM', packupTime: '10:00 PM', notes: 'Unit Pickup & Fleet Movement' }
];

export const UNIT_PRESET_CATEGORIES: Record<string, string[]> = {
  'Shooting Unit': ['01 - 1st Unit', '02 - 2nd Unit', '03 - 3rd Unit'],
  'Recce Unit': ['Recce Unit 1', 'Recce Unit 2', 'Recce Unit 3'],
  'AV Shoot Unit': ['AV Shoot Unit 1', 'AV Shoot Unit 2', 'AV Shoot Unit 3'],
  'Stock Shoot Unit': ['Stock Shoot Unit 1', 'Stock Shoot Unit 2', 'Stock Shoot Unit 3'],
  'Audition Unit': ['Audition Unit 1', 'Audition Unit 2', 'Audition Unit 3'],
  'Set Construction Unit': ['Set Construction Unit 1', 'Set Construction Unit 2', 'Set Construction Unit 3']
};

export const ALL_UNIT_PRESET_CATEGORIES = [
  'Shooting Unit',
  'Recce Unit',
  'AV Shoot Unit',
  'Stock Shoot Unit',
  'Audition Unit',
  'Set Construction Unit',
  'Custom'
];

export const ALL_FLAT_PRESET_UNITS = [
  '01 - 1st Unit',
  '02 - 2nd Unit',
  '03 - 3rd Unit',
  'Recce Unit 1',
  'Recce Unit 2',
  'Recce Unit 3',
  'AV Shoot Unit 1',
  'AV Shoot Unit 2',
  'AV Shoot Unit 3',
  'Stock Shoot Unit 1',
  'Stock Shoot Unit 2',
  'Stock Shoot Unit 3',
  'Audition Unit 1',
  'Audition Unit 2',
  'Audition Unit 3',
  'Set Construction Unit 1',
  'Set Construction Unit 2',
  'Set Construction Unit 3'
];

export const getCategoryForUnitName = (unitName: string): string => {
  if (!unitName) return 'Shooting Unit';
  const norm = unitName.toLowerCase().trim();
  if (norm.includes('1st') || norm.includes('2nd') || norm.includes('3rd') || norm.startsWith('01') || norm.startsWith('02') || norm.startsWith('03') || norm.includes('shooting unit') || norm === 'main unit') {
    return 'Shooting Unit';
  }
  if (norm.includes('rec') || norm.includes('reece')) {
    return 'Recce Unit';
  }
  if (norm.includes('av shoot') || norm.includes('av unit')) {
    return 'AV Shoot Unit';
  }
  if (norm.includes('stock shoot') || norm.includes('stock unit')) {
    return 'Stock Shoot Unit';
  }
  if (norm.includes('audition')) {
    return 'Audition Unit';
  }
  if (norm.includes('construction')) {
    return 'Set Construction Unit';
  }
  return 'Custom';
};

export const normalizeUnitName = (name: string): string => {
  if (!name) return '01 - 1st unit';
  const clean = name.trim().toLowerCase();
  if (clean.includes('1st') || clean.startsWith('01') || clean === 'shooting unit 1') return '01 - 1st unit';
  if (clean.includes('2nd') || clean.startsWith('02') || clean === 'shooting unit 2') return '02 - 2nd unit';
  if (clean.includes('3rd') || clean.startsWith('03') || clean === 'shooting unit 3') return '03 - 3rd unit';
  
  if (clean.includes('rec') || clean.includes('reece')) {
    if (clean.includes('3')) return 'recee unit 3';
    if (clean.includes('2')) return 'recee unit 2';
    return 'recee unit 1';
  }
  if (clean.includes('av shoot') || clean.includes('av unit')) {
    if (clean.includes('3')) return 'av shoot unit 3';
    if (clean.includes('2')) return 'av shoot unit 2';
    return 'av shoot unit 1';
  }
  if (clean.includes('stock shoot') || clean.includes('stock unit')) {
    if (clean.includes('3')) return 'stock shoot unit 3';
    if (clean.includes('2')) return 'stock shoot unit 2';
    return 'stock shoot unit 1';
  }
  if (clean.includes('audition')) {
    if (clean.includes('3')) return 'audition unit 3';
    if (clean.includes('2')) return 'audition unit 2';
    return 'audition unit 1';
  }
  if (clean.includes('construction')) {
    if (clean.includes('3')) return 'set construction unit 3';
    if (clean.includes('2')) return 'set construction unit 2';
    return 'set construction unit 1';
  }
  return clean;
};

export const getNextDayNumberForUnit = (
  unitName: string,
  dsrList: ProductionDSR[],
  currentEditingId?: string | null
): number => {
  const norm = normalizeUnitName(unitName);
  const unitDsrs = dsrList.filter(d => {
    if (currentEditingId && d.id === currentEditingId) return false;
    return normalizeUnitName(d.unitName || '') === norm;
  });
  return unitDsrs.length + 1;
};

export const getShootingDayLabel = (unitName: string, category?: string): string => {
  const cat = category || getCategoryForUnitName(unitName);
  const norm = (unitName || '').trim().toLowerCase();
  
  if (cat === 'RECEE UNIT' || norm.includes('rec') || norm.includes('reece')) {
    if (norm.includes('3') || unitName.includes('3')) return 'Recee Day Number (Recee Unit 3) *';
    if (norm.includes('2') || unitName.includes('2')) return 'Recee Day Number (Recee Unit 2) *';
    return 'Recee Day Number (Recee Unit 1) *';
  }
  if (cat === 'Av Shoot Unit' || norm.includes('av shoot') || norm.includes('av unit')) {
    if (norm.includes('3') || unitName.includes('3')) return 'AV Shoot Day Number (Av Shoot Unit 3) *';
    if (norm.includes('2') || unitName.includes('2')) return 'AV Shoot Day Number (Av Shoot Unit 2) *';
    return 'AV Shoot Day Number (Av Shoot Unit 1) *';
  }
  if (cat === 'Stock Shoot Unit' || norm.includes('stock shoot') || norm.includes('stock unit')) {
    if (norm.includes('3') || unitName.includes('3')) return 'Stock Shoot Day Number (Stock Shoot Unit 3) *';
    if (norm.includes('2') || unitName.includes('2')) return 'Stock Shoot Day Number (Stock Shoot Unit 2) *';
    return 'Stock Shoot Day Number (Stock Shoot Unit 1) *';
  }
  if (cat === 'Audition Unit' || norm.includes('audition')) {
    if (norm.includes('3') || unitName.includes('3')) return 'Audition Day Number (Audition Unit 3) *';
    if (norm.includes('2') || unitName.includes('2')) return 'Audition Day Number (Audition Unit 2) *';
    return 'Audition Day Number (Audition Unit 1) *';
  }
  if (cat === 'Set Construction Unit' || norm.includes('construction')) {
    if (norm.includes('3') || unitName.includes('3')) return 'Set Construction Day Number (Set Construction Unit 3) *';
    if (norm.includes('2') || unitName.includes('2')) return 'Set Construction Day Number (Set Construction Unit 2) *';
    return 'Set Construction Day Number (Set Construction Unit 1) *';
  }
  if (cat === 'SHOOTING UNIT' || norm.includes('1st') || norm.includes('2nd') || norm.includes('3rd') || norm.startsWith('01') || norm.startsWith('02') || norm.startsWith('03')) {
    if (norm.includes('3rd') || norm.startsWith('03') || norm.endsWith('3')) return 'Shooting Day Number (03 - 3rd Unit) *';
    if (norm.includes('2nd') || norm.startsWith('02') || norm.endsWith('2')) return 'Shooting Day Number (02 - 2nd Unit) *';
    return 'Shooting Day Number (01 - 1st Unit) *';
  }
  if (unitName && unitName !== 'Custom') return `${unitName} Day Number *`;
  return 'Shooting Day Number *';
};

export const getDateLabel = (unitName: string, category?: string): string => {
  const cat = category || getCategoryForUnitName(unitName);
  const norm = (unitName || '').trim().toLowerCase();
  
  if (cat === 'RECEE UNIT' || norm.includes('rec') || norm.includes('reece')) {
    return 'Recee Date *';
  }
  if (cat === 'Av Shoot Unit' || norm.includes('av shoot') || norm.includes('av unit')) {
    return 'AV Shoot Date *';
  }
  if (cat === 'Stock Shoot Unit' || norm.includes('stock shoot') || norm.includes('stock unit')) {
    return 'Stock Shoot Date *';
  }
  if (cat === 'Audition Unit' || norm.includes('audition')) {
    return 'Audition Date *';
  }
  if (cat === 'Set Construction Unit' || norm.includes('construction')) {
    return 'Set Construction Date *';
  }
  if (cat === 'SHOOTING UNIT' || norm.includes('1st') || norm.includes('2nd') || norm.includes('3rd') || norm.startsWith('01') || norm.startsWith('02') || norm.startsWith('03')) {
    return 'Shooting Date *';
  }
  if (unitName && unitName !== 'Custom') return `${unitName} Date *`;
  return 'Date *';
};

function cleanConstructionUnitNum(norm: string): string {
  if (norm.includes('3')) return '3';
  if (norm.includes('2')) return '2';
  return '1';
}

export const formatDSRDayCode = (dayNum: number, unitName: string): string => {
  const numStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
  if (!unitName || unitName === '01 - 1st Unit' || unitName === '1st Unit') {
    return `Day ${numStr} (1st Unit)`;
  }
  return `Day ${numStr} (${unitName})`;
};

interface ProductionDSRViewProps {
  projects?: Project[];
  selectedProjectId?: string;
  currentRole?: string;
  companyName?: string;
  activeSubTab?: string;
  onNavigateSubTab?: (subTab: string) => void;
}

const PRODUCTION_SUB_TABS = [
  { id: 'production-overview', name: 'Production Overview', icon: BarChart3 },
  { id: 'schedule', name: 'Schedule', icon: Calendar },
  { id: 'production-dsr', name: 'Production DSR', icon: Film },
  { id: 'units', name: 'Units', icon: Layers },
  { id: 'crew-attendance', name: 'Crew Attendance', icon: Users },
  { id: 'artist-attendance', name: 'Artist Attendance', icon: UserCheck },
  { id: 'equipment-usage', name: 'Equipment Usage', icon: Video },
  { id: 'transport-usage', name: 'Transport Usage', icon: Truck },
  { id: 'genset-fuel', name: 'Genset & Fuel', icon: Fuel },
  { id: 'vanity', name: 'Vanity', icon: Sparkles },
  { id: 'food-count', name: 'Food Count', icon: Utensils },
  { id: 'call-sheet', name: 'Call Sheet', icon: FileText },
  { id: 'daily-requirements', name: 'Daily Requirements', icon: Package },
  { id: 'accommodations', name: 'Accommodations', icon: Building2 },
  { id: 'issue-tracker', name: 'Issue Tracker', icon: AlertTriangle }
];

export default function ProductionDSRView({
  projects = [],
  selectedProjectId = '',
  currentRole = 'Producer',
  companyName = 'Follow Focus Films',
  activeSubTab: externalSubTab,
  onNavigateSubTab
}: ProductionDSRViewProps) {
  const isTabValid = (tab?: string) => Boolean(tab && PRODUCTION_SUB_TABS.some(t => t.id === tab));

  const [internalSubTab, setInternalSubTab] = useState<string>(() => {
    if (isTabValid(externalSubTab)) return externalSubTab!;
    return 'production-dsr';
  });

  useEffect(() => {
    if (isTabValid(externalSubTab)) {
      setInternalSubTab(externalSubTab!);
    }
  }, [externalSubTab]);

  const currentSubTab = internalSubTab;

  const handleProductionSubTabChange = (tabId: string) => {
    setInternalSubTab(tabId);
    if (onNavigateSubTab) {
      onNavigateSubTab(tabId);
    }
  };
  // Real-time Firestore DSRs
  const [dsrList, setDsrList] = useState<ProductionDSR[]>([]);

  useEffect(() => {
    const unsub = subscribeDSRs((data) => {
      if (Array.isArray(data)) {
        setDsrList(data);
      } else {
        setDsrList([]);
      }
    });
    return () => unsub();
  }, []);

  const activeProject = useMemo<Project>(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0] || ({
      id: '',
      name: '',
      companyName: companyName,
      description: '',
      totalBudget: 0,
      spent: 0,
      status: 'Production',
      startDate: '',
      endDate: '',
      currency: 'INR'
    } as Project);
  }, [projects, selectedProjectId, companyName]);

  const projectDsrs = useMemo(() => {
    const projId = selectedProjectId || activeProject.id;
    const filtered = dsrList.filter(d => d.projectId === projId);
    // Sort by day number
    return filtered.sort((a, b) => a.dayNumber - b.dayNumber);
  }, [dsrList, selectedProjectId, activeProject]);

  // Filters & Toolbar
  const [search, setSearch] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('All');
  const [unitFilter, setUnitFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'column' | 'card' | 'calendar'>('column');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'crew' | 'equipment' | 'goods' | 'transport' | 'genset' | 'food' | 'notes'>('info');
  const [editingDsrId, setEditingDsrId] = useState<string | null>(null);

  // Quick Popup Preview State
  const [previewDsr, setPreviewDsr] = useState<ProductionDSR | null>(null);
  const [previewSection, setPreviewSection] = useState<'all' | 'timing' | 'crew' | 'equipment' | 'goods' | 'transport' | 'genset' | 'food' | 'notes'>('all');

  // WhatsApp / Email Dispatch Modal State
  const [isDispatcherOpen, setIsDispatcherOpen] = useState(false);
  const [dispatchDsr, setDispatchDsr] = useState<ProductionDSR | null>(null);

  // Quick DSR Expense Booking Modal State
  const [bookingDsr, setBookingDsr] = useState<ProductionDSR | null>(null);
  const [bookingPreset, setBookingPreset] = useState<'fuel' | 'catering' | 'transport' | 'crew_batta' | 'all'>('fuel');
  const [bookingPayee, setBookingPayee] = useState('');
  const [bookingAmount, setBookingAmount] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingPaymentMode, setBookingPaymentMode] = useState('Cash');
  const [bookingSuccessToast, setBookingSuccessToast] = useState<string | null>(null);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

  const handleOpenBookingModal = (dsr: ProductionDSR, preset: 'fuel' | 'catering' | 'transport' | 'crew_batta' | 'all' = 'fuel') => {
    setBookingDsr(dsr);
    setBookingPreset(preset);

    if (preset === 'fuel') {
      const liters = Number(dsr.actualFuelTotal) || Number(dsr.calculatedFuelTotal) || 120;
      const rate = 95;
      const amt = liters * rate;
      setBookingPayee(dsr.fuelVendor || 'Location Fuel Supplier / Petrol Pump');
      setBookingAmount(String(amt));
      setBookingNotes(`DSR ${dsr.dayCode} (${dsr.shootingDate}) - Generator & Fleet Diesel (${liters} Liters @ ₹${rate}/L)`);
      setBookingPaymentMode('Cash');
    } else if (preset === 'catering') {
      const count = (Number(dsr.breakfastCount) || 0) + (Number(dsr.lunchCount) || 0) + (Number(dsr.snacksCount) || 0) + (Number(dsr.dinnerCount) || 0) || 180;
      const rate = 120;
      const amt = count * rate;
      setBookingPayee(dsr.catererName || 'Unit Catering Vendor');
      setBookingAmount(String(amt));
      setBookingNotes(`DSR ${dsr.dayCode} (${dsr.shootingDate}) - Unit Meals & Catering (${count} Total Plates)`);
      setBookingPaymentMode('Bank Transfer');
    } else if (preset === 'transport') {
      const vCount = dsr.transportEntries?.length || 8;
      const amt = vCount * 2500;
      setBookingPayee(dsr.transporterName || 'Fleet Transport Operator');
      setBookingAmount(String(amt));
      setBookingNotes(`DSR ${dsr.dayCode} (${dsr.shootingDate}) - Location Vehicles & Transport Fleet (${vCount} Vehicles)`);
      setBookingPaymentMode('Bank Transfer');
    } else if (preset === 'crew_batta') {
      const cCount = dsr.crewEntries?.length || 25;
      const amt = cCount * 800;
      setBookingPayee('Junior Artists & Daily Crew');
      setBookingAmount(String(amt));
      setBookingNotes(`DSR ${dsr.dayCode} (${dsr.shootingDate}) - Daily Crew Allowances & Junior Artist Batta (${cCount} pax)`);
      setBookingPaymentMode('Cash');
    } else {
      const estTotal = 45000;
      setBookingPayee('Production Executive / Line Producer');
      setBookingAmount(String(estTotal));
      setBookingNotes(`DSR ${dsr.dayCode} (${dsr.shootingDate}) - Consolidated Daily Shoot Operating Disbursals (${dsr.unitName || 'Main Unit'})`);
      setBookingPaymentMode('Production Cash');
    }
  };

  const handleConfirmBookExpense = async () => {
    if (!bookingDsr) return;
    const projId = selectedProjectId || activeProject?.id || bookingDsr.projectId || 'proj_default';
    setIsBookingSubmitting(true);
    try {
      const amt = parseFloat(bookingAmount) || 0;
      const voucherNum = `EXP-DSR-${Date.now().toString().slice(-6)}`;
      const newExpense: Partial<Expense> = {
        id: `exp_dsr_${Date.now()}`,
        projectId: projId,
        voucherNumber: voucherNum,
        bookingNo: voucherNum,
        date: bookingDsr.shootingDate || new Date().toISOString().substring(0, 10),
        payee: bookingPayee || 'DSR Vendor',
        amount: amt,
        baseAmount: amt,
        gstRate: 0,
        gstAmount: 0,
        tdsSection: 'NONE',
        tdsRate: 0,
        tdsAmount: 0,
        netPayable: amt,
        paymentMode: bookingPaymentMode as any,
        paymentType: bookingPreset === 'crew_batta' ? 'Wages' : 'Purchase',
        status: 'Approved',
        approvalStatus: 'Approved',
        sourceModule: 'DSR',
        dsrId: bookingDsr.id,
        dsrDay: bookingDsr.dayCode,
        categoryName: bookingPreset === 'fuel' ? 'Transport & Fuel' : bookingPreset === 'catering' ? 'Catering & Food' : bookingPreset === 'transport' ? 'Conveyance & Travel' : bookingPreset === 'crew_batta' ? 'Junior Artists & Crew' : 'Production Operations',
        notes: bookingNotes,
        title: `${bookingDsr.dayCode} - ${bookingNotes.split('-')[1]?.trim() || 'Shoot Expense'}`,
        createdAt: new Date().toISOString()
      };

      await saveExpense(newExpense as Expense);
      addDbLog({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'EXPENSE_BOOKED_FROM_DSR',
        details: `Booked expense ₹${amt.toLocaleString()} for ${bookingDsr.dayCode} (${bookingPreset})`,
        user: currentRole
      });
      
      setBookingSuccessToast(`Successfully booked ₹${amt.toLocaleString('en-IN')} expense voucher for ${bookingDsr.dayCode}!`);
      setBookingDsr(null);
      setTimeout(() => setBookingSuccessToast(null), 4500);
    } catch (err) {
      console.error('Failed to book DSR expense:', err);
      alert('Error booking expense. Please try again.');
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  const handleOpenPreview = (dsr: ProductionDSR, section: 'all' | 'timing' | 'crew' | 'equipment' | 'goods' | 'transport' | 'genset' | 'food' | 'notes' = 'all') => {
    setPreviewDsr(dsr);
    setPreviewSection(section);
  };

  // Form State
  const [formDayNumber, setFormDayNumber] = useState<number>(1);
  const [formScheduleName, setFormScheduleName] = useState<string>('Schedule 01 — Kolkata');
  const [formUnitCategory, setFormUnitCategory] = useState<string>('Shooting Unit');
  const [formUnitName, setFormUnitName] = useState<string>('01 - 1st Unit');
  const [isCustomSubUnit, setIsCustomSubUnit] = useState<boolean>(false);
  const [formShootingDate, setFormShootingDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [formLocationName, setFormLocationName] = useState<string>('');
  const [formLocationType, setFormLocationType] = useState<any>('Studio');
  const [formCallTime, setFormCallTime] = useState<string>('06:00 AM');
  const [formPackupTime, setFormPackupTime] = useState<string>('09:00 PM');
  const [formWorkingHours, setFormWorkingHours] = useState<number>(12);
  const [formOvertime, setFormOvertime] = useState<number>(0);
  const [formUsableFootage, setFormUsableFootage] = useState<number>(0);

  // Duplicate Conflict Check: Multiple different unit presets are allowed on the same date,
  // but the SAME unit preset / name cannot have duplicate DSRs on the same date.
  const unitsTakenOnSelectedDate = useMemo(() => {
    if (!formShootingDate) return new Set<string>();
    const set = new Set<string>();
    projectDsrs.forEach(d => {
      if (d.shootingDate === formShootingDate && d.id !== editingDsrId) {
        if (d.unitName) set.add(d.unitName.trim().toLowerCase());
      }
    });
    return set;
  }, [projectDsrs, formShootingDate, editingDsrId]);

  const isUnitTakenOnDate = useMemo(() => {
    if (!formUnitName || !formShootingDate) return false;
    return unitsTakenOnSelectedDate.has(formUnitName.trim().toLowerCase());
  }, [unitsTakenOnSelectedDate, formUnitName, formShootingDate]);

  // Determine if the currently selected unit is a Shooting Unit (1st Unit, 2nd Unit, 3rd Unit)
  const isShootingUnitSelected = useMemo(() => {
    if (formUnitCategory === 'Shooting Unit' || formUnitCategory === 'SHOOTING UNIT') return true;
    if (formUnitCategory === 'Custom') {
      return getCategoryForUnitName(formUnitName) === 'Shooting Unit';
    }
    return false;
  }, [formUnitCategory, formUnitName]);
  
  // Unit Category Selection Handler (Presets)
  const handleCategoryChange = (newCategory: string) => {
    setFormUnitCategory(newCategory);
    if (newCategory.toLowerCase() !== 'shooting unit' && newCategory !== 'Custom') {
      setFormUsableFootage(0);
    }
    if (newCategory === 'Custom') {
      setIsCustomSubUnit(true);
    } else {
      setIsCustomSubUnit(false);
      const subUnits = UNIT_PRESET_CATEGORIES[newCategory] || [];
      const availableSub = subUnits.find(u => !unitsTakenOnSelectedDate.has(u.trim().toLowerCase())) || subUnits[0] || '01 - 1st Unit';
      handleUnitChange(availableSub);
    }
  };

  // Unit Selection & Day Count Handler
  const handleUnitChange = (newUnit: string) => {
    setFormUnitName(newUnit);
    const cat = getCategoryForUnitName(newUnit);
    if (cat !== 'Shooting Unit' && formUnitCategory.toLowerCase() !== 'shooting unit') {
      setFormUsableFootage(0);
    }
    if (!editingDsrId) {
      const nextDay = getNextDayNumberForUnit(newUnit, projectDsrs);
      setFormDayNumber(nextDay);
    }
  };

  const handleCustomUnitNameChange = (newUnit: string) => {
    setFormUnitName(newUnit);
    if (!editingDsrId && newUnit.trim().length >= 2) {
      const nextDay = getNextDayNumberForUnit(newUnit, projectDsrs);
      setFormDayNumber(nextDay);
    }
  };

  // Department / Team Call Times State
  const [formDepartmentCallTimes, setFormDepartmentCallTimes] = useState<DSRDepartmentCallTime[]>([]);

  // Main Unit Automatic Calculation Handlers
  const handleMainCallTimeChange = (newCall: string) => {
    setFormCallTime(newCall);
    const calculated = calculateShiftDuration(newCall, formPackupTime);
    if (calculated) {
      setFormWorkingHours(calculated.workingHours);
    }
  };

  const handleMainPackupTimeChange = (newPackup: string) => {
    setFormPackupTime(newPackup);
    const calculated = calculateShiftDuration(formCallTime, newPackup);
    if (calculated) {
      setFormWorkingHours(calculated.workingHours);
    }
  };

  const handleMainWorkingHoursChange = (newHours: number) => {
    setFormWorkingHours(newHours);
  };

  const handleSyncAllDepartmentCallTimes = (targetCallTime?: string) => {
    const val = targetCallTime || formCallTime || '06:00 AM';
    setFormDepartmentCallTimes(prev => prev.map(d => {
      const packup = d.packupTime || formPackupTime || '09:00 PM';
      const calculated = calculateShiftDuration(val, packup);
      return {
        ...d,
        callTime: val,
        workingHours: calculated ? calculated.workingHours : (d.workingHours || 12)
      };
    }));
  };

  const handleApplyStaggeredOffsets = () => {
    setFormDepartmentCallTimes(prev => prev.map(d => {
      const name = d.department.toLowerCase();
      let call = formCallTime || '06:00 AM';
      let notes = d.notes;
      if (name.includes('catering')) {
        call = '04:30 AM';
        notes = 'Hot Breakfast Setup & Beverage Station';
      } else if (name.includes('transport')) {
        call = '04:30 AM';
        notes = 'Fleet Pickup & Movement';
      } else if (name.includes('art')) {
        call = '05:00 AM';
        notes = 'Set Prep & Props Dressing';
      } else if (name.includes('makeup') || name.includes('hair')) {
        call = '05:00 AM';
        notes = 'Artist Hair, Makeup & SFX';
      } else if (name.includes('costume')) {
        call = '05:15 AM';
        notes = 'Wardrobe Ironing & Dressing';
      } else if (name.includes('lighting') || name.includes('electric')) {
        call = '05:30 AM';
        notes = 'Pre-light & Power Genset';
      } else if (name.includes('camera') || name.includes('dit')) {
        call = '05:45 AM';
        notes = 'Lens Calibration & DIT Check';
      } else if (name.includes('direction') || name.includes('script')) {
        call = '05:45 AM';
        notes = 'Blockings & Director Briefing';
      } else if (name.includes('sound')) {
        call = '05:45 AM';
        notes = 'Walkies & Sound Rigging';
      } else if (name.includes('production')) {
        call = formCallTime || '06:00 AM';
        notes = 'General Unit Call / Set Operations';
      }
      const packup = formPackupTime || '09:00 PM';
      const calculated = calculateShiftDuration(call, packup);
      return {
        ...d,
        callTime: call,
        packupTime: packup,
        workingHours: calculated ? calculated.workingHours : (d.workingHours || 12),
        notes
      };
    }));
  };

  const handleAddDepartmentCall = () => {
    const existingNames = new Set(formDepartmentCallTimes.map(d => d.department));
    const available = DEPARTMENT_OPTIONS.find(d => !existingNames.has(d) && d !== 'Custom Department') || 'Camera & DIT Call';
    const newId = `dept_${Date.now()}`;
    const callTime = formCallTime || '06:00 AM';
    const packupTime = formPackupTime || '09:00 PM';
    const calculated = calculateShiftDuration(callTime, packupTime);
    setFormDepartmentCallTimes(prev => [
      ...prev,
      {
        id: newId,
        department: available,
        callTime,
        packupTime,
        workingHours: calculated ? calculated.workingHours : (formWorkingHours || 12),
        overtimeHours: 0,
        notes: ''
      }
    ]);
  };

  const handleAddCustomDepartmentCallTime = handleAddDepartmentCall;

  const handleUpdateDepartmentCallTime = (id: string, updates: Partial<DSRDepartmentCallTime>) => {
    setFormDepartmentCallTimes(prev => prev.map(d => {
      if (d.id !== id) return d;
      const merged = { ...d, ...updates };

      if (updates.callTime !== undefined || updates.packupTime !== undefined) {
        const effectiveCall = updates.callTime !== undefined ? updates.callTime : d.callTime;
        const effectivePackup = updates.packupTime !== undefined ? updates.packupTime : (d.packupTime || formPackupTime || '09:00 PM');
        const calculated = calculateShiftDuration(effectiveCall, effectivePackup);
        if (calculated) {
          merged.workingHours = calculated.workingHours;
        }
      }

      return merged;
    }));
  };

  const handleDeleteDepartmentCallTime = (id: string) => {
    setFormDepartmentCallTimes(prev => prev.filter(d => d.id !== id));
  };
  
  // Available units derivation
  const availableUnits = useMemo(() => {
    const set = new Set<string>();
    projectDsrs.forEach(d => {
      if (d.unitName) set.add(d.unitName);
    });
    return Array.from(set);
  }, [projectDsrs]);

  // Sub-lists
  const [formCrew, setFormCrew] = useState<DSRCrewEntry[]>([]);
  const [formEquipment, setFormEquipment] = useState<DSREquipmentEntry[]>([]);
  const [formGoods, setFormGoods] = useState<DSRGoodsEntry[]>([]);
  const [formTransport, setFormTransport] = useState<DSRTransportEntry[]>([]);
  const [formGensets, setFormGensets] = useState<DSRGensetEntry[]>([]);
  const [formVanities, setFormVanities] = useState<DSRVanityEntry[]>([]);
  const [formFood, setFormFood] = useState<DSRFoodEntry[]>([]);

  const [formNotes, setFormNotes] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'Draft' | 'Submitted' | 'Approved' | 'Locked'>('Draft');

  // Filtered DSRs
  const filteredDsrs = useMemo(() => {
    return projectDsrs.filter(d => {
      const q = search.toLowerCase();
      const matchesSearch = !search || 
        d.dayCode.toLowerCase().includes(q) ||
        (d.unitName && d.unitName.toLowerCase().includes(q)) ||
        (d.primaryLocationName && d.primaryLocationName.toLowerCase().includes(q)) ||
        d.shootingDate.includes(q) ||
        (d.scheduleName && d.scheduleName.toLowerCase().includes(q));
      
      const matchesSchedule = scheduleFilter === 'All' || d.scheduleName === scheduleFilter;
      const matchesUnit = unitFilter === 'All' || d.unitName === unitFilter;
      const matchesStatus = statusFilter === 'All' || d.status === statusFilter;

      return matchesSearch && matchesSchedule && matchesUnit && matchesStatus;
    });
  }, [projectDsrs, search, scheduleFilter, unitFilter, statusFilter]);

  // Summary Metrics - Dynamically calculated from project configuration and actual DSR records
  const totalShootDays = useMemo(() => {
    // 1. Check if project explicitly defines expected shoot days in its schedule / budget configuration
    if (activeProject.expectedShootDays && activeProject.expectedShootDays > 0) {
      return activeProject.expectedShootDays;
    }
    // 2. Check if project has a schedule definition with shootingDays
    if ((activeProject as any).schedule?.shootingDays && (activeProject as any).schedule.shootingDays > 0) {
      return (activeProject as any).schedule.shootingDays;
    }
    // 3. Otherwise derive dynamically from unique logged shooting dates or total project DSR count (minimum 1 if DSRs exist)
    const uniqueDates = new Set(projectDsrs.map(d => d.shootingDate).filter(Boolean));
    if (uniqueDates.size > 0) {
      return Math.max(uniqueDates.size, projectDsrs.length);
    }
    return projectDsrs.length;
  }, [activeProject, projectDsrs]);

  const completedDaysCount = useMemo(() => {
    return projectDsrs.filter(d => d.status === 'Approved' || d.status === 'Locked').length;
  }, [projectDsrs]);

  const upcomingDaysCount = useMemo(() => {
    const remaining = totalShootDays - completedDaysCount;
    return Math.max(0, remaining);
  }, [totalShootDays, completedDaysCount]);

  const totalUsableMinutesSum = useMemo(() => {
    return projectDsrs.reduce((acc, d) => acc + (d.usableFootageMinutes || 0), 0);
  }, [projectDsrs]);

  const formattedFootageSum = useMemo(() => {
    const hrs = Math.floor(totalUsableMinutesSum / 60);
    const mins = totalUsableMinutesSum % 60;
    return `${hrs} Hr ${mins} Min`;
  }, [totalUsableMinutesSum]);

  const totalCrewDaysSum = useMemo(() => {
    return projectDsrs.reduce((acc, d) => acc + (d.totalPresentCrew || 0), 0);
  }, [projectDsrs]);

  const totalFuelUsedSum = useMemo(() => {
    return projectDsrs.reduce((acc, d) => acc + (d.actualFuelTotal || d.calculatedFuelTotal || 0), 0);
  }, [projectDsrs]);

  const totalFoodCountSum = useMemo(() => {
    return projectDsrs.reduce((acc, d) => acc + (d.totalFoodCount || (d.breakfastCount + d.lunchCount + d.snacksCount + d.dinnerCount) || 0), 0);
  }, [projectDsrs]);

  // Total Present Crew Calculation in Form
  const formTotalPresentCrew = useMemo(() => {
    return formCrew.reduce((acc, c) => acc + (Number(c.presentCount) || 0), 0);
  }, [formCrew]);

  // Crew Form Helper State & Calculations
  const [crewSearch, setCrewSearch] = useState('');
  const [showAllCrewDepts, setShowAllCrewDepts] = useState<boolean>(false);
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({});

  // Resolve current effective unit category across all DSR sections
  const currentEffectiveCrewPresetCategory = useMemo(() => {
    if (formUnitCategory && formUnitCategory !== 'Custom') return formUnitCategory;
    return getCategoryForUnitName(formUnitName);
  }, [formUnitCategory, formUnitName]);

  const currentEffectivePresetCategory = currentEffectiveCrewPresetCategory;

  const presetCrewConfig = useMemo(() => {
    return UNIT_PRESET_CREW_MAPPING[currentEffectivePresetCategory] || UNIT_PRESET_CREW_MAPPING['Shooting Unit'] || UNIT_PRESET_CREW_MAPPING['Custom'];
  }, [currentEffectivePresetCategory]);

  const presetEquipmentConfig = useMemo(() => {
    return UNIT_PRESET_EQUIPMENT_MAPPING[currentEffectivePresetCategory] || UNIT_PRESET_EQUIPMENT_MAPPING['Shooting Unit'] || UNIT_PRESET_EQUIPMENT_MAPPING['Custom'];
  }, [currentEffectivePresetCategory]);

  const presetGoodsConfig = useMemo(() => {
    return UNIT_PRESET_GOODS_MAPPING[currentEffectivePresetCategory] || UNIT_PRESET_GOODS_MAPPING['Shooting Unit'] || UNIT_PRESET_GOODS_MAPPING['Custom'];
  }, [currentEffectivePresetCategory]);

  const presetTransportConfig = useMemo(() => {
    return UNIT_PRESET_TRANSPORT_MAPPING[currentEffectivePresetCategory] || UNIT_PRESET_TRANSPORT_MAPPING['Shooting Unit'] || UNIT_PRESET_TRANSPORT_MAPPING['Custom'];
  }, [currentEffectivePresetCategory]);

  const presetGensetVanityConfig = useMemo(() => {
    return UNIT_PRESET_GENSET_VANITY_MAPPING[currentEffectivePresetCategory] || UNIT_PRESET_GENSET_VANITY_MAPPING['Shooting Unit'] || UNIT_PRESET_GENSET_VANITY_MAPPING['Custom'];
  }, [currentEffectivePresetCategory]);

  const presetFoodConfig = useMemo(() => {
    return UNIT_PRESET_FOOD_MAPPING[currentEffectivePresetCategory] || UNIT_PRESET_FOOD_MAPPING['Shooting Unit'] || UNIT_PRESET_FOOD_MAPPING['Custom'];
  }, [currentEffectivePresetCategory]);

  // Fast map lookup for presentCount per department + designation
  const crewLookupMap = useMemo(() => {
    const map = new Map<string, number>();
    formCrew.forEach(c => {
      const key = `${c.department.trim().toLowerCase()}:::${c.designation.trim().toLowerCase()}`;
      map.set(key, Number(c.presentCount) || 0);
    });
    return map;
  }, [formCrew]);

  // Standard keys set for filtering custom unlisted crew
  const standardCrewKeysSet = useMemo(() => {
    const set = new Set<string>();
    STANDARD_CREW_DEPARTMENTS.forEach(dept => {
      dept.designations.forEach(desig => {
        set.add(`${dept.department.trim().toLowerCase()}:::${desig.trim().toLowerCase()}`);
      });
    });
    return set;
  }, []);

  const customCrewList = useMemo(() => {
    return formCrew.filter(c => {
      const key = `${c.department.trim().toLowerCase()}:::${c.designation.trim().toLowerCase()}`;
      return !standardCrewKeysSet.has(key);
    });
  }, [formCrew, standardCrewKeysSet]);

  const handleCrewHeadChange = (department: string, designation: string, value: number) => {
    const val = Math.max(0, value);
    setFormCrew(prev => {
      const kDept = department.trim().toLowerCase();
      const kDesig = designation.trim().toLowerCase();
      const idx = prev.findIndex(c => 
        c.department.trim().toLowerCase() === kDept && 
        c.designation.trim().toLowerCase() === kDesig
      );

      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          presentCount: val,
          plannedCount: copy[idx].plannedCount || val,
          absentCount: Math.max(0, (copy[idx].plannedCount || val) - val)
        };
        return copy;
      } else {
        if (val === 0) return prev;
        return [
          ...prev,
          {
            id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            department,
            designation,
            plannedCount: val,
            presentCount: val,
            absentCount: 0,
            extraCount: 0
          }
        ];
      }
    });
  };

  const handleAddCustomCrewRow = () => {
    setFormCrew(prev => [
      ...prev,
      {
        id: `c_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        department: 'Additional Service',
        designation: 'Custom Head / Specialist',
        plannedCount: 1,
        presentCount: 1,
        absentCount: 0,
        extraCount: 0
      }
    ]);
  };

  // Transport Form Helper State & Calculations
  const [transportSearch, setTransportSearch] = useState('');
  const [showAllTransport, setShowAllTransport] = useState<boolean>(false);
  const [collapsedTransportCategories, setCollapsedTransportCategories] = useState<Record<string, boolean>>({});
  const [expandedTransportCards, setExpandedTransportCards] = useState<Record<string, boolean>>({});

  // Fast map lookup for transport entry per category + vehicleType
  const transportLookupMap = useMemo(() => {
    const map = new Map<string, DSRTransportEntry>();
    formTransport.forEach(t => {
      const cat = (t.category || '').trim().toLowerCase();
      const veh = (t.vehicleType || '').trim().toLowerCase();
      const key = `${cat}:::${veh}`;
      map.set(key, t);
    });
    return map;
  }, [formTransport]);

  // Standard keys set for filtering custom unlisted vehicles
  const standardTransportKeysSet = useMemo(() => {
    const set = new Set<string>();
    STANDARD_TRANSPORT_CATEGORIES.forEach(cat => {
      cat.vehicles.forEach(veh => {
        set.add(`${cat.category.trim().toLowerCase()}:::${veh.trim().toLowerCase()}`);
      });
    });
    return set;
  }, []);

  const customTransportList = useMemo(() => {
    return formTransport.filter(t => {
      const key = `${(t.category || '').trim().toLowerCase()}:::${(t.vehicleType || '').trim().toLowerCase()}`;
      return !standardTransportKeysSet.has(key);
    });
  }, [formTransport, standardTransportKeysSet]);

  const handleTransportQtyChange = (category: string, vehicleType: string, value: number) => {
    const val = Math.max(0, value);
    setFormTransport(prev => {
      const kCat = category.trim().toLowerCase();
      const kVeh = vehicleType.trim().toLowerCase();
      const idx = prev.findIndex(t => 
        (t.category || '').trim().toLowerCase() === kCat && 
        (t.vehicleType || '').trim().toLowerCase() === kVeh
      );

      if (idx >= 0) {
        const copy = [...prev];
        const existing = copy[idx];
        if (val === 0 && !existing.vehicleNumber && !existing.vendor && !existing.totalKm && !existing.rate) {
          return prev.filter((_, i) => i !== idx);
        }
        copy[idx] = {
          ...existing,
          actualQty: val,
          plannedQty: existing.plannedQty || val,
          totalCost: (val * (existing.rate || 0)) + (existing.toll || 0) + (existing.parking || 0)
        };
        return copy;
      } else {
        if (val === 0) return prev;
        return [
          ...prev,
          {
            id: `tr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            category,
            vehicleType,
            actualQty: val,
            plannedQty: val,
            trips: 1,
            openingKm: 0,
            closingKm: 0,
            totalKm: 0,
            rateType: 'Per Day',
            rate: 0,
            toll: 0,
            parking: 0,
            extraCharges: 0,
            totalCost: 0
          }
        ];
      }
    });
  };

  const handleUpdateTransportDetails = (id: string, updates: Partial<DSRTransportEntry>) => {
    setFormTransport(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates };
      const qty = updated.actualQty || 0;
      const rate = updated.rate || 0;
      const toll = updated.toll || 0;
      const parking = updated.parking || 0;
      updated.totalCost = (qty * rate) + toll + parking;
      return updated;
    }));
  };

  const handleAddCustomTransportRow = () => {
    setFormTransport(prev => [
      ...prev,
      {
        id: `tr_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        category: 'Others',
        vehicleType: 'Custom Vehicle',
        actualQty: 1,
        plannedQty: 1,
        trips: 1,
        openingKm: 0,
        closingKm: 0,
        totalKm: 0,
        rateType: 'Per Day',
        rate: 0,
        toll: 0,
        parking: 0,
        extraCharges: 0,
        totalCost: 0
      }
    ]);
  };

  // Equipment Form Helper State & Calculations
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [showAllEquipment, setShowAllEquipment] = useState<boolean>(false);
  const [collapsedEquipmentCategories, setCollapsedEquipmentCategories] = useState<Record<string, boolean>>({});
  const [expandedEquipmentCards, setExpandedEquipmentCards] = useState<Record<string, boolean>>({});

  // Fast map lookup for equipment entry per category + name
  const equipmentLookupMap = useMemo(() => {
    const map = new Map<string, DSREquipmentEntry>();
    formEquipment.forEach(eq => {
      const cat = (eq.category || '').trim().toLowerCase();
      const nm = (eq.name || '').trim().toLowerCase();
      const key = `${cat}:::${nm}`;
      map.set(key, eq);
    });
    return map;
  }, [formEquipment]);

  // Standard keys set for filtering custom unlisted equipment
  const standardEquipmentKeysSet = useMemo(() => {
    const set = new Set<string>();
    STANDARD_EQUIPMENT_CATEGORIES.forEach(cat => {
      cat.items.forEach(item => {
        set.add(`${cat.category.trim().toLowerCase()}:::${item.trim().toLowerCase()}`);
      });
    });
    return set;
  }, []);

  const customEquipmentList = useMemo(() => {
    return formEquipment.filter(eq => {
      const key = `${(eq.category || '').trim().toLowerCase()}:::${(eq.name || '').trim().toLowerCase()}`;
      return !standardEquipmentKeysSet.has(key);
    });
  }, [formEquipment, standardEquipmentKeysSet]);

  const handleEquipmentQtyChange = (category: string, name: string, value: number) => {
    const val = Math.max(0, value);
    setFormEquipment(prev => {
      const kCat = category.trim().toLowerCase();
      const kName = name.trim().toLowerCase();
      const idx = prev.findIndex(eq => 
        (eq.category || '').trim().toLowerCase() === kCat && 
        (eq.name || '').trim().toLowerCase() === kName
      );

      if (idx >= 0) {
        const copy = [...prev];
        const existing = copy[idx];
        if (val === 0 && !existing.vendor && !existing.remarks) {
          return prev.filter((_, i) => i !== idx);
        }
        copy[idx] = {
          ...existing,
          actualQty: val,
          plannedQty: existing.plannedQty || val
        };
        return copy;
      } else {
        if (val === 0) return prev;
        return [
          ...prev,
          {
            id: `eq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            category,
            name,
            actualQty: val,
            plannedQty: val,
            unit: 'Unit'
          }
        ];
      }
    });
  };

  const handleAddCustomEquipmentRow = () => {
    setFormEquipment(prev => [
      ...prev,
      {
        id: `eq_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        category: 'Others Equipment',
        name: 'Custom Gear / Item',
        plannedQty: 1,
        actualQty: 1,
        unit: 'Unit'
      }
    ]);
  };

  // Production Goods Helper State & Calculations
  const [goodsSearch, setGoodsSearch] = useState('');
  const [showAllGoods, setShowAllGoods] = useState<boolean>(false);
  const [collapsedGoodsCategories, setCollapsedGoodsCategories] = useState<Record<string, boolean>>({});
  const [expandedGoodsCards, setExpandedGoodsCards] = useState<Record<string, boolean>>({});

  // Fast map lookup for goods entry per category + name
  const goodsLookupMap = useMemo(() => {
    const map = new Map<string, DSRGoodsEntry>();
    formGoods.forEach(g => {
      const cat = (g.category || '').trim().toLowerCase();
      const nm = (g.itemName || '').trim().toLowerCase();
      const key = `${cat}:::${nm}`;
      map.set(key, g);
      map.set(nm, g);
    });
    return map;
  }, [formGoods]);

  // Standard keys set for filtering custom unlisted goods
  const standardGoodsKeysSet = useMemo(() => {
    const set = new Set<string>();
    STANDARD_GOODS_CATEGORIES.forEach(cat => {
      cat.items.forEach(item => {
        set.add(`${cat.category.trim().toLowerCase()}:::${item.trim().toLowerCase()}`);
        set.add(item.trim().toLowerCase());
      });
    });
    return set;
  }, []);

  const customGoodsList = useMemo(() => {
    return formGoods.filter(g => {
      const catKey = `${(g.category || '').trim().toLowerCase()}:::${(g.itemName || '').trim().toLowerCase()}`;
      const nmKey = (g.itemName || '').trim().toLowerCase();
      return !standardGoodsKeysSet.has(catKey) && !standardGoodsKeysSet.has(nmKey);
    });
  }, [formGoods, standardGoodsKeysSet]);

  const handleGoodsQtyChange = (category: string, itemName: string, value: number) => {
    const val = Math.max(0, value);
    setFormGoods(prev => {
      const kCat = category.trim().toLowerCase();
      const kName = itemName.trim().toLowerCase();
      const idx = prev.findIndex(g => 
        ((g.category || '').trim().toLowerCase() === kCat || !g.category) && 
        (g.itemName || '').trim().toLowerCase() === kName
      );

      if (idx >= 0) {
        const copy = [...prev];
        const existing = copy[idx];
        if (val === 0 && !existing.vendor && !existing.remarks) {
          return prev.filter((_, i) => i !== idx);
        }
        copy[idx] = {
          ...existing,
          category,
          actualQty: val,
          plannedQty: existing.plannedQty || val
        };
        return copy;
      } else {
        if (val === 0) return prev;
        return [
          ...prev,
          {
            id: `goods_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            category,
            itemName,
            actualQty: val,
            plannedQty: val
          }
        ];
      }
    });
  };

  const handleAddCustomGoodsRow = () => {
    setFormGoods(prev => [
      ...prev,
      {
        id: `goods_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        category: 'Custom Goods',
        itemName: 'Custom Production Item',
        plannedQty: 1,
        actualQty: 1,
        vendor: '',
        remarks: ''
      }
    ]);
  };

  // Genset & Vanity Helper Maps & State Handlers
  const [showAllGenset, setShowAllGenset] = useState<boolean>(false);
  const vanityQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    formVanities.forEach(v => {
      if (v.type) {
        map.set(v.type.trim().toLowerCase(), v.quantity || 0);
      }
    });
    return map;
  }, [formVanities]);

  const gensetQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    formGensets.forEach(g => {
      if (g.name) {
        map.set(g.name.trim().toLowerCase(), g.quantity || 0);
      }
    });
    return map;
  }, [formGensets]);

  const handleGensetVanityQtyChange = (item: StandardGensetVanityItem, val: number) => {
    const qty = Math.max(0, val);
    const kName = item.name.trim().toLowerCase();

    if (item.category === 'Vanity') {
      setFormVanities(prev => {
        const idx = prev.findIndex(v => (v.type || '').trim().toLowerCase() === kName);
        if (idx >= 0) {
          if (qty === 0) return prev.filter((_, i) => i !== idx);
          const copy = [...prev];
          copy[idx] = { ...copy[idx], quantity: qty };
          return copy;
        } else {
          if (qty === 0) return prev;
          return [
            ...prev,
            {
              id: `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              type: item.name,
              quantity: qty,
              rate: 0
            }
          ];
        }
      });

      // ALSO add/update fuel calculation entry in formGensets
      setFormGensets(prev => {
        const idx = prev.findIndex(g => (g.name || '').trim().toLowerCase() === kName);
        if (idx >= 0) {
          if (qty === 0) return prev.filter((_, i) => i !== idx);
          const copy = [...prev];
          const existing = copy[idx];
          const calcF = (existing.runningHours || 12) * (existing.litresPerHour || (item.defaultLph || 5)) * qty;
          copy[idx] = {
            ...existing,
            quantity: qty,
            calculatedFuel: calcF,
            fuelCost: calcF * (existing.fuelRatePerLitre || 95)
          };
          return copy;
        } else {
          if (qty === 0) return prev;
          const defaultLph = item.defaultLph || (item.name.includes('Celebrity') ? 6 : item.name.includes('Double') ? 5 : 4);
          const defaultHours = 12;
          const defaultRate = 95;
          const calcF = defaultHours * defaultLph * qty;
          return [
            ...prev,
            {
              id: `g_vanity_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              name: item.name,
              capacity: 'Vanity',
              quantity: qty,
              breakMinutes: 0,
              runningHours: defaultHours,
              litresPerHour: defaultLph,
              openingFuel: 0,
              fuelAdded: 0,
              closingFuel: 0,
              calculatedFuel: calcF,
              actualFuel: calcF,
              fuelVariance: 0,
              fuelRatePerLitre: defaultRate,
              fuelCost: calcF * defaultRate
            }
          ];
        }
      });
    } else {
      setFormGensets(prev => {
        const idx = prev.findIndex(g => (g.name || '').trim().toLowerCase() === kName);
        if (idx >= 0) {
          if (qty === 0) return prev.filter((_, i) => i !== idx);
          const copy = [...prev];
          const existing = copy[idx];
          const calcF = (existing.runningHours || 12) * (existing.litresPerHour || 10) * qty;
          copy[idx] = {
            ...existing,
            quantity: qty,
            calculatedFuel: calcF,
            fuelCost: calcF * (existing.fuelRatePerLitre || 95)
          };
          return copy;
        } else {
          if (qty === 0) return prev;
          const defaultLph = item.defaultLph || 10;
          const defaultHours = 12;
          const defaultRate = 95;
          const calcF = defaultHours * defaultLph * qty;
          return [
            ...prev,
            {
              id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              name: item.name,
              capacity: item.name.replace('Rent', '').trim(),
              quantity: qty,
              breakMinutes: 0,
              runningHours: defaultHours,
              litresPerHour: defaultLph,
              openingFuel: 0,
              fuelAdded: 0,
              closingFuel: 0,
              calculatedFuel: calcF,
              actualFuel: calcF,
              fuelVariance: 0,
              fuelRatePerLitre: defaultRate,
              fuelCost: calcF * defaultRate
            }
          ];
        }
      });
    }
  };

  // Food Count Helper State & Calculations
  const [foodSearch, setFoodSearch] = useState('');
  const [showAllFood, setShowAllFood] = useState<boolean>(false);
  const [collapsedFoodCategories, setCollapsedFoodCategories] = useState<Record<string, boolean>>({});
  const [expandedFoodCards, setExpandedFoodCards] = useState<Record<string, boolean>>({});

  // Fast map lookup for food entry per category + mealType
  const foodLookupMap = useMemo(() => {
    const map = new Map<string, DSRFoodEntry>();
    formFood.forEach(f => {
      const cat = (f.category || '').trim().toLowerCase();
      const nm = (f.mealType || '').trim().toLowerCase();
      const key = `${cat}:::${nm}`;
      map.set(key, f);
      map.set(nm, f);
    });
    return map;
  }, [formFood]);

  // Standard keys set for filtering custom unlisted food
  const standardFoodKeysSet = useMemo(() => {
    const set = new Set<string>();
    STANDARD_FOOD_CATEGORIES.forEach(cat => {
      cat.items.forEach(item => {
        set.add(`${cat.category.trim().toLowerCase()}:::${item.trim().toLowerCase()}`);
        set.add(item.trim().toLowerCase());
      });
    });
    return set;
  }, []);

  const customFoodList = useMemo(() => {
    return formFood.filter(f => {
      const catKey = `${(f.category || '').trim().toLowerCase()}:::${(f.mealType || '').trim().toLowerCase()}`;
      const nmKey = (f.mealType || '').trim().toLowerCase();
      return !standardFoodKeysSet.has(catKey) && !standardFoodKeysSet.has(nmKey);
    });
  }, [formFood, standardFoodKeysSet]);

  const handleFoodQtyChange = (category: string, mealType: string, value: number) => {
    const val = Math.max(0, value);
    setFormFood(prev => {
      const kCat = category.trim().toLowerCase();
      const kName = mealType.trim().toLowerCase();
      const idx = prev.findIndex(f => 
        ((f.category || '').trim().toLowerCase() === kCat || !f.category) && 
        (f.mealType || '').trim().toLowerCase() === kName
      );

      if (idx >= 0) {
        const copy = [...prev];
        const existing = copy[idx];
        if (val === 0 && !existing.vendor && !existing.remarks && !existing.vegCount && !existing.nonVegCount) {
          return prev.filter((_, i) => i !== idx);
        }
        let rate = existing.ratePerPlate;
        if (!rate) {
          if (mealType.includes('Breakfast')) rate = 120;
          else if (mealType.includes('Lunch')) rate = 220;
          else if (mealType.includes('Snacks')) rate = 80;
          else if (mealType.includes('Dinner')) rate = 220;
          else rate = 150;
        }
        copy[idx] = {
          ...existing,
          category,
          actualCount: val,
          plannedCount: existing.plannedCount || val,
          vegCount: existing.vegCount ?? val,
          ratePerPlate: rate,
          totalCost: val * rate
        };
        return copy;
      } else {
        if (val === 0) return prev;
        let rate = 150;
        if (mealType.includes('Breakfast')) rate = 120;
        else if (mealType.includes('Lunch')) rate = 220;
        else if (mealType.includes('Snacks')) rate = 80;
        else if (mealType.includes('Dinner')) rate = 220;

        return [
          ...prev,
          {
            id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            category,
            mealType,
            actualCount: val,
            plannedCount: val,
            vegCount: val,
            nonVegCount: 0,
            artistCount: 0,
            crewCount: 0,
            driverCount: 0,
            guestCount: 0,
            ratePerPlate: rate,
            totalCost: val * rate
          }
        ];
      }
    });
  };

  const handleAddCustomFoodRow = () => {
    setFormFood(prev => [
      ...prev,
      {
        id: `food_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        category: 'Custom Meals',
        mealType: 'Custom Meal Item',
        plannedCount: 1,
        actualCount: 1,
        vegCount: 1,
        nonVegCount: 0,
        artistCount: 0,
        crewCount: 0,
        driverCount: 0,
        guestCount: 0,
        ratePerPlate: 150,
        totalCost: 150,
        vendor: '',
        remarks: ''
      }
    ]);
  };

  // Open modal for new day
  const handleOpenAddModal = (initialDate?: string) => {
    const targetDate = initialDate || new Date().toISOString().substring(0, 10);
    const takenOnDate = new Set(
      projectDsrs
        .filter(d => d.shootingDate === targetDate && d.unitName)
        .map(d => (d.unitName || '').trim().toLowerCase())
    );

    let chosenCategory = 'Shooting Unit';
    let chosenUnit = '01 - 1st Unit';

    const shootingUnits = UNIT_PRESET_CATEGORIES['Shooting Unit'] || [];
    const availableShooting = shootingUnits.find(u => !takenOnDate.has(u.trim().toLowerCase()));
    if (availableShooting) {
      chosenUnit = availableShooting;
      chosenCategory = 'Shooting Unit';
    } else {
      for (const cat of ALL_UNIT_PRESET_CATEGORIES) {
        if (cat === 'Custom') continue;
        const subs = UNIT_PRESET_CATEGORIES[cat] || [];
        const avail = subs.find(u => !takenOnDate.has(u.trim().toLowerCase()));
        if (avail) {
          chosenCategory = cat;
          chosenUnit = avail;
          break;
        }
      }
    }

    const nextDayNum = getNextDayNumberForUnit(chosenUnit, projectDsrs);
    setEditingDsrId(null);
    setFormDayNumber(nextDayNum);
    setFormScheduleName('Schedule 01 — Kolkata');
    setFormUnitCategory(chosenCategory);
    setIsCustomSubUnit(false);
    setFormUnitName(chosenUnit);
    setFormShootingDate(targetDate);
    setFormLocationName('');
    setFormLocationType('Studio');
    setFormCallTime('06:00 AM');
    setFormPackupTime('09:00 PM');
    setFormWorkingHours(15);
    setFormOvertime(0);
    setFormUsableFootage(0);
    setFormDepartmentCallTimes([]);
    setFormCrew([]);
    setFormEquipment([]);
    setFormGoods(createDefaultGoodsEntries([]));
    setFormTransport([]);
    setFormGensets([]);
    setFormVanities([]);
    setFormFood(createDefaultFoodEntries([]));
    setFormNotes('');
    setFormStatus('Draft');
    setActiveTab('info');
    setIsModalOpen(true);
  };

  // Open modal for adding a parallel unit on an existing date
  const handleAddParallelUnit = (existingDsr: ProductionDSR) => {
    const targetDate = existingDsr.shootingDate;
    const takenOnDate = new Set(
      projectDsrs
        .filter(d => d.shootingDate === targetDate && d.unitName)
        .map(d => (d.unitName || '').trim().toLowerCase())
    );

    let chosenCategory = 'Set Construction Unit';
    let chosenUnit = 'Set Construction Unit 1';

    const preferredCategories = ['Set Construction Unit', 'Recce Unit', 'Shooting Unit', 'AV Shoot Unit', 'Stock Shoot Unit', 'Audition Unit'];
    for (const cat of preferredCategories) {
      const subs = UNIT_PRESET_CATEGORIES[cat] || [];
      const avail = subs.find(u => !takenOnDate.has(u.trim().toLowerCase()));
      if (avail) {
        chosenCategory = cat;
        chosenUnit = avail;
        break;
      }
    }

    const nextDayNum = getNextDayNumberForUnit(chosenUnit, projectDsrs);
    setEditingDsrId(null);
    setFormDayNumber(nextDayNum);
    setFormScheduleName(existingDsr.scheduleName || 'Schedule 01 — Kolkata');
    setFormShootingDate(existingDsr.shootingDate);
    setFormUnitCategory(chosenCategory);
    setIsCustomSubUnit(false);
    setFormUnitName(chosenUnit);
    setFormLocationName(existingDsr.primaryLocationName || 'Location');
    setFormLocationType('Outdoor');
    setFormCallTime('07:00 AM');
    setFormPackupTime('08:00 PM');
    setFormWorkingHours(13);
    setFormOvertime(0);
    setFormUsableFootage(0);
    setFormDepartmentCallTimes(existingDsr.departmentCallTimes ? [...existingDsr.departmentCallTimes] : []);
    setFormCrew([]);
    setFormEquipment([]);
    setFormGoods(createDefaultGoodsEntries([]));
    setFormTransport([]);
    setFormGensets([]);
    setFormVanities([]);
    setFormFood(createDefaultFoodEntries([]));
    setFormNotes(`Parallel unit session on ${existingDsr.shootingDate}`);
    setFormStatus('Draft');
    setActiveTab('info');
    setIsModalOpen(true);
  };

  // Open modal for editing existing day
  const handleOpenEditModal = (dsr: ProductionDSR) => {
    const unitName = dsr.unitName || '01 - 1st Unit';
    const cat = getCategoryForUnitName(unitName);
    const isPresetSub = UNIT_PRESET_CATEGORIES[cat]?.includes(unitName);

    setEditingDsrId(dsr.id);
    setFormDayNumber(dsr.dayNumber);
    setFormScheduleName(dsr.scheduleName || 'Schedule 01 — Kolkata');
    setFormUnitCategory(cat);
    setIsCustomSubUnit(!isPresetSub && cat !== 'Custom' ? true : cat === 'Custom');
    setFormUnitName(unitName);
    setFormShootingDate(dsr.shootingDate);
    setFormLocationName(dsr.primaryLocationName || dsr.locations[0]?.locationName || 'Studio');
    setFormLocationType(dsr.locations[0]?.locationType || 'Studio');
    setFormCallTime(dsr.callTime);
    setFormPackupTime(dsr.packupTime);
    setFormWorkingHours(dsr.totalWorkingHours || 15);
    setFormOvertime(dsr.overtimeHours !== undefined ? dsr.overtimeHours : 0);
    setFormUsableFootage(dsr.usableFootageMinutes || 0);
    setFormDepartmentCallTimes(dsr.departmentCallTimes ? [...dsr.departmentCallTimes] : []);
    setFormCrew(dsr.crewEntries || []);
    setFormEquipment(dsr.equipmentEntries || []);
    setFormGoods(createDefaultGoodsEntries(dsr.goodsEntries || []));
    setFormTransport(dsr.transportEntries || []);
    setFormGensets(dsr.gensetEntries || []);
    setFormVanities(dsr.vanityEntries || []);
    setFormFood(createDefaultFoodEntries(dsr.foodEntries || []));
    setFormNotes(dsr.productionNotes || '');
    setFormStatus(dsr.status as any || 'Draft');
    setActiveTab('info');
    setIsModalOpen(true);
  };

  // Duplicate previous day structure
  const handleDuplicatePreviousDay = () => {
    if (projectDsrs.length === 0) return;
    const lastDsr = projectDsrs[projectDsrs.length - 1];
    setFormScheduleName(lastDsr.scheduleName);
    setFormLocationName(lastDsr.primaryLocationName || 'Location');
    setFormCrew((lastDsr.crewEntries || []).map(c => ({ ...c, id: `c_${Date.now()}_${Math.random().toString(36).substring(2,5)}` })));
    setFormEquipment((lastDsr.equipmentEntries || []).map(e => ({ ...e, id: `e_${Date.now()}_${Math.random().toString(36).substring(2,5)}` })));
    setFormGoods(createDefaultGoodsEntries(lastDsr.goodsEntries || []));
    setFormTransport((lastDsr.transportEntries || []).map(t => ({ ...t, id: `t_${Date.now()}_${Math.random().toString(36).substring(2,5)}` })));
    setFormGensets((lastDsr.gensetEntries || []).map(g => ({ ...g, id: `g_${Date.now()}_${Math.random().toString(36).substring(2,5)}` })));
    setFormVanities((lastDsr.vanityEntries || []).map(v => ({ ...v, id: `v_${Date.now()}_${Math.random().toString(36).substring(2,5)}` })));
    setFormFood(createDefaultFoodEntries(lastDsr.foodEntries || []));
    alert(`Copied crew structure, equipment, goods, vehicles, genset & vanity setup from ${lastDsr.dayCode}!`);
  };

  // Save DSR Handler
  const handleSaveDSR = async (newStatus?: 'Draft' | 'Submitted' | 'Approved' | 'Locked') => {
    if (isUnitTakenOnDate) {
      alert(`Cannot save DSR: A record for "${formUnitName}" already exists on ${formShootingDate}.\n\nParallel units (such as 2nd Unit, Recee Unit, Set Construction) can be added on the same day, but duplicate records for the exact same unit on the same day are not allowed. Please choose a different unit or date.`);
      return;
    }

    const statusToSave = newStatus || formStatus;
    const dsrId = editingDsrId || `dsr_day_${formDayNumber}_${Date.now()}`;
    const projId = selectedProjectId || activeProject.id || 'p_default';

    // Calculate Genset Fuel Totals
    const calcFuelSum = formGensets.reduce((acc, g) => acc + (g.runningHours * g.litresPerHour * g.quantity), 0);
    const actFuelSum = formGensets.reduce((acc, g) => acc + (g.actualFuel || (g.runningHours * g.litresPerHour * g.quantity)), 0);
    const fuelCostSum = formGensets.reduce((acc, g) => acc + (g.fuelCost || (g.actualFuel * 96)), 0);

    // Calculate Food Counts
    const bf = formFood.filter(f => (f.mealType || '').toLowerCase().includes('breakfast')).reduce((acc, f) => acc + (f.actualCount || 0), 0);
    const lu = formFood.filter(f => (f.mealType || '').toLowerCase().includes('lunch')).reduce((acc, f) => acc + (f.actualCount || 0), 0);
    const sn = formFood.filter(f => (f.mealType || '').toLowerCase().includes('snacks')).reduce((acc, f) => acc + (f.actualCount || 0), 0);
    const dn = formFood.filter(f => (f.mealType || '').toLowerCase().includes('dinner')).reduce((acc, f) => acc + (f.actualCount || 0), 0);
    const totalFoodCount = formFood.reduce((acc, f) => acc + (f.actualCount || 0), 0);
    const totalFoodCost = formFood.reduce((acc, f) => acc + (f.totalCost || ((f.actualCount || 0) * (f.ratePerPlate || 0))), 0);

    // Calculate Total Vehicles
    const totalVehicleQty = formTransport.reduce((acc, t) => acc + (t.actualQty || 0), 0);
    const totalTransportCost = formTransport.reduce((acc, t) => acc + (t.totalCost || 0), 0);

    const formattedDayCode = formatDSRDayCode(formDayNumber, formUnitName);

    const newDsr: ProductionDSR = {
      id: dsrId,
      projectId: projId,
      companyId: activeProject.companyName || companyName,
      scheduleName: formScheduleName,
      unitName: formUnitName,
      dayNumber: formDayNumber,
      dayCode: formattedDayCode,
      shootingDate: formShootingDate,
      primaryLocationName: formLocationName,
      locations: [
        {
          locationName: formLocationName,
          locationType: formLocationType,
          isPrimary: true,
          startTime: formCallTime,
          endTime: formPackupTime
        }
      ],
      callTime: formCallTime,
      packupTime: formPackupTime,
      totalWorkingHours: formWorkingHours,
      overtimeHours: formOvertime,
      recordedFootageMinutes: isShootingUnitSelected ? (formUsableFootage * 8) : 0,
      usableFootageMinutes: isShootingUnitSelected ? (Number(formUsableFootage) || 0) : 0,
      footageEntries: isShootingUnitSelected && formUsableFootage > 0 ? [
        { id: `f_${Date.now()}`, cameraName: 'Camera A (ARRI Alexa)', cardOrReelNumber: 'A001', durationMinutes: formUsableFootage * 6, usableMinutes: formUsableFootage, fileSizeGb: 450, backupStatus: 'Verified' }
      ] : [],
      totalPlannedCrew: formCrew.reduce((acc, c) => acc + (Number(c.plannedCount) || 0), 0),
      totalPresentCrew: formTotalPresentCrew,
      totalAbsentCrew: formCrew.reduce((acc, c) => acc + (Number(c.absentCount) || 0), 0),
      totalExtraCrew: formCrew.reduce((acc, c) => acc + (Number(c.extraCount) || 0), 0),
      crewEntries: formCrew,
      totalEquipmentQty: formEquipment.reduce((acc, e) => acc + (Number(e.actualQty) || 0), 0),
      equipmentEntries: formEquipment,
      goodsEntries: formGoods,
      totalVehicleQty: totalVehicleQty,
      totalTransportCost: totalTransportCost,
      transportEntries: formTransport,
      totalGensetQty: formGensets.reduce((acc, g) => acc + (Number(g.quantity) || 0), 0),
      totalVanityQty: formVanities.reduce((acc, v) => acc + (Number(v.quantity) || 0), 0),
      gensetEntries: formGensets,
      vanityEntries: formVanities,
      calculatedFuelTotal: calcFuelSum,
      actualFuelTotal: actFuelSum,
      fuelVarianceTotal: actFuelSum - calcFuelSum,
      fuelRatePerLitre: 96,
      fuelCostTotal: fuelCostSum,
      breakfastCount: bf,
      lunchCount: lu,
      snacksCount: sn,
      dinnerCount: dn,
      totalFoodCount: totalFoodCount,
      totalFoodCost: totalFoodCost,
      foodEntries: formFood,
      departmentCallTimes: formDepartmentCallTimes,
      productionNotes: formNotes,
      status: statusToSave,
      recordVersion: 1,
      createdBy: 'Sujoy Production',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update state & save to Firestore
    const updated = dsrList.filter(d => d.id !== dsrId);
    setDsrList([...updated, newDsr]);
    await saveDSR(newDsr);

    await addDbLog({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action: editingDsrId ? 'UPDATE_DSR' : 'CREATE_DSR',
      sqlQuery: `INSERT/UPDATE INTO production_dsrs (id, day_code, unit, status) VALUES ('${dsrId}', '${formattedDayCode}', '${formUnitName}', '${statusToSave}')`,
      status: 'success'
    });

    setIsModalOpen(false);
  };

  const handleDeleteDSR = async (dsrId: string, dayCode: string) => {
    setDsrList(dsrList.filter(d => d.id !== dsrId));
    await deleteDSR(dsrId);
    await addDbLog({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action: 'DELETE_DSR',
      sqlQuery: `DELETE FROM production_dsrs WHERE id = '${dsrId}'`,
      status: 'success'
    });
  };

  // CSV Export
  const handleExportCSV = () => {
    let csv = "Day,Date,Location,Call Time,Pack-up,Working Hrs,Footage,Crew,Vehicles,Gensets,Vanity,Fuel (L),Breakfast,Lunch,Snacks,Dinner,Status\n";
    filteredDsrs.forEach(d => {
      csv += `"${d.dayCode}","${d.shootingDate}","${d.primaryLocationName || 'N/A'}","${d.callTime}","${d.packupTime}",${d.totalWorkingHours},"${d.usableFootageMinutes} Min",${d.totalPresentCrew},${d.totalVehicleQty},${d.totalGensetQty},${d.totalVanityQty},${d.actualFuelTotal || d.calculatedFuelTotal},${d.breakfastCount},${d.lunchCount},${d.snacksCount},${d.dinnerCount},"${d.status}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Production_DSR_${activeProject.name.replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-2.5 font-sans text-slate-100 pb-12">
      {/* 1. HEADER SECTION (COMPACT & LOW SPACE) */}
      <div className="bg-slate-900 rounded-xl p-2.5 sm:p-3 border border-slate-800 shadow-2xs flex flex-col gap-2">
        <div className="flex flex-row items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-blue-400 font-bold uppercase tracking-wider">
              <Building2 className="w-3 h-3 text-blue-400" />
              <span>{companyName} • Production ERP</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <Film className="w-4 h-4 text-amber-400 shrink-0" />
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                PRODUCTION DSR (DAILY SHOOTING REPORT)
              </h1>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                Schedule 01 — Kolkata
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              Project: <strong className="text-white font-semibold">{activeProject.name}</strong>
            </div>
          </div>

          {/* Schedule Progress Counters in Compact Single Row */}
          <div className="flex flex-row items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800/90 shrink-0">
            <div className="px-2.5 py-1 bg-slate-900/90 rounded border border-slate-800/80 text-center min-w-[70px] shrink-0">
              <div className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">TOTAL DAYS</div>
              <div className="text-sm font-black text-white font-mono leading-tight">{totalShootDays}</div>
            </div>
            <div className="px-2.5 py-1 bg-emerald-950/50 rounded border border-emerald-900/50 text-center min-w-[70px] shrink-0">
              <div className="text-[8px] font-extrabold text-emerald-400 uppercase tracking-wider">COMPLETED</div>
              <div className="text-sm font-black text-emerald-300 font-mono leading-tight">{completedDaysCount}</div>
            </div>
            <div className="px-2.5 py-1 bg-amber-950/50 rounded border border-amber-900/50 text-center min-w-[70px] shrink-0">
              <div className="text-[8px] font-extrabold text-amber-400 uppercase tracking-wider">UPCOMING</div>
              <div className="text-sm font-black text-amber-300 font-mono leading-tight">{upcomingDaysCount}</div>
            </div>
          </div>
        </div>

        {/* Top Production Sub-Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-1.5 border-t border-slate-800/80">
          {PRODUCTION_SUB_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = currentSubTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`production-subtab-${tab.id}`}
                type="button"
                onClick={() => handleProductionSubTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all active:scale-[0.98] select-none ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-bold border border-blue-500 ring-2 ring-blue-400/30'
                    : 'bg-slate-950/80 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-amber-400'}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subtab Ready Views */}
      {currentSubTab === 'production-overview' && (
        <ProductionDsrSummary 
          project={activeProject} 
          onNavigateToFullDsr={() => handleProductionSubTabChange('production-dsr')} 
        />
      )}

      {currentSubTab === 'schedule' && (
        <ProductionSchedule project={activeProject} />
      )}

      {currentSubTab === 'units' && (
        <ProductionUnitPlanning project={activeProject} />
      )}

      {currentSubTab === 'crew-attendance' && (
        <ProductionCrewCount project={activeProject} />
      )}

      {currentSubTab === 'artist-attendance' && (
        <ProductionArtistAttendance project={activeProject} />
      )}

      {currentSubTab === 'equipment-usage' && (
        <ProductionEquipment project={activeProject} />
      )}

      {currentSubTab === 'transport-usage' && (
        <ProductionTransport project={activeProject} />
      )}

      {currentSubTab === 'genset-fuel' && (
        <ProductionGensetFuel project={activeProject} />
      )}

      {currentSubTab === 'vanity' && (
        <ProductionVanity project={activeProject} />
      )}

      {currentSubTab === 'food-count' && (
        <ProductionFood project={activeProject} />
      )}

      {currentSubTab === 'call-sheet' && (
        <ProductionCallSheet project={activeProject} />
      )}

      {currentSubTab === 'daily-requirements' && (
        <ProductionDailyRequirement project={activeProject} />
      )}

      {currentSubTab === 'accommodations' && (
        <ProductionAccommodation project={activeProject} />
      )}

      {currentSubTab === 'issue-tracker' && (
        <ProductionIssueTracker project={activeProject} />
      )}

      {/* Production DSR Main Subtab View */}
      {currentSubTab === 'production-dsr' && (
        <>
      {/* 2. COMPACT SUMMARY METRIC CARDS (LOW SPACE DESIGN) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {/* Total Shoot Days */}
        <div className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700/80 rounded-lg px-2.5 py-1.5 flex items-center gap-2.5 transition-colors shadow-2xs">
          <div className="w-8 h-8 rounded-md bg-blue-950/70 border border-blue-800/50 flex items-center justify-center text-blue-400 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">Shoot Days</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black text-white font-mono leading-none">{totalShootDays}</span>
              <span className="text-[9px] font-medium text-slate-500 truncate">Days</span>
            </div>
          </div>
        </div>

        {/* Total Footage */}
        <div className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700/80 rounded-lg px-2.5 py-1.5 flex items-center gap-2.5 transition-colors shadow-2xs">
          <div className="w-8 h-8 rounded-md bg-emerald-950/70 border border-emerald-800/50 flex items-center justify-center text-emerald-400 shrink-0">
            <Video className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Footage</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black text-emerald-400 font-mono leading-none">{formattedFootageSum}</span>
              <span className="text-[9px] font-medium text-slate-500 truncate">Usable</span>
            </div>
          </div>
        </div>

        {/* Total Crew Days */}
        <div className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700/80 rounded-lg px-2.5 py-1.5 flex items-center gap-2.5 transition-colors shadow-2xs">
          <div className="w-8 h-8 rounded-md bg-purple-950/70 border border-purple-800/50 flex items-center justify-center text-purple-400 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">Crew Days</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black text-purple-300 font-mono leading-none">{totalCrewDaysSum.toLocaleString()}</span>
              <span className="text-[9px] font-medium text-slate-500 truncate">Man-days</span>
            </div>
          </div>
        </div>

        {/* Total Fuel Used */}
        <div className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700/80 rounded-lg px-2.5 py-1.5 flex items-center gap-2.5 transition-colors shadow-2xs">
          <div className="w-8 h-8 rounded-md bg-amber-950/70 border border-amber-800/50 flex items-center justify-center text-amber-400 shrink-0">
            <Fuel className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">Fuel Consumed</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black text-amber-400 font-mono leading-none">{totalFuelUsedSum.toLocaleString()}</span>
              <span className="text-[9px] font-medium text-slate-500 truncate">Liters</span>
            </div>
          </div>
        </div>

        {/* Total Food Count */}
        <div className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700/80 rounded-lg px-2.5 py-1.5 flex items-center gap-2.5 transition-colors shadow-2xs col-span-2 sm:col-span-1">
          <div className="w-8 h-8 rounded-md bg-rose-950/70 border border-rose-800/50 flex items-center justify-center text-rose-400 shrink-0">
            <Utensils className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">Food Count</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black text-rose-300 font-mono leading-none">{totalFoodCountSum.toLocaleString()}</span>
              <span className="text-[9px] font-medium text-slate-500 truncate">Meals</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR & SEARCH (COMPACT) */}
      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-2.5">
        <div className="flex flex-1 items-center gap-2 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search day number, location, date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Schedule Filter */}
          <select
            value={scheduleFilter}
            onChange={(e) => setScheduleFilter(e.target.value)}
            className="h-7 px-2 bg-slate-800 border border-slate-700 rounded-md text-xs text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="All" className="bg-slate-900 text-slate-100 text-xs font-semibold">All Schedules</option>
            <option value="Schedule 01 — Kolkata" className="bg-slate-900 text-slate-100 text-xs font-semibold">Schedule 01 — Kolkata</option>
            <option value="Schedule 02 — Bolpur" className="bg-slate-900 text-slate-100 text-xs font-semibold">Schedule 02 — Bolpur</option>
          </select>

          {/* Unit Filter */}
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="h-7 px-2 bg-slate-800 border border-slate-700 rounded-md text-xs text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All" className="bg-slate-900 text-slate-100 text-xs font-semibold">All Units / Services</option>
            {ALL_FLAT_PRESET_UNITS.map(u => (
              <option key={u} value={u} className="bg-slate-900 text-slate-100 text-xs font-semibold">{u}</option>
            ))}
            {availableUnits.filter(u => !ALL_FLAT_PRESET_UNITS.includes(u)).map(u => (
              <option key={u} value={u} className="bg-slate-900 text-slate-100 text-xs font-semibold">{u}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-7 px-2 bg-slate-800 border border-slate-700 rounded-md text-xs text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="All" className="bg-slate-900 text-slate-100 text-xs font-semibold">All Statuses</option>
            <option value="Draft" className="bg-slate-900 text-slate-100 text-xs font-semibold">Draft</option>
            <option value="Submitted" className="bg-slate-900 text-slate-100 text-xs font-semibold">Submitted</option>
            <option value="Approved" className="bg-slate-900 text-slate-100 text-xs font-semibold">Approved</option>
            <option value="Locked" className="bg-slate-900 text-slate-100 text-xs font-semibold">Locked</option>
          </select>
        </div>

        {/* View Switchers & Action Buttons */}
        <div className="flex items-center flex-wrap gap-1.5 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 shrink-0">
            <button
              onClick={() => setViewMode('column')}
              className={`px-2 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                viewMode === 'column' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3 h-3" /> Column
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-2 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                viewMode === 'card' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3 h-3" /> Card
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-2 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                viewMode === 'calendar' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3 h-3" /> Calendar
            </button>
          </div>

          <button
            onClick={() => {
              setDispatchDsr(filteredDsrs[0] || null);
              setIsDispatcherOpen(true);
            }}
            className="h-7 px-2.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white rounded-md text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 border border-emerald-600"
            title="Dispatch Call Sheet & DSR via WhatsApp / Email"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>Dispatch Call Sheet / DSR</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="h-7 px-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-md text-xs font-bold transition-all border border-slate-700 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            title="Export DSR to CSV"
          >
            <Download className="w-3 h-3" /> Export
          </button>

          <button
            onClick={() => window.print()}
            className="h-7 px-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-md text-xs font-bold transition-all border border-slate-700 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            title="Print Report"
          >
            <Printer className="w-3 h-3" /> Print
          </button>

          <button
            onClick={() => handleOpenAddModal()}
            className="h-7 px-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-md text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" /> Add Shooting Day
          </button>
        </div>
      </div>

      {/* 4. FRONT PAGE MAIN VIEW LAYOUT */}
      
      {/* MODE 1: DESKTOP COLUMN MATRIX VIEW (LOW-SPACE COMPACT LAYOUT) */}
      {viewMode === 'column' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800/90 border-b border-slate-800 text-[10px] font-extrabold text-slate-300">
                  <th className="py-2 px-3 w-36 sm:w-40 sticky left-0 z-20 bg-slate-900 border-r border-slate-800 text-slate-300 uppercase tracking-wider font-mono">
                    <div className="flex items-center justify-between">
                      <span>Particular</span>
                      <span className="text-[8px] text-blue-400 font-normal lowercase opacity-70">click cell for preview</span>
                    </div>
                  </th>
                  {filteredDsrs.map(d => (
                    <th 
                      key={d.id} 
                      onClick={() => handleOpenPreview(d, 'all')}
                      className="py-2 px-2.5 min-w-[125px] sm:min-w-[135px] max-w-[150px] text-center border-r border-slate-800/60 font-mono hover:bg-blue-950/40 hover:ring-1 hover:ring-blue-500/50 cursor-pointer transition-all group"
                      title={`Click to preview full DSR report for ${d.dayCode} (${d.unitName})`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <div className="text-xs font-black text-blue-400 group-hover:text-blue-300 leading-tight">{d.dayCode}</div>
                        <Eye className="w-3 h-3 text-blue-400 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                      <div className="text-[9px] text-slate-400 font-normal">{d.shootingDate}</div>
                      <div className="mt-0.5">
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase tracking-wide truncate max-w-full ${
                          d.unitName?.toLowerCase().includes('construction') ? 'bg-amber-950/90 text-amber-300 border border-amber-800/80' :
                          d.unitName?.toLowerCase().includes('av shoot') ? 'bg-indigo-950/90 text-indigo-300 border border-indigo-800/80' :
                          d.unitName?.toLowerCase().includes('action') ? 'bg-rose-950/90 text-rose-300 border border-rose-800/80' :
                          'bg-blue-950/90 text-blue-300 border border-blue-800/80'
                        }`}>
                          {d.unitName || 'Main Unit'}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px] font-medium">
                {/* Date */}
                <tr className="hover:bg-slate-800/30">
                  <td 
                    onClick={() => filteredDsrs[0] && handleOpenPreview(filteredDsrs[0], 'timing')}
                    className="py-1.5 px-3 font-bold text-slate-300 sticky left-0 bg-slate-900 border-r border-slate-800 hover:text-blue-300 cursor-pointer transition-colors"
                    title="Click to preview shooting date"
                  >
                    Date
                  </td>
                  {filteredDsrs.map(d => (
                    <td 
                      key={d.id} 
                      onClick={() => handleOpenPreview(d, 'timing')}
                      className="py-1.5 px-2.5 text-center border-r border-slate-800/60 font-mono text-slate-300 text-[10px] hover:bg-blue-950/40 hover:text-blue-300 cursor-pointer transition-colors"
                      title={`Click to preview ${d.dayCode} schedule & date`}
                    >
                      {d.shootingDate}
                    </td>
                  ))}
                </tr>

                {/* Unit / Service */}
                <tr className="hover:bg-slate-800/30">
                  <td 
                    onClick={() => filteredDsrs[0] && handleOpenPreview(filteredDsrs[0], 'timing')}
                    className="py-1.5 px-3 font-bold text-indigo-300 sticky left-0 bg-slate-900 border-r border-slate-800 flex items-center justify-between hover:text-indigo-200 cursor-pointer transition-colors"
                    title="Click to preview unit & service"
                  >
                    <span>Unit / Service</span>
                  </td>
                  {filteredDsrs.map(d => (
                    <td 
                      key={d.id} 
                      onClick={() => handleOpenPreview(d, 'timing')}
                      className="py-1.5 px-2.5 text-center border-r border-slate-800/60 font-bold text-indigo-300 text-[10px] truncate max-w-[130px] hover:bg-blue-950/40 hover:text-indigo-200 cursor-pointer transition-colors" 
                      title={`Click to preview ${d.dayCode} unit (${d.unitName})`}
                    >
                      {d.unitName || 'Main Unit'}
                    </td>
                  ))}
                </tr>

                {/* Location */}
                <tr className="hover:bg-slate-800/30">
                  <td 
                    onClick={() => filteredDsrs[0] && handleOpenPreview(filteredDsrs[0], 'timing')}
                    className="py-1.5 px-3 font-bold text-slate-300 sticky left-0 bg-slate-900 border-r border-slate-800 hover:text-blue-300 cursor-pointer transition-colors"
                    title="Click to preview shooting locations"
                  >
                    Location
                  </td>
                  {filteredDsrs.map(d => (
                    <td 
                      key={d.id} 
                      onClick={() => handleOpenPreview(d, 'timing')}
                      className="py-1.5 px-2.5 text-center border-r border-slate-800/60 text-slate-200 font-semibold truncate max-w-[130px] hover:bg-blue-950/40 hover:text-white cursor-pointer transition-colors" 
                      title={`Click to preview ${d.dayCode} location details`}
                    >
                      {d.primaryLocationName || d.locations[0]?.locationName || 'Studio'}
                    </td>
                  ))}
                </tr>

                {/* Call Time */}
                <tr className="hover:bg-slate-800/30">
                  <td 
                    onClick={() => filteredDsrs[0] && handleOpenPreview(filteredDsrs[0], 'timing')}
                    className="py-1.5 px-3 font-bold text-slate-300 sticky left-0 bg-slate-900 border-r border-slate-800 hover:text-amber-300 cursor-pointer transition-colors"
                    title="Click to preview call time"
                  >
                    Call Time
                  </td>
                  {filteredDsrs.map(d => (
                    <td 
                      key={d.id} 
                      onClick={() => handleOpenPreview(d, 'timing')}
                      className="py-1.5 px-2.5 text-center border-r border-slate-800/60 font-mono text-amber-300 text-[10px] hover:bg-blue-950/40 hover:text-amber-200 cursor-pointer transition-colors"
                      title={`Click to preview ${d.dayCode} call timing`}
                    >
                      {d.callTime}
                    </td>
                  ))}
                </tr>

                {/* Pack-up Time */}
                <tr className="hover:bg-slate-800/30">
                  <td 
                    onClick={() => filteredDsrs[0] && handleOpenPreview(filteredDsrs[0], 'timing')}
                    className="py-1.5 px-3 font-bold text-slate-300 sticky left-0 bg-slate-900 border-r border-slate-800 hover:text-rose-300 cursor-pointer transition-colors"
                    title="Click to preview pack-up time"
                  >
                    Pack-up Time
                  </td>
                  {filteredDsrs.map(d => (
                    <td 
                      key={d.id} 
                      onClick={() => handleOpenPreview(d, 'timing')}
                      className="py-1.5 px-2.5 text-center border-r border-slate-800/60 font-mono text-rose-300 text-[10px] hover:bg-blue-950/40 hover:text-rose-200 cursor-pointer transition-colors"
                      title={`Click to preview ${d.dayCode} pack-up timing`}
                    >
                      {d.packupTime}
                    </td>
                  ))}
                </tr>

                {/* Team Call Times */}
                <tr className="hover:bg-slate-800/30">
                  <td 
                    onClick={() => filteredDsrs[0] && handleOpenPreview(filteredDsrs[0], 'timing')}
                    className="py-1.5 px-3 font-bold text-slate-300 sticky left-0 bg-slate-900 border-r border-slate-800 hover:text-purple-300 cursor-pointer transition-colors"
                    title="Click to preview department call times"
                  >
                    <div className="flex items-center gap-1 text-purple-400">
                      <Users className="w-3 h-3" /> Dept Calls
                    </div>
                  </td>
                  {filteredDsrs.map(d => {
                    const times = d.departmentCallTimes || [];
                    return (
                      <td 
                        key={d.id} 
                        onClick={() => handleOpenPreview(d, 'timing')}
                        className="py-1 px-1.5 text-center border-r border-slate-800/60 align-top hover:bg-blue-950/40 cursor-pointer transition-colors"
                        title={`Click to preview ${d.dayCode} department call timings`}
                      >
                        {times.length > 0 ? (
                          <div className="flex flex-col gap-0.5 max-w-[135px] mx-auto text-[9px]">
                            {times.slice(0, 3).map(t => (
                              <div key={t.id || t.department} className="flex justify-between items-center bg-slate-800/90 px-1.5 py-0.2 rounded border border-slate-700/80">
                                <span className="font-semibold text-slate-300 truncate max-w-[70px]">{t.department.replace(' Call', '')}</span>
                                <span className="font-mono text-amber-300 font-bold ml-1 text-[8.5px]">{t.callTime}</span>
                              </div>
                            ))}
                            {times.length > 3 && (
                              <span className="text-[8.5px] text-purple-400 font-bold pt-0.5">
                                + {times.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-xs">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Working Hours */}
                <tr className="hover:bg-slate-800/30">
                  <td 
                    onClick={() => filteredDsrs[0] && handleOpenPreview(filteredDsrs[0], 'timing')}
                    className="py-1.5 px-3 font-bold text-slate-300 sticky left-0 bg-slate-900 border-r border-slate-800 hover:text-blue-300 cursor-pointer transition-colors"
                    title="Click to preview working hours"
                  >
                    Working Hours
                  </td>
                  {filteredDsrs.map(d => (
                    <td 
                      key={d.id} 
                      onClick={() => handleOpenPreview(d, 'timing')}
                      className="py-1.5 px-2.5 text-center border-r border-slate-800/60 font-mono text-slate-200 text-[10px] hover:bg-blue-950/40 hover:text-blue-300 cursor-pointer transition-colors"
                      title={`Click to preview ${d.dayCode} shift hours`}
                    >
                      {d.totalWorkingHours}h
                    </td>
                  ))}
                </tr>

                {/* Footage */}
                <tr className="hover:bg-slate-800/30">
                  <td 
                    onClick={() => filteredDsrs[0] && handleOpenPreview(filteredDsrs[0], 'timing')}
                    className="py-1.5 px-3 font-bold text-slate-300 sticky left-0 bg-slate-900 border-r border-slate-800 hover:text-emerald-300 cursor-pointer transition-colors"
                    title="Click to preview usable footage"
                  >
                    Footage
                  </td>
                  {filteredDsrs.map(d => {
                    const isUnitShooting = getCategoryForUnitName(d.unitName || '') === 'Shooting Unit';
                    return (
                      <td 
                        key={d.id} 
                        onClick={() => handleOpenPreview(d, 'timing')}
                        className="py-1.5 px-2.5 text-center border-r border-slate-800/60 font-mono text-emerald-400 font-bold text-[10px] hover:bg-blue-950/40 cursor-pointer transition-colors"
                        title={`Click to preview ${d.dayCode} footage`}
                      >
                        {isUnitShooting ? `${d.usableFootageMinutes || 0} Min` : <span className="text-slate-600 font-normal">N/A</span>}
                      </td>
                    );
                  })}
                </tr>

                {/* Total Crew */}
                <tr className="hover:bg-slate-800/30">
                  <td 
                    onClick={() => filteredDsrs[0] && handleOpenPreview(filteredDsrs[0], 'crew')}
                    className="py-1.5 px-3 font-bold text-slate-300 sticky left-0 bg-slate-900 border-r border-slate-800 hover:text-purple-300 cursor-pointer transition-colors"
                    title="Click to preview crew headcount"
                  >
                    Total Crew
                  </td>
                  {filteredDsrs.map(d => (
                    <td 
                      key={d.id} 
                      onClick={() => handleOpenPreview(d, 'crew')}
                      className="py-1.5 px-2.5 text-center border-r border-slate-800/60 font-mono text-purple-300 font-bold text-[10px] hover:bg-blue-950/40 hover:text-purple-200 cursor-pointer transition-colors"
                      title={`Click to preview ${d.dayCode} crew breakdown`}
                    >
                      {d.totalPresentCrew}
                    </td>
                  ))}
                </tr>

                {/* Equipment Units */}
                <tr className="hover:bg-slate-800/30">
                  <td 
                    onClick={() => filteredDsrs[0] && handleOpenPreview(filteredDsrs[0], 'equipment')}
                    className="py-1.5 px-3 font-bold text-slate-300 sticky left-0 bg-slate-900 border-r border-slate-800 hover:text-blue-300 cursor-pointer transition-colors"
                    title="Click to preview equipment"
                  >
                    Equipment
                  </td>
                  {filteredDsrs.map(d => (
                    <td 
                      key={d.id} 
                      onClick={() => handleOpenPreview(d, 'equipment')}
                      className="py-1.5 px-2.5 text-center border-r border-slate-800/60 font-mono text-slate-300 text-[10px] hover:bg-blue-950/40 hover:text-blue-300 cursor-pointer transition-colors"
                      title={`Click to preview ${d.dayCode} equipment deployment`}
                    >
                      {d.totalEquipmentQty || 28}
                    </td>
                  ))}
                </tr>

                {/* Vehicles */}
                <tr className="hover:bg-slate-800/30">
                  <td 
                    onClick={() => filteredDsrs[0] && handleOpenPreview(filteredDsrs[0], 'transport')}
                    className="py-1.5 px-3 font-bold text-slate-300 sticky left-0 bg-slate-900 border-r border-slate-800 hover:text-blue-300 cursor-pointer transition-colors"
                    title="Click to preview transport & vehicles"
                  >
                    Vehicles
                  </td>
                  {filteredDsrs.map(d => (
                    <td 
                      key={d.id} 
                      onClick={() => handleOpenPreview(d, 'transport')}
                      className="py-1.5 px-2.5 text-center border-r border-slate-800/60 font-mono text-slate-300 text-[10px] hover:bg-blue-950/40 hover:text-blue-300 cursor-pointer transition-colors"
                      title={`Click to preview ${d.dayCode} vehicles and transport fleet`}
                    >
                      {d.totalVehicleQty || d.transportEntries?.reduce((sum, t) => sum + (t.actualQty ?? (t as any).qtyActual ?? 0), 0) || 0}
                    </td>
                  ))}
                </tr>

                {/* Gensets */}
                <tr className="hover:bg-slate-800/30">
                  <td 
                    onClick={() => filteredDsrs[0] && handleOpenPreview(filteredDsrs[0], 'genset')}
                    className="py-1.5 px-3 font-bold text-slate-300 sticky left-0 bg-slate-900 border-r border-slate-800 hover:text-amber-300 cursor-pointer transition-colors"
                    title="Click to preview gensets"
                  >
                    Gensets
                  </td>
                  {filteredDsrs.map(d => (
                    <td 
                      key={d.id} 
                      onClick={() => handleOpenPreview(d, 'genset')}
                      className="py-1.5 px-2.5 text-center border-r border-slate-800/60 font-mono text-slate-300 text-[10px] hover:bg-blue-950/40 hover:text-blue-300 cursor-pointer transition-colors"
                      title={`Click to preview ${d.dayCode} genset generators`}
                    >
                      {d.totalGensetQty || d.gensetEntries?.length || 0}
                    </td>
                  ))}
                </tr>

                {/* Vanity Vans */}
                <tr className="hover:bg-slate-800/30">
                  <td 
                    onClick={() => filteredDsrs[0] && handleOpenPreview(filteredDsrs[0], 'genset')}
                    className="py-1.5 px-3 font-bold text-slate-300 sticky left-0 bg-slate-900 border-r border-slate-800 hover:text-indigo-300 cursor-pointer transition-colors"
                    title="Click to preview vanity vans"
                  >
                    Vanity Vans
                  </td>
                  {filteredDsrs.map(d => (
                    <td 
                      key={d.id} 
                      onClick={() => handleOpenPreview(d, 'genset')}
                      className="py-1.5 px-2.5 text-center border-r border-slate-800/60 font-mono text-slate-300 text-[10px] hover:bg-blue-950/40 hover:text-blue-300 cursor-pointer transition-colors"
                      title={`Click to preview ${d.dayCode} vanity vans`}
                    >
                      {d.totalVanityQty || d.vanityEntries?.reduce((sum, v) => sum + (v.quantity ?? (v as any).count ?? 1), 0) || 0}
                    </td>
                  ))}
                </tr>

                {/* Fuel Used */}
                <tr className="hover:bg-slate-800/30">
                  <td 
                    onClick={() => filteredDsrs[0] && handleOpenPreview(filteredDsrs[0], 'genset')}
                    className="py-1.5 px-3 font-bold text-slate-300 sticky left-0 bg-slate-900 border-r border-slate-800 hover:text-amber-300 cursor-pointer transition-colors"
                    title="Click to preview fuel logs"
                  >
                    Fuel Used
                  </td>
                  {filteredDsrs.map(d => (
                    <td 
                      key={d.id} 
                      onClick={() => handleOpenPreview(d, 'genset')}
                      className="py-1.5 px-2.5 text-center border-r border-slate-800/60 font-mono text-amber-400 font-bold text-[10px] hover:bg-blue-950/40 hover:text-amber-300 cursor-pointer transition-colors"
                      title={`Click to preview ${d.dayCode} fuel usage & cost`}
                    >
                      {d.actualFuelTotal || d.calculatedFuelTotal || d.gensetEntries?.reduce((sum, g) => sum + (g.actualFuel || g.calculatedFuel || 0), 0) || 0} L
                    </td>
                  ))}
                </tr>

                {/* Breakfast */}
                <tr className="hover:bg-slate-800/30 text-[10px]">
                  <td 
                    onClick={() => filteredDsrs[0] && handleOpenPreview(filteredDsrs[0], 'food')}
                    className="py-1 px-3 font-medium text-slate-400 sticky left-0 bg-slate-900 border-r border-slate-800 pl-6 hover:text-blue-300 cursor-pointer transition-colors"
                    title="Click to preview breakfast counts"
                  >
                    Breakfast
                  </td>
                  {filteredDsrs.map(d => (
                    <td 
                      key={d.id} 
                      onClick={() => handleOpenPreview(d, 'food')}
                      className="py-1 px-2.5 text-center border-r border-slate-800/60 font-mono text-slate-300 hover:bg-blue-950/40 hover:text-blue-300 cursor-pointer transition-colors"
                      title={`Click to preview ${d.dayCode} catering counts`}
                    >
                      {d.breakfastCount}
                    </td>
                  ))}
                </tr>

                {/* Lunch */}
                <tr className="hover:bg-slate-800/30 text-[10px]">
                  <td 
                    onClick={() => filteredDsrs[0] && handleOpenPreview(filteredDsrs[0], 'food')}
                    className="py-1 px-3 font-medium text-slate-400 sticky left-0 bg-slate-900 border-r border-slate-800 pl-6 hover:text-blue-300 cursor-pointer transition-colors"
                    title="Click to preview lunch counts"
                  >
                    Lunch
                  </td>
                  {filteredDsrs.map(d => (
                    <td 
                      key={d.id} 
                      onClick={() => handleOpenPreview(d, 'food')}
                      className="py-1 px-2.5 text-center border-r border-slate-800/60 font-mono text-slate-300 hover:bg-blue-950/40 hover:text-blue-300 cursor-pointer transition-colors"
                      title={`Click to preview ${d.dayCode} catering counts`}
                    >
                      {d.lunchCount}
                    </td>
                  ))}
                </tr>

                {/* Snacks */}
                <tr className="hover:bg-slate-800/30 text-[10px]">
                  <td 
                    onClick={() => filteredDsrs[0] && handleOpenPreview(filteredDsrs[0], 'food')}
                    className="py-1 px-3 font-medium text-slate-400 sticky left-0 bg-slate-900 border-r border-slate-800 pl-6 hover:text-blue-300 cursor-pointer transition-colors"
                    title="Click to preview snacks counts"
                  >
                    Snacks
                  </td>
                  {filteredDsrs.map(d => (
                    <td 
                      key={d.id} 
                      onClick={() => handleOpenPreview(d, 'food')}
                      className="py-1 px-2.5 text-center border-r border-slate-800/60 font-mono text-slate-300 hover:bg-blue-950/40 hover:text-blue-300 cursor-pointer transition-colors"
                      title={`Click to preview ${d.dayCode} catering counts`}
                    >
                      {d.snacksCount}
                    </td>
                  ))}
                </tr>

                {/* Dinner */}
                <tr className="hover:bg-slate-800/30 text-[10px]">
                  <td 
                    onClick={() => filteredDsrs[0] && handleOpenPreview(filteredDsrs[0], 'food')}
                    className="py-1 px-3 font-medium text-slate-400 sticky left-0 bg-slate-900 border-r border-slate-800 pl-6 hover:text-blue-300 cursor-pointer transition-colors"
                    title="Click to preview dinner counts"
                  >
                    Dinner
                  </td>
                  {filteredDsrs.map(d => (
                    <td 
                      key={d.id} 
                      onClick={() => handleOpenPreview(d, 'food')}
                      className="py-1 px-2.5 text-center border-r border-slate-800/60 font-mono text-slate-300 hover:bg-blue-950/40 hover:text-blue-300 cursor-pointer transition-colors"
                      title={`Click to preview ${d.dayCode} catering counts`}
                    >
                      {d.dinnerCount}
                    </td>
                  ))}
                </tr>

                {/* Status */}
                <tr className="hover:bg-slate-800/30">
                  <td 
                    onClick={() => filteredDsrs[0] && handleOpenPreview(filteredDsrs[0], 'all')}
                    className="py-1.5 px-3 font-bold text-slate-300 sticky left-0 bg-slate-900 border-r border-slate-800 hover:text-blue-300 cursor-pointer transition-colors"
                    title="Click to preview DSR status"
                  >
                    Status
                  </td>
                  {filteredDsrs.map(d => (
                    <td 
                      key={d.id} 
                      onClick={() => handleOpenPreview(d, 'all')}
                      className="py-1.5 px-2.5 text-center border-r border-slate-800/60 hover:bg-blue-950/40 cursor-pointer transition-colors"
                      title={`Click to preview full DSR summary for ${d.dayCode}`}
                    >
                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase font-mono ${
                        d.status === 'Locked' ? 'bg-slate-800 text-slate-300 border border-slate-700' :
                        d.status === 'Approved' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' :
                        d.status === 'Submitted' ? 'bg-blue-950/80 text-blue-400 border border-blue-800' :
                        'bg-amber-950/80 text-amber-400 border border-amber-800'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Actions */}
                <tr className="bg-slate-950/60">
                  <td className="py-2 px-3 font-bold text-slate-400 sticky left-0 bg-slate-950 border-r border-slate-800">Actions</td>
                  {filteredDsrs.map(d => (
                    <td key={d.id} className="py-2 px-2 text-center border-r border-slate-800/60">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setDispatchDsr(d);
                              setIsDispatcherOpen(true);
                            }}
                            className="px-1.5 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded text-[9px] font-bold border border-emerald-800 cursor-pointer flex items-center gap-0.5"
                            title="Dispatch Call Sheet & DSR via WhatsApp / Email"
                          >
                            <Share2 className="w-2.5 h-2.5 text-emerald-400" /> Share
                          </button>
                          <button
                            onClick={() => handleOpenPreview(d, 'all')}
                            className="px-1.5 py-0.5 bg-blue-950 hover:bg-blue-900 text-blue-300 rounded text-[9px] font-bold border border-blue-800 cursor-pointer flex items-center gap-0.5"
                            title="Preview DSR Popup"
                          >
                            <Eye className="w-2.5 h-2.5 text-blue-400" /> Preview
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(d)}
                            className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[9px] font-bold border border-slate-700 cursor-pointer flex items-center gap-0.5"
                            title="Edit DSR"
                          >
                            <Edit3 className="w-2.5 h-2.5 text-slate-300" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDSR(d.id, d.dayCode)}
                            className="p-0.5 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                            title="Delete DSR"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleAddParallelUnit(d)}
                          className="px-1.5 py-0.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 rounded text-[8.5px] font-extrabold border border-indigo-800/80 cursor-pointer flex items-center gap-0.5 whitespace-nowrap"
                          title="Add parallel unit for this date"
                        >
                          <Plus className="w-2.5 h-2.5 text-indigo-400" /> + Unit
                        </button>
                        <button
                          onClick={() => handleOpenBookingModal(d, 'fuel')}
                          className="px-1.5 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded text-[8.5px] font-extrabold border border-emerald-800/80 cursor-pointer flex items-center gap-0.5 whitespace-nowrap"
                          title="Book Expense Voucher directly from this DSR"
                        >
                          <Receipt className="w-2.5 h-2.5 text-emerald-400" /> Book Exp
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODE 2: CARD VIEW */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDsrs.map(d => (
            <div 
              key={d.id} 
              className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xs p-4 flex flex-col justify-between gap-3 hover:border-blue-500/60 hover:ring-1 hover:ring-blue-500/30 transition-all cursor-pointer group"
              onClick={() => handleOpenPreview(d, 'all')}
            >
              <div className="flex justify-between items-start border-b border-slate-800 pb-2.5">
                <div>
                  <div className="text-lg font-black text-blue-400 group-hover:text-blue-300 font-mono flex items-center gap-1.5">
                    <span>{d.dayCode}</span>
                    <Eye className="w-4 h-4 text-blue-400 opacity-60 group-hover:opacity-100" />
                  </div>
                  <div className="text-xs text-slate-300 font-medium flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-500" /> {d.shootingDate}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {d.unitName || 'Main Unit'}
                    </span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase font-mono ${
                  d.status === 'Locked' ? 'bg-slate-800 text-slate-300 border border-slate-700' :
                  d.status === 'Approved' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' :
                  d.status === 'Submitted' ? 'bg-blue-950/80 text-blue-400 border border-blue-800' :
                  'bg-amber-950/80 text-amber-400 border border-amber-800'
                }`}>
                  {d.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-0.5 border-b border-slate-800/40">
                  <span className="text-slate-400 font-medium">Unit / Service:</span>
                  <span className="text-indigo-300 font-bold">{d.unitName || 'Main Unit'}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800/40">
                  <span className="text-slate-400 font-medium">Location:</span>
                  <span className="text-white font-bold">{d.primaryLocationName || 'Studio Floor 01'}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800/40">
                  <span className="text-slate-400 font-medium">Call Time:</span>
                  <span className="text-amber-300 font-mono font-semibold">{d.callTime}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800/40">
                  <span className="text-slate-400 font-medium">Pack-up:</span>
                  <span className="text-rose-300 font-mono font-semibold">{d.packupTime}</span>
                </div>
                {getCategoryForUnitName(d.unitName || '') === 'Shooting Unit' && (
                  <div className="flex justify-between py-0.5 border-b border-slate-800/40">
                    <span className="text-slate-400 font-medium">Usable Footage:</span>
                    <span className="text-emerald-400 font-mono font-bold">{d.usableFootageMinutes || 0} Minutes</span>
                  </div>
                )}
                <div className="flex justify-between py-0.5 border-b border-slate-800/40">
                  <span className="text-slate-400 font-medium">Crew Count:</span>
                  <span className="text-purple-300 font-mono font-bold">{d.totalPresentCrew}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800/40">
                  <span className="text-slate-400 font-medium">Vehicles &amp; Genset:</span>
                  <span className="text-slate-300 font-mono">
                    {d.totalVehicleQty || d.transportEntries?.reduce((sum, t) => sum + (t.actualQty ?? (t as any).qtyActual ?? 0), 0) || 0} Veh | {d.totalGensetQty || d.gensetEntries?.length || 0} Gen
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400 font-medium">Fuel Used:</span>
                  <span className="text-amber-400 font-mono font-bold">
                    {d.actualFuelTotal || d.calculatedFuelTotal || d.gensetEntries?.reduce((sum, g) => sum + (g.actualFuel || g.calculatedFuel || 0), 0) || 0} Litres
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-800" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => handleAddParallelUnit(d)}
                  className="px-2.5 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 rounded-lg text-xs font-bold border border-indigo-800 transition-all flex items-center gap-1 cursor-pointer"
                  title="Add another unit on this date"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" /> + Unit
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenPreview(d, 'all')}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg text-xs font-bold border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(d)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODE 3: CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-2xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-400" /> AUGUST 2026 SHOOTING SCHEDULE
            </h2>
            <div className="flex gap-2 text-[10px] font-mono">
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">Approved/Locked</span>
              <span className="px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-800 rounded">Submitted</span>
              <span className="px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 rounded">Draft</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="text-center text-[10px] font-black text-slate-500 py-1">
                {day}
              </div>
            ))}
            {/* Calendar Grid Cells */}
            {Array.from({ length: 31 }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `2026-08-${dayNum < 10 ? '0' + dayNum : dayNum}`;
              const dayDsrs = projectDsrs.filter(d => d.shootingDate === dateStr);
              const indianHol = getIndianHolidayForDate(dateStr);

              return (
                <div 
                  key={idx} 
                  className={`min-h-[110px] p-2 rounded-lg border flex flex-col justify-between transition-all ${
                    dayDsrs.length > 0
                      ? 'bg-slate-900/90 border-slate-700/80'
                      : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <div className="flex flex-col items-start gap-0.5 min-w-0">
                      <span className="text-xs font-bold text-slate-400 font-mono">{dayNum}</span>
                      {indianHol && (
                        <span className="text-[8px] leading-tight font-bold text-amber-300 bg-amber-950/90 px-1 py-0.2 rounded border border-amber-800/80 truncate max-w-[85px]" title={`${indianHol.title}: ${indianHol.description || ''}`}>
                          🇮🇳 {indianHol.title}
                        </span>
                      )}
                    </div>
                    {dayDsrs.length > 0 && (
                      <span className="text-[9px] font-extrabold text-indigo-300 font-mono bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800 shrink-0">
                        {dayDsrs.length} Unit{dayDsrs.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {dayDsrs.length > 0 ? (
                    <div className="mt-1 space-y-1 overflow-y-auto max-h-[90px]">
                      {dayDsrs.map(d => (
                        <div 
                          key={d.id} 
                          onClick={() => handleOpenPreview(d, 'all')}
                          className="p-1 rounded bg-slate-800/90 hover:bg-blue-950/60 border border-slate-700/60 hover:border-blue-500/50 text-[9px] cursor-pointer transition-all"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-indigo-300 truncate max-w-[85px]">{d.unitName || d.dayCode}</span>
                            {getCategoryForUnitName(d.unitName || '') === 'Shooting Unit' && (
                              <span className="text-[8px] text-emerald-400 font-mono font-bold">{d.usableFootageMinutes || 0}m</span>
                            )}
                          </div>
                          <div className="text-slate-400 truncate text-[8px]">{d.primaryLocationName || 'Studio'}</div>
                          <div className="mt-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={() => handleOpenPreview(d, 'all')}
                              className="w-1/2 py-0.5 bg-blue-950 hover:bg-blue-900 text-[8px] font-bold text-blue-300 rounded border border-blue-800 cursor-pointer"
                            >
                              Preview
                            </button>
                            <button 
                              onClick={() => handleOpenEditModal(d)}
                              className="w-1/2 py-0.5 bg-slate-700 hover:bg-slate-600 text-[8px] font-bold text-slate-100 rounded border border-slate-600 cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[9px] text-slate-600 italic">No shoot</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* POPUP PREVIEW MODAL (ON CLICK OF ANY COLUMN / ROW / CELL) */}
      {previewDsr && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in overflow-hidden">
          <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-3 text-slate-100 my-auto max-h-[92vh] overflow-hidden">
            {/* Modal Top Header */}
            <div className="shrink-0 flex justify-between items-start border-b border-slate-800 pb-3.5">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-blue-950/80 border border-blue-800/80 text-blue-400 shrink-0">
                  <Film className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-white font-mono tracking-tight">
                      {previewDsr.dayCode} — {previewDsr.unitName || 'Main Unit'}
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono tracking-wider ${
                      previewDsr.status === 'Locked' ? 'bg-slate-800 text-slate-300 border border-slate-700' :
                      previewDsr.status === 'Approved' ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800' :
                      previewDsr.status === 'Submitted' ? 'bg-blue-950/90 text-blue-300 border border-blue-800' :
                      'bg-amber-950/90 text-amber-300 border border-amber-800'
                    }`}>
                      {previewDsr.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-slate-300 font-semibold font-mono">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" /> {previewDsr.shootingDate}
                    </span>
                    <span>•</span>
                    <span className="text-slate-300 font-medium">{previewDsr.scheduleName || 'Schedule 01'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-300 font-medium truncate max-w-[200px]" title={previewDsr.primaryLocationName || previewDsr.locations?.[0]?.locationName || 'Studio Floor'}>
                      <MapPin className="w-3.5 h-3.5 text-rose-400" /> {previewDsr.primaryLocationName || previewDsr.locations?.[0]?.locationName || 'Studio Floor'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenBookingModal(previewDsr, 'all')}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Book Expense Voucher for this DSR"
                >
                  <Receipt className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Book Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Print Report"
                >
                  <Printer className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dsrToEdit = previewDsr;
                    setPreviewDsr(null);
                    handleOpenEditModal(dsrToEdit);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> <span>Edit DSR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDsr(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Metrics Summary Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 shrink-0">
              <div 
                onClick={() => setPreviewSection('timing')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  previewSection === 'timing' ? 'bg-blue-950/60 border-blue-500/80 ring-1 ring-blue-500/50' : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> Shift Timings
                </div>
                <div className="text-xs font-black text-amber-300 font-mono mt-0.5">
                  {previewDsr.callTime} – {previewDsr.packupTime}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {previewDsr.totalWorkingHours}h Work • {previewDsr.overtimeHours || 0}h OT
                </div>
              </div>

              <div 
                onClick={() => setPreviewSection('crew')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  previewSection === 'crew' ? 'bg-purple-950/60 border-purple-500/80 ring-1 ring-purple-500/50' : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-3 h-3 text-purple-400" /> Crew Present
                </div>
                <div className="text-xs font-black text-purple-300 font-mono mt-0.5">
                  {previewDsr.totalPresentCrew} Crew Members
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {previewDsr.totalPlannedCrew} Planned • {previewDsr.totalExtraCrew || 0} Extra
                </div>
              </div>

              <div 
                onClick={() => setPreviewSection('equipment')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  previewSection === 'equipment' ? 'bg-blue-950/60 border-blue-500/80 ring-1 ring-blue-500/50' : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-blue-400" /> Equipment
                </div>
                <div className="text-xs font-black text-slate-200 font-mono mt-0.5">
                  {previewDsr.totalEquipmentQty || previewDsr.equipmentEntries?.reduce((acc, e) => acc + (e.qtyActual || e.qtyPlanned || 0), 0) || 28} Units
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Camera, Lights &amp; Sound
                </div>
              </div>

              <div 
                onClick={() => setPreviewSection('transport')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  previewSection === 'transport' ? 'bg-indigo-950/60 border-indigo-500/80 ring-1 ring-indigo-500/50' : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Truck className="w-3 h-3 text-indigo-400" /> Vehicles Fleet
                </div>
                <div className="text-xs font-black text-indigo-300 font-mono mt-0.5">
                  {previewDsr.totalVehicleQty || previewDsr.transportEntries?.reduce((acc, t) => acc + (t.actualQty ?? (t as any).qtyActual ?? t.plannedQty ?? (t as any).qtyPlanned ?? 0), 0) || 0} Vehicles
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Transport &amp; Shuttles
                </div>
              </div>

              <div 
                onClick={() => setPreviewSection('genset')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  previewSection === 'genset' ? 'bg-amber-950/60 border-amber-500/80 ring-1 ring-amber-500/50' : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Fuel className="w-3 h-3 text-amber-400" /> Fuel &amp; Power
                </div>
                <div className="text-xs font-black text-amber-400 font-mono mt-0.5">
                  {previewDsr.actualFuelTotal || previewDsr.calculatedFuelTotal || previewDsr.gensetEntries?.reduce((sum, g) => sum + (g.actualFuel || g.calculatedFuel || 0), 0) || 0} Litres
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {previewDsr.totalGensetQty || previewDsr.gensetEntries?.length || 0} Gen • {previewDsr.totalVanityQty || previewDsr.vanityEntries?.reduce((sum, v) => sum + (v.quantity ?? (v as any).count ?? 1), 0) || 0} Vanity
                </div>
              </div>

              <div 
                onClick={() => setPreviewSection('food')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  previewSection === 'food' ? 'bg-emerald-950/60 border-emerald-500/80 ring-1 ring-emerald-500/50' : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Utensils className="w-3 h-3 text-emerald-400" /> Meals Served
                </div>
                <div className="text-xs font-black text-emerald-400 font-mono mt-0.5">
                  {previewDsr.totalFoodCount || ((previewDsr.breakfastCount || 0) + (previewDsr.lunchCount || 0) + (previewDsr.snacksCount || 0) + (previewDsr.dinnerCount || 0)) || 0} Total Plates
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  B: {previewDsr.breakfastCount || 0} | L: {previewDsr.lunchCount || 0} | D: {previewDsr.dinnerCount || 0}
                </div>
              </div>
            </div>

            {/* Navigation Tabs within Preview */}
            <div className="flex gap-1.5 border-b border-slate-800 pb-1.5 overflow-x-auto shrink-0 text-xs font-semibold">
              {[
                { id: 'all', label: 'Complete Overview', icon: FileText },
                { id: 'timing', label: 'Timings & Dept Calls', icon: Clock },
                { id: 'crew', label: `Crew Attendance (${previewDsr.totalPresentCrew || previewDsr.crewEntries?.reduce((sum, c) => sum + (c.presentCount ?? (c as any).countPresent ?? 0), 0) || 0})`, icon: Users },
                { id: 'equipment', label: `Equipment & Goods`, icon: Wrench },
                { id: 'transport', label: `Transport (${previewDsr.totalVehicleQty || previewDsr.transportEntries?.reduce((sum, t) => sum + (t.actualQty ?? (t as any).qtyActual ?? 0), 0) || 0})`, icon: Truck },
                { id: 'genset', label: `Genset & Fuel (${previewDsr.actualFuelTotal || previewDsr.calculatedFuelTotal || previewDsr.gensetEntries?.reduce((sum, g) => sum + (g.actualFuel || g.calculatedFuel || 0), 0) || 0}L)`, icon: Zap },
                { id: 'food', label: `Meals & Catering`, icon: Utensils },
                { id: 'notes', label: 'Notes & Logs', icon: Info }
              ].map(tab => {
                const IconComponent = tab.icon;
                const isActive = previewSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setPreviewSection(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700/80 hover:text-slate-200'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
              {/* TIMINGS & LOCATIONS SECTION */}
              {(previewSection === 'all' || previewSection === 'timing') && (
                <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-3.5 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-400" /> Day Timings, Shifts &amp; Department Calls
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      Total Working Hours: <strong className="text-white">{previewDsr.totalWorkingHours}h</strong> | Overtime: <strong className="text-amber-400">{previewDsr.overtimeHours || 0}h</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">Unit &amp; Operational Timings</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-slate-800/80">
                          <span className="text-slate-400 block text-[10px]">Call Time:</span>
                          <span className="font-mono font-bold text-amber-300 text-sm">{previewDsr.callTime}</span>
                        </div>
                        <div className="p-2 rounded bg-slate-800/80">
                          <span className="text-slate-400 block text-[10px]">Pack-up Time:</span>
                          <span className="font-mono font-bold text-rose-300 text-sm">{previewDsr.packupTime}</span>
                        </div>
                        <div className="p-2 rounded bg-slate-800/80">
                          <span className="text-slate-400 block text-[10px]">Total Hours:</span>
                          <span className="font-mono font-bold text-white text-sm">{previewDsr.totalWorkingHours} Hours</span>
                        </div>
                        <div className="p-2 rounded bg-slate-800/80 border border-slate-700/50">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 block text-[10px]">Footage Shot:</span>
                            <span className="text-[9px] text-slate-500 font-mono">
                              {getCategoryForUnitName(previewDsr.unitName || '') === 'Shooting Unit' ? 'Camera DIT' : 'Non-Shoot'}
                            </span>
                          </div>
                          {getCategoryForUnitName(previewDsr.unitName || '') === 'Shooting Unit' ? (
                            <span className="font-mono font-bold text-emerald-400 text-sm flex items-baseline gap-1">
                              {previewDsr.usableFootageMinutes || 0} <span className="text-xs font-normal text-slate-300">Min Usable</span>
                            </span>
                          ) : (
                            <span className="font-mono font-semibold text-slate-400 text-xs flex items-center gap-1">
                              N/A <span className="text-[10px] text-slate-500 font-normal">({previewDsr.unitName || 'Prep Unit'})</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {previewDsr.locations && previewDsr.locations.length > 0 && (
                        <div className="pt-2 border-t border-slate-800 space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Locations Visited ({previewDsr.locations.length})</div>
                          <div className="space-y-1">
                            {previewDsr.locations.map((loc, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-slate-800/60 px-2 py-1 rounded text-[11px]">
                                <span className="font-medium text-slate-200 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-rose-400" /> {loc.locationName}
                                </span>
                                <span className="text-slate-400 font-mono text-[10px]">
                                  {loc.startTime || previewDsr.callTime} – {loc.endTime || previewDsr.packupTime} ({loc.locationType})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center justify-between">
                        <span>Department Call Times</span>
                        <span className="text-[10px] text-slate-400 font-mono">{previewDsr.departmentCallTimes?.length || 0} logged</span>
                      </div>

                      {previewDsr.departmentCallTimes && previewDsr.departmentCallTimes.length > 0 ? (
                        <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                          {previewDsr.departmentCallTimes.map((dct, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-800/80 px-2 py-1 rounded border border-slate-700/60 text-[10px]">
                              <span className="font-semibold text-slate-200 truncate">{dct.department}</span>
                              <span className="font-mono text-amber-300 font-bold ml-1">{dct.callTime}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-slate-500 italic text-[11px]">
                          Standard unit call time applied across all departments.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CREW ATTENDANCE SECTION */}
              {(previewSection === 'all' || previewSection === 'crew') && (() => {
                const crewList = previewDsr.crewEntries || [];
                const totalPlanned = previewDsr.totalPlannedCrew || crewList.reduce((sum, c) => sum + (c.plannedCount ?? (c as any).countPlanned ?? 0), 0);
                const totalPresent = previewDsr.totalPresentCrew || crewList.reduce((sum, c) => sum + (c.presentCount ?? (c as any).countPresent ?? 0), 0);
                const totalAbsent = previewDsr.totalAbsentCrew || crewList.reduce((sum, c) => sum + (c.absentCount ?? (c as any).countAbsent ?? 0), 0);
                const totalExtra = previewDsr.totalExtraCrew || crewList.reduce((sum, c) => sum + (c.extraCount ?? (c as any).countExtra ?? 0), 0);

                // Sort so that active roles (present or planned > 0) are shown first
                const sortedCrewList = [...crewList].sort((a, b) => {
                  const aVal = (a.presentCount ?? (a as any).countPresent ?? 0) + (a.plannedCount ?? (a as any).countPlanned ?? 0);
                  const bVal = (b.presentCount ?? (b as any).countPresent ?? 0) + (b.plannedCount ?? (b as any).countPlanned ?? 0);
                  return bVal - aVal;
                });

                return (
                  <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-3.5 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-purple-400" /> Crew Attendance Breakdown
                      </h3>
                      <span className="text-[11px] font-mono text-purple-300 font-bold">
                        {totalPresent} Present / {totalPlanned} Planned ({totalAbsent} Absent, {totalExtra} Extra)
                      </span>
                    </div>

                    {sortedCrewList.length > 0 ? (
                      <div className="overflow-x-auto border border-slate-800 rounded-lg max-h-[320px]">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead className="sticky top-0 bg-slate-900 z-10">
                            <tr className="text-[10px] font-bold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                              <th className="py-2 px-2.5">Department</th>
                              <th className="py-2 px-2.5">Role / Designation</th>
                              <th className="py-2 px-2 text-center">Planned</th>
                              <th className="py-2 px-2 text-center text-emerald-400 font-bold">Present</th>
                              <th className="py-2 px-2 text-center text-rose-400">Absent</th>
                              <th className="py-2 px-2 text-center text-amber-400">Extra</th>
                              <th className="py-2 px-2.5">Shift / Call</th>
                              <th className="py-2 px-2.5">Vendor / Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-[11px]">
                            {sortedCrewList.map((crew, idx) => {
                              const planned = crew.plannedCount ?? (crew as any).countPlanned ?? 0;
                              const present = crew.presentCount ?? (crew as any).countPresent ?? 0;
                              const absent = crew.absentCount ?? (crew as any).countAbsent ?? 0;
                              const extra = crew.extraCount ?? (crew as any).countExtra ?? 0;
                              const isAttending = present > 0 || planned > 0;

                              return (
                                <tr key={idx} className={`hover:bg-slate-800/60 ${isAttending ? 'bg-slate-900/40' : 'opacity-60'}`}>
                                  <td className="py-1.5 px-2.5 font-bold text-indigo-300">{crew.department}</td>
                                  <td className="py-1.5 px-2.5 font-medium text-slate-200">{crew.designation || (crew as any).role || 'Crew Member'}</td>
                                  <td className="py-1.5 px-2 text-center font-mono text-slate-400">{planned}</td>
                                  <td className="py-1.5 px-2 text-center font-mono font-bold text-emerald-300">
                                    {present > 0 ? <span className="bg-emerald-950/80 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800/60">{present}</span> : <span className="text-slate-500">0</span>}
                                  </td>
                                  <td className="py-1.5 px-2 text-center font-mono text-rose-400">{absent}</td>
                                  <td className="py-1.5 px-2 text-center font-mono text-amber-400">{extra}</td>
                                  <td className="py-1.5 px-2.5 text-slate-300 font-mono text-[10px]">
                                    {crew.callTime ? `${crew.callTime}${crew.releaseTime ? ` – ${crew.releaseTime}` : ''}` : ((crew as any).shiftType || 'Full Day')}
                                  </td>
                                  <td className="py-1.5 px-2.5 text-slate-400 text-[10px]">{crew.remarks || (crew as any).vendorName || '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-slate-500 italic text-[11px]">
                        {totalPresent} crew members recorded in daily headcount.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* EQUIPMENT & GOODS SECTION */}
              {(previewSection === 'all' || previewSection === 'equipment' || previewSection === 'goods') && (() => {
                const eqList = previewDsr.equipmentEntries || [];
                const goodsList = previewDsr.goodsEntries || [];
                const totalEq = previewDsr.totalEquipmentQty || eqList.reduce((sum, e) => sum + (e.actualQty ?? (e as any).qtyActual ?? e.plannedQty ?? (e as any).qtyPlanned ?? 0), 0);

                return (
                  <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-3.5 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-blue-400" /> Equipment Usage &amp; Production Goods
                      </h3>
                      <span className="text-[11px] font-mono text-slate-300">
                        Total Equipment: <strong className="text-blue-400">{totalEq || 0} Units</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
                        <div className="text-[11px] font-bold text-blue-300 uppercase tracking-wider flex justify-between items-center">
                          <span>Equipment Items</span>
                          <span className="text-[10px] text-slate-400 font-mono">{eqList.length} items</span>
                        </div>
                        {eqList.length > 0 ? (
                          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                            {eqList.map((eq, idx) => {
                              const name = eq.name || (eq as any).itemName || 'Equipment';
                              const actual = eq.actualQty ?? (eq as any).qtyActual ?? eq.plannedQty ?? (eq as any).qtyPlanned ?? 1;
                              const planned = eq.plannedQty ?? (eq as any).qtyPlanned ?? actual;
                              const vendor = eq.vendor || (eq as any).vendorName;
                              return (
                                <div key={idx} className="flex justify-between items-center bg-slate-800/80 px-2.5 py-1.5 rounded border border-slate-700/60 text-[11px]">
                                  <div>
                                    <span className="font-bold text-slate-200">{name}</span>
                                    <span className="text-[9px] text-slate-400 ml-1.5">({eq.category || 'Gear'})</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-blue-300 font-bold">{actual} Unit{actual > 1 ? 's' : ''}</span>
                                    {vendor && <span className="text-[9px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">{vendor}</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-slate-500 italic text-[11px]">
                            Camera bodies, lenses, lighting packages, and grip gear logged.
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
                        <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex justify-between items-center">
                          <span>Production Goods &amp; Miscellaneous</span>
                          <span className="text-[10px] text-slate-400 font-mono">{goodsList.length} items</span>
                        </div>
                        {goodsList.length > 0 ? (
                          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                            {goodsList.map((g, idx) => {
                              const name = g.itemName || (g as any).name || 'Goods Item';
                              const qty = g.actualQty ?? (g as any).qty ?? g.plannedQty ?? (g as any).qtyPlanned ?? 1;
                              return (
                                <div key={idx} className="flex justify-between items-center bg-slate-800/80 px-2.5 py-1.5 rounded border border-slate-700/60 text-[11px]">
                                  <div>
                                    <span className="font-bold text-slate-200">{name}</span>
                                    {(g as any).category && <span className="text-[9px] text-slate-400 ml-1.5">({(g as any).category})</span>}
                                  </div>
                                  <span className="font-mono text-amber-300 font-bold">{qty} Pcs</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-slate-500 italic text-[11px]">
                            Tents, tables, chairs, walkie-talkies, and consumables deployed.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* TRANSPORT & FLEET SECTION */}
              {(previewSection === 'all' || previewSection === 'transport') && (() => {
                const transportList = previewDsr.transportEntries || [];
                const totalVehicles = previewDsr.totalVehicleQty || transportList.reduce((sum, t) => sum + (t.actualQty ?? (t as any).qtyActual ?? 0), 0);

                return (
                  <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-3.5 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-indigo-400" /> Transport &amp; Vehicles Fleet
                      </h3>
                      <span className="text-[11px] font-mono text-indigo-300 font-bold">
                        {totalVehicles} Vehicles Active
                      </span>
                    </div>

                    {transportList.length > 0 ? (
                      <div className="overflow-x-auto border border-slate-800 rounded-lg max-h-[260px]">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead className="sticky top-0 bg-slate-900 z-10">
                            <tr className="text-[10px] font-bold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                              <th className="py-2 px-2.5">Vehicle Type</th>
                              <th className="py-2 px-2 text-center">Planned</th>
                              <th className="py-2 px-2 text-center text-indigo-300 font-bold">Actual</th>
                              <th className="py-2 px-2.5">Vehicle / Driver</th>
                              <th className="py-2 px-2.5">Shift / Route</th>
                              <th className="py-2 px-2.5">Rate / Cost</th>
                              <th className="py-2 px-2.5">Vendor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-[11px]">
                            {transportList.map((t, idx) => {
                              const vType = t.vehicleType || (t as any).type || 'Vehicle';
                              const actual = t.actualQty ?? (t as any).qtyActual ?? 0;
                              const planned = t.plannedQty ?? (t as any).qtyPlanned ?? actual;
                              const vendor = t.vendor || (t as any).vendorName || 'Fleet Vendor';
                              const driver = t.driverName ? `${t.driverName} ${t.driverMobile ? `(${t.driverMobile})` : ''}` : '';

                              return (
                                <tr key={idx} className="hover:bg-slate-800/50">
                                  <td className="py-1.5 px-2.5 font-bold text-slate-200">
                                    {vType}
                                    {t.category && <span className="text-[9px] text-slate-400 block font-normal">{t.category}</span>}
                                  </td>
                                  <td className="py-1.5 px-2 text-center font-mono text-slate-400">{planned}</td>
                                  <td className="py-1.5 px-2 text-center font-mono font-bold text-indigo-300">
                                    <span className="bg-indigo-950/80 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/60">{actual}</span>
                                  </td>
                                  <td className="py-1.5 px-2.5 text-slate-300 font-mono text-[10px]">
                                    {t.vehicleNumber || driver || '—'}
                                  </td>
                                  <td className="py-1.5 px-2.5 text-slate-300 text-[10px]">
                                    {t.startTime && t.releaseTime ? `${t.startTime} – ${t.releaseTime}` : ((t as any).shift || 'Full Day')}
                                  </td>
                                  <td className="py-1.5 px-2.5 font-mono text-slate-300">
                                    {t.totalCost ? `₹${t.totalCost.toLocaleString('en-IN')}` : (t.rate ? `₹${t.rate.toLocaleString('en-IN')}` : '—')}
                                  </td>
                                  <td className="py-1.5 px-2.5 text-slate-400 text-[10px]">{vendor}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-slate-500 italic text-[11px]">
                        {totalVehicles} transport vehicles logged for this shoot day.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* GENSET, VANITY & FUEL SECTION */}
              {(previewSection === 'all' || previewSection === 'genset') && (() => {
                const genList = previewDsr.gensetEntries || [];
                const vanList = previewDsr.vanityEntries || [];
                const totalFuel = previewDsr.actualFuelTotal || previewDsr.calculatedFuelTotal || genList.reduce((sum, g) => sum + (g.actualFuel || g.calculatedFuel || 0), 0);

                return (
                  <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-3.5 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" /> Genset, Vanity Vans &amp; Diesel Fuel Log
                      </h3>
                      <span className="text-[11px] font-mono text-amber-300 font-bold">
                        {totalFuel || 0} Litres Diesel Used
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
                        <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Generators</span>
                          <span className="text-[10px] text-slate-400 font-mono">{previewDsr.totalGensetQty || genList.length || 0} Active</span>
                        </div>
                        {genList.length > 0 ? (
                          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                            {genList.map((gen, idx) => {
                              const capacity = gen.capacity || gen.name || (gen as any).kvaRating || 'Genset Unit';
                              const hours = gen.runningHours ?? (gen as any).runHours ?? 0;
                              const fuel = gen.actualFuel || gen.calculatedFuel || 0;
                              return (
                                <div key={idx} className="flex justify-between items-center bg-slate-800/80 px-2 py-1.5 rounded border border-slate-700/50 text-[11px]">
                                  <div>
                                    <span className="font-bold text-slate-200">{capacity}</span>
                                    {gen.vendor && <span className="text-[9px] text-slate-400 block">{gen.vendor}</span>}
                                  </div>
                                  <div className="text-right">
                                    <span className="font-mono text-amber-300 font-bold">{hours}h Run</span>
                                    {fuel > 0 && <span className="text-[9px] text-slate-400 block font-mono">{fuel}L fuel</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-slate-500 italic text-[11px]">
                            {previewDsr.totalGensetQty || 0} generator sets deployed on location.
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
                        <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1"><Film className="w-3.5 h-3.5" /> Vanity Vans</span>
                          <span className="text-[10px] text-slate-400 font-mono">{previewDsr.totalVanityQty || vanList.length || 0} Active</span>
                        </div>
                        {vanList.length > 0 ? (
                          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                            {vanList.map((van, idx) => {
                              const vType = van.type || (van as any).vanType || 'Vanity Van';
                              const qty = van.quantity ?? (van as any).count ?? 1;
                              return (
                                <div key={idx} className="flex justify-between items-center bg-slate-800/80 px-2 py-1.5 rounded border border-slate-700/50 text-[11px]">
                                  <div>
                                    <span className="font-bold text-slate-200">{vType}</span>
                                    {van.assignedTo && <span className="text-[9px] text-slate-400 block">Assigned: {van.assignedTo}</span>}
                                  </div>
                                  <span className="font-mono text-indigo-300 font-bold">{qty} Unit{qty > 1 ? 's' : ''}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-slate-500 italic text-[11px]">
                            {previewDsr.totalVanityQty || 0} artist/cast vanity vans deployed.
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
                        <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                          <Fuel className="w-3.5 h-3.5" /> Fuel &amp; Energy Balance
                        </div>
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between bg-slate-800/80 px-2 py-1 rounded">
                            <span className="text-slate-400">Total Fuel Logged:</span>
                            <span className="font-mono font-bold text-amber-300">{totalFuel || 0} Litres</span>
                          </div>
                          <div className="flex justify-between bg-slate-800/80 px-2 py-1 rounded">
                            <span className="text-slate-400">Estimated Cost:</span>
                            <span className="font-mono font-bold text-emerald-400">₹{((totalFuel || 0) * 94).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* FOOD & CATERING SECTION */}
              {(previewSection === 'all' || previewSection === 'food') && (() => {
                const foodList = previewDsr.foodEntries || [];
                const totalPlates = previewDsr.totalFoodCount || ((previewDsr.breakfastCount || 0) + (previewDsr.lunchCount || 0) + (previewDsr.snacksCount || 0) + (previewDsr.dinnerCount || 0)) || foodList.reduce((sum, f) => sum + (f.actualCount ?? f.plannedCount ?? 0), 0);

                return (
                  <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-3.5 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Utensils className="w-4 h-4 text-emerald-400" /> Daily Food &amp; Catering Logs
                      </h3>
                      <span className="text-[11px] font-mono text-emerald-300 font-bold">
                        {totalPlates || 0} Plates Total
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Breakfast</div>
                        <div className="text-base font-black font-mono text-white mt-1">{previewDsr.breakfastCount || 0}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Morning Crew &amp; Cast</div>
                      </div>

                      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lunch</div>
                        <div className="text-base font-black font-mono text-emerald-400 mt-1">{previewDsr.lunchCount || 0}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Main Unit Meal</div>
                      </div>

                      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evening Snacks &amp; Tea</div>
                        <div className="text-base font-black font-mono text-amber-300 mt-1">{previewDsr.snacksCount || 0}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Tea Break &amp; Snacks</div>
                      </div>

                      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dinner / Pack-up Meal</div>
                        <div className="text-base font-black font-mono text-rose-300 mt-1">{previewDsr.dinnerCount || 0}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Late Shift &amp; Packup</div>
                      </div>
                    </div>

                    {foodList.length > 0 && (
                      <div className="pt-2 border-t border-slate-800 overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-slate-900 text-[10px] font-bold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                              <th className="py-1.5 px-2">Meal</th>
                              <th className="py-1.5 px-2 text-center">Planned</th>
                              <th className="py-1.5 px-2 text-center text-emerald-400">Actual</th>
                              <th className="py-1.5 px-2 text-center">Veg/Non-Veg</th>
                              <th className="py-1.5 px-2 font-mono">Rate/Plate</th>
                              <th className="py-1.5 px-2 font-mono">Total Cost</th>
                              <th className="py-1.5 px-2">Vendor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-[11px]">
                            {foodList.map((f, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/50">
                                <td className="py-1 px-2 font-bold text-slate-200">{f.mealType}</td>
                                <td className="py-1 px-2 text-center font-mono text-slate-400">{f.plannedCount || 0}</td>
                                <td className="py-1 px-2 text-center font-mono font-bold text-emerald-300">{f.actualCount || 0}</td>
                                <td className="py-1 px-2 text-center text-slate-400 text-[10px]">{f.vegCount || 0}V / {f.nonVegCount || 0}NV</td>
                                <td className="py-1 px-2 font-mono text-slate-300">{f.ratePerPlate ? `₹${f.ratePerPlate}` : '—'}</td>
                                <td className="py-1 px-2 font-mono font-bold text-emerald-400">{f.totalCost ? `₹${f.totalCost.toLocaleString('en-IN')}` : '—'}</td>
                                <td className="py-1 px-2 text-slate-400 text-[10px]">{f.vendor || 'Catering Team'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* NOTES & REMARKS SECTION */}
              {(previewSection === 'all' || previewSection === 'notes') && (
                <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-3.5 space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-blue-400" /> Production Notes &amp; Observations
                    </h3>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed min-h-[60px]">
                    {previewDsr.productionNotes || (
                      <span className="text-slate-500 italic">No special production incidents or remarks recorded for this shooting day.</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Footer */}
            <div className="shrink-0 flex justify-between items-center pt-3 border-t border-slate-800 text-xs">
              <div className="text-slate-400 flex items-center gap-2">
                <span className="font-mono text-slate-500">ID: {previewDsr.id}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDsr(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg border border-slate-700 transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dsrToEdit = previewDsr;
                    setPreviewDsr(null);
                    handleOpenEditModal(dsrToEdit);
                  }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Full DSR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. ADD / EDIT SHOOTING DAY FULL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in overflow-hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-4 sm:p-5 shadow-2xl flex flex-col gap-3 text-slate-100 my-auto max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="shrink-0 flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-blue-400" />
                  {editingDsrId 
                    ? `Edit Day ${formDayNumber < 10 ? '0' + formDayNumber : formDayNumber} — ${formUnitName}` 
                    : `Add DSR — ${formUnitName}`}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Record operational logs, crew headcount, transport, equipment, fuel &amp; meal counts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white font-bold cursor-pointer p-1 rounded-lg hover:bg-slate-800 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tab Navigation */}
            <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto custom-scrollbar border-b border-slate-800 pb-2 text-xs font-semibold min-h-[44px]">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`shrink-0 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'info' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                1. Day, Location &amp; Timing
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('crew')}
                className={`shrink-0 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'crew' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>2. Crew</span>
                <span className="px-1.5 py-0.2 bg-slate-950/80 rounded text-[10px] font-mono">{formTotalPresentCrew}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('equipment')}
                className={`shrink-0 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'equipment' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>3. Equipment</span>
                <span className="px-1.5 py-0.2 bg-slate-950/80 rounded text-[10px] font-mono">{formEquipment.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('goods')}
                className={`shrink-0 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'goods' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>4. Production Goods</span>
                <span className="px-1.5 py-0.2 bg-slate-950/80 rounded text-[10px] font-mono">{formGoods.reduce((sum, g) => sum + (g.actualQty || 0), 0)}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('transport')}
                className={`shrink-0 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'transport' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>5. Transport</span>
                <span className="px-1.5 py-0.2 bg-slate-950/80 rounded text-[10px] font-mono">{formTransport.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('genset')}
                className={`shrink-0 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'genset' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                6. Genset &amp; Vanity
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('food')}
                className={`shrink-0 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'food' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                7. Food Count
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`shrink-0 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'notes' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                8. Daily Notes
              </button>
            </div>

            {/* TAB CONTENT SECTIONS */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3 text-xs">
              {/* TAB 1: DAY, LOCATION & TIMING */}
              {activeTab === 'info' && (
                <div className="space-y-2.5 animate-fade-in">
                  {/* 1. Production Unit Details Card (FIRST) */}
                  <div className="p-2.5 bg-indigo-950/30 rounded-lg border border-indigo-900/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-400" /> Production Unit / Service Details
                      </div>
                      <span className="text-[10px] text-indigo-300 font-mono bg-indigo-900/60 px-1.5 py-0.5 rounded border border-indigo-800/80 font-medium">
                        Parallel Units Supported
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 mb-0.5 block">Unit Preset / Quick Select</label>
                        <select
                          value={formUnitCategory}
                          onChange={e => handleCategoryChange(e.target.value)}
                          className="w-full h-7 px-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          {ALL_UNIT_PRESET_CATEGORIES.map(cat => (
                            <option key={cat} value={cat} className="bg-slate-900 text-slate-100 text-xs font-semibold">{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 mb-0.5 flex items-center justify-between">
                          <span>Unit / Service Name *</span>
                          {formUnitCategory !== 'Custom' && (
                            <span className="text-[9px] text-indigo-400 font-medium lowercase">
                              {formUnitCategory}
                            </span>
                          )}
                        </label>
                        {formUnitCategory === 'Custom' || isCustomSubUnit ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              placeholder="e.g. 01 - 1st Unit / Set Construction Unit 1 / Recee Unit 1"
                              value={formUnitName}
                              onChange={e => handleCustomUnitNameChange(e.target.value)}
                              className="w-full h-7 px-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 font-semibold text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              required
                            />
                            {formUnitCategory !== 'Custom' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCustomSubUnit(false);
                                  const subUnits = UNIT_PRESET_CATEGORIES[formUnitCategory] || [];
                                  const availableSub = subUnits.find(u => !unitsTakenOnSelectedDate.has(u.trim().toLowerCase())) || subUnits[0] || '01 - 1st Unit';
                                  handleUnitChange(availableSub);
                                }}
                                className="h-7 px-2 bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-200 border border-indigo-700/70 rounded text-[10px] font-semibold whitespace-nowrap cursor-pointer"
                              >
                                Options
                              </button>
                            )}
                          </div>
                        ) : (
                          <select
                            value={formUnitName}
                            onChange={e => {
                              if (e.target.value === '__CUSTOM__') {
                                setIsCustomSubUnit(true);
                              } else {
                                handleUnitChange(e.target.value);
                              }
                            }}
                            className={`w-full h-7 px-2.5 bg-slate-800/90 border ${isUnitTakenOnDate ? 'border-rose-500 text-rose-300 ring-1 ring-rose-500' : 'border-slate-700/80 text-slate-100'} text-xs font-semibold rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer`}
                          >
                            {(UNIT_PRESET_CATEGORIES[formUnitCategory] || []).map(subUnit => {
                              const isTaken = unitsTakenOnSelectedDate.has(subUnit.trim().toLowerCase());
                              return (
                                <option 
                                  key={subUnit} 
                                  value={subUnit}
                                  disabled={isTaken && subUnit !== formUnitName}
                                  className={isTaken ? 'text-slate-500 bg-slate-900 text-xs font-semibold' : 'text-slate-100 bg-slate-900 text-xs font-semibold'}
                                >
                                  {subUnit}{isTaken ? ' — (Already recorded on this date)' : ''}
                                </option>
                              );
                            })}
                            <option value="__CUSTOM__" className="bg-slate-900 text-indigo-300 text-xs font-semibold">+ Custom Unit Name...</option>
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Same-Unit Duplicate Conflict Alert */}
                    {isUnitTakenOnDate && (
                      <div className="p-2 bg-rose-950/80 border border-rose-600/80 rounded-md text-rose-200 text-[11px] flex items-start gap-2 animate-fade-in mt-1">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-rose-200">
                            Same Unit Duplicate Not Permitted
                          </div>
                          <div className="text-[10px] text-rose-300/90 leading-tight mt-0.5">
                            A record for <strong className="text-white font-mono">{formUnitName}</strong> already exists on <strong className="text-white font-mono">{formShootingDate}</strong>. Different unit presets (e.g. 2nd Unit, Recee Unit, Set Construction) can shoot on the same day, but duplicate DSRs for the same unit cannot be saved on the same day. Please select a different unit or date.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Top Bar: Shooting Day, Schedule, Date (SECOND) */}
                  <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 mb-0.5 flex items-center justify-between gap-1">
                        <span className="text-blue-300 font-bold tracking-tight truncate" title={getShootingDayLabel(formUnitName, formUnitCategory)}>
                          {getShootingDayLabel(formUnitName, formUnitCategory)}
                        </span>
                        <span className="text-[9px] text-indigo-400 font-mono font-medium lowercase shrink-0 px-1 py-0.2 bg-indigo-950/70 border border-indigo-800/60 rounded">
                          auto-count
                        </span>
                      </label>
                      <input 
                        type="number" 
                        value={formDayNumber} 
                        onChange={e => setFormDayNumber(Number(e.target.value))} 
                        className="w-full h-7 px-2.5 bg-slate-800/90 border border-slate-700/80 text-white font-mono font-bold text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 block">Schedule *</label>
                      <input 
                        type="text" 
                        value={formScheduleName} 
                        onChange={e => setFormScheduleName(e.target.value)} 
                        className="w-full h-7 px-2.5 bg-slate-800/90 border border-slate-700/80 text-white font-semibold text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 block truncate" title={getDateLabel(formUnitName, formUnitCategory)}>
                        {getDateLabel(formUnitName, formUnitCategory)}
                      </label>
                      <input 
                        type="date" 
                        value={formShootingDate} 
                        onChange={e => setFormShootingDate(e.target.value)} 
                        className="w-full h-7 px-2.5 bg-slate-800/90 border border-slate-700/80 text-white font-mono text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                        required 
                      />
                    </div>
                  </div>

                  {/* 3. Location Details Card */}
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" /> Location Details
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 mb-0.5 block">Primary Location Name *</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Studio Floor 01 / Bolpur Palace" 
                          value={formLocationName} 
                          onChange={e => setFormLocationName(e.target.value)} 
                          className="w-full h-7 px-2.5 bg-slate-800/90 border border-slate-700/80 text-white text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 mb-0.5 block">Location Type</label>
                        <select 
                          value={formLocationType} 
                          onChange={e => setFormLocationType(e.target.value)} 
                          className="w-full h-7 px-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 text-xs font-semibold rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          {['Studio', 'Indoor', 'Outdoor', 'House', 'Office', 'Road', 'Forest', 'River', 'Beach', 'Palace', 'School', 'Hospital', 'Other'].map(t => (
                            <option key={t} value={t} className="bg-slate-900 text-slate-100 text-xs font-semibold">{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Shift Call Times & Footage Duration Card */}
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-slate-800/80">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Shift Call Times {isShootingUnitSelected ? '& Footage Duration' : ''}
                      </div>

                      <div className="flex items-center flex-wrap gap-1.5 shrink-0">
                        {formDepartmentCallTimes.length > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSyncAllDepartmentCallTimes()}
                              className="h-7 px-2.5 bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white text-[11px] font-semibold rounded-md border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-xs"
                              title="Sync all department call times to match Main Unit Call Time"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Sync Main Call
                            </button>
                            <button
                              type="button"
                              onClick={handleApplyStaggeredOffsets}
                              className="h-7 px-2.5 bg-purple-950/60 hover:bg-purple-900/70 active:scale-95 text-purple-200 text-[11px] font-semibold rounded-md border border-purple-800/60 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-xs"
                              title="Apply standard staggered prep offsets"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-purple-300" /> Staggered Presets
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={handleAddDepartmentCall}
                          className="h-7 px-2.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-[11px] font-semibold rounded-md flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                          title="Add a department call time (e.g. Camera, Lighting, Direction, Makeup)"
                        >
                          <Plus className="w-3.5 h-3.5 shrink-0" /> Add Department Call
                        </button>
                      </div>
                    </div>

                    {/* Main Unit Call Time Row (4 Columns) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 block">Main Unit Call Time</label>
                        <input 
                          type="text" 
                          value={formCallTime} 
                          onChange={e => handleMainCallTimeChange(e.target.value)} 
                          placeholder="06:00 AM"
                          className="w-full h-7 px-2.5 bg-slate-800/90 border border-slate-700/80 text-amber-300 font-mono font-bold text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 block">Pack-up Time</label>
                        <input 
                          type="text" 
                          value={formPackupTime} 
                          onChange={e => handleMainPackupTimeChange(e.target.value)} 
                          placeholder="09:00 PM"
                          className="w-full h-7 px-2.5 bg-slate-800/90 border border-slate-700/80 text-rose-300 font-mono font-bold text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center justify-between">
                          <span>Working Hours</span>
                          <span className="text-[9px] text-blue-400 font-normal lowercase">auto-calc</span>
                        </label>
                        <input 
                          type="number" 
                          step="any"
                          value={formWorkingHours} 
                          onChange={e => handleMainWorkingHoursChange(Number(e.target.value))} 
                          className="w-full h-7 px-2.5 bg-slate-800/90 border border-slate-700/80 text-white font-mono text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center justify-between">
                          <span>Overtime (Hours)</span>
                          <span className="text-[9px] text-amber-400 font-semibold lowercase">manual input</span>
                        </label>
                        <input 
                          type="number" 
                          step="any"
                          min="0"
                          value={formOvertime} 
                          onChange={e => setFormOvertime(Number(e.target.value))} 
                          className="w-full h-7 px-2.5 bg-slate-800/90 border border-slate-700/80 text-amber-300 font-mono font-bold text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500" 
                        />
                      </div>
                    </div>

                    {/* Additional Department Call Rows (4 Columns Each) */}
                    {formDepartmentCallTimes.map((dept) => {
                      const isCustom = !DEPARTMENT_OPTIONS.filter(o => o !== 'Custom Department').includes(dept.department);
                      return (
                        <div key={dept.id} className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-800/60 items-start">
                          {/* Column 1: Dropdown Department & Call Time */}
                          <div>
                            <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-0.5 block truncate" title={getDepartmentTag(dept.department)}>
                              {getDepartmentTag(dept.department)}
                            </label>
                            <div className="grid grid-cols-2 gap-1">
                              <select
                                value={isCustom ? 'Custom Department' : dept.department}
                                onChange={e => {
                                  if (e.target.value === 'Custom Department') {
                                    const customName = prompt('Enter custom department name:', 'Grip Call');
                                    if (customName) {
                                      handleUpdateDepartmentCallTime(dept.id, { department: customName });
                                    }
                                  } else {
                                    handleUpdateDepartmentCallTime(dept.id, { department: e.target.value });
                                  }
                                }}
                                className="w-full h-7 px-2 bg-slate-800/90 border border-slate-700/80 text-slate-100 text-xs font-semibold rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 truncate cursor-pointer"
                              >
                                {DEPARTMENT_OPTIONS.map(opt => (
                                  <option key={opt} value={opt} className="bg-slate-900 text-slate-100 text-xs font-semibold">{opt}</option>
                                ))}
                                {isCustom && (
                                  <option value={dept.department} className="bg-slate-900 text-slate-100 text-xs font-semibold">{dept.department}</option>
                                )}
                              </select>
                              <input 
                                type="text" 
                                value={dept.callTime} 
                                onChange={e => handleUpdateDepartmentCallTime(dept.id, { callTime: e.target.value })} 
                                placeholder="05:30 AM"
                                className="w-full h-7 px-2 bg-slate-800/90 border border-slate-700/80 text-amber-300 font-mono font-bold text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500" 
                              />
                            </div>
                          </div>

                          {/* Column 2: Pack-up Time */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 block">Pack-up Time</label>
                            <input 
                              type="text" 
                              value={dept.packupTime || ''} 
                              onChange={e => handleUpdateDepartmentCallTime(dept.id, { packupTime: e.target.value })} 
                              placeholder="09:00 PM"
                              className="w-full h-7 px-2.5 bg-slate-800/90 border border-slate-700/80 text-rose-300 font-mono font-bold text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500" 
                            />
                          </div>

                          {/* Column 3: Working Hours */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center justify-between">
                              <span>Working Hours</span>
                              <span className="text-[9px] text-blue-400 font-normal lowercase">auto-calc</span>
                            </label>
                            <input 
                              type="number" 
                              step="any"
                              value={dept.workingHours ?? formWorkingHours ?? 12} 
                              onChange={e => handleUpdateDepartmentCallTime(dept.id, { workingHours: Number(e.target.value) })} 
                              className="w-full h-7 px-2.5 bg-slate-800/90 border border-slate-700/80 text-white font-mono text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold" 
                            />
                          </div>

                          {/* Column 4: Overtime Hours & Delete Action */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center justify-between">
                              <span>Overtime (Hours)</span>
                              <span className="text-[9px] text-amber-400 font-semibold lowercase">manual input</span>
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="number" 
                                step="any"
                                min="0"
                                value={dept.overtimeHours ?? 0} 
                                onChange={e => handleUpdateDepartmentCallTime(dept.id, { overtimeHours: Number(e.target.value) })} 
                                className="w-full h-7 px-2.5 bg-slate-800/90 border border-slate-700/80 text-amber-300 font-mono font-bold text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500" 
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteDepartmentCallTime(dept.id)}
                                className="h-7 w-7 shrink-0 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-slate-800 border border-slate-700/60 rounded-md transition-colors cursor-pointer"
                                title="Delete Department Call"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Usable Footage Duration (Only displayed for Shooting Unit presets) */}
                    {isShootingUnitSelected && (
                      <div className="pt-2 border-t border-slate-800/80 animate-fade-in">
                        <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">
                          Usable Footage Duration (Minutes)
                        </label>
                        <input 
                          type="number" 
                          min="0"
                          value={formUsableFootage} 
                          onChange={e => setFormUsableFootage(Math.max(0, Number(e.target.value)))} 
                          placeholder="e.g. 15"
                          className="w-full h-7 px-2.5 bg-slate-800/90 border border-slate-700/80 text-emerald-300 font-mono font-bold text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: CREW DETAILS (FORM BASED / HEADS COUNT) */}
              {activeTab === 'crew' && (
                <div className="space-y-2.5 animate-fade-in">
                  {/* Crew Header Controls */}
                  <div className="flex flex-wrap justify-between items-center gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1.5" />
                      <input
                        type="text"
                        placeholder="Search designation or department..."
                        value={crewSearch}
                        onChange={e => setCrewSearch(e.target.value)}
                        className="w-full h-5 pl-7 pr-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 text-[10px] focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Unit Preset Filter Indicator & Toggle */}
                      {currentEffectiveCrewPresetCategory !== 'Shooting Unit' && currentEffectiveCrewPresetCategory !== 'Custom' && (
                        <button
                          type="button"
                          onClick={() => setShowAllCrewDepts(!showAllCrewDepts)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer border flex items-center gap-1 transition-colors ${
                            !showAllCrewDepts
                              ? 'bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 border-indigo-700/80 shadow-xs'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                          title={!showAllCrewDepts ? `Showing ${currentEffectiveCrewPresetCategory} relevant roles. Click to show all departments.` : 'Click to filter by preset'}
                        >
                          <Filter className="w-2.5 h-2.5" />
                          <span>{!showAllCrewDepts ? `Preset: ${currentEffectiveCrewPresetCategory}` : 'Show Preset Only'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const allCollapsed = STANDARD_CREW_DEPARTMENTS.reduce((acc, d) => ({ ...acc, [d.department]: true }), {});
                          setCollapsedDepts(allCollapsed);
                        }}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded cursor-pointer border border-slate-700"
                      >
                        Collapse All
                      </button>
                      <button
                        type="button"
                        onClick={() => setCollapsedDepts({})}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded cursor-pointer border border-slate-700"
                      >
                        Expand All
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomCrewRow}
                        className="px-2.5 py-0.5 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold rounded cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3 h-3" /> Add Custom Crew
                      </button>
                    </div>
                  </div>

                  {/* Standard Crew Departments Accordion Form */}
                  <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                    {STANDARD_CREW_DEPARTMENTS.map(deptObj => {
                      const q = crewSearch.trim().toLowerCase();
                      const isFilteredByPreset = !showAllCrewDepts && !q;

                      // Check if this department belongs to the selected unit preset
                      const isDeptInPreset = presetCrewConfig.departmentNames.includes(deptObj.department);

                      // Calculate present headcount in this department
                      const deptTotalPresent = deptObj.designations.reduce((acc, desig) => {
                        const key = `${deptObj.department.trim().toLowerCase()}:::${desig.trim().toLowerCase()}`;
                        return acc + (crewLookupMap.get(key) || 0);
                      }, 0);

                      // If filtered by preset, department is not in preset, and no heads entered, hide it
                      if (isFilteredByPreset && !isDeptInPreset && deptTotalPresent === 0) {
                        return null;
                      }

                      // Filter designations in this department
                      const filteredDesignations = deptObj.designations.filter(desig => {
                        if (q) {
                          const matchesDeptName = deptObj.department.toLowerCase().includes(q);
                          return matchesDeptName || desig.toLowerCase().includes(q);
                        }

                        if (!isFilteredByPreset) return true;

                        const key = `${deptObj.department.trim().toLowerCase()}:::${desig.trim().toLowerCase()}`;
                        const currentVal = crewLookupMap.get(key) || 0;
                        if (currentVal > 0) return true; // Always retain any role that has recorded count

                        const allowedDesigs = presetCrewConfig.designationFilter?.[deptObj.department];
                        if (!allowedDesigs) return true; // all designations in this dept allowed
                        return allowedDesigs.includes(desig);
                      });

                      if (filteredDesignations.length === 0 && deptTotalPresent === 0) return null;

                      const isCollapsed = Boolean(collapsedDepts[deptObj.department]);

                      return (
                        <div key={deptObj.department} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60">
                          {/* Department Bar */}
                          <div 
                            onClick={() => setCollapsedDepts(prev => ({ ...prev, [deptObj.department]: !prev[deptObj.department] }))}
                            className="flex justify-between items-center px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800/90 cursor-pointer border-b border-slate-800/80 transition-colors"
                          >
                            <div className="flex items-center gap-1.5">
                              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-purple-400" /> : <ChevronDown className="w-3.5 h-3.5 text-purple-400" />}
                              <span className="font-bold text-slate-200 text-[11px] tracking-tight">{deptObj.department}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                deptTotalPresent > 0 
                                   ? 'bg-purple-950 text-purple-300 border-purple-800/80' 
                                  : 'bg-slate-800/80 text-slate-400 border-slate-700'
                              }`}>
                                {deptTotalPresent} Heads
                              </span>
                            </div>
                          </div>

                          {/* Designations Compact Multi-Column Grid */}
                          {!isCollapsed && (
                            <div className="p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 bg-slate-950/40">
                              {filteredDesignations.map(desig => {
                                const key = `${deptObj.department.trim().toLowerCase()}:::${desig.trim().toLowerCase()}`;
                                const currentVal = crewLookupMap.get(key) || 0;

                                return (
                                  <div 
                                    key={desig} 
                                    className={`flex items-center justify-between p-1 px-1.5 rounded-md border transition-all ${
                                      currentVal > 0 
                                        ? 'bg-indigo-950/50 border-indigo-600/70 shadow-xs' 
                                        : 'bg-slate-900/40 border-slate-800/90 hover:border-slate-700'
                                    }`}
                                  >
                                    <span className={`text-[10px] font-medium leading-tight truncate pr-1 ${
                                      currentVal > 0 ? 'text-indigo-200 font-bold' : 'text-slate-300'
                                    }`} title={desig}>
                                      {desig}
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <input
                                        type="number"
                                        min="0"
                                        value={currentVal || ''}
                                        placeholder="0"
                                        onChange={e => handleCrewHeadChange(deptObj.department, desig, Number(e.target.value))}
                                        className={`w-10 h-5 text-center font-mono font-bold text-[10px] rounded border focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                                          currentVal > 0 
                                            ? 'bg-indigo-900/90 border-indigo-400 text-white' 
                                            : 'bg-slate-800 border-slate-700 text-slate-300'
                                        }`}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Custom / Additional Unlisted Crew Section */}
                    {customCrewList.length > 0 && (
                      <div className="border border-purple-900/60 rounded-lg overflow-hidden bg-purple-950/20 mt-2">
                        <div className="px-2.5 py-1 bg-purple-950/60 flex justify-between items-center border-b border-purple-900/60">
                          <span className="font-bold text-purple-300 text-[11px] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-400" /> Custom / Additional Crew ({customCrewList.length})
                          </span>
                          <button
                            type="button"
                            onClick={handleAddCustomCrewRow}
                            className="px-2 py-0.2 bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-bold rounded cursor-pointer"
                          >
                            + Add Custom
                          </button>
                        </div>
                        <div className="p-1.5 space-y-1.5">
                          {customCrewList.map((c, idx) => {
                            const actualIdx = formCrew.findIndex(x => x.id === c.id);
                            return (
                              <div key={c.id} className="grid grid-cols-12 gap-1.5 items-center bg-slate-900/80 p-1.5 rounded-md border border-slate-800">
                                <div className="col-span-4">
                                  <label className="text-[8px] text-slate-400 uppercase block font-bold mb-0.5">Department</label>
                                  <input
                                    type="text"
                                    value={c.department}
                                    onChange={e => {
                                      const copy = [...formCrew];
                                      copy[actualIdx].department = e.target.value;
                                      setFormCrew(copy);
                                    }}
                                    className="w-full h-5 bg-slate-800 border border-slate-700 px-1.5 py-0 rounded text-white text-[10px]"
                                  />
                                </div>
                                <div className="col-span-5">
                                  <label className="text-[8px] text-slate-400 uppercase block font-bold mb-0.5">Designation / Role</label>
                                  <input
                                    type="text"
                                    value={c.designation}
                                    onChange={e => {
                                      const copy = [...formCrew];
                                      copy[actualIdx].designation = e.target.value;
                                      setFormCrew(copy);
                                    }}
                                    className="w-full h-5 bg-slate-800 border border-slate-700 px-1.5 py-0 rounded text-white text-[10px] font-semibold"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="text-[8px] text-slate-400 uppercase block font-bold mb-0.5">Heads</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={c.presentCount}
                                    onChange={e => {
                                      const val = Math.max(0, Number(e.target.value));
                                      const copy = [...formCrew];
                                      copy[actualIdx].presentCount = val;
                                      copy[actualIdx].plannedCount = copy[actualIdx].plannedCount || val;
                                      setFormCrew(copy);
                                    }}
                                    className="w-full h-5 bg-slate-800 border border-slate-700 px-1 py-0 rounded text-purple-300 font-bold font-mono text-[10px] text-center"
                                  />
                                </div>
                                <div className="col-span-1 text-center pt-2">
                                  <button
                                    type="button"
                                    onClick={() => setFormCrew(formCrew.filter(x => x.id !== c.id))}
                                    className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer text-xs"
                                    title="Remove Custom Crew"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Total Count Summary Footer */}
                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Total Crew Headcount</span>
                        <span className="text-base font-black font-mono text-purple-300">{formTotalPresentCrew} <span className="text-[10px] font-normal text-slate-400">Heads</span></span>
                      </div>
                      <div className="border-l border-slate-800 pl-3">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Active Roles Logged</span>
                        <span className="text-xs font-bold font-mono text-slate-200">{formCrew.filter(c => c.presentCount > 0).length} Roles</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCustomCrewRow}
                      className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-[10px] font-bold rounded cursor-pointer border border-purple-500/50 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Custom Crew
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: EQUIPMENT DETAILS */}
              {activeTab === 'equipment' && (
                <div className="space-y-2 animate-fade-in">
                  {/* Controls Bar: Search & Actions */}
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filter equipment (e.g., Camera, Lens, Crane, Drone)..."
                        value={equipmentSearch}
                        onChange={e => setEquipmentSearch(e.target.value)}
                        className="bg-slate-900 border border-slate-700/80 rounded px-2 h-5 text-[10px] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowAllEquipment(prev => !prev)}
                        className={`px-2 py-0.5 text-[9px] font-bold rounded border cursor-pointer flex items-center gap-1 transition-all ${
                          !showAllEquipment 
                            ? 'bg-blue-900/60 border-blue-500/80 text-blue-300 shadow-xs' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Toggle Preset Filtering"
                      >
                        <Filter className="w-3 h-3 text-blue-400" />
                        <span>{!showAllEquipment ? `Preset: ${currentEffectivePresetCategory}` : 'Show All Equipment'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const allCollapsed: Record<string, boolean> = {};
                          STANDARD_EQUIPMENT_CATEGORIES.forEach(c => { allCollapsed[c.category] = true; });
                          setCollapsedEquipmentCategories(allCollapsed);
                        }}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-medium rounded border border-slate-700 cursor-pointer"
                      >
                        Collapse All
                      </button>
                      <button
                        type="button"
                        onClick={() => setCollapsedEquipmentCategories({})}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-medium rounded border border-slate-700 cursor-pointer"
                      >
                        Expand All
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomEquipmentRow}
                        className="px-2.5 py-0.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Custom
                      </button>
                    </div>
                  </div>

                  {/* Accordion Categories for Equipment */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {STANDARD_EQUIPMENT_CATEGORIES.filter(catObj => {
                      const q = equipmentSearch.trim().toLowerCase();
                      if (q) {
                        return catObj.category.toLowerCase().includes(q) || catObj.items.some(it => it.toLowerCase().includes(q));
                      }
                      if (showAllEquipment) return true;
                      if (!presetEquipmentConfig) return true;

                      const isAllowedCategory = presetEquipmentConfig.categoryNames.includes(catObj.category);
                      const hasActiveItem = catObj.items.some(item => {
                        const key = `${catObj.category.trim().toLowerCase()}:::${item.trim().toLowerCase()}`;
                        return (equipmentLookupMap.get(key)?.actualQty || 0) > 0;
                      });
                      return isAllowedCategory || hasActiveItem;
                    }).map(catObj => {
                      const q = equipmentSearch.trim().toLowerCase();
                      const matchesCategory = catObj.category.toLowerCase().includes(q);
                      const filteredItems = catObj.items.filter(item => {
                        const key = `${catObj.category.trim().toLowerCase()}:::${item.trim().toLowerCase()}`;
                        const currentQty = equipmentLookupMap.get(key)?.actualQty || 0;
                        if (currentQty > 0) return true; // preserve active item

                        if (q) {
                          return matchesCategory || item.toLowerCase().includes(q);
                        }
                        if (showAllEquipment) return true;

                        const allowed = presetEquipmentConfig?.itemFilter?.[catObj.category];
                        if (allowed && Array.isArray(allowed)) {
                          return allowed.some(a => a.toLowerCase() === item.toLowerCase() || item.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(item.toLowerCase()));
                        }
                        return true;
                      });

                      if (filteredItems.length === 0) return null;

                      const isCollapsed = collapsedEquipmentCategories[catObj.category];

                      // Total units deployed in this category
                      const catDeployedCount = catObj.items.reduce((sum, item) => {
                        const key = `${catObj.category.trim().toLowerCase()}:::${item.trim().toLowerCase()}`;
                        const entry = equipmentLookupMap.get(key);
                        return sum + (entry?.actualQty || 0);
                      }, 0);

                      return (
                        <div key={catObj.category} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60">
                          {/* Category Header */}
                          <div 
                            onClick={() => setCollapsedEquipmentCategories(prev => ({ ...prev, [catObj.category]: !prev[catObj.category] }))}
                            className="px-3 py-1.5 bg-slate-800/90 flex justify-between items-center cursor-pointer hover:bg-slate-800 select-none"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-xs font-bold">{isCollapsed ? '►' : '▼'}</span>
                              <span className="font-bold text-blue-300 text-[11px] uppercase tracking-wider">{catObj.category}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300 font-mono">
                                {filteredItems.length} items
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {catDeployedCount > 0 && (
                                <span className="text-[10px] font-bold text-blue-400 font-mono bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/60">
                                  {catDeployedCount} units
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Category Items Grid */}
                          {!isCollapsed && (
                            <div className="p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 bg-slate-950/40">
                              {filteredItems.map(itemName => {
                                const key = `${catObj.category.trim().toLowerCase()}:::${itemName.trim().toLowerCase()}`;
                                const entry = equipmentLookupMap.get(key);
                                const currentQty = entry?.actualQty || 0;
                                const isExpanded = expandedEquipmentCards[key];

                                return (
                                  <div
                                    key={itemName}
                                    className={`p-1.5 rounded-md border transition-all ${
                                      currentQty > 0
                                        ? 'bg-blue-950/40 border-blue-500/70 shadow-xs'
                                        : 'bg-slate-900/50 border-slate-800/90 hover:border-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <div className="truncate pr-1">
                                        <span className={`text-[10px] font-semibold block leading-tight truncate ${
                                          currentQty > 0 ? 'text-blue-200 font-bold' : 'text-slate-200'
                                        }`}>
                                          {itemName}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <input
                                          type="number"
                                          min="0"
                                          value={currentQty || ''}
                                          placeholder="0"
                                          onChange={e => handleEquipmentQtyChange(catObj.category, itemName, Number(e.target.value))}
                                          className={`w-10 h-5 text-center font-mono font-bold text-[10px] rounded border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                            currentQty > 0 
                                              ? 'bg-blue-900/90 border-blue-400 text-white' 
                                              : 'bg-slate-800 border-slate-700 text-slate-300'
                                          }`}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => setExpandedEquipmentCards(prev => ({ ...prev, [key]: !prev[key] }))}
                                          className={`p-1 rounded text-[9px] cursor-pointer ${
                                            isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                                          }`}
                                          title="Toggle vendor / details"
                                        >
                                          ⚙
                                        </button>
                                      </div>
                                    </div>

                                    {/* Optional details drawer for Vendor / Remarks */}
                                    {isExpanded && (
                                      <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 space-y-1 bg-slate-950/70 p-1.5 rounded text-[9px]">
                                        <div>
                                          <label className="text-slate-400 uppercase text-[8px] font-bold block mb-0.5">Vendor / Supplier</label>
                                          <input
                                            type="text"
                                            value={entry?.vendor || ''}
                                            placeholder="e.g. Light & Motion / Media Vision"
                                            onChange={e => {
                                              const v = e.target.value;
                                              setFormEquipment(prev => {
                                                const idx = prev.findIndex(x => (x.category || '').trim().toLowerCase() === catObj.category.trim().toLowerCase() && (x.name || '').trim().toLowerCase() === itemName.trim().toLowerCase());
                                                if (idx >= 0) {
                                                  const copy = [...prev];
                                                  copy[idx] = { ...copy[idx], vendor: v };
                                                  return copy;
                                                } else {
                                                  return [
                                                    ...prev,
                                                    {
                                                      id: `eq_${Date.now()}`,
                                                      category: catObj.category,
                                                      name: itemName,
                                                      actualQty: 1,
                                                      plannedQty: 1,
                                                      unit: 'Unit',
                                                      vendor: v
                                                    }
                                                  ];
                                                }
                                              });
                                            }}
                                            className="w-full h-5 bg-slate-800 border border-slate-700 px-1 py-0 rounded text-white text-[9px]"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-slate-400 uppercase text-[8px] font-bold block mb-0.5">Remarks / Details</label>
                                          <input
                                            type="text"
                                            value={entry?.remarks || ''}
                                            placeholder="e.g. Set up on main stage"
                                            onChange={e => {
                                              const rm = e.target.value;
                                              setFormEquipment(prev => {
                                                const idx = prev.findIndex(x => (x.category || '').trim().toLowerCase() === catObj.category.trim().toLowerCase() && (x.name || '').trim().toLowerCase() === itemName.trim().toLowerCase());
                                                if (idx >= 0) {
                                                  const copy = [...prev];
                                                  copy[idx] = { ...copy[idx], remarks: rm };
                                                  return copy;
                                                } else {
                                                  return [
                                                    ...prev,
                                                    {
                                                      id: `eq_${Date.now()}`,
                                                      category: catObj.category,
                                                      name: itemName,
                                                      actualQty: 1,
                                                      plannedQty: 1,
                                                      unit: 'Unit',
                                                      remarks: rm
                                                    }
                                                  ];
                                                }
                                              });
                                            }}
                                            className="w-full h-5 bg-slate-800 border border-slate-700 px-1 py-0 rounded text-white text-[9px]"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Custom / Additional Equipment Section */}
                    {customEquipmentList.length > 0 && (
                      <div className="border border-blue-900/60 rounded-lg overflow-hidden bg-blue-950/20 mt-2">
                        <div className="px-2.5 py-1 bg-blue-950/60 flex justify-between items-center border-b border-blue-900/60">
                          <span className="font-bold text-blue-300 text-[11px] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-blue-400" /> Custom / Additional Equipment ({customEquipmentList.length})
                          </span>
                          <button
                            type="button"
                            onClick={handleAddCustomEquipmentRow}
                            className="px-2 py-0.2 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold rounded cursor-pointer"
                          >
                            + Add Custom
                          </button>
                        </div>
                        <div className="p-1.5 space-y-1.5">
                          {customEquipmentList.map((eq) => {
                            const actualIdx = formEquipment.findIndex(x => x.id === eq.id);
                            return (
                              <div key={eq.id} className="grid grid-cols-12 gap-1.5 items-center bg-slate-900/80 p-1.5 rounded-md border border-slate-800">
                                <div className="col-span-3">
                                  <label className="text-[8px] text-slate-400 uppercase block font-bold mb-0.5">Category</label>
                                  <input
                                    type="text"
                                    value={eq.category}
                                    onChange={e => {
                                      const copy = [...formEquipment];
                                      copy[actualIdx].category = e.target.value;
                                      setFormEquipment(copy);
                                    }}
                                    className="w-full h-5 bg-slate-800 border border-slate-700 px-1.5 py-0 rounded text-white text-[10px]"
                                  />
                                </div>
                                <div className="col-span-4">
                                  <label className="text-[8px] text-slate-400 uppercase block font-bold mb-0.5">Equipment Name</label>
                                  <input
                                    type="text"
                                    value={eq.name}
                                    onChange={e => {
                                      const copy = [...formEquipment];
                                      copy[actualIdx].name = e.target.value;
                                      setFormEquipment(copy);
                                    }}
                                    className="w-full h-5 bg-slate-800 border border-slate-700 px-1.5 py-0 rounded text-white text-[10px] font-semibold"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="text-[8px] text-slate-400 uppercase block font-bold mb-0.5">Vendor</label>
                                  <input
                                    type="text"
                                    value={eq.vendor || ''}
                                    onChange={e => {
                                      const copy = [...formEquipment];
                                      copy[actualIdx].vendor = e.target.value;
                                      setFormEquipment(copy);
                                    }}
                                    className="w-full h-5 bg-slate-800 border border-slate-700 px-1.5 py-0 rounded text-slate-300 text-[9px]"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="text-[8px] text-slate-400 uppercase block font-bold mb-0.5">Qty</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={eq.actualQty}
                                    onChange={e => {
                                      const val = Math.max(0, Number(e.target.value));
                                      const copy = [...formEquipment];
                                      copy[actualIdx].actualQty = val;
                                      copy[actualIdx].plannedQty = copy[actualIdx].plannedQty || val;
                                      setFormEquipment(copy);
                                    }}
                                    className="w-full h-5 bg-slate-800 border border-slate-700 px-1 py-0 rounded text-blue-300 font-bold font-mono text-[10px] text-center"
                                  />
                                </div>
                                <div className="col-span-1 text-center pt-2">
                                  <button
                                    type="button"
                                    onClick={() => setFormEquipment(formEquipment.filter(x => x.id !== eq.id))}
                                    className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer text-xs"
                                    title="Remove Item"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Summary */}
                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Total Equipment Units</span>
                        <span className="text-base font-black font-mono text-blue-300">
                          {formEquipment.reduce((acc, eq) => acc + (eq.actualQty || 0), 0)} <span className="text-[10px] font-normal text-slate-400">Units</span>
                        </span>
                      </div>
                      <div className="border-l border-slate-800 pl-3">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Active Gear Items</span>
                        <span className="text-xs font-bold font-mono text-slate-200">
                          {formEquipment.filter(eq => (eq.actualQty || 0) > 0).length} Items Logged
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCustomEquipmentRow}
                      className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-[10px] font-bold rounded cursor-pointer border border-blue-500/50 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Custom
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: PRODUCTION GOODS */}
              {activeTab === 'goods' && (
                <div className="space-y-2 animate-fade-in">
                  {/* Controls Bar */}
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filter production goods (e.g., Sofa, Chair, Tent, Gas, Oven)..."
                        value={goodsSearch}
                        onChange={e => setGoodsSearch(e.target.value)}
                        className="bg-slate-900 border border-slate-700/80 rounded px-2 h-5 text-[10px] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowAllGoods(prev => !prev)}
                        className={`px-2 py-0.5 text-[9px] font-bold rounded border cursor-pointer flex items-center gap-1 transition-all ${
                          !showAllGoods 
                            ? 'bg-blue-900/60 border-blue-500/80 text-blue-300 shadow-xs' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Toggle Preset Filtering"
                      >
                        <Filter className="w-3 h-3 text-blue-400" />
                        <span>{!showAllGoods ? `Preset: ${currentEffectivePresetCategory}` : 'Show All Goods'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const allCollapsed: Record<string, boolean> = {};
                          STANDARD_GOODS_CATEGORIES.forEach(c => { allCollapsed[c.category] = true; });
                          setCollapsedGoodsCategories(allCollapsed);
                        }}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-medium rounded border border-slate-700 cursor-pointer"
                      >
                        Collapse All
                      </button>
                      <button
                        type="button"
                        onClick={() => setCollapsedGoodsCategories({})}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-medium rounded border border-slate-700 cursor-pointer"
                      >
                        Expand All
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomGoodsRow}
                        className="px-2.5 py-0.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Custom
                      </button>
                    </div>
                  </div>

                  {/* Accordion Categories for Goods */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {STANDARD_GOODS_CATEGORIES.filter(catObj => {
                      const q = goodsSearch.trim().toLowerCase();
                      if (q) {
                        return catObj.category.toLowerCase().includes(q) || catObj.items.some(it => it.toLowerCase().includes(q));
                      }
                      if (showAllGoods) return true;
                      if (!presetGoodsConfig) return true;

                      const isAllowedCategory = presetGoodsConfig.categoryNames.includes(catObj.category);
                      const hasActiveItem = catObj.items.some(item => {
                        const key = `${catObj.category.trim().toLowerCase()}:::${item.trim().toLowerCase()}`;
                        return (goodsLookupMap.get(key)?.actualQty || goodsLookupMap.get(item.trim().toLowerCase())?.actualQty || 0) > 0;
                      });
                      return isAllowedCategory || hasActiveItem;
                    }).map(catObj => {
                      const q = goodsSearch.trim().toLowerCase();
                      const matchesCategory = catObj.category.toLowerCase().includes(q);
                      const filteredItems = catObj.items.filter(item => {
                        const key = `${catObj.category.trim().toLowerCase()}:::${item.trim().toLowerCase()}`;
                        const currentQty = goodsLookupMap.get(key)?.actualQty || goodsLookupMap.get(item.trim().toLowerCase())?.actualQty || 0;
                        if (currentQty > 0) return true; // preserve active item

                        if (q) {
                          return matchesCategory || item.toLowerCase().includes(q);
                        }
                        if (showAllGoods) return true;

                        const allowed = presetGoodsConfig?.itemFilter?.[catObj.category];
                        if (allowed && Array.isArray(allowed)) {
                          return allowed.some(a => a.toLowerCase() === item.toLowerCase() || item.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(item.toLowerCase()));
                        }
                        return true;
                      });

                      if (filteredItems.length === 0) return null;

                      const isCollapsed = collapsedGoodsCategories[catObj.category];

                      // Total units issued in this category
                      const catDeployedCount = catObj.items.reduce((sum, item) => {
                        const key = `${catObj.category.trim().toLowerCase()}:::${item.trim().toLowerCase()}`;
                        const entry = goodsLookupMap.get(key) || goodsLookupMap.get(item.trim().toLowerCase());
                        return sum + (entry?.actualQty || 0);
                      }, 0);

                      return (
                        <div key={catObj.category} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60">
                          {/* Category Header */}
                          <div 
                            onClick={() => setCollapsedGoodsCategories(prev => ({ ...prev, [catObj.category]: !prev[catObj.category] }))}
                            className="px-3 py-1.5 bg-slate-800/90 flex justify-between items-center cursor-pointer hover:bg-slate-800 select-none"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-xs font-bold">{isCollapsed ? '►' : '▼'}</span>
                              <span className="font-bold text-blue-300 text-[11px] uppercase tracking-wider">{catObj.category}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300 font-mono">
                                {filteredItems.length} items
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {catDeployedCount > 0 && (
                                <span className="text-[10px] font-bold text-blue-400 font-mono bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/60">
                                  {catDeployedCount} units
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Category Items Grid */}
                          {!isCollapsed && (
                            <div className="p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 bg-slate-950/40">
                              {filteredItems.map(itemName => {
                                const key = `${catObj.category.trim().toLowerCase()}:::${itemName.trim().toLowerCase()}`;
                                const entry = goodsLookupMap.get(key) || goodsLookupMap.get(itemName.trim().toLowerCase());
                                const currentQty = entry?.actualQty || 0;
                                const isExpanded = expandedGoodsCards[key] || expandedGoodsCards[itemName.trim().toLowerCase()];

                                return (
                                  <div
                                    key={itemName}
                                    className={`p-1.5 rounded-md border transition-all ${
                                      currentQty > 0
                                        ? 'bg-blue-950/40 border-blue-500/70 shadow-xs'
                                        : 'bg-slate-900/50 border-slate-800/90 hover:border-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <div className="truncate pr-1">
                                        <span className={`text-[10px] font-semibold block leading-tight truncate ${
                                          currentQty > 0 ? 'text-blue-200 font-bold' : 'text-slate-200'
                                        }`}>
                                          {itemName}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <input
                                          type="number"
                                          min="0"
                                          value={currentQty || ''}
                                          placeholder="0"
                                          onChange={e => handleGoodsQtyChange(catObj.category, itemName, Number(e.target.value))}
                                          className={`w-10 h-5 text-center font-mono font-bold text-[10px] rounded border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                            currentQty > 0 
                                              ? 'bg-blue-900/90 border-blue-400 text-white' 
                                              : 'bg-slate-800 border-slate-700 text-slate-300'
                                          }`}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => setExpandedGoodsCards(prev => ({ ...prev, [key]: !prev[key], [itemName.trim().toLowerCase()]: !prev[itemName.trim().toLowerCase()] }))}
                                          className={`p-1 rounded text-[9px] cursor-pointer ${
                                            isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                                          }`}
                                          title="Toggle vendor / details"
                                        >
                                          ⚙
                                        </button>
                                      </div>
                                    </div>

                                    {/* Optional details drawer for Vendor / Remarks */}
                                    {isExpanded && (
                                      <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 space-y-1 bg-slate-950/70 p-1.5 rounded text-[9px]">
                                        <div>
                                          <label className="text-slate-400 uppercase text-[8px] font-bold block mb-0.5">Vendor / Supplier</label>
                                          <input
                                            type="text"
                                            value={entry?.vendor || ''}
                                            placeholder="e.g. Vendor Name"
                                            onChange={e => {
                                              const v = e.target.value;
                                              setFormGoods(prev => {
                                                const idx = prev.findIndex(x => (x.itemName || '').trim().toLowerCase() === itemName.trim().toLowerCase());
                                                if (idx >= 0) {
                                                  const copy = [...prev];
                                                  copy[idx] = { ...copy[idx], vendor: v };
                                                  return copy;
                                                } else {
                                                  return [
                                                    ...prev,
                                                    {
                                                      id: `goods_${Date.now()}`,
                                                      category: catObj.category,
                                                      itemName,
                                                      actualQty: 1,
                                                      plannedQty: 1,
                                                      vendor: v
                                                    }
                                                  ];
                                                }
                                              });
                                            }}
                                            className="w-full h-5 bg-slate-800 border border-slate-700 px-1 py-0 rounded text-white text-[9px]"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-slate-400 uppercase text-[8px] font-bold block mb-0.5">Remarks / Details</label>
                                          <input
                                            type="text"
                                            value={entry?.remarks || ''}
                                            placeholder="e.g. Set up on main floor"
                                            onChange={e => {
                                              const rm = e.target.value;
                                              setFormGoods(prev => {
                                                const idx = prev.findIndex(x => (x.itemName || '').trim().toLowerCase() === itemName.trim().toLowerCase());
                                                if (idx >= 0) {
                                                  const copy = [...prev];
                                                  copy[idx] = { ...copy[idx], remarks: rm };
                                                  return copy;
                                                } else {
                                                  return [
                                                    ...prev,
                                                    {
                                                      id: `goods_${Date.now()}`,
                                                      category: catObj.category,
                                                      itemName,
                                                      actualQty: 1,
                                                      plannedQty: 1,
                                                      remarks: rm
                                                    }
                                                  ];
                                                }
                                              });
                                            }}
                                            className="w-full h-5 bg-slate-800 border border-slate-700 px-1 py-0 rounded text-white text-[9px]"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Custom / Additional Section */}
                    {customGoodsList.length > 0 && (
                      <div className="border border-blue-900/60 rounded-lg overflow-hidden bg-blue-950/20 mt-2">
                        <div className="px-2.5 py-1 bg-blue-950/60 flex justify-between items-center border-b border-blue-900/60">
                          <span className="font-bold text-blue-300 text-[11px] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-blue-400" /> Custom / Additional Production Goods ({customGoodsList.length})
                          </span>
                          <button
                            type="button"
                            onClick={handleAddCustomGoodsRow}
                            className="px-2 py-0.2 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold rounded cursor-pointer"
                          >
                            + Add Custom
                          </button>
                        </div>
                        <div className="p-1.5 space-y-1.5">
                          {customGoodsList.map((g) => {
                            const actualIdx = formGoods.findIndex(x => x.id === g.id);
                            return (
                              <div key={g.id} className="grid grid-cols-12 gap-1.5 items-center bg-slate-900/80 p-1.5 rounded-md border border-slate-800">
                                <div className="col-span-3">
                                  <label className="text-[8px] text-slate-400 uppercase block font-bold mb-0.5">Category</label>
                                  <input
                                    type="text"
                                    value={g.category || 'Custom Goods'}
                                    onChange={e => {
                                      const copy = [...formGoods];
                                      copy[actualIdx].category = e.target.value;
                                      setFormGoods(copy);
                                    }}
                                    className="w-full h-5 bg-slate-800 border border-slate-700 px-1.5 py-0 rounded text-white text-[10px]"
                                  />
                                </div>
                                <div className="col-span-4">
                                  <label className="text-[8px] text-slate-400 uppercase block font-bold mb-0.5">Item Name</label>
                                  <input
                                    type="text"
                                    value={g.itemName}
                                    onChange={e => {
                                      const copy = [...formGoods];
                                      copy[actualIdx].itemName = e.target.value;
                                      setFormGoods(copy);
                                    }}
                                    className="w-full h-5 bg-slate-800 border border-slate-700 px-1.5 py-0 rounded text-white text-[10px] font-semibold"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="text-[8px] text-slate-400 uppercase block font-bold mb-0.5">Vendor</label>
                                  <input
                                    type="text"
                                    value={g.vendor || ''}
                                    onChange={e => {
                                      const copy = [...formGoods];
                                      copy[actualIdx].vendor = e.target.value;
                                      setFormGoods(copy);
                                    }}
                                    className="w-full h-5 bg-slate-800 border border-slate-700 px-1.5 py-0 rounded text-slate-300 text-[9px]"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="text-[8px] text-slate-400 uppercase block font-bold mb-0.5">Qty</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={g.actualQty}
                                    onChange={e => {
                                      const val = Math.max(0, Number(e.target.value));
                                      const copy = [...formGoods];
                                      copy[actualIdx].actualQty = val;
                                      copy[actualIdx].plannedQty = copy[actualIdx].plannedQty || val;
                                      setFormGoods(copy);
                                    }}
                                    className="w-full h-5 bg-slate-800 border border-slate-700 px-1 py-0 rounded text-blue-300 font-bold font-mono text-[10px] text-center"
                                  />
                                </div>
                                <div className="col-span-1 text-center pt-2">
                                  <button
                                    type="button"
                                    onClick={() => setFormGoods(formGoods.filter(x => x.id !== g.id))}
                                    className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer text-xs"
                                    title="Remove Item"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Summary */}
                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Total Goods Units</span>
                        <span className="text-base font-black font-mono text-blue-300">
                          {formGoods.reduce((acc, g) => acc + (g.actualQty || 0), 0)} <span className="text-[10px] font-normal text-slate-400">Units</span>
                        </span>
                      </div>
                      <div className="border-l border-slate-800 pl-3">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Active Goods Logged</span>
                        <span className="text-xs font-bold font-mono text-slate-200">
                          {formGoods.filter(g => (g.actualQty || 0) > 0).length} Items Logged
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCustomGoodsRow}
                      className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-[10px] font-bold rounded cursor-pointer border border-blue-500/50 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Custom
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: TRANSPORT DETAILS */}
              {activeTab === 'transport' && (
                <div className="space-y-2 animate-fade-in">
                  {/* Top Search & Actions Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1.5" />
                      <input
                        type="text"
                        placeholder="Search vehicle type or category..."
                        value={transportSearch}
                        onChange={e => setTransportSearch(e.target.value)}
                        className="w-full h-5 pl-7 pr-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => setShowAllTransport(prev => !prev)}
                        className={`px-2 py-0.5 text-[9px] font-bold rounded border cursor-pointer flex items-center gap-1 transition-all ${
                          !showAllTransport 
                            ? 'bg-blue-900/60 border-blue-500/80 text-blue-300 shadow-xs' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Toggle Preset Filtering"
                      >
                        <Filter className="w-3 h-3 text-blue-400" />
                        <span>{!showAllTransport ? `Preset: ${currentEffectivePresetCategory}` : 'Show All Transport'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const allCollapsed = STANDARD_TRANSPORT_CATEGORIES.reduce((acc, c) => ({ ...acc, [c.category]: true }), {});
                          setCollapsedTransportCategories(allCollapsed);
                        }}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded cursor-pointer border border-slate-700"
                      >
                        Collapse All
                      </button>
                      <button
                        type="button"
                        onClick={() => setCollapsedTransportCategories({})}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded cursor-pointer border border-slate-700"
                      >
                        Expand All
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomTransportRow}
                        className="px-2.5 py-0.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3 h-3" /> Add Custom Vehicle
                      </button>
                    </div>
                  </div>

                  {/* Standard Transport Categories Accordion List */}
                  <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                    {STANDARD_TRANSPORT_CATEGORIES.filter(catObj => {
                      const q = transportSearch.trim().toLowerCase();
                      if (q) {
                        return catObj.category.toLowerCase().includes(q) || catObj.vehicles.some(v => v.toLowerCase().includes(q));
                      }
                      if (showAllTransport) return true;
                      if (!presetTransportConfig) return true;

                      const isAllowedCategory = presetTransportConfig.categoryNames.includes(catObj.category);
                      const hasActiveItem = catObj.vehicles.some(veh => {
                        const key = `${catObj.category.trim().toLowerCase()}:::${veh.trim().toLowerCase()}`;
                        return (transportLookupMap.get(key)?.actualQty || 0) > 0;
                      });
                      return isAllowedCategory || hasActiveItem;
                    }).map(catObj => {
                      const q = transportSearch.trim().toLowerCase();
                      const matchesCategoryName = catObj.category.toLowerCase().includes(q);
                      const filteredVehicles = catObj.vehicles.filter(veh => {
                        const key = `${catObj.category.trim().toLowerCase()}:::${veh.trim().toLowerCase()}`;
                        const currentQty = transportLookupMap.get(key)?.actualQty || 0;
                        if (currentQty > 0) return true; // preserve active vehicle

                        if (q) {
                          return matchesCategoryName || veh.toLowerCase().includes(q);
                        }
                        if (showAllTransport) return true;

                        const allowedVehicles = presetTransportConfig?.vehicleFilter?.[catObj.category] || (presetTransportConfig as any)?.itemFilter?.[catObj.category];
                        if (allowedVehicles && Array.isArray(allowedVehicles)) {
                          return allowedVehicles.some(a => a.toLowerCase() === veh.toLowerCase() || veh.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(veh.toLowerCase()));
                        }
                        return true;
                      });

                      if (filteredVehicles.length === 0) return null;

                      // Calculate total vehicles count in this category
                      const catTotalQty = catObj.vehicles.reduce((acc, veh) => {
                        const key = `${catObj.category.trim().toLowerCase()}:::${veh.trim().toLowerCase()}`;
                        const entry = transportLookupMap.get(key);
                        return acc + (entry?.actualQty || 0);
                      }, 0);

                      const isCollapsed = Boolean(collapsedTransportCategories[catObj.category]);

                      return (
                        <div key={catObj.category} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60">
                          {/* Category Header Bar */}
                          <div 
                            onClick={() => setCollapsedTransportCategories(prev => ({ ...prev, [catObj.category]: !prev[catObj.category] }))}
                            className="flex justify-between items-center px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800/90 cursor-pointer border-b border-slate-800/80 transition-colors"
                          >
                            <div className="flex items-center gap-1.5">
                              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-blue-400" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-400" />}
                              <Truck className="w-3.5 h-3.5 text-blue-400" />
                              <span className="font-bold text-slate-200 text-[11px] tracking-tight">{catObj.category}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                catTotalQty > 0 
                                  ? 'bg-blue-950 text-blue-300 border-blue-800/80' 
                                  : 'bg-slate-800/80 text-slate-400 border-slate-700'
                              }`}>
                                {catTotalQty} Vehicles
                              </span>
                            </div>
                          </div>

                          {/* Vehicle Grid */}
                          {!isCollapsed && (
                            <div className="p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 bg-slate-950/40">
                              {filteredVehicles.map(veh => {
                                const key = `${catObj.category.trim().toLowerCase()}:::${veh.trim().toLowerCase()}`;
                                const entry = transportLookupMap.get(key);
                                const currentQty = entry?.actualQty || 0;
                                const isExpanded = Boolean(expandedTransportCards[key]);

                                return (
                                  <div 
                                    key={veh} 
                                    className={`flex flex-col p-1 px-1.5 rounded-md border transition-all ${
                                      currentQty > 0 
                                        ? 'bg-blue-950/40 border-blue-600/70 shadow-xs' 
                                        : 'bg-slate-900/40 border-slate-800/90 hover:border-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`text-[10px] font-medium leading-tight truncate pr-1 ${
                                        currentQty > 0 ? 'text-blue-200 font-bold' : 'text-slate-300'
                                      }`} title={veh}>
                                        {veh}
                                      </span>
                                      
                                      <div className="flex items-center gap-1 shrink-0">
                                        <input
                                          type="number"
                                          min="0"
                                          value={currentQty || ''}
                                          placeholder="0"
                                          onChange={e => handleTransportQtyChange(catObj.category, veh, Number(e.target.value))}
                                          className={`w-10 h-5 text-center font-mono font-bold text-[10px] rounded border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                            currentQty > 0 
                                              ? 'bg-blue-900/90 border-blue-400 text-white' 
                                              : 'bg-slate-800 border-slate-700 text-slate-300'
                                          }`}
                                        />

                                        {currentQty > 0 && (
                                          <button
                                            type="button"
                                            title="More Details (Vehicle No, KM, Rate)"
                                            onClick={() => setExpandedTransportCards(prev => ({ ...prev, [key]: !prev[key] }))}
                                            className={`p-1 rounded cursor-pointer transition-colors ${
                                              isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                                            }`}
                                          >
                                            <Edit3 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Expanded optional fields (Vehicle No, Total KM, Rate, Vendor) */}
                                    {currentQty > 0 && isExpanded && entry && (
                                      <div className="mt-1.5 pt-1.5 border-t border-blue-900/60 grid grid-cols-2 gap-1 animate-fade-in text-[9px]">
                                        <div>
                                          <label className="text-[8px] font-semibold text-slate-400 block mb-0.5">Vehicle No.</label>
                                          <input
                                            type="text"
                                            placeholder="e.g. WB-02-1234"
                                            value={entry.vehicleNumber || ''}
                                            onChange={e => handleUpdateTransportDetails(entry.id, { vehicleNumber: e.target.value })}
                                            className="w-full h-5 px-1 bg-slate-900 border border-slate-700 rounded text-slate-100 text-[9px] font-mono"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[8px] font-semibold text-slate-400 block mb-0.5">Total KM</label>
                                          <input
                                            type="number"
                                            placeholder="0"
                                            value={entry.totalKm || ''}
                                            onChange={e => handleUpdateTransportDetails(entry.id, { totalKm: Number(e.target.value) })}
                                            className="w-full h-5 px-1 bg-slate-900 border border-slate-700 rounded text-slate-100 text-[9px] font-mono"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[8px] font-semibold text-slate-400 block mb-0.5">Rate (₹)</label>
                                          <input
                                            type="number"
                                            placeholder="0"
                                            value={entry.rate || ''}
                                            onChange={e => handleUpdateTransportDetails(entry.id, { rate: Number(e.target.value) })}
                                            className="w-full h-5 px-1 bg-slate-900 border border-slate-700 rounded text-slate-100 text-[9px] font-mono"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[8px] font-semibold text-slate-400 block mb-0.5">Vendor / Notes</label>
                                          <input
                                            type="text"
                                            placeholder="Vendor Name"
                                            value={entry.vendor || ''}
                                            onChange={e => handleUpdateTransportDetails(entry.id, { vendor: e.target.value })}
                                            className="w-full h-5 px-1 bg-slate-900 border border-slate-700 rounded text-slate-100 text-[9px]"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Custom / Additional Unlisted Vehicles Section */}
                    {customTransportList.length > 0 && (
                      <div className="border border-blue-900/60 rounded-lg overflow-hidden bg-blue-950/20 mt-2">
                        <div className="px-2.5 py-1 bg-blue-950/60 flex justify-between items-center border-b border-blue-900/60">
                          <span className="font-bold text-blue-300 text-[11px] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-blue-400" /> Custom / Additional Vehicles ({customTransportList.length})
                          </span>
                          <button
                            type="button"
                            onClick={handleAddCustomTransportRow}
                            className="px-2 py-0.2 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold rounded cursor-pointer"
                          >
                            + Add Row
                          </button>
                        </div>

                        <div className="p-2 space-y-1.5">
                          {customTransportList.map((tr, idx) => (
                            <div key={tr.id} className="p-1.5 bg-slate-900 border border-slate-800 rounded-md grid grid-cols-12 gap-1 items-center text-[10px]">
                              <div className="col-span-3">
                                <label className="text-[8px] text-slate-500 block">Category</label>
                                <input
                                  type="text"
                                  value={tr.category || 'Others'}
                                  onChange={e => handleUpdateTransportDetails(tr.id, { category: e.target.value })}
                                  className="w-full h-5 px-1 bg-slate-800 border border-slate-700 rounded text-white text-[9px]"
                                />
                              </div>
                              <div className="col-span-3">
                                <label className="text-[8px] text-slate-500 block">Vehicle Name</label>
                                <input
                                  type="text"
                                  value={tr.vehicleType}
                                  onChange={e => handleUpdateTransportDetails(tr.id, { vehicleType: e.target.value })}
                                  className="w-full h-5 px-1 bg-slate-800 border border-slate-700 rounded text-white text-[9px] font-bold"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="text-[8px] text-slate-500 block">Qty</label>
                                <input
                                  type="number"
                                  value={tr.actualQty}
                                  onChange={e => handleUpdateTransportDetails(tr.id, { actualQty: Number(e.target.value) })}
                                  className="w-full h-5 px-1 bg-slate-800 border border-slate-700 rounded text-white font-mono text-[9px]"
                                />
                              </div>
                              <div className="col-span-3">
                                <label className="text-[8px] text-slate-500 block">Vehicle No.</label>
                                <input
                                  type="text"
                                  placeholder="e.g. WB-01-9999"
                                  value={tr.vehicleNumber || ''}
                                  onChange={e => handleUpdateTransportDetails(tr.id, { vehicleNumber: e.target.value })}
                                  className="w-full h-5 px-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[9px]"
                                />
                              </div>
                              <div className="col-span-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => setFormTransport(prev => prev.filter(item => item.id !== tr.id))}
                                  className="text-slate-500 hover:text-rose-400 cursor-pointer p-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: GENSET & VANITY */}
              {activeTab === 'genset' && (
                <div className="space-y-3 animate-fade-in">
                  {/* FIRST: GIVEN FIELDS GRID FOR GENSET & VANITY */}
                  <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Genset &amp; Vanity Deployments
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAllGenset(prev => !prev)}
                          className={`px-2 py-0.5 text-[9px] font-bold rounded border cursor-pointer flex items-center gap-1 transition-all ${
                            !showAllGenset 
                              ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 shadow-xs' 
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                          title="Toggle Preset Filtering"
                        >
                          <Filter className="w-3 h-3 text-amber-400" />
                          <span>{!showAllGenset ? `Preset: ${currentEffectivePresetCategory}` : 'Show All Genset / Vanity'}</span>
                        </button>
                        <span className="text-[9px] text-slate-400 font-mono">Quantities / Deployments</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                      {STANDARD_GENSET_VANITY_ITEMS.filter(item => {
                        const isVanity = item.category === 'Vanity';
                        const kName = item.name.trim().toLowerCase();
                        const currentQty = isVanity 
                          ? (vanityQtyMap.get(kName) || 0) 
                          : (gensetQtyMap.get(kName) || 0);
                        if (currentQty > 0) return true; // preserve active item
                        if (showAllGenset) return true;
                        if (!presetGensetVanityConfig?.allowedItemNames) return true;

                        return presetGensetVanityConfig.allowedItemNames.some(allowed => 
                          allowed.toLowerCase() === item.name.toLowerCase() || 
                          item.name.toLowerCase().includes(allowed.toLowerCase()) ||
                          allowed.toLowerCase().includes(item.name.toLowerCase())
                        );
                      }).map(item => {
                        const isVanity = item.category === 'Vanity';
                        const kName = item.name.trim().toLowerCase();
                        const currentQty = isVanity 
                          ? (vanityQtyMap.get(kName) || 0) 
                          : (gensetQtyMap.get(kName) || 0);

                        return (
                          <div 
                            key={item.name}
                            className={`flex items-center justify-between p-1.5 px-2 rounded-md border transition-all ${
                              currentQty > 0 
                                ? 'bg-amber-950/40 border-amber-500/70 shadow-xs' 
                                : 'bg-slate-900/50 border-slate-800/90 hover:border-slate-700'
                            }`}
                          >
                            <span className={`text-[10px] font-semibold leading-tight truncate pr-1 ${
                              currentQty > 0 ? 'text-amber-200 font-bold' : 'text-slate-200'
                            }`} title={item.name}>
                              {item.name}
                            </span>

                            <input
                              type="number"
                              min="0"
                              value={currentQty || ''}
                              placeholder="0"
                              onChange={e => handleGensetVanityQtyChange(item, Number(e.target.value))}
                              className={`w-10 h-5 text-center font-mono font-bold text-[10px] rounded border focus:outline-none focus:ring-1 focus:ring-amber-500 shrink-0 ${
                                currentQty > 0 
                                  ? 'bg-amber-900/90 border-amber-400 text-white' 
                                  : 'bg-slate-800 border-slate-700 text-slate-300'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AFTER THAT: GENSET & FUEL CALCULATION */}
                  <div className="space-y-2 p-2.5 bg-slate-950/70 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-400 flex items-center gap-1 text-[11px]">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Genset &amp; Fuel Calculation
                      </span>
                      {formGensets.length > 0 && (
                        <span className="text-[9px] text-amber-300 font-mono">
                          Total Fuel: {formGensets.reduce((acc, g) => acc + (g.runningHours * g.litresPerHour * g.quantity), 0)} L
                        </span>
                      )}
                    </div>

                    {formGensets.length === 0 ? (
                      <div className="text-center py-4 text-slate-500 text-[10px]">
                        Enter quantity in any of the Genset or Vanity fields above to perform fuel calculations.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-800 rounded-lg">
                        <table className="w-full text-left text-[10px]">
                          <thead className="bg-slate-800 text-slate-400 font-bold uppercase">
                            <tr>
                              <th className="p-1.5">Genset / Vanity Name</th>
                              <th className="p-1.5 w-12 text-center">Qty</th>
                              <th className="p-1.5 w-16">Running Hrs</th>
                              <th className="p-1.5 w-16">Ltr / Hr</th>
                              <th className="p-1.5 w-20">Calculated Fuel</th>
                              <th className="p-1.5 w-20">Rate (₹/L)</th>
                              <th className="p-1.5 w-20">Fuel Cost (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {formGensets.map((g, idx) => {
                              const calcF = g.runningHours * g.litresPerHour * g.quantity;
                              const costF = calcF * g.fuelRatePerLitre;
                              return (
                                <tr key={g.id}>
                                  <td className="p-1 font-bold text-white text-[10px]">{g.name}</td>
                                  <td className="p-1 text-center font-mono font-bold text-amber-300 text-[10px]">{g.quantity}</td>
                                  <td className="p-1">
                                    <input 
                                      type="number" 
                                      value={g.runningHours} 
                                      onChange={e => {
                                        const updated = [...formGensets];
                                        updated[idx].runningHours = Number(e.target.value);
                                        updated[idx].calculatedFuel = Number(e.target.value) * updated[idx].litresPerHour * updated[idx].quantity;
                                        updated[idx].fuelCost = updated[idx].calculatedFuel * updated[idx].fuelRatePerLitre;
                                        setFormGensets(updated);
                                      }} 
                                      className="w-full h-5 bg-slate-800 border border-slate-700 px-1 py-0 rounded text-white font-mono text-[10px]" 
                                    />
                                  </td>
                                  <td className="p-1">
                                    <input 
                                      type="number" 
                                      value={g.litresPerHour} 
                                      onChange={e => {
                                        const updated = [...formGensets];
                                        updated[idx].litresPerHour = Number(e.target.value);
                                        updated[idx].calculatedFuel = updated[idx].runningHours * Number(e.target.value) * updated[idx].quantity;
                                        updated[idx].fuelCost = updated[idx].calculatedFuel * updated[idx].fuelRatePerLitre;
                                        setFormGensets(updated);
                                      }} 
                                      className="w-full h-5 bg-slate-800 border border-slate-700 px-1 py-0 rounded text-slate-200 font-mono text-[10px]" 
                                    />
                                  </td>
                                  <td className="p-1 font-bold text-amber-400 font-mono text-[10px]">{calcF} L</td>
                                  <td className="p-1">
                                    <input 
                                      type="number" 
                                      value={g.fuelRatePerLitre} 
                                      onChange={e => {
                                        const updated = [...formGensets];
                                        updated[idx].fuelRatePerLitre = Number(e.target.value);
                                        updated[idx].fuelCost = updated[idx].calculatedFuel * Number(e.target.value);
                                        setFormGensets(updated);
                                      }} 
                                      className="w-full h-5 bg-slate-800 border border-slate-700 px-1 py-0 rounded text-white font-mono text-[10px]" 
                                    />
                                  </td>
                                  <td className="p-1 font-bold text-emerald-300 font-mono text-[10px]">₹{costF.toLocaleString()}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: FOOD COUNT */}
              {activeTab === 'food' && (
                <div className="space-y-2 animate-fade-in">
                  {/* Controls Bar */}
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Filter food meals (e.g., Breakfast, Lunch, Artist, Veg, Snacks)..."
                        value={foodSearch}
                        onChange={e => setFoodSearch(e.target.value)}
                        className="bg-slate-900 border border-slate-700/80 rounded px-2 h-5 text-[10px] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500 w-full"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowAllFood(prev => !prev)}
                        className={`px-2 py-0.5 text-[9px] font-bold rounded border cursor-pointer flex items-center gap-1 transition-all ${
                          !showAllFood 
                            ? 'bg-rose-950/80 border-rose-500/80 text-rose-300 shadow-xs' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Toggle Preset Filtering"
                      >
                        <Filter className="w-3 h-3 text-rose-400" />
                        <span>{!showAllFood ? `Preset: ${currentEffectivePresetCategory}` : 'Show All Food'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const allCollapsed: Record<string, boolean> = {};
                          STANDARD_FOOD_CATEGORIES.forEach(c => { allCollapsed[c.category] = true; });
                          setCollapsedFoodCategories(allCollapsed);
                        }}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-medium rounded border border-slate-700 cursor-pointer"
                      >
                        Collapse All
                      </button>
                      <button
                        type="button"
                        onClick={() => setCollapsedFoodCategories({})}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-medium rounded border border-slate-700 cursor-pointer"
                      >
                        Expand All
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomFoodRow}
                        className="px-2.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Custom
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Header */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800 text-[10px]">
                    <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <div>
                        <span className="text-slate-400 text-[8px] uppercase font-bold block">Present Crew Headcount</span>
                        <span className="text-purple-300 font-bold font-mono text-xs">{formTotalPresentCrew}</span>
                      </div>
                    </div>
                    <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80 flex items-center gap-2">
                      <Utensils className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <div>
                        <span className="text-slate-400 text-[8px] uppercase font-bold block">Total Actual Meals</span>
                        <span className="text-rose-300 font-bold font-mono text-xs">
                          {formFood.reduce((sum, f) => sum + (f.actualCount || 0), 0)} <span className="text-[9px] text-slate-400 font-normal">Plates</span>
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80 flex items-center gap-2">
                      <div>
                        <span className="text-slate-400 text-[8px] uppercase font-bold block">Veg / Non-Veg Split</span>
                        <span className="text-slate-200 font-bold font-mono text-xs">
                          <span className="text-emerald-400">{formFood.reduce((sum, f) => sum + (f.vegCount || 0), 0)} V</span>
                          {' / '}
                          <span className="text-amber-400">{formFood.reduce((sum, f) => sum + (f.nonVegCount || 0), 0)} NV</span>
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80 flex items-center gap-2">
                      <div>
                        <span className="text-slate-400 text-[8px] uppercase font-bold block">Total Catering Expense</span>
                        <span className="text-emerald-300 font-bold font-mono text-xs">
                          ₹{formFood.reduce((sum, f) => sum + (f.totalCost || ((f.actualCount || 0) * (f.ratePerPlate || 0))), 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Accordion Categories for Food */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {STANDARD_FOOD_CATEGORIES.filter(catObj => {
                      const q = foodSearch.trim().toLowerCase();
                      if (q) {
                        return catObj.category.toLowerCase().includes(q) || catObj.items.some(it => it.toLowerCase().includes(q));
                      }
                      if (showAllFood) return true;
                      if (!presetFoodConfig) return true;

                      const isAllowedCategory = presetFoodConfig.categoryNames.includes(catObj.category);
                      const hasActiveItem = catObj.items.some(item => {
                        const key = `${catObj.category.trim().toLowerCase()}:::${item.trim().toLowerCase()}`;
                        return (foodLookupMap.get(key)?.actualCount || foodLookupMap.get(item.trim().toLowerCase())?.actualCount || 0) > 0;
                      });
                      return isAllowedCategory || hasActiveItem;
                    }).map(catObj => {
                      const q = foodSearch.trim().toLowerCase();
                      const matchesCategory = catObj.category.toLowerCase().includes(q);
                      const filteredItems = catObj.items.filter(item => {
                        const key = `${catObj.category.trim().toLowerCase()}:::${item.trim().toLowerCase()}`;
                        const currentQty = foodLookupMap.get(key)?.actualCount || foodLookupMap.get(item.trim().toLowerCase())?.actualCount || 0;
                        if (currentQty > 0) return true; // preserve active item

                        if (q) {
                          return matchesCategory || item.toLowerCase().includes(q);
                        }
                        if (showAllFood) return true;

                        const allowed = presetFoodConfig?.itemFilter?.[catObj.category];
                        if (allowed && Array.isArray(allowed)) {
                          return allowed.some(a => a.toLowerCase() === item.toLowerCase() || item.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(item.toLowerCase()));
                        }
                        return true;
                      });

                      if (filteredItems.length === 0) return null;

                      const isCollapsed = collapsedFoodCategories[catObj.category];

                      // Total plates issued in this category
                      const catTotalPlates = catObj.items.reduce((sum, item) => {
                        const key = `${catObj.category.trim().toLowerCase()}:::${item.trim().toLowerCase()}`;
                        const entry = foodLookupMap.get(key) || foodLookupMap.get(item.trim().toLowerCase());
                        return sum + (entry?.actualCount || 0);
                      }, 0);

                      return (
                        <div key={catObj.category} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60">
                          {/* Category Header */}
                          <div 
                            onClick={() => setCollapsedFoodCategories(prev => ({ ...prev, [catObj.category]: !prev[catObj.category] }))}
                            className="px-3 py-1.5 bg-slate-800/90 flex justify-between items-center cursor-pointer hover:bg-slate-800 select-none"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-xs font-bold">{isCollapsed ? '►' : '▼'}</span>
                              <Utensils className="w-3.5 h-3.5 text-rose-400" />
                              <span className="font-bold text-rose-300 text-[11px] uppercase tracking-wider">{catObj.category}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300 font-mono">
                                {filteredItems.length} items
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {catTotalPlates > 0 && (
                                <span className="text-[10px] font-bold text-rose-400 font-mono bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60">
                                  {catTotalPlates} plates
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Category Items Grid */}
                          {!isCollapsed && (
                            <div className="p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 bg-slate-950/40">
                              {filteredItems.map(itemName => {
                                const key = `${catObj.category.trim().toLowerCase()}:::${itemName.trim().toLowerCase()}`;
                                const entry = foodLookupMap.get(key) || foodLookupMap.get(itemName.trim().toLowerCase());
                                const currentQty = entry?.actualCount || 0;
                                const isExpanded = expandedFoodCards[key] || expandedFoodCards[itemName.trim().toLowerCase()];

                                return (
                                  <div
                                    key={itemName}
                                    className={`p-1.5 rounded-md border transition-all ${
                                      currentQty > 0
                                        ? 'bg-rose-950/30 border-rose-500/70 shadow-xs'
                                        : 'bg-slate-900/50 border-slate-800/90 hover:border-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <div className="truncate pr-1">
                                        <span className={`text-[10px] font-semibold block leading-tight truncate ${
                                          currentQty > 0 ? 'text-rose-200 font-bold' : 'text-slate-200'
                                        }`}>
                                          {itemName}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <input
                                          type="number"
                                          min="0"
                                          value={currentQty || ''}
                                          placeholder="0"
                                          onChange={e => handleFoodQtyChange(catObj.category, itemName, Number(e.target.value))}
                                          className={`w-10 h-5 text-center font-mono font-bold text-[10px] rounded border focus:outline-none focus:ring-1 focus:ring-rose-500 ${
                                            currentQty > 0 
                                              ? 'bg-rose-900/90 border-rose-400 text-white' 
                                              : 'bg-slate-800 border-slate-700 text-slate-300'
                                          }`}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => setExpandedFoodCards(prev => ({ ...prev, [key]: !prev[key], [itemName.trim().toLowerCase()]: !prev[itemName.trim().toLowerCase()] }))}
                                          className={`p-1 rounded text-[9px] cursor-pointer ${
                                            isExpanded ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                                          }`}
                                          title="Toggle meal details / breakdown"
                                        >
                                          ⚙
                                        </button>
                                      </div>
                                    </div>

                                    {/* Optional details drawer for Veg / Non-Veg / Rate / Vendor */}
                                    {isExpanded && (
                                      <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 space-y-1 bg-slate-950/70 p-1.5 rounded text-[9px]">
                                        <div className="grid grid-cols-2 gap-1">
                                          <div>
                                            <label className="text-emerald-400 uppercase text-[8px] font-bold block mb-0.5">Veg Count</label>
                                            <input
                                              type="number"
                                              min="0"
                                              value={entry?.vegCount || ''}
                                              placeholder="0"
                                              onChange={e => {
                                                const v = Number(e.target.value);
                                                setFormFood(prev => {
                                                  const idx = prev.findIndex(x => (x.mealType || '').trim().toLowerCase() === itemName.trim().toLowerCase());
                                                  if (idx >= 0) {
                                                    const copy = [...prev];
                                                    copy[idx] = { ...copy[idx], vegCount: v };
                                                    return copy;
                                                  } else {
                                                    return [
                                                      ...prev,
                                                      {
                                                        id: `food_${Date.now()}`,
                                                        category: catObj.category,
                                                        mealType: itemName,
                                                        actualCount: v,
                                                        plannedCount: v,
                                                        vegCount: v,
                                                        nonVegCount: 0,
                                                        ratePerPlate: 150,
                                                        totalCost: v * 150
                                                      }
                                                    ];
                                                  }
                                                });
                                              }}
                                              className="w-full h-5 bg-slate-800 border border-slate-700 px-1 py-0 rounded text-emerald-300 text-[9px] font-mono"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-amber-400 uppercase text-[8px] font-bold block mb-0.5">Non-Veg Count</label>
                                            <input
                                              type="number"
                                              min="0"
                                              value={entry?.nonVegCount || ''}
                                              placeholder="0"
                                              onChange={e => {
                                                const nv = Number(e.target.value);
                                                setFormFood(prev => {
                                                  const idx = prev.findIndex(x => (x.mealType || '').trim().toLowerCase() === itemName.trim().toLowerCase());
                                                  if (idx >= 0) {
                                                    const copy = [...prev];
                                                    copy[idx] = { ...copy[idx], nonVegCount: nv };
                                                    return copy;
                                                  } else {
                                                    return [
                                                      ...prev,
                                                      {
                                                        id: `food_${Date.now()}`,
                                                        category: catObj.category,
                                                        mealType: itemName,
                                                        actualCount: nv,
                                                        plannedCount: nv,
                                                        vegCount: 0,
                                                        nonVegCount: nv,
                                                        ratePerPlate: 150,
                                                        totalCost: nv * 150
                                                      }
                                                    ];
                                                  }
                                                });
                                              }}
                                              className="w-full h-5 bg-slate-800 border border-slate-700 px-1 py-0 rounded text-amber-300 text-[9px] font-mono"
                                            />
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-1">
                                          <div>
                                            <label className="text-slate-400 uppercase text-[8px] font-bold block mb-0.5">Rate/Plate (₹)</label>
                                            <input
                                              type="number"
                                              min="0"
                                              value={entry?.ratePerPlate || ''}
                                              placeholder="150"
                                              onChange={e => {
                                                const rate = Number(e.target.value);
                                                setFormFood(prev => {
                                                  const idx = prev.findIndex(x => (x.mealType || '').trim().toLowerCase() === itemName.trim().toLowerCase());
                                                  if (idx >= 0) {
                                                    const copy = [...prev];
                                                    copy[idx] = { 
                                                      ...copy[idx], 
                                                      ratePerPlate: rate,
                                                      totalCost: (copy[idx].actualCount || 0) * rate
                                                    };
                                                    return copy;
                                                  }
                                                  return prev;
                                                });
                                              }}
                                              className="w-full h-5 bg-slate-800 border border-slate-700 px-1 py-0 rounded text-white text-[9px] font-mono"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-slate-400 uppercase text-[8px] font-bold block mb-0.5">Total (₹)</label>
                                            <div className="h-5 bg-slate-900 border border-slate-800 px-1 flex items-center font-bold text-emerald-400 text-[9px] font-mono rounded">
                                              ₹{((entry?.actualCount || 0) * (entry?.ratePerPlate || 0)).toLocaleString()}
                                            </div>
                                          </div>
                                        </div>

                                        <div>
                                          <label className="text-slate-400 uppercase text-[8px] font-bold block mb-0.5">Catering Vendor / Supplier</label>
                                          <input
                                            type="text"
                                            value={entry?.vendor || ''}
                                            placeholder="e.g. Royal Caterers"
                                            onChange={e => {
                                              const v = e.target.value;
                                              setFormFood(prev => {
                                                const idx = prev.findIndex(x => (x.mealType || '').trim().toLowerCase() === itemName.trim().toLowerCase());
                                                if (idx >= 0) {
                                                  const copy = [...prev];
                                                  copy[idx] = { ...copy[idx], vendor: v };
                                                  return copy;
                                                }
                                                return prev;
                                              });
                                            }}
                                            className="w-full h-5 bg-slate-800 border border-slate-700 px-1 py-0 rounded text-white text-[9px]"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Custom / Additional Section */}
                    {customFoodList.length > 0 && (
                      <div className="border border-rose-900/60 rounded-lg overflow-hidden bg-rose-950/20 mt-2">
                        <div className="px-2.5 py-1 bg-rose-950/60 flex justify-between items-center border-b border-rose-900/60">
                          <span className="font-bold text-rose-300 text-[11px] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-rose-400" /> Custom / Additional Meals ({customFoodList.length})
                          </span>
                          <button
                            type="button"
                            onClick={handleAddCustomFoodRow}
                            className="px-2 py-0.2 bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-bold rounded cursor-pointer"
                          >
                            + Add Custom
                          </button>
                        </div>
                        <div className="p-1.5 space-y-1.5">
                          {customFoodList.map((f) => {
                            const actualIdx = formFood.findIndex(x => x.id === f.id);
                            return (
                              <div key={f.id} className="grid grid-cols-12 gap-1.5 items-center bg-slate-900/80 p-1.5 rounded-md border border-slate-800">
                                <div className="col-span-3">
                                  <label className="text-[8px] text-slate-400 uppercase block font-bold mb-0.5">Category</label>
                                  <input
                                    type="text"
                                    value={f.category || 'Custom Meals'}
                                    onChange={e => {
                                      const copy = [...formFood];
                                      copy[actualIdx].category = e.target.value;
                                      setFormFood(copy);
                                    }}
                                    className="w-full h-5 bg-slate-800 border border-slate-700 px-1.5 py-0 rounded text-white text-[10px]"
                                  />
                                </div>
                                <div className="col-span-4">
                                  <label className="text-[8px] text-slate-400 uppercase block font-bold mb-0.5">Meal Name</label>
                                  <input
                                    type="text"
                                    value={f.mealType}
                                    onChange={e => {
                                      const copy = [...formFood];
                                      copy[actualIdx].mealType = e.target.value;
                                      setFormFood(copy);
                                    }}
                                    className="w-full h-5 bg-slate-800 border border-slate-700 px-1.5 py-0 rounded text-white text-[10px] font-semibold"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="text-[8px] text-slate-400 uppercase block font-bold mb-0.5">Vendor</label>
                                  <input
                                    type="text"
                                    value={f.vendor || ''}
                                    onChange={e => {
                                      const copy = [...formFood];
                                      copy[actualIdx].vendor = e.target.value;
                                      setFormFood(copy);
                                    }}
                                    className="w-full h-5 bg-slate-800 border border-slate-700 px-1.5 py-0 rounded text-slate-300 text-[9px]"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="text-[8px] text-slate-400 uppercase block font-bold mb-0.5">Count</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={f.actualCount}
                                    onChange={e => {
                                      const val = Math.max(0, Number(e.target.value));
                                      const copy = [...formFood];
                                      copy[actualIdx].actualCount = val;
                                      copy[actualIdx].plannedCount = copy[actualIdx].plannedCount || val;
                                      copy[actualIdx].totalCost = val * (copy[actualIdx].ratePerPlate || 150);
                                      setFormFood(copy);
                                    }}
                                    className="w-full h-5 bg-slate-800 border border-slate-700 px-1 py-0 rounded text-rose-300 font-bold font-mono text-[10px] text-center"
                                  />
                                </div>
                                <div className="col-span-1 text-center pt-2">
                                  <button
                                    type="button"
                                    onClick={() => setFormFood(formFood.filter(x => x.id !== f.id))}
                                    className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer text-xs"
                                    title="Remove Item"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Warning if food count lower than present crew */}
                  {(() => {
                    const totalBf = formFood.filter(f => f.mealType.toLowerCase().includes('breakfast')).reduce((sum, f) => sum + (f.actualCount || 0), 0);
                    const totalLunch = formFood.filter(f => f.mealType.toLowerCase().includes('lunch')).reduce((sum, f) => sum + (f.actualCount || 0), 0);
                    const warn = formTotalPresentCrew > 0 && ((totalBf > 0 && totalBf < formTotalPresentCrew) || (totalLunch > 0 && totalLunch < formTotalPresentCrew));
                    if (!warn) return null;
                    return (
                      <div className="p-2 bg-amber-950/60 border border-amber-900/80 rounded-md text-amber-300 text-[10px] flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Warning: Total Breakfast ({totalBf}) or Lunch ({totalLunch}) meal count is lower than present crew headcount ({formTotalPresentCrew}). Please verify catering requirements.</span>
                      </div>
                    );
                  })()}

                  {/* Footer Summary */}
                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Total Meal Plates</span>
                        <span className="text-base font-black font-mono text-rose-300">
                          {formFood.reduce((acc, f) => acc + (f.actualCount || 0), 0)} <span className="text-[10px] font-normal text-slate-400">Plates</span>
                        </span>
                      </div>
                      <div className="border-l border-slate-800 pl-3">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Active Meals Logged</span>
                        <span className="text-xs font-bold font-mono text-slate-200">
                          {formFood.filter(f => (f.actualCount || 0) > 0).length} Items Logged
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCustomFoodRow}
                      className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 text-[10px] font-bold rounded cursor-pointer border border-rose-500/50 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Custom
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 8: DAILY NOTES */}
              {activeTab === 'notes' && (
                <div className="space-y-2.5 animate-fade-in">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-0.5 block">Production &amp; Operational Notes</label>
                    <textarea 
                      rows={2} 
                      value={formNotes} 
                      onChange={e => setFormNotes(e.target.value)} 
                      placeholder="Enter daily shoot notes, weather updates, delay reasons or equipment issues..." 
                      className="w-full p-1.5 bg-slate-800 border border-slate-700 text-white text-[11px] rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">DSR Workflow Status</label>
                    <select 
                      value={formStatus} 
                      onChange={e => setFormStatus(e.target.value as any)} 
                      className="w-full h-7 px-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-md text-xs font-semibold uppercase focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="Draft" className="bg-slate-900 text-slate-100 text-xs font-semibold">Draft</option>
                      <option value="Submitted" className="bg-slate-900 text-slate-100 text-xs font-semibold">Submitted</option>
                      <option value="Approved" className="bg-slate-900 text-slate-100 text-xs font-semibold">Approved</option>
                      <option value="Locked" className="bg-slate-900 text-slate-100 text-xs font-semibold">Locked</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Buttons */}
            <div className="shrink-0 flex justify-between items-center pt-3 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-md border border-slate-700 cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-1.5">
                <button 
                  type="button" 
                  onClick={() => handleSaveDSR('Draft')} 
                  disabled={isUnitTakenOnDate}
                  title={isUnitTakenOnDate ? `${formUnitName} is already recorded for ${formShootingDate}` : undefined}
                  className={`px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-bold rounded-md border border-slate-700 ${isUnitTakenOnDate ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  Save Draft
                </button>
                <button 
                  type="button" 
                  onClick={() => handleSaveDSR('Submitted')} 
                  disabled={isUnitTakenOnDate}
                  title={isUnitTakenOnDate ? `${formUnitName} is already recorded for ${formShootingDate}` : undefined}
                  className={`px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white text-[11px] font-bold rounded-md ${isUnitTakenOnDate ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  Submit DSR
                </button>
                <button 
                  type="button" 
                  onClick={() => handleSaveDSR('Approved')} 
                  disabled={isUnitTakenOnDate}
                  title={isUnitTakenOnDate ? `${formUnitName} is already recorded for ${formShootingDate}` : undefined}
                  className={`px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-md shadow-xs flex items-center gap-1 ${isUnitTakenOnDate ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Save &amp; Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick DSR Expense Booking Modal */}
      {bookingDsr && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl p-5 space-y-4 text-slate-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Book Expense from DSR</h3>
                  <p className="text-[11px] text-slate-400">
                    {bookingDsr.dayCode} • {bookingDsr.shootingDate} • {bookingDsr.unitName || 'Main Unit'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBookingDsr(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Select DSR Cost Module Preset</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'fuel', label: 'Fuel & Genset', icon: Fuel },
                    { id: 'catering', label: 'Unit Catering', icon: Utensils },
                    { id: 'transport', label: 'Fleet Transport', icon: Truck },
                    { id: 'crew_batta', label: 'Crew Batta', icon: Users },
                    { id: 'all', label: 'All Shoot Costs', icon: Sparkles }
                  ].map(p => {
                    const Icon = p.icon;
                    const isSel = bookingPreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleOpenBookingModal(bookingDsr, p.id as any)}
                        className={`p-2 rounded-lg border text-left flex items-center gap-1.5 cursor-pointer transition-colors ${
                          isSel 
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50' 
                            : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                        <span className="text-[10px] font-bold truncate">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Payee / Vendor</label>
                  <input
                    type="text"
                    value={bookingPayee}
                    onChange={e => setBookingPayee(e.target.value)}
                    className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={bookingAmount}
                    onChange={e => setBookingAmount(e.target.value)}
                    className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded text-xs text-emerald-400 font-bold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Payment Mode</label>
                  <select
                    value={bookingPaymentMode}
                    onChange={e => setBookingPaymentMode(e.target.value)}
                    className="w-full h-8 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="UPI">UPI</option>
                    <option value="Production Cash">Production Cash</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Source Reference</label>
                  <input
                    type="text"
                    readOnly
                    value={`${bookingDsr.dayCode} (${bookingDsr.shootingDate})`}
                    className="w-full h-8 px-2.5 bg-slate-800/50 border border-slate-700/60 rounded text-xs text-slate-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Voucher Description / Notes</label>
                <textarea
                  rows={2}
                  value={bookingNotes}
                  onChange={e => setBookingNotes(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setBookingDsr(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBookExpense}
                disabled={isBookingSubmitting}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isBookingSubmitting ? 'Booking Voucher...' : 'Confirm & Book Expense'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {/* Call Sheet & DSR Dispatcher Modal */}
      {isDispatcherOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setIsDispatcherOpen(false)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <CallSheetDsrDispatcher
              project={activeProject}
              dsrData={dispatchDsr || {}}
              callSheetData={{
                shootDay: dispatchDsr?.dayCode || 'Day 01',
                date: dispatchDsr?.shootingDate || new Date().toISOString().substring(0, 10),
                generalCall: dispatchDsr?.callTime || '06:30 AM',
                location: dispatchDsr?.primaryLocationName || 'Film City Studio Floor 4',
                weather: 'Sunny / Clear, 30°C'
              }}
              onClose={() => setIsDispatcherOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Success Toast */}
      {bookingSuccessToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-950 border border-emerald-600 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs font-bold">{bookingSuccessToast}</div>
        </div>
      )}
    </div>
  );
}
