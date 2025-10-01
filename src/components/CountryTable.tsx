import React, { useMemo, useState } from 'react';
import type { CountryAggregates } from '../data/api';

export const CountryTable: React.FC<{
  countries: CountryAggregates[];
  metric: 'confirmed' | 'deaths' | 'recovered';
}> = ({ countries, metric }) => {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? countries.filter((c) => c.country.toLowerCase().includes(q)) : countries;
    return list;
  }, [countries, query]);
  const fmt = (n: number) => n.toLocaleString();
  return (
    <div>
      <input className="search" placeholder="Search country…" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Country</th>
              <th style={{ textTransform: 'capitalize' }}>{metric}</th>
              <th>Deaths</th>
              <th>Recovered</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.country}>
                <td>{i + 1}</td>
                <td>{c.country}</td>
                <td>{fmt(c[metric])}</td>
                <td>{fmt(c.deaths)}</td>
                <td>{fmt(c.recovered)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
