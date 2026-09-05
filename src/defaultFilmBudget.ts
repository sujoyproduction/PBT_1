export const DEFAULT_FILM_BUDGET_STRUCTURE = [
  {
    name: "Producer & Officials",
    subCategories: [
      {
        name: "Producer Fees",
        childCategories: [
          { name: "Producer", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Co-Producer", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Executive Producer", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Associate Producer", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Creative Producer", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Line Producer", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Production Management",
        childCategories: [
          { name: "Production Controller", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Production Manager", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Assistant Production Manager", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Production Coordinator", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Production Assistants", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Commercial & Accounts",
        childCategories: [
          { name: "Commercial Head", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Commercial Manager", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Production Accountant", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Accountant", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Cashier", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Auditor", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Story, Script & Rights",
    subCategories: [
      {
        name: "Story Rights",
        childCategories: [
          { name: "Original Story", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Book Rights", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Remake Rights", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Adaptation Rights", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Writing",
        childCategories: [
          { name: "Screenplay", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Dialogue", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Script Doctor", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Additional Writer", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Registration & Legal",
        childCategories: [
          { name: "Script Registration", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Copyright", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Legal Documentation", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Development",
    subCategories: [
      {
        name: "Research",
        childCategories: [
          { name: "Research Team", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Reference Materials", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Travel for Research", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Development",
        childCategories: [
          { name: "Concept Development", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Pitch Materials", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Look Book", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Presentation", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Pre-Production",
    subCategories: [
      {
        name: "Recce",
        childCategories: [
          { name: "Location Recce", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Technical Recce", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Art Recce", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      },
      {
        name: "Tests",
        childCategories: [
          { name: "Camera Test", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Costume Test", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Makeup Test", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Look Test", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Rehearsal",
        childCategories: [
          { name: "Artist Rehearsal", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Action Rehearsal", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Dance Rehearsal", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Workshop", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Office",
        childCategories: [
          { name: "Production Office", count: 1, rate: 0, paymentTerms: "PER MONTH", shifts: 1 },
          { name: "Stationery", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Internet", count: 1, rate: 0, paymentTerms: "PER MONTH", shifts: 1 },
          { name: "Printing", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Cast",
    subCategories: [
      {
        name: "Lead Cast",
        childCategories: [
          { name: "Male Lead", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Female Lead", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Supporting Cast",
        childCategories: [
          { name: "Supporting Actor", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Character Actor", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Guest Artist", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Junior Artists",
        childCategories: [
          { name: "Crowd", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Featured Junior Artist", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 }
        ]
      },
      {
        name: "Artist Additional",
        childCategories: [
          { name: "Rehearsal Fee", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Dubbing Fee", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Travel", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Accommodation", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Food", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Vanity", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Direction",
    subCategories: [
      {
        name: "Director",
        childCategories: [
          { name: "Director Fee", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Direction Team",
        childCategories: [
          { name: "Associate Director", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Chief AD", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Assistant Director", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Script Supervisor", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Continuity", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Camera",
    subCategories: [
      {
        name: "Camera Crew",
        childCategories: [
          { name: "DOP", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Camera Operator", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Focus Puller", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Camera Assistant", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "DIT", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 }
        ]
      },
      {
        name: "Camera Equipment",
        childCategories: [
          { name: "Camera Body", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Lens", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Filters", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Accessories", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Monitor", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Wireless Video", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 }
        ]
      },
      {
        name: "Camera Movement",
        childCategories: [
          { name: "Gimbal", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Steadicam", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Jimmy Jib", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Crane", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Drone", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Track & Trolley", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Lighting & Grip",
    subCategories: [
      {
        name: "Lighting Crew",
        childCategories: [
          { name: "Gaffer", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Best Boy", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Lightmen", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 }
        ]
      },
      {
        name: "Lighting Equipment",
        childCategories: [
          { name: "HMI", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "LED", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Tungsten", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Moving Light", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Dimmer", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 }
        ]
      },
      {
        name: "Grip",
        childCategories: [
          { name: "Grip Crew", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Rigging", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Stands", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Frames", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Track", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Sound",
    subCategories: [
      {
        name: "Sound Crew",
        childCategories: [
          { name: "Sound Recordist", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Boom Operator", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Sound Assistant", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 }
        ]
      },
      {
        name: "Sound Equipment",
        childCategories: [
          { name: "Recorder", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Wireless Mics", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Boom", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Playback", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "IFB", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Art Department",
    subCategories: [
      {
        name: "Art Team",
        childCategories: [
          { name: "Production Designer", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Art Director", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Assistant Art Director", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Draftsman", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Prop Master", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 }
        ]
      },
      {
        name: "Set Construction",
        childCategories: [
          { name: "Carpentry", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Painting", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Fabrication", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Sculpture", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Electrical", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Labour", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 }
        ]
      },
      {
        name: "Set Dressing",
        childCategories: [
          { name: "Furniture", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Decorative Items", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Curtains", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Artwork", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Plants", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Props",
        childCategories: [
          { name: "Hero Props", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Background Props", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Consumable Props", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Breakaway Props", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Costume",
    subCategories: [
      {
        name: "Costume Team",
        childCategories: [
          { name: "Costume Designer", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Stylist", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Costume Assistants", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Dressmen", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 }
        ]
      },
      {
        name: "Costume Material",
        childCategories: [
          { name: "Fabric", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Tailoring", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Ready-Made Purchase", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Rental", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Accessories",
        childCategories: [
          { name: "Jewellery", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Footwear", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Bags", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Belts", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Watches", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Maintenance",
        childCategories: [
          { name: "Laundry", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Dry Cleaning", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Repair", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Makeup & Hair",
    subCategories: [
      {
        name: "Makeup",
        childCategories: [
          { name: "Makeup Designer", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Makeup Artist", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Assistants", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 }
        ]
      },
      {
        name: "Hair",
        childCategories: [
          { name: "Hair Designer", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Hair Stylist", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Assistants", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 }
        ]
      },
      {
        name: "Special Makeup",
        childCategories: [
          { name: "Prosthetics", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Wigs", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Extensions", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "SFX Makeup", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Consumables",
        childCategories: [
          { name: "Makeup Materials", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Hair Products", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Hygiene Materials", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Locations & Studio",
    subCategories: [
      {
        name: "Location",
        childCategories: [
          { name: "Location Rent", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Deposit", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 },
          { name: "Electricity", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Cleaning", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Restoration", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 }
        ]
      },
      {
        name: "Permissions",
        childCategories: [
          { name: "Police", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 },
          { name: "Traffic", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 },
          { name: "Municipality", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 },
          { name: "Government Permission", count: 1, rate: 0, paymentTerms: "FLAT", shifts: 1 }
        ]
      },
      {
        name: "Studio",
        childCategories: [
          { name: "Floor Rent", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Setup Day", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Shoot Day", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Dismantling Day", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Transport",
    subCategories: [
      {
        name: "Artist Transport",
        childCategories: [
          { name: "Artist Car", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Guest Car", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      },
      {
        name: "Crew Transport",
        childCategories: [
          { name: "Crew Car", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Traveller", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Bus", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      },
      {
        name: "Equipment Transport",
        childCategories: [
          { name: "Camera Truck", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Light Truck", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Art Truck", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Costume Vehicle", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      },
      {
        name: "Additional",
        childCategories: [
          { name: "Toll", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Parking", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Driver Allowance", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Night Charge", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Genset, Vanity & Fuel",
    subCategories: [
      {
        name: "Genset",
        childCategories: [
          { name: "Main Genset", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Backup Genset", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Operator", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 }
        ]
      },
      {
        name: "Vanity",
        childCategories: [
          { name: "Artist Vanity", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Director Vanity", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Makeup Vanity", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Costume Vanity", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      },
      {
        name: "Fuel",
        childCategories: [
          { name: "Diesel", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Petrol", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Fuel Delivery", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Food & Catering",
    subCategories: [
      {
        name: "Meals",
        childCategories: [
          { name: "Breakfast", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Lunch", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Snacks", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Dinner", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Midnight Meal", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      },
      {
        name: "Talent Food",
        childCategories: [
          { name: "Artist Special Meal", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Diet Meal", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      },
      {
        name: "Others",
        childCategories: [
          { name: "Water", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Tea & Coffee", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Dry Snacks", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Accommodation & Travel",
    subCategories: [
      {
        name: "Accommodation",
        childCategories: [
          { name: "Artist Room", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "HOD Room", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Crew Room", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Dormitory", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      },
      {
        name: "Travel",
        childCategories: [
          { name: "Air", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Train", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Road", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Local Transfer", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Excess Baggage", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Action & Stunts",
    subCategories: [
      {
        name: "Action Team",
        childCategories: [
          { name: "Action Director", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Fighters", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Stunt Coordinator", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 }
        ]
      },
      {
        name: "Action Equipment",
        childCategories: [
          { name: "Harness", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Wire Rig", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Safety Mat", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Crash Equipment", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      },
      {
        name: "Special",
        childCategories: [
          { name: "Vehicles", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Weapons", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Breakaway Props", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Medical Support", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Songs & Choreography",
    subCategories: [
      {
        name: "Choreography",
        childCategories: [
          { name: "Choreographer", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Assistants", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 }
        ]
      },
      {
        name: "Dancers",
        childCategories: [
          { name: "Main Dancers", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 },
          { name: "Background Dancers", count: 1, rate: 0, paymentTerms: "PER SHIFT", shifts: 1 }
        ]
      },
      {
        name: "Rehearsal",
        childCategories: [
          { name: "Studio", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 },
          { name: "Rehearsal Fee", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Music Playback", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Post-Production",
    subCategories: [
      {
        name: "Editing",
        childCategories: [
          { name: "Editor", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Assistant Editor", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Edit Studio", count: 1, rate: 0, paymentTerms: "PER DAY", shifts: 1 }
        ]
      },
      {
        name: "Sound Post",
        childCategories: [
          { name: "Sound Design", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Foley", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "ADR", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Final Mix", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "VFX",
        childCategories: [
          { name: "Rotoscopy", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Compositing", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Cleanup", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "CGI", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "DI",
        childCategories: [
          { name: "Colour Correction", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Colour Grading", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Online", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Mastering",
        childCategories: [
          { name: "DCP", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "OTT Master", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Archive Master", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Music",
    subCategories: [
      {
        name: "Original Score",
        childCategories: [
          { name: "Composer", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Programmer", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Musicians", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Songs",
        childCategories: [
          { name: "Singer", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Lyricist", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Recording", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Mixing", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Mastering", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Marketing & Release",
    subCategories: [
      {
        name: "Publicity",
        childCategories: [
          { name: "Poster", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Trailer", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Teaser", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Photoshoot", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Digital",
        childCategories: [
          { name: "Social Media", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Digital Ads", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Release",
        childCategories: [
          { name: "DCP", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Distribution Materials", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Premiere", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Legal, Insurance & Administration",
    subCategories: [
      {
        name: "Legal",
        childCategories: [
          { name: "Agreements", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Copyright", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Legal Consultant", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Insurance",
        childCategories: [
          { name: "Production Insurance", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Equipment Insurance", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Public Liability", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      },
      {
        name: "Admin",
        childCategories: [
          { name: "Office", count: 1, rate: 0, paymentTerms: "PER MONTH", shifts: 1 },
          { name: "Courier", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Software", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Communication", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  },
  {
    name: "Contingency",
    subCategories: [
      {
        name: "Production Contingency",
        childCategories: [
          { name: "General", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Weather", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Technical", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 },
          { name: "Medical", count: 1, rate: 0, paymentTerms: "PACKAGE", shifts: 1 }
        ]
      }
    ]
  }
];
