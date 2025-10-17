'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

type UsuarioRow = { id: string; igreja_id: string | null }

export default function Health(){
  const [log,setLog] = useState<string>('')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '(missing)'
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'ok' : 'MISSING'
  const supabase = useMemo(() => supabaseBrowser(), [])

  useEffect(()=>{(async()=>{
    const out: string[] = []
    out.push(`SUPABASE_URL: ${url}`)
    out.push(`ANON_KEY: ${anon}`)

    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) out.push(`auth.getUser ERROR: ${error.message}`)
      out.push(`auth user: ${user?.id ?? 'null'}`)

      // 1) Tenta achar o mesmo usuário em public.usuarios (neste projeto)
      if (user?.id) {
        const { data: urows, error: uerr } = await supabase
          .from('usuarios')
          .select('id,igreja_id')
          .eq('id', user.id)
          .limit(1)
        if (uerr) out.push(`select usuarios ERROR: ${uerr.message}`)
        const u = (urows?.[0] as UsuarioRow | undefined) || null
        out.push(`usuarios row: ${u ? 'FOUND' : 'NOT FOUND'} | igreja_id: ${u?.igreja_id ?? 'null'}`)

        // 2) Ping congregacoes (sem head; vamos listar)
try {
  const { data, error } = await supabase
    .from('congregacoes')
    .select('id,nome')
    .order('nome')
    .limit(10)

  if (error) {
    out.push(`select congregacoes ERROR: ${error.message}`)
  } else {
    out.push(`congregacoes: ${data?.length ?? 0} rows`)
    if (data && data.length) {
      out.push(`nomes: ${data.map(r => r.nome).join(', ')}`)
    }
  }
} catch(e: unknown){
  const msg = e instanceof Error ? e.message : String(e)
  out.push(`select congregacoes THROW: ${msg}`)
}


    setLog(out.join('\n'))
  })()},[supabase, url, anon])

  return (
    <pre className="whitespace-pre-wrap text-sm p-4 border rounded max-w-3xl mx-auto mt-6">{log}</pre>
  )
}
