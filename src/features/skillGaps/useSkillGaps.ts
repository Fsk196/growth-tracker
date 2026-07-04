import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import type { Tables, TablesInsert, TablesUpdate } from '../../types/database'

export type SkillGap = Tables<'skill_gaps'>
export type SkillGapHistoryEntry = Tables<'skill_gap_history'>

export function useSkillGaps(boardId: string | null) {
  return useQuery({
    queryKey: ['skill_gaps', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skill_gaps')
        .select('*')
        .eq('board_id', boardId!)
        .order('skill_area', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!boardId,
  })
}

export function useSkillGapHistory(skillGapId: string | null) {
  return useQuery({
    queryKey: ['skill_gap_history', skillGapId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skill_gap_history')
        .select('*')
        .eq('skill_gap_id', skillGapId!)
        .order('recorded_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!skillGapId,
  })
}

export function useCreateSkillGap(boardId: string | null) {
  const queryClient = useQueryClient()
  const { session } = useAuth()

  return useMutation({
    mutationFn: async (input: Omit<TablesInsert<'skill_gaps'>, 'board_id' | 'user_id'>) => {
      if (!session || !boardId) throw new Error('Missing board or session')
      const { data, error } = await supabase
        .from('skill_gaps')
        .insert({ ...input, board_id: boardId, user_id: session.user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skill_gaps', boardId] }),
  })
}

export function useUpdateSkillGap(boardId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: TablesUpdate<'skill_gaps'> & { id: string }) => {
      const { data, error } = await supabase.from('skill_gaps').update(input).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['skill_gaps', boardId] })
      queryClient.invalidateQueries({ queryKey: ['skill_gap_history', data.id] })
    },
  })
}

export function useDeleteSkillGap(boardId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('skill_gaps').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skill_gaps', boardId] }),
  })
}
