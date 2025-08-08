import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const argUserId = process.argv[2];
  let userId = argUserId;

  if (!userId) {
    const existing = await prisma.room.findFirst({ select: { userId: true } });
    if (existing) {
      userId = existing.userId;
      console.log(`Using existing userId: ${userId}`);
    } else {
      throw new Error('Please pass a userId: npm run seed -- <userId>');
    }
  }

  // Rooms
  const living = await prisma.room.upsert({
    where: { id: 'seed-living' },
    update: { userId },
    create: { id: 'seed-living', userId, name: 'Living Room', sortOrder: 0 },
  });

  // Plants
  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  await prisma.plant.createMany({
    data: [
      {
        id: 'seed-monstera',
        userId,
        name: 'Monstera',
        commonName: 'Swiss Cheese Plant',
        roomId: living.id,
        lightLevel: 'BRIGHT_INDIRECT',
        potDiameterCm: 20,
        wateringIntervalDays: 7,
        fertilizingIntervalDays: 30,
        lastWateredAt: fiveDaysAgo, // will make “Upcoming” non-empty soon
      },
      {
        id: 'seed-snake',
        userId,
        name: 'Sansevieria trifasciata',
        commonName: 'Snake Plant',
        roomId: living.id,
        lightLevel: 'LOW',
        potDiameterCm: 15,
        wateringIntervalDays: 14,
        fertilizingIntervalDays: 60,
        lastWateredAt: fiveDaysAgo,
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seeded 🌱');
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
