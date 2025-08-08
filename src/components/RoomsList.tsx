'use client';
import { useState } from 'react';
import type { Room, Plant } from '@prisma/client';

type RoomWithPlants = Room & { plants: Plant[] };

export default function RoomsList({ rooms }: { rooms: RoomWithPlants[] }) {
  const [items, setItems] = useState(rooms);
  const [dragId, setDragId] = useState<string | null>(null);

  const onDragStart = (id: string) => () => setDragId(id);
  const onDragOver = (id: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragId === id) return;
    const dragIndex = items.findIndex((r) => r.id === dragId);
    const overIndex = items.findIndex((r) => r.id === id);
    const newItems = [...items];
    const [moved] = newItems.splice(dragIndex, 1);
    newItems.splice(overIndex, 0, moved);
    setItems(newItems);
  };
  const onDragEnd = async () => {
    setDragId(null);
    await fetch('/api/rooms/reorder', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ order: items.map((r, idx) => ({ id: r.id, sortOrder: idx })) }),
    });
  };

  return (
    <ul className="grid sm:grid-cols-2 gap-4">
      {items.map((r) => (
        <li
          key={r.id}
          draggable
          onDragStart={onDragStart(r.id)}
          onDragOver={onDragOver(r.id)}
          onDragEnd={onDragEnd}
          tabIndex={0}
          aria-label={`Room ${r.name}`}
          className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <span>{r.name}</span>
          <span className="ml-2 rounded-full bg-slate-700 text-white text-xs px-2 py-0.5" aria-label="plant count">
            {r.plants.length}
          </span>
        </li>
      ))}
    </ul>
  );
}
