import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllData, type CountryAggregates, type TimeSeriesPoint, type MapPoint } from './data/api';
import { delCache } from './data/db';
import { CACHE_KEY } from './data/api';
import { Suspense, lazy } from 'react';
const TimeSeriesChart = lazy(() => import('./components/TimeSeriesChart'));
import { CountryTable } from './components/CountryTable';
import { SummaryCards } from './components/SummaryCards';
const WorldMap = lazy(() => import('./components/WorldMap'));
import { LazyVisible } from './components/LazyVisible';
import { fetchAllDiseases, type DiseaseDataset, type DiseaseKey } from './data/diseases';

type DataState = {
  series: Record<string, TimeSeriesPoint[]>; // key: metric
  countries: CountryAggregates[];
  points: MapPoint[];
  lastUpdated?: Date;
};

type AppProps = { forcedDisease?: DiseaseKey };
const App: React.FC<AppProps> = ({ forcedDisease }) => {
  const [data, setData] = useState<DataState>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [metric, setMetric] = useState<'confirmed' | 'deaths' | 'recovered'>('confirmed');
  const [usingLocal, setUsingLocal] = useState<boolean | undefined>(undefined);
  const [hideDataSourceInfo, setHideDataSourceInfo] = useState<boolean>(false);
  const [year, setYear] = useState<string>('all'); // 'all' or YYYY
  const [scale, setScale] = useState<'linear' | 'log'>('linear');
  const [diseases, setDiseases] = useState<Partial<Record<DiseaseKey, DiseaseDataset>>>({});
  const [selectedDiseases, setSelectedDiseases] = useState<DiseaseKey[]>([]);
  const [primaryDisease, setPrimaryDisease] = useState<DiseaseKey>(forcedDisease ?? 'covid');

  useEffect(() => {
    if (forcedDisease) {
      setPrimaryDisease(forcedDisease);
    }
    const load = async () => {
      try {
        setLoading(true);
        setError(undefined);
        const res = await fetchAllData();
        setData(res);
        // Build centroids map for disease overlays from COVID country aggregates
        const centroids = new Map<string, { lat: number; lng: number }>();
        for (const c of res.countries) {
          if (c.lat != null && c.lng != null) centroids.set(c.country, { lat: c.lat!, lng: c.lng! });
        }
        console.log('[App] Built centroids map with', centroids.size, 'entries');
        try {
          console.log('[App] Fetching all diseases...');
          const dsets = await fetchAllDiseases(centroids);
          console.log('[App] Received disease datasets:', Object.keys(dsets));
          setDiseases(dsets);
          // Default selection: none; user can enable overlays
        } catch (err) {
          console.error('[App] Failed to fetch diseases:', err);
        }
        // Heuristic: if any source was local, api.ts logs it; expose a quick check by trying to fetch a known local file
        // Try lightweight ping to detect local dataset presence; ignore if not accessible
        try {
          const ping = await fetch('/COVID-19-master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv', { method: 'HEAD' });
          setUsingLocal(ping.ok);
        } catch {
          setUsingLocal(false);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [forcedDisease]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    if (data) {
      for (const p of data.series.confirmed) years.add(p.date.getFullYear());
    }
    const pd = diseases[primaryDisease];
    if (pd) {
      const allSeries = [pd.series.cases, pd.series.deaths, pd.series.hospitalizations, pd.series.recovered];
      for (const arr of allSeries) for (const p of arr) years.add(p.date.getFullYear());
    }
    return Array.from(years).sort();
  }, [data, diseases, primaryDisease]);

  const filteredSeries = useMemo(() => {
    if (!data) return { confirmed: [], deaths: [], recovered: [] } as Record<string, TimeSeriesPoint[]>;
    if (year === 'all') return data.series;
    const y = Number(year);
    const filt = (arr: TimeSeriesPoint[]) => arr.filter(p => p.date.getFullYear() === y);
    return {
      confirmed: filt(data.series.confirmed),
      deaths: filt(data.series.deaths),
      recovered: filt(data.series.recovered),
    } as typeof data.series;
  }, [data, year]);

  const diseaseSeriesForMetric = (key: DiseaseKey): TimeSeriesPoint[] => {
    const ds = diseases[key];
    if (!ds) return [];
    const base = metric === 'confirmed' ? ds.series.cases : metric === 'deaths' ? ds.series.deaths : ds.series.recovered;
    if (year === 'all') return base as any;
    const y = Number(year);
    return base.filter(p => p.date.getFullYear() === y) as any;
  };

  const primaryCountries = useMemo(() => {
    if (primaryDisease === 'covid') return data?.countries ?? [];
    const ds = diseases[primaryDisease];
    if (!ds) return [];
    return ds.countries.map(c => ({ country: c.country, confirmed: c.cases, deaths: c.deaths, recovered: c.recovered, lat: c.lat, lng: c.lng }));
  }, [data, diseases, primaryDisease]);

  const totals = useMemo(() => {
    if (primaryDisease === 'covid') {
      if (!data) return { confirmed: 0, deaths: 0, recovered: 0 };
      if (year === 'all') {
        const last = (key: keyof DataState['series']) => data.series[key]?.at(-1)?.value ?? 0;
        return { confirmed: last('confirmed'), deaths: last('deaths'), recovered: last('recovered') };
      }
      const y = Number(year);
      const sumYear = (arr: TimeSeriesPoint[]) => arr.reduce((acc,p)=> p.date.getFullYear()===y ? acc + p.value : acc, 0);
      return { confirmed: sumYear(data.series.confirmed), deaths: sumYear(data.series.deaths), recovered: sumYear(data.series.recovered) };
    }
    const ds = diseases[primaryDisease];
    if (!ds) return { confirmed: 0, deaths: 0, recovered: 0 };
    const pick = (arr: TimeSeriesPoint[]) => {
      if (year === 'all') return arr.at(-1)?.value ?? 0;
      const y = Number(year);
      return arr.reduce((acc, p) => p.date.getFullYear() === y ? acc + p.value : acc, 0);
    };
    return { confirmed: pick(ds.series.cases as any), deaths: pick(ds.series.deaths as any), recovered: pick(ds.series.recovered as any) };
  }, [data, diseases, primaryDisease, year]);

  return (
    <div className="container">
      <header className="header">
        <h1>Global Disease DataViz</h1>
        <div className="header-actions" style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <Link to="/" style={{ background: '#0e1626', border: '1px solid #27364a', color: '#d2e0f2', padding: '.35rem .6rem', borderRadius: '.35rem', textDecoration: 'none' }}>Menu</Link>
          <label style={{ fontSize: '.75rem', color: '#9fb4d1' }}>Disease</label>
          {forcedDisease ? (
            <span style={{ color: '#d2e0f2', fontSize: '.9rem' }}>{primaryDisease === 'covid' ? 'COVID-19' : (diseases[primaryDisease]?.name ?? primaryDisease)}</span>
          ) : (
            <select value={primaryDisease} onChange={(e)=> setPrimaryDisease(e.target.value as DiseaseKey)}>
              <option value="covid">COVID-19</option>
              {Object.entries(diseases).map(([k, ds]) => ds && <option key={k} value={k as DiseaseKey}>{ds.name}</option>)}
            </select>
          )}
          <label style={{ fontSize: '.75rem', color: '#9fb4d1' }}>Metric</label>
          <select value={metric} onChange={(e) => setMetric(e.target.value as any)}>
            <option value="confirmed">Confirmed</option>
            <option value="deaths">Deaths</option>
            <option value="recovered">Recovered</option>
          </select>
          <label style={{ fontSize: '.75rem', color: '#9fb4d1', marginLeft: '.5rem' }}>Scale</label>
          <select value={scale} onChange={(e)=> setScale(e.target.value as any)}>
            <option value="linear">Linear</option>
            <option value="log">Log</option>
          </select>
          {!forcedDisease && Object.keys(diseases).length > 0 && (
            <>
              <label style={{ fontSize: '.75rem', color: '#9fb4d1', marginLeft: '.5rem' }}>Overlays</label>
              <select multiple value={selectedDiseases as any} onChange={(e)=> {
                const opts = Array.from(e.target.selectedOptions).map(o => o.value as DiseaseKey);
                setSelectedDiseases(opts);
              }} style={{ minWidth: 180, height: 80 }}>
                {Object.entries(diseases).map(([k, ds]) => (ds && (k as DiseaseKey) !== primaryDisease) && (
                  <option key={k} value={k}>{ds.name}</option>
                ))}
              </select>
            </>
          )}
          <button onClick={async () => { try { await delCache('covid:data:v1'); await delCache(CACHE_KEY); await delCache('disease:data:v1'); await delCache('disease:data:v2'); } catch {} window.location.reload(); }}>Refresh</button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}
      {usingLocal === false && !hideDataSourceInfo && (
        <div className="error" style={{ background: '#1a2230', borderColor: '#27364a', color: '#c9d7ef' }}>
          Using live GitHub data sources. For faster local loads, you can place the <code>COVID-19-master</code> dataset at the project root or adjust the path in <code>src/data/api.ts</code>.
          <div style={{ marginTop: 8 }}>
            <button onClick={() => setHideDataSourceInfo(true)} style={{ background: '#0e1626', border: '1px solid #27364a' }}>Hide</button>
          </div>
        </div>
      )}
      {loading && <div className="loading">Loading data…</div>}

      {data && (
          <div className="dash">
          <div className="left-col">
            <SummaryCards totals={totals} lastUpdated={data?.lastUpdated} recoveredAvailable={primaryDisease === 'covid' ? (data?.series.recovered?.length ?? 0) > 0 : ((diseases[primaryDisease]?.series.recovered.length ?? 0) > 0)} titleSuffix={year==='all' ? '' : `(${year})`} />
            <section className="panel">
              <h2>Top countries</h2>
              <CountryTable countries={[...primaryCountries].sort((a,b)=>b[metric]-a[metric]).slice(0, 40)} metric={metric} />
            </section>
          </div>
          <div className="center-col">
            <section className="panel map">
              <Suspense fallback={<div style={{ padding: 12 }}>Loading map…</div>}>
                <WorldMap
                  points={primaryDisease === 'covid' ? data.points : ((diseases[primaryDisease]?.points ?? []).map(p => ({
                    name: p.name,
                    country: p.country,
                    lat: p.lat,
                    lng: p.lng,
                    confirmed: p.cases,
                    deaths: p.deaths,
                    recovered: p.recovered,
                  })) as any)}
                  metric={metric}
                  scale={scale}
                  showLegend
                  onChangeScale={(s)=> setScale(s)}
                  onChangeMetric={(m)=> setMetric(m)}
                  primaryName={primaryDisease === 'covid' ? 'COVID-19' : (diseases[primaryDisease]?.name ?? primaryDisease)}
                  overlays={selectedDiseases.map((k) => {
                    const ds = diseases[k]!;
                    const color =
                      k === 'flu' ? '#d97706' :
                      k === 'measles' ? '#f43f5e' :
                      k === 'malaria' ? '#22c55e' :
                      k === 'tuberculosis' ? '#8b5cf6' : '#999999';
                    // Map metric mapping: confirmed->cases, deaths->deaths, recovered->recovered (usually empty)
                    const points: MapPoint[] = (ds?.points ?? []).map(p => ({
                      name: p.name,
                      country: p.country,
                      lat: p.lat,
                      lng: p.lng,
                      confirmed: p.cases,
                      deaths: p.deaths,
                      recovered: p.recovered,
                    }));
                    return { name: ds?.name ?? k, color, points };
                  })}
                />
              </Suspense>
            </section>
            <section className="panel">
              <h2>Global {metric} trend {year !== 'all' && `( ${year} )`}</h2>
              <LazyVisible placeholder={<div style={{ padding: 12, color: '#9fb4d1' }}>Chart will load when visible…</div>} rootMargin="200px" minDelayMs={100}>
                <Suspense fallback={<div style={{ padding: 12 }}>Loading chart…</div>}>
                  {selectedDiseases.length > 0 || primaryDisease !== 'covid' ? (
                    <TimeSeriesChart
                      multi={[
                        // Primary disease series first
                        primaryDisease === 'covid'
                          ? { series: filteredSeries[metric], label: 'COVID-19', color: metric === 'confirmed' ? '#ff4d4f' : metric === 'deaths' ? '#595959' : '#52c41a' }
                          : (() => {
                              const ds = diseases[primaryDisease]!;
                              const color = primaryDisease === 'flu' ? '#d97706' : primaryDisease === 'measles' ? '#f43f5e' : primaryDisease === 'malaria' ? '#22c55e' : primaryDisease === 'tuberculosis' ? '#8b5cf6' : '#999999';
                              const series = diseaseSeriesForMetric(primaryDisease);
                              return { series, label: ds?.name ?? primaryDisease, color };
                            })(),
                        ...selectedDiseases.map(k => {
                          const ds = diseases[k]!;
                          const color =
                            k === 'flu' ? '#d97706' :
                            k === 'measles' ? '#f43f5e' :
                            k === 'malaria' ? '#22c55e' :
                            k === 'tuberculosis' ? '#8b5cf6' : '#999999';
                          const series = diseaseSeriesForMetric(k);
                          return { series, label: ds?.name ?? k, color };
                        })
                      ]}
                    />
                  ) : (
                    <TimeSeriesChart series={filteredSeries[metric]} label={metric} color={metric === 'confirmed' ? '#ff4d4f' : metric === 'deaths' ? '#595959' : '#52c41a'} />
                  )}
                </Suspense>
              </LazyVisible>
            </section>
          </div>
          <div className="right-col side-stack">
            <section className="panel">
              <h2>Breakdown</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '.75rem', lineHeight: 1.4 }}>
                <li><span style={{ color: '#ff4d4f' }}>Confirmed:</span> {totals.confirmed.toLocaleString()}</li>
                <li><span style={{ color: '#595959' }}>Deaths:</span> {totals.deaths.toLocaleString()}</li>
                <li><span style={{ color: '#52c41a' }}>Recovered:</span> {totals.recovered.toLocaleString()}</li>
              </ul>
            </section>
            
            <section className="panel">
              <h2>Year</h2>
              <select value={year} onChange={e=>setYear(e.target.value)} style={{ width: '100%', background: '#0f1825', color: '#d2e0f2', border: '1px solid #27364a', padding: '.4rem', borderRadius: '.35rem', fontSize: '.7rem' }}>
                <option value="all">All</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </section>
            <section className="panel">
              <h2>About</h2>
              <p style={{ fontSize: '.65rem', lineHeight: 1.4, color: '#95a8c0' }}>
                Data sourced from Johns Hopkins CSSE time series (COVID-19) and local CSVs for other diseases when available. Circle sizes scale using linear or log, configurable above.
              </p>
            </section>
          </div>
        </div>
      )}

      <footer className="footer">
        <small>
          Data: Johns Hopkins CSSE GitHub time series and local disease CSVs. Visualization: React, Chart.js, Leaflet. This is an educational project.
        </small>
      </footer>
    </div>
  );
};

export default App;
