import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { GraphableField } from './fieldCatalog'

// number+number pairs are plotted raw (no aggregation applies to a scatter),
// so this queries tasks directly through PostgREST — RLS scopes it to the
// signed-in user, no RPC/security-definer needed.
export function useScatterTasks(
  boardId: string | null,
  projectId: string | null,
  xField: GraphableField | null,
  yField: GraphableField | null,
) {
  return useQuery({
    queryKey: ['scatter_tasks', boardId, projectId, xField?.key, yField?.key],
    queryFn: async () => {
      let query = supabase.from('tasks').select('id, time_spent, custom_fields').eq('board_id', boardId!)
      if (projectId) query = query.eq('project_id', projectId)
      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!boardId && !!xField && !!yField,
  })
}

export function extractNumericValue(
  row: { time_spent: number | null; custom_fields: unknown },
  field: GraphableField,
): number | null {
  if (!field.isCustom) {
    return field.key === 'time_spent' ? row.time_spent : null
  }
  const value = (row.custom_fields as Record<string, unknown>)?.[field.key]
  return typeof value === 'number' ? value : value != null ? Number(value) : null
}
