
<script>
  import { derivers, parseDate } from './utils.js'
  import bydate from '../output/bydate.json'

  export let graphs = []
  export let normalize = false
  let filter = ''

  const dates = sorted(bydate.map(row => row.date))
  let date_index = dates.length - 1
  let sortby = 'confirmed'
  let sortmul = -1
  let digits = 3
  let pagesize = 20
  let pagenum = 0

  let i18n = true
  let countries = true
  let states = true
  let counties = false

  const srccols = [
    'confirmed',
    'new',
    'active',
    'recovered',
    'deaths',
    'pop',
  ]
  const derived = [
    'fatality',
//    'fatality2',
  ]
  const alwayspct = new Set([
    'fatality',
    'fatality2',
  ])
  const neverpct = new Set([
    'pop',
  ])
  const nevernorm = new Set([
    'pop',
  ])
  const essential = new Set([
    'name',
    'confirmed',
    'deaths',
    'fatality',
  ])
  const numbercols  = [...srccols, ...derived]
  function colname(col) {
    return col === 'pop' ? 'Population' :
      col.substr(0, 1).toLocaleUpperCase() + col.substr(1)
  }
  const selectable = new Set(srccols.concat(derived).filter(
    col => col !== 'pop'))
  const prio1 = new Set(['name', 'confirmed', 'deaths', 'fatality'])
  const prio2 = new Set(['pop'])
  const prio3 = new Set(srccols.concat(derived).filter(
    col => !prio1.has(col) && !prio2.has(col)))
  function colprio(col) {
    return {
      name: 1,
      confirmed: 1,
      deaths: 1,
      fatality: 1,
      pop: 2,
    } || 3
  }

  const cmp2 = (atop, btop, cmp) => {
    return 2 * btop - 2 * atop + Math.min(1, Math.max(-1, cmp))
  }
  const comparators = sortby => {
    if (sortby === 'name') return (a, b) => a.localeCompare(b)
    return (a, b) => a - b
  }

  $: rows = torows(
    bydate[date_index].data,
    filter,
    sortby, sortmul, normalize,
    i18n, countries, states, counties)
  $: pages = Array.from(Array(Math.ceil(rows.length / pagesize)).keys())
  $: page = rows.slice(pagenum * pagesize, (pagenum + 1) * pagesize)

  function sorted(arr) {
    arr.sort()
    return arr
  }

  function matches_any(name, res) {
    for (let i = 0; i < res.length; ++i) {
      if (res[i].exec(name)) {
        return true
      }
    }
    return res.length === 0
  }

  function torows(
      d,
      filter,
      sortby, sortmul, normalize,
      i18n, countries, states, counties) {
    const sums = {}
    const res = filter.split(/\s+/g).filter(s => s).map(s => new RegExp(s, 'i'))
    let rows = Object.keys(d).map(name => ({
      name, ...d[name], pinned: matches_any(name, res)
    })).filter(d => (
      (!normalize || d.pop) && (
        (i18n && d.level === 'i18n') ||
        (countries && d.level === 'country') ||
        (states && d.level === 'state') ||
        (counties && d.level === 'county')
      )
    )).map(row => {
      derived.forEach(col => row[col] = derivers[col](row))
      return row
    })
    if (normalize) {
      rows = rows.filter(row => row.pop).map(row => {
        const d = {...row}
        srccols.forEach(col => nevernorm.has(col) ? row[col] : (
          d[col] = row[col] / row.pop))
        return d
      })
    }
    rows.sort((a, b) => cmp2(
      a.pinned, b.pinned,
      sortmul * comparators(sortby)(a[sortby], b[sortby])
    ))
    return rows
  }

  function nicedate(date) {
    date = parseDate(date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  function nicenumber(col, number, normalize) {
    if (number === null) {
      return '-'
    }
    if (alwayspct.has(col) || (normalize && !neverpct.has(col))) {
      return `${(number * 100).toFixed(digits)}%`
    }
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function headerclick(name) {
    if (name === sortby) {
      sortmul *= -1
    } else {
      sortby = name
      sortmul = 1
    }
  }

  const colors = [
    '#ef5350',
    '#AB47BC',
    '#5C6BC0',
    '#29B6F6',
    '#26A69A',
    '#9CCC65',
    '#8D6E63',
    '#78909C',
  ]  // Some of Material UI's 400er colors
  function getcolor() {
    const used = new Set(graphs.map(g => g.color))
    const available = colors.filter(c => !used.has(c))
    return available.length ? available[0] : colors[
      Math.floor(Math.random() * colors.length)]
  }
  function style(graphs, name, col) {
    const idx = graphs.findIndex(g => g.name === name && g.col === col)
    if (idx === -1) {
      return ''
    } else {
      const { color } = graphs[idx]
      return `background-color: ${color}`
    }
  }
  let t0 = 0
  function select(name, col) {
    function handler() {

      if (!selectable.has(col)) {
        return
      }

      if (Date.now() - t0 < 100) {
        // For some weird reason, this is sometimes called 2x in a row on some
        // cells when `normalize` is on...
        console.log('debounced!')
        return
      }
      t0 = Date.now()

      if (selected(graphs, name, col)) {
        graphs = graphs.filter(g => g.name !== name || g.col !== col)
        this.classList.remove('selected')
        this.style.backgroundColor = null
      } else {
        const color = getcolor()
        graphs = [...graphs, {name, col, color}]
        this.classList.add('selected')
        this.style = style(graphs, name, col)
      }
    }
    return handler
  }
  function selected(graphs, name, col) {
    return graphs && graphs.findIndex(g => g.name === name && g.col === col) !== -1
  }
</script>

<div class="datesel">
  <input type=range min=0 max="{dates.length - 1}" bind:value={date_index} >
  <span class="date">{nicedate(dates[date_index])}</span>
</div>

<div class="controls">
  <label>
    <input type=checkbox bind:checked={normalize}>
    Normalize numbers
  </label>
  <input bind:value={filter} placeholder="pin on top" />
  <button
    on:click={() => {graphs = []; filter = ''}}
    >
    reset
  </button>
</div>

<table>
  <thead>
    <tr>
      <td class="prio1"></td>
      {#each numbercols as col}
        <td
          on:click={() => headerclick(col)}
          class:asc="{sortby === col && sortmul === 1}"
          class:desc="{sortby === col && sortmul === -1}"
          class:prio1="{prio1.has(col)}"
          class:prio2="{prio2.has(col)}"
          class:prio3="{prio3.has(col)}"
          >{colname(col)}</td>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each page as row (row.name)}
      <tr>
        <td class="name prio1">{row.name}</td>
        {#each numbercols as col}
          <td
            class:number="{true}"
            class:clickable="{selectable.has(col)}"
            on:click={select(row.name, col)}
            class:selected="{selected(graphs, row.name, col)}"
            class:prio1="{prio1.has(col)}"
            class:prio2="{prio2.has(col)}"
            class:prio3="{prio3.has(col)}"
            style="{style(graphs, row.name, col)}"
            >
            &nbsp;&nbsp;&nbsp;
            {nicenumber(col, row[col], normalize)}
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<div class="pagination">
  Show page
  {#each pages as page}
    <a class:sel="{pagenum === page}" on:click={() => pagenum = page}>
      {page + 1}
    </a>
  {/each}
</div>

<div class="include">
  Show data for:<br>
  <label>
    <input type=checkbox bind:checked={i18n}>
    International
  </label>
  <label>
    <input type=checkbox bind:checked={countries}>
    Countries
  </label>
  <label>
    <input type=checkbox bind:checked={states}>
    States
  </label>
  <label>
    <input type=checkbox bind:checked={counties}>
    Counties
  </label>
</div>

<style>
  .hidden {
    display: none;
  }
  .datesel {
    display: flex;
  }
  .datesel input {
    flex-grow: 1;
  }
  .datesel .date {
    width: 2rem;
    text-align: right;
  }
  .controls {
    display: flex;
    justify-content: space-around;
  }
  .controls input[input=text] {
    width: 40%;
  }
  .pagination {
    margin-top: 1rem;
    text-align: left;
    flex-grow: 1;
  }
  .pagination a {
    cursor: pointer;
    margin-left: 1rem;
  }
  .pagination a.sel {
    font-weight: bold;
    color: black;
  }
  .include {
    margin-top: 1rem;
    text-align: left;
  }
  @media (min-width: 550px) {
    .include {
      display: flex;
      justify-content: space-around;
    }
  }

  table {
    margin: 0 auto;
    border-collapse: collapse;
  }
  thead {
    border-bottom: 2px solid black;
  }
  thead td {
    cursor: pointer;
    text-align: right;
    padding-left: 10px;
  }
  thead .asc:after {
    content: '▲';
  }
  thead .desc:after {
    content: '▼';
  }
  td {
    /* padding: 0 1rem; */
  }
  td.name {
    font-weight: bold;
    max-width: 140px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: clip;
    text-overflow: ellipsis;
  }
  td.number {
    text-align: right;
  }
  td.clickable {
    cursor: pointer;
  }
  td.selected {
    background: black;
    color: white;
  }
  td {
    text-align: left;
  }

  @media (max-width: 880px) {
    .prio3 {
      display: none;
    }
  }

  @media (max-width: 550px) {
    .prio2, .prio3 {
      display: none;
    }
    td {
      padding: 0;
    }
  }
</style>
