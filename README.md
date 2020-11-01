# Covid

Some COVID-19 stats, showing data from [CSSEGISandData] and [openZH] with [Svelte] and [d3].

0. download data : `cd inputs && git clone --depth=1 https://github.com/CSSEGISandData/COVID-19 && git clone --depth=1 https://github.com/openZH/covid_19`
1. update data : `(cd inputs/COVID-19 && git pull) && (cd inputs/covid_19 && git pull)`
2. regenerate json : `python3 udpate.py 10`
3. start devel server : `yarn dev`

optionally only generate last X days for quicker compilation: `python3 update.py X`

[CSSEGISandData]: https://github.com/CSSEGISandData/COVID-19
[openZH]: https://github.com/openZH/covid_19
[Svelte]: https://svelte.dev/
[d3]: https://d3js.org/

content

- `d3/` : playground for WIP d3 features
- `inputs/` : various input files and `notebook.ipynb` for visualization
- `src/` : Svelte app (graph, table, ...)

## TODO

- resize graph correctly on mobile
- store state in URL
- interrupt lines instead of going to zero when data is missing
- legend
- extrapolation
- zoom
- relative X axis (e.g. when confirmed=10)
- pin by mouseclick

## data format

data is stored in a somewhat efficient way by generating a JSON that contains
3D tabular data (date, country, column) where the columns only store delta
values from the previous day. it is assumed that new cases either disappear
through recovery or death.

## cheap deploy

Update automatically on server using crontab.

1. copy `covid.sh` and modify according to your installation
2. `crontab -e` : `0 0 * * * /bin/bash /home/git/cron/covid.sh`
