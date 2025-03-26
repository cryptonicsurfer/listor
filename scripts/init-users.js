const { createHash } = require('crypto');
const fs = require('fs');
const path = require('path');

const USERS_FILE_PATH = path.join(process.cwd(), 'data', 'users.json');

// Hash password with SHA-256
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

// Default users to create
const DEFAULT_USERS = [
  { email: "emma.carlstrom@falkenberg.se", name: "Emma Carlström", password: "password1" },
  { email: "madeleine.nemstrand@falkenberg.se", name: "Madeleine Nemstrand", password: "password2" },
  { email: "mattias.fornell@falkenberg.se", name: "Mattias Fornell", password: "password3" },
  { email: "helena.lind@falkenberg.se", name: "Helena Lind", password: "password4" },
  { email: "linda.bengtsson3@falkenberg.se", name: "Linda Bengtsson", password: "password5" },
  { email: "elin.rehn@falkenberg.se", name: "Elin Rehn", password: "password6" },
  { email: "paul.klinteby@falkenberg.se", name: "Paul Klinteby", password: "password7" },
  { email: "frej.andreassen@falkenberg.se", name: "Frej Andreassen", password: "password8" },
  { email: "david.andersson@ecoera.se", name: "David Andersson", password: "password9" },
  { email: "johanna.mars@falkenberg.se", name: "Johanna Mars", password: "password10" }
];

// Initialize the users file with default users
function initUsers() {
  // Hash passwords
  const users = DEFAULT_USERS.map(user => ({
    email: user.email,
    name: user.name,
    password: hashPassword(user.password)
  }));

  // Save users to file
  try {
    const dirPath = path.dirname(USERS_FILE_PATH);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2));
    console.log('Users file created successfully');
    
    console.log('\nInitialized users with the following credentials:');
    DEFAULT_USERS.forEach(user => {
      console.log(`${user.name} (${user.email}): ${user.password}`);
    });
    console.log('\nWARNING: For security, please change these passwords in production!');
  } catch (error) {
    console.error('Error writing users file:', error);
  }
}

// Check if users file already exists
if (fs.existsSync(USERS_FILE_PATH)) {
  console.log(`Users file already exists at: ${USERS_FILE_PATH}`);
  console.log('If you want to reinitialize it, delete the file first.');
} else {
  initUsers();
}