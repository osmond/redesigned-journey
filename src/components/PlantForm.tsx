'use client'
import { useEffect, useMemo, useState } from 'react'
import { debounce } from './util'

type Room = { id: string; name: string }
type Suggest = { id?: string; name: string; description?: string }
type Hints = {
  suggestions: {
    waterMl: number | null
    wateringIntervalDays: number
    fertilizingIntervalDays: number
    fertilizerStrengthHint: string
  }
}

export default function PlantForm() {
  const [rooms, setRooms] = useState<Room[]>([])
  useEffect(() => { fetch('/api/rooms').then(r=>r.json()).then(setRooms) }, [])

  // basic form state (uncontrolled inputs + embellishments)
  const [speciesQuery, setSpeciesQuery] = useState('')
  const [speciesResults, setSpeciesResults] = useState<Suggest[]>([])
  const [noMatches, setNoMatches] = useState(false)
  const [selectedSpecies, setSelectedSpecies] = useState<{ scientific?: string, common?: string, wfoId?: string } | null>(null)
  const [hints, setHints] = useState<Hints['suggestions'] | null>(null)
  const [noHintMatches, setNoHintMatches] = useState(false)
  const [pending, setPending] = useState(false)
  const [waterInterval, setWaterInterval] = useState(7)
  const [fertInterval, setFertInterval] = useState(30)

  const fetchSuggestions = useMemo(() => debounce(async (q: string) => {
    if (!q || q.length < 2) { setSpeciesResults([]); setNoMatches(false); return }
    const j = await fetch(`/api/species/search?q=${encodeURIComponent(q)}`).then(r=>r.json())
    const res = j.result || []
    setSpeciesResults(res)
    setNoMatches(res.length === 0)
  }, 250), [])

  async function getHints() {
    setNoHintMatches(false)
    const form = new FormData(document.getElementById('plant-form') as HTMLFormElement)
    if (!selectedSpecies?.scientific && !(form.get('species') as string)) {
      alert('Please enter a species first')
      return
    }
    const body = {
      scientificName: (selectedSpecies?.scientific || (form.get('species') as string) || '') || undefined,
      commonName: form.get('commonName') || undefined,
      lightLevel: (form.get('lightLevel') as string) || undefined,
      potDiameterCm: Number(form.get('potDiameterCm') || '') || undefined,
      potHeightCm: Number(form.get('potHeightCm') || '') || undefined,
      potMaterial: (form.get('potMaterial') as string) || undefined,
    }
    const j = await fetch('/api/species/hints', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r=>r.json())
    if (j?.suggestions) {
      setHints(j.suggestions)
      if (typeof j.suggestions.wateringIntervalDays === 'number') {
        setWaterInterval(j.suggestions.wateringIntervalDays)
      }
      if (typeof j.suggestions.fertilizingIntervalDays === 'number') {
        setFertInterval(j.suggestions.fertilizingIntervalDays)
      }
    } else {
      setHints(null)
      setNoHintMatches(true)
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setPending(true)
    const data = Object.fromEntries(new FormData(e.currentTarget).entries())

    // If we have hints and user wants them, merge
    if ((e.nativeEvent as any).submitter?.value === 'apply-suggestions' && hints) {
      if (hints.waterMl) data['recommendedWaterMl'] = String(hints.waterMl)
    }

    if (selectedSpecies?.scientific) data['species'] = selectedSpecies.scientific
    if (selectedSpecies?.wfoId) data['speciesWfoId'] = selectedSpecies.wfoId

    const res = await fetch('/api/plants', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setPending(false)
    if (res.ok) { (e.currentTarget as HTMLFormElement).reset(); setHints(null); setSelectedSpecies(null); setSpeciesResults([]); setSpeciesQuery(''); location.reload() }
    else alert('Failed to create plant')
  }

  return (
    <form id="plant-form" onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-3">
      <div><label className="label">Display name</label><input className="input" name="name" required placeholder="e.g., Living Room Monstera" /></div>

      <div className="sm:col-span-2 relative">
        <label className="label">Species (scientific)</label>
        <input
          className="input"
          name="species"
          value={speciesQuery}
          onChange={(e) => { setSpeciesQuery(e.target.value); fetchSuggestions(e.target.value) }}
          placeholder="Start typing: Monstera deliciosa …"
        />
        {speciesResults.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-h-60 overflow-auto">
            {speciesResults.map((s, i) => (
              <button
                type="button"
                key={i}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => { setSelectedSpecies({ scientific: s.name, wfoId: s.id }); setSpeciesQuery(s.name); setSpeciesResults([]); }}
              >
                <div className="font-medium">{s.name}</div>
                {s.description ? <div className="text-xs text-slate-500">{s.description}</div> : null}
              </button>
            ))}
          </div>
        )}
        {noMatches && speciesResults.length === 0 && speciesQuery.length >= 2 && (
          <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-sm">No matches</div>
        )}
        {selectedSpecies?.scientific ? (
          <div className="mt-1 text-xs text-slate-500">Selected: {selectedSpecies.scientific}</div>
        ) : null}
      </div>

      <div><label className="label">Common name (optional)</label><input className="input" name="commonName" placeholder="Swiss cheese plant" /></div>

      <div><label className="label">Room</label>
        <select className="input" name="roomId">
          <option value="">—</option>
          {rooms.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
        </select>
      </div>

      <div><label className="label">Light</label>
        <select className="input" name="lightLevel" defaultValue="">
          <option value="">—</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="BRIGHT_INDIRECT">Bright indirect</option>
          <option value="FULL_SUN">Full sun</option>
        </select>
      </div>

      <div><label className="label">Pot diameter (cm)</label><input className="input" name="potDiameterCm" type="number" min="2" step="0.1" /></div>
      <div><label className="label">Pot height (cm)</label><input className="input" name="potHeightCm" type="number" min="2" step="0.1" /></div>
      <div><label className="label">Pot material</label>
        <select className="input" name="potMaterial" defaultValue="">
          <option value="">—</option>
          <option value="CLAY">Unglazed clay</option>
          <option value="PLASTIC">Plastic</option>
          <option value="CERAMIC">Ceramic/glazed</option>
        </select>
      </div>

      <div><label className="label">Water every (days)</label><input className="input" name="wateringIntervalDays" type="number" min="1" value={waterInterval} onChange={e=>setWaterInterval(Number(e.target.value))} /></div>
      <div><label className="label">Fertilize every (days)</label><input className="input" name="fertilizingIntervalDays" type="number" min="1" value={fertInterval} onChange={e=>setFertInterval(Number(e.target.value))} /></div>

      <div className="sm:col-span-2 flex gap-2">
        <button type="button" className="btn" onClick={getHints}>Get suggestions</button>
        <button type="submit" className="btn btn-primary" value="apply-suggestions" disabled={pending || !hints}>
          {pending ? 'Saving…' : 'Use suggestions & Save'}
        </button>
        <button type="submit" className="btn" disabled={pending}>{pending ? 'Saving…' : 'Save (as entered)'}</button>
      </div>

      {hints && (
        <div className="sm:col-span-2 text-sm text-slate-600 dark:text-slate-300">
          <div className="font-medium mb-1">Suggested defaults</div>
          <ul className="list-disc ml-5 space-y-1">
            <li>Water ~{hints.waterMl ? `${hints.waterMl} mL` : '—'} per watering</li>
            <li>Watering every {hints.wateringIntervalDays} days</li>
            <li>Fertilize every {hints.fertilizingIntervalDays} days ({hints.fertilizerStrengthHint})</li>
          </ul>
        </div>
      )}
      {noHintMatches && !hints && (
        <div className="sm:col-span-2 text-sm text-slate-600 dark:text-slate-300">No matches</div>
      )}

      <div className="sm:col-span-2"><label className="label">Notes</label><textarea className="input" name="notes" rows={3} /></div>
    </form>
  )
}

/* tiny debounce helper */
