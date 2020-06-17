
export const parseDate = s => {
  const [year, month, day] = s.split('-')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

export const derivers = {
  fatality: row => row.confirmed && row.deaths / row.confirmed,
  fatality2: row => row.recovered + row.deaths && row.deaths / (
    row.recovered + row.deaths),
}
