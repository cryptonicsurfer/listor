import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

export interface User {
  email: string;
  name: string;
  password: string;
}

// Allowed domains
export const ALLOWED_DOMAINS = ["falkenberg.se", "ecoera.se"];

// Default users in case the JSON file doesn't exist
const DEFAULT_USERS: User[] = [];

// File path for users
const USERS_FILE_PATH = path.join(process.cwd(), 'data', 'users.json');

// Get users from JSON file
export function getUsers(): User[] {
  try {
    if (fs.existsSync(USERS_FILE_PATH)) {
      const fileContent = fs.readFileSync(USERS_FILE_PATH, 'utf8');
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error('Error reading users file:', error);
  }
  
  return DEFAULT_USERS;
}

// Hash password with SHA-256
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Check if email domain is allowed
export function isAllowedDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}

// Authenticate user
export function authenticateUser(email: string, password: string): User | null {
  if (!isAllowedDomain(email)) {
    return null;
  }
  
  const users = getUsers();
  const hashedPassword = hashPassword(password);
  
  const user = users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === hashedPassword
  );
  
  return user || null;
}