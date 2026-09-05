export interface BudgetTemplateChild {
  name: string;
  count: number;
  rate: number;
  paymentTerms: string;
  shifts: number;
}

export interface BudgetTemplateSub {
  name: string;
  childCategories: BudgetTemplateChild[];
}

export interface BudgetTemplateCat {
  name: string;
  subCategories: BudgetTemplateSub[];
}

const c = (name: string, paymentTerms = "PACKAGE", count = 1, rate = 0, shifts = 1): BudgetTemplateChild => ({
  name,
  count,
  rate,
  paymentTerms,
  shifts
});

export const DEFAULT_COOKING_SHOW_BUDGET_STRUCTURE: BudgetTemplateCat[] = [
  // 1. Development & Creative
  {
    name: "Development & Creative",
    subCategories: [
      {
        name: "Concept & Format",
        childCategories: [
          c("Show Format", "PACKAGE"),
          c("Season Concept", "PACKAGE"),
          c("Episode Concept", "PER EPISODE"),
          c("Challenge Concept", "PER EPISODE")
        ]
      },
      {
        name: "Writing & Content",
        childCategories: [
          c("Episode Story", "PER EPISODE"),
          c("Script", "PER EPISODE"),
          c("Rundown", "PER EPISODE"),
          c("Recipe Content", "PER EPISODE"),
          c("Research", "MONTHLY")
        ]
      }
    ]
  },

  // 2. Crew Wages & Remuneration (including Talent Remuneration)
  {
    name: "Crew Wages & Remuneration",
    subCategories: [
      {
        name: "Production Team",
        childCategories: [
          c("Executive Producer", "MONTHLY"),
          c("Producer", "MONTHLY"),
          c("Associate Producer", "MONTHLY"),
          c("Production Head", "MONTHLY"),
          c("Production Manager", "MONTHLY"),
          c("Production Controller", "MONTHLY"),
          c("Production Coordinator", "MONTHLY"),
          c("Production Assistants", "DAILY")
        ]
      },
      {
        name: "Direction Team",
        childCategories: [
          c("Director", "PER EPISODE"),
          c("Chief AD", "PER EPISODE"),
          c("1st AD", "PER EPISODE"),
          c("2nd AD", "PER EPISODE"),
          c("Floor Manager", "DAILY"),
          c("Assistant Directors", "DAILY")
        ]
      },
      {
        name: "Creative Team",
        childCategories: [
          c("Creative Director", "MONTHLY"),
          c("Creative Producer", "MONTHLY"),
          c("Content Producer", "MONTHLY"),
          c("Researchers", "MONTHLY"),
          c("Script Team", "PER EPISODE")
        ]
      },
      {
        name: "Camera Team",
        childCategories: [
          c("DOP", "DAILY"),
          c("Camera Operator", "DAILY"),
          c("Focus Puller", "DAILY"),
          c("Camera Assistant", "DAILY"),
          c("DIT", "DAILY"),
          c("Data Wrangler", "DAILY")
        ]
      },
      {
        name: "Lighting Team",
        childCategories: [
          c("Lighting Director", "DAILY"),
          c("Gaffer", "DAILY"),
          c("Best Boy", "DAILY"),
          c("Lightman", "DAILY"),
          c("Console Operator", "DAILY")
        ]
      },
      {
        name: "Sound Team",
        childCategories: [
          c("Sound Recordist", "DAILY"),
          c("Sound Engineer", "DAILY"),
          c("Boom Operator", "DAILY"),
          c("RF Technician", "DAILY")
        ]
      },
      {
        name: "Art Team",
        childCategories: [
          c("Production Designer", "PACKAGE"),
          c("Art Director", "PACKAGE"),
          c("Art Assistant", "DAILY"),
          c("Prop Master", "DAILY"),
          c("Art Coordinator", "DAILY"),
          c("Carpenters", "DAILY"),
          c("Painters", "DAILY"),
          c("Set Workers", "DAILY")
        ]
      },
      {
        name: "Culinary Team",
        childCategories: [
          c("Culinary Director", "MONTHLY"),
          c("Executive Chef", "MONTHLY"),
          c("Food Consultant", "PER EPISODE"),
          c("Sous Chef", "DAILY"),
          c("Commis Chef", "DAILY"),
          c("Recipe Developer", "PER EPISODE"),
          c("Food Stylist", "DAILY"),
          c("Kitchen Assistants", "DAILY")
        ]
      },
      {
        name: "Look Management",
        childCategories: [
          c("Costume Designer", "PACKAGE"),
          c("Costume Assistant", "DAILY"),
          c("Makeup Artist", "DAILY"),
          c("Hair Stylist", "DAILY"),
          c("Groomer", "DAILY"),
          c("Dressman", "DAILY")
        ]
      },
      {
        name: "PCR / Technical Team",
        childCategories: [
          c("Technical Director", "DAILY"),
          c("Vision Mixer", "DAILY"),
          c("CCU Operator", "DAILY"),
          c("Graphics Operator", "DAILY"),
          c("Playback Operator", "DAILY"),
          c("Broadcast Engineer", "DAILY")
        ]
      },
      {
        name: "Post Production Team",
        childCategories: [
          c("Editor", "PER EPISODE"),
          c("Assistant Editor", "MONTHLY"),
          c("Colourist", "PER EPISODE"),
          c("Sound Designer", "PER EPISODE"),
          c("Re-recording Mixer", "PER EPISODE"),
          c("VFX Artist", "PACKAGE"),
          c("Graphics Designer", "MONTHLY")
        ]
      },
      {
        name: "Support Staff",
        childCategories: [
          c("Spot Boys", "DAILY"),
          c("Runners", "DAILY"),
          c("Drivers", "DAILY"),
          c("Loaders", "DAILY"),
          c("Helpers", "DAILY"),
          c("Security", "DAILY"),
          c("Housekeeping", "DAILY")
        ]
      },
      {
        name: "Talent Remuneration",
        childCategories: [
          c("Host", "PER EPISODE"),
          c("Judge", "PER EPISODE"),
          c("Guest Chef", "PER EPISODE"),
          c("Contestant", "PER EPISODE"),
          c("Celebrity Guest", "PER EPISODE"),
          c("Special Guest", "PER EPISODE")
        ]
      }
    ]
  },

  // 3. Pre-Production
  {
    name: "Pre-Production",
    subCategories: [
      {
        name: "Production Office",
        childCategories: [
          c("Office Rent", "MONTHLY"),
          c("Stationery", "PACKAGE"),
          c("Printing", "PACKAGE"),
          c("Communication", "MONTHLY"),
          c("Software", "MONTHLY"),
          c("Internet", "MONTHLY")
        ]
      },
      {
        name: "Recce & Tests",
        childCategories: [
          c("Location Recce", "PACKAGE"),
          c("Camera Test", "PACKAGE"),
          c("Lighting Test", "PACKAGE"),
          c("Sound Test", "PACKAGE"),
          c("Kitchen Test", "PACKAGE"),
          c("Technical Rehearsal", "PACKAGE")
        ]
      },
      {
        name: "Casting & Audition",
        childCategories: [
          c("Audition", "PACKAGE"),
          c("Contestant Selection", "PACKAGE"),
          c("Background Verification", "PER ITEM"),
          c("Medical Test", "PER ITEM")
        ]
      }
    ]
  },

  // 4. Studio & Location
  {
    name: "Studio & Location",
    subCategories: [
      {
        name: "Studio",
        childCategories: [
          c("Studio Rent", "DAILY"),
          c("Setup Day", "DAILY"),
          c("Shooting Day", "DAILY"),
          c("Hold Day", "DAILY"),
          c("Dismantling", "DAILY")
        ]
      },
      {
        name: "Location",
        childCategories: [
          c("Location Rent", "DAILY"),
          c("Permission", "PACKAGE"),
          c("Security Deposit", "PACKAGE"),
          c("Location Services", "DAILY")
        ]
      }
    ]
  },

  // 5. Art & Set
  {
    name: "Art & Set",
    subCategories: [
      {
        name: "Set Construction",
        childCategories: [
          c("Main Kitchen Set", "PACKAGE"),
          c("Judge Area", "PACKAGE"),
          c("Contestant Stations", "PACKAGE"),
          c("Host Area", "PACKAGE"),
          c("Audience Area", "PACKAGE")
        ]
      },
      {
        name: "Props & Set Dressing",
        childCategories: [
          c("Cooking Props", "PACKAGE"),
          c("Decorative Props", "PACKAGE"),
          c("Challenge Props", "PACKAGE"),
          c("Branding", "PACKAGE")
        ]
      },
      {
        name: "Materials",
        childCategories: [
          c("Plywood", "PACKAGE"),
          c("Paint", "PACKAGE"),
          c("Hardware", "PACKAGE"),
          c("Printing", "PACKAGE"),
          c("Fabric", "PACKAGE")
        ]
      }
    ]
  },

  // 6. Kitchen & Culinary
  {
    name: "Kitchen & Culinary",
    subCategories: [
      {
        name: "Kitchen Equipment",
        childCategories: [
          c("Gas", "DAILY"),
          c("Induction", "DAILY"),
          c("Oven", "DAILY"),
          c("Microwave", "DAILY"),
          c("Refrigerator", "DAILY"),
          c("Freezer", "DAILY"),
          c("Mixer", "DAILY"),
          c("Grinder", "DAILY"),
          c("Appliances", "DAILY")
        ]
      },
      {
        name: "Utensils",
        childCategories: [
          c("Pots", "PACKAGE"),
          c("Pans", "PACKAGE"),
          c("Knives", "PACKAGE"),
          c("Bowls", "PACKAGE"),
          c("Plates", "PACKAGE"),
          c("Cutlery", "PACKAGE"),
          c("Measuring Tools", "PACKAGE")
        ]
      },
      {
        name: "Ingredients",
        childCategories: [
          c("Vegetables", "DAILY"),
          c("Fruits", "DAILY"),
          c("Meat", "DAILY"),
          c("Fish", "DAILY"),
          c("Dairy", "DAILY"),
          c("Grocery", "DAILY"),
          c("Spices", "DAILY"),
          c("Specialty Ingredients", "PER EPISODE")
        ]
      },
      {
        name: "Consumables",
        childCategories: [
          c("Foil", "DAILY"),
          c("Cling Film", "DAILY"),
          c("Gloves", "DAILY"),
          c("Tissue", "DAILY"),
          c("Disposable Items", "DAILY")
        ]
      }
    ]
  },

  // 7. Camera, Lighting, Sound & Technical Equipment
  {
    name: "Camera, Lighting, Sound & Technical Equipment",
    subCategories: [
      {
        name: "Camera",
        childCategories: [
          c("Camera Rental", "DAILY"),
          c("Lens", "DAILY"),
          c("Tripod", "DAILY"),
          c("Jib", "DAILY"),
          c("Gimbal", "DAILY"),
          c("Specialty Camera", "DAILY"),
          c("Media", "DAILY")
        ]
      },
      {
        name: "Lighting",
        childCategories: [
          c("Light Rental", "DAILY"),
          c("LED", "DAILY"),
          c("Rigging", "DAILY"),
          c("Truss", "DAILY"),
          c("Lighting Accessories", "DAILY")
        ]
      },
      {
        name: "Sound",
        childCategories: [
          c("Microphone", "DAILY"),
          c("Mixer", "DAILY"),
          c("Recorder", "DAILY"),
          c("Wireless System", "DAILY"),
          c("Intercom", "DAILY")
        ]
      },
      {
        name: "PCR / Broadcast",
        childCategories: [
          c("Vision Mixer", "DAILY"),
          c("CCU", "DAILY"),
          c("Recording", "DAILY"),
          c("Monitors", "DAILY"),
          c("Playback", "DAILY"),
          c("Graphics System", "DAILY")
        ]
      }
    ]
  },

  // 8. Costume, Makeup & Hair
  {
    name: "Costume, Makeup & Hair",
    subCategories: [
      {
        name: "Costume",
        childCategories: [
          c("Host", "PER EPISODE"),
          c("Judges", "PER EPISODE"),
          c("Contestants", "PER EPISODE"),
          c("Special Episode", "PER EPISODE"),
          c("Accessories", "PACKAGE")
        ]
      },
      {
        name: "Makeup & Hair",
        childCategories: [
          c("Makeup Materials", "DAILY"),
          c("Hair Materials", "DAILY"),
          c("Grooming", "DAILY"),
          c("Vanity", "DAILY")
        ]
      }
    ]
  },

  // 9. Production Logistics
  {
    name: "Production Logistics",
    subCategories: [
      {
        name: "Transport",
        childCategories: [
          c("Talent Cars", "DAILY"),
          c("Crew Cars", "DAILY"),
          c("Bus", "DAILY"),
          c("Equipment Vehicles", "DAILY"),
          c("Kitchen Vehicles", "DAILY"),
          c("Art Truck", "DAILY")
        ]
      },
      {
        name: "Genset & Power",
        childCategories: [
          c("Genset Rental", "DAILY"),
          c("Diesel", "DAILY"),
          c("Electrical Distribution", "DAILY"),
          c("Cables", "DAILY"),
          c("Backup Power", "DAILY")
        ]
      },
      {
        name: "Vanity",
        childCategories: [
          c("Host Vanity", "DAILY"),
          c("Judge Vanity", "DAILY"),
          c("Makeup Vanity", "DAILY"),
          c("Common Vanity", "DAILY")
        ]
      }
    ]
  },

  // 10. Food & Catering
  {
    name: "Food & Catering",
    subCategories: [
      {
        name: "Production Food",
        childCategories: [
          c("Breakfast", "DAILY"),
          c("Lunch", "DAILY"),
          c("Snacks", "DAILY"),
          c("Dinner", "DAILY"),
          c("Junior Food", "DAILY"),
          c("Extra Food", "DAILY")
        ]
      },
      {
        name: "Beverages",
        childCategories: [
          c("Water", "DAILY"),
          c("Tea", "DAILY"),
          c("Coffee", "DAILY"),
          c("Juice", "DAILY")
        ]
      },
      {
        name: "Special",
        childCategories: [
          c("Host Meal", "DAILY"),
          c("Judge Meal", "DAILY"),
          c("Guest Meal", "DAILY"),
          c("Diet Meal", "DAILY")
        ]
      }
    ]
  },

  // 11. Accommodation & Travel
  {
    name: "Accommodation & Travel",
    subCategories: [
      {
        name: "Accommodation",
        childCategories: [
          c("Host", "DAILY"),
          c("Judges", "DAILY"),
          c("Contestants", "DAILY"),
          c("Guest Chef", "DAILY"),
          c("Crew", "DAILY")
        ]
      },
      {
        name: "Travel",
        childCategories: [
          c("Flight", "PER ITEM"),
          c("Train", "PER ITEM"),
          c("Local Transport", "DAILY"),
          c("Airport Transfer", "PER ITEM"),
          c("Baggage", "PER ITEM")
        ]
      }
    ]
  },

  // 12. Production DSR / Daily Operations
  {
    name: "Production DSR / Daily Operations",
    subCategories: [
      {
        name: "Shooting Day",
        childCategories: [
          c("Date", "DAILY"),
          c("Location", "DAILY"),
          c("Unit", "DAILY"),
          c("Call Time", "DAILY"),
          c("Pack-up Time", "DAILY"),
          c("Footage", "DAILY")
        ]
      },
      {
        name: "Crew",
        childCategories: [
          c("Designation", "DAILY"),
          c("Head Count", "DAILY"),
          c("In Time", "DAILY"),
          c("Out Time", "DAILY")
        ]
      },
      {
        name: "Equipment",
        childCategories: [
          c("Equipment", "DAILY"),
          c("Quantity", "DAILY")
        ]
      },
      {
        name: "Transport",
        childCategories: [
          c("Vehicle Type", "DAILY"),
          c("Quantity", "DAILY"),
          c("Reporting Time", "DAILY"),
          c("Release Time", "DAILY")
        ]
      },
      {
        name: "Genset / Vanity",
        childCategories: [
          c("Quantity", "DAILY"),
          c("Start Time", "DAILY"),
          c("End Time", "DAILY"),
          c("Fuel Consumption", "DAILY")
        ]
      },
      {
        name: "Food",
        childCategories: [
          c("Breakfast", "DAILY"),
          c("Lunch", "DAILY"),
          c("Snacks", "DAILY"),
          c("Dinner", "DAILY"),
          c("Junior Food", "DAILY"),
          c("Extra Food", "DAILY")
        ]
      }
    ]
  },

  // 13. Audience & Contestants
  {
    name: "Audience & Contestants",
    subCategories: [
      {
        name: "Audience",
        childCategories: [
          c("Recruitment", "DAILY"),
          c("Transport", "DAILY"),
          c("Food", "DAILY"),
          c("Seating", "DAILY"),
          c("Security", "DAILY")
        ]
      },
      {
        name: "Contestants",
        childCategories: [
          c("Travel", "PER ITEM"),
          c("Accommodation", "DAILY"),
          c("Welfare", "DAILY"),
          c("Costume", "PACKAGE"),
          c("Food", "DAILY")
        ]
      }
    ]
  },

  // 14. Prizes & Challenges
  {
    name: "Prizes & Challenges",
    subCategories: [
      {
        name: "Challenges",
        childCategories: [
          c("Mystery Box", "PER EPISODE"),
          c("Pressure Test", "PER EPISODE"),
          c("Team Challenge", "PER EPISODE"),
          c("Elimination", "PER EPISODE"),
          c("Outdoor Challenge", "PER EPISODE")
        ]
      },
      {
        name: "Prizes",
        childCategories: [
          c("Episode Prize", "PER EPISODE"),
          c("Weekly Prize", "PER EPISODE"),
          c("Finale Prize", "PACKAGE"),
          c("Trophy", "PACKAGE"),
          c("Gift", "PACKAGE")
        ]
      }
    ]
  },

  // 15. Sponsor & Brand Integration
  {
    name: "Sponsor & Brand Integration",
    subCategories: [
      {
        name: "Sponsor",
        childCategories: [
          c("Product Integration", "PACKAGE"),
          c("Branding", "PACKAGE"),
          c("Branded Challenge", "PER EPISODE"),
          c("Sponsor Props", "PACKAGE"),
          c("Sponsor AV", "PACKAGE"),
          c("Sponsor Recovery", "PACKAGE")
        ]
      },
      {
        name: "Product Supply",
        childCategories: [
          c("Ingredient Supply", "PACKAGE"),
          c("Equipment Supply", "PACKAGE"),
          c("Prize Sponsorship", "PACKAGE")
        ]
      }
    ]
  },

  // 16. Post Production
  {
    name: "Post Production",
    subCategories: [
      {
        name: "Episode",
        childCategories: [
          c("Offline Edit", "PER EPISODE"),
          c("Online Edit", "PER EPISODE"),
          c("Colour", "PER EPISODE"),
          c("Sound Mix", "PER EPISODE"),
          c("VFX", "PER EPISODE"),
          c("Graphics", "PER EPISODE")
        ]
      },
      {
        name: "Delivery",
        childCategories: [
          c("Master", "PER EPISODE"),
          c("Subtitle", "PER EPISODE"),
          c("Metadata", "PER EPISODE"),
          c("QC", "PER EPISODE"),
          c("Channel Delivery", "PER EPISODE")
        ]
      }
    ]
  },

  // 17. Marketing & Promotion
  {
    name: "Marketing & Promotion",
    subCategories: [
      {
        name: "Promotion",
        childCategories: [
          c("Promo", "PACKAGE"),
          c("Trailer", "PACKAGE"),
          c("Poster", "PACKAGE"),
          c("Photoshoot", "PACKAGE")
        ]
      },
      {
        name: "Social Media",
        childCategories: [
          c("Reels", "PACKAGE"),
          c("BTS", "PACKAGE")
        ]
      }
    ]
  },

  // 18. Legal, Insurance & Compliance
  {
    name: "Legal, Insurance & Compliance",
    subCategories: [
      {
        name: "Legal",
        childCategories: [
          c("Agreements", "PACKAGE"),
          c("Copyright", "PACKAGE"),
          c("Music Rights", "PACKAGE"),
          c("Brand Clearance", "PACKAGE")
        ]
      },
      {
        name: "Insurance",
        childCategories: [
          c("Production", "PACKAGE"),
          c("Equipment", "PACKAGE"),
          c("Talent", "PACKAGE"),
          c("Public Liability", "PACKAGE")
        ]
      },
      {
        name: "Compliance",
        childCategories: [
          c("Food Safety", "PACKAGE"),
          c("Fire Safety", "PACKAGE"),
          c("Medical", "PACKAGE"),
          c("Licences", "PACKAGE")
        ]
      }
    ]
  },

  // 19. Administration & Miscellaneous
  {
    name: "Administration & Miscellaneous",
    subCategories: [
      {
        name: "Administration",
        childCategories: [
          c("Office Expenses", "MONTHLY"),
          c("Communication", "MONTHLY"),
          c("Printing", "MONTHLY"),
          c("Courier", "MONTHLY"),
          c("Software", "MONTHLY")
        ]
      },
      {
        name: "Miscellaneous",
        childCategories: [
          c("Emergency Purchase", "PACKAGE"),
          c("Repair", "PACKAGE"),
          c("Additional Shoot", "PACKAGE"),
          c("Other Expenses", "PACKAGE")
        ]
      }
    ]
  },

  // 20. Contingency
  {
    name: "Contingency",
    subCategories: [
      {
        name: "Contingency",
        childCategories: [
          c("Production Contingency", "PACKAGE"),
          c("Technical Contingency", "PACKAGE"),
          c("Kitchen Contingency", "PACKAGE"),
          c("Talent Contingency", "PACKAGE"),
          c("Post Production Contingency", "PACKAGE")
        ]
      }
    ]
  }
];
