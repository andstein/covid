<script>
  import { beforeUpdate } from 'svelte'
  import { tweened } from 'svelte/motion'
  import { cubicOut } from 'svelte/easing'

  import * as d3 from 'd3'

  export let name
  export let col
  export let color

  export let values
  export let x
  export let y

  let path
  let initialized = false
  let animation_ms = 200

  beforeUpdate(() => {

    if (!path) return
    d3.select(path).datum(values)
      .transition().duration(animation_ms).attr('d', d3.line()
        .x(v => x(v.date))
        .y(v => y(v.value))
      )
    if (!initialized) {
      d3.select(path)
        .style('opacity', 0)
        .transition().duration(animation_ms)
        .style('opacity', 1)
    }
    initialized = true
  })

  const opacity = tweened(0, {
    duration: animation_ms,
    easing: cubicOut
  })
  opacity.set(1)

</script>

<path
   style="opacity: {opacity}"
   bind:this={path}
   clip-path="url(#clip)"
   stroke={color}
   fill="none"
   stroke-width=2
   />

