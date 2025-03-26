# User Data Management

This directory contains user data for authentication.

## Files

- `users.json`: Contains the actual user data with email, name, and hashed passwords.
- `users.template.json`: A template showing the required structure.

## Important Notes

- The `users.json` file is excluded from git via `.gitignore` to prevent sensitive data exposure
- You need to manually create this file on the production server
- Use the provided script to generate or update user entries

## How to Add/Update Users

1. Use the provided script to add or update a user:

```bash
node scripts/generate-user.js <email> <name> <password>
```

For example:

```bash
node scripts/generate-user.js john.doe@falkenberg.se "John Doe" mysecretpassword
```

2. The script will:
   - Create `users.json` if it doesn't exist
   - Add the new user if the email doesn't exist
   - Update the user if the email already exists

## Password Management

- Passwords are hashed using SHA-256 before being stored
- Never store plain text passwords
- The script handles the hashing process automatically

## Security

- Keep the `users.json` file secure and accessible only to authorized personnel
- Regularly update passwords for security
- Ensure that only users with authorized domains (@falkenberg.se, @ecoera.se) are added