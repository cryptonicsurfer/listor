import { createHash } from 'crypto';

export interface User {
  email: string;
  name: string;
  password: string;
}

// Allowed domains
export const ALLOWED_DOMAINS = ["falkenberg.se", "ecoera.se"];

// Hash password with SHA-256
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Check if email domain is allowed
export function isAllowedDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}