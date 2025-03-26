import fs from 'fs';
import path from 'path';
import { User, hashPassword } from '@/lib/auth';

// File path for users
const USERS_FILE_PATH = path.join(process.cwd(), 'data', 'users.json');

// Default users in case the JSON file doesn't exist
const DEFAULT_USERS: User[] = [];

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

// Authenticate user
export function authenticateUser(email: string, password: string): User | null {
  const users = getUsers();
  
  if (users.length === 0) {
    console.error('No users found in database');
    return null;
  }
  
  console.log(`Found ${users.length} users in database`);
  
  const hashedPassword = hashPassword(password);
  console.log('Hashed password:', hashedPassword);
  
  // Find user with matching email (case insensitive)
  const userWithEmail = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!userWithEmail) {
    console.log('No user found with email:', email);
    return null;
  }
  
  console.log('Found user with matching email');
  console.log('Comparing password hashes:');
  console.log('Input password hash :', hashedPassword);
  console.log('Stored password hash:', userWithEmail.password);
  
  // Check if passwords match
  const passwordMatches = userWithEmail.password === hashedPassword;
  console.log('Password match result:', passwordMatches);
  
  return passwordMatches ? userWithEmail : null;
}