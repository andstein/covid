export const parseDate = s => {
  const [year, month, day] = s.split('-')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

function fillnulls(table) {
  return table.map(row => row.map(values => (
    values || Array(info_.cols.length).fill(0)
  )))
}

export const nevernorm = new Set(['pop', 'fatality'])

import table_ from '../output/table.json'
import info_ from '../output/info.json'

const cols = [...info_.cols, 'new7d', 'confirmed', 'recovered', 'deaths', 'active', 'fatality']
export const rowidx = Object.fromEntries(
  info_.rows.map((name, idx) => [name, idx]))
export const colidx = Object.fromEntries(
  cols.map((name, idx) => [name, idx]))

const RunningAverage = length => {
  const data = Array(length).fill(0)
  let n = 0, sum = 0
  return {
    get: () => sum / Math.min(7, n),
    add: value => {
      const i = n++ % data.length
      sum -= data[i]
      data[i] = value
      sum += data[i]
    },
  }
}

function extend(table) {
  const t0 = new Date().getTime()
  const new7d = {}
  const confirmed = {}
  const recovered = {}
  const deaths = {}
  const augmented = table.map(date => date.map((row, idx) => {
    if (!row) return
    if (!new7d[idx]) new7d[idx] = RunningAverage(7)
    new7d[idx].add(row[colidx.new])
    confirmed[idx] = (confirmed[idx] || 0) + row[colidx.new]
    recovered[idx] = (recovered[idx] || 0) + row[colidx.drecovered]
    deaths[idx]    = (   deaths[idx] || 0) + row[colidx.ddeaths]
    const active = confirmed[idx] - deaths[idx] - recovered[idx]
    const fatality = deaths[idx] / confirmed[idx]
    return [...row, Math.round(new7d[idx].get()), confirmed[idx], recovered[idx], deaths[idx], active, fatality]
  }))
  console.log('extend.dt', new Date().getTime() - t0)
  return augmented
}

export const table = extend(fillnulls(table_))
export const info = { ...info_, cols, }