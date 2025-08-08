import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const USER_ID = 'seed-user';

async function main() {
  // Rooms
  const living = await prisma.room.upsert({
    where: { id: 'seed-living' },
    update: {},
    create: { id: 'seed-living', name: 'Living Room', userId: USER_ID },
  });

  // Plants
  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  await prisma.plant.createMany({
    data: [
      {
        id: 'seed-monstera',
        userId: USER_ID,
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
        userId: USER_ID,
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
