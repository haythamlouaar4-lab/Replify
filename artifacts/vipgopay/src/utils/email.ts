const BLOCKED_DOMAINS = [
  "mailinator.com","guerrillamail.com","tempmail.com","throwam.com",
  "trashmail.com","yopmail.com","sharklasers.com","guerrillamailblock.com",
  "grr.la","guerrillamail.info","spam4.me","tempr.email","discard.email",
  "fakeinbox.com","mailnull.com","spamgourmet.com","trashmail.at",
  "tempinbox.com","dispostable.com","spamfree24.org","maildrop.cc",
  "spamgourmet.net","mytemp.email","temp-mail.org","tmails.net",
];

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isBlockedDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return BLOCKED_DOMAINS.includes(domain);
}

export function isValidAlgerianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, "");
  return /^(05|06|07)\d{8}$/.test(cleaned);
}

export function getOrCreateUID(email: string): string {
  const key = `uid_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const uid = Math.random().toString(36).slice(2, 10).toUpperCase() +
              Math.random().toString(36).slice(2, 6).toUpperCase();
  localStorage.setItem(key, uid);
  return uid;
}

export const TIERS = [
  { min: 0,   max: 9,   icon: "🥉", nameAr: "برونزي", nameFr: "Bronze",   nameEn: "Bronze",   color: "#cd7f32", discount: 0  },
  { min: 10,  max: 29,  icon: "🥈", nameAr: "فضي",    nameFr: "Argent",   nameEn: "Silver",   color: "#c0c0c0", discount: 5  },
  { min: 30,  max: 59,  icon: "🥇", nameAr: "ذهبي",   nameFr: "Or",       nameEn: "Gold",     color: "#ffd700", discount: 10 },
  { min: 60,  max: 99,  icon: "💎", nameAr: "بلاتيني",nameFr: "Platine",  nameEn: "Platinum", color: "#00d4ff", discount: 15 },
  { min: 100, max: Infinity, icon: "👑", nameAr: "ماسي",    nameFr: "Diamant", nameEn: "Diamond",  color: "#8b5cf6", discount: 20 },
] as const;

export type Tier = (typeof TIERS)[number];

export function getTierForCount(count: number): Tier {
  return [...TIERS].reverse().find((t) => count >= t.min) ?? TIERS[0];
}

export function getNextTier(count: number): Tier | null {
  return TIERS.find((t) => count < t.min) ?? null;
}

export function tierProgressPct(count: number): number {
  const cur = getTierForCount(count);
  const next = getNextTier(count);
  if (!next) return 100;
  const range = next.min - cur.min;
  const progress = count - cur.min;
  return Math.min(100, Math.round((progress / range) * 100));
}
