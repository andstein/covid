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

const cols = [...info_.cols, 'new7d', 'confirmed', 'recovered', 'deaths', 'active', 'fatality']
export const rowidx = Object.fromEntries(
  info_.rows.map((name, idx) => [name, idx]))
export const colidx = Object.fromEntries(
  cols.map((name, idx) => [name, idx]))

function extend(table) {
  const t0 = new Date().getTime()
  const new7d = {}
  const confirmed = {}
  const recovered = {}
  const deaths = {}
  const augmented = table.map(date => date.map((row, idx) => {
    if (!row) return
    new7d[idx] = (new7d[idx] || 0)*6/7 + row[colidx.new]/7
    confirmed[idx] = (confirmed[idx] || 0) + row[colidx.new]
    recovered[idx] = (recovered[idx] || 0) + row[colidx.drecovered]
    deaths[idx]    = (   deaths[idx] || 0) + row[colidx.ddeaths]
    const active = confirmed[idx] - deaths[idx] - recovered[idx]
    const fatality = deaths[idx] / confirmed[idx]
    return [...row, Math.round(new7d[idx]), confirmed[idx], recovered[idx], deaths[idx], active, fatality]
  }))
  console.log('extend.dt', new Date().getTime() - t0)
  return augmented
}

export const table = extend(fillnulls(table_))
export const info = { ...info_, cols, }