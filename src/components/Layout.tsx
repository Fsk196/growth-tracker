import { Navigate, Outlet } from 'react-router-dom'
import { useUiStore } from '../store/uiStore'
import { AppSidebar } from './AppSidebar'

export function Layout() {
  const selectedBoardId = useUiStore((s) => s.selectedBoardId)

  if (!selectedBoardId) {
    return <Navigate to="/boards" replace />
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
