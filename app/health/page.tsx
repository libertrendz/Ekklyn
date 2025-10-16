'use client'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

export default function Health(){
  const [log,setLog] = useState<string>('')

  useEffect(()=>{(async()=>{
    const out: string[] = []

    // 1) Env
    out.push('ENV:')
    out.push(`URL=${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ok' : 'MISSING'}`)
    out.push(`ANON=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'ok' : 'MISSING'}`)

    // 2) Auth user
    try {
      const supabase = supabaseBrowser()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) out.push(`auth.getUser ERROR: ${error.message}`)
      out.push(`auth user: ${user?.id ?? 'null'}`)
    } catch(e:any){
      out.push(`auth.getUser THROW: ${e?.message||String(e)}`)
    }

    // 3) Ping uma tabela “aberta” (congregacoes) só pra ver RLS
    try {
      const supabase = supabaseBrowser()
      const { data, error } = await supabase.from('congregacoes').select('id,nome').limit(1)
      if (error) out.push(`select congregacoes ERROR: ${error.message}`)
      else out.push(`select congregacoes OK: ${data?.length??0} rows`)
    } catch(e:any){
      out.push(`select congregacoes THROW: ${e?.message||String(e)}`)
    }

    setLog(out.join('\n'))
  })()},[])

  return (
    <pre className="whitespace-pre-wrap text-sm p-4 border rounded max-w-3xl mx-auto mt-6">{log}</pre>
  )
}
