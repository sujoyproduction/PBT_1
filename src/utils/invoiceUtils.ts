import { PurchaseOrder, Expense, VendorInvoice } from '../types';

/**
 * Extracts and computes the next serial invoice number based on all existing invoices
 * in the system (POs, Invoices, Expenses, and Session storage).
 * Ensures numbers are sequentially incremented (e.g. INV/2026/089 -> INV/2026/090 -> INV/2026/091)
 * and strictly unique without collision: "every invoice number will be different serial wise".
 */
export function generateNextSerialInvoiceNumber(
  purchaseOrders: PurchaseOrder[] = [],
  additionalInvoicesOrExpenses: (string | VendorInvoice | Expense | { invoiceNumber?: string })[] = []
): string {
  const currentYear = new Date().getFullYear();
  const existingNumbers = new Set<string>();
  const parsedSerials: number[] = [];

  let detectedPrefix = `INV/${currentYear}/`;

  // Helper to extract serial integer from any raw string
  const processRawString = (raw: string) => {
    const trimmed = (raw || '').trim();
    if (!trimmed) return;
    existingNumbers.add(trimmed.toUpperCase());

    // Pattern 1: INV/2026/089 or INV/2026/90
    const matchInvYear = trimmed.match(/^INV\/(\d{4})\/(\d+)$/i);
    if (matchInvYear) {
      detectedPrefix = `INV/${matchInvYear[1]}/`;
      parsedSerials.push(parseInt(matchInvYear[2], 10));
      return;
    }

    // Pattern 2: INV/2026-27/001
    const matchInvFy = trimmed.match(/^INV\/(\d{4}-\d{2})\/(\d+)$/i);
    if (matchInvFy) {
      detectedPrefix = `INV/${matchInvFy[1]}/`;
      parsedSerials.push(parseInt(matchInvFy[2], 10));
      return;
    }

    // Pattern 3: 2026-27/ 08 or 2026-27/08
    const matchFySlash = trimmed.match(/^(\d{4}-\d{2})\/\s*(\d+)$/i);
    if (matchFySlash) {
      parsedSerials.push(parseInt(matchFySlash[2], 10));
      return;
    }

    // Pattern 4: Any numbers in invoice string, e.g. "INV-089" or "INV/089"
    const numberMatches = trimmed.match(/\d+/g);
    if (numberMatches && numberMatches.length > 0) {
      const lastNumStr = numberMatches[numberMatches.length - 1];
      const lastNum = parseInt(lastNumStr, 10);
      if (!isNaN(lastNum) && lastNum < 999999) {
        if (lastNumStr.length === 4 && lastNum >= 2020 && lastNum <= 2040 && numberMatches.length > 1) {
          const nextGroup = numberMatches[numberMatches.length - 2];
          parsedSerials.push(parseInt(nextGroup, 10));
        } else if (lastNumStr.length !== 4 || lastNum < 2020 || lastNum > 2040) {
          parsedSerials.push(lastNum);
        }
      }
    }
  };

  // 1. Process purchase order invoices
  purchaseOrders.forEach((po) => {
    (po.invoices || []).forEach((inv) => {
      processRawString(inv.invoiceNumber);
    });
  });

  // 2. Process additional invoices or expenses
  additionalInvoicesOrExpenses.forEach((item) => {
    if (typeof item === 'string') {
      processRawString(item);
    } else if (item && typeof item === 'object') {
      if ('invoiceNumber' in item && item.invoiceNumber) {
        processRawString(item.invoiceNumber);
      }
    }
  });

  // 3. Check localStorage for highest issued invoice serial to ensure non-repeating sequence
  try {
    const storedSerial = localStorage.getItem('erp_last_invoice_serial');
    if (storedSerial) {
      const num = parseInt(storedSerial, 10);
      if (!isNaN(num)) {
        parsedSerials.push(num);
      }
    }
  } catch (e) {
    // Ignore storage issues
  }

  // Calculate next sequential integer
  let nextSerial = 1;
  if (parsedSerials.length > 0) {
    const maxSerial = Math.max(...parsedSerials);
    nextSerial = maxSerial + 1;
  }

  // Format with minimum 3-digit zero padding (e.g. 001, 090, 091, 100)
  const padLength = Math.max(3, String(nextSerial).length);
  let candidate = `${detectedPrefix}${String(nextSerial).padStart(padLength, '0')}`;

  // Collision avoidance: increment until guaranteed unique
  let safeguard = 0;
  while (existingNumbers.has(candidate.toUpperCase()) && safeguard < 2000) {
    nextSerial++;
    candidate = `${detectedPrefix}${String(nextSerial).padStart(padLength, '0')}`;
    safeguard++;
  }

  // Persist the issued serial so next calls are strictly subsequent
  try {
    localStorage.setItem('erp_last_invoice_serial', String(nextSerial));
  } catch (e) {
    // Ignore storage issues
  }

  return candidate;
}
