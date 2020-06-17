<script>
  import Table from './Table.svelte'
  import Graph from './Graph.svelte'
  import bydate from '../output/bydate.json'

  let graphs = []
  let normalize = false
  let date_index = bydate.length - 1

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
  </p>

  <div class="nonessential">
    <Graph {graphs} {normalize} bind:date_index />
  </div>
  <Table bind:graphs bind:normalize bind:date_index />
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
