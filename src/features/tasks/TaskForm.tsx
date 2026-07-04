import { useState, type FormEvent } from 'react'
import type { Project } from '../boards/useProjects'
import type { Task } from './useTasks'
import type { FieldDefinition } from '../fields/useFieldDefinitions'
import type { Json } from '../../types/database'

const TASK_TYPES = ['feature', 'bug', 'refactor', 'accessibility', 'review'] as const

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
  fieldDefinitions?: FieldDefinition[]
  initialValues?: Task
  onSubmit: (values: TaskFormValues) => void
  onCancel?: () => void
  submitting?: boolean
}

const today = () => new Date().toISOString().slice(0, 10)

export function TaskForm({
  projects,
  fieldDefinitions = [],
  initialValues,
  onSubmit,
  onCancel,
  submitting,
}: TaskFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [type, setType] = useState(initialValues?.type ?? TASK_TYPES[0])
  const [date, setDate] = useState(initialValues?.date ?? today())
  const [projectId, setProjectId] = useState(initialValues?.project_id ?? '')
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
      project_id: projectId || null,
      impact: impact.trim() || null,
      time_spent: timeSpent ? Number(timeSpent) : null,
      custom_fields: customFields,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          {TASK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Project</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">None</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Time spent (min)</label>
        <input
          type="number"
          min={0}
          value={timeSpent}
          onChange={(e) => setTimeSpent(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-gray-700">Impact</label>
        <input
          value={impact}
          onChange={(e) => setImpact(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {fieldDefinitions.length > 0 && (
        <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:col-span-2 sm:grid-cols-2">
          {fieldDefinitions.map((field) => (
            <div key={field.id}>
              <label className="mb-1 block text-sm font-medium text-gray-700">{field.label}</label>
              {field.field_type === 'select' ? (
                <select
                  value={(customFields[field.field_key] as string) ?? ''}
                  onChange={(e) => setCustomField(field.field_key, e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">—</option>
                  {(Array.isArray(field.select_options) ? field.select_options : []).map((opt) => (
                    <option key={String(opt)} value={String(opt)}>
                      {String(opt)}
                    </option>
                  ))}
                </select>
              ) : field.field_type === 'number' ? (
                <input
                  type="number"
                  value={(customFields[field.field_key] as number) ?? ''}
                  onChange={(e) =>
                    setCustomField(field.field_key, e.target.value === '' ? null : Number(e.target.value))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              ) : field.field_type === 'date' ? (
                <input
                  type="date"
                  value={(customFields[field.field_key] as string) ?? ''}
                  onChange={(e) => setCustomField(field.field_key, e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              ) : (
                <input
                  type="text"
                  value={(customFields[field.field_key] as string) ?? ''}
                  onChange={(e) => setCustomField(field.field_key, e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {initialValues ? 'Save changes' : 'Add task'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
