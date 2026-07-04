import { Fragment, useState, type FormEvent } from 'react'
import { useUiStore } from '../store/uiStore'
import { useCreateProject, useProjects } from '../features/boards/useProjects'
import { useCreateTask, useDeleteTask, useTasks, useUpdateTask, type Task } from '../features/tasks/useTasks'
import { TaskForm, type TaskFormValues } from '../features/tasks/TaskForm'
import { useCreateFieldDefinition, useFieldDefinitions } from '../features/fields/useFieldDefinitions'
import type { Json } from '../types/database'

const TASK_TYPES = ['feature', 'bug', 'refactor', 'accessibility', 'review']
const FIELD_TYPES = ['text', 'number', 'date', 'select'] as const

export function TaskLogPage() {
  const boardId = useUiStore((s) => s.selectedBoardId)
  const { taskFilters, setTaskFilters, resetTaskFilters } = useUiStore()
  const { data: projects = [] } = useProjects(boardId)
  const createProject = useCreateProject(boardId)
  const [newProjectName, setNewProjectName] = useState('')
  const { data: fieldDefinitions = [] } = useFieldDefinitions(boardId)
  const createFieldDefinition = useCreateFieldDefinition(boardId)
  const [showFieldForm, setShowFieldForm] = useState(false)
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

  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  function projectName(projectId: string | null) {
    return projects.find((p) => p.id === projectId)?.name ?? '—'
  }

  function handleCreate(values: TaskFormValues) {
    createTask.mutate(values, { onSuccess: () => setShowForm(false) })
  }

  function handleUpdate(values: TaskFormValues) {
    if (!editingTask) return
    updateTask.mutate({ id: editingTask.id, ...values }, { onSuccess: () => setEditingTask(null) })
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
      { onSuccess: () => setNewField({ label: '', field_type: 'text', options: '' }) },
    )
  }

  function customFieldValue(task: Task, key: string) {
    const value = (task.custom_fields as Record<string, Json>)?.[key]
    return value === null || value === undefined || value === '' ? '—' : String(value)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Task Log</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {showForm ? 'Close' : 'Add task'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-md border border-gray-200 bg-white p-4">
          {projects.length === 0 && (
            <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              No projects yet — add one below, then create tasks against it.
            </p>
          )}
          <TaskForm
            projects={projects}
            fieldDefinitions={fieldDefinitions}
            onSubmit={handleCreate}
            submitting={createTask.isPending}
          />
        </div>
      )}

      <div className="mb-6 flex items-center gap-2 rounded-md border border-gray-200 bg-white p-3">
        <span className="text-sm font-medium text-gray-700">Projects:</span>
        {projects.map((p) => (
          <span key={p.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
            {p.name}
          </span>
        ))}
        <input
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="New project name"
          className="ml-auto rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
        <button
          onClick={() => {
            if (!newProjectName.trim()) return
            createProject.mutate(
              { name: newProjectName.trim(), color: null },
              { onSuccess: () => setNewProjectName('') },
            )
          }}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
        >
          Add project
        </button>
      </div>

      <div className="mb-6 rounded-md border border-gray-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Custom fields:</span>
          {fieldDefinitions.map((f) => (
            <span key={f.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
              {f.label} ({f.field_type})
            </span>
          ))}
          <button
            onClick={() => setShowFieldForm((v) => !v)}
            className="ml-auto rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
          >
            {showFieldForm ? 'Close' : 'Add custom field'}
          </button>
        </div>
        {showFieldForm && (
          <form onSubmit={handleCreateField} className="mt-3 flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Label</label>
              <input
                value={newField.label}
                onChange={(e) => setNewField((f) => ({ ...f, label: e.target.value }))}
                required
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Type</label>
              <select
                value={newField.field_type}
                onChange={(e) =>
                  setNewField((f) => ({ ...f, field_type: e.target.value as (typeof FIELD_TYPES)[number] }))
                }
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            {newField.field_type === 'select' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Options (comma-separated)
                </label>
                <input
                  value={newField.options}
                  onChange={(e) => setNewField((f) => ({ ...f, options: e.target.value }))}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={createFieldDefinition.isPending}
              className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Add field
            </button>
          </form>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-3 rounded-md border border-gray-200 bg-white p-3">
        <select
          value={taskFilters.projectId ?? ''}
          onChange={(e) => setTaskFilters({ projectId: e.target.value || null })}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={taskFilters.type ?? ''}
          onChange={(e) => setTaskFilters({ type: e.target.value || null })}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="">All types</option>
          {TASK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={taskFilters.dateFrom ?? ''}
          onChange={(e) => setTaskFilters({ dateFrom: e.target.value || null })}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
        <span className="self-center text-sm text-gray-400">to</span>
        <input
          type="date"
          value={taskFilters.dateTo ?? ''}
          onChange={(e) => setTaskFilters({ dateTo: e.target.value || null })}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
        <button onClick={resetTaskFilters} className="text-sm text-indigo-600 hover:underline">
          Clear filters
        </button>
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Title</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Type</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Project</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Time (min)</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Impact</th>
              {fieldDefinitions.map((f) => (
                <th key={f.id} className="px-4 py-2 text-left font-medium text-gray-500">
                  {f.label}
                </th>
              ))}
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={7 + fieldDefinitions.length} className="px-4 py-6 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={7 + fieldDefinitions.length} className="px-4 py-6 text-center text-gray-400">
                  No tasks yet.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <Fragment key={task.id}>
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap">{task.date}</td>
                    <td className="px-4 py-2">{task.title}</td>
                    <td className="px-4 py-2 capitalize">{task.type}</td>
                    <td className="px-4 py-2">{projectName(task.project_id)}</td>
                    <td className="px-4 py-2">{task.time_spent ?? '—'}</td>
                    <td className="px-4 py-2">{task.impact ?? '—'}</td>
                    {fieldDefinitions.map((f) => (
                      <td key={f.id} className="px-4 py-2">
                        {customFieldValue(task, f.field_key)}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => setEditingTask(editingTask?.id === task.id ? null : task)}
                        className="mr-3 text-indigo-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTask.mutate(task.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {editingTask?.id === task.id && (
                    <tr>
                      <td colSpan={7 + fieldDefinitions.length} className="bg-gray-50 px-4 py-4">
                        <TaskForm
                          projects={projects}
                          fieldDefinitions={fieldDefinitions}
                          initialValues={task}
                          onSubmit={handleUpdate}
                          onCancel={() => setEditingTask(null)}
                          submitting={updateTask.isPending}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
