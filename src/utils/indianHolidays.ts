export interface IndianSpecialDay {
  title: string;
  type: 'national' | 'gazetted' | 'cultural' | 'observance';
  description?: string;
  emoji?: string;
}

// Comprehensive database of Indian National Holidays, Gazetted Public Holidays, Regional New Years, and Festivals
export const INDIAN_HOLIDAYS_MAP: Record<string, IndianSpecialDay> = {
  // ---------------- FIXED ANNUAL DATES (MM-DD) ----------------
  '01-01': { title: "New Year's Day", type: 'gazetted', description: "First day of the Gregorian calendar year", emoji: '🎆' },
  '01-12': { title: 'National Youth Day', type: 'observance', description: 'Swami Vivekananda Jayanti', emoji: '🧘' },
  '01-14': { title: 'Makar Sankranti / Pongal / Bihu', type: 'cultural', description: 'Harvest festival celebrated across India', emoji: '🪁' },
  '01-15': { title: 'Indian Army Day / Magh Bihu', type: 'observance', description: 'Honoring Indian Armed Forces & Bihu', emoji: '🪖' },
  '01-23': { title: 'Netaji Subhas Chandra Bose Jayanti', type: 'gazetted', description: 'Parakram Diwas honoring Netaji', emoji: '🫡' },
  '01-26': { title: 'Republic Day 🇮🇳', type: 'national', description: 'National Holiday - Adoption of the Constitution of India', emoji: '🇮🇳' },
  '01-30': { title: "Martyrs' Day (Shaheed Diwas)", type: 'observance', description: 'Tribute to Mahatma Gandhi & freedom fighters', emoji: '🕯️' },
  '03-08': { title: "International Women's Day", type: 'observance', description: 'Celebrating women nationwide', emoji: '🌺' },
  '03-22': { title: 'Bihar Diwas', type: 'observance', description: 'Formation day of Bihar state', emoji: '🏛️' },
  '04-01': { title: 'Odisha Day (Utkal Divas)', type: 'observance', description: 'Formation day of Odisha state', emoji: '🌸' },
  '04-14': { title: 'Dr. B.R. Ambedkar Jayanti / Poila Baisakh / Baisakhi / Tamil New Year', type: 'gazetted', description: 'Ambedkar Jayanti & Indian Regional New Years', emoji: '📜' },
  '05-01': { title: 'May Day / Maharashtra Day / Gujarat Day', type: 'gazetted', description: "International Workers' Day & State Foundation Day", emoji: '🛠️' },
  '05-08': { title: 'Rabindra Jayanti (25e Baisakh)', type: 'cultural', description: 'Birth anniversary of Kabi Guru Rabindranath Tagore', emoji: '🖋️' },
  '08-15': { title: 'Independence Day 🇮🇳', type: 'national', description: 'National Holiday - Indian Independence Day', emoji: '🇮🇳' },
  '08-29': { title: 'National Sports Day', type: 'observance', description: 'Major Dhyan Chand Jayanti', emoji: '🏑' },
  '09-05': { title: "Teachers' Day", type: 'observance', description: 'Dr. Sarvepalli Radhakrishnan Jayanti', emoji: '📚' },
  '10-02': { title: 'Gandhi Jayanti 🇮🇳', type: 'national', description: 'National Holiday - Mahatma Gandhi & Lal Bahadur Shastri Jayanti', emoji: '👓' },
  '10-31': { title: 'National Unity Day (Rashtriya Ekta Diwas)', type: 'observance', description: 'Sardar Vallabhbhai Patel Jayanti', emoji: '🗿' },
  '11-14': { title: "Children's Day (Bal Diwas)", type: 'observance', description: 'Pt. Jawaharlal Nehru Jayanti', emoji: '🎈' },
  '12-25': { title: 'Christmas Day 🎄', type: 'gazetted', description: 'Gazetted Public Holiday', emoji: '🎄' },

  // ---------------- 2026 SPECIFIC FESTIVALS (YYYY-MM-DD) ----------------
  '2026-01-26': { title: 'Republic Day 🇮🇳', type: 'national', description: 'National Holiday - 77th Republic Day Parade', emoji: '🇮🇳' },
  '2026-02-01': { title: 'Thaipusam', type: 'cultural', description: 'Tamil Hindu festival', emoji: '🔱' },
  '2026-02-15': { title: 'Maha Shivratri', type: 'gazetted', description: 'Great Night of Shiva', emoji: '🔱' },
  '2026-03-03': { title: 'Holika Dahan / Chhoti Holi', type: 'cultural', description: 'Bonfire rituals on the eve of Holi', emoji: '🔥' },
  '2026-03-04': { title: 'Holi (Festival of Colors) 🎨', type: 'gazetted', description: 'Gazetted Holiday - Festival of Joy & Colors', emoji: '🎨' },
  '2026-03-20': { title: 'Eid al-Fitr (Meethi Eid)', type: 'gazetted', description: 'Islamic Festival marking the end of Ramadan', emoji: '🌙' },
  '2026-03-26': { title: 'Rama Navami', type: 'gazetted', description: 'Birth of Lord Rama', emoji: '🏹' },
  '2026-03-31': { title: 'Mahavir Jayanti', type: 'gazetted', description: 'Birth of Lord Mahavira', emoji: '☸️' },
  '2026-04-03': { title: 'Good Friday', type: 'gazetted', description: 'Christian Observance', emoji: '✝️' },
  '2026-04-14': { title: 'Ambedkar Jayanti / Poila Baisakh / Baisakhi', type: 'gazetted', description: 'Regional New Years & Dr. Ambedkar Jayanti', emoji: '📜' },
  '2026-05-01': { title: 'May Day / Maharashtra Day', type: 'gazetted', description: 'Workers Day & Maharashtra State Day', emoji: '🛠️' },
  '2026-05-27': { title: 'Bakrid / Eid al-Adha', type: 'gazetted', description: 'Feast of the Sacrifice', emoji: '🌙' },
  '2026-05-31': { title: 'Buddha Purnima', type: 'gazetted', description: 'Birth anniversary of Lord Buddha', emoji: '🪷' },
  '2026-06-25': { title: 'Muharram', type: 'gazetted', description: 'First month of the Islamic Calendar', emoji: '🕌' },
  '2026-08-15': { title: 'Independence Day 🇮🇳', type: 'national', description: 'National Holiday - 80th Independence Day of India', emoji: '🇮🇳' },
  '2026-08-26': { title: 'Milad un-Nabi (Eid-e-Milad)', type: 'gazetted', description: 'Birth of Prophet Muhammad', emoji: '🌙' },
  '2026-08-28': { title: 'Raksha Bandhan 🎋', type: 'cultural', description: 'Celebration of brother-sister bond', emoji: '🎋' },
  '2026-09-04': { title: 'Janmashtami 🪈', type: 'gazetted', description: 'Birth of Lord Krishna', emoji: '🪈' },
  '2026-09-14': { title: 'Ganesh Chaturthi 🐘', type: 'cultural', description: '10-day Festival of Lord Ganesha', emoji: '🐘' },
  '2026-10-02': { title: 'Gandhi Jayanti 🇮🇳', type: 'national', description: 'National Holiday - Birth anniversary of Mahatma Gandhi', emoji: '👓' },
  '2026-10-18': { title: 'Maha Saptami (Durga Puja)', type: 'cultural', description: 'Seventh day of Durga Puja', emoji: '🛕' },
  '2026-10-19': { title: 'Maha Ashtami / Navami (Durga Puja) 🛕', type: 'cultural', description: 'Peak Durga Puja celebrations across India', emoji: '🛕' },
  '2026-10-20': { title: 'Vijayadashami / Dussehra 🏹', type: 'gazetted', description: 'Victory of Good over Evil', emoji: '🏹' },
  '2026-11-08': { title: 'Diwali / Deepavali 🪔', type: 'gazetted', description: 'Festival of Lights', emoji: '🪔' },
  '2026-11-09': { title: 'Govardhan Puja', type: 'cultural', description: 'Worship of Govardhan Hill', emoji: '🏔️' },
  '2026-11-10': { title: 'Bhai Dooj', type: 'cultural', description: 'Brother-Sister Festival', emoji: '✨' },
  '2026-11-15': { title: 'Chhath Puja ☀️', type: 'cultural', description: 'Venerating the Sun God Surya', emoji: '☀️' },
  '2026-11-24': { title: 'Guru Nanak Jayanti 🕉️', type: 'gazetted', description: 'Gurpurab celebrating Guru Nanak Dev Ji', emoji: '🕉️' },
  '2026-12-25': { title: 'Christmas Day 🎄', type: 'gazetted', description: 'Gazetted Holiday', emoji: '🎄' },

  // ---------------- 2025 SPECIFIC FESTIVALS (YYYY-MM-DD) ----------------
  '2025-01-26': { title: 'Republic Day 🇮🇳', type: 'national', description: 'National Holiday', emoji: '🇮🇳' },
  '2025-02-26': { title: 'Maha Shivratri', type: 'gazetted', description: 'Night of Lord Shiva', emoji: '🔱' },
  '2025-03-14': { title: 'Holi 🎨', type: 'gazetted', description: 'Festival of Colors', emoji: '🎨' },
  '2025-03-31': { title: 'Eid al-Fitr', type: 'gazetted', description: 'Islamic Festival', emoji: '🌙' },
  '2025-04-06': { title: 'Rama Navami', type: 'gazetted', description: 'Birth of Lord Rama', emoji: '🏹' },
  '2025-04-10': { title: 'Mahavir Jayanti', type: 'gazetted', description: 'Birth of Lord Mahavira', emoji: '☸️' },
  '2025-04-14': { title: 'Ambedkar Jayanti / Poila Baisakh', type: 'gazetted', description: 'Dr. Ambedkar Jayanti', emoji: '📜' },
  '2025-04-18': { title: 'Good Friday', type: 'gazetted', emoji: '✝️' },
  '2025-05-01': { title: 'May Day / Maharashtra Day', type: 'gazetted', emoji: '🛠️' },
  '2025-05-12': { title: 'Buddha Purnima', type: 'gazetted', emoji: '🪷' },
  '2025-06-07': { title: 'Bakrid / Eid al-Adha', type: 'gazetted', emoji: '🌙' },
  '2025-07-06': { title: 'Muharram', type: 'gazetted', emoji: '🕌' },
  '2025-08-09': { title: 'Raksha Bandhan 🎋', type: 'cultural', emoji: '🎋' },
  '2025-08-15': { title: 'Independence Day 🇮🇳', type: 'national', emoji: '🇮🇳' },
  '2025-08-16': { title: 'Janmashtami 🪈', type: 'gazetted', emoji: '🪈' },
  '2025-08-27': { title: 'Ganesh Chaturthi 🐘', type: 'cultural', emoji: '🐘' },
  '2025-09-05': { title: 'Milad un-Nabi', type: 'gazetted', emoji: '🌙' },
  '2025-09-29': { title: 'Maha Saptami', type: 'cultural', emoji: '🛕' },
  '2025-09-30': { title: 'Maha Ashtami / Durga Puja 🛕', type: 'cultural', emoji: '🛕' },
  '2025-10-02': { title: 'Gandhi Jayanti / Dussehra 🏹', type: 'national', emoji: '👓' },
  '2025-10-20': { title: 'Diwali / Deepavali 🪔', type: 'gazetted', emoji: '🪔' },
  '2025-10-28': { title: 'Chhath Puja ☀️', type: 'cultural', emoji: '☀️' },
  '2025-11-05': { title: 'Guru Nanak Jayanti 🕉️', type: 'gazetted', emoji: '🕉️' },
  '2025-12-25': { title: 'Christmas Day 🎄', type: 'gazetted', emoji: '🎄' },
};

/**
 * Returns Indian special day information for a given YYYY-MM-DD date string.
 */
export function getIndianHolidayForDate(dateStr: string): IndianSpecialDay | null {
  if (!dateStr) return null;
  // 1. Exact match (e.g. 2026-08-15)
  if (INDIAN_HOLIDAYS_MAP[dateStr]) {
    return INDIAN_HOLIDAYS_MAP[dateStr];
  }
  // 2. Month-Day match (e.g. 08-15)
  if (dateStr.length >= 10) {
    const mmdd = dateStr.substring(5);
    if (INDIAN_HOLIDAYS_MAP[mmdd]) {
      return INDIAN_HOLIDAYS_MAP[mmdd];
    }
  }
  return null;
}

/**
 * Formats a date string or Date object into "07- July - 26" format.
 */
export function formatCustomDate(dateStr?: string | Date | null): string {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (!str) return '';

  if (/^\d{2}-\s*[A-Za-z]+\s*-\s*\d{2,4}$/.test(str)) {
    return str;
  }

  const fullMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1].slice(-2);
    const monthNum = parseInt(ymdMatch[2], 10);
    const day = ymdMatch[3].padStart(2, '0');
    const monthName = fullMonths[monthNum - 1] || ymdMatch[2];
    return `${day}- ${monthName} - ${year}`;
  }

  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const monthNum = parseInt(dmyMatch[2], 10);
    const year = dmyMatch[3].slice(-2);
    const monthName = fullMonths[monthNum - 1] || dmyMatch[2];
    return `${day}- ${monthName} - ${year}`;
  }

  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const day = String(d.getDate()).padStart(2, '0');
    const monthName = fullMonths[d.getMonth()];
    const year = String(d.getFullYear()).slice(-2);
    return `${day}- ${monthName} - ${year}`;
  }

  return str;
}

/**
 * Formats a date string into "07- July - 26" format.
 */
export function formatDateDMY(dateStr: string): string {
  return formatCustomDate(dateStr);
}
