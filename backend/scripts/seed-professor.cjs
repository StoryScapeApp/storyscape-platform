require('dotenv/config');

const argon2 = require('argon2');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../dist/generated/prisma/client.js');

async function main() {
  const email = process.env.SEED_PROFESSOR_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_PROFESSOR_PASSWORD;
  const databaseUrl = process.env.DATABASE_URL;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('SEED_PROFESSOR_EMAIL must be a valid email address');
  }
  if (!password || password.length < 12) {
    throw new Error('SEED_PROFESSOR_PASSWORD must contain at least 12 characters');
  }
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  try {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await prisma.professor.upsert({
      where: { email },
      create: { email, passwordHash },
      update: { passwordHash },
    });
    console.log('Development professor created or updated.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
