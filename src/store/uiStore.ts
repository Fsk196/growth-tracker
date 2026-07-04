import { create } from 'zustand'

export type ChartType = 'line' | 'bar' | 'scatter' | 'stacked-bar' | 'heatmap'
export type Aggregation = 'sum' | 'avg' | 'count'

export interface ChartConfig {
  projectId: string | null
  xField: string | null
  yField: string | null
  groupByField: string | null
  chartType: ChartType | null
  aggregation: Aggregation
}

interface TaskFilters {
  type: string | null
  dateFrom: string | null
  dateTo: string | null
}

interface UiState {
  selectedBoardId: string | null
  setSelectedBoardId: (id: string | null) => void

  taskFilters: TaskFilters
  setTaskFilters: (filters: Partial<TaskFilters>) => void
  resetTaskFilters: () => void

  chartConfig: ChartConfig
  setChartConfig: (config: Partial<ChartConfig>) => void
}

const defaultTaskFilters: TaskFilters = {
  type: null,
  dateFrom: null,
  dateTo: null,
}

const defaultChartConfig: ChartConfig = {
  projectId: null,
  xField: null,
  yField: null,
  groupByField: null,
  chartType: null,
  aggregation: 'sum',
}

export const useUiStore = create<UiState>((set) => ({
  selectedBoardId: null,
  setSelectedBoardId: (id) => set({ selectedBoardId: id }),

  taskFilters: defaultTaskFilters,
  setTaskFilters: (filters) =>
    set((state) => ({ taskFilters: { ...state.taskFilters, ...filters } })),
  resetTaskFilters: () => set({ taskFilters: defaultTaskFilters }),

  chartConfig: defaultChartConfig,
  setChartConfig: (config) =>
    set((state) => ({ chartConfig: { ...state.chartConfig, ...config } })),
}))
