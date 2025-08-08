'use client'

import { useEffect } from 'react'
import { initCareQueue } from '@/lib/offlineQueue'

export default function CareEventQueueProvider() {
  useEffect(() => {
    initCareQueue()
  }, [])
  return null
}

