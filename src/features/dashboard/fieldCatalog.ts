import type { FieldDefinition } from '../fields/useFieldDefinitions'
import type { Project } from '../boards/useProjects'

export type GraphableFieldType = 'date' | 'number' | 'select' | 'text'

export interface GraphableField {
  key: string
  label: string
  type: GraphableFieldType
  isCustom: boolean
  options?: string[]
}

const FIXED_FIELDS: Omit<GraphableField, 'options'>[] = [
  { key: 'date', label: 'Date', type: 'date', isCustom: false },
  { key: 'type', label: 'Task type', type: 'select', isCustom: false },
  { key: 'project_id', label: 'Project', type: 'select', isCustom: false },
  { key: 'time_spent', label: 'Time spent (min)', type: 'number', isCustom: false },
  { key: 'impact', label: 'Impact', type: 'text', isCustom: false },
  { key: 'title', label: 'Title', type: 'text', isCustom: false },
]

const TASK_TYPES = ['feature', 'bug', 'refactor', 'accessibility', 'review']

export function buildFieldCatalog(
  fieldDefinitions: FieldDefinition[],
  projects: Project[],
): GraphableField[] {
  const fixed: GraphableField[] = FIXED_FIELDS.map((f) => {
    if (f.key === 'type') return { ...f, options: TASK_TYPES }
    if (f.key === 'project_id') return { ...f, options: projects.map((p) => p.id) }
    return f
  })

  const custom: GraphableField[] = fieldDefinitions.map((fd) => ({
    key: fd.field_key,
    label: fd.label,
    type: fd.field_type as GraphableFieldType,
    isCustom: true,
    options: Array.isArray(fd.select_options) ? (fd.select_options as string[]) : undefined,
  }))

  return [...fixed, ...custom]
}
