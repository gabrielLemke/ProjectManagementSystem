import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Sidebar, type Page } from './components/Layout'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'

function AuthenticatedApp() {
  const { isAuthenticated } = useAuth()
  const [page, setPage] = useState<Page>('dashboard')

  if (!isAuthenticated) return <AuthPage />

  return (
    <div className="min-h-screen bg-slate-950 md:flex">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen">
        {page === 'dashboard' ? (
          <DashboardPage onNavigate={setPage} />
        ) : (
          <ProjectsPage />
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}
