'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

export default function Health(){
  const [log,setLog] = useState<string>('')

  const supabase = useMemo(() => supabaseBrowser(), [])

  useEffect(()=>{(async()=>{
    const out: string[] = []

    out.push('ENV:')
    out.push(`URL=${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ok' : 'MISSING'}`)
    out.push(`ANON=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'ok' : 'MISSING'}`)

    // 1) Auth user
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) out.push(`auth.getUser ERROR: ${error.message}`)
      out.push(`auth user: ${user?.id ?? 'null'}`)
    } catch(e: unknown){
      const msg = e instanceof Error ? e.message : String(e)
      out.push(`auth.getUser THROW: ${msg}`)
    }

    // 2) Ping congregacoes
    try {
      const { data, error } = await supabase.from('congregacoes').select('id,nome').limit(1)
      if (error) out.push(`select congregacoes ERROR: ${error.message}`)
      else out.push(`select congregacoes OK: ${data?.length ?? 0} rows`)
    } catch(e: unknown){
      const msg = e instanceof Error ? e.message : String(e)
      out.push(`select congregacoes THROW: ${msg}`)
    }

    setLog(out.join('\n'))
  })()},[supabase])

  return (
    <pre className="whitespace-pre-wrap text-sm p-4 border rounded max-w-3xl mx-auto mt-6">{log}</pre>
  )
}
