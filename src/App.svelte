<head>
  <meta charset="UTF-8">
</head>

<script>
  import Table from './Table.svelte'
  import Graph from './Graph.svelte'
  import info from '../output/info.json'

  let graphs = []
  let normalize = false
  let uselog = true
  let date_index = info['dates'].length - 1

</script>

<main>
  <h1>COVID-19 Data</h1>

  <p>
  First steps with
  <a target="_blank" href="https://svelte.dev">Svelte</a>
  and
  <a target="_blank" href="https://github.com/d3/">d3</a>
  |
  data from
  <a target="_blank" href="https://github.com/CSSEGISandData/COVID-19">CSSEGISandData</a>
  and
  <a target="_blank" href="https://github.com/openZH/covid_19">openZH</a>
  </p>

  <div>
    <Graph {graphs} {normalize} {uselog} bind:date_index />
  </div>
  <Table bind:graphs bind:normalize bind:date_index bind:uselog />
</main>

<style>
  main {
    text-align: center;
    margin: 0 auto;
    max-width: 810px;
    margin-bottom: 50px;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (max-width: 800px) {
    h1 {
      font-size: 8vw;
    }
    .nonessential {
      display: none;
    }
  }

  Table {
    margin-bottom: 3rem;
  }
</style>
