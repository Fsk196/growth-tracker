import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useUiStore } from '../store/uiStore'
import { AppSidebar } from './AppSidebar'
import { Button } from '@/components/ui/button'

export function Layout() {
  const selectedBoardId = useUiStore((s) => s.selectedBoardId)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  if (!selectedBoardId) {
    return <Navigate to="/boards" replace />
  }

  return (
    <div className="flex h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <AppSidebar open={sidebarOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center border-b border-border p-3 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu />
          </Button>
        </div>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
