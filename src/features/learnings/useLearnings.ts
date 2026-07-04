import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import type { Tables, TablesInsert, TablesUpdate } from '../../types/database'

export type Learning = Tables<'learnings'>

export function useLearnings(boardId: string | null) {
  return useQuery({
    queryKey: ['learnings', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learnings')
        .select('*')
        .eq('board_id', boardId!)
        .order('date', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!boardId,
  })
}

export function useCreateLearning(boardId: string | null) {
  const queryClient = useQueryClient()
  const { session } = useAuth()

  return useMutation({
    mutationFn: async (input: Omit<TablesInsert<'learnings'>, 'board_id' | 'user_id'>) => {
      if (!session || !boardId) throw new Error('Missing board or session')
      const { data, error } = await supabase
        .from('learnings')
        .insert({ ...input, board_id: boardId, user_id: session.user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['learnings', boardId] }),
  })
}

export function useUpdateLearning(boardId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: TablesUpdate<'learnings'> & { id: string }) => {
      const { data, error } = await supabase.from('learnings').update(input).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['learnings', boardId] }),
  })
}

export function useDeleteLearning(boardId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('learnings').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['learnings', boardId] }),
  })
}
