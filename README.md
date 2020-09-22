# Covid

Some COVID-19 stats, showing data from [CSSEGISandData] with [Svelte] and [d3].

0. download data : `cd inputs && git clone https://github.com/CSSEGISandData/COVID-19 && git clone --depth 1 https://github.com/openZH/covid_19`
1. update data : `(cd inputs/COVID-19 && git pull) && (cd inputs/covid_19 && git pull)`
2. regenerate json : `python3 udpate.py 10`
3. start devel server : `yarn dev`

optionally only generate last X days for quicker compilation: `python3 update.py X`


[CSSEGISandData]: https://github.com/CSSEGISandData/COVID-19
[Svelte]: https://svelte.dev/
[d3]: https://d3js.org/

### crontab

Update automatically on server using crontab.

1. copy `covid.sh` and modify according to your installation
2. `crontab -e` : `0 0 * * * /bin/bash /home/git/cron/covid.sh`
