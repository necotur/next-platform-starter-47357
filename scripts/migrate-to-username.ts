
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration to username system...');

  // Step 1: Add username column (nullable first)
  await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS username TEXT`;
  
  // Step 2: Make email nullable
  await prisma.$executeRaw`ALTER TABLE "User" ALTER COLUMN email DROP NOT NULL`;
  
  // Step 3: Add phoneNumber column for doctors
  await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT`;
  
  // Step 4: Get all users
  const users = await prisma.$queryRaw<Array<{id: string, email: string, username: string | null}>>`
    SELECT id, email, username FROM "User"
  `;
  
  console.log(`Found ${users.length} users to migrate`);
  
  // Step 5: For each user without username, generate one from email
  for (const user of users) {
    if (!user.username && user.email) {
      const emailPrefix = user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
      const randomSuffix = Math.random().toString(36).substring(7);
      const username = `${emailPrefix}_${randomSuffix}`;
      
      await prisma.$executeRaw`
        UPDATE "User" 
        SET username = ${username}
        WHERE id = ${user.id}
      `;
      
      console.log(`✓ User ${user.email} -> username: ${username}`);
    }
  }
  
  // Step 6: Make username required with unique constraint
  await prisma.$executeRaw`ALTER TABLE "User" ALTER COLUMN username SET NOT NULL`;
  await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"(username)`;
  
  // Step 7: Make email unique (it should already be unique, but let's ensure it)
  await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"(email) WHERE email IS NOT NULL`;
  
  console.log('Migration completed successfully!');
  console.log('\nNote: Please inform users of their new usernames.');
  console.log('They can find them in their profile settings or contact support.');
}

main()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
