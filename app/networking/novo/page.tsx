'use client'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabaseBrowser } from '@/lib/supabase/client'
import RequireAuth from '@/app/components/RequireAuth'
import { useRouter } from 'next/navigation'

const schema = z.object({
  titulo: z.string().min(3, 'Informe um título'),
  descricao: z.string().optional(),
  categoria_id: z.string().uuid().nullable(),
  preco: z.string().optional(),       // em euros, ex: "12.50"
  whatsapp: z.string().optional(),    // E.164 opcional
  cidade: z.string().optional(),
  estado: z.string().optional(),
  publicar: z.boolean().default(false),
})
type FormData = z.infer<typeof schema>

type Categoria = { id: string; nome: string }
type Usuario = { id: string; igreja_id: string }

export default function NovoAnuncio() {
  const router = useRouter()
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [igrejaId, setIgrejaId] = useState<string>()
  const [info, setInfo] = useState<string>('')

  const { register, handleSubmit, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/sign-in'); return }

      // igreja_id via usuarios
      const { data: urows } = await supabase
        .from('usuarios')
        .select('id,igreja_id')
        .eq('id', user.id)
        .limit(1)
      const u = (urows?.[0] as Usuario | undefined)
      if (!u?.igreja_id) { setInfo('Erro: sem igreja_id no perfil'); return }
      setIgrejaId(u.igreja_id)

      const { data: cats } = await supabase
        .from('categorias')
        .select('id,nome')
        .order('nome')
      setCategorias((cats as Categoria[]) || [])
    })()
  }, [router, supabase])

  const onSubmit = async (v: FormData) => {
    if (!igrejaId) return
    const preco_cents = v.preco ? Math.round(parseFloat(v.preco.replace(',', '.')) * 100) : null
    const whatsapp = v.whatsapp ? v.whatsapp.replace(/\s/g, '') : null

    const { error } = await supabase.from('anuncios').insert({
      igreja_id: igrejaId,
      usuario_id: (await supabase.auth.getUser()).data.user?.id!,
      titulo: v.titulo,
      descricao: v.descricao ?? null,
      categoria_id: v.categoria_id ?? null,
      preco_cents,
      whatsapp,
      cidade: v.cidade ?? null,
      estado: v.estado ?? null,
      publicado: v.publicar ?? false,
      aprovado: false,         // admin aprova no painel
      destaque: false
    })
    if (error) { alert(error.message); return }
    alert('Anúncio criado! Aguarde aprovação.')
    router.replace('/networking/meus')
  }

  return (
    <RequireAuth>
      <div className="mx-auto max-w-3xl p-4 space-y-4">
        <h1 className="text-xl font-semibold">Novo anúncio</h1>
        {!!info && <p className="text-xs text-slate-500">diag: {info}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
          <label className="grid gap-1">
            <span>Título</span>
            <input className="border rounded p-2" {...register('titulo')} />
            {errors.titulo && <small className="text-red-600">{errors.titulo.message}</small>}
          </label>

          <label className="grid gap-1">
            <span>Descrição</span>
            <textarea className="border rounded p-2" rows={4} {...register('descricao')} />
          </label>

          <label className="grid gap-1">
            <span>Categoria</span>
            <select className="border rounded p-2" {...register('categoria_id')}>
              <option value="">Selecionar…</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span>Preço (EUR)</span>
              <input className="border rounded p-2" placeholder="12.50" {...register('preco')} />
            </label>
            <label className="grid gap-1">
              <span>WhatsApp (E.164)</span>
              <input className="border rounded p-2" placeholder="+3519XXXXXXXX" {...register('whatsapp')} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span>Cidade</span>
              <input className="border rounded p-2" {...register('cidade')} />
            </label>
            <label className="grid gap-1">
              <span>Estado</span>
              <input className="border rounded p-2" {...register('estado')} />
            </label>
          </div>

          <label className="inline-flex items-center gap-2">
            <input type="checkbox" {...register('publicar')} />
            <span>Publicar após criar (ficará aguardando aprovação)</span>
          </label>

          <button className="bg-slate-900 text-white rounded p-2 w-min">Criar</button>
        </form>
      </div>
    </RequireAuth>
  )
}
