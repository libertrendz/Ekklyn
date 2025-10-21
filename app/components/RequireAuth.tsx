'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [ok, setOk] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/sign-in')
        return
      }
      setOk(true)
    })()
  }, [router, supabase])

  if (!ok) return <div className="p-6 text-sm text-slate-500">A validar sessão…</div>
  return <>{children}</>
}
