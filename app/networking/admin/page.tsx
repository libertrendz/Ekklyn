'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import RequireAuth from '@/app/components/RequireAuth'

type Row = {
  id: string
  titulo: string
  publicado: boolean
  aprovado: boolean
  destaque: boolean
}

export default function AdminNetworking() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setErr(null)
    const { data, error } = await supabase
      .from('anuncios')
      .select('id,titulo,publicado,aprovado,destaque')
      .order('created_at', { ascending: false })
    if (error) { setErr(error.message); setRows([]) }
    else setRows(data as unknown as Row[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const patch = async (id: string, data: Partial<Row>) => {
    const { error } = await supabase.from('anuncios').update(data).eq('id', id)
    if (error) alert(error.message)
    else load()
  }

  return (
    <RequireAuth>
      <div className="mx-auto max-w-5xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Moderação de anúncios</h1>
          <a className="underline text-sm" href="/networking">Voltar</a>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {loading && <p className="text-sm text-slate-500">A carregar…</p>}

        <div className="grid gap-2">
          {rows.map(a => (
            <div key={a.id} className="border rounded p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.titulo}</div>
                  <div className="text-xs text-slate-500">
                    {a.aprovado ? 'Aprovado' : 'Pendente'} · {a.publicado ? 'Publicado' : 'Oculto'} · {a.destaque ? 'Destaque' : '—'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="border rounded px-3 py-1 text-sm" onClick={() => patch(a.id, { aprovado: !a.aprovado })}>
                    {a.aprovado ? 'Desaprovar' : 'Aprovar'}
                  </button>
                  <button className="border rounded px-3 py-1 text-sm" onClick={() => patch(a.id, { publicado: !a.publicado })}>
                    {a.publicado ? 'Ocultar' : 'Publicar'}
                  </button>
                  <button className="border rounded px-3 py-1 text-sm" onClick={() => patch(a.id, { destaque: !a.destaque })}>
                    {a.destaque ? 'Sem destaque' : 'Destacar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!loading && rows.length === 0 && <p className="text-sm text-slate-500">Sem anúncios ainda.</p>}
        </div>
      </div>
    </RequireAuth>
  )
}
