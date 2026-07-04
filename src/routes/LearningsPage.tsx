import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { useUiStore } from '../store/uiStore'
import {
  useCreateLearning,
  useDeleteLearning,
  useLearnings,
  useUpdateLearning,
  type Learning,
} from '../features/learnings/useLearnings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

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
        <Label htmlFor="learning-date" className="mb-1.5 block">
          Date
        </Label>
        <Input id="learning-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="learning-topic" className="mb-1.5 block">
          Topic
        </Label>
        <Input id="learning-topic" value={topic} onChange={(e) => setTopic(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="learning-source" className="mb-1.5 block">
          Source
        </Label>
        <Input id="learning-source" value={source} onChange={(e) => setSource(e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="learning-understood" className="mb-1.5 block">
          What I understood
        </Label>
        <Textarea
          id="learning-understood"
          value={understood}
          onChange={(e) => setUnderstood(e.target.value)}
          rows={2}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="learning-fuzzy" className="mb-1.5 block">
          Still fuzzy on
        </Label>
        <Textarea
          id="learning-fuzzy"
          value={stillFuzzyOn}
          onChange={(e) => setStillFuzzyOn(e.target.value)}
          rows={2}
        />
      </div>
      <DialogFooter className="sm:col-span-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {initialValues ? 'Save changes' : 'Add learning'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function LearningsPage() {
  const boardId = useUiStore((s) => s.selectedBoardId)
  const { data: learnings = [], isLoading } = useLearnings(boardId)
  const createLearning = useCreateLearning(boardId)
  const updateLearning = useUpdateLearning(boardId)
  const deleteLearning = useDeleteLearning(boardId)

  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Learning | null>(null)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Learnings</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus /> Add learning
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add learning</DialogTitle>
            </DialogHeader>
            <LearningForm
              onSubmit={(values) => createLearning.mutate(values, { onSuccess: () => setAddOpen(false) })}
              onCancel={() => setAddOpen(false)}
              submitting={createLearning.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit learning</DialogTitle>
          </DialogHeader>
          {editing && (
            <LearningForm
              initialValues={editing}
              onSubmit={(values) =>
                updateLearning.mutate({ id: editing.id, ...values }, { onSuccess: () => setEditing(null) })
              }
              onCancel={() => setEditing(null)}
              submitting={updateLearning.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Understood</TableHead>
              <TableHead>Still fuzzy on</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : learnings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                  No learnings logged yet.
                </TableCell>
              </TableRow>
            ) : (
              learnings.map((learning) => (
                <TableRow key={learning.id}>
                  <TableCell className="whitespace-nowrap">{learning.date}</TableCell>
                  <TableCell>{learning.topic}</TableCell>
                  <TableCell>{learning.source ?? '—'}</TableCell>
                  <TableCell>{learning.understood ?? '—'}</TableCell>
                  <TableCell>{learning.still_fuzzy_on ?? '—'}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="link" size="sm" onClick={() => setEditing(learning)}>
                      Edit
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-destructive"
                      onClick={() => deleteLearning.mutate(learning.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
