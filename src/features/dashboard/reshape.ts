import { groupBy, uniq } from 'es-toolkit'

export interface AggregateRow {
  x_value: string
  group_value: string | null
  agg_value: number
}

const NO_GROUP = '__value__'

// Pivots RPC rows into the wide array shape recharts expects:
// [{ name: x1, seriesA: 1, seriesB: 2 }, ...]. Pure reshaping — the sum/avg/
// count already happened in Postgres; this never re-aggregates.
export function pivotForChart(rows: AggregateRow[], labelFor: (value: string) => string) {
  const seriesKeys = uniq(rows.map((r) => r.group_value ?? NO_GROUP))
  const byX = groupBy(rows, (r) => r.x_value)

  const data = Object.entries(byX).map(([xValue, items]) => {
    const entry: Record<string, string | number> = { name: labelFor(xValue) }
    for (const item of items) {
      entry[item.group_value ?? NO_GROUP] = item.agg_value
    }
    return entry
  })

  return { data, seriesKeys, singleSeries: seriesKeys.length === 1 && seriesKeys[0] === NO_GROUP }
}

export function heatmapGrid(rows: AggregateRow[], xLabelFor: (v: string) => string, yLabelFor: (v: string) => string) {
  const xValues = uniq(rows.map((r) => r.x_value))
  const yValues = uniq(rows.map((r) => r.group_value ?? ''))
  const lookup = new Map(rows.map((r) => [`${r.x_value}::${r.group_value ?? ''}`, r.agg_value]))
  const max = Math.max(1, ...rows.map((r) => r.agg_value))

  return {
    xValues: xValues.map((v) => ({ raw: v, label: xLabelFor(v) })),
    yValues: yValues.map((v) => ({ raw: v, label: yLabelFor(v) })),
    valueAt: (x: string, y: string) => lookup.get(`${x}::${y}`) ?? 0,
    max,
  }
}

export const NO_GROUP_KEY = NO_GROUP
