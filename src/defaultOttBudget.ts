export interface DefaultChildCategory {
  name: string;
  count: number;
  rate: number;
  paymentTerms: string;
  shifts: number;
}

export interface DefaultSubCategory {
  name: string;
  childCategories: DefaultChildCategory[];
}

export interface DefaultCategory {
  name: string;
  subCategories: DefaultSubCategory[];
}

const item = (name: string, paymentTerms = "PACKAGE"): DefaultChildCategory => ({
  name,
  count: 1,
  rate: 0,
  paymentTerms,
  shifts: 1
});

export const DEFAULT_OTT_BUDGET_STRUCTURE: DefaultCategory[] = [
  // 1. Development & Series Creation
  {
    name: "Development & Series Creation",
    subCategories: [
      {
        name: "Series Development",
        childCategories: [
          item("Series Bible"),
          item("Series Concept"),
          item("Series Synopsis"),
          item("Series Logline"),
          item("Series World Development"),
          item("Tone & Style Development"),
          item("Visual Treatment"),
          item("Pitch Deck"),
          item("Look Book"),
          item("Series Presentation"),
          item("Platform Pitch Materials")
        ]
      },
      {
        name: "Season Development",
        childCategories: [
          item("Season Concept"),
          item("Season Arc"),
          item("Season Synopsis"),
          item("Season Structure"),
          item("Season Timeline"),
          item("Episode Mapping"),
          item("Story Arc Planning"),
          item("Character Journey Planning"),
          item("Cliffhanger Planning"),
          item("Finale Planning")
        ]
      },
      {
        name: "Character Development",
        childCategories: [
          item("Character Bible"),
          item("Lead Character Development"),
          item("Supporting Character Development"),
          item("Character Backstory"),
          item("Character Relationship Map"),
          item("Character Arc"),
          item("Character Research"),
          item("Character Reference")
        ]
      },
      {
        name: "Research",
        childCategories: [
          item("Story Research"),
          item("Subject Research"),
          item("Historical Research"),
          item("Location Research"),
          item("Technical Research"),
          item("Legal Research"),
          item("Cultural Research"),
          item("Archive Research"),
          item("Reference Material"),
          item("Research Travel")
        ]
      },
      {
        name: "Development Team",
        childCategories: [
          item("Development Producer"),
          item("Creative Producer"),
          item("Development Executive"),
          item("Research Head"),
          item("Researchers"),
          item("Creative Consultant"),
          item("Series Consultant")
        ]
      }
    ]
  },

  // 2. Story, Screenplay & Writing
  {
    name: "Story, Screenplay & Writing",
    subCategories: [
      {
        name: "Series Writing",
        childCategories: [
          item("Series Story"),
          item("Story Bible"),
          item("Series Screenplay Structure"),
          item("Writers Room"),
          item("Head Writer"),
          item("Showrunner Writing Fee"),
          item("Story Consultant")
        ]
      },
      {
        name: "Season Writing",
        childCategories: [
          item("Season Story"),
          item("Season Arc Writing"),
          item("Season Screenplay Plan"),
          item("Season Story Consultant")
        ]
      },
      {
        name: "Episode Story",
        childCategories: [
          item("Episode 01 Story", "EPISODE"),
          item("Episode 02 Story", "EPISODE"),
          item("Episode 03 Story", "EPISODE"),
          item("Episode-wise Story", "EPISODE"),
          item("Additional Episode Story", "EPISODE"),
          item("Episode Rewrite", "EPISODE")
        ]
      },
      {
        name: "Episode Screenplay",
        childCategories: [
          item("Episode Screenplay", "EPISODE"),
          item("Screenplay Revision"),
          item("Additional Screenplay"),
          item("Scene Rewrite"),
          item("Patch Writing")
        ]
      },
      {
        name: "Dialogue",
        childCategories: [
          item("Episode Dialogue", "EPISODE"),
          item("Additional Dialogue"),
          item("Dialogue Rewrite"),
          item("Language Adaptation"),
          item("Dialect Consultant")
        ]
      },
      {
        name: "Script Department",
        childCategories: [
          item("Script Head"),
          item("Script Coordinator"),
          item("Script Supervisor"),
          item("Script Assistant"),
          item("Writers Room Coordinator"),
          item("Script Printing"),
          item("Script Software")
        ]
      },
      {
        name: "Script Registration & Rights",
        childCategories: [
          item("Script Registration"),
          item("Copyright Registration"),
          item("Writers Agreement"),
          item("Story Rights Agreement"),
          item("Adaptation Rights"),
          item("Remake Rights")
        ]
      }
    ]
  },

  // 3. Intellectual Property & Rights
  {
    name: "Intellectual Property & Rights",
    subCategories: [
      {
        name: "Story Rights",
        childCategories: [
          item("Original Story Rights"),
          item("Book Rights"),
          item("Novel Rights"),
          item("Article Rights"),
          item("Life Rights"),
          item("True Story Rights"),
          item("Adaptation Rights")
        ]
      },
      {
        name: "Format Rights",
        childCategories: [
          item("Format Acquisition"),
          item("Regional Adaptation"),
          item("Remake Licence"),
          item("Renewal Fee")
        ]
      },
      {
        name: "Archive Rights",
        childCategories: [
          item("Archive Video Rights"),
          item("Archive Photo Rights"),
          item("Newspaper Rights"),
          item("Artwork Rights"),
          item("Digital Archive Licence")
        ]
      },
      {
        name: "Legal Clearance",
        childCategories: [
          item("Copyright Clearance"),
          item("Trademark Clearance"),
          item("Brand Clearance"),
          item("Personality Rights"),
          item("Location Rights")
        ]
      }
    ]
  },

  // 4. Producers & Production Leadership
  {
    name: "Producers & Production Leadership",
    subCategories: [
      {
        name: "Producers",
        childCategories: [
          item("Producer"),
          item("Co-Producer"),
          item("Executive Producer"),
          item("Associate Producer"),
          item("Supervising Producer"),
          item("Creative Producer"),
          item("Line Producer"),
          item("Series Producer")
        ]
      },
      {
        name: "Production Management",
        childCategories: [
          item("Production Controller"),
          item("Production Head"),
          item("Production Manager"),
          item("Assistant Production Manager"),
          item("Unit Production Manager"),
          item("Production Coordinator"),
          item("Production Assistants")
        ]
      },
      {
        name: "Commercial",
        childCategories: [
          item("Commercial Head"),
          item("Commercial Manager"),
          item("Cost Controller"),
          item("Budget Controller"),
          item("Commercial Coordinator")
        ]
      },
      {
        name: "Accounts",
        childCategories: [
          item("Production Accountant"),
          item("Assistant Accountant"),
          item("Cashier"),
          item("Petty Cash Manager"),
          item("Accounts Assistant"),
          item("Auditor")
        ]
      }
    ]
  },

  // 5. Pre-Production
  {
    name: "Pre-Production",
    subCategories: [
      {
        name: "Production Office",
        childCategories: [
          item("Office Rent", "PER MONTH"),
          item("Office Deposit"),
          item("Electricity", "PER MONTH"),
          item("Internet", "PER MONTH"),
          item("Telephone"),
          item("Office Furniture"),
          item("Computers"),
          item("Printers"),
          item("Software"),
          item("Cloud Storage"),
          item("Stationery"),
          item("Printing"),
          item("Photocopy"),
          item("Courier"),
          item("Office Staff"),
          item("Housekeeping")
        ]
      },
      {
        name: "Recce",
        childCategories: [
          item("Location Recce", "PER DAY"),
          item("Technical Recce", "PER DAY"),
          item("Director Recce", "PER DAY"),
          item("DOP Recce", "PER DAY"),
          item("Art Recce", "PER DAY"),
          item("Production Recce", "PER DAY"),
          item("Sound Recce", "PER DAY"),
          item("Recce Transport"),
          item("Recce Food"),
          item("Recce Accommodation")
        ]
      },
      {
        name: "Tests",
        childCategories: [
          item("Camera Test"),
          item("Lens Test"),
          item("Lighting Test"),
          item("Costume Test"),
          item("Makeup Test"),
          item("Hair Test"),
          item("Look Test"),
          item("Artist Test"),
          item("Sound Test")
        ]
      },
      {
        name: "Workshops",
        childCategories: [
          item("Artist Workshop"),
          item("Acting Workshop"),
          item("Script Reading"),
          item("Character Workshop"),
          item("Dialect Workshop"),
          item("Movement Workshop"),
          item("Action Workshop")
        ]
      },
      {
        name: "Rehearsals",
        childCategories: [
          item("Artist Rehearsal", "PER DAY"),
          item("Scene Rehearsal", "PER DAY"),
          item("Action Rehearsal", "PER DAY"),
          item("Dance Rehearsal", "PER DAY"),
          item("Technical Rehearsal", "PER DAY")
        ]
      }
    ]
  },

  // 6. Casting
  {
    name: "Casting",
    subCategories: [
      {
        name: "Casting Team",
        childCategories: [
          item("Casting Director"),
          item("Casting Associate"),
          item("Casting Coordinator"),
          item("Casting Assistant"),
          item("Casting Research")
        ]
      },
      {
        name: "Auditions",
        childCategories: [
          item("Audition Venue"),
          item("Camera"),
          item("Sound"),
          item("Audition Crew"),
          item("Casting Studio"),
          item("Travel"),
          item("Catering")
        ]
      },
      {
        name: "Look Tests",
        childCategories: [
          item("Artist Look Test"),
          item("Camera Test"),
          item("Costume Test"),
          item("Makeup Test"),
          item("Hair Test"),
          item("Photography")
        ]
      },
      {
        name: "Casting Administration",
        childCategories: [
          item("Artist Database"),
          item("Casting Software"),
          item("Artist Communication"),
          item("Documentation"),
          item("Agreement Coordination")
        ]
      }
    ]
  },

  // 7. Cast / Artist Fees
  {
    name: "Cast / Artist Fees",
    subCategories: [
      {
        name: "Series Regulars",
        childCategories: [
          item("Lead Male", "EPISODE"),
          item("Lead Female", "EPISODE"),
          item("Series Regular Lead", "EPISODE"),
          item("Series Regular Supporting", "EPISODE"),
          item("Series Regular Child Artist", "EPISODE")
        ]
      },
      {
        name: "Supporting Cast",
        childCategories: [
          item("Supporting Actor", "PER DAY"),
          item("Character Actor", "PER DAY"),
          item("Recurring Actor", "EPISODE"),
          item("Secondary Cast", "PER DAY")
        ]
      },
      {
        name: "Episode Cast",
        childCategories: [
          item("Episodic Lead", "EPISODE"),
          item("Episodic Supporting", "EPISODE"),
          item("Guest Actor", "EPISODE"),
          item("Special Appearance", "EPISODE"),
          item("Cameo", "EPISODE")
        ]
      },
      {
        name: "Junior Artists",
        childCategories: [
          item("Crowd", "PER DAY"),
          item("Featured Junior Artist", "PER DAY"),
          item("Special Crowd", "PER DAY"),
          item("Period Crowd", "PER DAY"),
          item("Background Performer", "PER DAY")
        ]
      },
      {
        name: "Special Artists",
        childCategories: [
          item("Child Artist", "PER DAY"),
          item("Senior Artist", "PER DAY"),
          item("Foreign Artist", "PER DAY"),
          item("Dancer", "PER DAY"),
          item("Singer", "PER DAY"),
          item("Performer", "PER DAY"),
          item("Body Double", "PER DAY"),
          item("Stunt Double", "PER DAY"),
          item("Voice Artist", "PER DAY")
        ]
      },
      {
        name: "Artist Additional Cost",
        childCategories: [
          item("Rehearsal Fee"),
          item("Look Test Fee"),
          item("Dubbing Fee"),
          item("Promo Fee"),
          item("Overtime"),
          item("Travel"),
          item("Accommodation"),
          item("Food"),
          item("Vanity", "PER DAY"),
          item("Local Transport"),
          item("Security", "PER DAY")
        ]
      }
    ]
  },

  // 8. Direction
  {
    name: "Direction",
    subCategories: [
      {
        name: "Direction Leadership",
        childCategories: [
          item("Series Director"),
          item("Block Director"),
          item("Episode Director", "EPISODE"),
          item("Second Unit Director", "PER DAY")
        ]
      },
      {
        name: "Assistant Direction",
        childCategories: [
          item("Associate Director"),
          item("Chief Assistant Director"),
          item("First Assistant Director", "PER DAY"),
          item("Second Assistant Director", "PER DAY"),
          item("Third Assistant Director", "PER DAY"),
          item("Trainee AD", "PER DAY")
        ]
      },
      {
        name: "Continuity",
        childCategories: [
          item("Script Supervisor"),
          item("Continuity Supervisor"),
          item("Continuity Assistant")
        ]
      },
      {
        name: "Direction Operations",
        childCategories: [
          item("Director Office"),
          item("Director Monitor"),
          item("Director Communication"),
          item("Direction Printing"),
          item("Walkie-Talkies")
        ]
      }
    ]
  },

  // 9. Production Crew
  {
    name: "Production Crew",
    subCategories: [
      {
        name: "Production Management",
        childCategories: [
          item("Production Manager", "PER DAY"),
          item("Assistant Production Manager", "PER DAY"),
          item("Unit Manager", "PER DAY"),
          item("Floor Manager", "PER DAY")
        ]
      },
      {
        name: "Production Assistants",
        childCategories: [
          item("Senior Production Assistant", "PER DAY"),
          item("Production Assistant", "PER DAY"),
          item("Runner", "PER DAY"),
          item("Set PA", "PER DAY")
        ]
      },
      {
        name: "Coordination",
        childCategories: [
          item("Artist Coordinator"),
          item("Crew Coordinator"),
          item("Schedule Coordinator"),
          item("Travel Coordinator"),
          item("Accommodation Coordinator"),
          item("Location Coordinator")
        ]
      },
      {
        name: "Support",
        childCategories: [
          item("Spot Boys", "PER DAY"),
          item("Loaders", "PER DAY"),
          item("Helpers", "PER DAY"),
          item("Office Boys", "PER DAY"),
          item("Housekeeping", "PER DAY")
        ]
      }
    ]
  },

  // 10. Camera
  {
    name: "Camera",
    subCategories: [
      {
        name: "Camera Crew",
        childCategories: [
          item("Director of Photography", "PER DAY"),
          item("Additional DOP", "PER DAY"),
          item("Camera Operator", "PER DAY"),
          item("Focus Puller", "PER DAY"),
          item("First AC", "PER DAY"),
          item("Second AC", "PER DAY"),
          item("Camera Attendant", "PER DAY"),
          item("DIT", "PER DAY"),
          item("Data Wrangler", "PER DAY")
        ]
      },
      {
        name: "Camera Body",
        childCategories: [
          item("Main Camera", "PER DAY"),
          item("B Camera", "PER DAY"),
          item("C Camera", "PER DAY"),
          item("Additional Camera", "PER DAY"),
          item("Specialty Camera", "PER DAY")
        ]
      },
      {
        name: "Lens",
        childCategories: [
          item("Prime Lens Set", "PER DAY"),
          item("Zoom Lens", "PER DAY"),
          item("Macro Lens", "PER DAY"),
          item("Specialty Lens", "PER DAY"),
          item("Filter Set", "PER DAY")
        ]
      },
      {
        name: "Camera Accessories",
        childCategories: [
          item("Matte Box", "PER DAY"),
          item("Follow Focus", "PER DAY"),
          item("Wireless Focus", "PER DAY"),
          item("Camera Monitor", "PER DAY"),
          item("Wireless Video", "PER DAY"),
          item("Video Transmitter", "PER DAY"),
          item("Batteries", "PER DAY"),
          item("Camera Support", "PER DAY")
        ]
      },
      {
        name: "Camera Movement",
        childCategories: [
          item("Steadicam", "PER DAY"),
          item("Gimbal", "PER DAY"),
          item("Dolly", "PER DAY"),
          item("Track", "PER DAY"),
          item("Jimmy Jib", "PER DAY"),
          item("Crane", "PER DAY"),
          item("Slider", "PER DAY"),
          item("Drone", "PER DAY"),
          item("Vehicle Rig", "PER DAY")
        ]
      },
      {
        name: "Data",
        childCategories: [
          item("Memory Cards"),
          item("Hard Drives"),
          item("SSD"),
          item("Backup Drives"),
          item("LTO"),
          item("Card Readers"),
          item("Data Station")
        ]
      }
    ]
  },

  // 11. Lighting
  {
    name: "Lighting",
    subCategories: [
      {
        name: "Lighting Crew",
        childCategories: [
          item("Gaffer", "PER DAY"),
          item("Chief Electrician", "PER DAY"),
          item("Best Boy", "PER DAY"),
          item("Lightmen", "PER DAY"),
          item("Lighting Assistants", "PER DAY")
        ]
      },
      {
        name: "Lighting Equipment",
        childCategories: [
          item("HMI", "PER DAY"),
          item("LED", "PER DAY"),
          item("Tungsten", "PER DAY"),
          item("Fresnel", "PER DAY"),
          item("Panel Lights", "PER DAY"),
          item("Tube Lights", "PER DAY"),
          item("Practical Lights", "PER DAY"),
          item("Moving Lights", "PER DAY")
        ]
      },
      {
        name: "Power Distribution",
        childCategories: [
          item("Distribution Boards", "PER DAY"),
          item("Cables", "PER DAY"),
          item("Extension", "PER DAY"),
          item("Dimmer", "PER DAY"),
          item("Earthing", "PER DAY")
        ]
      },
      {
        name: "Lighting Consumables",
        childCategories: [
          item("Gel"),
          item("Diffusion"),
          item("Tape"),
          item("Bulbs"),
          item("Electrical Consumables")
        ]
      }
    ]
  },

  // 12. Grip
  {
    name: "Grip",
    subCategories: [
      {
        name: "Grip Crew",
        childCategories: [
          item("Key Grip", "PER DAY"),
          item("Best Boy Grip", "PER DAY"),
          item("Grip Assistants", "PER DAY")
        ]
      },
      {
        name: "Grip Equipment",
        childCategories: [
          item("Stands", "PER DAY"),
          item("Flags", "PER DAY"),
          item("Frames", "PER DAY"),
          item("Butterfly", "PER DAY"),
          item("Rigging Equipment", "PER DAY"),
          item("Clamps", "PER DAY"),
          item("Suction Rigs", "PER DAY")
        ]
      },
      {
        name: "Camera Grip",
        childCategories: [
          item("Track", "PER DAY"),
          item("Dolly", "PER DAY"),
          item("Platform", "PER DAY"),
          item("Vehicle Rig", "PER DAY"),
          item("Mounting Rig", "PER DAY")
        ]
      }
    ]
  },

  // 13. Sound
  {
    name: "Sound",
    subCategories: [
      {
        name: "Sound Crew",
        childCategories: [
          item("Production Sound Mixer", "PER DAY"),
          item("Sound Recordist", "PER DAY"),
          item("Boom Operator", "PER DAY"),
          item("Sound Assistant", "PER DAY"),
          item("RF Technician", "PER DAY")
        ]
      },
      {
        name: "Recording Equipment",
        childCategories: [
          item("Recorder", "PER DAY"),
          item("Mixer", "PER DAY"),
          item("Wireless Microphones", "PER DAY"),
          item("Lavalier", "PER DAY"),
          item("Boom", "PER DAY"),
          item("Shotgun Microphone", "PER DAY"),
          item("Timecode", "PER DAY"),
          item("IFB", "PER DAY")
        ]
      },
      {
        name: "Playback",
        childCategories: [
          item("Playback System", "PER DAY"),
          item("Speaker", "PER DAY"),
          item("Playback Operator", "PER DAY")
        ]
      },
      {
        name: "Sound Consumables",
        childCategories: [
          item("Batteries"),
          item("Tape"),
          item("Wind Protection"),
          item("Mic Accessories")
        ]
      }
    ]
  },

  // 14. Art & Production Design
  {
    name: "Art & Production Design",
    subCategories: [
      {
        name: "Art Team",
        childCategories: [
          item("Production Designer"),
          item("Art Director"),
          item("Assistant Art Director"),
          item("Art Coordinator"),
          item("Draftsman"),
          item("Set Designer"),
          item("3D Visualiser"),
          item("Graphic Designer"),
          item("Prop Master")
        ]
      },
      {
        name: "Set Construction",
        childCategories: [
          item("Carpentry"),
          item("Painting"),
          item("Fabrication"),
          item("Welding"),
          item("Sculpture"),
          item("Moulding"),
          item("Electrical"),
          item("Labour", "PER DAY"),
          item("Set Flooring"),
          item("Set Wall"),
          item("Set Ceiling")
        ]
      },
      {
        name: "Set Dressing",
        childCategories: [
          item("Furniture"),
          item("Curtains"),
          item("Carpets"),
          item("Decorative Items"),
          item("Wall Art"),
          item("Plants"),
          item("Lighting Fixtures"),
          item("Household Items")
        ]
      },
      {
        name: "Props",
        childCategories: [
          item("Hero Props"),
          item("Action Props"),
          item("Background Props"),
          item("Consumable Props"),
          item("Breakaway Props"),
          item("Replica Props"),
          item("Period Props")
        ]
      },
      {
        name: "Graphics",
        childCategories: [
          item("Signage"),
          item("Posters"),
          item("Labels"),
          item("Packaging"),
          item("Printed Graphics"),
          item("Screen Graphics")
        ]
      },
      {
        name: "Art Transport",
        childCategories: [
          item("Art Truck", "PER DAY"),
          item("Material Transport"),
          item("Loading"),
          item("Unloading")
        ]
      }
    ]
  },

  // 15. Costume & Wardrobe
  {
    name: "Costume & Wardrobe",
    subCategories: [
      {
        name: "Costume Team",
        childCategories: [
          item("Costume Designer"),
          item("Costume Supervisor"),
          item("Stylist"),
          item("Assistant Costume Designer"),
          item("Costume Assistant"),
          item("Dressman", "PER DAY"),
          item("Tailor", "PER DAY")
        ]
      },
      {
        name: "Lead Cast Costume",
        childCategories: [
          item("Purchase"),
          item("Fabric"),
          item("Tailoring"),
          item("Rental"),
          item("Alteration")
        ]
      },
      {
        name: "Supporting Cast Costume",
        childCategories: [
          item("Purchase"),
          item("Rental"),
          item("Tailoring")
        ]
      },
      {
        name: "Episode Cast Costume",
        childCategories: [
          item("Guest Costume"),
          item("Character Costume"),
          item("Junior Artist Costume")
        ]
      },
      {
        name: "Accessories",
        childCategories: [
          item("Jewellery"),
          item("Shoes"),
          item("Bags"),
          item("Belts"),
          item("Watches"),
          item("Spectacles"),
          item("Headgear")
        ]
      },
      {
        name: "Continuity",
        childCategories: [
          item("Continuity Photography"),
          item("Costume Tags"),
          item("Storage"),
          item("Racks")
        ]
      },
      {
        name: "Maintenance",
        childCategories: [
          item("Laundry"),
          item("Dry Cleaning"),
          item("Ironing"),
          item("Repair"),
          item("Alteration")
        ]
      },
      {
        name: "Costume Transport",
        childCategories: [
          item("Costume Vehicle", "PER DAY"),
          item("Loading"),
          item("Storage")
        ]
      }
    ]
  },

  // 16. Makeup, Hair & Look
  {
    name: "Makeup, Hair & Look",
    subCategories: [
      {
        name: "Makeup Team",
        childCategories: [
          item("Makeup Designer"),
          item("Makeup Supervisor"),
          item("Makeup Artist", "PER DAY"),
          item("Makeup Assistant", "PER DAY")
        ]
      },
      {
        name: "Hair Team",
        childCategories: [
          item("Hair Designer"),
          item("Hair Supervisor"),
          item("Hair Stylist", "PER DAY"),
          item("Hair Assistant", "PER DAY"),
          item("Barber", "PER DAY")
        ]
      },
      {
        name: "Special Makeup",
        childCategories: [
          item("Prosthetics"),
          item("SFX Makeup"),
          item("Blood Effects"),
          item("Scar"),
          item("Tattoo"),
          item("Age Makeup")
        ]
      },
      {
        name: "Hair Materials",
        childCategories: [
          item("Wig"),
          item("Hair Extension"),
          item("Hair Products")
        ]
      },
      {
        name: "Makeup Materials",
        childCategories: [
          item("Foundation"),
          item("Cosmetics"),
          item("Hygiene"),
          item("Disposables"),
          item("Makeup Consumables")
        ]
      },
      {
        name: "Look Continuity",
        childCategories: [
          item("Continuity Photos"),
          item("Look Sheets"),
          item("Character Look Records")
        ]
      }
    ]
  },

  // 17. Locations
  {
    name: "Locations",
    subCategories: [
      {
        name: "Location Team",
        childCategories: [
          item("Location Manager", "PER DAY"),
          item("Assistant Location Manager", "PER DAY"),
          item("Location Coordinator"),
          item("Location Scouts")
        ]
      },
      {
        name: "Location Rent",
        childCategories: [
          item("House", "PER DAY"),
          item("Office", "PER DAY"),
          item("Road", "PER DAY"),
          item("Exterior", "PER DAY"),
          item("Government Property", "PER DAY"),
          item("Private Property", "PER DAY"),
          item("Special Location", "PER DAY")
        ]
      },
      {
        name: "Permissions",
        childCategories: [
          item("Police"),
          item("Traffic"),
          item("Municipality"),
          item("Government"),
          item("Forest"),
          item("Archaeology"),
          item("Airport"),
          item("Railway")
        ]
      },
      {
        name: "Location Services",
        childCategories: [
          item("Electricity"),
          item("Water"),
          item("Cleaning"),
          item("Security", "PER DAY"),
          item("Parking"),
          item("Holding Area"),
          item("Toilets", "PER DAY"),
          item("Restoration")
        ]
      },
      {
        name: "Location Deposit",
        childCategories: [
          item("Security Deposit"),
          item("Damage Deposit")
        ]
      }
    ]
  },

  // 18. Studio & Floor
  {
    name: "Studio & Floor",
    subCategories: [
      {
        name: "Studio Rent",
        childCategories: [
          item("Setup Day", "PER DAY"),
          item("Rehearsal Day", "PER DAY"),
          item("Shoot Day", "PER DAY"),
          item("Hold Day", "PER DAY"),
          item("Dismantling Day", "PER DAY")
        ]
      },
      {
        name: "Studio Services",
        childCategories: [
          item("Electricity", "PER DAY"),
          item("Air Conditioning", "PER DAY"),
          item("Housekeeping", "PER DAY"),
          item("Security", "PER DAY"),
          item("Parking"),
          item("Water"),
          item("Floor Staff", "PER DAY")
        ]
      },
      {
        name: "Support Areas",
        childCategories: [
          item("Production Room", "PER DAY"),
          item("Makeup Room", "PER DAY"),
          item("Costume Room", "PER DAY"),
          item("Green Room", "PER DAY"),
          item("Dining Area", "PER DAY"),
          item("Storage", "PER DAY")
        ]
      }
    ]
  },

  // 19. Equipment
  {
    name: "Equipment",
    subCategories: [
      {
        name: "Camera Package",
        childCategories: [
          item("Camera", "PER DAY"),
          item("Lens", "PER DAY"),
          item("Accessories", "PER DAY")
        ]
      },
      {
        name: "Lighting Package",
        childCategories: [
          item("Lighting Equipment", "PER DAY"),
          item("Distribution", "PER DAY")
        ]
      },
      {
        name: "Grip Package",
        childCategories: [
          item("Grip Equipment", "PER DAY")
        ]
      },
      {
        name: "Sound Package",
        childCategories: [
          item("Recording Equipment", "PER DAY")
        ]
      },
      {
        name: "Specialty Equipment",
        childCategories: [
          item("Crane", "PER DAY"),
          item("Drone", "PER DAY"),
          item("Steadicam", "PER DAY"),
          item("Gimbal", "PER DAY"),
          item("Underwater Camera", "PER DAY"),
          item("Motion Control", "PER DAY"),
          item("High-Speed Camera", "PER DAY")
        ]
      }
    ]
  },

  // 20. Transport & Logistics
  {
    name: "Transport & Logistics",
    subCategories: [
      {
        name: "Artist Transport",
        childCategories: [
          item("Lead Artist Car", "PER DAY"),
          item("Supporting Artist Car", "PER DAY"),
          item("Guest Artist Car", "PER DAY"),
          item("Artist Traveller", "PER DAY")
        ]
      },
      {
        name: "Crew Transport",
        childCategories: [
          item("Director Car", "PER DAY"),
          item("HOD Car", "PER DAY"),
          item("Crew Car", "PER DAY"),
          item("Traveller", "PER DAY"),
          item("Bus", "PER DAY"),
          item("Production Vehicle", "PER DAY")
        ]
      },
      {
        name: "Equipment Transport",
        childCategories: [
          item("Camera Truck", "PER DAY"),
          item("Light Truck", "PER DAY"),
          item("Sound Vehicle", "PER DAY"),
          item("Grip Vehicle", "PER DAY")
        ]
      },
      {
        name: "Department Transport",
        childCategories: [
          item("Art Truck", "PER DAY"),
          item("Costume Vehicle", "PER DAY"),
          item("Makeup Vehicle", "PER DAY"),
          item("Props Vehicle", "PER DAY")
        ]
      },
      {
        name: "Charges",
        childCategories: [
          item("Fuel"),
          item("Toll"),
          item("Parking"),
          item("Night Charge"),
          item("Driver Allowance"),
          item("Extra KM"),
          item("Interstate Tax")
        ]
      }
    ]
  },

  // 21. Genset, Power & Vanity
  {
    name: "Genset, Power & Vanity",
    subCategories: [
      {
        name: "Genset",
        childCategories: [
          item("Main Genset", "PER DAY"),
          item("Backup Genset", "PER DAY"),
          item("Lighting Genset", "PER DAY"),
          item("Operator", "PER DAY"),
          item("Cable", "PER DAY")
        ]
      },
      {
        name: "Fuel",
        childCategories: [
          item("Diesel"),
          item("Petrol"),
          item("Fuel Delivery"),
          item("Fuel Storage")
        ]
      },
      {
        name: "Vanity Vans",
        childCategories: [
          item("Lead Artist Vanity", "PER DAY"),
          item("Supporting Artist Vanity", "PER DAY"),
          item("Director Vanity", "PER DAY"),
          item("Makeup Vanity", "PER DAY"),
          item("Costume Vanity", "PER DAY"),
          item("Common Vanity", "PER DAY")
        ]
      },
      {
        name: "Vanity Services",
        childCategories: [
          item("Attendant", "PER DAY"),
          item("Cleaning"),
          item("Electricity"),
          item("Water")
        ]
      }
    ]
  },

  // 22. Food & Catering
  {
    name: "Food & Catering",
    subCategories: [
      {
        name: "Unit Meals",
        childCategories: [
          item("Breakfast", "PER DAY"),
          item("Lunch", "PER DAY"),
          item("Snacks", "PER DAY"),
          item("Dinner", "PER DAY"),
          item("Midnight Meal", "PER DAY")
        ]
      },
      {
        name: "Artist Food",
        childCategories: [
          item("Special Meal"),
          item("Diet Meal"),
          item("Fruit"),
          item("Juice")
        ]
      },
      {
        name: "Beverages",
        childCategories: [
          item("Tea"),
          item("Coffee"),
          item("Drinking Water"),
          item("Soft Drinks")
        ]
      },
      {
        name: "Catering Services",
        childCategories: [
          item("Catering Vendor"),
          item("Serving Staff", "PER DAY"),
          item("Kitchen Setup"),
          item("Disposable Plates"),
          item("Cutlery"),
          item("Food Transport")
        ]
      }
    ]
  },

  // 23. Accommodation
  {
    name: "Accommodation",
    subCategories: [
      {
        name: "Artist Accommodation",
        childCategories: [
          item("Lead Artist Room", "PER DAY"),
          item("Supporting Artist Room", "PER DAY"),
          item("Guest Artist Room", "PER DAY")
        ]
      },
      {
        name: "HOD Accommodation",
        childCategories: [
          item("Director", "PER DAY"),
          item("DOP", "PER DAY"),
          item("Production Designer", "PER DAY"),
          item("Key HODs", "PER DAY")
        ]
      },
      {
        name: "Crew Accommodation",
        childCategories: [
          item("Crew Rooms", "PER DAY"),
          item("Dormitory", "PER DAY")
        ]
      },
      {
        name: "Hotel Additional",
        childCategories: [
          item("Early Check-In"),
          item("Late Check-Out"),
          item("Laundry"),
          item("Extra Bed"),
          item("Hotel Tax")
        ]
      }
    ]
  },

  // 24. Travel
  {
    name: "Travel",
    subCategories: [
      {
        name: "Air Travel",
        childCategories: [
          item("Artist Ticket"),
          item("HOD Ticket"),
          item("Crew Ticket"),
          item("Equipment Baggage")
        ]
      },
      {
        name: "Rail Travel",
        childCategories: [
          item("Artist"),
          item("Crew")
        ]
      },
      {
        name: "Local Transfer",
        childCategories: [
          item("Airport Transfer"),
          item("Railway Transfer"),
          item("Local Movement")
        ]
      },
      {
        name: "Additional Travel",
        childCategories: [
          item("Excess Baggage"),
          item("Travel Insurance"),
          item("Visa"),
          item("Permit")
        ]
      }
    ]
  },

  // 25. Action & Stunts
  {
    name: "Action & Stunts",
    subCategories: [
      {
        name: "Action Team",
        childCategories: [
          item("Action Director"),
          item("Stunt Coordinator"),
          item("Fighters", "PER DAY"),
          item("Stunt Performers", "PER DAY"),
          item("Safety Team")
        ]
      },
      {
        name: "Action Equipment",
        childCategories: [
          item("Harness"),
          item("Wire"),
          item("Safety Mat"),
          item("Crash Equipment"),
          item("Rigging")
        ]
      },
      {
        name: "Weapons",
        childCategories: [
          item("Prop Weapons"),
          item("Replica Weapons"),
          item("Armoury Support")
        ]
      },
      {
        name: "Action Vehicles",
        childCategories: [
          item("Picture Vehicles"),
          item("Crash Vehicles"),
          item("Rigged Vehicles")
        ]
      },
      {
        name: "Safety",
        childCategories: [
          item("Ambulance", "PER DAY"),
          item("Doctor", "PER DAY"),
          item("Medical Team"),
          item("Safety Equipment")
        ]
      }
    ]
  },

  // 26. Choreography & Songs
  {
    name: "Choreography & Songs",
    subCategories: [
      {
        name: "Choreography Team",
        childCategories: [
          item("Choreographer"),
          item("Assistant Choreographer")
        ]
      },
      {
        name: "Dancers",
        childCategories: [
          item("Lead Dancers", "PER DAY"),
          item("Background Dancers", "PER DAY"),
          item("Dance Group")
        ]
      },
      {
        name: "Rehearsal",
        childCategories: [
          item("Rehearsal Studio", "PER DAY"),
          item("Dancer Rehearsal"),
          item("Artist Rehearsal")
        ]
      },
      {
        name: "Song Production",
        childCategories: [
          item("Playback Track"),
          item("Song Props"),
          item("Special Costume"),
          item("Song Set")
        ]
      }
    ]
  },

  // 27. Medical, Security & Safety
  {
    name: "Medical, Security & Safety",
    subCategories: [
      {
        name: "Medical",
        childCategories: [
          item("Doctor", "PER DAY"),
          item("Nurse", "PER DAY"),
          item("Ambulance", "PER DAY"),
          item("First Aid"),
          item("Medicine")
        ]
      },
      {
        name: "Security",
        childCategories: [
          item("General Security", "PER DAY"),
          item("Artist Security", "PER DAY"),
          item("Bouncers", "PER DAY"),
          item("Female Security", "PER DAY")
        ]
      },
      {
        name: "Safety",
        childCategories: [
          item("Safety Officer", "PER DAY"),
          item("Fire Equipment"),
          item("Protective Equipment"),
          item("Barricade")
        ]
      }
    ]
  },

  // 28. Daily Production Expenses
  {
    name: "Daily Production Expenses",
    subCategories: [
      {
        name: "Petty Cash",
        childCategories: [
          item("Production Cash", "PER DAY"),
          item("Department Cash", "PER DAY")
        ]
      },
      {
        name: "Daily Labour",
        childCategories: [
          item("Extra Labour", "PER DAY"),
          item("Loader", "PER DAY"),
          item("Helper", "PER DAY")
        ]
      },
      {
        name: "Emergency Purchase",
        childCategories: [
          item("Art Purchase"),
          item("Costume Purchase"),
          item("Technical Purchase"),
          item("Production Purchase")
        ]
      },
      {
        name: "Daily Miscellaneous",
        childCategories: [
          item("Printing"),
          item("Courier"),
          item("Mobile Recharge"),
          item("Internet"),
          item("Cleaning"),
          item("Rain Protection"),
          item("Emergency Transport")
        ]
      }
    ]
  },

  // 29. Post-Production
  {
    name: "Post-Production",
    subCategories: [
      {
        name: "Episode Editing",
        childCategories: [
          item("Offline Editor", "EPISODE"),
          item("Assistant Editor"),
          item("Edit Studio", "PER MONTH"),
          item("Edit Machine"),
          item("Storage")
        ]
      },
      {
        name: "Offline Edit",
        childCategories: [
          item("Episode Assembly", "EPISODE"),
          item("Rough Cut", "EPISODE"),
          item("Director Cut", "EPISODE"),
          item("Producer Cut", "EPISODE"),
          item("Platform Review Cut", "EPISODE")
        ]
      },
      {
        name: "Online Edit",
        childCategories: [
          item("Conform", "EPISODE"),
          item("Online Finishing", "EPISODE"),
          item("Master Timeline", "EPISODE")
        ]
      },
      {
        name: "Episode Versions",
        childCategories: [
          item("Recap", "EPISODE"),
          item("Previously On", "EPISODE"),
          item("Next Episode Preview", "EPISODE"),
          item("Trailer Cut"),
          item("Promo Cut")
        ]
      }
    ]
  },

  // 30. VFX
  {
    name: "VFX",
    subCategories: [
      {
        name: "VFX Supervision",
        childCategories: [
          item("VFX Supervisor"),
          item("On-Set VFX Supervisor", "PER DAY"),
          item("VFX Producer")
        ]
      },
      {
        name: "VFX Production",
        childCategories: [
          item("Rotoscopy"),
          item("Cleanup"),
          item("Wire Removal"),
          item("Screen Replacement"),
          item("Compositing"),
          item("CGI"),
          item("Matte Painting"),
          item("Set Extension"),
          item("Beauty Work")
        ]
      },
      {
        name: "Episode VFX",
        childCategories: [
          item("Episode-wise VFX Shots", "EPISODE"),
          item("VFX Corrections"),
          item("VFX Final Delivery")
        ]
      }
    ]
  },

  // 31. Audio Post
  {
    name: "Audio Post",
    subCategories: [
      {
        name: "Dialogue",
        childCategories: [
          item("Dialogue Edit", "EPISODE"),
          item("Dialogue Cleanup", "EPISODE"),
          item("Noise Reduction", "EPISODE")
        ]
      },
      {
        name: "ADR / Dubbing",
        childCategories: [
          item("Artist Dubbing", "PER DAY"),
          item("Dubbing Studio", "PER SHIFT"),
          item("Dubbing Director"),
          item("Recording Engineer", "PER SHIFT")
        ]
      },
      {
        name: "Sound Design",
        childCategories: [
          item("Sound Designer"),
          item("Sound Editor"),
          item("Effects"),
          item("Ambience")
        ]
      },
      {
        name: "Foley",
        childCategories: [
          item("Foley Artist", "PER DAY"),
          item("Foley Recording", "PER SHIFT")
        ]
      },
      {
        name: "Mix",
        childCategories: [
          item("Premix"),
          item("Stereo Mix", "EPISODE"),
          item("5.1 Mix", "EPISODE"),
          item("Atmos Mix", "EPISODE"),
          item("Broadcast Mix", "EPISODE")
        ]
      }
    ]
  },

  // 32. Music
  {
    name: "Music",
    subCategories: [
      {
        name: "Background Score",
        childCategories: [
          item("Composer"),
          item("Music Programmer"),
          item("Musicians"),
          item("Studio")
        ]
      },
      {
        name: "Original Songs",
        childCategories: [
          item("Composer"),
          item("Lyricist"),
          item("Singer"),
          item("Musicians"),
          item("Recording"),
          item("Mixing"),
          item("Mastering")
        ]
      },
      {
        name: "Licensed Music",
        childCategories: [
          item("Publishing Rights"),
          item("Master Rights"),
          item("Library Music")
        ]
      }
    ]
  },

  // 33. DI & Colour
  {
    name: "DI & Colour",
    subCategories: [
      {
        name: "Colour",
        childCategories: [
          item("Colourist"),
          item("Colour Correction", "EPISODE"),
          item("Colour Grading", "EPISODE")
        ]
      },
      {
        name: "DI Facility",
        childCategories: [
          item("DI Studio", "EPISODE"),
          item("Conform"),
          item("Data Management")
        ]
      },
      {
        name: "Episode Finishing",
        childCategories: [
          item("Episode DI", "EPISODE"),
          item("Corrections"),
          item("Final Output", "EPISODE")
        ]
      }
    ]
  },

  // 34. Graphics & Titles
  {
    name: "Graphics & Titles",
    subCategories: [
      {
        name: "Series Graphics",
        childCategories: [
          item("Series Logo"),
          item("Title Design"),
          item("Main Title Sequence"),
          item("End Credits")
        ]
      },
      {
        name: "Episode Graphics",
        childCategories: [
          item("Location Titles", "EPISODE"),
          item("Date Cards", "EPISODE"),
          item("Lower Thirds", "EPISODE"),
          item("Text Graphics", "EPISODE")
        ]
      },
      {
        name: "Motion Graphics",
        childCategories: [
          item("Animation"),
          item("Motion Design"),
          item("Maps"),
          item("Screens")
        ]
      }
    ]
  },

  // 35. Language Versions
  {
    name: "Language Versions",
    subCategories: [
      {
        name: "Subtitles",
        childCategories: [
          item("English Subtitle", "EPISODE"),
          item("Hindi Subtitle", "EPISODE"),
          item("Regional Subtitle", "EPISODE"),
          item("Subtitle QC", "EPISODE")
        ]
      },
      {
        name: "Dubbing",
        childCategories: [
          item("Hindi Dubbing", "EPISODE"),
          item("Regional Dubbing", "EPISODE"),
          item("Foreign Language Dubbing", "EPISODE")
        ]
      },
      {
        name: "Translation",
        childCategories: [
          item("Script Translation"),
          item("Subtitle Translation"),
          item("Dialogue Adaptation")
        ]
      }
    ]
  },

  // 36. Platform Delivery
  {
    name: "Platform Delivery",
    subCategories: [
      {
        name: "Episode Master",
        childCategories: [
          item("UHD Master", "EPISODE"),
          item("HD Master", "EPISODE"),
          item("Clean Master", "EPISODE"),
          item("Textless Master", "EPISODE"),
          item("International Master", "EPISODE")
        ]
      },
      {
        name: "Technical Delivery",
        childCategories: [
          item("Episode QC", "EPISODE"),
          item("Technical QC", "EPISODE"),
          item("Legal QC", "EPISODE"),
          item("Audio QC", "EPISODE")
        ]
      },
      {
        name: "Metadata",
        childCategories: [
          item("Episode Synopsis"),
          item("Cast Metadata"),
          item("Crew Metadata"),
          item("Technical Metadata"),
          item("Artwork Metadata")
        ]
      },
      {
        name: "Delivery Files",
        childCategories: [
          item("Subtitle File"),
          item("Closed Caption"),
          item("Audio Description"),
          item("Music Cue Sheet"),
          item("Dialogue List")
        ]
      },
      {
        name: "Storage",
        childCategories: [
          item("Hard Drive"),
          item("LTO"),
          item("Cloud Upload"),
          item("Archive Storage")
        ]
      }
    ]
  },

  // 37. Promo & Marketing
  {
    name: "Promo & Marketing",
    subCategories: [
      {
        name: "Promo Production",
        childCategories: [
          item("Teaser"),
          item("Trailer"),
          item("Episode Promo"),
          item("Character Promo"),
          item("Season Promo")
        ]
      },
      {
        name: "Photoshoot",
        childCategories: [
          item("Key Art Shoot"),
          item("Cast Photoshoot"),
          item("BTS Shoot")
        ]
      },
      {
        name: "Digital",
        childCategories: [
          item("Social Media Content"),
          item("Reels"),
          item("Short Clips"),
          item("Posters"),
          item("Thumbnails")
        ]
      },
      {
        name: "PR",
        childCategories: [
          item("Press Conference"),
          item("Interviews"),
          item("Public Relations"),
          item("Media Event")
        ]
      }
    ]
  },

  // 38. Legal & Compliance
  {
    name: "Legal & Compliance",
    subCategories: [
      {
        name: "Agreements",
        childCategories: [
          item("Artist Agreement"),
          item("Crew Agreement"),
          item("Vendor Agreement"),
          item("Location Agreement"),
          item("Writer Agreement")
        ]
      },
      {
        name: "Legal Consultant",
        childCategories: [
          item("Legal Retainer"),
          item("Legal Review")
        ]
      },
      {
        name: "Compliance",
        childCategories: [
          item("Labour Compliance"),
          item("POSH Compliance"),
          item("Child Artist Compliance"),
          item("Platform Compliance"),
          item("Copyright Compliance")
        ]
      },
      {
        name: "Clearances",
        childCategories: [
          item("Music Clearance"),
          item("Brand Clearance"),
          item("Archive Clearance"),
          item("Location Release")
        ]
      }
    ]
  },

  // 39. Insurance
  {
    name: "Insurance",
    subCategories: [
      {
        name: "Production Insurance",
        childCategories: [
          item("Production Policy"),
          item("Public Liability")
        ]
      },
      {
        name: "Equipment Insurance",
        childCategories: [
          item("Camera"),
          item("Lighting"),
          item("Sound"),
          item("Art")
        ]
      },
      {
        name: "Personnel Insurance",
        childCategories: [
          item("Cast"),
          item("Crew"),
          item("Stunt"),
          item("Travel")
        ]
      }
    ]
  },

  // 40. Administration
  {
    name: "Administration",
    subCategories: [
      {
        name: "Communication",
        childCategories: [
          item("Mobile"),
          item("SIM"),
          item("Internet"),
          item("Walkie-Talkie"),
          item("Data Plans")
        ]
      },
      {
        name: "Software",
        childCategories: [
          item("Production Software"),
          item("Accounting Software"),
          item("Editing Software"),
          item("Cloud Storage")
        ]
      },
      {
        name: "Administration",
        childCategories: [
          item("Printing"),
          item("Stationery"),
          item("Courier"),
          item("ID Cards"),
          item("Access Passes")
        ]
      }
    ]
  },

  // 41. Contingency
  {
    name: "Contingency",
    subCategories: [
      {
        name: "Production Contingency",
        childCategories: [
          item("General Production"),
          item("Weather"),
          item("Schedule Delay"),
          item("Additional Shoot")
        ]
      },
      {
        name: "Technical Contingency",
        childCategories: [
          item("Equipment Breakdown"),
          item("Additional Equipment")
        ]
      },
      {
        name: "Creative Contingency",
        childCategories: [
          item("Rewrite"),
          item("Reshoot"),
          item("Additional Cast")
        ]
      },
      {
        name: "Post Contingency",
        childCategories: [
          item("Additional Edit"),
          item("VFX Revision"),
          item("Platform Revision")
        ]
      }
    ]
  },

  // 42. Recoveries & Credits
  {
    name: "Recoveries & Credits",
    subCategories: [
      {
        name: "Refunds",
        childCategories: [
          item("Location Deposit Refund"),
          item("Vendor Refund"),
          item("Equipment Deposit Refund")
        ]
      },
      {
        name: "Recoveries",
        childCategories: [
          item("Set Material Sale"),
          item("Scrap Sale"),
          item("Costume Recovery"),
          item("Equipment Recovery")
        ]
      },
      {
        name: "Credits",
        childCategories: [
          item("Vendor Credit Note"),
          item("Insurance Claim"),
          item("Tax Credit")
        ]
      }
    ]
  }
];

export const DEFAULT_WEB_SERIES_BUDGET_STRUCTURE = DEFAULT_OTT_BUDGET_STRUCTURE;
