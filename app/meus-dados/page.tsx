'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabaseBrowser } from '@/lib/supabase/client'

const schema = z.object({
  nome: z.string().min(2, 'Informe nome'),
  telefone_local: z.string().optional(),
  codigo_pais: z.enum(['351','55']).default('351'),
  congregacao_id: z.string().uuid().nullable(),
})
type FormData = z.infer<typeof schema>

export default function MeusDadosPage(){
  const supabase = supabaseBrowser()
  const [membroId,setMembroId]=useState<string>()
  const [congregacoes,setCongregacoes]=useState<{id:string;nome:string}[]>([])
  const {register,handleSubmit,reset,watch,setValue,formState:{errors}}=
    useForm<FormData>({resolver:zodResolver(schema)})

  useEffect(()=>{(async()=>{
    const { data: { user } } = await supabase.auth.getUser()
    if(!user){ return }

    const { data: membro } = await supabase
      .from('membros')
      .select('id,nome,telefone,congregacao_id')
      .eq('usuario_id', user.id)
      .single()
    if(membro){
      setMembroId(membro.id)
      const tel = (membro as any).telefone as string | null
      const isPT = tel?.startsWith('+351')
      const isBR = tel?.startsWith('+55')
      reset({
        nome: (membro as any).nome || '',
        codigo_pais: isBR ? '55' : '351',
        telefone_local: isPT?tel?.slice(4): isBR?tel?.slice(3):'',
        congregacao_id: (membro as any).congregacao_id ?? null,
      })
    }

    const { data: rows } = await supabase
      .from('congregacoes')
      .select('id,nome')
      .order('nome')
    setCongregacoes(rows||[])
  })()},[])

  const onSubmit = async (values: FormData) => {
    if(!membroId) return
    const full = values.telefone_local? `+${values.codigo_pais}${values.telefone_local.replace(/\D/g,'')}` : null
    const re = /^(\+3519\d{8}|\+55\d{10,11})$/
    if(full && !re.test(full)){
      alert('Telefone inválido. Use +3519XXXXXXXX (PT) ou +55 com DDD (BR).')
      return
    }
    const { error } = await supabase
      .from('membros')
      .update({ nome: values.nome, telefone: full, congregacao_id: values.congregacao_id })
      .eq('id', membroId)
    if(error){ alert(error.message); return }
    alert('Dados guardados!')
  }

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <h2 className="text-xl font-semibold">Meus dados</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 max-w-xl">
        <label className="grid gap-1">
          <span>Nome</span>
          <input className="border rounded p-2" {...register('nome')} />
          {errors.nome && <small className="text-red-600">{errors.nome.message}</small>}
        </label>

        <div className="grid gap-1">
          <span>Telefone</span>
          <div className="flex gap-2">
            <select className="border rounded p-2" {...register('codigo_pais')}>
              <option value="351">+351 (PT)</option>
              <option value="55">+55 (BR)</option>
            </select>
            <input className="border rounded p-2 flex-1" placeholder="9XXXXXXXX / 11XXXXXXXXX" {...register('telefone_local')} />
          </div>
        </div>

        <label className="grid gap-1">
          <span>Congregação</span>
          <select className="border rounded p-2" value={watch('congregacao_id')||''}
            onChange={(e)=>setValue('congregacao_id', e.target.value||null)}>
            <option value="">Selecionar…</option>
            {congregacoes.map(c=> <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </label>

        <button className="bg-slate-900 text-white rounded p-2">Guardar</button>
      </form>
    </div>
  )
}
