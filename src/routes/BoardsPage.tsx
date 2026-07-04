import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBoards, useCreateBoard } from '../features/boards/useBoards'
import { useUiStore } from '../store/uiStore'

export function BoardsPage() {
  const { data: boards, isLoading } = useBoards()
  const createBoard = useCreateBoard()
  const [name, setName] = useState('')
  const setSelectedBoardId = useUiStore((s) => s.setSelectedBoardId)
  const navigate = useNavigate()

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createBoard.mutate(name.trim(), {
      onSuccess: (board) => {
        setName('')
        selectBoard(board.id)
      },
    })
  }

  function selectBoard(boardId: string) {
    setSelectedBoardId(boardId)
    navigate('/tasks')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Boards</h1>

      <form onSubmit={handleCreate} className="mb-8 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New board name"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={createBoard.isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          Create
        </button>
      </form>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : boards && boards.length > 0 ? (
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
          {boards.map((board) => (
            <li key={board.id}>
              <button
                onClick={() => selectBoard(board.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{board.name}</span>
                <span className="text-gray-400">Open →</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No boards yet — create one above.</p>
      )}
    </div>
  )
}
