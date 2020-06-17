<script>
  // https://github.com/distillpub/post--visual-exploration-gaussian-processes/blob/master/src/components/Teaser.html
  // https://github.com/gabgoh/epcalc/blob/master/src/Chart.svelte
  // https://www.d3-graph-gallery.com/graph/line_basic.html

  import { beforeUpdate } from 'svelte'

  import Line from './Line.svelte'

  import * as d3 from 'd3'

  import { derivers, parseDate } from './utils.js'
  import bydate from '../output/bydate.json'

  export let date_index

  const date0 = parseDate(bydate[0].date)
  const date1 = parseDate(bydate[bydate.length - 1].date)

  const times = bydate.map((d, idx) => [new Date(d.date).getTime(), idx])
  times.sort()
  const times_bisect = (t, i, j) => {
    if (j - i < 2) {
      return t - times[i][0] < times[j][0] - t ? i : j
    }
    const ij = (i + j) >> 1
    return t <= times[ij][0] ? times_bisect(t, i, ij) : times_bisect(t, ij, j)
  }


  export let graphs = []
  export let normalize = false

  $: data = graphs.map(g => get(normalize, g.name, g.col))
  $: max = normalize ? 100 : Math.max.apply(null,
    data.map(vs => Math.max.apply(null, vs.map(v => v.value)))
  )
  $: min = normalize ? 1e-5 : 1
  $: x = d3.scaleTime().domain([date0, date1]).range([0, width])
  $: y = d3.scaleLog().domain([min, max]).range([height, 0])
  $: dx = x(new Date(2020, 0, 1)) - x(new Date(2020, 0, 0))
  $: cursx = x(new Date(bydate[date_index].date))

  let width = 700
  let height = 300
  let top = 10
  let right = 10
  let bottom = 30
  let left = 70

  let svg
  let grid
  let xaxis
  let yaxis
  let curs

  function or_zero(x) {
    return Number.isFinite(x) ? x : 0
  }
  function normed(normalize, data, name, col) {
    const row = data[name] || {}
    if (derivers.hasOwnProperty(col)) {
      return 100 * derivers[col](row)
    }
    const value = row[col]
    if (normalize) {
      const pop = (data[name] || {pop: 0}).pop
      if (pop) {
        return 100 * value / pop
      }
      return 0
    }
    return value
  }
  function get(normalize, name, col) {
    return bydate.map(({date, data}) => ({
      date: parseDate(date),
      value: or_zero(normed(normalize, data, name, col))
    })).filter(v => v.value > 0)
  }

  beforeUpdate(() => {
    if (!svg) return
    const ticks = 5
    d3.select(xaxis).call(d3.axisBottom(x))
    d3.select(yaxis).call(
      d3.axisLeft(y).ticks(ticks, normalize ? '.3f' : ',.0f')
    )
    if (!y.ticks(ticks).length) return
    d3.select(svg)
      .on('mousemove', () => {
        const [mx, my] = d3.mouse(svg)
        const [t, idx] = times[times_bisect(x.invert(mx), 0, times.length - 1)]
        date_index = idx
        console.log(date_index)
      })
      // .on('mouseleave', () => curs.setAttribute('opacity', 0))
      // .on('mouseenter', () => curs.setAttribute('opacity', 1))
    return  // should adjust when axis adjusts ...
    d3.select(grid)
      .selectAll('line.horizontalGrid')
      /* .remove() */
      .data(y.ticks(ticks))
      .enter().append('line')
      .attr('class', 'horizontalGrid')
      .attr('x1' , 0)
      .attr('x2' , width)
      .attr('y1' , d => y(d) + 0.5)
      .attr('y2' , d => y(d) + 0.5)
      .attr('fill' , 'none')
      .attr('shape-rendering', 'crispEdges')
      .attr('stroke', 'light gray')
      .attr('stroke-width', '1px')
  })

</script>

<svg bind:this={svg} width={width + left + right} height={height + top + bottom}>
  <defs>
    <clipPath id="clip">
      <rect x="0" y="0" width="{width}" height="{height}" />
    </clipPath>
  </defs>
  <g transform="translate({left}, {top})">
    <rect bind:this={curs} x={cursx - dx/2} height={height} width={dx} fill="#eee" clip-path="url(#clip)" />
    <g bind:this={grid} />
    {#each graphs as graph, i}
      <Line {...graph} values={data[i]} {x} {y} />
    {/each}
  </g>
  {#if graphs.length == 0}
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">
      No Data Selected
    </text>
  {/if}
  <g bind:this={xaxis} transform="translate({left}, {top + height})" />
  <g bind:this={yaxis} transform="translate({left}, {top})" />
</svg>

<style>
  svg {
    margin-left: -40px;
  }
</style>
