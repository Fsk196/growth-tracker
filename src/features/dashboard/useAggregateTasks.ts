import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { GraphableField } from './fieldCatalog'
import type { Aggregation } from '../../store/uiStore'

interface AggregateTasksArgs {
  boardId: string | null
  xField: GraphableField | null
  yField: GraphableField | null
  groupByField: GraphableField | null
  aggregation: Aggregation
  isSelectSelectPairing: boolean
}

export function useAggregateTasks({
  boardId,
  xField,
  yField,
  groupByField,
  aggregation,
  isSelectSelectPairing,
}: AggregateTasksArgs) {
  const enabled = !!boardId && !!xField && !!yField

  return useQuery({
    queryKey: [
      'aggregate_tasks',
      boardId,
      xField?.key,
      yField?.key,
      groupByField?.key,
      aggregation,
      isSelectSelectPairing,
    ],
    queryFn: async () => {
      // For a select+select pairing (stacked bar / heatmap) the Y field is
      // itself the second grouping dimension, aggregated by count — it maps
      // onto the RPC's group-by parameter rather than its numeric y field.
      const { data, error } = await supabase.rpc('aggregate_tasks', {
        p_board_id: boardId!,
        p_x_field: xField!.key,
        p_x_is_custom: xField!.isCustom,
        p_y_field: isSelectSelectPairing ? undefined : yField!.key,
        p_y_is_custom: isSelectSelectPairing ? false : yField!.isCustom,
        p_agg: isSelectSelectPairing ? 'count' : aggregation,
        p_group_by_field: isSelectSelectPairing ? yField!.key : (groupByField?.key ?? undefined),
        p_group_by_is_custom: isSelectSelectPairing ? yField!.isCustom : (groupByField?.isCustom ?? false),
      })
      if (error) throw error
      return data
    },
    enabled,
  })
}
