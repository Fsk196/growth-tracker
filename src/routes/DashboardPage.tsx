import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, Pencil, Plus, X } from 'lucide-react'
import { useUiStore } from '../store/uiStore'
import { useProjects } from '../features/boards/useProjects'
import { useFieldDefinitions } from '../features/fields/useFieldDefinitions'
import { buildFieldCatalog, type GraphableField } from '../features/dashboard/fieldCatalog'
import { getValidChartTypes, needsAggregationPicker } from '../features/dashboard/chartRules'
import { useAggregateTasks } from '../features/dashboard/useAggregateTasks'
import { extractNumericValue, useScatterTasks } from '../features/dashboard/useScatterTasks'
import { heatmapGrid, pivotForChart } from '../features/dashboard/reshape'
import { useStats } from '../features/dashboard/useStats'
import type { Aggregation, ChartType } from '../store/uiStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Notion's decorative sticker palette — used here only for chart series, never for structural UI.
const SERIES_COLORS = ['#62aef0', '#2a9d99', '#dd5b00', '#1aae39', '#ff64c8', '#523410']
const ALL_PROJECTS = '__all__'
const NO_GROUP_BY = '__none__'

export function DashboardPage() {
  const boardId = useUiStore((s) => s.selectedBoardId)
  const { chartConfig, setChartConfig } = useUiStore()
  const { data: projects = [] } = useProjects(boardId)
  const { data: fieldDefinitions = [] } = useFieldDefinitions(boardId)
  const { data: stats } = useStats(boardId)
  const [dialogOpen, setDialogOpen] = useState(false)

  const catalog = useMemo(() => buildFieldCatalog(fieldDefinitions, projects), [fieldDefinitions, projects])
  const projectNameById = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects])

  const xField = catalog.find((f) => f.key === chartConfig.xField) ?? null
  const yField = catalog.find((f) => f.key === chartConfig.yField) ?? null
  const groupByField = catalog.find((f) => f.key === chartConfig.groupByField) ?? null

  const yOptions = useMemo(() => {
    if (!xField) return []
    if (xField.type === 'number') return catalog.filter((f) => f.type === 'number' && f.key !== xField.key)
    if (xField.type === 'date') return catalog.filter((f) => f.type === 'number')
    if (xField.type === 'select')
      return catalog.filter((f) => (f.type === 'number' || f.type === 'select') && f.key !== xField.key)
    return catalog.filter((f) => f.type === 'number')
  }, [catalog, xField])

  const validChartTypes = xField && yField ? getValidChartTypes(xField.type, yField.type) : []
  const isSelectSelectPairing = xField?.type === 'select' && yField?.type === 'select'

  const groupByOptions = catalog.filter(
    (f) => (f.type === 'select' || f.type === 'text') && f.key !== xField?.key && f.key !== yField?.key,
  )
  const groupByEnabled = chartConfig.chartType === 'line' || chartConfig.chartType === 'bar'

  const hasChart = !!(xField && yField && chartConfig.chartType)

  function labelFor(field: GraphableField | null, rawValue: string): string {
    if (field?.key === 'project_id') return projectNameById.get(rawValue) ?? rawValue
    return rawValue
  }

  function handleXFieldChange(key: string) {
    setChartConfig({ xField: key, yField: null, groupByField: null, chartType: null })
  }

  function handleYFieldChange(key: string) {
    const yf = catalog.find((f) => f.key === key) ?? null
    const types = xField && yf ? getValidChartTypes(xField.type, yf.type) : []
    setChartConfig({ yField: key, chartType: types[0] ?? null, groupByField: null })
  }

  function handleRemoveChart() {
    setChartConfig({ projectId: null, xField: null, yField: null, groupByField: null, chartType: null })
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total tasks" value={stats?.totalTasks ?? '—'} />
        <StatCard label="Current streak" value={stats ? `${stats.streak} day${stats.streak === 1 ? '' : 's'}` : '—'} />
        <StatCard label="Wins this quarter" value={stats?.winsThisQuarter ?? '—'} />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {!hasChart && (
          <Card className="flex flex-col items-center gap-3 p-12 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">No chart yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick a project, then map its fields to a chart to see your progress.
              </p>
            </div>
            <DialogTrigger render={<Button className="mt-2" />}>
              <Plus /> Add chart
            </DialogTrigger>
          </Card>
        )}

        {hasChart && (
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {chartConfig.projectId ? projectNameById.get(chartConfig.projectId) : 'All projects'}
              </p>
              <div className="flex items-center gap-1">
                <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
                  <Pencil className="h-3.5 w-3.5" />
                </DialogTrigger>
                <Button variant="ghost" size="icon-sm" onClick={handleRemoveChart}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <ChartRenderer
              boardId={boardId}
              projectId={chartConfig.projectId}
              xField={xField!}
              yField={yField!}
              groupByField={isSelectSelectPairing ? null : groupByField}
              chartType={chartConfig.chartType!}
              aggregation={chartConfig.aggregation}
              isSelectSelectPairing={!!isSelectSelectPairing}
              labelFor={labelFor}
            />
          </Card>
        )}

        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{hasChart ? 'Edit chart' : 'Add chart'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Field label="Project">
              <Select
                value={chartConfig.projectId ?? ALL_PROJECTS}
                onValueChange={(v) => v && setChartConfig({ projectId: v === ALL_PROJECTS ? null : v })}
                items={{ [ALL_PROJECTS]: 'All projects', ...Object.fromEntries(projects.map((p) => [p.id, p.name])) }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_PROJECTS}>All projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="flex flex-wrap items-end gap-3">
              <Field label="X field">
                <Select
                  value={chartConfig.xField ?? undefined}
                  onValueChange={(v) => v && handleXFieldChange(v)}
                  items={Object.fromEntries(catalog.map((f) => [f.key, f.label]))}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalog.map((f) => (
                      <SelectItem key={f.key} value={f.key}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Y field">
                <Select
                  value={chartConfig.yField ?? undefined}
                  onValueChange={(v) => v && handleYFieldChange(v)}
                  disabled={!xField}
                  items={Object.fromEntries(yOptions.map((f) => [f.key, f.label]))}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {yOptions.map((f) => (
                      <SelectItem key={f.key} value={f.key}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {validChartTypes.length > 1 && (
                <Field label="Chart type">
                  <Select
                    value={chartConfig.chartType ?? undefined}
                    onValueChange={(v) => v && setChartConfig({ chartType: v as ChartType })}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {validChartTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              {needsAggregationPicker(chartConfig.chartType) && (
                <Field label="Aggregation">
                  <Select
                    value={chartConfig.aggregation}
                    onValueChange={(v) => v && setChartConfig({ aggregation: v as Aggregation })}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sum">sum</SelectItem>
                      <SelectItem value="avg">avg</SelectItem>
                      <SelectItem value="count">count</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}

              {groupByEnabled && groupByOptions.length > 0 && (
                <Field label="Group by (optional)">
                  <Select
                    value={chartConfig.groupByField ?? NO_GROUP_BY}
                    onValueChange={(v) => setChartConfig({ groupByField: v === NO_GROUP_BY ? null : v })}
                    items={{ [NO_GROUP_BY]: 'None', ...Object.fromEntries(groupByOptions.map((f) => [f.key, f.label])) }}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_GROUP_BY}>None</SelectItem>
                      {groupByOptions.map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </div>
            {xField && yField && validChartTypes.length === 0 && (
              <p className="text-sm text-destructive">
                No chart type supports {xField.label} ({xField.type}) + {yField.label} ({yField.type}).
              </p>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)} disabled={!hasChart}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
    </Card>
  )
}

interface ChartRendererProps {
  boardId: string | null
  projectId: string | null
  xField: GraphableField
  yField: GraphableField
  groupByField: GraphableField | null
  chartType: ChartType
  aggregation: Aggregation
  isSelectSelectPairing: boolean
  labelFor: (field: GraphableField | null, rawValue: string) => string
}

function ChartRenderer({
  boardId,
  projectId,
  xField,
  yField,
  groupByField,
  chartType,
  aggregation,
  isSelectSelectPairing,
  labelFor,
}: ChartRendererProps) {
  if (chartType === 'scatter') {
    return <ScatterChartView boardId={boardId} projectId={projectId} xField={xField} yField={yField} />
  }

  return (
    <AggregateChartView
      boardId={boardId}
      projectId={projectId}
      xField={xField}
      yField={yField}
      groupByField={groupByField}
      chartType={chartType}
      aggregation={aggregation}
      isSelectSelectPairing={isSelectSelectPairing}
      labelFor={labelFor}
    />
  )
}

function ScatterChartView({
  boardId,
  projectId,
  xField,
  yField,
}: {
  boardId: string | null
  projectId: string | null
  xField: GraphableField
  yField: GraphableField
}) {
  const { data: rows = [], isLoading } = useScatterTasks(boardId, projectId, xField, yField)

  const points = useMemo(
    () =>
      rows
        .map((row) => ({
          x: extractNumericValue(row, xField),
          y: extractNumericValue(row, yField),
        }))
        .filter((p): p is { x: number; y: number } => p.x !== null && p.y !== null),
    [rows, xField, yField],
  )

  if (isLoading) return <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
  if (points.length === 0) return <p className="py-12 text-center text-sm text-muted-foreground">No data yet.</p>

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey="x" name={xField.label} />
        <YAxis type="number" dataKey="y" name={yField.label} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter data={points} fill={SERIES_COLORS[0]} />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

function AggregateChartView({
  boardId,
  projectId,
  xField,
  yField,
  groupByField,
  chartType,
  aggregation,
  isSelectSelectPairing,
  labelFor,
}: {
  boardId: string | null
  projectId: string | null
  xField: GraphableField
  yField: GraphableField
  groupByField: GraphableField | null
  chartType: ChartType
  aggregation: Aggregation
  isSelectSelectPairing: boolean
  labelFor: (field: GraphableField | null, rawValue: string) => string
}) {
  const { data: rows = [], isLoading } = useAggregateTasks({
    boardId,
    projectId,
    xField,
    yField,
    groupByField,
    aggregation,
    isSelectSelectPairing,
  })

  const groupField = isSelectSelectPairing ? yField : groupByField

  if (isLoading) return <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
  if (rows.length === 0) return <p className="py-12 text-center text-sm text-muted-foreground">No data yet.</p>

  if (chartType === 'heatmap') {
    const grid = heatmapGrid(
      rows,
      (v) => labelFor(xField, v),
      (v) => labelFor(groupField, v),
    )
    return (
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2" />
              {grid.yValues.map((y) => (
                <th key={y.raw} className="p-2 text-left font-medium text-muted-foreground">
                  {y.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.xValues.map((x) => (
              <tr key={x.raw}>
                <th className="p-2 text-left font-medium text-muted-foreground">{x.label}</th>
                {grid.yValues.map((y) => {
                  const value = grid.valueAt(x.raw, y.raw)
                  const intensity = value / grid.max
                  return (
                    <td key={y.raw} className="p-2 text-center">
                      <div
                        className="flex h-10 w-14 items-center justify-center rounded text-white"
                        style={{ backgroundColor: `rgba(99, 102, 241, ${0.15 + intensity * 0.75})` }}
                      >
                        {value}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const { data, seriesKeys, singleSeries } = pivotForChart(rows, (v) => labelFor(xField, v))
  const seriesLabels = seriesKeys.map((k) => (singleSeries ? yField.label : labelFor(groupField, k)))

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          {seriesKeys.length > 1 && <Legend />}
          {seriesKeys.map((key, i) => (
            <Line key={key} type="monotone" dataKey={key} name={seriesLabels[i]} stroke={SERIES_COLORS[i % SERIES_COLORS.length]} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    )
  }

  // bar and stacked-bar
  const stacked = chartType === 'stacked-bar'
  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        {seriesKeys.length > 1 && <Legend />}
        {seriesKeys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            name={seriesLabels[i]}
            stackId={stacked ? 'stack' : undefined}
            fill={SERIES_COLORS[i % SERIES_COLORS.length]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
