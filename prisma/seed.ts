import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Rooms
  const living = await prisma.room.upsert({
    where: { id: 'seed-living' },
    update: {},
    create: { id: 'seed-living', name: 'Living Room', sortOrder: 0 },
  });

  // Plants
  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  await prisma.plant.createMany({
    data: [
      {
        id: 'seed-monstera',
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
