/**
 * Security utilities for Betton
 * - Input sanitization
 * - Rate limiting
 * - Address validation
 */

// Simple HTML sanitizer
export function sanitize(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

// TON address basic validation
export function isValidTonAddress(address: string): boolean {
  // TON addresses are base64url encoded, typically 48 chars for user-friendly format
  // or raw format starting with -1: or 0:
  const userFriendlyPattern = /^[UE]Q[A-Za-z0-9_-]{46}$/;
  const rawPattern = /^(-1|0):[a-fA-F0-9]{64}$/;
  return userFriendlyPattern.test(address) || rawPattern.test(address);
}

// Rate limiter — prevents spam bet creation / placing
const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(action: string, maxPerMinute: number = 5): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const key = action;

  const times = rateLimitMap.get(key) || [];
  const recent = times.filter((t) => now - t < windowMs);

  if (recent.length >= maxPerMinute) {
    return false; // rate limited
  }

  recent.push(now);
  rateLimitMap.set(key, recent);
  return true;
}

// Validate bet amount
export function validateBetAmount(
  amount: number,
  min: number,
  max: number,
  balance: number
): string | null {
  if (isNaN(amount) || amount <= 0) return 'Invalid amount';
  if (amount < min) return `Minimum bet is ${min} TON`;
  if (amount > max) return `Maximum bet is ${max} TON`;
  if (amount > balance) return 'Insufficient TON balance';
  return null;
}

// Sanitize bet text fields
export function sanitizeBetInput(input: string, maxLength: number = 200): string {
  return sanitize(input).slice(0, maxLength);
}

// Check if content looks like spam/scam
export function detectSuspiciousContent(text: string): boolean {
  const suspiciousPatterns = [
    /send.*ton.*to.*address/i,
    /double.*your.*ton/i,
    /guaranteed.*win/i,
    /airdrop/i,
    /click.*here.*to.*claim/i,
  ];
  return suspiciousPatterns.some((p) => p.test(text));
}

// Format TON amount safely
export function formatTon(nanotons: number | string): number {
  return Number(nanotons) / 1e9;
}

export function toNano(ton: number): string {
  return Math.round(ton * 1e9).toString();
}
