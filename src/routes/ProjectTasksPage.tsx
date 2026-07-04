import { useState, type FormEvent } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUiStore } from '../store/uiStore'
import { useProjects } from '../features/boards/useProjects'
import { useCreateTask, useDeleteTask, useTasks, useUpdateTask, type Task } from '../features/tasks/useTasks'
import { TaskForm, type TaskFormValues } from '../features/tasks/TaskForm'
import { useCreateFieldDefinition, useFieldDefinitions } from '../features/fields/useFieldDefinitions'
import { exportRowsToXlsx } from '../lib/exportSheet'
import type { Json } from '../types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DatePicker } from '@/components/date-picker'
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

export function ProjectTasksPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const boardId = useUiStore((s) => s.selectedBoardId)
  const { taskFilters, setTaskFilters, resetTaskFilters } = useUiStore()
  const { data: projects = [] } = useProjects(boardId)
  const project = projects.find((p) => p.id === projectId)

  const { data: fieldDefinitions = [] } = useFieldDefinitions(boardId)
  const createFieldDefinition = useCreateFieldDefinition(boardId)
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false)
  const [newField, setNewField] = useState({ label: '', field_type: 'text' as (typeof FIELD_TYPES)[number], options: '' })

  const { data: tasks = [], isLoading } = useTasks(boardId, {
    projectId,
    type: taskFilters.type,
    dateFrom: taskFilters.dateFrom,
    dateTo: taskFilters.dateTo,
  })

  const createTask = useCreateTask(boardId)
  const updateTask = useUpdateTask(boardId)
  const deleteTask = useDeleteTask(boardId)

  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  if (!projectId) return <Navigate to="/projects" replace />
  if (projects.length > 0 && !project) return <Navigate to="/projects" replace />

  function handleCreate(values: TaskFormValues) {
    createTask.mutate(values, {
      onSuccess: () => {
        setTaskDialogOpen(false)
        toast.success('Task added')
      },
    })
  }

  function handleUpdate(values: TaskFormValues) {
    if (!editingTask) return
    updateTask.mutate(
      { id: editingTask.id, ...values },
      {
        onSuccess: () => {
          setEditingTask(null)
          toast.success('Task updated')
        },
      },
    )
  }

  function handleDelete(taskId: string) {
    deleteTask.mutate(taskId, { onSuccess: () => toast.success('Task deleted') })
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
          toast.success('Custom field added')
        },
      },
    )
  }

  function customFieldValue(task: Task, key: string) {
    const value = (task.custom_fields as Record<string, Json>)?.[key]
    return value === null || value === undefined || value === '' ? '—' : String(value)
  }

  function handleExport() {
    exportRowsToXlsx('Tasks', tasks, `tasks-${project?.name ?? 'project'}`)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{project?.name ?? 'Tasks'}</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExport} disabled={tasks.length === 0}>
            <Download /> Export
          </Button>
          <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
            <DialogTrigger render={<Button />}>
              <Plus /> Add task
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add task</DialogTitle>
              </DialogHeader>
              <TaskForm
                projects={projects}
                fixedProjectId={projectId}
                fieldDefinitions={fieldDefinitions}
                onSubmit={handleCreate}
                onCancel={() => setTaskDialogOpen(false)}
                submitting={createTask.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <TaskForm
              projects={projects}
              fixedProjectId={projectId}
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
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Custom fields:</span>
          {fieldDefinitions.map((f) => (
            <Badge key={f.id} variant="secondary">
              {f.label} ({f.field_type})
            </Badge>
          ))}
        </div>
        <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
          <DialogTrigger render={<Button variant="secondary" size="sm" />}>
            <Plus /> Custom field
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
                  onValueChange={(v) => v && setNewField((f) => ({ ...f, field_type: v as (typeof FIELD_TYPES)[number] }))}
                >
                  <SelectTrigger className="w-full">
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
        <div className="flex flex-wrap items-center gap-3">
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

          <DatePicker value={taskFilters.dateFrom} onChange={(v) => setTaskFilters({ dateFrom: v })} placeholder="From" />
          <span className="text-sm text-muted-foreground">to</span>
          <DatePicker value={taskFilters.dateTo} onChange={(v) => setTaskFilters({ dateTo: v })} placeholder="To" />

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
              <TableHead>Time (min)</TableHead>
              <TableHead>Impact</TableHead>
              {fieldDefinitions.map((f) => (
                <TableHead key={f.id}>{f.label}</TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6 + fieldDefinitions.length} className="py-6 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6 + fieldDefinitions.length} className="py-6 text-center text-muted-foreground">
                  No tasks yet.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="whitespace-nowrap">{task.date}</TableCell>
                  <TableCell>{task.title}</TableCell>
                  <TableCell className="capitalize">{task.type}</TableCell>
                  <TableCell>{task.time_spent ?? '—'}</TableCell>
                  <TableCell>{task.impact ?? '—'}</TableCell>
                  {fieldDefinitions.map((f) => (
                    <TableCell key={f.id}>{customFieldValue(task, f.field_key)}</TableCell>
                  ))}
                  <TableCell className="text-right whitespace-nowrap">
                    <Tooltip>
                      <TooltipTrigger
                        render={<Button variant="ghost" size="icon-sm" onClick={() => setEditingTask(task)} />}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(task.id)}
                          />
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
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
