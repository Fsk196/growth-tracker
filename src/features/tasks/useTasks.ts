import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import type { Tables, TablesInsert, TablesUpdate } from '../../types/database'

export type Task = Tables<'tasks'>

export interface TaskFilters {
  projectId?: string | null
  type?: string | null
  dateFrom?: string | null
  dateTo?: string | null
}

export function useTasks(boardId: string | null, filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ['tasks', boardId, filters],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('board_id', boardId!)
        .order('date', { ascending: false })

      if (filters.projectId) query = query.eq('project_id', filters.projectId)
      if (filters.type) query = query.eq('type', filters.type)
      if (filters.dateFrom) query = query.gte('date', filters.dateFrom)
      if (filters.dateTo) query = query.lte('date', filters.dateTo)

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!boardId,
  })
}

export function useCreateTask(boardId: string | null) {
  const queryClient = useQueryClient()
  const { session } = useAuth()

  return useMutation({
    mutationFn: async (
      input: Omit<TablesInsert<'tasks'>, 'board_id' | 'user_id'>,
    ) => {
      if (!session || !boardId) throw new Error('Missing board or session')
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...input, board_id: boardId, user_id: session.user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] })
    },
  })
}

export function useUpdateTask(boardId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: TablesUpdate<'tasks'> & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] })
    },
  })
}

export function useDeleteTask(boardId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] })
    },
  })
}
