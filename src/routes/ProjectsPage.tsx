import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Download, FolderKanban, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useUiStore } from '../store/uiStore'
import { useCreateProject, useProjects } from '../features/boards/useProjects'
import { exportRowsToXlsx } from '../lib/exportSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function ProjectsPage() {
  const boardId = useUiStore((s) => s.selectedBoardId)
  const { data: projects = [], isLoading } = useProjects(boardId)
  const createProject = useCreateProject(boardId)
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  function handleCreate() {
    if (!name.trim()) return
    createProject.mutate(
      { name: name.trim(), color: null },
      {
        onSuccess: (project) => {
          setName('')
          setOpen(false)
          toast.success('Project created')
          navigate(`/projects/${project.id}`)
        },
      },
    )
  }

  function handleExport() {
    const rows = projects.map((project) => ({
      Name: project.name,
      Status: project.status,
    }))
    exportRowsToXlsx('Projects', rows, 'projects')
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Projects</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExport} disabled={projects.length === 0}>
            <Download /> Export
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              <Plus /> New project
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New project</DialogTitle>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="project-name">Name</Label>
                <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Marketplace" />
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={createProject.isPending} onClick={handleCreate}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : projects.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <FolderKanban className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No projects yet — create one to start logging tasks.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="text-left"
            >
              <Card className="p-5 transition-colors hover:bg-accent">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{project.name}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="mt-1 inline-block text-xs capitalize text-muted-foreground">{project.status}</span>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
