import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Tables, TablesInsert } from '../../types/database'

export type FieldDefinition = Tables<'field_definitions'>

export function useFieldDefinitions(boardId: string | null) {
  return useQuery({
    queryKey: ['field_definitions', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('field_definitions')
        .select('*')
        .eq('board_id', boardId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!boardId,
  })
}

export function useCreateFieldDefinition(boardId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Omit<TablesInsert<'field_definitions'>, 'board_id'>) => {
      if (!boardId) throw new Error('Missing board')
      const { data, error } = await supabase
        .from('field_definitions')
        .insert({ ...input, board_id: boardId })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field_definitions', boardId] })
    },
  })
}
