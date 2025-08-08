'use client'
import { useState } from 'react'
import type { Room, Plant } from '@prisma/client'

interface RoomWithPlants extends Room {
  plants: Plant[]
}

export default function RoomsList({ rooms }: { rooms: RoomWithPlants[] }) {
  const [items, setItems] = useState(rooms)
  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString())
  }
  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault()
  }
  const handleDrop = async (e: React.DragEvent<HTMLLIElement>, index: number) => {
    e.preventDefault()
    const from = Number(e.dataTransfer.getData('text/plain'))
    if (Number.isNaN(from) || from === index) return
    const updated = Array.from(items)
    const [moved] = updated.splice(from, 1)
    updated.splice(index, 0, moved)
    setItems(updated)
    await fetch('/api/rooms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: updated.map((r, i) => ({ id: r.id, sortOrder: i })) }),
    })
  }
  return (
    <ul className="grid sm:grid-cols-2 gap-4">
      {items.map((r, idx) => (
        <li
          key={r.id}
          draggable
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, idx)}
          className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 cursor-move"
        >
          <div className="flex items-center justify-between">
            <div className="font-medium">{r.name}</div>
            <span className="badge">{r.plants.length}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}
