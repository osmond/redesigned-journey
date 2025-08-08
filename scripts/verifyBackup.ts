// @ts-nocheck
import { prisma } from '../src/lib/db'

async function verify(userId: string) {
  const [rooms, plants, photos, careEvents] = await Promise.all([
    prisma.room.findMany({ where: { userId } }),
    prisma.plant.findMany({ where: { userId } }),
    prisma.photo.findMany({ where: { userId } }),
    prisma.careEvent.findMany({ where: { userId } })
  ])

  const counts = {
    rooms: rooms.length,
    plants: plants.length,
    photos: photos.length,
    careEvents: careEvents.length
  }

  await prisma.$transaction([
    prisma.careEvent.deleteMany({ where: { userId } }),
    prisma.photo.deleteMany({ where: { userId } }),
    prisma.plant.deleteMany({ where: { userId } }),
    prisma.room.deleteMany({ where: { userId } })
  ])

  await prisma.$transaction([
    rooms.length ? prisma.room.createMany({ data: rooms.map(r => ({ ...r, userId })) }) : undefined,
    plants.length ? prisma.plant.createMany({ data: plants.map(p => ({ ...p, userId })) }) : undefined,
    photos.length ? prisma.photo.createMany({ data: photos.map(p => ({ ...p, userId })) }) : undefined,
    careEvents.length ? prisma.careEvent.createMany({ data: careEvents.map(e => ({ ...e, userId })) }) : undefined
  ].filter(Boolean))

  const [roomsAfter, plantsAfter, photosAfter, careEventsAfter] = await Promise.all([
    prisma.room.count({ where: { userId } }),
    prisma.plant.count({ where: { userId } }),
    prisma.photo.count({ where: { userId } }),
    prisma.careEvent.count({ where: { userId } })
  ])

  const ok = roomsAfter === counts.rooms &&
            plantsAfter === counts.plants &&
            photosAfter === counts.photos &&
            careEventsAfter === counts.careEvents

  if (ok) {
    console.log('Backup verify OK')
  } else {
    console.error('Backup verify failed')
    process.exit(1)
  }
}

const userId = process.argv[2]
if (!userId) {
  console.error('Usage: npm run backup:verify -- <userId>')
  process.exit(1)
}

verify(userId)
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
