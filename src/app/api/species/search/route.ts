import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type SuggestItem = { id?: string; name: string; description?: string }

async function wfoSuggest(prefix: string): Promise<SuggestItem[]> {
  const url = `https://list.worldfloraonline.org/reconcile?suggest=entity&prefix=${encodeURIComponent(prefix)}`
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) return []
  const j = await r.json()
  const arr: SuggestItem[] = j?.result || []
  // normalize: { id, name, description }
  return arr.map((x: any) => ({ id: x.id, name: x.name, description: x.description }))
}

async function gbifSuggest(q: string): Promise<SuggestItem[]> {
  const url = `https://api.gbif.org/v1/species/suggest?q=${encodeURIComponent(q)}&limit=8`
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) return []
  const arr = await r.json()
  return (arr || []).map((x: any) => ({
    id: String(x.key),
    name: x.scientificName || x.canonicalName || x.species || x.genus || x.family,
    description: x.rank || x.kingdom,
  }))
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  if (!q) return NextResponse.json({ result: [] })

  // quick cache by prefix
  const cached = await prisma.species.findMany({
    where: { scientificName: { startsWith: q, mode: 'insensitive' } },
    take: 8,
  })
  let items: SuggestItem[] = cached.map((s) => ({ id: s.wfoId || String(s.gbifKey) || s.id, name: s.scientificName, description: s.commonName || s.family || undefined }))

  if (items.length < 5) {
    const wfo = await wfoSuggest(q).catch(() => [] as SuggestItem[])
    const gbif = await gbifSuggest(q).catch(() => [] as SuggestItem[])
    items = [...items, ...wfo, ...gbif]
      .filter((x) => x?.name)
      .slice(0, 10)
  }

  return NextResponse.json({ result: items })
}
