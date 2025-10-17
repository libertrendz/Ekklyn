'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

type UsuarioRow = { id: string; igreja_id: string | null }
type CongregacaoRow = { id: string; nome: string }

export default function Health() {
  const [log, setLog] = useState<string>('')

  // infos de env (client-side)
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '(missing)'
  const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'ok' : 'MISSING'

  // instancia estável do client
  const supabase = useMemo(() => supabaseBrowser(), [])

  useEffect(() => {
    ;(async () => {
      const out: string[] = []
      out.push(`SUPABASE_URL: ${SUPABASE_URL}`)
      out.push(`ANON_KEY: ${ANON}`)

      // 1) usuário autenticado
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) out.push(`auth.getUser ERROR: ${error.message}`)
        out.push(`auth user: ${user?.id ?? 'null'}`)

        // 2) verificar se existe linha correspondente em "usuarios"
        if (user?.id) {
          const { data: urows, error: uerr } = await supabase
            .from('usuarios')
            .select('id,igreja_id')
            .eq('id', user.id)
            .limit(1)

          if (uerr) {
            out.push(`select usuarios ERROR: ${uerr.message}`)
          } else {
            const u: UsuarioRow | undefined = (urows as UsuarioRow[] | null)?.[0]
            out.push(`usuarios row: ${u ? 'FOUND' : 'NOT FOUND'} | igreja_id: ${u?.igreja_id ?? 'null'}`)

            // 3) listar congregações visíveis via RLS (nomes)
            try {
              const { data: crows, error: cerr } = await supabase
                .from('congregacoes')
                .select('id,nome')
                .order('nome')
                .limit(10)

              if (cerr) {
                out.push(`select congregacoes ERROR: ${cerr.message}`)
              } else {
                const list = (crows as CongregacaoRow[]) || []
                out.push(`congregacoes: ${list.length} rows`)
                if (list.length) out.push(`nomes: ${list.map(r => r.nome).join(', ')}`)
              }
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : String(e)
              out.push(`select congregacoes THROW: ${msg}`)
            }
          }
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        out.push(`THROW: ${msg}`)
      }

      setLog(out.join('\n'))
    })()
  }, [supabase, SUPABASE_URL, ANON])

  return (
    <pre className="whitespace-pre-wrap text-sm p-4 border rounded max-w-3xl mx-auto mt-6">
      {log}
    </pre>
  )
}
