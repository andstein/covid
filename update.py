import csv
import datetime
import glob
import json
import os
import pickle
import sys

limit = 1e10
if len(sys.argv) > 1:
    limit = int(sys.argv[1])
    print(f'only generating data for last {limit} days')

DAILY_REPORTS_DIR = (
    'inputs/COVID-19/csse_covid_19_data/csse_covid_19_daily_reports'
)

NUMCOLS = ('confirmed', 'deaths', 'recovered', 'active')


def sanitize(name):
    return name.replace(
        ' ', '_').replace('/', '_').replace('\ufeff', '').lower()


countries = {
    ' Azerbaijan': 'Azerbaijan',
    'Bahamas, The': 'Bahamas',
    'Bolivia (Plurinational State of)': 'Bolivia',
    'Brunei Darussalam': 'Brunei',
    'Burma': 'Myanmar',
    'Cabo Verde': 'Cape Verde',
    'Congo (Brazzaville)': 'Congo',
    'Congo (Kinshasa)': 'Congo',
    'Côte d\'Ivoire': 'Ivory Coast',
    'Cote d\'Ivoire': 'Ivory Coast',
    'Czech Republic': 'Czechia',
    'Timor-Leste': 'East Timor',
    'Gambia, The': 'Gambia',
    'The Gambia': 'Gambia',
    'China, Hong Kong SAR': 'Hong Kong',
    'Hong Kong SAR': 'Hong Kong',
    'Iran (Islamic Republic of)': 'Iran',
    'Republic of Korea': 'South Korea',
    'Korea, South': 'South Korea',
    'Russian Federation': 'Russia',
    'Syrian Arab Republic': 'Syria',
    'China, Taiwan Province of China': 'Taiwan',
    'United Republic of Tanzania': 'Tanzania',
    'UK': 'United Kingdom',
    'United States of America': 'USA',
    'US': 'USA',
    'Venezuela (Bolivarian Republic of)': 'Venezuela',
    'State of Palestine': 'Palestine',
    'West Bank and Gaza': 'Palestine',
    'occupied Palestinian territory': 'Palestine',
}
country_states = (
    'US', 'Germany', 'Spain',
    # 'Russia', 'China', 'Japan', ...
)


def country(name):
    return countries.get(name, name)


class CsvRow:
    def __init__(self, header, data):
        self.header = [sanitize(col) for col in header]
        self.data = data

    def __getattr__(self, name):
        try:
            return self.data[self.header.index(sanitize(name))]
        except ValueError:
            raise ValueError(
                f'Could not find {sanitize(name)!r} in {self.header!r}')

    def get(self, name, converter=str, default=None):
        try:
            return converter(getattr(self, name))
        except ValueError:
            return default

    def todict(self, names, converter=str, default=None):
        return {name: self.get(name, converter, default) for name in names}


class CsvFile:
    def __init__(self, path):
        self.path = path

    def __iter__(self):
        with open(self.path) as f:
            header = None
            for row in csv.reader(f):
                if header is None:
                    header = row
                    continue
                yield CsvRow(header, row)


def rollup(ds):
    ret = dict()
    for d in ds:
        for k, v in d.items():
            if k in NUMCOLS:
                if k not in ret:
                    ret[k] = 0
                ret[k] += v
            else:
                assert ret.get(k, v) == v
                ret[k] = v
    return ret


if os.path.exists('inputs/WPP2019_TotalPopulationBySex.csv.pickle'):
    pop = pickle.load(open(
        'inputs/WPP2019_TotalPopulationBySex.csv.pickle', 'rb'))
else:
    print('reading pop...')
    pop = {
        country(row.location): int(1e3 * float(row.poptotal))
        for row in CsvFile('inputs/WPP2019_TotalPopulationBySex.csv')
        if row.time == '2020'
    }
    pickle.dump(
        pop, open('inputs/WPP2019_TotalPopulationBySex.csv.pickle', 'wb'))

with open('inputs/us_states_pop.csv') as f:
    for line in f:
        idx = line.index(',')
        k, v = line[:idx], line[idx+1:]
        pop[f'US, {k}'] = int(v.replace(',', '').replace('"', '').replace('\n', ''))

with open('inputs/ch_states_pop.csv') as f:
    for i, line in enumerate(f):
        line = line.strip()
        if i == 0:
            assert line == 'canton,population'
            continue
        canton, population = line.split(',')
        pop[f'CH, {canton}'] = int(population)

data = dict()


def append(d, k, v):
    if k not in d:
        d[k] = []
    d[k].append(v)

print('reading timeseries')
keys = {}
for path in glob.glob(os.path.join(DAILY_REPORTS_DIR, '*.csv')):
    date = path.split('/')[-1].split('.')[0]
    date = datetime.datetime.strptime(date, '%m-%d-%Y')
    if (datetime.datetime.now() - date).days > limit:
        continue
    date = date.strftime('%Y-%m-%d')

    sys.stdout.write('.')
    sys.stdout.flush()

    d = dict()  # name => [{numbers}, {numbers}, ...]
    for row in CsvFile(path):
        ns = row.todict(NUMCOLS, converter=int, default=0)
        if row.get('admin2'):
            level = 'county'
            name = ', '.join([
                row.country_region, row.province_state, row.admin2])
            # don't append county data, but keep for states
            # append(d, name, dict(level=level, **ns))
        if row.province_state:
            level = 'state'
            name = ', '.join([row.country_region, row.province_state])
            if row.country_region in country_states:
                append(d, name, dict(level=level, **ns))
        level = 'country'
        append(d, country(row.country_region), dict(level=level, **ns))
        level = 'i18n'
        append(d, 'World', dict(level=level, **ns))

    data[date] = {k: rollup(v) for k, v in d.items()}
    for key, d in data[date].items():
        if key not in keys:
            keys[key] = {'population': pop.get(key), 'level': d['level']}

ch_cols = dict(
    ncumul_conf='confirmed',
    ncumul_deceased='deaths',
    ncumul_released='recovered',
)
for row in CsvFile('inputs/covid_19/COVID19_Fallzahlen_CH_total_v2.csv'):
    date = row.get('date')
    canton = row.get('abbreviation_canton_and_fl')
    if canton == 'FL': continue
    key = f'CH, {canton}'
    if date not in data:
        continue
        # print(f'Adding CH-only date: {date}')
        # data[date] = {}
    data[date][key] = d = {
        v: row.get(k, lambda x: int(x) if x else 0)
        for k, v in ch_cols.items()
    }
    if key not in keys:
        keys[key] = {'population': pop.get(key), 'level': 'state'}

# postfix
data = [
    dict(date=date, data=d)
    for date, d in sorted(data.items())
]
last = {}
for row in data:
    for k, d in row['data'].items():
        for col in ('recovered', 'confirmed', 'deaths'):
            if k not in last: last[k] = {}
            dcol = dict(confirmed='new').get(col, f'd{col}')
            now, before = d.get(col, 0), last[k].get(col, 0)
            d[dcol] = max(now - before, 0)
            last[k][col] = max(now, before)

# Main output.
print('')
os.makedirs('output', exist_ok=True)
cols = ['new', 'drecovered', 'ddeaths']
with open('output/info.json', 'w') as f:
    sorted_keys = sorted(keys)
    json.dump(dict(
        dates=[row['date'] for row in data],
        rows=sorted_keys,
        cols=cols,
        population=[keys[k].get('population') for k in sorted_keys],
        levels=[keys[k].get('level') for k in sorted_keys],
    ), f, separators=(',', ':'))
with open('output/table.json', 'w') as f:
    json.dump([
        [
            [
                row['data'][key].get(col)
                for col in cols
            ] if key in row['data'] else None
            for key in sorted(keys)
        ]
        for row in data
    ], f, separators=(',', ':'))

# Diagnostic output to find mis-spelled countries.
keys1 = set(pop.keys())
keys2 = set([k for row in data for k, d in row['data'].items()
             if d.get('level') == 'country'])
open('output/poponly.txt', 'w').write(
    '\n'.join(sorted(keys1.difference(keys2))))
open('output/covonly.txt', 'w').write(
    '\n'.join(sorted(keys2.difference(keys1))))
open('output/pop.txt', 'w').write('\n'.join(sorted(keys1)))
open('output/cov.txt', 'w').write('\n'.join(sorted(keys2)))
