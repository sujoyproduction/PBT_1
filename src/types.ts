export interface Company {
  id: string;
  companyName?: string;
  name?: string;
  companyCode?: string;
  code?: string;
  legalName?: string;
  companyType?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  contactNumber?: string;
  address?: string;
  gstNumber?: string;
  panNumber?: string;
  entityType?: string;
  currencyCode?: string; // e.g. 'INR'
  timezone?: string; // e.g. 'Asia/Kolkata'
  createdBy?: string;
  ownerEmail?: string;
  description?: string;
  projectCount?: number;
  utilization?: number;
  status?: 'Active' | 'Suspended' | 'Pending' | 'Soft Deleted' | 'Maintained';
  createdAt?: string;
  updatedAt?: string;
  lastSynced?: string;
}

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  fullName: string;
  email: string;
  roleId: string;
  roleName: string;
  membershipStatus: 'Active' | 'Invited' | 'Suspended';
  joinedAt: string;
}

export interface CompanyInvitation {
  id: string;
  companyId: string;
  email: string;
  roleId: string;
  roleName: string;
  invitationToken: string;
  invitedBy: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Expired';
  expiresAt: string;
  createdAt: string;
}

export interface ProjectSchedule {
  preProductionStartDate?: string;
  preProductionDays?: number;
  shootingStartDate?: string;
  shootingDays?: number;
  postProductionStartDate?: string;
  postProductionDays?: number;
  targetReleaseDate?: string;
}

export interface Project {
  id: string;
  companyId?: string; // Multi-tenant link
  projectCode?: string;
  name: string;
  description: string;
  totalBudget: number;
  spent: number;
  status: 'Pre-Production' | 'Production' | 'Post-Production' | 'Released';
  startDate: string;
  endDate?: string;
  currency: string;
  timeZone?: string;
  companyName?: string;
  projectType?: string;
  type?: string;
  showFormat?: string;
  channelPlatform?: string;
  seasonName?: string;
  seasonCode?: string;
  seasonStartDate?: string;
  telecastStartDate?: string;
  episodeDuration?: string;
  expectedEpisodes?: number;
  expectedShootDays?: number;
  expectedSeasonsCount?: number;
  expectedContestants?: number;
  expectedChallenges?: number;
  compLegalName?: string;
  compRegNumber?: string;
  compAddress?: string;
  compGstin?: string;
  compPan?: string;
  compEmail?: string;
  compPhone?: string;
  compCity?: string;
  compState?: string;
  compCountry?: string;
  compPinCode?: string;
  compEntityType?: string;
  authPersonName?: string;
  authPersonDesignation?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  directorName?: string;
  assignedUsers?: any[];
  designations?: any[];
  schedule?: ProjectSchedule;
  recordVersion?: number;
  deletedAt?: string | null;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChildCategory {
  id: string;
  subCategoryId?: string;
  categoryId?: string;
  projectId?: string;
  companyId?: string;
  name: string;
  allocatedAmount: number;
  spentAmount: number;
  code?: string;
  count?: number;
  rate?: number;
  paymentTerms?: string;
  shifts?: number;
  unitType?: string;
  days?: number;
  taxPercent?: number;
  approvedAmount?: number;
  committedAmount?: number;
  actualAmount?: number;
  paidAmount?: number;
  vendorId?: string;
  vendorName?: string;
  departmentId?: string;
  scheduleId?: string;
  locationId?: string;
  recordVersion?: number;

  // Cooking Show & Production ERP Budget Allocation Fields
  season?: string;
  episode?: string;
  round?: string;
  segment?: string;
  challenge?: string;
  shootingDay?: string;
  productionUnit?: string;
  kitchenStation?: string;
  contestant?: string;
  hostJudge?: string;
  department?: string;
  studio?: string;
  vendor?: string;
  sponsor?: string;
  costType?: string;
}

export interface SubCategory {
  id: string;
  categoryId?: string;
  projectId?: string;
  companyId?: string;
  name: string;
  allocatedAmount: number;
  spentAmount: number;
  code?: string;
  childCategories?: ChildCategory[];
  count?: number;
  rate?: number;
  paymentTerms?: string;
  shifts?: number;
  recordVersion?: number;
}

export interface BudgetCategory {
  id: string;
  projectId?: string;
  companyId?: string;
  name: string;
  allocatedAmount: number;
  spentAmount: number;
  code?: string;
  subCategories?: SubCategory[];
  count?: number;
  rate?: number;
  paymentTerms?: string;
  shifts?: number;
  recordVersion?: number;
}

export interface BudgetVersion {
  id: string;
  companyId: string;
  projectId: string;
  versionNumber: number; // 1, 2, 3...
  versionName: string; // e.g. "V01 - Initial Estimate", "V03 - Final Approved"
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Locked' | 'Archived';
  totalAmount: number;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionOverride {
  id: string;
  projectMemberId: string;
  permissionCode: string;
  accessType: 'ALLOW' | 'DENY';
  grantedBy: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  itemDescription: string;
  budgetItemId?: string;
  categoryId?: string;
  categoryName?: string;
  subCategoryId?: string;
  subCategoryName?: string;
  childCategoryId?: string;
  childCategoryName?: string;
  budgetItemName?: string;
  orderQty: number;
  unit: string; // e.g. 'Days', 'Shifts', 'Units', 'Sets', 'Lump Sum', 'Hours'
  unitRate: number;
  gstRate: number; // 0, 5, 12, 18, 28
  totalBase: number;
  gstAmount: number;
  totalAmount: number;
  receivedQty: number;
  invoicedQty: number;
  invoicedAmount: number;
  status: 'Pending' | 'Partially Received' | 'Fully Received' | 'Billed' | 'Closed';
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string; // e.g. GRN-2026-0012
  poId: string;
  poNumber: string;
  vendorId?: string;
  vendorName: string;
  deliveryChallanNo: string;
  challanDate: string;
  receivedDate: string;
  receivedBy: string; // e.g., 'Anand (1st AC Camera)', 'Ramesh (Art Asst)'
  dsrShootDay?: string; // e.g. 'Day 04'
  dsrId?: string;
  items: {
    itemId: string;
    itemDescription: string;
    receivedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    remarks?: string;
  }[];
  notes?: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  vendorName: string;
  designation?: string;
  categoryId?: string;
  category: string;             // Main Category Name/Code
  subCategoryId?: string;
  subCategory?: string;          // Sub Category Name
  childCategoryId?: string;
  childCategory?: string;        // Child Category / Budget Item Name
  contactPerson: string;
  phone: string;
  email: string;
  address?: string;
  gstin?: string;
  pan?: string;
  panNumber?: string;
  bankName: string;
  bankBranch?: string;
  accountNumber: string;
  ifscCode: string;
  status: 'Approved' | 'Pending Verification' | 'Active' | 'Blocked';
  totalPaid: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceLineItem {
  itemId: string;
  itemDescription: string;
  categoryId?: string;
  categoryName?: string;
  subCategoryId?: string;
  subCategoryName?: string;
  childCategoryId?: string;
  childCategoryName?: string;
  datesWorked?: string;
  invoicedQty: number; // e.g. 4 Days
  unit?: string;       // e.g. 'Days', 'Shifts', 'Hours', 'Units'
  unitRate: number;    // e.g. 5000
  totalAmount: number; // e.g. 20000
  hsnSacCode?: string;
}

export interface VendorInvoice {
  id: string;
  invoiceNumber: string; // e.g. INV/2026/089 or 2026-27/ 08
  invoiceDate: string;
  dueDate?: string;
  poId: string;
  poNumber: string;
  vendorId?: string;
  vendorName: string;
  vendorAddress?: string;
  vendorPhone?: string;
  vendorEmail?: string;
  vendorGstin?: string;
  vendorPan?: string;
  clientName?: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientGstin?: string;
  projectName?: string;
  items: InvoiceLineItem[];
  baseAmount: number;
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  igstRate?: number;
  igstAmount?: number;
  gstRate: number;
  gstAmount: number;
  totalAmount?: number;
  tdsSection?: string;
  tdsRate?: number;
  tdsAmount?: number;
  netPayable: number;
  // Payment & Beneficiary Details
  beneficiaryName?: string;
  hsnCode?: string;
  panNumber?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  matchStatus: 'MATCHED' | 'PRICE_MISMATCH' | 'QTY_MISMATCH' | 'NO_GRN' | 'PENDING_AUDIT' | 'RECONCILED';
  discrepancyNote?: string;
  varianceAmount?: number;
  approvalStatus: 'Pending' | 'Approved' | 'Disputed' | 'Debit_Note_Requested';
  linkedExpenseId?: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. PO-2026-0015
  projectId: string;
  companyId?: string;
  vendorId?: string;
  vendorName: string;
  vendorGstin?: string;
  vendorPan?: string;
  orderDate: string;
  deliveryDate?: string;
  department: string;
  departmentId?: string;
  status: 'Draft' | 'Issued' | 'Partially Fulfilled' | 'Fulfilled' | 'Under Audit' | 'Closed' | 'Cancelled';
  paymentTerms: string;
  items: PurchaseOrderItem[];
  totalBaseAmount: number;
  totalGstAmount: number;
  grandTotal: number;
  grns: GoodsReceiptNote[];
  invoices: VendorInvoice[];
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExpenseAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageUrl: string;
  uploadedBy?: string;
  createdAt?: string;
}

export interface OnAccountEntry {
  id: string;
  companyId?: string;
  projectId: string;
  expenseId?: string;
  voucherNumber: string;
  holderName: string;
  holderUserId?: string;
  purpose: string;
  givenAmount: number;
  adjustedAmount: number;
  returnedAmount: number;
  additionalPayable: number;
  outstandingAmount: number;
  givenDate: string;
  settlementDueDate: string;
  settlementStatus: 'Open' | 'Partially Adjusted' | 'Fully Adjusted' | 'Refund Pending' | 'Reimbursement Due' | 'Cleared' | 'Overdue' | 'Cancelled' | 'Partially Cleared';
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReimbursementEntry {
  id: string;
  companyId?: string;
  projectId: string;
  expenseId: string;
  reimbursementType: 'Against On Account' | 'Simple Reimbursement';
  onAccountVoucherNo?: string;
  onAccountEntryId?: string;
  claimedAmount: number;
  approvedAmount: number;
  adjustedAmount: number;
  returnableAmount: number;
  additionalPayable: number;
  settlementStatus: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  companyId?: string;
  projectId: string;
  bookingNo?: string; // Voucher No e.g. EXP-2026-000001
  voucherNumber?: string;
  categoryId: string;
  categoryName?: string;
  subCategoryId?: string;
  subCategoryName?: string;
  childCategoryId?: string; // Budget Item / Expense Head ID
  budgetItemName?: string;
  title: string;
  amount: number;
  approvedAmount?: number;
  date: string;
  payee: string; // Name
  payeePhone?: string;
  payeeEmail?: string;
  designation?: string;
  paymentType?: 'Rent' | 'Purchase' | 'Wages' | 'On Account' | 'Reimbursement' | 'Professional Fee' | 'Advance' | 'Security Deposit' | 'Refund' | 'Transportation' | 'Service Charge' | 'Petty Cash';
  paymentMode?: 'Cheque' | 'Bank Transfer' | 'UPI' | 'Cash' | 'Credit Card' | 'Debit Card' | 'Petty Cash' | 'Wallet' | 'Demand Draft' | 'Draft Transfer' | 'Net Banking' | 'Card';
  paymentAccount?: string;
  paymentAccountId?: string;
  chequeNo?: string;
  chequeDate?: string;
  bankName?: string;
  utrNumber?: string;
  upiId?: string;
  paidBy?: string;
  notes?: string;
  attachments?: (string | ExpenseAttachment)[];
  status: 'Pending' | 'Paid' | 'Disputed' | 'Draft' | 'Submitted' | 'Pending Verification' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Cancelled';
  approvalStatus?: 'Draft' | 'Submitted' | 'Pending Verification' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Cancelled';
  paymentStatus?: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Payment Pending' | 'Cancelled';
  qty?: number;
  unit?: string;
  unitCost?: number;
  code?: string;
  createdBy?: string;
  updatedBy?: string;
  approvedBy?: string;
  recordVersion?: number;
  createdAt?: string;
  
  // On Account details
  onAccountDetails?: Partial<OnAccountEntry>;
  // Reimbursement details
  reimbursementDetails?: Partial<ReimbursementEntry>;

  // Tax, TDS & Invoicing Details
  baseAmount?: number;
  gstRate?: number; // 0, 5, 12, 18, 28
  gstType?: 'CGST_SGST' | 'IGST' | 'EXEMPT';
  gstAmount?: number;
  isRcm?: boolean;
  tdsSection?: 'NONE' | '194C_INDIV' | '194C_OTHERS' | '194J_TECH' | '194J_PROF' | '194I_BUILDING' | '194I_PLANT' | '194Q' | '194H' | '194A';
  tdsRate?: number; // percentage
  tdsAmount?: number;
  netPayable?: number;
  panNumber?: string;
  gstin?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  sourceModule?: 'MANUAL' | 'DSR' | 'DSR_LOGISTICS' | 'PETTY_CASH' | 'PO_SETTLEMENT' | 'Direct' | 'PO';
  dsrDay?: string | number;
  dsrId?: string;
  poId?: string;
  vendorId?: string;

  // Cooking Show & Production ERP Budget Allocation Fields
  season?: string;
  episode?: string;
  round?: string;
  segment?: string;
  challenge?: string;
  shootingDay?: string;
  productionUnit?: string;
  kitchenStation?: string;
  contestant?: string;
  hostJudge?: string;
  department?: string;
  studio?: string;
  vendor?: string;
  sponsor?: string;
  costType?: string;
}

export interface AuditLogEntry {
  id: string;
  companyId: string;
  projectId: string;
  userId: string;
  userName: string;
  userRole: string;
  actionType: string; // e.g. 'BUDGET_ITEM_UPDATED', 'PROJECT_CREATED', 'ROLE_OVERRIDE'
  moduleName: string; // e.g. 'BUDGET', 'FINANCE', 'CORE'
  entityType: string;
  entityId: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  ipAddress?: string;
  deviceId?: string;
  timestamp: string;
}

export interface ServerDocument {
  id: string;
  companyId: string;
  projectId: string;
  uploadedBy: string;
  moduleName: string;
  entityType: string;
  entityId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
  storageUrl: string;
  createdAt: string;
}

export interface DBLog {
  id: string;
  timestamp: string;
  action: string;
  sqlQuery?: string;
  status?: 'success' | 'warning' | 'info';
  details?: string;
  user?: string;
  ip?: string;
  module?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  workDesignation: string;
  dob?: string;
  contactNumber: string;
  email: string;
  houseStreet: string;
  pinCode: string;
  city: string;
  state: string;
  country: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserAssignmentNotification {
  id: string;
  assignedEmail: string;
  assignedName?: string;
  assignedRole: string;
  department?: string;
  accessType?: string;
  projectId: string;
  projectName: string;
  projectDescription?: string;
  totalBudget?: number;
  projectStatus?: string;
  startDate?: string;
  companyId: string;
  companyName: string;
  companyGstin?: string;
  companyCode?: string;
  companyAddress?: string;
  assignedBy: string;
  createdAt: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'AcceptedNotification' | 'DeclinedNotification';
  acceptedAt?: string;
  isViewed?: boolean;
  viewedAt?: string;
}

export interface ArchitectureStep {
  id: number;
  layer: 'Presentation' | 'Domain' | 'Data';
  component: string;
  details: string;
  codeSnippet: string;
}

// ==========================================
// PRODUCTION DSR (DAILY SHOOTING REPORT) TYPES
// ==========================================

export interface DSRLocationEntry {
  id?: string;
  locationName: string;
  address?: string;
  city?: string;
  state?: string;
  contactPerson?: string;
  contactNumber?: string;
  mapLink?: string;
  locationType: 'Studio' | 'Indoor' | 'Outdoor' | 'House' | 'Office' | 'Road' | 'Forest' | 'River' | 'Beach' | 'Palace' | 'School' | 'Hospital' | 'Other';
  isPrimary: boolean;
  startTime?: string;
  endTime?: string;
}

export interface DSRDepartmentCallTime {
  id: string;
  department: string;
  callTime: string;
  packupTime?: string;
  workingHours?: number;
  overtimeHours?: number;
  notes?: string;
}

export interface DSRCrewEntry {
  id: string;
  department: string;
  designation: string;
  plannedCount: number;
  presentCount: number;
  absentCount: number;
  extraCount: number;
  callTime?: string;
  releaseTime?: string;
  remarks?: string;
}

export interface DSREquipmentEntry {
  id: string;
  category: string;
  name: string;
  description?: string;
  plannedQty: number;
  actualQty: number;
  qtyPlanned?: number;
  qtyActual?: number;
  unit: string;
  vendor?: string;
  inTime?: string;
  outTime?: string;
  conditionIn?: string;
  conditionOut?: string;
  rate?: number;
  remarks?: string;
}

export interface DSRTransportEntry {
  id: string;
  category?: string; // Travels Car, Matador, Others, Custom
  vehicleType: string;
  vehicleNumber?: string;
  vendor?: string;
  driverName?: string;
  driverMobile?: string;
  department?: string;
  purpose?: string;
  plannedQty: number;
  actualQty: number;
  trips: number;
  startTime?: string;
  releaseTime?: string;
  openingKm: number;
  closingKm: number;
  totalKm: number;
  rateType: 'Per Day' | 'Per KM' | 'Per Trip';
  rate: number;
  toll: number;
  parking: number;
  extraCharges: number;
  totalCost: number;
  remarks?: string;
}

export interface DSRGensetEntry {
  id: string;
  name: string;
  capacity: string; // e.g. '125 KVA', '82.5 KVA'
  quantity: number;
  vendor?: string;
  startTime?: string;
  stopTime?: string;
  breakMinutes: number;
  runningHours: number;
  litresPerHour: number;
  openingFuel: number;
  fuelAdded: number;
  closingFuel: number;
  calculatedFuel: number;
  actualFuel: number;
  fuelVariance: number;
  fuelRatePerLitre: number;
  fuelCost: number;
  remarks?: string;
}

export interface DSRVanityEntry {
  id: string;
  type: string; // Artist Vanity, Director Vanity, Makeup Vanity, Costume Vanity, Common Vanity
  quantity: number;
  vehicleNumber?: string;
  vendor?: string;
  assignedTo?: string;
  startTime?: string;
  endTime?: string;
  rate: number;
  electricitySource?: string;
  gensetConnected?: boolean;
  remarks?: string;
}

export interface DSRFoodEntry {
  id?: string;
  category?: string;
  mealType: string;
  plannedCount: number;
  actualCount: number;
  vegCount: number;
  nonVegCount: number;
  specialMealCount?: number;
  artistCount?: number;
  crewCount?: number;
  driverCount?: number;
  guestCount?: number;
  vendor?: string;
  ratePerPlate: number;
  totalCost: number;
  deliveryTime?: string;
  remarks?: string;
}

export interface DSRGoodsEntry {
  id?: string;
  category?: string;
  itemName: string;
  plannedQty?: number;
  actualQty: number;
  vendor?: string;
  rate?: number;
  totalCost?: number;
  remarks?: string;
}

export interface DSRFootageEntry {
  id: string;
  cameraName: string; // Camera A, Camera B, Camera C, Drone, BTS
  cardOrReelNumber: string;
  durationMinutes: number;
  usableMinutes: number;
  fileSizeGb: number;
  backupStatus: 'Pending' | 'In Progress' | 'Completed' | 'Verified';
  remarks?: string;
}

export interface ProductionDSR {
  id: string;
  companyId?: string;
  projectId: string;
  scheduleName: string; // e.g. 'Schedule 01 — Kolkata', 'Schedule 02 — Bolpur'
  unitName?: string; // e.g. 'Unit 01 — Main Shoot', 'Unit 02 — Set Construction', 'AV Shoot Unit'
  dayNumber: number; // e.g. 1, 2, 3...
  dayCode: string; // e.g. 'Day 01', 'Day 02'
  shootingDate: string; // YYYY-MM-DD
  
  // Locations
  locations: DSRLocationEntry[];
  primaryLocationName?: string;
  
  // Timing
  callTime: string;
  shootStartTime?: string;
  mealBreakStart?: string;
  mealBreakEnd?: string;
  packupTime: string;
  packupDate?: string;
  totalWorkingHours: number;
  overtimeHours: number;
  departmentCallTimes?: DSRDepartmentCallTime[];
  
  // Footage
  recordedFootageMinutes: number;
  usableFootageMinutes: number;
  footageEntries: DSRFootageEntry[];
  
  // Crew
  totalPlannedCrew: number;
  totalPresentCrew: number;
  totalAbsentCrew: number;
  totalExtraCrew: number;
  crewEntries: DSRCrewEntry[];
  
  // Equipment
  totalEquipmentQty: number;
  equipmentEntries: DSREquipmentEntry[];
  goodsEntries?: DSRGoodsEntry[];
  
  // Transport
  totalVehicleQty: number;
  totalTransportCost: number;
  transportEntries: DSRTransportEntry[];
  
  // Gensets & Vanity
  totalGensetQty: number;
  totalVanityQty: number;
  gensetEntries: DSRGensetEntry[];
  vanityEntries: DSRVanityEntry[];
  
  // Fuel Summary
  calculatedFuelTotal: number;
  actualFuelTotal: number;
  fuelVarianceTotal: number;
  fuelRatePerLitre: number;
  fuelCostTotal: number;
  
  // Food Summary
  breakfastCount: number;
  lunchCount: number;
  snacksCount: number;
  dinnerCount: number;
  totalFoodCount: number;
  totalFoodCost: number;
  foodEntries: DSRFoodEntry[];
  
  // Notes & Attachments
  fuelVendor?: string;
  catererName?: string;
  transporterName?: string;
  productionNotes?: string;
  weatherNotes?: string;
  delayReason?: string;
  locationIssues?: string;
  safetyIncidents?: string;
  attachments?: { name: string; url?: string; type?: string }[];
  
  // Status & Versioning
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Locked' | 'Reopened' | 'Cancelled';
  recordVersion: number;
  createdBy: string;
  updatedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Season {
  id: string;
  projectId: string;
  companyId?: string;
  seasonName: string;
  seasonNumber: number;
  seasonCode: string;
  description?: string;
  expectedEpisodes?: number;
  expectedShootingDays?: number;
  startDate?: string;
  endDate?: string;
  telecastStartDate?: string;
  telecastEndDate?: string;
  episodeDuration?: string;
  channelOrPlatform?: string;
  budgetVersion?: string;
  status: 'Planning' | 'Pre-Production' | 'In Production' | 'Post-Production' | 'Delivering' | 'Completed' | 'Archived' | 'Cancelled';
  createdBy?: string;
  createdAt?: string;
}

export interface Episode {
  id: string;
  seasonId: string;
  projectId: string;
  companyId?: string;
  episodeNumber: number;
  episodeCode: string;
  title: string;
  theme?: string;
  description?: string;
  plannedDuration?: string;
  finalDuration?: string;
  shootDate?: string;
  telecastDate?: string;
  studioOrLocation?: string;
  host?: string;
  judges?: string;
  guests?: string;
  contestants?: string;
  taskOrChallenge?: string;
  sponsorIntegration?: string;
  status: 'Concept' | 'Script' | 'Planned' | 'Ready to Shoot' | 'Shooting' | 'In Post-Production' | 'Channel Review' | 'Approved' | 'Delivered' | 'Telecast' | 'Archived';
  createdBy?: string;
  createdAt?: string;
}

export interface ShootingDay {
  id: string;
  seasonId: string;
  projectId: string;
  companyId?: string;
  episodeIds: string[];
  dayNumber: number;
  dayCode?: string;
  date: string;
  location?: string;
  callTime?: string;
  shootStartTime?: string;
  packupTime?: string;
  workingHours?: number;
  overtime?: number;
  footageMinutes?: number;
  crewCount?: number;
  equipmentQuantity?: number;
  vehicleQuantity?: number;
  gensetQuantity?: number;
  vanityQuantity?: number;
  fuelUsedLitres?: number;
  fuelCost?: number;
  breakfastCount?: number;
  lunchCount?: number;
  snacksCount?: number;
  dinnerCount?: number;
  audienceCount?: number;
  contestantCount?: number;
  notes?: string;
  attachments?: { name: string; url?: string }[];
  approvalStatus: 'Draft' | 'Submitted' | 'Approved' | 'Locked';
  createdBy?: string;
  createdAt?: string;
}

// ==========================================
// VENDOR PROCUREMENT & COMPLIANCE TYPES
// ==========================================

export interface VendorQuotation {
  id: string;
  quoteNumber: string;
  vendorId: string;
  vendorName: string;
  department: string;
  scopeOfWork: string;
  quotedAmount: number;
  taxTerms: string;
  dateReceived: string;
  validUntil: string;
  status: 'Under Review' | 'Accepted' | 'Shortlisted' | 'Rejected';
  remarks?: string;
  attachmentName?: string;
}

export interface RateBenchmarkItem {
  id: string;
  itemName: string;
  department: string;
  unit: string;
  budgetRate: number;
  quotes: {
    vendorName: string;
    rate: number;
    notes?: string;
  }[];
  recommendedVendor: string;
}

export interface VendorDocumentItem {
  id: string;
  vendorId: string;
  vendorName: string;
  docType: 'Master Service Agreement' | 'GST Registration' | 'Cancelled Cheque' | 'MSME Udyam' | 'PAN Card' | 'Rate Card' | 'NDA';
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  expiryDate?: string;
  status: 'Verified' | 'Pending Audit' | 'Expired';
}

