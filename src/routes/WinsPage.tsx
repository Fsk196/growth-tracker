import { useState, type FormEvent } from 'react'
import { Plus, Trophy } from 'lucide-react'
import { useUiStore } from '../store/uiStore'
import { useCreateWin, useDeleteWin, useWins } from '../features/wins/useWins'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const today = () => new Date().toISOString().slice(0, 10)

export function WinsPage() {
  const boardId = useUiStore((s) => s.selectedBoardId)
  const { data: wins = [], isLoading } = useWins(boardId)
  const createWin = useCreateWin(boardId)
  const deleteWin = useDeleteWin(boardId)

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today())

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    createWin.mutate(
      { title: title.trim(), date },
      {
        onSuccess: () => {
          setTitle('')
          setOpen(false)
        },
      },
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Wins</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus /> Add win
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add win</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="win-title">What did you win at?</Label>
                <Input id="win-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="win-date">Date</Label>
                <Input id="win-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createWin.isPending}>
                  Add win
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : wins.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <Trophy className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No wins logged yet.</p>
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {wins.map((win) => (
            <div key={win.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{win.title}</p>
                <p className="text-xs text-muted-foreground">{win.date}</p>
              </div>
              <Button variant="link" size="sm" className="text-destructive" onClick={() => deleteWin.mutate(win.id)}>
                Delete
              </Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
