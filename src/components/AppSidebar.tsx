import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Settings,
  Sun,
  Target,
  Trophy,
  User,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAuth } from '@/features/auth/AuthProvider'
import { useBoards } from '@/features/boards/useBoards'
import { useCreateProject, useProjects } from '@/features/boards/useProjects'
import { useUiStore } from '@/store/uiStore'
import { supabase } from '@/lib/supabase'

const staticNavItems = [
  { to: '/learnings', label: 'Learnings', icon: BookOpen },
  { to: '/skill-gaps', label: 'Skill Gaps', icon: Target },
  { to: '/wins', label: 'Wins', icon: Trophy },
]

function navLinkClasses({ isActive }: { isActive: boolean }) {
  return cn(
    'group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
    isActive && 'bg-sidebar-accent text-foreground',
  )
}

function ActiveIndicator({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        'absolute left-0 h-4 w-0.5 rounded-full bg-sidebar-primary transition-opacity',
        isActive ? 'opacity-100' : 'opacity-0',
      )}
    />
  )
}

export function AppSidebar({ open = false }: { open?: boolean }) {
  const { session } = useAuth()
  const { data: boards = [] } = useBoards()
  const selectedBoardId = useUiStore((s) => s.selectedBoardId)
  const setSelectedBoardId = useUiStore((s) => s.setSelectedBoardId)
  const navigate = useNavigate()
  const { data: projects = [] } = useProjects(selectedBoardId)
  const createProject = useCreateProject(selectedBoardId)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [projectsOpen, setProjectsOpen] = useState(true)

  const currentBoard = boards.find((b) => b.id === selectedBoardId)
  const email = session?.user.email ?? ''
  const initials = email.slice(0, 2).toUpperCase()

  function handleCreateProject() {
    if (!newProjectName.trim()) return
    createProject.mutate(
      { name: newProjectName.trim(), color: null },
      {
        onSuccess: (project) => {
          setNewProjectName('')
          setProjectDialogOpen(false)
          toast.success('Project created')
          navigate(`/projects/${project.id}`)
        },
      },
    )
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 -translate-x-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 md:static md:translate-x-0',
        open && 'translate-x-0',
      )}
    >
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm font-semibold text-foreground hover:bg-sidebar-accent">
                <span className="truncate">{currentBoard?.name ?? 'Select board'}</span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            }
          />
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Boards</DropdownMenuLabel>
              {boards.map((board) => (
                <DropdownMenuItem
                  key={board.id}
                  onClick={() => {
                    if (board.id !== selectedBoardId) {
                      setSelectedBoardId(board.id)
                      navigate('/dashboard')
                    }
                  }}
                >
                  {board.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/boards')}>Manage boards…</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3">
        <div>
          <NavLink to="/dashboard" className={navLinkClasses}>
            {({ isActive }) => (
              <>
                <ActiveIndicator isActive={isActive} />
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                Dashboard
              </>
            )}
          </NavLink>
        </div>

        <div>
          <div className="mb-1 flex items-center gap-1 px-1">
            <button
              onClick={() => setProjectsOpen((v) => !v)}
              className="flex flex-1 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            >
              {projectsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Projects
            </button>
            <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
              <DialogTrigger
                render={
                  <button
                    className="rounded p-0.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                    aria-label="Add project"
                  />
                }
              >
                <Plus className="h-3.5 w-3.5" />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add project</DialogTitle>
                </DialogHeader>
                <div className="space-y-1.5">
                  <Label htmlFor="sidebar-new-project">Name</Label>
                  <Input
                    id="sidebar-new-project"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. Marketplace"
                  />
                </div>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setProjectDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button disabled={createProject.isPending} onClick={handleCreateProject}>
                    Add project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {projectsOpen && (
            <>
              <NavLink to="/projects" end className={navLinkClasses}>
                {({ isActive }) => (
                  <>
                    <ActiveIndicator isActive={isActive} />
                    <FolderKanban className="h-4 w-4 shrink-0" />
                    All projects
                  </>
                )}
              </NavLink>

              <div className="mt-0.5 max-h-56 space-y-0.5 overflow-y-auto">
                {projects.map((project) => (
                  <NavLink key={project.id} to={`/projects/${project.id}`} className={navLinkClasses}>
                    {({ isActive }) => (
                      <>
                        <ActiveIndicator isActive={isActive} />
                        <span className="ml-6 truncate">{project.name}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="space-y-0.5">
          {staticNavItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClasses}>
              {({ isActive }) => (
                <>
                  <ActiveIndicator isActive={isActive} />
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Popover>
          <PopoverTrigger
            render={
              <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-sidebar-accent" />
            }
          >
            <Avatar size="sm">
              <AvatarFallback>{initials || <User className="h-3.5 w-3.5" />}</AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate text-xs text-muted-foreground">{email}</span>
          </PopoverTrigger>
          <PopoverContent align="start" side="top" className="w-56 p-1">
            <div className="px-2 py-1.5 text-xs text-muted-foreground">{email}</div>
            <DropdownMenuSeparator />
            <AccountMenuItem icon={User} label="Profile" onClick={() => navigate('/profile')} />
            <AccountMenuItem icon={Settings} label="Settings" onClick={() => navigate('/settings')} />
            <ThemeMenuRow />
            <DropdownMenuSeparator />
            <AccountMenuItem icon={LogOut} label="Sign out" onClick={() => supabase.auth.signOut()} />
          </PopoverContent>
        </Popover>
      </div>
    </aside>
  )
}

function AccountMenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof User
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground hover:bg-accent"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </button>
  )
}

function ThemeMenuRow() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground hover:bg-accent"
    >
      {isDark ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
      {isDark ? 'Light theme' : 'Dark theme'}
    </button>
  )
}
