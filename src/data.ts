import { Project, BudgetCategory, Expense, SubCategory, ChildCategory } from "./types";
import { DEFAULT_FILM_BUDGET_STRUCTURE } from "./defaultFilmBudget";
import { DEFAULT_OTT_BUDGET_STRUCTURE, DEFAULT_WEB_SERIES_BUDGET_STRUCTURE } from "./defaultOttBudget";
import { DEFAULT_COOKING_SHOW_BUDGET_STRUCTURE } from "./defaultCookingShowBudget";
export { DEFAULT_FILM_BUDGET_STRUCTURE, DEFAULT_OTT_BUDGET_STRUCTURE, DEFAULT_WEB_SERIES_BUDGET_STRUCTURE, DEFAULT_COOKING_SHOW_BUDGET_STRUCTURE };

export const COOKING_SHOW_COST_TYPES = [
  "One-Time",
  "Per Season",
  "Per Episode",
  "Per Round",
  "Per Challenge",
  "Per Shooting Day",
  "Per Contestant",
  "Per Kitchen Station",
  "Per Plate",
  "Per Kg",
  "Per Item",
  "Per Hour",
  "Weekly",
  "Monthly",
  "Rental",
  "Purchase",
  "Lump Sum",
  "Sponsor Supplied"
];

export const PAYMENT_TERMS_OPTIONS = [
  "PACKAGE",
  "EPISODE",
  "PER DAY",
  "PER SHIFT",
  "PER MONTH",
  "PER UNIT",
  "FLAT",
  "HOURLY",
  "One-Time",
  "Per Season",
  "Per Round",
  "Per Challenge",
  "Per Shooting Day",
  "Per Contestant",
  "Per Kitchen Station",
  "Per Plate",
  "Per Kg",
  "Per Item",
  "Weekly",
  "Rental",
  "Purchase",
  "Lump Sum",
  "Sponsor Supplied"
];

export const cleanProjectTitle = (rawName: string): string => {
  if (!rawName) return '';
  return rawName
    .replace(/\s*\((LOG|REF|PROJ|CODE)[^)]*\)/gi, '')
    .replace(/\s*\([A-Z0-9_-]+-[0-9]+\)/gi, '')
    .replace(/\s+(ON TRACK|PRE-PROD|IN PROD|POST-PROD|AT RISK|UPCOMING|COMPLETED|DONE|HOLD|ARCHIVED)$/i, '')
    .trim();
};

export const isProjectAdminRole = (role?: string): boolean => {
  if (!role) return true;
  const norm = role.trim().toLowerCase();
  return (
    norm === 'admin' ||
    norm === 'producer' ||
    norm === 'executive producer' ||
    norm === 'project owner' ||
    norm === 'project admin' ||
    norm === 'full admin' ||
    norm === 'owner' ||
    norm.includes('admin')
  );
};

export const INITIAL_PROJECTS: Project[] = [];

export const DEFAULT_NON_FICTION_BUDGET_STRUCTURE = [
  {
    name: "Format and Development",
    subCategories: [
      {
        name: "Format Licensing & Bible",
        childCategories: [
          { name: "Format Rights & Royalty", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Concept Bible & Show Manual", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "IP & Copyright Registration", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Pilot & Teaser Production",
        childCategories: [
          { name: "Pilot Shoot Crew & Studio", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 },
          { name: "Sizzle Reel & Pitch AV", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Channel and Broadcast",
    subCategories: [
      {
        name: "Broadcast Compliance & Clearance",
        childCategories: [
          { name: "SNT & S&P Compliance Clearance", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Uplink & Satellite Telecast Fees", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Channel Audit & Operations", count: 1, rate: 0, paymentTerms: "PER MONTH", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Pre-Production",
    subCategories: [
      {
        name: "Production Office & Setup",
        childCategories: [
          { name: "Production Office Rent", count: 1, rate: 0, paymentTerms: "PER MONTH", shifts: 1 },
          { name: "Electricity, Internet & Utilities", count: 1, rate: 0, paymentTerms: "PER MONTH", shifts: 1 },
          { name: "Office Furniture & IT Hardware", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 }
        ]
      },
      {
        name: "Recce & Planning",
        childCategories: [
          { name: "Studio Recce & Technical Scout", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Recce Travel, Fuel & Meals", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Producers and Officials",
    subCategories: [
      {
        name: "Production Management",
        childCategories: [
          { name: "Executive Producer Fee", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Showrunner / Project Head", count: 1, rate: 0, paymentTerms: "PER MONTH", shifts: 1 },
          { name: "Production Controller", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Commercial Head & Legal Officer", count: 1, rate: 0, paymentTerms: "PER MONTH", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Creative and Content",
    subCategories: [
      {
        name: "Creative Team",
        childCategories: [
          { name: "Creative Director", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Lead Script Writer", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Gag & Dialogue Writers", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Task & Game Designers", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Research Team", count: 1, rate: 0, paymentTerms: "PER MONTH", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Direction",
    subCategories: [
      {
        name: "Direction Team",
        childCategories: [
          { name: "Series / Show Director", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Floor Director & PCR Director", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Chief Assistant Director", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Assistant Directors (1st, 2nd, 3rd)", count: 3, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Casting and Contestants",
    subCategories: [
      {
        name: "Casting & Auditions",
        childCategories: [
          { name: "Casting Director & Team", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "City Audition Venues & Setup", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 },
          { name: "Audition Travel & Publicity", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 }
        ]
      },
      {
        name: "Contestants Honorarium",
        childCategories: [
          { name: "Contestant Episode Stipend", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Contestant Daily Allowance & Stay", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Prize Money & Trophies Buffer", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Host, Judges and Guests",
    subCategories: [
      {
        name: "Celebrity Talent",
        childCategories: [
          { name: "Show Host / Anchor Fee", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Grand Judges Fee", count: 2, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Celebrity Guests & Performers", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Talent Management Commission", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Crew Wages",
    subCategories: [
      {
        name: "Floor & Technical Crew",
        childCategories: [
          { name: "Floor Manager & Stage Hands", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Production Assistants & Spot Boys", count: 5, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Technical Engineers & Cables Crew", count: 2, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Studio and Location",
    subCategories: [
      {
        name: "Main Studio Hire",
        childCategories: [
          { name: "Studio Floor Rent", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Green Rooms & Holding Area Rent", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Location Permits & Municipal NOC", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Set and Art",
    subCategories: [
      {
        name: "Set Construction & Props",
        childCategories: [
          { name: "Production Designer Fee", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Set Construction Materials & Labor", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 },
          { name: "Set Dressing & Props Purchase/Rent", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 },
          { name: "Set Maintenance & Strike Down", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Games and Challenges",
    subCategories: [
      {
        name: "Game Design & Rigging",
        childCategories: [
          { name: "Game Equipment Fabrication", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 },
          { name: "Safety Harness & Testing", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Challenge Consumables & Props", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Camera",
    subCategories: [
      {
        name: "Multi-Cam Setup",
        childCategories: [
          { name: "DOP / Lead Cameraman", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Main Studio Cameras (4-8 Multi-cam)", count: 6, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Jimmy Jib / Crane / Robo Cam", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Drone & Action Cams (GoPro)", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Camera Attendants & Focus Pullers", count: 6, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "PCR and Broadcast Technical",
    subCategories: [
      {
        name: "PCR Control Room",
        childCategories: [
          { name: "PCR Switcher & Router Rent", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Multi-Track Audio Recording PCR", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Broadcast Monitors & Talkback Matrix", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "PCR Technical Engineers", count: 2, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Lighting and LED",
    subCategories: [
      {
        name: "Lighting Setup & LED Screens",
        childCategories: [
          { name: "Light Designer & Gaffer", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Studio Intelligent Lighting Rig", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "LED Wall & Video Wall Controller", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Dimmer Console & Light Boys", count: 4, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Sound and Music",
    subCategories: [
      {
        name: "Live Audio & IEM",
        childCategories: [
          { name: "Sound Director / Sound Engineer", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Wireless Lapel Mics & IEM Systems", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Live Band / DJ Music Equipment", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Boom Operators & Audio Utility", count: 2, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Graphics and AV",
    subCategories: [
      {
        name: "Realtime Graphics & Scoreboards",
        childCategories: [
          { name: "VizRT / Ross Expression Graphics System", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Graphics Operator & Content Playback", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Scoreboard & Audience Voting Graphics", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Costume",
    subCategories: [
      {
        name: "Wardrobe & Styling",
        childCategories: [
          { name: "Celebrity Host & Judges Designer Fee", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Contestant Wardrobe & Costumes", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Performers & Dancers Costumes", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Wardrobe Assistants & Laundry", count: 2, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Makeup and Hair",
    subCategories: [
      {
        name: "Hair & Makeup Artists",
        childCategories: [
          { name: "Host & Judges Personal Stylists", count: 2, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Contestants Makeup Team", count: 3, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Special Prosthetics & Touch-up Crew", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Audience Management",
    subCategories: [
      {
        name: "Studio Audience",
        childCategories: [
          { name: "Audience Co-ordinator & Crowd Controllers", count: 2, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Audience Daily Stipend & Transport", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Applause Light & Clapping Prompters", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Equipment",
    subCategories: [
      {
        name: "Production Rigging & Comms",
        childCategories: [
          { name: "Walkie-Talkie Intercom Sets", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Teleprompter System & Operator", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Production Heavy Rigging & Trusses", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Transport",
    subCategories: [
      {
        name: "Fleet & Logistics",
        childCategories: [
          { name: "VIP Luxury Cars (Host / Judges)", count: 2, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Contestant & Crew Passenger Vans", count: 3, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Equipment & Art Trucks", count: 2, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Genset and Vanity",
    subCategories: [
      {
        name: "Power & Vanity Vans",
        childCategories: [
          { name: "Heavy Duty Genset Vans (125-250 KVA)", count: 2, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Celebrity 3-Room Vanity Vans", count: 2, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Mobile Restroom / Sanitation Vans", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Fuel",
    subCategories: [
      {
        name: "Fuel Expenses",
        childCategories: [
          { name: "Genset Diesel Consumption", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Production Fleet Diesel & Petrol", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Accommodation and Travel",
    subCategories: [
      {
        name: "Lodging & Airfare",
        childCategories: [
          { name: "Host & Judges 5-Star Hotel Stay", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Outstation Crew & Contestant Hotel Rooms", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Airfare & Intercity Train Tickets", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Food and Catering",
    subCategories: [
      {
        name: "On-Set Meals & Refreshments",
        childCategories: [
          { name: "Crew & Audience Breakfast / Lunch / Dinner", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "VIP Greenroom Special Catering", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Tea / Coffee / Juice Stations", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Security and Medical",
    subCategories: [
      {
        name: "Safety & Security",
        childCategories: [
          { name: "Bouncers & VIP Bodyguards", count: 4, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Doctor & ICU Ambulance Standby on Set", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Fire Safety Equipment & Marshals", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Daily Shooting Expenses",
    subCategories: [
      {
        name: "On-Set Petty Cash",
        childCategories: [
          { name: "Production Contingent Petty Cash", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Sanitization & Hygiene Supplies", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Minor Repairs & On-set Hardware", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Post-Production",
    subCategories: [
      {
        name: "Editing & Sound Post",
        childCategories: [
          { name: "Offline Editing Setup & Chief Editor", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Online Editing & Color Grading (DI)", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Dubbing & Audio Post Mix (5.1 / Stereo)", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "VFX & Motion Graphics Package", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Promotion and Digital",
    subCategories: [
      {
        name: "Marketing & Promos",
        childCategories: [
          { name: "Show Teaser & Promo Shoots", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 },
          { name: "Social Media & Digital Content Creation", count: 1, rate: 0, paymentTerms: "PER MONTH", shifts: 1 },
          { name: "Publicity Photographer & PR Agency", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Sponsorship",
    subCategories: [
      {
        name: "Sponsor Deliverables",
        childCategories: [
          { name: "Brand Integration & In-Show Product Display", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Sponsor Branding Materials & Signage", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Deliverables",
    subCategories: [
      {
        name: "Broadcast Deliverables",
        childCategories: [
          { name: "Master Tapes / LTO Hard Drives", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Technical QC Verification", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Closed Captioning & Subtitling", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Insurance and Legal",
    subCategories: [
      {
        name: "Insurance & Legal Clearance",
        childCategories: [
          { name: "Public Liability & Production Insurance", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Contestants & Crew Accidental Insurance", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Legal Retainer & Contract Drafting", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Administration",
    subCategories: [
      {
        name: "Accounting & Audit",
        childCategories: [
          { name: "Production Accountants & Auditors", count: 1, rate: 0, paymentTerms: "PER MONTH", shifts: 1 },
          { name: "Bank Charges & Financial Processing", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Contingency",
    subCategories: [
      {
        name: "Emergency Reserve",
        childCategories: [
          { name: "Unforeseen Production Contingency", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Recoveries and Credits",
    subCategories: [
      {
        name: "Credits & Rebates",
        childCategories: [
          { name: "Sponsorship Credits & Brand Offsets", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Scrap & Asset Disposal Income", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  }
];

export const DEFAULT_SHORT_FILM_BUDGET_STRUCTURE = [
  {
    name: "Story, Script & Development",
    subCategories: [
      {
        name: "Story Rights & Scriptwriting",
        childCategories: [
          { name: "Story Purchase & Optioning", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Screenplay & Dialogue Writing", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Script Registration & Copyright", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Cast and Direction",
    subCategories: [
      {
        name: "Talent & Director",
        childCategories: [
          { name: "Lead Actor / Actress Fee", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 },
          { name: "Supporting Cast & Extras", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Director Fee", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Assistant Director / Script Supervisor", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Production Crew & Technical Equipment",
    subCategories: [
      {
        name: "Camera, Grip & Lighting",
        childCategories: [
          { name: "Director of Photography (DP)", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Digital Cinema Camera Package", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Portable LED Light Kit & Grip Accessories", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      },
      {
        name: "Location Sound",
        childCategories: [
          { name: "Sound Recordist & Boom Operator", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Multi-Track Audio Recorder Kit", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Locations, Art & Unit Expenses",
    subCategories: [
      {
        name: "Locations & Set Design",
        childCategories: [
          { name: "Shooting Location Rentals & Permits", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Props, Costumes & Makeup Kit", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 }
        ]
      },
      {
        name: "Unit Catering & Transport",
        childCategories: [
          { name: "Crew Meals & On-Set Refreshments", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Unit Van & Fuel Allowance", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Post-Production & Festival Distribution",
    subCategories: [
      {
        name: "Editing & Sound Design",
        childCategories: [
          { name: "Offline Video Edit & Assembly", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Color Grading & DI", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Sound Design, BGM & Audio Mix", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Festivals & PR",
        childCategories: [
          { name: "Film Festival Submission Fees (FilmFreeway)", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 },
          { name: "DCP Creation & Poster Design", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Contingency & Recoveries",
    subCategories: [
      {
        name: "Reserve",
        childCategories: [
          { name: "Unforeseen Emergency Contingency", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  }
];

// DEFAULT_WEB_SERIES_BUDGET_STRUCTURE is imported from ./defaultOttBudget
// DEFAULT_COOKING_SHOW_BUDGET_STRUCTURE is imported from ./defaultCookingShowBudget


export const DEFAULT_QUIZ_SHOW_BUDGET_STRUCTURE = [
  {
    name: "Question Bank & Game Rules",
    subCategories: [
      {
        name: "Research & Question Writing",
        childCategories: [
          { name: "Lead Question Bank Researchers & Writers", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Academic & Fact Verification Advisors", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Secure Question Bank Vault & Encryption", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Buzzer Engine & Game Software",
        childCategories: [
          { name: "Buzzer Hardware & Millisecond Trigger Rig", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "On-Screen Game Scoreboard & Graphics Software", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Quiz Master & Resident Experts",
    subCategories: [
      {
        name: "Host & Experts",
        childCategories: [
          { name: "Quiz Master / Celebrity Host Fee", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Lifeline Subject Matter Experts", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Studio Stage, Podium & LED Screen",
    subCategories: [
      {
        name: "Quiz Arena Set",
        childCategories: [
          { name: "Soundstage Floor Rent for Quiz Arena", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Contestant Podiums & Illuminated Stage", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Curved LED Backdrop Screen & DMX Lighting", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Contestants & Prize Money Pool",
    subCategories: [
      {
        name: "Contestant Logistics",
        childCategories: [
          { name: "Nationwide Audition Drives & Screening", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Contestant Travel, Flights & Hotel Stay", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Contestant Welfare & Chaperones", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      },
      {
        name: "Prize Money Escrow",
        childCategories: [
          { name: "Jackpot Prize Escrow Deposit", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Daily Cash Prize Pool", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Audience & Technical Crew",
    subCategories: [
      {
        name: "Studio Audience",
        childCategories: [
          { name: "Audience Coordinators & Warm-Up Anchor", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Audience Daily Refreshments & Transport", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      },
      {
        name: "PCR & Technical Crew",
        childCategories: [
          { name: "PCR Director & Game Controller", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Camera Crew & Sound Engineers", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Post-Production & Dramatic Score",
    subCategories: [
      {
        name: "Edit & Audio Packaging",
        childCategories: [
          { name: "Fast Offline Cut & Pause Trimming", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Dramatic Countdown Stings & Music Score", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Question Graphic Templates & Score Popups", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Contingency & Recoveries",
    subCategories: [
      {
        name: "Reserve",
        childCategories: [
          { name: "Unforeseen Production Contingency", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  }
];

export const DEFAULT_REALITY_SHOW_BUDGET_STRUCTURE = [
  {
    name: "Format & Reality Development",
    subCategories: [
      {
        name: "Format License & Bible",
        childCategories: [
          { name: "Reality Format Franchise License Fee", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Reality House Rulebook & Legal Manual", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "House Set & 24/7 Surveillance Rig",
    subCategories: [
      {
        name: "Reality House Set Construction",
        childCategories: [
          { name: "Soundstage House Set Construction", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Confession Room & Secret Chambers", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Acoustic Isolation & Soundproofing", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "24/7 Camera & Audio Surveillance",
        childCategories: [
          { name: "Robotic PTZ Surveillance Cameras (60+ Rigs)", count: 1, rate: 0, paymentTerms: "PER MONTH", shifts: 1 },
          { name: "Hidden Wall Microphones & Room Bugs", count: 1, rate: 0, paymentTerms: "PER MONTH", shifts: 1 },
          { name: "Central PCR Master Control Console", count: 1, rate: 0, paymentTerms: "PER MONTH", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Contestants Welfare & Isolation",
    subCategories: [
      {
        name: "Housemates & Casting",
        childCategories: [
          { name: "Contestant Contract Fees", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Pre-Show Quarantine & Medical Screenings", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "On-Set Psychologist & Welfare Officers", count: 1, rate: 0, paymentTerms: "PER MONTH", shifts: 1 }
        ]
      },
      {
        name: "Daily House Supplies & Tasks",
        childCategories: [
          { name: "Daily Ration & Grocery Allowance for House", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Weekly Luxury Task Props & Outfits", count: 1, rate: 0, paymentTerms: "WEEKLY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Voting, Audit & S&P Compliance",
    subCategories: [
      {
        name: "Auditor & Voting System",
        childCategories: [
          { name: "Auditing Firm Voting Verification (KPMG/EY)", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "SMS / App Voting Integration Fees", count: 1, rate: 0, paymentTerms: "PER MONTH", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "PCR Shifts & Floor Crew",
    subCategories: [
      {
        name: "24/7 Shift Personnel",
        childCategories: [
          { name: "PCR Story Editors (3 Shifts)", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Camera Operators (Shift A/B/C)", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "House Floor Security Unit", count: 1, rate: 0, paymentTerms: "PER MONTH", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Post-Production & Daily Episode Edits",
    subCategories: [
      {
        name: "Unscripted Multicam Edit",
        childCategories: [
          { name: "24-Hour Turnaround Daily Episode Editors", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Dramatic Score & Sting Library", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Promo & Elimination Cutters", count: 1, rate: 0, paymentTerms: "PER MONTH", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Contingency & Recoveries",
    subCategories: [
      {
        name: "Reserve",
        childCategories: [
          { name: "Unforeseen Reality Contingency", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  }
];

export const DEFAULT_MUSIC_SHOW_BUDGET_STRUCTURE = [
  {
    name: "Song Rights & Music Licensing",
    subCategories: [
      {
        name: "Music Rights & Clearances",
        childCategories: [
          { name: "Music Publishing Rights & Sync License", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "IPRS / Composer NOC Fees", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Live Band, Orchestra & Sound Rig",
    subCategories: [
      {
        name: "Band & Arrangers",
        childCategories: [
          { name: "Music Director & Arrangers", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Live Band Instrumentalists & Rhythm Section", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Backing Vocalists Choir", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      },
      {
        name: "Stage Audio System",
        childCategories: [
          { name: "Wireless In-Ear Monitor (IEM) System", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Vocal Microphones Package (Shure/Sennheiser)", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Multi-Track Live Recording Console", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Singers, Judges & Mentors",
    subCategories: [
      {
        name: "Celebrity Panel & Hosts",
        childCategories: [
          { name: "Celebrity Music Judges", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Guest Star Mentors & Singers", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Show Anchor & Host", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 }
        ]
      },
      {
        name: "Singer Contestants",
        childCategories: [
          { name: "Vocal Trainers & Groomers", count: 1, rate: 0, paymentTerms: "PER MONTH", shifts: 1 },
          { name: "Contestants Roster Stipend", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Concert Stage & Lighting",
    subCategories: [
      {
        name: "Concert Stage Rig",
        childCategories: [
          { name: "Acoustic Studio Rent", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Intelligent Beam Lighting & Truss", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Stage Haze & FX Smoke Machines", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Post-Production & Multi-Track Mix",
    subCategories: [
      {
        name: "Audio Mastering & Edit",
        childCategories: [
          { name: "Multi-Track Vocal Mixing & Tuning", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Offline Video Edit", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Stereo / 5.1 Surround Mastering", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Contingency & Recoveries",
    subCategories: [
      {
        name: "Reserve",
        childCategories: [
          { name: "Unforeseen Music Production Contingency", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  }
];

export const DEFAULT_DANCE_SHOW_BUDGET_STRUCTURE = [
  {
    name: "Choreography & Rehearsals",
    subCategories: [
      {
        name: "Choreographers & Dance Groups",
        childCategories: [
          { name: "Chief Choreographers", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Assistant Choreographers", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Troupe Dancers", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      },
      {
        name: "Rehearsal Halls",
        childCategories: [
          { name: "Spring-Floor Rehearsal Studio Rent", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Rehearsal Sound System & Mirrors", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Stage, Dance Floor & Aerial Rigging",
    subCategories: [
      {
        name: "Stage Floor & Safety",
        childCategories: [
          { name: "High-Grip Non-Slip Dance Matting", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Aerial Flying Harness & Certified Stunt Rigging", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Interactive LED Dance Floor", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Costumes, Hair & Makeup",
    subCategories: [
      {
        name: "Look Management",
        childCategories: [
          { name: "Custom Dance Outfits & Quick-Change Costumes", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Waterproof Heavy Stage Makeup Crew", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Stylists & Wardrobe Maintenance", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Judges, Host & Medical Safety",
    subCategories: [
      {
        name: "Judges & Anchor",
        childCategories: [
          { name: "Celebrity Dance Judges", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Host & Co-Anchor", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 }
        ]
      },
      {
        name: "Physio & Medical Unit",
        childCategories: [
          { name: "On-Set Physiotherapist & Ice Baths", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Emergency Ambulance Unit On Standby", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Post-Production & Beat Sync",
    subCategories: [
      {
        name: "High-Speed Video Edit",
        childCategories: [
          { name: "High-Action Multicam Dance Video Cut", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Slow-Motion Impact Replays & VFX", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Dance Track Audio Clearance", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Contingency & Recoveries",
    subCategories: [
      {
        name: "Reserve",
        childCategories: [
          { name: "Unforeseen Dance Production Contingency", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  }
];

export const DEFAULT_AD_FILM_BUDGET_STRUCTURE = [
  {
    name: "Creative Campaign & Storyboard",
    subCategories: [
      {
        name: "Director Treatment & Pre-Production",
        childCategories: [
          { name: "Director Treatment & Creative Development", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Storyboard Artist & Animatic Creation", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Agency Briefing & Tech Recce", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Agency & Client Approvals",
    subCategories: [
      {
        name: "Client Logistics & Preview",
        childCategories: [
          { name: "Agency & Client Preview Suite Setup", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Client Hospitality & Executive Transport", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Product Styling & Hero Rigs",
    subCategories: [
      {
        name: "Product Roster & Styling",
        childCategories: [
          { name: "Product Specialist & Precision Rigging", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "High-Speed Robotic Arm (Bolt/Spike Rig)", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Food / Hero Shot Stylist & Mock-ups", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Lead Models, Casting & Voiceover",
    subCategories: [
      {
        name: "Cast & Voice Talent",
        childCategories: [
          { name: "Commercial Lead Models / Celebrity Brand Ambassador", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 },
          { name: "Voiceover (VO) Artist Recording", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 },
          { name: "Hand & Product Double Cast", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Commercial Director, Crew & Gear",
    subCategories: [
      {
        name: "Director & Technical Unit",
        childCategories: [
          { name: "Commercial Director Fee", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Director of Photography (DP) Commercial Rate", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "High-Speed Phantom / Arri Camera Package", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "High-Power HMI Lighting Grid & Gaffer", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Post-Production, Retouching & Deliverables",
    subCategories: [
      {
        name: "Offline, Retouching & VFX",
        childCategories: [
          { name: "Offline Edit & Client Iterations", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Product Cleanup & Digital Beauty Retouching", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "3D Packshot VFX & Motion Graphics", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Commercial Color Grading & DI", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Master Adaptations",
        childCategories: [
          { name: "TVC Master 30s/15s & Digital Cutdowns", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Regional Language Dubs & Master Export", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Contingency & Recoveries",
    subCategories: [
      {
        name: "Reserve",
        childCategories: [
          { name: "Commercial Shooting Overtime Contingency", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  }
];

export const DEFAULT_DOCUMENTARY_BUDGET_STRUCTURE = [
  {
    name: "Research & Fact Verification",
    subCategories: [
      {
        name: "Research & Clearance",
        childCategories: [
          { name: "Lead Documentary Researcher", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Historical Fact Verification Specialist", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Subject Release Forms & Legal Clearance", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Archival Rights & Footage Licensing",
    subCategories: [
      {
        name: "Archival Assets",
        childCategories: [
          { name: "Historical News Footage Licensing", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Archival Stills & Photo Rights", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Public Domain & Library Fees", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Subject & Interview Logistics",
    subCategories: [
      {
        name: "Interviewees & Locations",
        childCategories: [
          { name: "Subject Honorarium & Travel Allowance", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Interview Location Studio / Venue Rentals", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Field Crew & Travel Fixers",
    subCategories: [
      {
        name: "Field Unit",
        childCategories: [
          { name: "Documentary Director / Camera Operator", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Location Sound Recordist & Lapel Mics", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Local Fixers & Translators", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Field Travel, Vehicles & Flights", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Post-Production & Transcriptions",
    subCategories: [
      {
        name: "Editing & Sound Restoration",
        childCategories: [
          { name: "Documentary Assembly Editor", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Audio Noise Reduction & Restoration", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Interview Transcriptions & Subtitles", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Narrator Voiceover Recording", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Contingency & Recoveries",
    subCategories: [
      {
        name: "Reserve",
        childCategories: [
          { name: "Documentary Travel & Field Contingency", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  }
];

export const DEFAULT_TRAVEL_SHOW_BUDGET_STRUCTURE = [
  {
    name: "Destinations, Visas & Tourism Permits",
    subCategories: [
      {
        name: "Permits & Clearances",
        childCategories: [
          { name: "International Film Shooting Visas", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Tourism Board Filming Clearances & Fees", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Heritage Site & National Park Filming Fees", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Local Fixers & Destination Fleet",
    subCategories: [
      {
        name: "Destination Unit",
        childCategories: [
          { name: "Local Destination Fixers & Guides", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "All-Terrain SUV Fleet Rental", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Fuel, Tolls & Local Transit Permits", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Host, Presenters & Travel Gear",
    subCategories: [
      {
        name: "Anchor & Presenter",
        childCategories: [
          { name: "Celebrity Travel Host Fee", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Weather-Ready Outfits & Gear", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Mobile Field Crew & Gear Freight",
    subCategories: [
      {
        name: "Mobile Unit",
        childCategories: [
          { name: "Director / DP Travel Team", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Compact FX Cinema Cameras & Drones", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Gear Customs Carnet & Air Freight", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Emergency International Travel Insurance", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Post-Production & Animated Route Maps",
    subCategories: [
      {
        name: "Packaging & Music",
        childCategories: [
          { name: "Travel Video Edit & Pace Trimming", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "Animated Route Maps & Destination Info Graphics", count: 1, rate: 0, paymentTerms: "EPISODE", shifts: 1 },
          { name: "World Fusion BGM Score", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Contingency & Recoveries",
    subCategories: [
      {
        name: "Reserve",
        childCategories: [
          { name: "Travel Delay & Weather Contingency", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  }
];

export const DEFAULT_AWARD_SHOW_BUDGET_STRUCTURE = [
  {
    name: "Award Categories, Trophies & Audit",
    subCategories: [
      {
        name: "Trophies & Voting",
        childCategories: [
          { name: "Custom Award Trophy Fabrication", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Official Voting Audit Firm (PwC/EY/KPMG)", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Jury Panel Honorariums & Meetings", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Arena Stage LED, Trussing & Red Carpet",
    subCategories: [
      {
        name: "Stadium / Arena Stage",
        childCategories: [
          { name: "Indoor Stadium / Arena Venue Rent", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Massive Curved LED Wall Setup", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Intelligent Moving Light Grid & DMX Control", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      },
      {
        name: "Red Carpet & Media Pen",
        childCategories: [
          { name: "Red Carpet Plush Carpet & Media Wall Backdrop", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Press & Media Pen Management", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Performers, Hosts & VIP Hospitality",
    subCategories: [
      {
        name: "Celebrity Performers & Hosts",
        childCategories: [
          { name: "A-List Star Dance & Music Act Fees", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Celebrity Hosts & Co-Anchors", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Award Presenters Honorarium", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "VIP Hospitality & Security",
        childCategories: [
          { name: "5-Star Hotel Suites for Nominees & VIPs", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Private Security Bouncers & Police Escorts", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Vanity Vans for Star Performers", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Live Broadcast OB Van & Post-Production",
    subCategories: [
      {
        name: "OB Van & Telecast Master",
        childCategories: [
          { name: "HD Multi-Camera OB Van & Crane Rigs", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Live Audio Mix & Broadcast Uplink", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Broadcast Master TV Edit & Package", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Contingency & Recoveries",
    subCategories: [
      {
        name: "Reserve",
        childCategories: [
          { name: "Unforeseen Live Event Contingency", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  }
];

export function getBudgetStructureForProjectType(projectType?: string) {
  if (!projectType) return DEFAULT_FILM_BUDGET_STRUCTURE;

  const norm = projectType.toLowerCase().trim();

  if (norm.includes('cook') || norm.includes('culinary') || norm.includes('food')) {
    return DEFAULT_COOKING_SHOW_BUDGET_STRUCTURE;
  }
  if (norm.includes('quiz') || norm.includes('game show') || norm.includes('trivia')) {
    return DEFAULT_QUIZ_SHOW_BUDGET_STRUCTURE;
  }
  if (norm.includes('music reality') || norm.includes('singing reality') || norm.includes('reality show') || norm.includes('reality tv') || norm.includes('non-fiction') || norm.includes('non_fiction') || norm.includes('talk show')) {
    return DEFAULT_NON_FICTION_BUDGET_STRUCTURE;
  }
  if (norm.includes('music') || norm.includes('sing') || norm.includes('song') || norm.includes('band')) {
    return DEFAULT_MUSIC_SHOW_BUDGET_STRUCTURE;
  }
  if (norm.includes('dance') || norm.includes('choreograph')) {
    return DEFAULT_DANCE_SHOW_BUDGET_STRUCTURE;
  }
  if (norm.includes('reality') || norm.includes('house')) {
    return DEFAULT_REALITY_SHOW_BUDGET_STRUCTURE;
  }
  if (norm.includes('ad film') || norm.includes('commercial') || norm.includes('tvc') || norm.includes('advertisement')) {
    return DEFAULT_AD_FILM_BUDGET_STRUCTURE;
  }
  if (norm.includes('doc') || norm.includes('documentary')) {
    return DEFAULT_DOCUMENTARY_BUDGET_STRUCTURE;
  }
  if (norm.includes('travel') || norm.includes('expedition') || norm.includes('tour')) {
    return DEFAULT_TRAVEL_SHOW_BUDGET_STRUCTURE;
  }
  if (norm.includes('award') || norm.includes('gala') || norm.includes('ceremony')) {
    return DEFAULT_AWARD_SHOW_BUDGET_STRUCTURE;
  }
  if (norm.includes('short')) {
    return DEFAULT_SHORT_FILM_BUDGET_STRUCTURE;
  }
  if (norm.includes('series') || norm.includes('web') || norm.includes('ott') || norm.includes('fiction tv') || norm.includes('tv show')) {
    return DEFAULT_WEB_SERIES_BUDGET_STRUCTURE;
  }
  if (norm.includes('non-fiction') || norm.includes('non_fiction') || norm.includes('talk show')) {
    return DEFAULT_NON_FICTION_BUDGET_STRUCTURE;
  }

  // Default fallback for Film or unspecified
  return DEFAULT_FILM_BUDGET_STRUCTURE;
}

export const INITIAL_CATEGORIES: BudgetCategory[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const generateStandardCategoriesForProject = (projectId: string, templateType?: string): BudgetCategory[] => {
  const cleanProjId = (projectId || "p_default").startsWith("wp_") ? projectId.substring(3) : projectId;
  
  const structure = getBudgetStructureForProjectType(templateType);

  return structure.map((catDef, idx) => {
    const catCode = String(idx + 1);
    const catId = `c_def_${cleanProjId.replace(/\W/g, "_")}_${idx + 1}`;

    const subCategories = (catDef.subCategories || []).map((subDef, sIdx) => {
      const subCode = `${catCode}.${sIdx + 1}`;
      const subId = `sub_${catId}_${sIdx + 1}`;

      const childCategories = (subDef.childCategories || []).map((chDef, chIdx) => {
        const chCode = `${subCode}.${chIdx + 1}`;
        const chId = `ch_${subId}_${chIdx + 1}`;
        const cnt = chDef.count ?? 1;
        const rt = chDef.rate ?? 0;
        const sh = chDef.shifts ?? 1;
        return {
          id: chId,
          subCategoryId: subId,
          categoryId: catId,
          projectId: cleanProjId,
          name: chDef.name,
          code: chCode,
          count: cnt,
          rate: rt,
          paymentTerms: chDef.paymentTerms || "PER DAY",
          shifts: sh,
          allocatedAmount: cnt * rt * sh,
          spentAmount: 0
        };
      });

      let subAlloc = 0;
      const subObj = subDef as any;
      if (childCategories.length > 0) {
        subAlloc = childCategories.reduce((s, c) => s + c.allocatedAmount, 0);
      } else {
        const cnt = subObj.count ?? 1;
        const rt = subObj.rate ?? 0;
        const sh = subObj.shifts ?? 1;
        subAlloc = cnt * rt * sh;
      }

      return {
        id: subId,
        categoryId: catId,
        projectId: cleanProjId,
        name: subDef.name,
        code: subCode,
        count: subObj.count ?? 1,
        rate: subObj.rate ?? 0,
        paymentTerms: subObj.paymentTerms || "PACKAGE",
        shifts: subObj.shifts ?? 1,
        allocatedAmount: subAlloc,
        spentAmount: 0,
        childCategories: childCategories
      };
    });

    const catAlloc = subCategories.reduce((s, sub) => s + sub.allocatedAmount, 0);

    return {
      id: catId,
      projectId: cleanProjId,
      name: catDef.name,
      code: catCode,
      allocatedAmount: catAlloc,
      spentAmount: 0,
      subCategories: subCategories
    };
  });
};

export const sortCategoriesByStandardStructure = (cats: BudgetCategory[], projectType?: string): BudgetCategory[] => {
  let effectiveProjectType = projectType;
  if (!effectiveProjectType && cats.length > 0) {
    const isCooking = cats.some(c => {
      const n = c.name.trim().toLowerCase();
      return n.includes('kitchen & culinary') || n.includes('kitchen station') || n.includes('prizes & challenges') || n.includes('audience & contestants');
    });
    if (isCooking) {
      effectiveProjectType = 'Cooking Show';
    }
  }

  // If cats have multiple projects, group and sort per project structure
  const projIds = Array.from(new Set(cats.map(c => c.projectId).filter(Boolean)));
  if (projIds.length > 1 && !projectType) {
    const sortedResult: BudgetCategory[] = [];
    projIds.forEach(pId => {
      const pCats = cats.filter(c => c.projectId === pId);
      const isCook = pCats.some(c => {
        const n = c.name.trim().toLowerCase();
        return n.includes('kitchen & culinary') || n.includes('prizes & challenges') || n.includes('audience & contestants');
      });
      const pSorted = sortCategoriesByStandardStructure(pCats, isCook ? 'Cooking Show' : undefined);
      sortedResult.push(...pSorted);
    });
    const orphans = cats.filter(c => !c.projectId);
    if (orphans.length > 0) {
      sortedResult.push(...sortCategoriesByStandardStructure(orphans, projectType));
    }
    return sortedResult;
  }

  const structure = getBudgetStructureForProjectType(effectiveProjectType);

  const getCatIndex = (c: BudgetCategory) => {
    const nameLower = c.name.trim().toLowerCase();
    const idx = structure.findIndex(
      def => def.name.trim().toLowerCase() === nameLower
    );
    if (idx !== -1) return idx;
    if (c.code) {
      const p = parseFloat(c.code);
      if (!isNaN(p)) return p - 1;
    }
    return 999;
  };

  // Backfill any missing top-level categories defined in structure
  const existingCatNames = new Set(cats.map(c => c.name.trim().toLowerCase()));
  const fullCats = [...cats];
  const targetProjId = cats[0]?.projectId || "p_default";

  structure.forEach((catDef, idx) => {
    if (!existingCatNames.has(catDef.name.trim().toLowerCase())) {
      const catCode = String(idx + 1);
      const catId = `c_def_${targetProjId.replace(/\W/g, "_")}_${idx + 1}`;
      const subCategories = (catDef.subCategories || []).map((subDef, sIdx) => {
        const subCode = `${catCode}.${sIdx + 1}`;
        const subId = `sub_${catId}_${sIdx + 1}`;
        const childCategories = (subDef.childCategories || []).map((chDef, chIdx) => {
          const chCode = `${subCode}.${chIdx + 1}`;
          const chId = `ch_${subId}_${chIdx + 1}`;
          const cnt = chDef.count ?? 1;
          const rt = chDef.rate ?? 0;
          const sh = chDef.shifts ?? 1;
          return {
            id: chId,
            subCategoryId: subId,
            categoryId: catId,
            projectId: targetProjId,
            name: chDef.name,
            code: chCode,
            count: cnt,
            rate: rt,
            paymentTerms: chDef.paymentTerms || "PER DAY",
            shifts: sh,
            allocatedAmount: cnt * rt * sh,
            spentAmount: 0
          };
        });
        return {
          id: subId,
          categoryId: catId,
          projectId: targetProjId,
          name: subDef.name,
          code: subCode,
          count: 1,
          rate: 0,
          paymentTerms: "PACKAGE",
          shifts: 1,
          allocatedAmount: childCategories.reduce((s, c) => s + c.allocatedAmount, 0),
          spentAmount: 0,
          childCategories
        };
      });
      fullCats.push({
        id: catId,
        projectId: targetProjId,
        name: catDef.name,
        code: catCode,
        allocatedAmount: subCategories.reduce((s, sub) => s + sub.allocatedAmount, 0),
        spentAmount: 0,
        subCategories
      });
    }
  });

  const sortedCats = [...fullCats].sort((a, b) => getCatIndex(a) - getCatIndex(b));

  return sortedCats.map((cat, catIdx) => {
    const catCode = String(catIdx + 1);
    const catDef = structure.find(
      def => def.name.trim().toLowerCase() === cat.name.trim().toLowerCase()
    );

    const getSubIndex = (sub: SubCategory) => {
      if (catDef && catDef.subCategories) {
        const sIdx = catDef.subCategories.findIndex(
          sDef => sDef.name.trim().toLowerCase() === sub.name.trim().toLowerCase()
        );
        if (sIdx !== -1) return sIdx;
      }
      if (sub.code) {
        const parts = sub.code.split('.');
        const lastPart = parts[parts.length - 1];
        const p = parseFloat(lastPart);
        if (!isNaN(p)) return p - 1;
      }
      return 999;
    };

    // Backfill any missing subcategories from catDef
    let currentSubs = [...(cat.subCategories || [])];
    if (catDef && catDef.subCategories) {
      const existingSubNames = new Set(currentSubs.map(s => s.name.trim().toLowerCase()));
      catDef.subCategories.forEach((sDef, sIdx) => {
        if (!existingSubNames.has(sDef.name.trim().toLowerCase())) {
          const subId = `sub_${cat.id}_${sIdx + 1}`;
          currentSubs.push({
            id: subId,
            categoryId: cat.id,
            projectId: cat.projectId || targetProjId,
            name: sDef.name,
            code: `${catCode}.${sIdx + 1}`,
            count: 1,
            rate: 0,
            paymentTerms: 'PACKAGE',
            shifts: 1,
            allocatedAmount: 0,
            spentAmount: 0,
            childCategories: []
          });
        }
      });
    }

    const sortedSubs = currentSubs.sort((sa, sb) => getSubIndex(sa) - getSubIndex(sb));

    const finalSubs = sortedSubs.map((sub, subIdx) => {
      const subCode = `${catCode}.${subIdx + 1}`;
      let subDef: any = null;
      if (catDef && catDef.subCategories) {
        subDef = catDef.subCategories.find(
          sDef => sDef.name.trim().toLowerCase() === sub.name.trim().toLowerCase()
        );
      }

      const getChildIndex = (ch: ChildCategory) => {
        if (subDef && subDef.childCategories) {
          const chIdx = subDef.childCategories.findIndex(
            chDef => chDef.name.trim().toLowerCase() === ch.name.trim().toLowerCase()
          );
          if (chIdx !== -1) return chIdx;
        }
        if (ch.code) {
          const parts = ch.code.split('.');
          const lastPart = parts[parts.length - 1];
          const p = parseFloat(lastPart);
          if (!isNaN(p)) return p - 1;
        }
        return 999;
      };

      let finalChildren: ChildCategory[] = [];
      if (sub.childCategories && sub.childCategories.length > 0) {
        const sortedChildren = [...sub.childCategories].sort((ca, cb) => getChildIndex(ca) - getChildIndex(cb));
        finalChildren = sortedChildren.map((ch, chIdx) => ({
          ...ch,
          code: `${subCode}.${chIdx + 1}`
        }));
      } else if (subDef && subDef.childCategories && subDef.childCategories.length > 0) {
        // Backfill 3-tier child categories if missing in existing subcategory
        finalChildren = subDef.childCategories.map((chDef: any, chIdx: number) => {
          const chCode = `${subCode}.${chIdx + 1}`;
          const chId = `ch_${sub.id}_${chIdx + 1}`;
          const cnt = chDef.count ?? 1;
          const rt = chDef.rate ?? 0;
          const sh = chDef.shifts ?? 1;
          return {
            id: chId,
            subCategoryId: sub.id,
            categoryId: cat.id,
            projectId: cat.projectId || targetProjId,
            name: chDef.name,
            code: chCode,
            count: cnt,
            rate: rt,
            paymentTerms: chDef.paymentTerms || "PER DAY",
            shifts: sh,
            allocatedAmount: cnt * rt * sh,
            spentAmount: 0
          };
        });
      }

      const subAllocated = finalChildren.length > 0
        ? finalChildren.reduce((s, c) => s + c.allocatedAmount, 0)
        : (sub.allocatedAmount || 0);

      return {
        ...sub,
        code: subCode,
        allocatedAmount: subAllocated,
        childCategories: finalChildren
      };
    });

    const catAllocated = finalSubs.length > 0
      ? finalSubs.reduce((s, sub) => s + sub.allocatedAmount, 0)
      : (cat.allocatedAmount || 0);

    return {
      ...cat,
      code: catCode,
      allocatedAmount: catAllocated,
      subCategories: finalSubs
    };
  });
};

export const isCategoryStructureMismatched = (cats: BudgetCategory[], projectType?: string): boolean => {
  if (!cats || cats.length === 0) return true;
  const standard = getBudgetStructureForProjectType(projectType);
  if (!standard || standard.length === 0) return false;

  const standardNames = new Set(standard.map(s => s.name.trim().toLowerCase()));
  const matchedCount = cats.filter(c => standardNames.has(c.name.trim().toLowerCase())).length;
  const matchRatio = matchedCount / standard.length;

  const totalChildCats = cats.reduce((sum, cat) => 
    sum + (cat.subCategories || []).reduce((sSum, sub) => sSum + (sub.childCategories?.length || 0), 0)
  , 0);

  // If match ratio is low, it's definitely an old, mismatched, or wrong structure
  if (matchRatio < 0.65) return true;

  // If significant category count difference (e.g. standard Film has 24, old has 26; standard OTT has 42, old has 36)
  if (Math.abs(cats.length - standard.length) > Math.max(3, Math.floor(standard.length * 0.2))) return true;

  // If missing child categories (standard templates have comprehensive 3-tier structure)
  if (totalChildCats < standard.length * 1.5) return true;

  // Specific project template checks
  const pNorm = (projectType || '').toLowerCase();
  if (pNorm.includes('cook')) {
    const hasKitchen = cats.some(c => c.name.toLowerCase().includes('kitchen'));
    const hasFilmLegacy = cats.some(c => c.name.toLowerCase() === 'story and other rights' || c.name.toLowerCase() === 'lighting & filters');
    if (!hasKitchen || hasFilmLegacy) return true;
  } else if (pNorm.includes('ott') || pNorm.includes('series')) {
    const hasSeriesDev = cats.some(c => c.name.toLowerCase().includes('series creation') || c.name.toLowerCase().includes('platform delivery'));
    const hasOldLegacy = cats.some(c => c.name.toLowerCase() === 'lighting & filters' || c.name.toLowerCase() === 'production items');
    if (!hasSeriesDev || hasOldLegacy) return true;
  } else if (pNorm.includes('music reality') || pNorm.includes('singing reality') || pNorm.includes('non-fiction')) {
    const hasBroadcast = cats.some(c => c.name.toLowerCase().includes('broadcast') || c.name.toLowerCase().includes('contestants') || c.name.toLowerCase().includes('format'));
    if (!hasBroadcast) return true;
  } else if (pNorm.includes('film') || !projectType) {
    const hasProducerOfficials = cats.some(c => c.name.toLowerCase() === 'producer & officials');
    const hasStoryRights = cats.some(c => c.name.toLowerCase().includes('story, script & rights') || c.name.toLowerCase().includes('story rights'));
    const hasOldLegacy = cats.some(c => c.name.toLowerCase() === 'lighting & filters' || c.name.toLowerCase() === 'production items' || c.name === 'CAST' || c.name === 'COSTUME');
    if (!hasProducerOfficials || !hasStoryRights || hasOldLegacy) return true;
  }

  return false;
};

export const ensureStandardCategoriesForProject = (projectId: string, existingCats: BudgetCategory[] = [], projectType?: string): BudgetCategory[] => {
  const cleanProjId = projectId || "p_default";

  // Filter out dirty/old legacy test categories (never exclude 'producer & officials'!)
  const cleanExistingCats = (existingCats || []).filter(c => {
    const nameLower = c.name.trim().toLowerCase();
    if (nameLower.includes('automation') || 
        nameLower.includes('facility') || 
        nameLower.includes('engineering') || 
        nameLower.includes('cargo fleet') || 
        nameLower.includes('data center') ||
        c.id.startsWith('c_old_') ||
        c.name === 'Revenue & Recoveries' ||
        c.name === 'picture vehicle & animals' ||
        ((c.name === 'Production' || c.name === 'Talent' || c.name === 'Post-Prod') && (!c.subCategories || c.subCategories.length === 0))) {
      return false;
    }
    return true;
  });

  const isMismatched = isCategoryStructureMismatched(cleanExistingCats, projectType);

  if (isMismatched || cleanExistingCats.length === 0) {
    const generated = generateStandardCategoriesForProject(cleanProjId, projectType);

    // If there were existing allocations or spendings, preserve them on matched categories/subcategories
    if (cleanExistingCats.length > 0) {
      const existingByName = new Map(cleanExistingCats.map(c => [c.name.trim().toLowerCase(), c]));
      return generated.map(genCat => {
        const match = existingByName.get(genCat.name.trim().toLowerCase());
        if (match) {
          const existingSubByName = new Map((match.subCategories || []).map(s => [s.name.trim().toLowerCase(), s]));
          const mappedSubs = genCat.subCategories.map(genSub => {
            const subMatch = existingSubByName.get(genSub.name.trim().toLowerCase());
            if (subMatch && (subMatch.allocatedAmount || subMatch.spentAmount)) {
              return {
                ...genSub,
                allocatedAmount: subMatch.allocatedAmount || genSub.allocatedAmount,
                spentAmount: subMatch.spentAmount || genSub.spentAmount
              };
            }
            return genSub;
          });

          return {
            ...genCat,
            id: match.id || genCat.id,
            allocatedAmount: match.allocatedAmount || genCat.allocatedAmount,
            spentAmount: match.spentAmount || genCat.spentAmount,
            subCategories: mappedSubs
          };
        }
        return genCat;
      });
    }
    return generated;
  }

  return sortCategoriesByStandardStructure(cleanExistingCats, projectType);
};

export interface TimelinePhase {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  durationUnit?: 'Days' | 'Weeks' | 'Months';
  startMonth: number;
  duration: number;
  progress: number;
  status: 'Completed' | 'In Progress' | 'Scheduled' | 'Deferred';
  color: string;
  borderColor: string;
  textColor: string;
}

export function cleanYYYYMMDD(dateStr?: string, defaultFallback: string = '2026-08-01'): string {
  if (!dateStr || typeof dateStr !== 'string') return defaultFallback;
  const base = dateStr.trim().split('T')[0].split(' ')[0];
  const parts = base.split('-');
  if (parts.length !== 3) return defaultFallback;

  let [y, m, d] = parts;
  let yearNum = parseInt(y, 10);
  if (isNaN(yearNum)) return defaultFallback;

  if (yearNum > 0 && yearNum < 100) {
    yearNum = 2000 + yearNum;
    y = String(yearNum);
  }

  if (yearNum < 2000 || yearNum > 2099) return defaultFallback;

  let monthNum = parseInt(m, 10);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) m = '01';
  else m = monthNum.toString().padStart(2, '0');

  let dayNum = parseInt(d, 10);
  if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) d = '01';
  else d = dayNum.toString().padStart(2, '0');

  return `${y}-${m}-${d}`;
}

export function computeEndAndDays(startDateStr: string, durationVal: number, durationUnit: 'Days' | 'Weeks' | 'Months' = 'Days') {
  const cleanStart = cleanYYYYMMDD(startDateStr, '2026-08-01');
  const parts = cleanStart.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const start = new Date(y, m, d);
  
  const val = Math.max(1, durationVal || 1);
  const end = new Date(start);
  if (durationUnit === 'Days') {
    end.setDate(end.getDate() + val);
  } else if (durationUnit === 'Weeks') {
    end.setDate(end.getDate() + val * 7);
  } else if (durationUnit === 'Months') {
    end.setMonth(end.getMonth() + val);
  }

  const endY = end.getFullYear();
  const endM = String(end.getMonth() + 1).padStart(2, '0');
  const endD = String(end.getDate()).padStart(2, '0');
  const endDateStr = `${endY}-${endM}-${endD}`;
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  return { endDateStr, totalDays };
}

export function generateDefaultPhasesForProject(project?: Project): TimelinePhase[] {
  const projId = project?.id ? (project.id.startsWith('wp_') ? project.id.substring(3) : project.id) : 'def';
  const schedule = project?.schedule || {};
  
  const baseStart = schedule.preProductionStartDate || project?.startDate || new Date().toISOString().substring(0, 10);
  const preStart = cleanYYYYMMDD(baseStart, '2026-08-01');
  const preDays = Math.max(1, schedule.preProductionDays || 45);
  const preEnd = computeEndAndDays(preStart, preDays, 'Days').endDateStr;

  const shootStart = cleanYYYYMMDD(schedule.shootingStartDate || preEnd, '2026-09-15');
  const shootDays = Math.max(1, schedule.shootingDays || 60);
  const shootEnd = computeEndAndDays(shootStart, shootDays, 'Days').endDateStr;

  const postStart = cleanYYYYMMDD(schedule.postProductionStartDate || shootEnd, '2026-11-15');
  const postDays = Math.max(1, schedule.postProductionDays || 60);
  const postEnd = computeEndAndDays(postStart, postDays, 'Days').endDateStr;

  const relStart = cleanYYYYMMDD(schedule.targetReleaseDate || postEnd, '2027-01-15');
  const relEnd = computeEndAndDays(relStart, 30, 'Days').endDateStr;

  return [
    {
      id: `phase_${projId}_pre`,
      name: 'Pre-Production & Development',
      startDate: preStart,
      endDate: preEnd,
      durationDays: preDays,
      durationUnit: 'Days',
      startMonth: 0,
      duration: Math.ceil(preDays / 30),
      progress: 100,
      status: 'Completed',
      color: 'bg-emerald-950/80 text-emerald-300 border-emerald-900/60',
      borderColor: 'border-emerald-500',
      textColor: 'text-emerald-400'
    },
    {
      id: `phase_${projId}_shoot`,
      name: 'Principal Photography (Shooting)',
      startDate: shootStart,
      endDate: shootEnd,
      durationDays: shootDays,
      durationUnit: 'Days',
      startMonth: 1,
      duration: Math.ceil(shootDays / 30),
      progress: 35,
      status: 'In Progress',
      color: 'bg-blue-950/80 text-blue-300 border-blue-900/60',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-400'
    },
    {
      id: `phase_${projId}_post`,
      name: 'Post-Production, Edit & Sound',
      startDate: postStart,
      endDate: postEnd,
      durationDays: postDays,
      durationUnit: 'Days',
      startMonth: 3,
      duration: Math.ceil(postDays / 30),
      progress: 0,
      status: 'Scheduled',
      color: 'bg-purple-950/80 text-purple-300 border-purple-900/60',
      borderColor: 'border-purple-500',
      textColor: 'text-purple-400'
    },
    {
      id: `phase_${projId}_rel`,
      name: 'Marketing & Theatrical Release',
      startDate: relStart,
      endDate: relEnd,
      durationDays: 30,
      durationUnit: 'Days',
      startMonth: 5,
      duration: 1,
      progress: 0,
      status: 'Scheduled',
      color: 'bg-amber-950/80 text-amber-300 border-amber-900/60',
      borderColor: 'border-amber-500',
      textColor: 'text-amber-400'
    }
  ];
}
