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
    console.log('Looking for users file at:', USERS_FILE_PATH);
    
    if (fs.existsSync(USERS_FILE_PATH)) {
      console.log('Users file exists');
      const fileContent = fs.readFileSync(USERS_FILE_PATH, 'utf8');
      try {
        const users = JSON.parse(fileContent);
        console.log(`Found ${users.length} users in the file`);
        return users;
      } catch (parseError) {
        console.error('Error parsing users file:', parseError);
        console.log('File content:', fileContent.substring(0, 100) + '...');
      }
    } else {
      console.error('Users file does not exist at path:', USERS_FILE_PATH);
      console.log('Current directory contents:', fs.readdirSync(process.cwd()));
      if (fs.existsSync(path.join(process.cwd(), 'data'))) {
        console.log('Data directory contents:', fs.readdirSync(path.join(process.cwd(), 'data')));
      }
    }
  } catch (error) {
    console.error('Error reading users file:', error);
  }
  
  console.log('Using default empty users array');
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