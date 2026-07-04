import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, LayoutGrid } from 'lucide-react'
import { useBoards, useCreateBoard } from '../features/boards/useBoards'
import { useUiStore } from '../store/uiStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

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
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-10">
      <div className="mb-8 flex items-center gap-2">
        <LayoutGrid className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Growth Tracker</h1>
      </div>

      <form onSubmit={handleCreate} className="mb-8 flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New board name" />
        <Button type="submit" disabled={createBoard.isPending}>
          Create
        </Button>
      </form>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : boards && boards.length > 0 ? (
        <Card className="divide-y divide-border">
          {boards.map((board) => (
            <button
              key={board.id}
              onClick={() => selectBoard(board.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-accent"
            >
              <span className="font-medium text-foreground">{board.name}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">No boards yet — create one above.</p>
      )}
    </div>
  )
}
