import { useMemo } from 'react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Notion's decorative sticker palette — used here only for chart series, never for structural UI.
const SERIES_COLORS = ['#62aef0', '#2a9d99', '#dd5b00', '#1aae39', '#ff64c8', '#523410']

export function DashboardPage() {
  const boardId = useUiStore((s) => s.selectedBoardId)
  const { chartConfig, setChartConfig } = useUiStore()
  const { data: projects = [] } = useProjects(boardId)
  const { data: fieldDefinitions = [] } = useFieldDefinitions(boardId)
  const { data: stats } = useStats(boardId)

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

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total tasks" value={stats?.totalTasks ?? '—'} />
        <StatCard label="Current streak" value={stats ? `${stats.streak} day${stats.streak === 1 ? '' : 's'}` : '—'} />
        <StatCard label="Wins this quarter" value={stats?.winsThisQuarter ?? '—'} />
      </div>

      <Card className="mb-6 p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Chart configuration</h2>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="X field">
            <Select value={chartConfig.xField ?? undefined} onValueChange={handleXFieldChange}>
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
            <Select value={chartConfig.yField ?? undefined} onValueChange={handleYFieldChange} disabled={!xField}>
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
                onValueChange={(v) => setChartConfig({ chartType: v as ChartType })}
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
                onValueChange={(v) => setChartConfig({ aggregation: v as Aggregation })}
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
          <p className="mt-3 text-sm text-destructive">
            No chart type supports {xField.label} ({xField.type}) + {yField.label} ({yField.type}).
          </p>
        )}
      </Card>

      <Card className="p-4">
        {xField && yField && chartConfig.chartType ? (
          <ChartRenderer
            boardId={boardId}
            xField={xField}
            yField={yField}
            groupByField={isSelectSelectPairing ? null : groupByField}
            chartType={chartConfig.chartType}
            aggregation={chartConfig.aggregation}
            isSelectSelectPairing={!!isSelectSelectPairing}
            labelFor={labelFor}
          />
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">Pick an X and Y field to render a chart.</p>
        )}
      </Card>
    </div>
  )
}

const NO_GROUP_BY = '__none__'

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
  xField,
  yField,
  groupByField,
  chartType,
  aggregation,
  isSelectSelectPairing,
  labelFor,
}: ChartRendererProps) {
  if (chartType === 'scatter') {
    return <ScatterChartView boardId={boardId} xField={xField} yField={yField} />
  }

  return (
    <AggregateChartView
      boardId={boardId}
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
  xField,
  yField,
}: {
  boardId: string | null
  xField: GraphableField
  yField: GraphableField
}) {
  const { data: rows = [], isLoading } = useScatterTasks(boardId, xField, yField)

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
  xField,
  yField,
  groupByField,
  chartType,
  aggregation,
  isSelectSelectPairing,
  labelFor,
}: {
  boardId: string | null
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
