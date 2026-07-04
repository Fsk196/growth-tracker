import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { useUiStore } from '../store/uiStore'
import {
  useCreateSkillGap,
  useDeleteSkillGap,
  useSkillGaps,
  useUpdateSkillGap,
  type SkillGap,
} from '../features/skillGaps/useSkillGaps'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export function SkillGapsPage() {
  const boardId = useUiStore((s) => s.selectedBoardId)
  const { data: skillGaps = [], isLoading } = useSkillGaps(boardId)
  const createSkillGap = useCreateSkillGap(boardId)
  const updateSkillGap = useUpdateSkillGap(boardId)
  const deleteSkillGap = useDeleteSkillGap(boardId)

  const [open, setOpen] = useState(false)
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
          setOpen(false)
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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Skill Gap Map</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus /> Add skill area
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add skill area</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="skill-area" className="mb-1.5 block">
                  Skill area
                </Label>
                <Input id="skill-area" value={skillArea} onChange={(e) => setSkillArea(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="skill-score" className="mb-1.5 block">
                  Current score (1-5)
                </Label>
                <Input
                  id="skill-score"
                  type="number"
                  min={1}
                  max={5}
                  value={currentScore}
                  onChange={(e) => setCurrentScore(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="skill-current" className="mb-1.5 block">
                  Current level
                </Label>
                <Input id="skill-current" value={currentDesc} onChange={(e) => setCurrentDesc(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="skill-target" className="mb-1.5 block">
                  Target level
                </Label>
                <Input id="skill-target" value={targetDesc} onChange={(e) => setTargetDesc(e.target.value)} />
              </div>
              <DialogFooter className="sm:col-span-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSkillGap.isPending}>
                  Add
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Skill area</TableHead>
              <TableHead>Current level</TableHead>
              <TableHead>Target level</TableHead>
              <TableHead>Score (1-5)</TableHead>
              <TableHead>Last reviewed</TableHead>
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
            ) : skillGaps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                  No skill areas tracked yet.
                </TableCell>
              </TableRow>
            ) : (
              skillGaps.map((sg) => (
                <TableRow key={sg.id}>
                  <TableCell className="font-medium">{sg.skill_area}</TableCell>
                  <TableCell>{sg.current_level_desc ?? '—'}</TableCell>
                  <TableCell>{sg.target_level_desc ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={editedScores[sg.id] ?? sg.current_score}
                        onChange={(e) => setEditedScores((prev) => ({ ...prev, [sg.id]: e.target.value }))}
                        className="w-16"
                      />
                      <Button variant="link" size="sm" onClick={() => saveScore(sg)} disabled={updateSkillGap.isPending}>
                        Save
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{sg.last_reviewed_date}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button
                      variant="link"
                      size="sm"
                      className="text-destructive"
                      onClick={() => deleteSkillGap.mutate(sg.id)}
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
