'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import RequireAuth from '@/app/components/RequireAuth'

type Row = {
  id: string
  titulo: string
  descricao: string | null
  preco_cents: number | null
  cidade: string | null
  estado: string | null
  destaque: boolean
  categoria_id: string | null
  categoria?: { nome: string } | null
}

export default function NetworkingList() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [rows, setRows] = useState<Row[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('anuncios')
        .select('id,titulo,descricao,preco_cents,cidade,estado,destaque,categoria_id,categoria:categorias(nome)')
        .eq('publicado', true)
        .eq('aprovado', true)
        .order('destaque', { ascending: false })
        .order('created_at', { ascending: false })
      if (!error && data) setRows(data as unknown as Row[])
      setLoading(false)
    })()
  }, [supabase])

  const filtered = rows.filter(r => {
    const t = (r.titulo + ' ' + (r.descricao ?? '') + ' ' + (r.categoria?.nome ?? '')).toLowerCase()
    return t.includes(q.toLowerCase())
  })

  return (
    <RequireAuth>
      <div className="mx-auto max-w-5xl p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Networking</h1>
          <div className="flex gap-2">
            <a className="underline text-sm" href="/networking/novo">Novo anúncio</a>
            <a className="underline text-sm" href="/networking/meus">Meus anúncios</a>
            <a className="underline text-sm" href="/networking/admin">Moderação</a>
          </div>
        </div>

        <input
          className="border rounded p-2 w-full"
          placeholder="Pesquisar por título, descrição ou categoria…"
          value={q} onChange={e=>setQ(e.target.value)}
        />
        {loading && <p className="text-sm text-slate-500">A carregar…</p>}
        {!loading && filtered.length === 0 && <p className="text-sm text-slate-500">Nenhum anúncio encontrado.</p>}

        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map(a => (
            <div key={a.id} className="border rounded p-3">
              {a.destaque && <span className="text-xs px-2 py-0.5 bg-yellow-100 rounded mr-2">Destaque</span>}
              <h3 className="font-semibold">{a.titulo}</h3>
              <p className="text-sm text-slate-600">{a.descricao}</p>
              <div className="mt-2 text-xs text-slate-500">
                {a.categoria?.nome ? <span>#{a.categoria.nome}</span> : null}
                {(a.cidade || a.estado) && <span className="ml-3">{a.cidade}{a.estado?`/${a.estado}`:''}</span>}
                {typeof a.preco_cents === 'number' && <span className="ml-3">€ {(a.preco_cents/100).toFixed(2)}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </RequireAuth>
  )
}
