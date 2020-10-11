export const parseDate = s => {
  const [year, month, day] = s.split('-')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

function fillnulls(table) {
  return table.map(row => row.map(values => (
    values || Array(info_.cols.length).fill(0)
  )))
}

import table_ from '../output/table.json'
import info_ from '../output/info.json'

const cols = [...info_.cols, 'confirmed', 'active', 'fatality']
export const rowidx = Object.fromEntries(
  info_.rows.map((name, idx) => [name, idx]))
export const colidx = Object.fromEntries(
  cols.map((name, idx) => [name, idx]))

function extend(table) {
  const confirmed = {}
  return table.map(date => date.map((row, idx) => {
    if (!row) return
    confirmed[idx] = (confirmed[idx] || 0) + row[colidx.new]
    const active = confirmed[idx] - row[colidx.deaths] - row[colidx.recovered]
    const fatality = row[colidx.deaths] / confirmed[idx]
    return [...row, confirmed[idx], active, fatality]
  }))
}

export const table = extend(fillnulls(table_))
export const info = { ...info_, cols, }