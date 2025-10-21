'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import RequireAuth from '@/app/components/RequireAuth'

type Row = {
  id: string
  titulo: string
  publicado: boolean
  aprovado: boolean
  destaque: boolean
}

export default function MeusAnuncios() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('anuncios')
      .select('id,titulo,publicado,aprovado,destaque')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
    if (!error && data) setRows(data as unknown as Row[])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const togglePublicado = async (id: string, val: boolean) => {
    const { error } = await supabase.from('anuncios').update({ publicado: val }).eq('id', id)
    if (!error) load()
  }

  const del = async (id: string) => {
    if (!confirm('Apagar este anúncio?')) return
    const { error } = await supabase.from('anuncios').delete().eq('id', id)
    if (!error) load()
  }

  return (
    <RequireAuth>
      <div className="mx-auto max-w-4xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Meus anúncios</h1>
          <a className="underline text-sm" href="/networking/novo">Novo</a>
        </div>

        {loading && <p className="text-sm text-slate-500">A carregar…</p>}
        {!loading && rows.length === 0 && <p className="text-sm text-slate-500">Você ainda não criou anúncios.</p>}

        <div className="grid gap-2">
          {rows.map(a => (
            <div key={a.id} className="border rounded p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.titulo}</div>
                  <div className="text-xs text-slate-500">
                    {a.aprovado ? 'Aprovado' : 'Aguardando aprovação'} · {a.publicado ? 'Publicado' : 'Oculto'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="border rounded px-3 py-1 text-sm"
                    onClick={() => togglePublicado(a.id, !a.publicado)}>
                    {a.publicado ? 'Ocultar' : 'Publicar'}
                  </button>
                  <button className="border rounded px-3 py-1 text-sm" onClick={() => del(a.id)}>Apagar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </RequireAuth>
  )
}
