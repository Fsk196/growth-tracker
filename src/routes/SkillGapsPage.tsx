import { useState, type FormEvent } from 'react'
import { Check, Download, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUiStore } from '../store/uiStore'
import {
  useCreateSkillGap,
  useDeleteSkillGap,
  useSkillGaps,
  useUpdateSkillGap,
  type SkillGap,
} from '../features/skillGaps/useSkillGaps'
import { exportRowsToXlsx } from '../lib/exportSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
          toast.success('Skill area added')
        },
      },
    )
  }

  function saveScore(skillGap: SkillGap) {
    const newScore = Number(editedScores[skillGap.id] ?? skillGap.current_score)
    if (newScore === skillGap.current_score) return
    updateSkillGap.mutate(
      {
        id: skillGap.id,
        current_score: newScore,
        last_reviewed_date: today(),
      },
      { onSuccess: () => toast.success('Score updated') },
    )
  }

  function handleExport() {
    exportRowsToXlsx('Skill Gaps', skillGaps, 'skill-gaps')
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Skill Gap Map</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExport} disabled={skillGaps.length === 0}>
            <Download /> Export
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              <Plus /> Add skill area
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
              <TableHead className="text-right">Actions</TableHead>
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
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={editedScores[sg.id] ?? sg.current_score}
                        onChange={(e) => setEditedScores((prev) => ({ ...prev, [sg.id]: e.target.value }))}
                        className="w-16"
                      />
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => saveScore(sg)}
                              disabled={updateSkillGap.isPending}
                            />
                          }
                        >
                          <Check className="h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>Save score</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{sg.last_reviewed_date}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() =>
                              deleteSkillGap.mutate(sg.id, { onSuccess: () => toast.success('Skill area deleted') })
                            }
                          />
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
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
