import React, { useState, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  UploadCloud, 
  Camera, 
  Check, 
  FileText, 
  Receipt, 
  Building, 
  Percent, 
  Tag, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight, 
  Layers, 
  Zap, 
  Eye, 
  Copy,
  Clock,
  ShieldCheck,
  Plus,
  Trash2
} from 'lucide-react';
import { BudgetCategory, ExpenseAttachment } from '../types';
import { extractReceiptWithGemini, ExtractedReceiptData } from '../services/receiptOcrService';

interface AIReceiptOCRModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: BudgetCategory[];
  onApplyExtractedData: (data: ExtractedReceiptData, attachment?: ExpenseAttachment) => void;
  onDirectBookExpense?: (data: ExtractedReceiptData, attachment?: ExpenseAttachment) => void;
}

// Sample production receipts for quick testing
const SAMPLE_RECEIPTS = [
  {
    id: 'sample-arri',
    title: 'Arri Alexa 35 Camera Package Tax Invoice',
    category: 'Camera Equipment',
    amount: '₹1,41,600.00',
    vendor: 'CineEquipment India Pvt Ltd',
    gstin: '27AABCC1234F1Z8',
    description: '3-Day Alexa 35 Camera Body + Master Prime Lens Kit Rental with 18% IGST',
    svgData: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" style="background:#fff;font-family:Arial,sans-serif;">
        <rect width="600" height="800" fill="#ffffff"/>
        <rect x="20" y="20" width="560" height="760" fill="none" stroke="#333" stroke-width="2"/>
        <text x="40" y="60" font-size="20" font-weight="bold" fill="#0f172a">TAX INVOICE</text>
        <text x="40" y="85" font-size="14" font-weight="bold" fill="#1e293b">CINEEQUIPMENT INDIA PVT LTD</text>
        <text x="40" y="105" font-size="11" fill="#475569">Plot 45, Film City Road, Goregaon East, Mumbai - 400065</text>
        <text x="40" y="122" font-size="11" font-weight="bold" fill="#0f172a">GSTIN: 27AABCC1234F1Z8 | PAN: AABCC1234F</text>
        
        <line x1="40" y1="135" x2="560" y2="135" stroke="#cbd5e1" stroke-width="1.5"/>
        
        <text x="40" y="160" font-size="11" fill="#334155"><tspan font-weight="bold">Invoice No:</tspan> CE/2026/0891</text>
        <text x="40" y="178" font-size="11" fill="#334155"><tspan font-weight="bold">Invoice Date:</tspan> 2026-08-20</text>
        <text x="40" y="196" font-size="11" fill="#334155"><tspan font-weight="bold">Payment Mode:</tspan> Bank Transfer (NEFT/RTGS)</text>
        
        <text x="320" y="160" font-size="11" fill="#334155"><tspan font-weight="bold">Billed To:</tspan> Production Company ERP</text>
        <text x="320" y="178" font-size="11" fill="#334155"><tspan font-weight="bold">Project Ref:</tspan> Feature Film Unit 1</text>
        <text x="320" y="196" font-size="11" fill="#334155"><tspan font-weight="bold">HSN/SAC:</tspan> 997331 (Equipment Rental)</text>
        
        <rect x="40" y="220" width="520" height="30" fill="#f1f5f9"/>
        <text x="50" y="240" font-size="11" font-weight="bold" fill="#0f172a">Description</text>
        <text x="340" y="240" font-size="11" font-weight="bold" fill="#0f172a">Qty</text>
        <text x="400" y="240" font-size="11" font-weight="bold" fill="#0f172a">Rate</text>
        <text x="480" y="240" font-size="11" font-weight="bold" fill="#0f172a">Amount (₹)</text>
        
        <text x="50" y="275" font-size="11" fill="#1e293b">Arri Alexa 35 4.6K Camera Body (3 Days)</text>
        <text x="350" y="275" font-size="11" fill="#1e293b">3</text>
        <text x="400" y="275" font-size="11" fill="#1e293b">25,000</text>
        <text x="480" y="275" font-size="11" fill="#1e293b">75,000.00</text>
        
        <text x="50" y="305" font-size="11" fill="#1e293b">Zeiss Master Prime Lens Set (18/25/35/50/85mm)</text>
        <text x="350" y="305" font-size="11" fill="#1e293b">3</text>
        <text x="400" y="305" font-size="11" fill="#1e293b">15,000</text>
        <text x="480" y="305" font-size="11" fill="#1e293b">45,000.00</text>
        
        <line x1="40" y1="330" x2="560" y2="330" stroke="#cbd5e1" stroke-width="1"/>
        
        <text x="340" y="360" font-size="11" fill="#475569">Taxable Subtotal:</text>
        <text x="480" y="360" font-size="11" font-weight="bold" fill="#0f172a">₹1,20,000.00</text>
        
        <text x="340" y="385" font-size="11" fill="#475569">CGST @ 9%:</text>
        <text x="480" y="385" font-size="11" fill="#1e293b">₹10,800.00</text>
        
        <text x="340" y="410" font-size="11" fill="#475569">SGST @ 9%:</text>
        <text x="480" y="410" font-size="11" fill="#1e293b">₹10,800.00</text>
        
        <rect x="330" y="430" width="230" height="35" fill="#f8fafc" stroke="#94a3b8"/>
        <text x="340" y="452" font-size="13" font-weight="bold" fill="#0f172a">TOTAL AMOUNT:</text>
        <text x="460" y="452" font-size="13" font-weight="bold" fill="#059669">₹1,41,600.00</text>
        
        <text x="40" y="520" font-size="10" fill="#64748b">Amount in Words: One Lakh Forty One Thousand Six Hundred Rupees Only.</text>
        <text x="40" y="540" font-size="10" fill="#64748b">Bank Details: HDFC Bank | A/c: 50200012345678 | IFSC: HDFC0000240</text>
        <text x="400" y="620" font-size="11" font-weight="bold" fill="#0f172a">For CineEquipment India</text>
        <text x="420" y="650" font-size="9" fill="#64748b">[Authorized Signatory]</text>
      </svg>
    `)}`
  },
  {
    id: 'sample-fuel',
    title: 'Indian Oil Diesel Fuel Bill (Generator Set)',
    category: 'Transport & Fuel',
    amount: '₹27,600.00',
    vendor: 'Bharat Petroleum Highway Auto Center',
    gstin: '27AABCB9876G1Z2',
    description: '300 Litres High Speed Diesel for 125kVA Sound Proof Generator Set @ ₹92/L',
    svgData: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="700" viewBox="0 0 600 700" style="background:#fff;font-family:Courier,monospace;">
        <rect width="600" height="700" fill="#fffef5"/>
        <rect x="30" y="30" width="540" height="640" fill="none" stroke="#444" stroke-width="1.5" stroke-dasharray="4,2"/>
        <text x="180" y="70" font-size="16" font-weight="bold" fill="#000">BHARAT PETROLEUM FUEL OUTLET</text>
        <text x="210" y="90" font-size="12" fill="#333">HIGHWAY AUTO SERVICE STN</text>
        <text x="190" y="108" font-size="11" fill="#333">GSTIN: 27AABCB9876G1Z2</text>
        
        <text x="50" y="140" font-size="12" fill="#000">RECEIPT NO : FP-904221</text>
        <text x="350" y="140" font-size="12" fill="#000">DATE: 2026-08-22</text>
        <text x="50" y="160" font-size="12" fill="#000">VEHICLE/PURPOSE: 125kVA GENSET #2</text>
        <text x="350" y="160" font-size="12" fill="#000">TIME: 06:45 AM</text>
        
        <line x1="50" y1="180" x2="550" y2="180" stroke="#000" stroke-width="1"/>
        <text x="50" y="210" font-size="13" font-weight="bold" fill="#000">PRODUCT : HIGH SPEED DIESEL (HSD)</text>
        <text x="50" y="240" font-size="13" fill="#000">VOLUME  : 300.00 LITRES</text>
        <text x="50" y="270" font-size="13" fill="#000">RATE/L  : Rs. 92.00 / L</text>
        <text x="50" y="300" font-size="13" fill="#000">PAYMENT : CASH (PRODUCTION CASHIER)</text>
        <line x1="50" y1="330" x2="550" y2="330" stroke="#000" stroke-width="1"/>
        
        <text x="50" y="370" font-size="16" font-weight="bold" fill="#000">TOTAL AMOUNT: Rs. 27,600.00</text>
        <text x="50" y="400" font-size="11" fill="#555">(INCLUSIVE OF APPLICABLE VAT & DUTIES)</text>
        
        <text x="50" y="460" font-size="11" fill="#333">Attendant: Rajesh Kumar | Pump No: 04</text>
        <text x="50" y="480" font-size="11" fill="#333">Driver/Operator Sign: [Signed - Genset Master]</text>
        <text x="200" y="550" font-size="12" font-weight="bold" fill="#000">*** THANK YOU VISIT AGAIN ***</text>
      </svg>
    `)}`
  },
  {
    id: 'sample-catering',
    title: 'Location Catering & Food Services Bill',
    category: 'Catering & Food',
    amount: '₹34,125.00',
    vendor: 'Royal Film Caterers & Hospitality',
    gstin: '27AASPK4321H1Z9',
    description: 'Breakfast, Lunch & Evening High-Tea for 130 Crew Members with 5% GST',
    svgData: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" style="background:#fff;font-family:sans-serif;">
        <rect width="600" height="750" fill="#ffffff"/>
        <rect x="25" y="25" width="550" height="700" fill="none" stroke="#2563eb" stroke-width="2"/>
        <text x="45" y="65" font-size="18" font-weight="bold" fill="#1e3a8a">ROYAL FILM CATERERS &amp; HOSPITALITY</text>
        <text x="45" y="85" font-size="11" fill="#475569">Unit 12, Aarey Colony, Goregaon East, Mumbai</text>
        <text x="45" y="105" font-size="11" font-weight="bold" fill="#1e40af">GSTIN: 27AASPK4321H1Z9 | PAN: AASPK4321H</text>
        
        <text x="45" y="145" font-size="11" fill="#0f172a"><tspan font-weight="bold">Bill No:</tspan> RFC-2026-AUG-14</text>
        <text x="45" y="165" font-size="11" fill="#0f172a"><tspan font-weight="bold">Date:</tspan> 2026-08-21</text>
        <text x="350" y="145" font-size="11" fill="#0f172a"><tspan font-weight="bold">Shoot Day:</tspan> Schedule 1 - Day 08</text>
        <text x="350" y="165" font-size="11" fill="#0f172a"><tspan font-weight="bold">Location:</tspan> ND Studios Stage 4</text>
        
        <rect x="45" y="190" width="510" height="25" fill="#dbeafe"/>
        <text x="55" y="207" font-size="11" font-weight="bold" fill="#1e40af">Meal Service</text>
        <text x="280" y="207" font-size="11" font-weight="bold" fill="#1e40af">Heads</text>
        <text x="360" y="207" font-size="11" font-weight="bold" fill="#1e40af">Per Head</text>
        <text x="460" y="207" font-size="11" font-weight="bold" fill="#1e40af">Amount (₹)</text>
        
        <text x="55" y="235" font-size="11" fill="#334155">Morning Breakfast (South Indian / Eggs)</text>
        <text x="290" y="235" font-size="11" fill="#334155">130</text>
        <text x="370" y="235" font-size="11" fill="#334155">₹70</text>
        <text x="460" y="235" font-size="11" fill="#334155">9,100.00</text>
        
        <text x="55" y="265" font-size="11" fill="#334155">Full Production Lunch Buffet (Veg/Non-Veg)</text>
        <text x="290" y="265" font-size="11" fill="#334155">130</text>
        <text x="370" y="265" font-size="11" fill="#334155">₹150</text>
        <text x="460" y="265" font-size="11" fill="#334155">19,500.00</text>
        
        <text x="55" y="295" font-size="11" fill="#334155">Evening Snacks &amp; Continuous Tea/Coffee</text>
        <text x="290" y="295" font-size="11" fill="#334155">130</text>
        <text x="370" y="295" font-size="11" fill="#334155">₹30</text>
        <text x="460" y="295" font-size="11" fill="#334155">3,900.00</text>
        
        <line x1="45" y1="320" x2="555" y2="320" stroke="#93c5fd" stroke-width="1"/>
        
        <text x="300" y="350" font-size="11" fill="#64748b">Taxable Food Total:</text>
        <text x="460" y="350" font-size="11" font-weight="bold" fill="#0f172a">₹32,500.00</text>
        
        <text x="300" y="375" font-size="11" fill="#64748b">GST (Restaurant / Catering @ 5%):</text>
        <text x="460" y="375" font-size="11" fill="#0f172a">₹1,625.00</text>
        
        <rect x="290" y="395" width="265" height="35" fill="#eff6ff" stroke="#3b82f6"/>
        <text x="305" y="418" font-size="12" font-weight="bold" fill="#1e3a8a">FINAL INVOICE TOTAL:</text>
        <text x="460" y="418" font-size="13" font-weight="bold" fill="#1d4ed8">₹34,125.00</text>
        
        <text x="45" y="470" font-size="10" fill="#64748b">Payment Terms: UPI / Cash / Production Voucher</text>
        <text x="45" y="490" font-size="10" fill="#64748b">Approved By: Production Manager [Catering Desk]</text>
      </svg>
    `)}`
  }
];

export const AIReceiptOCRModal: React.FC<AIReceiptOCRModalProps> = ({
  isOpen,
  onClose,
  categories,
  onApplyExtractedData,
  onDirectBookExpense
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'samples'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [scanError, setScanError] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedReceiptData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle local file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setScanError('');
    setExtractedData(null);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Select sample receipt
  const handleSelectSample = (sample: typeof SAMPLE_RECEIPTS[0]) => {
    setImagePreviewUrl(sample.svgData);
    setSelectedFile(null);
    setScanError('');
    setExtractedData(null);
    handleTriggerOCR(sample.svgData, 'image/svg+xml', sample.title + '.svg');
  };

  // Run Gemini OCR extraction
  const handleTriggerOCR = async (
    customBase64?: string, 
    customMime?: string,
    customName?: string
  ) => {
    const imgData = customBase64 || imagePreviewUrl;
    if (!imgData) {
      setScanError('Please select or upload a receipt image first.');
      return;
    }

    setIsScanning(true);
    setScanError('');
    setExtractedData(null);

    // Progressive UI feedback steps
    setScanStep('Gemini 3.7 Flash analyzing document visual layout...');
    const t1 = setTimeout(() => setScanStep('Extracting Vendor Name, GSTIN, and Invoicing details...'), 800);
    const t2 = setTimeout(() => setScanStep('Calculating Tax Splits (CGST/SGST/IGST) & HSN codes...'), 1600);
    const t3 = setTimeout(() => setScanStep('Matching against Production Budget Categories...'), 2400);

    const mime = customMime || (selectedFile?.type || 'image/jpeg');

    try {
      const result = await extractReceiptWithGemini(imgData, mime, categories);

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      if (result.success && result.data) {
        // Find best category match if not set
        let matchedCatId = result.data.suggestedCategoryId;
        if (!matchedCatId && categories.length > 0) {
          const lowerCatName = (result.data.suggestedCategoryName || '').toLowerCase();
          const match = categories.find(c => lowerCatName.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(lowerCatName));
          if (match) matchedCatId = match.id;
        }

        const enrichedData: ExtractedReceiptData = {
          ...result.data,
          suggestedCategoryId: matchedCatId || (categories[0]?.id || ''),
          receiptImageData: imgData,
          receiptFileName: customName || selectedFile?.name || `Receipt_${Date.now()}.jpg`,
          receiptFileSize: selectedFile?.size || 150000
        };

        setExtractedData(enrichedData);
      } else {
        setScanError(result.error || 'Failed to extract receipt information');
      }
    } catch (err: any) {
      setScanError(err?.message || 'Error occurred while scanning receipt');
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  // Convert extracted data to Attachment
  const createAttachmentFromExtracted = (): ExpenseAttachment | undefined => {
    if (!extractedData?.receiptImageData) return undefined;
    return {
      id: `att_ocr_${Date.now()}`,
      fileName: extractedData.receiptFileName || `Scanned_Invoice_${extractedData.invoiceNumber || Date.now()}.jpg`,
      fileType: 'image/jpeg',
      fileSize: extractedData.receiptFileSize || 150000,
      storageUrl: extractedData.receiptImageData,
      createdAt: new Date().toISOString()
    };
  };

  // Apply to form handler
  const handleApply = () => {
    if (!extractedData) return;
    const att = createAttachmentFromExtracted();
    onApplyExtractedData(extractedData, att);
    onClose();
  };

  // Direct book handler
  const handleDirectBook = () => {
    if (!extractedData) return;
    const att = createAttachmentFromExtracted();
    if (onDirectBookExpense) {
      onDirectBookExpense(extractedData, att);
    } else {
      onApplyExtractedData(extractedData, att);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">Gemini AI Receipt &amp; Invoice OCR Extractor</h3>
                <span className="px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-800/80 rounded-full text-[10px] font-bold">
                  Gemini 3.7 Flash Vision
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Instantly extract Vendor, GSTIN, Date, Tax Split (CGST/SGST/IGST), and Budget Category from photos &amp; PDFs
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* TOP TABS: Upload vs Samples */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Upload Receipt / Bill
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('samples')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'samples'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Quick Test Samples
              </button>
            </div>

            {imagePreviewUrl && !isScanning && (
              <button
                type="button"
                onClick={() => handleTriggerOCR()}
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-lg shadow-lg shadow-emerald-900/30 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Re-Scan Document
              </button>
            )}
          </div>

          {/* TAB 1: UPLOAD AREA */}
          {activeTab === 'upload' && !imagePreviewUrl && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700/80 hover:border-blue-500 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all bg-slate-800/30 hover:bg-slate-800/50 group"
            >
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 text-blue-400 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-extrabold text-white mb-1">Click to browse or drag and drop receipt</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-3">
                Supports camera snapshots, photo receipts, GST tax invoices, petrol cash memos, restaurant bills, and equipment hire sheets (.jpg, .jpeg, .png, .webp)
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-[11px] font-semibold border border-slate-700">
                <Camera className="w-3 h-3 text-blue-400" />
                Snap Photo or Upload File
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* TAB 2: SAMPLE RECEIPTS */}
          {activeTab === 'samples' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SAMPLE_RECEIPTS.map(sample => (
                <div 
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="p-3.5 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 hover:border-indigo-500 rounded-xl cursor-pointer transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded text-[10px] font-bold">
                        {sample.category}
                      </span>
                      <span className="text-xs font-black font-mono text-emerald-400">
                        {sample.amount}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                      {sample.title}
                    </h5>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                      {sample.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>GSTIN: {sample.gstin}</span>
                    <span className="text-indigo-400 font-bold group-hover:underline flex items-center gap-0.5">
                      Scan Sample <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ACTIVE SCANNING OVERLAY */}
          {isScanning && (
            <div className="p-8 bg-slate-950/80 border border-blue-500/40 rounded-2xl text-center space-y-4 shadow-xl">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping"></div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/40 animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white mb-1">Scanning Receipt with Gemini Multimodal AI</h4>
                <p className="text-xs text-blue-400 font-mono animate-pulse">{scanStep || 'Analyzing image pixels...'}</p>
              </div>
            </div>
          )}

          {/* ERROR ALERT */}
          {scanError && (
            <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl flex items-center gap-2.5 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          {/* SPLIT VIEW: Image Preview (Left) vs Extracted Details (Right) */}
          {imagePreviewUrl && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* LEFT SIDE: Image Viewer */}
              <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>Receipt Document Preview</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreviewUrl('');
                      setSelectedFile(null);
                      setExtractedData(null);
                    }}
                    className="text-[10px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                  >
                    Change Image
                  </button>
                </div>

                <div className="flex-1 min-h-[300px] max-h-[440px] overflow-auto bg-slate-900/60 rounded-lg p-2 flex items-center justify-center border border-slate-800">
                  <img 
                    src={imagePreviewUrl} 
                    alt="Receipt preview" 
                    className="max-h-full max-w-full object-contain rounded shadow-md"
                  />
                </div>

                {!extractedData && !isScanning && (
                  <button
                    type="button"
                    onClick={() => handleTriggerOCR()}
                    className="mt-3 w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    Extract Data with Gemini AI
                  </button>
                )}
              </div>

              {/* RIGHT SIDE: Extracted & Editable Fields */}
              <div className="lg:col-span-7 space-y-3.5">
                {extractedData ? (
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4">
                    
                    {/* Header Score & Status */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                          Extracted Bill Metadata
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800/80 rounded-full text-[10px] font-bold font-mono">
                          {extractedData.confidenceScore}% Confidence
                        </span>
                        {extractedData.gstin && (
                          <span className="px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-800/80 rounded-full text-[10px] font-bold font-mono">
                            GST Registered
                          </span>
                        )}
                      </div>
                    </div>

                    {/* AI Summary note */}
                    {extractedData.summary && (
                      <div className="p-2.5 bg-blue-950/40 border border-blue-900/60 rounded-lg text-xs text-blue-200">
                        <span className="font-bold text-blue-300 mr-1">AI Note:</span>
                        {extractedData.summary}
                      </div>
                    )}

                    {/* Vendor & Invoice Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Vendor / Payee Name</label>
                        <input 
                          type="text"
                          value={extractedData.vendorName}
                          onChange={(e) => setExtractedData({ ...extractedData, vendorName: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Invoice / Bill Number</label>
                        <input 
                          type="text"
                          value={extractedData.invoiceNumber}
                          onChange={(e) => setExtractedData({ ...extractedData, invoiceNumber: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white"
                        />
                      </div>
                    </div>

                    {/* Date, GSTIN & PAN */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Invoice Date</label>
                        <input 
                          type="date"
                          value={extractedData.invoiceDate}
                          onChange={(e) => setExtractedData({ ...extractedData, invoiceDate: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Vendor GSTIN</label>
                        <input 
                          type="text"
                          maxLength={15}
                          value={extractedData.gstin}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            const panVal = val.length >= 12 ? val.slice(2, 12) : extractedData.pan;
                            setExtractedData({ ...extractedData, gstin: val, pan: panVal });
                          }}
                          placeholder="15-digit GSTIN"
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs uppercase font-mono text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Vendor PAN</label>
                        <input 
                          type="text"
                          maxLength={10}
                          value={extractedData.pan}
                          onChange={(e) => setExtractedData({ ...extractedData, pan: e.target.value.toUpperCase() })}
                          placeholder="10-digit PAN"
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs uppercase font-mono text-white"
                        />
                      </div>
                    </div>

                    {/* Financial Amounts & Tax Split */}
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
                      <h5 className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
                        Financial &amp; GST Tax Breakdown
                      </h5>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Taxable Base (₹)</label>
                          <input 
                            type="number"
                            step="0.01"
                            value={extractedData.baseAmount}
                            onChange={(e) => {
                              const b = Number(e.target.value) || 0;
                              const gVal = (b * extractedData.gstRate) / 100;
                              setExtractedData({
                                ...extractedData,
                                baseAmount: b,
                                taxAmount: gVal,
                                totalAmount: b + gVal
                              });
                            }}
                            className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-emerald-400 font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">GST Rate (%)</label>
                          <select
                            value={extractedData.gstRate}
                            onChange={(e) => {
                              const r = Number(e.target.value) || 0;
                              const gVal = (extractedData.baseAmount * r) / 100;
                              setExtractedData({
                                ...extractedData,
                                gstRate: r,
                                taxAmount: gVal,
                                totalAmount: extractedData.baseAmount + gVal
                              });
                            }}
                            className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                          >
                            <option value="0">0% (Nil / Exempt)</option>
                            <option value="5">5% (Catering / Transport)</option>
                            <option value="12">12% (Job Work / Print)</option>
                            <option value="18">18% (Standard Equip / Service)</option>
                            <option value="28">28% (Luxury / Vehicles)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">GST Tax (₹)</label>
                          <input 
                            type="number"
                            step="0.01"
                            value={extractedData.taxAmount}
                            onChange={(e) => {
                              const t = Number(e.target.value) || 0;
                              setExtractedData({
                                ...extractedData,
                                taxAmount: t,
                                totalAmount: extractedData.baseAmount + t
                              });
                            }}
                            className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-blue-400"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-emerald-400 uppercase block mb-0.5">Total Gross (₹)</label>
                          <input 
                            type="number"
                            step="0.01"
                            value={extractedData.totalAmount}
                            onChange={(e) => setExtractedData({ ...extractedData, totalAmount: Number(e.target.value) || 0 })}
                            className="w-full px-2 py-1 bg-emerald-950/60 border border-emerald-700 rounded text-xs font-mono font-black text-emerald-300"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Category & Payment Mode Mapping */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Budget Category</label>
                        <select
                          value={extractedData.suggestedCategoryId}
                          onChange={(e) => {
                            const cat = categories.find(c => c.id === e.target.value);
                            setExtractedData({
                              ...extractedData,
                              suggestedCategoryId: e.target.value,
                              suggestedCategoryName: cat?.name || extractedData.suggestedCategoryName
                            });
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-semibold"
                        >
                          <option value="">Select Budget Category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name} ({(cat as any).type || 'Budget Head'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Payment Mode</label>
                        <select
                          value={extractedData.paymentMode}
                          onChange={(e) => setExtractedData({ ...extractedData, paymentMode: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-semibold"
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Credit Card">Credit Card</option>
                          <option value="Debit Card">Debit Card</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Petty Cash">Petty Cash</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Payment Type</label>
                        <select
                          value={extractedData.suggestedPaymentType}
                          onChange={(e) => setExtractedData({ ...extractedData, suggestedPaymentType: e.target.value as any })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-semibold"
                        >
                          <option value="Purchase">Purchase</option>
                          <option value="Wages">Wages</option>
                          <option value="Rent">Rent</option>
                          <option value="Reimbursement">Reimbursement</option>
                          <option value="Professional Fee">Professional Fee</option>
                          <option value="On Account">On Account</option>
                          <option value="Advance">Advance</option>
                        </select>
                      </div>
                    </div>

                    {/* Itemized Line Items Table */}
                    {extractedData.lineItems && extractedData.lineItems.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">
                            Itemized Line Items ({extractedData.lineItems.length})
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = [...extractedData.lineItems, { description: 'New Line Item', quantity: 1, unitPrice: 0, amount: 0 }];
                              setExtractedData({ ...extractedData, lineItems: newItems });
                            }}
                            className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Line Item
                          </button>
                        </div>

                        <div className="max-h-36 overflow-y-auto border border-slate-800 rounded-lg">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-900 text-slate-400 font-bold text-[10px] uppercase">
                              <tr>
                                <th className="py-1 px-2">Description</th>
                                <th className="py-1 px-2 text-center w-14">Qty</th>
                                <th className="py-1 px-2 text-right w-20">Rate</th>
                                <th className="py-1 px-2 text-right w-24">Amount (₹)</th>
                                <th className="py-1 px-1 w-8 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                              {extractedData.lineItems.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-900/50">
                                  <td className="py-1 px-2">
                                    <input 
                                      type="text"
                                      value={item.description}
                                      onChange={(e) => {
                                        const updated = [...extractedData.lineItems];
                                        updated[idx].description = e.target.value;
                                        setExtractedData({ ...extractedData, lineItems: updated });
                                      }}
                                      className="w-full bg-transparent text-white font-sans text-xs"
                                    />
                                  </td>
                                  <td className="py-1 px-2 text-center">
                                    <input 
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => {
                                        const q = Number(e.target.value) || 1;
                                        const updated = [...extractedData.lineItems];
                                        updated[idx].quantity = q;
                                        updated[idx].amount = q * (updated[idx].unitPrice || 0);
                                        setExtractedData({ ...extractedData, lineItems: updated });
                                      }}
                                      className="w-full text-center bg-transparent text-slate-300"
                                    />
                                  </td>
                                  <td className="py-1 px-2 text-right">
                                    <input 
                                      type="number"
                                      value={item.unitPrice}
                                      onChange={(e) => {
                                        const r = Number(e.target.value) || 0;
                                        const updated = [...extractedData.lineItems];
                                        updated[idx].unitPrice = r;
                                        updated[idx].amount = (updated[idx].quantity || 1) * r;
                                        setExtractedData({ ...extractedData, lineItems: updated });
                                      }}
                                      className="w-full text-right bg-transparent text-slate-300"
                                    />
                                  </td>
                                  <td className="py-1 px-2 text-right font-bold text-emerald-400">
                                    ₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-1 px-1 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = extractedData.lineItems.filter((_, i) => i !== idx);
                                        setExtractedData({ ...extractedData, lineItems: updated });
                                      }}
                                      className="text-slate-500 hover:text-rose-400 p-0.5"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 text-center bg-slate-950/40 border border-slate-800 rounded-xl text-slate-500 space-y-2">
                    <Sparkles className="w-10 h-10 text-slate-600 mb-2" />
                    <h5 className="text-sm font-bold text-slate-300">Ready to Extract Document</h5>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Upload an invoice, snap a photo, or choose one of our sample film production receipts on the left to extract metadata automatically.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted server-side OCR with zero client credential exposure</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>

            {extractedData && (
              <>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Fill Expense Form
                </button>

                <button
                  type="button"
                  onClick={handleDirectBook}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Direct Book &amp; Attach Receipt
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
