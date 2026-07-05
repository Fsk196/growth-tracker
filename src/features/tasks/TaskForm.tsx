import { useState, type FormEvent } from 'react'
import type { Project } from '../boards/useProjects'
import type { Task } from './useTasks'
import type { FieldDefinition } from '../fields/useFieldDefinitions'
import type { Json } from '../../types/database'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DialogFooter } from '@/components/ui/dialog'
import { DatePicker } from '@/components/date-picker'

const TASK_TYPES = ['feature', 'bug', 'refactor', 'accessibility', 'review'] as const
const NONE_VALUE = '__none__'

export interface TaskFormValues {
  title: string
  type: string
  date: string
  project_id: string | null
  impact: string | null
  time_spent: number | null
  custom_fields: Record<string, Json>
}

interface TaskFormProps {
  projects: Project[]
  fixedProjectId?: string
  fieldDefinitions?: FieldDefinition[]
  initialValues?: Task
  onSubmit: (values: TaskFormValues) => void
  onCancel?: () => void
  submitting?: boolean
}

const today = () => new Date().toISOString().slice(0, 10)

export function TaskForm({
  projects,
  fixedProjectId,
  fieldDefinitions = [],
  initialValues,
  onSubmit,
  onCancel,
  submitting,
}: TaskFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [type, setType] = useState(initialValues?.type ?? TASK_TYPES[0])
  const [date, setDate] = useState(initialValues?.date ?? today())
  const [projectId, setProjectId] = useState(initialValues?.project_id ?? fixedProjectId ?? NONE_VALUE)
  const [impact, setImpact] = useState(initialValues?.impact ?? '')
  const [timeSpent, setTimeSpent] = useState(initialValues?.time_spent?.toString() ?? '')
  const initialCustomFields = (initialValues?.custom_fields as Record<string, Json>) ?? {}
  const [customFields, setCustomFields] = useState<Record<string, Json>>(initialCustomFields)

  function setCustomField(key: string, value: Json) {
    setCustomFields((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      type,
      date,
      project_id: fixedProjectId ?? (projectId === NONE_VALUE ? null : projectId),
      impact: impact.trim() || null,
      time_spent: timeSpent ? Number(timeSpent) : null,
      custom_fields: customFields,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="task-title" className="mb-1.5 block">
          Title
        </Label>
        <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div>
        <Label className="mb-1.5 block">Type</Label>
        <Select value={type} onValueChange={(v) => v && setType(v)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TASK_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-1.5 block">Date</Label>
        <DatePicker value={date} onChange={(v) => setDate(v ?? today())} className="w-full" />
      </div>

      {!fixedProjectId && (
        <div>
          <Label className="mb-1.5 block">Project</Label>
          <Select
            value={projectId}
            onValueChange={(v) => setProjectId(v ?? NONE_VALUE)}
            items={{ [NONE_VALUE]: 'None', ...Object.fromEntries(projects.map((p) => [p.id, p.name])) }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>None</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="task-time-spent" className="mb-1.5 block">
          Time spent (min)
        </Label>
        <Input
          id="task-time-spent"
          type="number"
          min={0}
          value={timeSpent}
          onChange={(e) => setTimeSpent(e.target.value)}
        />
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="task-impact" className="mb-1.5 block">
          Impact
        </Label>
        <Input id="task-impact" value={impact} onChange={(e) => setImpact(e.target.value)} />
      </div>

      {fieldDefinitions.length > 0 && (
        <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:col-span-2 sm:grid-cols-2">
          {fieldDefinitions.map((field) => (
            <div key={field.id}>
              <Label className="mb-1.5 block">{field.label}</Label>
              {field.field_type === 'select' ? (
                <Select
                  value={(customFields[field.field_key] as string) ?? NONE_VALUE}
                  onValueChange={(v) => setCustomField(field.field_key, v === NONE_VALUE ? null : v)}
                  items={{
                    [NONE_VALUE]: '—',
                    ...Object.fromEntries(
                      (Array.isArray(field.select_options) ? field.select_options : []).map((opt) => [
                        String(opt),
                        String(opt),
                      ]),
                    ),
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>—</SelectItem>
                    {(Array.isArray(field.select_options) ? field.select_options : []).map((opt) => (
                      <SelectItem key={String(opt)} value={String(opt)}>
                        {String(opt)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.field_type === 'number' ? (
                <Input
                  type="number"
                  value={(customFields[field.field_key] as number) ?? ''}
                  onChange={(e) =>
                    setCustomField(field.field_key, e.target.value === '' ? null : Number(e.target.value))
                  }
                />
              ) : field.field_type === 'date' ? (
                <DatePicker
                  value={(customFields[field.field_key] as string) ?? null}
                  onChange={(v) => setCustomField(field.field_key, v)}
                  className="w-full"
                />
              ) : (
                <Input
                  type="text"
                  value={(customFields[field.field_key] as string) ?? ''}
                  onChange={(e) => setCustomField(field.field_key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <DialogFooter className="sm:col-span-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {initialValues ? 'Save changes' : 'Add task'}
        </Button>
      </DialogFooter>
    </form>
  )
}
