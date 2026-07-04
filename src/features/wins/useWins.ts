import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import type { Tables, TablesInsert } from '../../types/database'

export type Win = Tables<'wins'>

export function useWins(boardId: string | null) {
  return useQuery({
    queryKey: ['wins', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wins')
        .select('*')
        .eq('board_id', boardId!)
        .order('date', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!boardId,
  })
}

export function useCreateWin(boardId: string | null) {
  const queryClient = useQueryClient()
  const { session } = useAuth()

  return useMutation({
    mutationFn: async (input: Omit<TablesInsert<'wins'>, 'board_id' | 'user_id'>) => {
      if (!session || !boardId) throw new Error('Missing board or session')
      const { data, error } = await supabase
        .from('wins')
        .insert({ ...input, board_id: boardId, user_id: session.user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wins', boardId] }),
  })
}

export function useDeleteWin(boardId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wins').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wins', boardId] }),
  })
}
