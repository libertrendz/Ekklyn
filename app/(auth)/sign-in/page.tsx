'use client'
import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignInPage(){
  const supabase = supabaseBrowser()
  const router = useRouter()
  const [email,setEmail] = useState('contato@libertrendz.eu')
  const [password,setPassword] = useState('') // a mesma definida no Auth
  const [err,setErr] = useState<string|undefined>()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(undefined)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setErr(error.message); return }
    router.push('/meus-dados')
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-semibold mb-4">Entrar</h1>
      <form onSubmit={onSubmit} className="grid gap-3">
        <input className="border rounded p-2" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
        <input className="border rounded p-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Senha" />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="bg-slate-900 text-white rounded p-2">Entrar</button>
      </form>
    </div>
  )
}
