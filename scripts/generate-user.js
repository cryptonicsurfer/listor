const { createHash } = require('crypto');
const fs = require('fs');
const path = require('path');

const USERS_FILE_PATH = path.join(process.cwd(), 'data', 'users.json');

// Hash password with SHA-256
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

// Add or update a user
function updateUser(email, name, password) {
  // Load existing users
  let users = [];
  try {
    if (fs.existsSync(USERS_FILE_PATH)) {
      const fileContent = fs.readFileSync(USERS_FILE_PATH, 'utf8');
      users = JSON.parse(fileContent);
    }
  } catch (error) {
    console.error('Error reading users file:', error);
  }

  // Check if user already exists
  const existingUserIndex = users.findIndex(user => user.email.toLowerCase() === email.toLowerCase());
  const hashedPassword = hashPassword(password);
  
  if (existingUserIndex >= 0) {
    // Update existing user
    users[existingUserIndex] = {
      email,
      name,
      password: hashedPassword
    };
    console.log(`Updated user: ${email}`);
  } else {
    // Add new user
    users.push({
      email,
      name,
      password: hashedPassword
    });
    console.log(`Added new user: ${email}`);
  }

  // Save users to file
  try {
    const dirPath = path.dirname(USERS_FILE_PATH);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2));
    console.log('Users file updated successfully');
  } catch (error) {
    console.error('Error writing users file:', error);
  }
}

// Parse command line arguments
function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 3) {
    console.error('Usage: node generate-user.js <email> <name> <password>');
    process.exit(1);
  }
  
  const [email, name, password] = args;
  updateUser(email, name, password);
}

main();