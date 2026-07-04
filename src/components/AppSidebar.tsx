import { NavLink, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ChevronsUpDown,
  Download,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Target,
  Trophy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/features/theme/ThemeToggle'
import { useAuth } from '@/features/auth/AuthProvider'
import { useBoards } from '@/features/boards/useBoards'
import { useUiStore } from '@/store/uiStore'
import { supabase } from '@/lib/supabase'

const navItems = [
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/learnings', label: 'Learnings', icon: BookOpen },
  { to: '/skill-gaps', label: 'Skill Gaps', icon: Target },
  { to: '/wins', label: 'Wins', icon: Trophy },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/export', label: 'Export', icon: Download },
]

export function AppSidebar() {
  const { session } = useAuth()
  const { data: boards = [] } = useBoards()
  const selectedBoardId = useUiStore((s) => s.selectedBoardId)
  const setSelectedBoardId = useUiStore((s) => s.setSelectedBoardId)
  const navigate = useNavigate()

  const currentBoard = boards.find((b) => b.id === selectedBoardId)

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm font-semibold text-foreground hover:bg-sidebar-accent">
              <span className="truncate">{currentBoard?.name ?? 'Select board'}</span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Boards</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {boards.map((board) => (
              <DropdownMenuItem key={board.id} onClick={() => setSelectedBoardId(board.id)}>
                {board.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/boards')}>Manage boards…</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive && 'bg-sidebar-accent text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'absolute left-0 h-4 w-0.5 rounded-full bg-sidebar-primary transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 truncate px-2 text-xs text-muted-foreground">{session?.user.email}</div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start gap-2 text-muted-foreground"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
