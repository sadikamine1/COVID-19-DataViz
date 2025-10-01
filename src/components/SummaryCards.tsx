import React from 'react';

export const SummaryCards: React.FC<{
  totals: { confirmed: number; deaths: number; recovered: number };
  lastUpdated?: Date;
  recoveredAvailable?: boolean;
  titleSuffix?: string;
}> = ({ totals, lastUpdated, recoveredAvailable = true, titleSuffix }) => {
  const fmt = (n: number) => n.toLocaleString();
  return (
    <div className="cards">
      <div className="card" data-variant="confirmed">
        <div className="card-title">Total Confirmed{titleSuffix ? ` ${titleSuffix}` : ''}</div>
        <div className="card-value" style={{ color: '#ff4d4f' }}>{fmt(totals.confirmed)}</div>
      </div>
      <div className="card" data-variant="deaths">
        <div className="card-title">Total Deaths{titleSuffix ? ` ${titleSuffix}` : ''}</div>
        <div className="card-value" style={{ color: '#a5a5a5' }}>{fmt(totals.deaths)}</div>
      </div>
      <div className="card" data-variant="recovered">
        <div className="card-title">Total Recovered{titleSuffix ? ` ${titleSuffix}` : ''}</div>
        <div className="card-value" style={{ color: '#52c41a' }}>{recoveredAvailable ? fmt(totals.recovered) : 'N/A'}</div>
      </div>
      {lastUpdated && (
        <div className="updated">Updated: {lastUpdated.toLocaleDateString()}</div>
      )}
    </div>
  );
};
