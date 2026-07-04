import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUiStore } from '../store/uiStore'

const navItems = [
  { to: '/tasks', label: 'Tasks' },
  { to: '/learnings', label: 'Learnings' },
  { to: '/skill-gaps', label: 'Skill Gaps' },
  { to: '/wins', label: 'Wins' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/export', label: 'Export' },
]

export function Layout() {
  const selectedBoardId = useUiStore((s) => s.selectedBoardId)

  if (!selectedBoardId) {
    return <Navigate to="/boards" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <nav className="flex gap-1">
            <NavLink
              to="/boards"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100"
            >
              ← Boards
            </NavLink>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
