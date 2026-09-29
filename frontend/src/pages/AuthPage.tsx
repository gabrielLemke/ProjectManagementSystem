import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, FolderKanban } from 'lucide-react'
import { cn } from '../lib/utils'

export default function AuthPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(name, email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Lado esquerdo - Branding */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-slate-900 border-r border-slate-800 p-12">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center">
              <FolderKanban className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">ProjectMS</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Gerencie projetos com{' '}
            <span className="bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
              eficiência e clareza
            </span>
          </h1>
          <p className="text-slate-400 text-lg">
            Organize tarefas, colabore com sua equipe e acompanhe o progresso
            dos seus projetos em um só lugar.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
            {[
              { label: 'Projetos', desc: 'Criação e gestão completa' },
              { label: 'Equipes', desc: 'Controle de papéis e permissões' },
              { label: 'Tarefas', desc: 'Kanban e prioridades' },
              { label: 'Segurança', desc: 'JWT e bcrypt integrados' },
            ].map((feat) => (
              <div key={feat.label} className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                <p className="font-semibold text-sky-400 text-sm">{feat.label}</p>
                <p className="text-slate-400 text-xs mt-1">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lado direito - Formulário */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">ProjectMS</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">
            {mode === 'login' ? 'Boas-vindas de volta!' : 'Crie sua conta'}
          </h2>
          <p className="text-slate-400 mb-8">
            {mode === 'login'
              ? 'Faça login para continuar.'
              : 'Preencha os dados para começar.'}
          </p>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  minLength={3}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                required
                minLength={6}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition',
                'bg-gradient-to-r from-sky-500 to-violet-600 text-white',
                'hover:from-sky-400 hover:to-violet-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2',
              )}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem uma conta?'}{' '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError('')
              }}
              className="text-sky-400 hover:text-sky-300 font-medium transition"
            >
              {mode === 'login' ? 'Cadastre-se' : 'Faça login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
