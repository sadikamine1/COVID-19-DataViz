import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapPoint } from '../data/api';

type ScaleType = 'linear' | 'log';

function createRadiusScaler(maxValue: number, scale: ScaleType) {
  // Define min/max pixel radius for visual clarity
  const RMIN = 3;
  const RMAX = 34;
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  if (maxValue <= 0 || !Number.isFinite(maxValue)) {
    return (v: number) => 0;
  }
  if (scale === 'linear') {
    return (v: number) => (v <= 0 ? 0 : clamp(RMIN + (RMAX - RMIN) * (v / maxValue), RMIN, RMAX));
  }
  // log scale: map [1 .. max] -> [RMIN .. RMAX]
  const logMax = Math.log10(maxValue);
  return (v: number) => {
    if (v <= 0) return 0;
    const lv = Math.log10(Math.max(1, v));
    return clamp(RMIN + (RMAX - RMIN) * (lv / Math.max(1e-9, logMax)), RMIN, RMAX);
  };
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

export const WorldMap: React.FC<{
  points: MapPoint[];
  metric: 'confirmed' | 'deaths' | 'recovered';
  scale?: ScaleType;
  showLegend?: boolean;
  onChangeScale?: (s: ScaleType) => void;
  onChangeMetric?: (m: 'confirmed' | 'deaths' | 'recovered') => void;
  overlays?: Array<{ name: string; color: string; points: MapPoint[] }>;
  primaryName?: string;
}> = ({ points, metric, scale = 'linear', showLegend = true, onChangeScale, onChangeMetric, overlays = [], primaryName = 'COVID-19' }) => {
  // Guard to only fit-to-world once to avoid re-zooming after user interaction
  const didFitRef = useRef(false);
  const color = metric === 'confirmed' ? '#ff3a32' : metric === 'deaths' ? '#cccccc' : '#52c41a';
  // Visible max value to scale radii; fallback to global max
  const globalMax = useMemo(() => {
    let m = points.reduce((acc, p) => Math.max(acc, p[metric]), 0);
    for (const layer of overlays) {
      for (const p of layer.points) m = Math.max(m, p[metric]);
    }
    return m;
  }, [points, overlays, metric]);
  const [visibleMax, setVisibleMax] = useState<number>(globalMax);
  // Initialize visible max once at mount; subsequent updates come from map view changes
  const initVisibleRef = useRef(false);
  useEffect(()=>{
    if (!initVisibleRef.current) {
      setVisibleMax(globalMax);
      initVisibleRef.current = true;
    }
  }, [globalMax]);

  // Legend ticks: pick 3 nice values across the range
  const ticks = useMemo(() => {
    const maxRef = visibleMax > 0 ? visibleMax : globalMax;
    if (maxRef <= 0) return [] as number[];
    const vals = [maxRef / 10, maxRef / 3, maxRef].map(v => Math.max(1, Math.round(v)));
    // dedup and sort
    return Array.from(new Set(vals)).sort((a, b) => a - b);
  }, [visibleMax, globalMax]);

  // Render all points without clustering; scale legend to visible points
  const Circles: React.FC = () => {
    const map = useMap();
    // trigger recompute on zoom/move end for visible max
    const [tick, setTick] = useState(0);
    const throttleRef = useRef<number | null>(null);
    const bump = () => {
      if (throttleRef.current) window.clearTimeout(throttleRef.current);
      throttleRef.current = window.setTimeout(() => setTick(t => t + 1), 80);
    };
    useMapEvents({
      moveend: bump,
      zoomend: bump,
    });

    // Pre-filter valid points
  const displayPoints = useMemo(() => points.filter(p => p[metric] > 0 && Number.isFinite(p.lat) && Number.isFinite(p.lng)), [points, metric]);
  const overlayPoints = useMemo(() => overlays.map(l => ({ color: l.color, points: l.points.filter(p => p[metric] > 0 && Number.isFinite(p.lat) && Number.isFinite(p.lng)) })), [overlays, metric]);

    // Compute visible max based on current bounds to sync legend/radius scaling
    const visibleMaxCalc = useMemo(() => {
      if (!map) return 0;
      const bounds = map.getBounds();
      let m = 0;
      for (const p of displayPoints) {
        if (bounds.contains([p.lat, p.lng] as any)) {
          const v = (p as any)[metric] as number;
          if (v > m) m = v;
        }
      }
      for (const layer of overlayPoints) {
        for (const p of layer.points) {
          if (bounds.contains([p.lat, p.lng] as any)) {
            const v = (p as any)[metric] as number;
            if (v > m) m = v;
          }
        }
      }
      return m;
    }, [map, displayPoints, overlayPoints, metric, tick]);

    useEffect(() => {
      setVisibleMax(visibleMaxCalc > 0 ? visibleMaxCalc : globalMax);
    }, [visibleMaxCalc, globalMax]);

    return (
      <>
        {displayPoints.map((p, i) => {
          const value = (p as any)[metric] as number;
          const r = createRadiusScaler(visibleMax > 0 ? visibleMax : globalMax, scale)(value);
          if (!r) return null;
          return (
            <CircleMarker
              key={`${p.lat}_${p.lng}_${i}`}
              center={[p.lat, p.lng]}
              radius={r}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.32, weight: 0.8 }}
            >
              <Tooltip direction="top" offset={[0, -2]} opacity={1} permanent={false} className="map-tooltip">
                <div style={{ fontSize: '.65rem', lineHeight: 1.2 }}>
                  <strong>{p.name}</strong><br />
                  {value.toLocaleString()} {metric}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
        {overlayPoints.map((layer, li) => (
          <React.Fragment key={`ov_${li}`}>
            {layer.points.map((p, i) => {
              const value = (p as any)[metric] as number;
              const r = createRadiusScaler(visibleMax > 0 ? visibleMax : globalMax, scale)(value);
              if (!r) return null;
              return (
                <CircleMarker
                  key={`ov_${li}_${p.lat}_${p.lng}_${i}`}
                  center={[p.lat, p.lng]}
                  radius={r}
                  pathOptions={{ color: layer.color, fillColor: layer.color, fillOpacity: 0.28, weight: 0.8 }}
                >
                  <Tooltip direction="top" offset={[0, -2]} opacity={1} permanent={false} className="map-tooltip">
                    <div style={{ fontSize: '.65rem', lineHeight: 1.2 }}>
                      <strong>{p.name}</strong><br />
                      {value.toLocaleString()} {metric}
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </React.Fragment>
        ))}
      </>
    );
  };

  const Legend: React.FC = () => {
    const radiusOfLegend = useMemo(() => createRadiusScaler(visibleMax > 0 ? visibleMax : globalMax, scale), [visibleMax, globalMax, scale]);
    return (
      <div className="map-legend">
        <div className="map-legend__title"><span className="dot" style={{ background: color }} /> Circle sizes ({scale === 'linear' ? 'linear' : 'log'})</div>
        <div className="map-legend__bubbles">
          {ticks.map(t => (
            <div key={t} className="map-legend__bubble">
              <div className="bubble" style={{
                width: radiusOfLegend(t) * 2,
                height: radiusOfLegend(t) * 2,
                borderColor: color,
                background: color + '55',
              }} />
              <div className="label">{formatNumber(t)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const FitToWorld: React.FC<{ didFitRef: React.MutableRefObject<boolean> }> = ({ didFitRef }) => {
    const map = useMap();
    useEffect(() => {
      if (!points.length) return;
      if (didFitRef.current) return; // already fitted once
      const lats = points.map(p=>p.lat);
      const lngs = points.map(p=>p.lng);
      const south = Math.min(...lats), north = Math.max(...lats);
      const west = Math.min(...lngs), east = Math.max(...lngs);
      // fit bounds with padding; keep zoom >= 2
      try {
  map.fitBounds([[south, west],[north, east]], { padding: [28, 28] });
  if (map.getZoom() < 3.5) map.setZoom(3.5); // aligné avec le zoom de départ souhaité
        didFitRef.current = true;
      } catch {}
    }, [map, didFitRef]);
    return null;
  };
  return (
  <div className="map-wrapper" style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0 }}>
      <MapContainer
        center={[20, 0]}
        zoom={3.5}
        minZoom={2}
        worldCopyJump
        scrollWheelZoom={true}
        zoomControl={false}
        preferCanvas={true}
        zoomSnap={0.25}
        zoomDelta={0.5}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap & CARTO"
        />
        <ZoomControl position="topright" />
  <FitToWorld didFitRef={didFitRef} />
        <Circles />
      </MapContainer>
      {showLegend && ticks.length > 0 && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 'auto', top: 'auto', zIndex: 800 }}>
          <Legend />
        </div>
      )}

      {overlays.length > 0 && (
        <div className="map-overlay" style={{ top: 12, right: 12, left: 'auto', position: 'absolute', zIndex: 805, pointerEvents: 'none', background: 'rgba(15,24,37,0.92)', border: '1px solid var(--border)', padding: '6px 8px', borderRadius: 8, fontSize: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: '#d2e0f2', fontWeight: 600, letterSpacing: '.02em' }}>Layers:</span>
            {[{ name: primaryName, color }, ...overlays.map(o => ({ name: o.name, color: o.color }))].map((l, idx) => (
              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
                <span style={{ color: '#9fb4d1' }}>{l.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="map-overlay top-left" style={{ zIndex: 810 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', pointerEvents: 'none' }}>
          <div className="segmented" role="group" aria-label="Scale toggle" style={{ pointerEvents: 'auto' }}>
            <button className={scale==='linear' ? 'active' : ''} onClick={() => onChangeScale?.('linear')}>Lin</button>
            <button className={scale==='log' ? 'active' : ''} onClick={() => onChangeScale?.('log')}>Log</button>
          </div>
          <div className="segmented" role="group" aria-label="Metric toggle" style={{ pointerEvents: 'auto' }}>
            <button className={metric==='confirmed' ? 'active' : ''} onClick={() => onChangeMetric?.('confirmed')}>Cases</button>
            <button className={metric==='deaths' ? 'active' : ''} onClick={() => onChangeMetric?.('deaths')}>Deaths</button>
            <button className={metric==='recovered' ? 'active' : ''} onClick={() => onChangeMetric?.('recovered')}>Recovered</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldMap;