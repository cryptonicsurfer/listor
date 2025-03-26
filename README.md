# Branschlista - Falkenberg

A Next.js application for managing branch lists within Falkenberg municipality.

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm

### Setting Up Authentication

This application uses a file-based authentication system with pre-registered users. Before running the application, you need to set up the user data:

1. Create the users.json file (if it doesn't exist):

```bash
# Use the provided script
node scripts/generate-user.js john.doe@falkenberg.se "John Doe" mysecretpassword
```

2. Or manually copy the template:

```bash
cp data/users.template.json data/users.json
```

Then edit the file with your users and their hashed passwords. See `data/README.md` for more details.

### Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser and login with one of the pre-registered users.

### Authentication System

- Users must have an email from an allowed domain (@falkenberg.se, @ecoera.se)
- Passwords are stored as SHA-256 hashes in data/users.json (not included in the repository)
- The users.json file must be manually created on the production server

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
