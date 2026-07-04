import { useState, type FormEvent } from 'react'
import { useUiStore } from '../store/uiStore'
import {
  useCreateSkillGap,
  useDeleteSkillGap,
  useSkillGaps,
  useUpdateSkillGap,
  type SkillGap,
} from '../features/skillGaps/useSkillGaps'

const today = () => new Date().toISOString().slice(0, 10)

export function SkillGapsPage() {
  const boardId = useUiStore((s) => s.selectedBoardId)
  const { data: skillGaps = [], isLoading } = useSkillGaps(boardId)
  const createSkillGap = useCreateSkillGap(boardId)
  const updateSkillGap = useUpdateSkillGap(boardId)
  const deleteSkillGap = useDeleteSkillGap(boardId)

  const [showForm, setShowForm] = useState(false)
  const [skillArea, setSkillArea] = useState('')
  const [currentDesc, setCurrentDesc] = useState('')
  const [targetDesc, setTargetDesc] = useState('')
  const [currentScore, setCurrentScore] = useState('3')

  const [editedScores, setEditedScores] = useState<Record<string, string>>({})

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!skillArea.trim()) return
    createSkillGap.mutate(
      {
        skill_area: skillArea.trim(),
        current_level_desc: currentDesc.trim() || null,
        target_level_desc: targetDesc.trim() || null,
        current_score: Number(currentScore),
        last_reviewed_date: today(),
      },
      {
        onSuccess: () => {
          setSkillArea('')
          setCurrentDesc('')
          setTargetDesc('')
          setCurrentScore('3')
          setShowForm(false)
        },
      },
    )
  }

  function saveScore(skillGap: SkillGap) {
    const newScore = Number(editedScores[skillGap.id] ?? skillGap.current_score)
    if (newScore === skillGap.current_score) return
    updateSkillGap.mutate({
      id: skillGap.id,
      current_score: newScore,
      last_reviewed_date: today(),
    })
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Skill Gap Map</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {showForm ? 'Close' : 'Add skill area'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 grid grid-cols-1 gap-4 rounded-md border border-gray-200 bg-white p-4 sm:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Skill area</label>
            <input
              value={skillArea}
              onChange={(e) => setSkillArea(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Current score (1-5)</label>
            <input
              type="number"
              min={1}
              max={5}
              value={currentScore}
              onChange={(e) => setCurrentScore(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Current level</label>
            <input
              value={currentDesc}
              onChange={(e) => setCurrentDesc(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Target level</label>
            <input
              value={targetDesc}
              onChange={(e) => setTargetDesc(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={createSkillGap.isPending}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Skill area</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Current level</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Target level</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Score (1-5)</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Last reviewed</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : skillGaps.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No skill areas tracked yet.
                </td>
              </tr>
            ) : (
              skillGaps.map((sg) => (
                <tr key={sg.id}>
                  <td className="px-4 py-2 font-medium text-gray-900">{sg.skill_area}</td>
                  <td className="px-4 py-2">{sg.current_level_desc ?? '—'}</td>
                  <td className="px-4 py-2">{sg.target_level_desc ?? '—'}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={editedScores[sg.id] ?? sg.current_score}
                        onChange={(e) =>
                          setEditedScores((prev) => ({ ...prev, [sg.id]: e.target.value }))
                        }
                        className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => saveScore(sg)}
                        disabled={updateSkillGap.isPending}
                        className="text-indigo-600 hover:underline disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">{sg.last_reviewed_date}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => deleteSkillGap.mutate(sg.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
