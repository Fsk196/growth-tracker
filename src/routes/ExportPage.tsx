import { useState } from 'react'
import * as XLSX from 'xlsx'
import { useUiStore } from '../store/uiStore'
import { supabase } from '../lib/supabase'

export function ExportPage() {
  const boardId = useUiStore((s) => s.selectedBoardId)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExport() {
    if (!boardId) return
    setExporting(true)
    setError(null)

    try {
      const [projects, tasks, fieldDefinitions, learnings, wins, skillGaps] = await Promise.all([
        supabase.from('projects').select('*').eq('board_id', boardId),
        supabase.from('tasks').select('*').eq('board_id', boardId),
        supabase.from('field_definitions').select('*').eq('board_id', boardId),
        supabase.from('learnings').select('*').eq('board_id', boardId),
        supabase.from('wins').select('*').eq('board_id', boardId),
        supabase.from('skill_gaps').select('*').eq('board_id', boardId),
      ])

      for (const res of [projects, tasks, fieldDefinitions, learnings, wins, skillGaps]) {
        if (res.error) throw res.error
      }

      const skillGapIds = (skillGaps.data ?? []).map((sg) => sg.id)
      const skillGapHistory = skillGapIds.length
        ? await supabase.from('skill_gap_history').select('*').in('skill_gap_id', skillGapIds)
        : { data: [], error: null }
      if (skillGapHistory.error) throw skillGapHistory.error

      const workbook = XLSX.utils.book_new()
      const sheets: [string, Record<string, unknown>[]][] = [
        ['Projects', projects.data ?? []],
        ['Tasks', tasks.data ?? []],
        ['Field Definitions', fieldDefinitions.data ?? []],
        ['Learnings', learnings.data ?? []],
        ['Wins', wins.data ?? []],
        ['Skill Gaps', skillGaps.data ?? []],
        ['Skill Gap History', skillGapHistory.data ?? []],
      ]

      for (const [name, rows] of sheets) {
        const worksheet = rows.length ? XLSX.utils.json_to_sheet(rows) : XLSX.utils.aoa_to_sheet([[]])
        XLSX.utils.book_append_sheet(workbook, worksheet, name)
      }

      const date = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(workbook, `growth-tracker-export-${date}.xlsx`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Export</h1>
      <div className="rounded-md border border-gray-200 bg-white p-6">
        <p className="mb-4 text-sm text-gray-600">
          Export every table for this board — projects, tasks, field definitions, learnings, wins, and skill
          gaps (with history) — as a single .xlsx file.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {exporting ? 'Exporting…' : 'Export board as .xlsx'}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
