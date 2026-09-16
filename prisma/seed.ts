import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const passwordHash = await bcrypt.hash('Tailor@123', 12);
  console.log('🌱 Starting database seed...');

  const tailors = [
    {
      email: 'tailor1@darzihunar.com',
      shopName: 'Royal Stitch Tailors',
      bio: 'Premium custom tailoring for traditional and modern outfits.',
      categories: ['Men', 'Sherwani', 'Kurta', 'Suits'],
      latitude: 19.076,
      longitude: 72.8777,
      verified: true,
      rating: 4.8,
      startingPrice: 500,
      acceptingOrders: true,
    },
    {
      email: 'tailor2@darzihunar.com',
      shopName: 'Elegant Threads',
      bio: 'Specialists in bridal and ethnic custom clothing.',
      categories: ['Women', 'Bridal', 'Lehenga', 'Saree Blouse'],
      latitude: 19.1136,
      longitude: 72.8697,
      verified: true,
      rating: 4.7,
      startingPrice: 500,
      acceptingOrders: true,
    },
    {
      email: 'tailor3@darzihunar.com',
      shopName: 'Perfect Fit Tailors',
      bio: 'Professional menswear tailoring with modern fitting.',
      categories: ['Men', 'Shirts', 'Trousers', 'Suits'],
      latitude: 19.0178,
      longitude: 73.061,
      verified: true,
      rating: 4.6,
      startingPrice: 500,
      acceptingOrders: true,
    },
    {
      email: 'tailor4@darzihunar.com',
      shopName: 'Needle & Thread Studio',
      bio: 'Custom fashion and alterations for every occasion.',
      categories: ['Women', 'Dresses', 'Alterations'],
      latitude: 18.9894,
      longitude: 73.1175,
      verified: false,
      rating: 4.3,
      startingPrice: 500,
      acceptingOrders: true,
    },
    {
      email: 'tailor5@darzihunar.com',
      shopName: 'Classic Cuts',
      bio: 'Traditional tailoring with a modern touch.',
      categories: ['Men', 'Kurta', 'Pathani', 'Alterations'],
      latitude: 19.2183,
      longitude: 72.9781,
      verified: true,
      rating: 4.5,
      startingPrice: 500,
      acceptingOrders: true,
    },
  ];

  for (const tailor of tailors) {
    const user = await prisma.user.upsert({
      where: {
        email: tailor.email,
      },
      update: {
        passwordHash,
        role: 'TAILOR',
      },
      create: {
        email: tailor.email,
        passwordHash,
        role: 'TAILOR',
      },
    });

    await prisma.$executeRaw`
      INSERT INTO "Tailor"
        ("userId", "shopName", "bio", "categories", "location", "verified", "rating", "createdAt", "updatedAt")
      VALUES (
        ${user.id},
        ${tailor.shopName},
        ${tailor.bio},
        ${tailor.categories},
        ST_SetSRID(
          ST_MakePoint(${tailor.longitude}, ${tailor.latitude}),
          4326
        )::geography,
        ${tailor.verified},
        ${tailor.rating},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("userId")
      DO UPDATE SET
        "shopName" = EXCLUDED."shopName",
        "bio" = EXCLUDED."bio",
        "categories" = EXCLUDED."categories",
        "location" = EXCLUDED."location",
        "verified" = EXCLUDED."verified",
        "rating" = EXCLUDED."rating",
        "updatedAt" = CURRENT_TIMESTAMP;
    `;

    console.log(`✅ Seeded: ${tailor.shopName}`);
  }

  console.log('🌱 Database seed completed successfully.');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });