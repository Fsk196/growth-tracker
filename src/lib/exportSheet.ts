import * as XLSX from 'xlsx'

export function exportRowsToXlsx(sheetName: string, rows: Record<string, unknown>[], filenamePrefix: string) {
  const workbook = XLSX.utils.book_new()
  const worksheet = rows.length ? XLSX.utils.json_to_sheet(rows) : XLSX.utils.aoa_to_sheet([[]])
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  const date = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `${filenamePrefix}-${date}.xlsx`)
}
