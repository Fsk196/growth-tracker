import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

function currentQuarterStart(): string {
  const now = new Date()
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
  return new Date(now.getFullYear(), quarterStartMonth, 1).toISOString().slice(0, 10)
}

export function useStats(boardId: string | null) {
  return useQuery({
    queryKey: ['dashboard_stats', boardId],
    queryFn: async () => {
      const [totalTasksRes, winsRes, taskDatesRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('board_id', boardId!),
        supabase
          .from('wins')
          .select('id', { count: 'exact', head: true })
          .eq('board_id', boardId!)
          .gte('date', currentQuarterStart()),
        supabase
          .from('tasks')
          .select('date')
          .eq('board_id', boardId!)
          .order('date', { ascending: false }),
      ])

      if (totalTasksRes.error) throw totalTasksRes.error
      if (winsRes.error) throw winsRes.error
      if (taskDatesRes.error) throw taskDatesRes.error

      const distinctDates = Array.from(new Set(taskDatesRes.data.map((t) => t.date))).sort().reverse()
      const streak = computeStreak(distinctDates)

      return {
        totalTasks: totalTasksRes.count ?? 0,
        winsThisQuarter: winsRes.count ?? 0,
        streak,
      }
    },
    enabled: !!boardId,
  })
}

function computeStreak(descendingDates: string[]): number {
  if (descendingDates.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const mostRecent = new Date(descendingDates[0])
  const dayDiff = Math.round((today.getTime() - mostRecent.getTime()) / 86_400_000)
  if (dayDiff > 1) return 0

  let streak = 1
  let cursor = mostRecent
  for (let i = 1; i < descendingDates.length; i++) {
    const prevDay = new Date(cursor)
    prevDay.setDate(prevDay.getDate() - 1)
    const candidate = new Date(descendingDates[i])
    if (candidate.getTime() === prevDay.getTime()) {
      streak++
      cursor = prevDay
    } else if (candidate.getTime() === cursor.getTime()) {
      continue
    } else {
      break
    }
  }
  return streak
}
