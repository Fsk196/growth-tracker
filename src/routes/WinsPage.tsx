import { useState, type FormEvent } from 'react'
import { useUiStore } from '../store/uiStore'
import { useCreateWin, useDeleteWin, useWins } from '../features/wins/useWins'

const today = () => new Date().toISOString().slice(0, 10)

export function WinsPage() {
  const boardId = useUiStore((s) => s.selectedBoardId)
  const { data: wins = [], isLoading } = useWins(boardId)
  const createWin = useCreateWin(boardId)
  const deleteWin = useDeleteWin(boardId)

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today())

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    createWin.mutate(
      { title: title.trim(), date },
      { onSuccess: () => setTitle('') },
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Wins</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex gap-2 rounded-md border border-gray-200 bg-white p-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What did you win at?"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={createWin.isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : wins.length === 0 ? (
        <p className="text-sm text-gray-500">No wins logged yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
          {wins.map((win) => (
            <li key={win.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{win.title}</p>
                <p className="text-xs text-gray-500">{win.date}</p>
              </div>
              <button
                onClick={() => deleteWin.mutate(win.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
