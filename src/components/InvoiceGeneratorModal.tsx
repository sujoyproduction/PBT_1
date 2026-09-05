import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Printer,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Download,
  Building,
  User,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Eye,
  Edit3,
  Search,
  ChevronDown,
  UserCheck,
  Building2,
  RefreshCw,
  Hash
} from 'lucide-react';
import { PurchaseOrder, VendorInvoice, BudgetCategory, Project, InvoiceLineItem, Vendor } from '../types';
import { subscribeVendors } from '../services/firebaseService';
import { generateNextSerialInvoiceNumber } from '../utils/invoiceUtils';

interface InvoiceGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrders: PurchaseOrder[];
  vendors?: Vendor[];
  targetPoId?: string;
  categories: BudgetCategory[];
  projects: Project[];
  selectedProjectId?: string;
  onSaveInvoice: (invoice: VendorInvoice, targetPoId: string) => Promise<void> | void;
  onDeleteInvoice?: (invoice: VendorInvoice, targetPoId?: string) => Promise<void> | void;
  initialInvoice?: VendorInvoice | null;
  isReadOnly?: boolean;
}

interface FormLineItem {
  id: string;
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  subCategoryName: string;
  childCategoryId: string;
  childCategoryName: string;
  description: string;
  datesWorked: string;
  workingDays: number;
  unit: string;
  rate: number;
  hsnSacCode: string;
}

export default function InvoiceGeneratorModal({
  isOpen,
  onClose,
  purchaseOrders,
  vendors: propVendors,
  targetPoId: propTargetPoId = '',
  categories = [],
  projects = [],
  selectedProjectId = '',
  onSaveInvoice,
  onDeleteInvoice,
  initialInvoice = null,
  isReadOnly = false
}: InvoiceGeneratorModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [activeViewMode, setActiveViewMode] = useState<'split' | 'form' | 'document'>('split');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Target PO
  const [targetPoId, setTargetPoId] = useState<string>(propTargetPoId || (purchaseOrders[0]?.id ?? ''));

  // Vendor List State (from props, Firestore or fallback demo vendors)
  const [vendorList, setVendorList] = useState<Vendor[]>(() => {
    if (propVendors && propVendors.length > 0) return propVendors;
    return [];
  });

  useEffect(() => {
    if (propVendors && propVendors.length > 0) {
      setVendorList(propVendors);
      return;
    }
    const unsub = subscribeVendors((data) => {
      if (Array.isArray(data)) {
        setVendorList(data);
      } else {
        setVendorList([]);
      }
    });
    return () => unsub();
  }, [propVendors]);

  // Dropdown states for searchable vendor selector
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(() => {
    return (propVendors && propVendors.length > 0) ? propVendors[0] : null;
  });
  const [vendorToast, setVendorToast] = useState<string | null>(null);
  const vendorDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close vendor dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(e.target as Node)) {
        setIsVendorDropdownOpen(false);
      }
    };
    if (isVendorDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVendorDropdownOpen]);

  // Filtered vendors by search box query (search by name, designation, category, subcategory, pan)
  const filteredVendors = useMemo(() => {
    if (!vendorSearchQuery.trim()) return vendorList;
    const q = vendorSearchQuery.toLowerCase().trim();
    return vendorList.filter((v) => {
      return (
        v.vendorName.toLowerCase().includes(q) ||
        (v.designation && v.designation.toLowerCase().includes(q)) ||
        (v.category && v.category.toLowerCase().includes(q)) ||
        (v.subCategory && v.subCategory.toLowerCase().includes(q)) ||
        (v.contactPerson && v.contactPerson.toLowerCase().includes(q)) ||
        (v.pan && v.pan.toLowerCase().includes(q)) ||
        (v.phone && v.phone.includes(q))
      );
    });
  }, [vendorList, vendorSearchQuery]);

  // Vendor / Payee Details
  const [vendorName, setVendorName] = useState('SIMA GHOSH');
  const [vendorAddress, setVendorAddress] = useState('173 NASKARPARA RD, KOLKATA: 700 041');
  const [vendorPhone, setVendorPhone] = useState('9830123537');
  const [vendorEmail, setVendorEmail] = useState('sima.ghosh@productionmail.com');
  const [vendorPan, setVendorPan] = useState('AOXPG5365H');
  const [vendorGstin, setVendorGstin] = useState('');

  // Bill To (Production House)
  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  const [clientName, setClientName] = useState('SVF Entertainment Pvt. Ltd.');
  const [clientAddress, setClientAddress] = useState('Acropolis 18th Floor, 1858/1 Rajdanga Main Road, kolkata-700107');
  const [clientPhone, setClientPhone] = useState('+91 33 2441 0000');
  const [clientEmail, setClientEmail] = useState('accounts@svf.in');
  const [clientGstin, setClientGstin] = useState('19AADCV7250P1ZM');
  const [projectName, setProjectName] = useState('RANDHUNI NA KANDUNI (SONY NON FICTION)');

  // Invoice Meta
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('2026-09-04');
  const [dueDate, setDueDate] = useState('2026-09-19');

  // TDS Section
  const [tdsSection, setTdsSection] = useState('194C_OTHERS');

  // Taxes
  const [cgstRate, setCgstRate] = useState<number>(0);
  const [sgstRate, setSgstRate] = useState<number>(0);
  const [igstRate, setIgstRate] = useState<number>(0);

  // Payment & Bank Details
  const [beneficiaryName, setBeneficiaryName] = useState('SIMA GHOSH');
  const [hsnCode, setHsnCode] = useState('');
  const [bankName, setBankName] = useState('STATE BANK OF INDIA');
  const [bankBranch, setBankBranch] = useState('HARIDEVPUR');
  const [accountNumber, setAccountNumber] = useState('10292533337');
  const [ifscCode, setIfscCode] = useState('SBIN0011530');

  // Hierarchical Line Items
  const [lineItems, setLineItems] = useState<FormLineItem[]>([
    {
      id: 'item_1',
      categoryId: 'cat_hair_makeup',
      categoryName: 'Hair & Makeup',
      subCategoryId: 'sub_hair_styler',
      subCategoryName: 'Hair Styler Remuneration',
      childCategoryId: 'child_look_set',
      childCategoryName: 'Look Set',
      description: 'Hair Styler Remuneration: Look Set - 7,8, 28, 29 August 2026',
      datesWorked: 'Look Set - 7,8, 28, 29 August 2026',
      workingDays: 4,
      unit: 'Days',
      rate: 5000,
      hsnSacCode: '998319'
    },
    {
      id: 'item_2',
      categoryId: 'cat_hair_makeup',
      categoryName: 'Hair & Makeup',
      subCategoryId: 'sub_hair_styler',
      subCategoryName: 'Hair Styler Remuneration',
      childCategoryId: 'child_regular_shoot',
      childCategoryName: 'Shoot Days',
      description: '11,20,21, 24,25,27 AUGUST 2026',
      datesWorked: '11,20,21, 24,25,27 AUGUST 2026',
      workingDays: 6,
      unit: 'Days',
      rate: 7000,
      hsnSacCode: '998319'
    }
  ]);

  // Sync with initial invoice if viewing/editing an existing invoice, or auto-generate sequential number if creating new
  useEffect(() => {
    if (!isOpen) return;

    if (initialInvoice) {
      setInvoiceNumber(initialInvoice.invoiceNumber || '');
      setInvoiceDate(initialInvoice.invoiceDate || new Date().toISOString().substring(0, 10));
      setDueDate(initialInvoice.dueDate || '');
      setVendorName(initialInvoice.vendorName || '');
      setVendorAddress(initialInvoice.vendorAddress || '');
      setVendorPhone(initialInvoice.vendorPhone || '');
      setVendorEmail(initialInvoice.vendorEmail || '');
      setVendorGstin(initialInvoice.vendorGstin || '');
      setVendorPan(initialInvoice.vendorPan || initialInvoice.panNumber || '');
      setClientName(initialInvoice.clientName || 'SVF Entertainment Pvt. Ltd.');
      setClientAddress(initialInvoice.clientAddress || 'Acropolis 18th Floor, 1858/1 Rajdanga Main Road, kolkata-700107');
      setClientPhone(initialInvoice.clientPhone || '+91 33 2441 0000');
      setClientEmail(initialInvoice.clientEmail || 'accounts@svf.in');
      setClientGstin(initialInvoice.clientGstin || '19AADCV7250P1ZM');
      setProjectName(initialInvoice.projectName || currentProject?.name || 'RANDHUNI NA KANDUNI (SONY NON FICTION)');
      setCgstRate(initialInvoice.cgstRate || 0);
      setSgstRate(initialInvoice.sgstRate || 0);
      setIgstRate(initialInvoice.igstRate || 0);
      setBeneficiaryName(initialInvoice.beneficiaryName || initialInvoice.vendorName || '');
      setHsnCode(initialInvoice.hsnCode || '');
      setBankName(initialInvoice.bankName || '');
      setBankBranch(initialInvoice.bankBranch || '');
      setAccountNumber(initialInvoice.bankAccountNo || '');
      setIfscCode(initialInvoice.bankIfsc || '');
      setTdsSection(initialInvoice.tdsSection || '194C_OTHERS');

      if (initialInvoice.items && initialInvoice.items.length > 0) {
        setLineItems(
          initialInvoice.items.map((it, idx) => ({
            id: it.itemId || `it_${idx}`,
            categoryId: it.categoryId || '',
            categoryName: it.categoryName || 'Production',
            subCategoryId: it.subCategoryId || '',
            subCategoryName: it.subCategoryName || '',
            childCategoryId: it.childCategoryId || '',
            childCategoryName: it.childCategoryName || '',
            description: it.itemDescription,
            datesWorked: it.datesWorked || it.itemDescription,
            workingDays: it.invoicedQty || 1,
            unit: it.unit || 'Days',
            rate: it.unitRate || 0,
            hsnSacCode: it.hsnSacCode || ''
          }))
        );
      }
      setTargetPoId(initialInvoice.poId || '');
      setActiveViewMode('document');
    } else {
      // New Invoice: Auto-generate the next sequential serial invoice number
      const nextSerial = generateNextSerialInvoiceNumber(purchaseOrders);
      setInvoiceNumber(nextSerial);
      setInvoiceDate(new Date().toISOString().substring(0, 10));
      const due = new Date();
      due.setDate(due.getDate() + 15);
      setDueDate(due.toISOString().substring(0, 10));
      setClientPhone('+91 33 2441 0000');
      setClientEmail('accounts@svf.in');
      if (currentProject?.name) {
        setProjectName(currentProject.name);
      }
      setActiveViewMode('form');
    }
  }, [isOpen, initialInvoice, currentProject, purchaseOrders]);

  // Handler when a vendor is selected from the searchable dropdown
  const handleSelectVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setVendorName(vendor.vendorName);
    setBeneficiaryName(vendor.vendorName);
    setVendorAddress(vendor.address || '');
    setVendorPhone(vendor.phone || '');
    if (vendor.email) setVendorEmail(vendor.email);
    setVendorPan((vendor.pan || vendor.panNumber || '').toUpperCase());
    setVendorGstin((vendor.gstin || '').toUpperCase());
    setBankName(vendor.bankName || '');
    setBankBranch(vendor.bankBranch || 'Main Branch');
    setAccountNumber(vendor.accountNumber || '');
    setIfscCode((vendor.ifscCode || '').toUpperCase());

    // Check if there is a matching PO for this vendor
    const matchingPo = purchaseOrders.find(
      (p) =>
        p.vendorName.toLowerCase().trim() === vendor.vendorName.toLowerCase().trim() ||
        (p.vendorPan && vendor.pan && p.vendorPan.toUpperCase().trim() === vendor.pan.toUpperCase().trim())
    );

    if (matchingPo) {
      setTargetPoId(matchingPo.id);
      if (matchingPo.items && matchingPo.items.length > 0) {
        setLineItems(
          matchingPo.items.map((it, idx) => ({
            id: `po_item_${idx}`,
            categoryId: it.categoryId || '',
            categoryName: it.categoryName || matchingPo.department || 'Production',
            subCategoryId: it.subCategoryId || '',
            subCategoryName: it.subCategoryName || it.itemDescription,
            childCategoryId: it.childCategoryId || '',
            childCategoryName: it.budgetItemName || it.itemDescription,
            description: it.itemDescription,
            datesWorked: `${it.orderQty} ${it.unit} as per PO agreement`,
            workingDays: it.orderQty,
            unit: it.unit || 'Days',
            rate: it.unitRate,
            hsnSacCode: '998319'
          }))
        );
      }
    } else {
      setTargetPoId('');
      // Auto prefill line item from vendor budget category if available
      if (vendor.category) {
        const matchedCat = categories.find(
          (c) =>
            c.name.toLowerCase().includes(vendor.category.toLowerCase()) ||
            vendor.category.toLowerCase().includes(c.name.toLowerCase())
        );
        if (matchedCat) {
          const matchedSub =
            matchedCat.subCategories?.find((s) =>
              vendor.subCategory ? s.name.toLowerCase().includes(vendor.subCategory.toLowerCase()) : true
            ) || matchedCat.subCategories?.[0];

          const matchedChild =
            matchedSub?.childCategories?.find((ch) =>
              vendor.childCategory ? ch.name.toLowerCase().includes(vendor.childCategory.toLowerCase()) : true
            ) || matchedSub?.childCategories?.[0];

          setLineItems([
            {
              id: `line_${Date.now()}`,
              categoryId: matchedCat.id,
              categoryName: matchedCat.name,
              subCategoryId: matchedSub?.id || '',
              subCategoryName: matchedSub?.name || vendor.subCategory || 'Remuneration & Services',
              childCategoryId: matchedChild?.id || '',
              childCategoryName:
                matchedChild?.name ||
                vendor.childCategory ||
                (vendor.designation ? `${vendor.designation} Charges` : 'Service Delivery'),
              description: `${vendor.vendorName} - ${vendor.designation || 'Service Delivery'}`,
              datesWorked: 'Current Schedule',
              workingDays: 1,
              unit: 'Days',
              rate: matchedChild?.rate || 5000,
              hsnSacCode: '998319'
            }
          ]);
        }
      }
    }

    setVendorToast(`Loaded details for ${vendor.vendorName} (${vendor.designation || 'Vendor'}) automatically.`);
    setTimeout(() => setVendorToast(null), 4500);
    setIsVendorDropdownOpen(false);
    setVendorSearchQuery('');
  };

  // If a Target PO is selected and we are in creation mode, prefill defaults
  const handlePoChange = (selectedPoId: string) => {
    setTargetPoId(selectedPoId);
    if (!selectedPoId) return;

    const po = purchaseOrders.find((p) => p.id === selectedPoId);
    if (!po) return;

    setVendorName(po.vendorName);
    if (po.vendorGstin) setVendorGstin(po.vendorGstin);
    if (po.vendorPan) setVendorPan(po.vendorPan);
    setBeneficiaryName(po.vendorName);

    // Look up vendor in vendorList to populate address, phone, and bank details automatically
    const matchedVendor = vendorList.find(
      (v) =>
        v.vendorName.toLowerCase().trim() === po.vendorName.toLowerCase().trim() ||
        (v.pan && po.vendorPan && v.pan.toUpperCase().trim() === po.vendorPan.toUpperCase().trim())
    );

    if (matchedVendor) {
      setSelectedVendor(matchedVendor);
      if (matchedVendor.address) setVendorAddress(matchedVendor.address);
      if (matchedVendor.phone) setVendorPhone(matchedVendor.phone);
      if (matchedVendor.pan) setVendorPan(matchedVendor.pan);
      if (matchedVendor.gstin) setVendorGstin(matchedVendor.gstin);
      if (matchedVendor.bankName) setBankName(matchedVendor.bankName);
      if (matchedVendor.bankBranch) setBankBranch(matchedVendor.bankBranch);
      if (matchedVendor.accountNumber) setAccountNumber(matchedVendor.accountNumber);
      if (matchedVendor.ifscCode) setIfscCode(matchedVendor.ifscCode);
      setVendorToast(
        `Loaded vendor details for ${matchedVendor.vendorName} (${matchedVendor.designation || matchedVendor.category || 'Vendor'}) automatically.`
      );
      setTimeout(() => setVendorToast(null), 4500);
    }

    // Populate line items from PO items
    if (po.items && po.items.length > 0) {
      const convertedItems: FormLineItem[] = po.items.map((it, idx) => ({
        id: `po_item_${idx}`,
        categoryId: it.categoryId || '',
        categoryName: it.categoryName || po.department || 'Production',
        subCategoryId: it.subCategoryId || '',
        subCategoryName: it.subCategoryName || it.itemDescription,
        childCategoryId: it.childCategoryId || '',
        childCategoryName: it.budgetItemName || it.itemDescription,
        description: it.itemDescription,
        datesWorked: `${it.orderQty} ${it.unit} as per PO agreement`,
        workingDays: it.orderQty,
        unit: it.unit || 'Days',
        rate: it.unitRate,
        hsnSacCode: '998319'
      }));
      setLineItems(convertedItems);
    }
  };

  // Add a new row to the line items
  const handleAddLineItem = () => {
    const firstCat = categories[0];
    const firstSub = firstCat?.subCategories?.[0];
    const firstChild = firstSub?.childCategories?.[0];

    const newItem: FormLineItem = {
      id: `item_${Date.now()}`,
      categoryId: firstCat?.id || 'cat_default',
      categoryName: firstCat?.name || 'Production Personnel',
      subCategoryId: firstSub?.id || 'sub_default',
      subCategoryName: firstSub?.name || 'Key Crew Remuneration',
      childCategoryId: firstChild?.id || 'child_default',
      childCategoryName: firstChild?.name || 'Daily Working Days',
      description: `${firstSub?.name || 'Crew'}: Working Shifts`,
      datesWorked: 'Shoot Dates',
      workingDays: 1,
      unit: 'Days',
      rate: 5000,
      hsnSacCode: '998319'
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((it) => it.id !== id));
  };

  const handleUpdateLineItem = (id: string, updates: Partial<FormLineItem>) => {
    setLineItems(
      lineItems.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, ...updates };

        // If category changed, update categoryName and reset subCategory
        if (updates.categoryId && updates.categoryId !== it.categoryId) {
          const cat = categories.find((c) => c.id === updates.categoryId);
          if (cat) {
            updated.categoryName = cat.name;
            const sub = cat.subCategories?.[0];
            updated.subCategoryId = sub?.id || '';
            updated.subCategoryName = sub?.name || '';
            const child = sub?.childCategories?.[0];
            updated.childCategoryId = child?.id || '';
            updated.childCategoryName = child?.name || '';
            updated.description = `${sub?.name || cat.name}: ${child?.name || 'Working Days'}`;
          }
        }

        // If subCategory changed, update subCategoryName and reset childCategory
        if (updates.subCategoryId && updates.subCategoryId !== it.subCategoryId) {
          const cat = categories.find((c) => c.id === updated.categoryId);
          const sub = cat?.subCategories?.find((s) => s.id === updates.subCategoryId);
          if (sub) {
            updated.subCategoryName = sub.name;
            const child = sub.childCategories?.[0];
            updated.childCategoryId = child?.id || '';
            updated.childCategoryName = child?.name || '';
            updated.description = `${sub.name}: ${child?.name || 'Working Days'}`;
          }
        }

        // If childCategory changed, update childCategoryName
        if (updates.childCategoryId && updates.childCategoryId !== it.childCategoryId) {
          const cat = categories.find((c) => c.id === updated.categoryId);
          const sub = cat?.subCategories?.find((s) => s.id === updated.subCategoryId);
          const child = sub?.childCategories?.find((ch) => ch.id === updates.childCategoryId);
          if (child) {
            updated.childCategoryName = child.name;
            updated.description = `${updated.subCategoryName || cat?.name || 'Item'}: ${child.name}`;
          }
        }

        return updated;
      })
    );
  };

  // Calculations
  const calculations = useMemo(() => {
    let baseTotal = 0;
    lineItems.forEach((it) => {
      baseTotal += (it.workingDays || 0) * (it.rate || 0);
    });

    const cgstAmt = (baseTotal * (cgstRate || 0)) / 100;
    const sgstAmt = (baseTotal * (sgstRate || 0)) / 100;
    const igstAmt = (baseTotal * (igstRate || 0)) / 100;
    const totalGst = cgstAmt + sgstAmt + igstAmt;

    const grandTotal = baseTotal + totalGst;

    // TDS calculation
    let tdsPercent = 0;
    if (tdsSection === '194C_OTHERS') tdsPercent = 2;
    else if (tdsSection === '194J_TECH') tdsPercent = 2;
    else if (tdsSection === '194J_PROF') tdsPercent = 10;
    else if (tdsSection === '194I_PLANT') tdsPercent = 2;

    const tdsAmount = (baseTotal * tdsPercent) / 100;
    const netPayable = grandTotal - tdsAmount;

    return {
      baseTotal,
      cgstAmt,
      sgstAmt,
      igstAmt,
      totalGst,
      grandTotal,
      tdsPercent,
      tdsAmount,
      netPayable
    };
  }, [lineItems, cgstRate, sgstRate, igstRate, tdsSection]);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Submission handler
  const handleGenerateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim() || !invoiceNumber.trim()) return;

    setIsSubmitting(true);
    try {
      const targetPo = purchaseOrders.find((p) => p.id === targetPoId);

      const formattedLineItems: InvoiceLineItem[] = lineItems.map((it, idx) => ({
        itemId: `inv_item_${Date.now()}_${idx}`,
        itemDescription: it.description,
        categoryId: it.categoryId,
        categoryName: it.categoryName,
        subCategoryId: it.subCategoryId,
        subCategoryName: it.subCategoryName,
        childCategoryId: it.childCategoryId,
        childCategoryName: it.childCategoryName,
        datesWorked: it.datesWorked,
        invoicedQty: it.workingDays,
        unit: it.unit,
        unitRate: it.rate,
        totalAmount: (it.workingDays || 0) * (it.rate || 0),
        hsnSacCode: it.hsnSacCode || '998319'
      }));

      // 3-Way Match Verification against PO if PO is linked
      let matchStatus: VendorInvoice['matchStatus'] = 'MATCHED';
      let approvalStatus: VendorInvoice['approvalStatus'] = 'Approved';
      const discrepancyNotes: string[] = [];
      let varianceAmt = 0;

      if (targetPo) {
        if (!targetPo.grns || targetPo.grns.length === 0) {
          matchStatus = 'NO_GRN';
          approvalStatus = 'Pending';
          discrepancyNotes.push('No Goods Receipt Note (GRN) / Delivery Challan logged yet.');
        } else {
          // Check rates and quantities against PO
          lineItems.forEach((it) => {
            const matchedPoItem = targetPo.items.find(
              (pIt) =>
                pIt.id === it.id ||
                pIt.itemDescription.toLowerCase() === it.description.toLowerCase() ||
                (pIt.subCategoryName && pIt.subCategoryName.toLowerCase() === it.subCategoryName.toLowerCase())
            );

            if (matchedPoItem) {
              if (it.rate > matchedPoItem.unitRate) {
                matchStatus = 'PRICE_MISMATCH';
                approvalStatus = 'Disputed';
                const diff = (it.rate - matchedPoItem.unitRate) * it.workingDays;
                varianceAmt += diff;
                discrepancyNotes.push(
                  `Price escalation on ${it.subCategoryName || it.description}: Billed @ ₹${it.rate} vs Approved PO ₹${matchedPoItem.unitRate}`
                );
              }
              const totalRec = matchedPoItem.receivedQty || 0;
              if (it.workingDays > totalRec) {
                matchStatus = 'QTY_MISMATCH';
                approvalStatus = 'Disputed';
                const excess = it.workingDays - totalRec;
                varianceAmt += excess * matchedPoItem.unitRate;
                discrepancyNotes.push(
                  `Quantity overbilled on ${it.description}: Billed ${it.workingDays} ${it.unit} (Only ${totalRec} verified on GRN)`
                );
              }
            }
          });
        }
      }

      const newInvoice: VendorInvoice = {
        id: initialInvoice?.id || `inv_${Date.now()}`,
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate: invoiceDate,
        dueDate: dueDate || invoiceDate,
        poId: targetPo?.id || 'direct_invoice',
        poNumber: targetPo?.poNumber || 'DIRECT-BILL',
        vendorId: targetPo?.vendorId || 'v_direct',
        vendorName: vendorName.trim(),
        vendorAddress: vendorAddress.trim(),
        vendorPhone: vendorPhone.trim(),
        vendorEmail: vendorEmail.trim(),
        vendorGstin: vendorGstin.trim(),
        vendorPan: vendorPan.trim(),
        clientName: clientName.trim(),
        clientAddress: clientAddress.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        clientGstin: clientGstin.trim(),
        projectName: projectName.trim(),
        items: formattedLineItems,
        baseAmount: calculations.baseTotal,
        cgstRate: cgstRate,
        cgstAmount: calculations.cgstAmt,
        sgstRate: sgstRate,
        sgstAmount: calculations.sgstAmt,
        igstRate: igstRate,
        igstAmount: calculations.igstAmt,
        gstRate: (cgstRate || 0) + (sgstRate || 0) + (igstRate || 0),
        gstAmount: calculations.totalGst,
        totalAmount: calculations.grandTotal,
        tdsSection: tdsSection,
        tdsRate: calculations.tdsPercent,
        tdsAmount: calculations.tdsAmount,
        netPayable: calculations.netPayable,
        beneficiaryName: beneficiaryName.trim(),
        hsnCode: hsnCode.trim(),
        panNumber: vendorPan.trim(),
        bankName: bankName.trim(),
        bankBranch: bankBranch.trim(),
        bankAccountNo: accountNumber.trim(),
        bankIfsc: ifscCode.trim(),
        matchStatus: matchStatus,
        varianceAmount: varianceAmt,
        discrepancyNote:
          discrepancyNotes.length > 0
            ? discrepancyNotes.join(' | ')
            : 'Exact match verified as per budget categories and rates.',
        approvalStatus: approvalStatus,
        createdAt: initialInvoice?.createdAt || new Date().toISOString()
      };

      await onSaveInvoice(newInvoice, targetPo?.id || targetPoId);
      onClose();
    } catch (err) {
      console.error('Error generating and saving invoice:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group items by subcategory for the printable invoice view
  const groupedSubcategories = useMemo(() => {
    const groups: { [key: string]: FormLineItem[] } = {};
    lineItems.forEach((it) => {
      const key = it.subCategoryName || 'Services & Remuneration';
      if (!groups[key]) groups[key] = [];
      groups[key].push(it);
    });
    return groups;
  }, [lineItems]);

  // Format date helper: "04 - Sep - 26"
  const formatDocumentDate = (dStr: string) => {
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      const day = String(d.getDate()).padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[d.getMonth()];
      const year = String(d.getFullYear()).slice(-2);
      return `${day} - ${month} - ${year}`;
    } catch {
      return dStr;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-7xl h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* TOP BAR */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {isReadOnly ? 'Vendor Tax Invoice Viewer' : 'Generate & Record Vendor Invoice'}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800 text-purple-300 font-mono font-bold">
                  {invoiceNumber || 'NEW DRAFT'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Hierarchical budget categorization (Category &rarr; Subcategory &rarr; Child Category) &bull; 3-Way Audit synchronization
              </p>
            </div>
          </div>

          {/* Center: View Switcher */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveViewMode('form')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeViewMode === 'form' ? 'bg-purple-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Details Form</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode('split')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeViewMode === 'split' ? 'bg-purple-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode('document')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeViewMode === 'document' ? 'bg-purple-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Invoice Sheet (Print)</span>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {initialInvoice && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveViewMode('form')}
                  className="h-8 px-2.5 bg-blue-950 hover:bg-blue-900 text-blue-200 border border-blue-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Edit Invoice Details"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                {onDeleteInvoice && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to permanently delete invoice ${initialInvoice.invoiceNumber}?`)) {
                        onDeleteInvoice(initialInvoice, targetPoId);
                        onClose();
                      }
                    }}
                    className="h-8 px-2.5 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                    title="Delete Invoice"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="h-8 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL MAIN CONTENT */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT: FORM CONFIGURATOR */}
          {(activeViewMode === 'split' || activeViewMode === 'form') && (
            <div
              className={`h-full overflow-y-auto p-4 space-y-4 text-xs custom-scrollbar ${
                activeViewMode === 'split' ? 'lg:col-span-6 border-r border-slate-800' : 'lg:col-span-12 max-w-4xl mx-auto'
              }`}
            >
              <form id="invoice-generate-form" onSubmit={handleGenerateAndSave} className="space-y-4">
                {/* 1. Target Purchase Order Selection & Info */}
                <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-purple-400" /> Target Purchase Order &amp; Audit Reference *
                    </label>
                    <span className="text-[10px] text-purple-300">Links to 3-Way Audit Engine</span>
                  </div>
                  <select
                    value={targetPoId}
                    onChange={(e) => handlePoChange(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:border-purple-500 outline-hidden font-medium"
                  >
                    <option value="">-- Direct Vendor Bill (No Pre-Issued PO) --</option>
                    {purchaseOrders.map((p) => {
                      const vObj = vendorList.find(
                        (v) => v.vendorName.toLowerCase().trim() === p.vendorName.toLowerCase().trim()
                      );
                      const designation = vObj?.designation || p.department;
                      return (
                        <option key={p.id} value={p.id}>
                          {p.poNumber} &bull; {p.vendorName} ({designation} &bull; ₹{p.grandTotal.toLocaleString()})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 2. Top Parties: Vendor Details & Bill To */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Vendor / Payee Box */}
                  <div className="p-3.5 bg-slate-800/30 rounded-xl border border-slate-700/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Vendor / Beneficiary (Payee)
                      </div>
                      <span className="text-[10px] text-slate-400">Searchable Directory</span>
                    </div>

                    {/* Auto-Fill Toast Notification */}
                    {vendorToast && (
                      <div className="p-2 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-emerald-300 text-[10.5px] flex items-center justify-between gap-1.5 animate-in fade-in">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{vendorToast}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setVendorToast(null)}
                          className="text-emerald-400 hover:text-emerald-200 p-0.5 shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Searchable Vendor Dropdown with Name and Designation */}
                    <div className="relative" ref={vendorDropdownRef}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-slate-300 font-semibold flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-emerald-400" /> Select Registered Vendor (Name &amp; Designation) *
                        </label>
                        <span className="text-[9.5px] text-emerald-400 font-medium flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" /> Auto-fills all details
                        </span>
                      </div>

                      {/* Dropdown Trigger Button */}
                      <button
                        type="button"
                        id="vendor-select-dropdown-button"
                        disabled={isReadOnly}
                        onClick={() => setIsVendorDropdownOpen(!isVendorDropdownOpen)}
                        className={`w-full min-h-[36px] px-2.5 py-1.5 bg-slate-800/90 border rounded-lg text-left text-xs flex items-center justify-between transition-all cursor-pointer ${
                          isVendorDropdownOpen
                            ? 'border-emerald-500 ring-1 ring-emerald-500/40'
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[10px] shrink-0 border border-emerald-500/30">
                            {vendorName ? vendorName.charAt(0).toUpperCase() : 'V'}
                          </span>
                          <div className="truncate flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white text-xs">{vendorName || 'Select Vendor...'}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-emerald-300 border border-emerald-500/30 font-medium">
                              {selectedVendor?.designation || (selectedVendor ? selectedVendor.category : 'Vendor')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                          {selectedVendor && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono">
                              Loaded
                            </span>
                          )}
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-150 ${
                              isVendorDropdownOpen ? 'rotate-180 text-emerald-400' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {/* Dropdown Menu with Search Box */}
                      {isVendorDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                          {/* Search Box */}
                          <div className="p-2 border-b border-slate-800 bg-slate-950/95 sticky top-0 z-10">
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-emerald-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                autoFocus
                                id="vendor-search-filter-input"
                                value={vendorSearchQuery}
                                onChange={(e) => setVendorSearchQuery(e.target.value)}
                                placeholder="Search by vendor name or designation..."
                                className="w-full h-8 pl-8 pr-7 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                              />
                              {vendorSearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => setVendorSearchQuery('')}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1.5">
                              <span>{filteredVendors.length} vendor(s) found</span>
                              <span className="text-emerald-300">Displays Name &amp; Designation</span>
                            </div>
                          </div>

                          {/* Vendor List Items */}
                          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
                            {filteredVendors.length === 0 ? (
                              <div className="p-4 text-center text-slate-400 text-xs">
                                <p>No vendor found matching "{vendorSearchQuery}"</p>
                                <p className="text-[10px] text-slate-500 mt-1">You can type details manually below</p>
                              </div>
                            ) : (
                              filteredVendors.map((v) => {
                                const isSelected =
                                  selectedVendor?.id === v.id ||
                                  vendorName.toLowerCase().trim() === v.vendorName.toLowerCase().trim();
                                const designation = v.designation || v.subCategory || v.category || 'Vendor';
                                return (
                                  <div
                                    key={v.id}
                                    id={`vendor-option-${v.id}`}
                                    onClick={() => handleSelectVendor(v)}
                                    className={`p-2.5 hover:bg-slate-800/90 cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                                      isSelected ? 'bg-emerald-950/40 border-l-2 border-emerald-500' : ''
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-white text-xs">{v.vendorName}</span>
                                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 shrink-0">
                                          {designation}
                                        </span>
                                        {v.status && (
                                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                            {v.status}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 truncate">
                                        <span>Dept: {v.category}</span>
                                        {v.phone && <span>• Ph: {v.phone}</span>}
                                        {v.pan && <span>• PAN: {v.pan}</span>}
                                        {v.bankName && <span>• Bank: {v.bankName}</span>}
                                      </div>
                                    </div>
                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Footer info */}
                          <div className="p-2 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">Click to automatically populate all fields</span>
                            <button
                              type="button"
                              onClick={() => setIsVendorDropdownOpen(false)}
                              className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Payee Name *</label>
                      <input
                        type="text"
                        required
                        disabled={isReadOnly}
                        value={vendorName}
                        onChange={(e) => {
                          setVendorName(e.target.value);
                          if (!beneficiaryName) setBeneficiaryName(e.target.value);
                        }}
                        placeholder="e.g. SIMA GHOSH"
                        className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Address *</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={vendorAddress}
                        onChange={(e) => setVendorAddress(e.target.value)}
                        placeholder="e.g. 173 NASKARPARA RD, KOLKATA: 700 041"
                        className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Phone Number</label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={vendorPhone}
                          onChange={(e) => setVendorPhone(e.target.value)}
                          placeholder="e.g. 9830123537"
                          className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">E-Mail</label>
                        <input
                          type="email"
                          disabled={isReadOnly}
                          value={vendorEmail}
                          onChange={(e) => setVendorEmail(e.target.value)}
                          placeholder="e.g. sima.ghosh@productionmail.com"
                          className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">PAN Number</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={vendorPan}
                        onChange={(e) => setVendorPan(e.target.value.toUpperCase())}
                        placeholder="e.g. AOXPG5365H"
                        className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Vendor GSTIN (if registered)</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={vendorGstin}
                        onChange={(e) => setVendorGstin(e.target.value.toUpperCase())}
                        placeholder="e.g. 19ABCDE1234F1Z5"
                        className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono uppercase"
                      />
                    </div>
                  </div>

                  {/* Bill To (Production House) */}
                  <div className="p-3.5 bg-slate-800/30 rounded-xl border border-slate-700/60 space-y-2">
                    <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" /> Billed To (Production House)
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Company Legal Name *</label>
                      <input
                        type="text"
                        required
                        disabled={isReadOnly}
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. SVF Entertainment Pvt. Ltd."
                        className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Company Address</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={clientAddress}
                        onChange={(e) => setClientAddress(e.target.value)}
                        placeholder="Acropolis 18th Floor, 1858/1 Rajdanga Main Road, kolkata-700107"
                        className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Phone Number</label>
                        <input
                          type="tel"
                          disabled={isReadOnly}
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="e.g. +91 33 2441 0000"
                          className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">E Mail</label>
                        <input
                          type="email"
                          disabled={isReadOnly}
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="e.g. accounts@svf.in"
                          className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Company GSTIN</label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={clientGstin}
                          onChange={(e) => setClientGstin(e.target.value.toUpperCase())}
                          placeholder="19AADCV7250P1ZM"
                          className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Project Name</label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          placeholder="e.g. RANDHUNI NA KANDUNI"
                          className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Invoice Meta (Number, Date, Due Date, TDS) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-800/30 rounded-xl border border-slate-700/60">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1">
                        <Hash className="w-3 h-3 text-purple-400" />
                        <span>Invoice No *</span>
                      </label>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => setInvoiceNumber(generateNextSerialInvoiceNumber(purchaseOrders))}
                          className="text-[9.5px] font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Generate next sequential serial invoice number"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Next Serial</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      disabled={isReadOnly}
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="e.g. INV/2026/090"
                      className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono font-bold focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 uppercase block mb-1">Invoice Date *</label>
                    <input
                      type="date"
                      required
                      disabled={isReadOnly}
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 uppercase block mb-1">TDS Section</label>
                    <select
                      value={tdsSection}
                      disabled={isReadOnly}
                      onChange={(e) => setTdsSection(e.target.value)}
                      className="w-full h-8 px-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      <option value="194C_OTHERS">194C - Contractor (2%)</option>
                      <option value="194J_TECH">194J - Tech Services (2%)</option>
                      <option value="194J_PROF">194J - Professional (10%)</option>
                      <option value="194I_PLANT">194I - Equipment Rental (2%)</option>
                      <option value="NONE">None / Exempt (0%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 uppercase block mb-1">Due Date</label>
                    <input
                      type="date"
                      disabled={isReadOnly}
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>

                {/* 4. BUDGET CATEGORIES & LINE ITEMS SECTION */}
                <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-400" /> Line Items (Category &bull; Sub Category &bull; Child Category)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Specify working days/shifts, rates, and category hierarchy for remuneration or vendor delivery
                      </p>
                    </div>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={handleAddLineItem}
                        className="h-7 px-2.5 bg-purple-600 hover:bg-purple-500 active:scale-98 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Line Item</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {lineItems.map((item, index) => {
                      const currentCat = categories.find((c) => c.id === item.categoryId);
                      const currentSubs = currentCat?.subCategories || [];
                      const currentSub = currentSubs.find((s) => s.id === item.subCategoryId);
                      const currentChildren = currentSub?.childCategories || [];

                      return (
                        <div
                          key={item.id}
                          className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                        >
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                            <span className="text-[11px] font-bold text-purple-300 font-mono flex items-center gap-1">
                              <span>#{index + 1}</span>
                              <span className="text-slate-400">&bull;</span>
                              <span className="text-slate-200">{item.subCategoryName || 'Particulars'}</span>
                            </span>
                            {!isReadOnly && lineItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(item.id)}
                                className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                                title="Remove line item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Category Selector Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {/* 1. Category */}
                            <div>
                              <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Budget Category</label>
                              <select
                                value={item.categoryId}
                                disabled={isReadOnly}
                                onChange={(e) => handleUpdateLineItem(item.id, { categoryId: e.target.value })}
                                className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-[11px] text-white"
                              >
                                {categories.length > 0 ? (
                                  categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </option>
                                  ))
                                ) : (
                                  <>
                                    <option value="cat_hair_makeup">Hair &amp; Makeup</option>
                                    <option value="cat_camera">Camera &amp; Electrical</option>
                                    <option value="cat_costume">Costume &amp; Wardrobe</option>
                                    <option value="cat_art">Art &amp; Production Design</option>
                                    <option value="cat_direction">Direction &amp; Talent</option>
                                  </>
                                )}
                              </select>
                            </div>

                            {/* 2. Sub Category */}
                            <div>
                              <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Sub Category</label>
                              {currentSubs.length > 0 ? (
                                <select
                                  value={item.subCategoryId}
                                  disabled={isReadOnly}
                                  onChange={(e) => handleUpdateLineItem(item.id, { subCategoryId: e.target.value })}
                                  className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-[11px] text-white font-medium"
                                >
                                  {currentSubs.map((sub) => (
                                    <option key={sub.id} value={sub.id}>
                                      {sub.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  disabled={isReadOnly}
                                  value={item.subCategoryName}
                                  onChange={(e) => handleUpdateLineItem(item.id, { subCategoryName: e.target.value })}
                                  placeholder="e.g. Hair Styler Remuneration"
                                  className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-[11px] text-white"
                                />
                              )}
                            </div>

                            {/* 3. Child Category */}
                            <div>
                              <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Child Category</label>
                              {currentChildren.length > 0 ? (
                                <select
                                  value={item.childCategoryId}
                                  disabled={isReadOnly}
                                  onChange={(e) => handleUpdateLineItem(item.id, { childCategoryId: e.target.value })}
                                  className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-[11px] text-white"
                                >
                                  {currentChildren.map((ch) => (
                                    <option key={ch.id} value={ch.id}>
                                      {ch.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  disabled={isReadOnly}
                                  value={item.childCategoryName}
                                  onChange={(e) => handleUpdateLineItem(item.id, { childCategoryName: e.target.value })}
                                  placeholder="e.g. Look Set / Shoot Days"
                                  className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-[11px] text-white"
                                />
                              )}
                            </div>
                          </div>

                          {/* Description & Rate Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                            <div className="sm:col-span-6">
                              <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                                Invoice Description / Dates Worked *
                              </label>
                              <input
                                type="text"
                                required
                                disabled={isReadOnly}
                                value={item.description}
                                onChange={(e) => handleUpdateLineItem(item.id, { description: e.target.value })}
                                placeholder="e.g. Look Set - 7,8, 28, 29 August 2026"
                                className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Working Days</label>
                              <input
                                type="number"
                                min={0.5}
                                step={0.5}
                                required
                                disabled={isReadOnly}
                                value={item.workingDays}
                                onChange={(e) => handleUpdateLineItem(item.id, { workingDays: parseFloat(e.target.value) || 0 })}
                                className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono text-center font-bold"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Rate (₹)</label>
                              <input
                                type="number"
                                min={0}
                                required
                                disabled={isReadOnly}
                                value={item.rate}
                                onChange={(e) => handleUpdateLineItem(item.id, { rate: parseFloat(e.target.value) || 0 })}
                                className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono text-right font-bold"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Amount (₹)</label>
                              <div className="w-full h-7 px-2 bg-slate-950/80 border border-slate-800 rounded text-xs text-emerald-400 font-mono font-extrabold flex items-center justify-end">
                                ₹{((item.workingDays || 0) * (item.rate || 0)).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Taxes Sub-Section */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      GST Taxes (Intra-State CGST/SGST or Inter-State IGST)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">CGST (%)</label>
                        <select
                          value={cgstRate}
                          disabled={isReadOnly}
                          onChange={(e) => setCgstRate(parseFloat(e.target.value) || 0)}
                          className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                        >
                          <option value={0}>0% (Exempt)</option>
                          <option value={2.5}>2.5%</option>
                          <option value={6}>6%</option>
                          <option value={9}>9%</option>
                          <option value={14}>14%</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">SGST (%)</label>
                        <select
                          value={sgstRate}
                          disabled={isReadOnly}
                          onChange={(e) => setSgstRate(parseFloat(e.target.value) || 0)}
                          className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                        >
                          <option value={0}>0% (Exempt)</option>
                          <option value={2.5}>2.5%</option>
                          <option value={6}>6%</option>
                          <option value={9}>9%</option>
                          <option value={14}>14%</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">IGST (%)</label>
                        <select
                          value={igstRate}
                          disabled={isReadOnly}
                          onChange={(e) => setIgstRate(parseFloat(e.target.value) || 0)}
                          className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                        >
                          <option value={0}>0% (None)</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Beneficiary & Bank Details */}
                <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-2.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-emerald-400" /> Beneficiary Payment &amp; Bank Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Kindly pay in the name of *</label>
                      <input
                        type="text"
                        required
                        disabled={isReadOnly}
                        value={beneficiaryName}
                        onChange={(e) => setBeneficiaryName(e.target.value)}
                        placeholder="e.g. SIMA GHOSH"
                        className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Bank Name *</label>
                      <input
                        type="text"
                        required
                        disabled={isReadOnly}
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. STATE BANK OF INDIA"
                        className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Branch *</label>
                      <input
                        type="text"
                        required
                        disabled={isReadOnly}
                        value={bankBranch}
                        onChange={(e) => setBankBranch(e.target.value)}
                        placeholder="e.g. HARIDEVPUR"
                        className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Account Number *</label>
                      <input
                        type="text"
                        required
                        disabled={isReadOnly}
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="e.g. 10292533337"
                        className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">IFSC Code *</label>
                      <input
                        type="text"
                        required
                        disabled={isReadOnly}
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        placeholder="e.g. SBIN0011530"
                        className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono uppercase font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">HSN / SAC Code</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={hsnCode}
                        onChange={(e) => setHsnCode(e.target.value)}
                        placeholder="e.g. 998319"
                        className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit & Summary Card */}
                <div className="p-3.5 bg-purple-950/30 rounded-xl border border-purple-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-purple-200">
                      Total Invoiced: <strong className="text-white font-mono">₹{calculations.grandTotal.toLocaleString()}</strong>
                      {calculations.tdsAmount > 0 && (
                        <span className="text-purple-300 ml-2">
                          &bull; Less TDS ({calculations.tdsPercent}%): -₹{calculations.tdsAmount.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-emerald-400 font-bold">
                      Net Payable to Vendor: ₹{calculations.netPayable.toLocaleString()}
                    </div>
                  </div>

                  {!isReadOnly && (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-5 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>{isSubmitting ? 'Generating & Saving...' : 'Generate Invoice & Add to Record'}</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* RIGHT: LIVE FORMATTED INVOICE SHEET (MATCHING USER SCREENSHOT EXACTLY) */}
          {(activeViewMode === 'split' || activeViewMode === 'document') && (
            <div
              className={`h-full overflow-y-auto p-3 sm:p-6 bg-slate-950 flex flex-col items-center custom-scrollbar ${
                activeViewMode === 'split' ? 'lg:col-span-6' : 'lg:col-span-12'
              }`}
            >
              {/* Paper Preview Card */}
              <div
                ref={printRef}
                id="printable-invoice-sheet"
                className="w-full max-w-[760px] bg-white text-black p-5 sm:p-8 rounded-none shadow-2xl border border-black font-sans leading-tight print:p-0 print:border-none print:shadow-none"
                style={{ color: '#000000', backgroundColor: '#ffffff' }}
              >
                {/* 1. Centered Header: Vendor Name, Address, Phone */}
                <div className="text-center pb-2 border-b-2 border-black">
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
                    {vendorName || 'SIMA GHOSH'}
                  </h1>
                  <div className="text-xs sm:text-sm font-bold uppercase mt-1 text-black">
                    ADDRESS:- {vendorAddress || '173 NASKARPARA RD, KOLKATA: 700 041'}
                  </div>
                  <div className="text-xs sm:text-sm font-bold uppercase mt-0.5 text-black">
                    PHONE NUMBER:- {vendorPhone || '9830123537'}
                  </div>
                  {vendorEmail && (
                    <div className="text-xs sm:text-sm font-bold mt-0.5 text-black">
                      E-MAIL:- {vendorEmail}
                    </div>
                  )}
                </div>

                {/* 2. INVOICE Title */}
                <div className="text-center py-1 border-b-2 border-black">
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-widest text-black">
                    INVOICE
                  </h2>
                </div>

                {/* 3. Top 2 Columns: Billed To (Left) & Invoice Meta (Right) */}
                <div className="grid grid-cols-12 border-b-2 border-black">
                  {/* Left Column: Bill To */}
                  <div className="col-span-7 p-2 sm:p-3 border-r-2 border-black text-xs sm:text-sm leading-relaxed">
                    <div className="font-bold text-black">To,</div>
                    <div className="font-black text-black">{clientName || 'SVF Entertainment Pvt. Ltd.'}</div>
                    <div className="text-black">{clientAddress || 'Acropolis 18th Floor, 1858/1 Rajdanga Main Road, kolkata-700107'}</div>
                    {clientPhone && <div className="text-black text-xs">Phone: {clientPhone}</div>}
                    {clientEmail && <div className="text-black text-xs">Email: {clientEmail}</div>}
                    <div className="font-bold text-black mt-1">
                      GST NO:- {clientGstin || '19AADCV7250P1ZM'}
                    </div>
                  </div>

                  {/* Right Column: Invoice No & Date */}
                  <div className="col-span-5 p-2 sm:p-3 text-xs sm:text-sm flex flex-col justify-start">
                    <div className="font-black text-black">
                      Invoice No:- <span className="font-bold">{invoiceNumber || '2026-27/ 08'}</span>
                    </div>
                    <div className="font-black text-black mt-1">
                      Date:- <span className="font-bold">{formatDocumentDate(invoiceDate)}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Line Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs sm:text-sm text-black border-b-2 border-black">
                    <thead>
                      <tr className="border-b-2 border-black text-center font-black">
                        <th className="p-2 border-r-2 border-black w-[48%] text-center">Description</th>
                        <th className="p-2 border-r-2 border-black w-[20%] text-center">NO.OF WORKING DAYS</th>
                        <th className="p-2 border-r-2 border-black w-[14%] text-center">RATE</th>
                        <th className="p-2 w-[18%] text-center">Amount (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Render grouped subcategories */}
                      {Object.entries(groupedSubcategories).map(([subCatName, items]) => (
                        <React.Fragment key={subCatName}>
                          {/* Sub Category Header Row */}
                          <tr className="border-b border-black">
                            <td className="p-2 border-r-2 border-black font-black underline" colSpan={1}>
                              {subCatName}:-
                            </td>
                            <td className="p-2 border-r-2 border-black"></td>
                            <td className="p-2 border-r-2 border-black"></td>
                            <td className="p-2"></td>
                          </tr>

                          {/* Line item rows */}
                          {items.map((it) => (
                            <tr key={it.id} className="border-b border-black">
                              <td className="p-2 border-r-2 border-black align-top font-bold text-black">
                                {it.datesWorked || it.description}
                              </td>
                              <td className="p-2 border-r-2 border-black text-center font-black align-top">
                                {it.workingDays} {it.unit || 'Days'}
                              </td>
                              <td className="p-2 border-r-2 border-black text-center font-black align-top">
                                {it.rate ? it.rate.toLocaleString() : '-'}
                              </td>
                              <td className="p-2 text-right font-black align-top">
                                {((it.workingDays || 0) * (it.rate || 0)).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}

                      {/* Project Name Row */}
                      <tr className="border-b-2 border-black font-black">
                        <td className="p-2 border-r-2 border-black font-black text-black" colSpan={1}>
                          Project Name:- {projectName || 'RANDHUNI NA KANDUNI (SONY NON FICTION)'}
                        </td>
                        <td className="p-2 border-r-2 border-black"></td>
                        <td className="p-2 border-r-2 border-black"></td>
                        <td className="p-2 text-right font-black">
                          {calculations.baseTotal.toLocaleString()}
                        </td>
                      </tr>

                      {/* Tax Additions */}
                      <tr className="border-b border-black text-xs sm:text-sm">
                        <td className="p-1.5 border-r-2 border-black font-bold">
                          Add:-CGST {cgstRate > 0 ? `${cgstRate}%` : '9%'}
                        </td>
                        <td className="p-1.5 border-r-2 border-black"></td>
                        <td className="p-1.5 border-r-2 border-black"></td>
                        <td className="p-1.5 text-right font-bold">
                          {calculations.cgstAmt > 0 ? calculations.cgstAmt.toLocaleString() : '-'}
                        </td>
                      </tr>
                      <tr className="border-b border-black text-xs sm:text-sm">
                        <td className="p-1.5 border-r-2 border-black font-bold">
                          Add:-SGST {sgstRate > 0 ? `${sgstRate}%` : '9%'}
                        </td>
                        <td className="p-1.5 border-r-2 border-black"></td>
                        <td className="p-1.5 border-r-2 border-black"></td>
                        <td className="p-1.5 text-right font-bold">
                          {calculations.sgstAmt > 0 ? calculations.sgstAmt.toLocaleString() : '-'}
                        </td>
                      </tr>
                      <tr className="border-b-2 border-black text-xs sm:text-sm">
                        <td className="p-1.5 border-r-2 border-black font-bold">
                          Add:-IGST {igstRate > 0 ? `${igstRate}%` : '18%'}
                        </td>
                        <td className="p-1.5 border-r-2 border-black"></td>
                        <td className="p-1.5 border-r-2 border-black"></td>
                        <td className="p-1.5 text-right font-bold">
                          {calculations.igstAmt > 0 ? calculations.igstAmt.toLocaleString() : '-'}
                        </td>
                      </tr>

                      {/* Total Amount Row */}
                      <tr className="border-b-2 border-black font-black text-sm sm:text-base">
                        <td className="p-2 border-r-2 border-black font-black">Total Amount</td>
                        <td className="p-2 border-r-2 border-black"></td>
                        <td className="p-2 border-r-2 border-black"></td>
                        <td className="p-2 text-right font-black">
                          {calculations.grandTotal.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 5. Bottom Beneficiary & Bank Details Grid */}
                <div className="text-xs sm:text-sm font-bold text-black border-b-2 border-black divide-y border-black">
                  <div className="p-1.5">
                    Kindly pay in the name of:- <span className="font-black">{beneficiaryName || vendorName}</span>
                  </div>
                  <div className="p-1.5">
                    GST No. - <span className="font-mono">{vendorGstin || '-'}</span>
                  </div>
                  <div className="p-1.5">
                    HSN CODE <span className="font-mono">{hsnCode || '-'}</span>
                  </div>
                  <div className="p-1.5">
                    PAN No:- <span className="font-mono font-black">{vendorPan || 'AOXPG5365H'}</span>
                  </div>
                  <div className="p-1.5">
                    BANK NAME:- <span className="font-black">{bankName || 'STATE BANK OF INDIA'}</span>
                  </div>
                  <div className="p-1.5">
                    Branch:- <span className="font-black">{bankBranch || 'HARIDEVPUR'}</span>
                  </div>
                  <div className="p-1.5">
                    Account Number:- <span className="font-mono font-black">{accountNumber || '10292533337'}</span>
                  </div>
                  <div className="p-1.5">
                    Ifsc Code:- <span className="font-mono font-black">{ifscCode || 'SBIN0011530'}</span>
                  </div>
                </div>

                {/* Signature Block */}
                <div className="flex justify-end items-end pt-8 sm:pt-12 pr-4">
                  <div className="text-center w-40">
                    <div className="border-t border-black pt-1 font-black text-xs sm:text-sm">
                      Signature
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quick-Action in Document Mode */}
              {!isReadOnly && activeViewMode === 'document' && (
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveViewMode('form')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Back to Edit Form</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateAndSave}
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>{isSubmitting ? 'Generating & Saving...' : 'Confirm & Add to Records'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
