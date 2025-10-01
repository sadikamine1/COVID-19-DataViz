import Papa from 'papaparse';
import { getCache, setCache } from './db.ts';

export type TimeSeriesPoint = { date: Date; value: number };
export type CountryAggregates = {
  country: string;
  confirmed: number;
  deaths: number;
  recovered: number;
  lat?: number; // approximate centroid (avg of province centroids)
  lng?: number;
};

export type MapPoint = {
  name: string; // Province/State or Country
  country: string;
  lat: number;
  lng: number;
  confirmed: number;
  deaths: number;
  recovered: number;
};

const REMOTE_BASE = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series';
const LOCAL_BASE = '/COVID-19-master/csse_covid_19_data/csse_covid_19_time_series';
const URLS = {
  confirmed: [
    `${LOCAL_BASE}/time_series_covid19_confirmed_global.csv`,
    `${REMOTE_BASE}/time_series_covid19_confirmed_global.csv`,
  ],
  deaths: [
    `${LOCAL_BASE}/time_series_covid19_deaths_global.csv`,
    `${LOCAL_BASE}/time_series_covid_19_deaths_global.csv`, // older naming fallback (typo guard)
    `${REMOTE_BASE}/time_series_covid19_deaths_global.csv`,
  ],
  recovered: [
    `${LOCAL_BASE}/time_series_covid19_recovered_global.csv`,
    `${REMOTE_BASE}/time_series_covid19_recovered_global.csv`,
  ],
} as const;

// Cache strategy
export const CACHE_VERSION = 'v2';
export const CACHE_KEY = `covid:data:${CACHE_VERSION}`;

type CsvRow = Record<string, string> & { 'Country/Region': string };

function parseCsv(text: string): { header: string[]; rows: CsvRow[] } {
  // Strip UTF-8 BOM and normalize newlines
  const clean = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const baseOptions: Papa.ParseConfig = {
    header: true,
    delimiter: ',',
    skipEmptyLines: 'greedy',
    // fastMode must be off because JHU files contain quoted fields with commas
    fastMode: false,
  };

  let parsed = Papa.parse(clean, baseOptions) as Papa.ParseResult<CsvRow>;
  let errors = parsed.errors ?? [];
  if (errors.length && errors.some((e) => /Too (many|few) fields/i.test(e.message))) {
    // Retry with autodetected delimiter and simpler options
    parsed = Papa.parse(clean, {
      header: true,
      skipEmptyLines: true,
      fastMode: false,
    }) as Papa.ParseResult<CsvRow>;
    errors = parsed.errors ?? [];
  }
  if (errors.length) {
    const msgs = Array.from(new Set(errors.map((e) => e.message)));
    throw new Error(msgs.join('; '));
  }
  const header = (parsed.meta.fields ?? []).filter((f: string) => /\d{1,2}\/\d{1,2}\/\d{2}/.test(f));
  return { header, rows: parsed.data };
}

async function fetchCsvFrom(url: string): Promise<{ header: string[]; rows: CsvRow[] }> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  // Basic guard: if the dev server returned an HTML page (e.g., 404 fallback), treat as failure
  const looksLikeHtml = /<html|<!doctype/i.test(text);
  if (looksLikeHtml) {
    throw new Error('Received HTML instead of CSV');
  }
  return parseCsv(text);
}

async function fetchCsv(urls: readonly string[]): Promise<{ header: string[]; rows: CsvRow[] }> {
  let lastErr: unknown;
  for (const u of urls) {
    try {
      const data = await fetchCsvFrom(u);
      if (u.startsWith(LOCAL_BASE)) console.info(`[covid19] Using local data: ${u}`);
      return data;
    } catch (e) {
      lastErr = e;
      // try next
      continue;
    }
  }
  throw new Error(`Failed to fetch CSV from all sources. Last error: ${String(lastErr)}`);
}

function buildGlobalSeries(header: string[], rows: CsvRow[]): TimeSeriesPoint[] {
  const totals = header.map((h) => {
    let sum = 0;
    for (const row of rows) {
      const n = Number(row[h] || 0);
      if (!Number.isNaN(n)) sum += n;
    }
    // Convert date: M/D/YY to Date
    const [m, d, y] = h.split('/').map((x) => Number(x));
    const date = new Date(2000 + y, m - 1, d);
    return { date, value: sum } as TimeSeriesPoint;
  });
  return totals;
}

function buildCountryAggregates(rows: CsvRow[], lastHeader: string): CountryAggregates[] {
  const map = new Map<string, CountryAggregates>();
  for (const row of rows) {
    const country = row['Country/Region'];
    const current = map.get(country) ?? { country, confirmed: 0, deaths: 0, recovered: 0 };
    map.set(country, current);
  }
  return Array.from(map.values());
}

type FetchOptions = { ttlMs?: number };
export async function fetchAllData(ttlMsOrOptions: number | FetchOptions = 6 * 60 * 60 * 1000): Promise<{
  series: Record<'confirmed' | 'deaths' | 'recovered', TimeSeriesPoint[]>;
  countries: CountryAggregates[];
  points: MapPoint[];
  lastUpdated: Date;
}> {
  const ttlMs = typeof ttlMsOrOptions === 'number' ? ttlMsOrOptions : (ttlMsOrOptions.ttlMs ?? 6 * 60 * 60 * 1000);
  // Try IndexedDB cache first
  const cached = await getCache(CACHE_KEY);
  const isFresh = !!(cached && Date.now() - cached.timestamp < ttlMs);
  const isOffline = typeof navigator !== 'undefined' && 'onLine' in navigator ? !navigator.onLine : false;
  if (cached && (isFresh || isOffline)) {
    console.info('[covid19] Using cached dataset', { fresh: isFresh, offline: isOffline });
    return cached.value as any;
  }

  const [c, d, r] = await Promise.all([
    fetchCsv(URLS.confirmed),
    fetchCsv(URLS.deaths),
    fetchCsv(URLS.recovered),
  ]);

  const series = {
    confirmed: buildGlobalSeries(c.header, c.rows),
    deaths: buildGlobalSeries(d.header, d.rows),
    recovered: r.header.length ? buildGlobalSeries(r.header, r.rows) : [],
  } as const;

  const lastC = c.header[c.header.length - 1]!;
  const lastD = d.header[d.header.length - 1]!;
  let lastR = r.header[r.header.length - 1];
  if (lastR) {
    for (let i = r.header.length - 1; i >= 0; i--) {
      const h = r.header[i];
      let sum = 0;
      for (const row of r.rows) {
        const n = Number((row as any)[h] || 0);
        if (!Number.isNaN(n)) sum += n;
      }
      if (sum > 0) { lastR = h; break; }
    }
  }

  const byCountry = new Map<string, CountryAggregates & { _latSum?: number; _lngSum?: number; _count?: number }>();
  const ensure = (name: string) => {
    let v = byCountry.get(name);
    if (!v) {
      v = { country: name, confirmed: 0, deaths: 0, recovered: 0, _latSum: 0, _lngSum: 0, _count: 0 };
      byCountry.set(name, v);
    }
    return v;
  };

  for (const row of c.rows) {
    const name = row['Country/Region'];
    const v = ensure(name);
    v.confirmed += Number(row[lastC] || 0) || 0;
    // Acquire lat/long if present in row (original dataset often has Lat / Long columns)
    const latRaw = (row as any)['Lat'] ?? (row as any)['lat'];
    const longRaw = (row as any)['Long'] ?? (row as any)['Long_'] ?? (row as any)['lng'];
    const lat = Number(latRaw);
    const lng = Number(longRaw);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      v._latSum! += lat;
      v._lngSum! += lng;
      v._count! += 1;
    }
  }
  for (const row of d.rows) {
    const name = row['Country/Region'];
    const v = ensure(name);
    v.deaths += Number(row[lastD] || 0) || 0;
  }
  if (lastR) {
    for (const row of r.rows) {
      const name = row['Country/Region'];
      const v = ensure(name);
      v.recovered += Number(row[lastR] || 0) || 0;
    }
  }

  const countries = Array.from(byCountry.values()).map(v => {
    if (v._count && v._count > 0) {
      v.lat = v._latSum! / v._count;
      v.lng = v._lngSum! / v._count;
    }
    delete (v as any)._latSum;
    delete (v as any)._lngSum;
    delete (v as any)._count;
    return v as CountryAggregates;
  }).sort((a, b) => b.confirmed - a.confirmed);

  // Build per-row MapPoint list for precise marker placement (uses last date values)
  const points: MapPoint[] = [];
  const confirmedMap = new Map<string, number>();
  const deathsMap = new Map<string, number>();
  const recoveredMap = new Map<string, number>();

  const lastConfirmedVal = (row: CsvRow) => Number(row[lastC] || 0) || 0;
  const lastDeathsVal = (row: CsvRow) => Number(row[lastD] || 0) || 0;
  const lastRecoveredVal = (row: CsvRow) => (lastR ? (Number((row as any)[lastR] || 0) || 0) : 0);

  // key for row identity: Province/State + Country + Lat + Long
  function rowKey(row: CsvRow): string {
    const prov = (row as any)['Province/State'] || '';
    const lat = (row as any)['Lat'] ?? (row as any)['lat'] ?? '';
    const lng = (row as any)['Long'] ?? (row as any)['Long_'] ?? (row as any)['lng'] ?? '';
    return `${prov}__${row['Country/Region']}__${lat}__${lng}`;
  }

  for (const row of c.rows) confirmedMap.set(rowKey(row), lastConfirmedVal(row));
  for (const row of d.rows) deathsMap.set(rowKey(row), lastDeathsVal(row));
  if (lastR) {
    for (const row of r.rows) recoveredMap.set(rowKey(row), lastRecoveredVal(row));
  }

  // Use confirmed rows as base for coordinates
  for (const row of c.rows) {
    const latRaw = (row as any)['Lat'] ?? (row as any)['lat'];
    const longRaw = (row as any)['Long'] ?? (row as any)['Long_'] ?? (row as any)['lng'];
    const lat = Number(latRaw);
    const lng = Number(longRaw);
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
    // Filter invalid (0,0) if appears and not the only coordinate (avoid large cluster at gulf of guinea)
    if ((lat === 0 && lng === 0)) continue;
    const key = rowKey(row);
    const point: MapPoint = {
      name: (row as any)['Province/State'] || row['Country/Region'],
      country: row['Country/Region'],
      lat, lng,
      confirmed: confirmedMap.get(key) || 0,
      deaths: deathsMap.get(key) || 0,
      recovered: recoveredMap.get(key) || 0,
    };
    if (point.confirmed <= 0) continue;
    points.push(point);
  }
  const lastSeries = series.confirmed[series.confirmed.length - 1];
  const lastUpdated = lastSeries ? lastSeries.date : new Date();

  const result = { series: series as any, countries, points, lastUpdated };
  // Save to cache (best-effort)
  try { await setCache(CACHE_KEY, result); } catch {}
  return result;
}
