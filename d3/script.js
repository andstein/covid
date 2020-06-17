const pd = { top: 5, left: 50, right: 15, bottom: 30 };
const width = 500;
const height = 300;

const f = (d) => {

  const svg = d3
    .select('svg')
    .attr('width', width + pd.left + pd.right)
    .attr('height', height + pd.top + pd.bottom)

  const clip = svg
    .append('defs')
    .append('SVG:clipPath')
    .attr('id', 'clip')
    .append('SVG:rect')
    .attr('width', width)
    .attr('height', height)
    .attr('x', 0)
    .attr('y', 0)

  const x = d3
    .scaleTime()
    .domain(d3.extent(d.map((v) => v.date)))
    .range([0, width])

  const y = d3
    .scaleLog()
    .domain(d3.extent(d.map((v) => v.value)))
    .range([height, 0])

  const xa = svg
    .append('g')
    .attr('transform', `translate(${pd.left}, ${pd.top + height})`)
    .call(d3.axisBottom(x))

  const ya = svg
    .append('g')
    .attr('transform', `translate(${pd.left}, ${pd.top})`)
    .call(
      d3.axisLeft(y).ticks(4, ',.0f')
    )

  const grid = svg  ////
    .append('g')
    .attr('transform', `translate(${pd.left}, ${pd.top})`)
    .selectAll('line.horizontal')
    .data(y.ticks(4))
    .enter()
    .append('line')
    .attr('class', 'horizontal')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', d => y(d) + 0.5)
    .attr('y2', d => y(d) + 0.5)
    .attr('stroke', '#888')
    .attr('stroke-width', '1px')

  const g = svg
    .append('g')
    .attr('transform', `translate(${pd.left}, ${pd.top})`)

  const xz = d3.zoom()
    .scaleExtent([1, 5])
    .extent([[0, 0], [width, height]])
    .on('zoom', zooming)

  const rect = g
    .append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'none')
    .style('pointer-events', 'all')
    .call(xz)

  const ly = g
    .append('line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', 0)
    .attr('y2', 0)
    .attr('stroke', '#888')
    .attr('stroke-width', '1px')
  // .attr('opacity', 0)

  const lx = g
    .append('line')
    .attr('x1', 0)
    .attr('x2', 0)
    .attr('y1', 0)
    .attr('y2', height)
    .attr('stroke', '#888')
    .attr('stroke-width', '1px')
    // .attr('opacity', 0)

  svg
    .on('mousemove', () => {
      const [x, y] = d3.mouse(g.node())
      ly
        .attr('y1', y)
        .attr('y2', y)
      lx
        .attr('x1', x)
        .attr('x2', x)
    })

  const line = g.append('path')
    .attr('clip-path', 'url(#clip)')
    .datum(d)
    .attr(
      'd',
      d3
        .line()
        .x(v => round(x(v.date)))
        .y(v => round(y(v.value)))
    )
    .attr('stroke', 'red')
    .attr('fill', 'none')
    .attr('stroke-width', 2)

  const sel = []
  const points2 = g.append('g')  ////
    .selectAll('circle')
    .data(d)
    .enter()
    .append('circle')
    .attr('cx', v => round(x(v.date)))
    .attr('cy', v => round(y(v.value)))
    .attr('r', 0)
    .attr('fill', 'black')
    .attr('data-index', (d, i) => i)
  const points1 = g.append('g')
    .selectAll('circle')
    .data(d)
    .enter()
    .append('circle')
    .attr('cx', v => round(x(v.date)))
    .attr('cy', v => round(y(v.value)))
    .attr('r', 4)
    .style('pointer-events', 'all')
    .attr('fill', 'none')
    .attr('data-index', (d, i) => i)
    .on('mouseover', function() {
      on(this)
    })
    .on('mouseout', function() {
      if (sel.indexOf(this) === -1) {
        off(this)
      }
    })
    .on('click', function() {
      const i = sel.indexOf(this)
      if (i === -1) {
        if (sel.length > 1) {
          off(sel.splice(0, 1)[0])
          console.log('=>', sel)
        }
        sel.push(this)
      } else {
        off(sel.splice(i, 1)[0])
      }
    })
  function on(p) {
    const idx = d3.select(p).attr('data-index')
    const p2 = points2.filter((d, i) => i == idx)
    p2.transition().duration(200).attr('r', 4)
    console.log(idx, p2)
  }
  function off(p) {
    const idx = d3.select(p).attr('data-index')
    const p2 = points2.filter((d, i) => i == idx)
    p2.transition().duration(200).attr('r', 0)
  }

  document.getElementById('button')

  function zooming(e) {
    const nx = d3.event.transform.rescaleX(x)  ////
    xa.call(d3.axisBottom(nx))
    line.attr(
      'd',
      d3
      .line()
      .x((v) => round(nx(v.date)))
      .y((v) => round(y(v.value)))
    )
    points1
      .attr('cx', v => round(nx(v.date)))
      .attr('cy', v => round(y(v.value)))
    points2
      .attr('cx', v => round(nx(v.date)))
      .attr('cy', v => round(y(v.value)))
  }

  function round(v) {
    return Math.round(v * 100) / 100
  }
};

fetch('data.json').then(res => res.json()).then(data => {
  f(data.map((v) => ({
    date: new Date(v.date),
    value: v.value
  })))
})

