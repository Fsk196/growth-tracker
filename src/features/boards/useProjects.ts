import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import type { Tables, TablesInsert } from '../../types/database'

export type Project = Tables<'projects'>

export function useProjects(boardId: string | null) {
  return useQuery({
    queryKey: ['projects', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('board_id', boardId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!boardId,
  })
}

export function useCreateProject(boardId: string | null) {
  const queryClient = useQueryClient()
  const { session } = useAuth()

  return useMutation({
    mutationFn: async (input: Pick<TablesInsert<'projects'>, 'name' | 'color'>) => {
      if (!session || !boardId) throw new Error('Missing board or session')
      const { data, error } = await supabase
        .from('projects')
        .insert({ ...input, board_id: boardId, user_id: session.user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', boardId] })
    },
  })
}
