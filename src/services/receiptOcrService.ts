export interface ExtractedReceiptData {
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  gstin: string;
  pan: string;
  totalAmount: number;
  baseAmount: number;
  taxAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Credit Card' | 'Debit Card' | 'Cheque' | 'Petty Cash' | string;
  suggestedCategoryId: string;
  suggestedCategoryName: string;
  suggestedSubCategoryName: string;
  suggestedPaymentType: 'Purchase' | 'Wages' | 'Rent' | 'Reimbursement' | 'Professional Fee' | 'On Account' | 'Advance' | string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    hsnSacCode?: string;
  }>;
  confidenceScore: number;
  summary: string;
  detectedText?: string;
  receiptImageData?: string;
  receiptFileName?: string;
  receiptFileSize?: number;
}

export async function extractReceiptWithGemini(
  imageBase64: string,
  mimeType: string,
  availableCategories: Array<{ id: string; name: string; subCategories?: Array<{ id: string; name: string }> }> = []
): Promise<{ success: boolean; data: ExtractedReceiptData; error?: string }> {
  try {
    const response = await fetch('/api/gemini/receipt-ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBase64,
        mimeType,
        availableCategories
      })
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error || `Server OCR request failed (${response.status})`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data
    };
  } catch (err: any) {
    console.error('Gemini OCR Service Error:', err);
    return {
      success: false,
      data: {} as any,
      error: err?.message || 'Network error during receipt OCR'
    };
  }
}
