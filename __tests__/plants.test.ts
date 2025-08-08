import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
  headers: () => new Headers(),
}))

let mockSession: any
let findMany: any

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getSession: async () => ({ data: { session: mockSession } }) },
  }),
}))

vi.mock('@/lib/db', () => ({
  prisma: { plant: { findMany: (...args: any[]) => findMany(...args) } },
}))

beforeEach(() => {
  vi.resetModules()
  mockSession = null
  findMany = vi.fn()
})

describe('plants API auth', () => {
  it('returns 401 without session', async () => {
    const { GET } = await import('../src/app/api/plants/route')
    const res = await GET()
    expect(res.status).toBe(401)
    expect(findMany).not.toHaveBeenCalled()
  })

  it('scopes plants by user', async () => {
    mockSession = { user: { id: 'user1' } }
    findMany.mockResolvedValue([])
    const { GET } = await import('../src/app/api/plants/route')
    await GET()
    expect(findMany).toHaveBeenCalledWith({
      where: { userId: 'user1' },
      orderBy: { createdAt: 'desc' },
    })
  })
})
