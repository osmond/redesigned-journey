'use client'
import { useState } from 'react'
export default function RoomForm() {
  const [pending, setPending] = useState(false)
  return (
    <form className="grid sm:grid-cols-2 gap-3" onSubmit={async (e) => {
      e.preventDefault(); setPending(true)
      const data = Object.fromEntries(new FormData(e.currentTarget).entries())
      const res = await fetch('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      setPending(false); if (res.ok) { (e.currentTarget as HTMLFormElement).reset(); location.reload() } else alert('Failed to create room')
    }}>
      <div><label className="label">Name</label><input className="input" name="name" required /></div>
      <div className="sm:col-span-2 flex justify-end"><button className="btn btn-primary" disabled={pending}>{pending?'Saving…':'Add room'}</button></div>
    </form>
  )
}
