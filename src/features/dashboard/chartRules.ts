import type { GraphableFieldType } from './fieldCatalog'
import type { ChartType } from '../../store/uiStore'

// Type-pairing rules table: only these (xType, yType) combos are graphable,
// and only the listed chart types are valid for each — don't offer chart
// types that don't apply to the selected field-type pairing.
export function getValidChartTypes(xType: GraphableFieldType, yType: GraphableFieldType): ChartType[] {
  if (xType === 'date' && yType === 'number') return ['line']
  if ((xType === 'select' || xType === 'text') && yType === 'number') return ['bar']
  if (xType === 'number' && yType === 'number') return ['scatter']
  if (xType === 'select' && yType === 'select') return ['stacked-bar', 'heatmap']
  return []
}

export function needsAggregationPicker(chartType: ChartType | null): boolean {
  return chartType === 'bar'
}
