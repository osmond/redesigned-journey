'use client'

import { useEffect, useState } from 'react'

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferred(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!deferred) return
    deferred.prompt()
    await deferred.userChoice
    setVisible(false)
    setDeferred(null)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded shadow">
      <p className="mb-2 text-sm">Install Plant Care?</p>
      <div className="flex gap-2">
        <button className="btn bg-emerald-600 text-white" onClick={install}>Install</button>
        <button className="btn bg-slate-300 dark:bg-slate-700" onClick={() => setVisible(false)}>Dismiss</button>
      </div>
    </div>
  )
}

