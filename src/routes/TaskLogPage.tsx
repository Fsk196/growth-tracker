import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { useUiStore } from '../store/uiStore'
import { useCreateProject, useProjects } from '../features/boards/useProjects'
import { useCreateTask, useDeleteTask, useTasks, useUpdateTask, type Task } from '../features/tasks/useTasks'
import { TaskForm, type TaskFormValues } from '../features/tasks/TaskForm'
import { useCreateFieldDefinition, useFieldDefinitions } from '../features/fields/useFieldDefinitions'
import type { Json } from '../types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const TASK_TYPES = ['feature', 'bug', 'refactor', 'accessibility', 'review']
const FIELD_TYPES = ['text', 'number', 'date', 'select'] as const
const ALL_VALUE = '__all__'

export function TaskLogPage() {
  const boardId = useUiStore((s) => s.selectedBoardId)
  const { taskFilters, setTaskFilters, resetTaskFilters } = useUiStore()
  const { data: projects = [] } = useProjects(boardId)
  const createProject = useCreateProject(boardId)
  const [newProjectName, setNewProjectName] = useState('')
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const { data: fieldDefinitions = [] } = useFieldDefinitions(boardId)
  const createFieldDefinition = useCreateFieldDefinition(boardId)
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false)
  const [newField, setNewField] = useState({ label: '', field_type: 'text' as (typeof FIELD_TYPES)[number], options: '' })
  const { data: tasks = [], isLoading } = useTasks(boardId, {
    projectId: taskFilters.projectId,
    type: taskFilters.type,
    dateFrom: taskFilters.dateFrom,
    dateTo: taskFilters.dateTo,
  })

  const createTask = useCreateTask(boardId)
  const updateTask = useUpdateTask(boardId)
  const deleteTask = useDeleteTask(boardId)

  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  function projectName(projectId: string | null) {
    return projects.find((p) => p.id === projectId)?.name ?? '—'
  }

  function handleCreate(values: TaskFormValues) {
    createTask.mutate(values, { onSuccess: () => setTaskDialogOpen(false) })
  }

  function handleUpdate(values: TaskFormValues) {
    if (!editingTask) return
    updateTask.mutate(
      { id: editingTask.id, ...values },
      { onSuccess: () => setEditingTask(null) },
    )
  }

  function slugify(label: string) {
    return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  }

  function handleCreateField(e: FormEvent) {
    e.preventDefault()
    const fieldKey = slugify(newField.label)
    if (!fieldKey) return
    const selectOptions: Json | null =
      newField.field_type === 'select'
        ? newField.options.split(',').map((o) => o.trim()).filter(Boolean)
        : null
    createFieldDefinition.mutate(
      {
        field_key: fieldKey,
        label: newField.label.trim(),
        field_type: newField.field_type,
        select_options: selectOptions,
      },
      {
        onSuccess: () => {
          setNewField({ label: '', field_type: 'text', options: '' })
          setFieldDialogOpen(false)
        },
      },
    )
  }

  function customFieldValue(task: Task, key: string) {
    const value = (task.custom_fields as Record<string, Json>)?.[key]
    return value === null || value === undefined || value === '' ? '—' : String(value)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Task Log</h1>
        <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus /> Add task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add task</DialogTitle>
            </DialogHeader>
            <TaskForm
              projects={projects}
              fieldDefinitions={fieldDefinitions}
              onSubmit={handleCreate}
              onCancel={() => setTaskDialogOpen(false)}
              submitting={createTask.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <TaskForm
              projects={projects}
              fieldDefinitions={fieldDefinitions}
              initialValues={editingTask}
              onSubmit={handleUpdate}
              onCancel={() => setEditingTask(null)}
              submitting={updateTask.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="mr-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Projects:</span>
          {projects.map((p) => (
            <Badge key={p.id} variant="secondary">
              {p.name}
            </Badge>
          ))}
        </div>
        <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm">
              <Plus /> Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add project</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="new-project-name">Name</Label>
              <Input
                id="new-project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Marketplace"
              />
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setProjectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={createProject.isPending}
                onClick={() => {
                  if (!newProjectName.trim()) return
                  createProject.mutate(
                    { name: newProjectName.trim(), color: null },
                    {
                      onSuccess: () => {
                        setNewProjectName('')
                        setProjectDialogOpen(false)
                      },
                    },
                  )
                }}
              >
                Add project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="mx-2 h-4 w-px bg-border" />

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Custom fields:</span>
          {fieldDefinitions.map((f) => (
            <Badge key={f.id} variant="secondary">
              {f.label} ({f.field_type})
            </Badge>
          ))}
        </div>
        <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm">
              <Plus /> Custom field
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add custom field</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateField} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="field-label">Label</Label>
                <Input
                  id="field-label"
                  value={newField.label}
                  onChange={(e) => setNewField((f) => ({ ...f, label: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={newField.field_type}
                  onValueChange={(v) => setNewField((f) => ({ ...f, field_type: v as (typeof FIELD_TYPES)[number] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newField.field_type === 'select' && (
                <div className="space-y-1.5">
                  <Label htmlFor="field-options">Options (comma-separated)</Label>
                  <Input
                    id="field-options"
                    value={newField.options}
                    onChange={(e) => setNewField((f) => ({ ...f, options: e.target.value }))}
                  />
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setFieldDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createFieldDefinition.isPending}>
                  Add field
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-4 p-3">
        <div className="flex flex-wrap gap-3">
          <Select
            value={taskFilters.projectId ?? ALL_VALUE}
            onValueChange={(v) => setTaskFilters({ projectId: v === ALL_VALUE ? null : v })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={taskFilters.type ?? ALL_VALUE}
            onValueChange={(v) => setTaskFilters({ type: v === ALL_VALUE ? null : v })}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All types</SelectItem>
              {TASK_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={taskFilters.dateFrom ?? ''}
            onChange={(e) => setTaskFilters({ dateFrom: e.target.value || null })}
            className="w-40"
          />
          <span className="self-center text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            value={taskFilters.dateTo ?? ''}
            onChange={(e) => setTaskFilters({ dateTo: e.target.value || null })}
            className="w-40"
          />
          <Button variant="ghost" size="sm" onClick={resetTaskFilters}>
            Clear filters
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Time (min)</TableHead>
              <TableHead>Impact</TableHead>
              {fieldDefinitions.map((f) => (
                <TableHead key={f.id}>{f.label}</TableHead>
              ))}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7 + fieldDefinitions.length} className="py-6 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7 + fieldDefinitions.length} className="py-6 text-center text-muted-foreground">
                  No tasks yet.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="whitespace-nowrap">{task.date}</TableCell>
                  <TableCell>{task.title}</TableCell>
                  <TableCell className="capitalize">{task.type}</TableCell>
                  <TableCell>{projectName(task.project_id)}</TableCell>
                  <TableCell>{task.time_spent ?? '—'}</TableCell>
                  <TableCell>{task.impact ?? '—'}</TableCell>
                  {fieldDefinitions.map((f) => (
                    <TableCell key={f.id}>{customFieldValue(task, f.field_key)}</TableCell>
                  ))}
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="link" size="sm" onClick={() => setEditingTask(task)}>
                      Edit
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-destructive"
                      onClick={() => deleteTask.mutate(task.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
