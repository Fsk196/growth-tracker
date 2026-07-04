import { Fragment, useState, type FormEvent } from 'react'
import { useUiStore } from '../store/uiStore'
import {
  useCreateLearning,
  useDeleteLearning,
  useLearnings,
  useUpdateLearning,
  type Learning,
} from '../features/learnings/useLearnings'

const today = () => new Date().toISOString().slice(0, 10)

interface LearningFormValues {
  date: string
  topic: string
  source: string | null
  understood: string | null
  still_fuzzy_on: string | null
}

function LearningForm({
  initialValues,
  onSubmit,
  onCancel,
  submitting,
}: {
  initialValues?: Learning
  onSubmit: (values: LearningFormValues) => void
  onCancel?: () => void
  submitting?: boolean
}) {
  const [date, setDate] = useState(initialValues?.date ?? today())
  const [topic, setTopic] = useState(initialValues?.topic ?? '')
  const [source, setSource] = useState(initialValues?.source ?? '')
  const [understood, setUnderstood] = useState(initialValues?.understood ?? '')
  const [stillFuzzyOn, setStillFuzzyOn] = useState(initialValues?.still_fuzzy_on ?? '')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!topic.trim()) return
    onSubmit({
      date,
      topic: topic.trim(),
      source: source.trim() || null,
      understood: understood.trim() || null,
      still_fuzzy_on: stillFuzzyOn.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Topic</label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Source</label>
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-gray-700">What I understood</label>
        <textarea
          value={understood}
          onChange={(e) => setUnderstood(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-gray-700">Still fuzzy on</label>
        <textarea
          value={stillFuzzyOn}
          onChange={(e) => setStillFuzzyOn(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {initialValues ? 'Save changes' : 'Add learning'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export function LearningsPage() {
  const boardId = useUiStore((s) => s.selectedBoardId)
  const { data: learnings = [], isLoading } = useLearnings(boardId)
  const createLearning = useCreateLearning(boardId)
  const updateLearning = useUpdateLearning(boardId)
  const deleteLearning = useDeleteLearning(boardId)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Learning | null>(null)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Learnings</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {showForm ? 'Close' : 'Add learning'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-md border border-gray-200 bg-white p-4">
          <LearningForm
            onSubmit={(values) => createLearning.mutate(values, { onSuccess: () => setShowForm(false) })}
            submitting={createLearning.isPending}
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Topic</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Source</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Understood</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Still fuzzy on</th>
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
            ) : learnings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No learnings logged yet.
                </td>
              </tr>
            ) : (
              learnings.map((learning) => (
                <Fragment key={learning.id}>
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap">{learning.date}</td>
                    <td className="px-4 py-2">{learning.topic}</td>
                    <td className="px-4 py-2">{learning.source ?? '—'}</td>
                    <td className="px-4 py-2">{learning.understood ?? '—'}</td>
                    <td className="px-4 py-2">{learning.still_fuzzy_on ?? '—'}</td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => setEditing(editing?.id === learning.id ? null : learning)}
                        className="mr-3 text-indigo-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteLearning.mutate(learning.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {editing?.id === learning.id && (
                    <tr>
                      <td colSpan={6} className="bg-gray-50 px-4 py-4">
                        <LearningForm
                          initialValues={learning}
                          onSubmit={(values) =>
                            updateLearning.mutate({ id: learning.id, ...values }, { onSuccess: () => setEditing(null) })
                          }
                          onCancel={() => setEditing(null)}
                          submitting={updateLearning.isPending}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
