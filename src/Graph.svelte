<script>
  // https://github.com/distillpub/post--visual-exploration-gaussian-processes/blob/master/src/components/Teaser.html
  // https://github.com/gabgoh/epcalc/blob/master/src/Chart.svelte
  // https://www.d3-graph-gallery.com/graph/line_basic.html

  import { beforeUpdate } from 'svelte'

  import Line from './Line.svelte'

  import * as d3 from 'd3'

  import { parseDate, table, info, colidx, rowidx, nevernorm } from './utils.js'

  export let date_index

  const date0 = parseDate(info.dates[0])
  const date1 = parseDate(info.dates[info.dates.length - 1])

  const times = info.dates.map((date, idx) => [new Date(date).getTime(), idx])
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
  export let uselog = true

  $: data = graphs.map(g => get(normalize, uselog, g.name, g.col))
  $: max = Math.max.apply(null,
    data.map(vs => Math.max.apply(null, vs.map(v => v.value)))
  ) + 0 * normalize
  $: min = normalize ? 1e-5 : 1
  $: x = d3.scaleTime().domain([date0, date1]).range([0, width])
  $: y = (uselog ? d3.scaleLog() : d3.scaleLinear()).domain([min, max]).range([height, 0])
  $: dx = x(new Date(2020, 0, 1)) - x(new Date(2020, 0, 0))
  $: cursx = x(new Date(info.dates[date_index]))

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

  function normed(data, name, col, normalize) {
    const row = data[rowidx[name]] || {}
    let value = row[colidx[col]]
    if (normalize && !nevernorm.has(col)) {
      const pop = info.population[rowidx[name]] || 0
      if (!pop) return
      value = 100 * value / pop
    }
    return value
  }
  function get(normalize, uselog, name, col) {
    return info.dates.map((date, idx) => ({
      date: parseDate(date),
      value: normed(table[idx], name, col, normalize)
    })).filter(d => d.value)
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
        const [t, idx] = times[times_bisect(x.invert(mx - left), 0, times.length - 1)]
        date_index = idx
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
