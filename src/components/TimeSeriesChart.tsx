import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';
import type { TimeSeriesPoint } from '../data/api';

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler);

type SeriesInput =
  | { series: TimeSeriesPoint[]; label: string; color?: string }
  | { multi: Array<{ series: TimeSeriesPoint[]; label: string; color: string }>; };

export const TimeSeriesChart: React.FC<SeriesInput> = (props) => {
  const isMulti = (p: SeriesInput): p is { multi: Array<{ series: TimeSeriesPoint[]; label: string; color: string }> } =>
    (p as any).multi != null;

  const data = useMemo(() => {
    if (isMulti(props)) {
      return {
        datasets: props.multi.map(m => ({
          label: m.label,
          data: m.series.map(p => ({ x: p.date as any, y: p.value })),
          borderColor: m.color,
          backgroundColor: m.color + '33',
          fill: true,
          pointRadius: 0,
          tension: 0.2,
        })),
      };
    }
    const { series, label, color = '#1677ff' } = props as any;
    return {
      datasets: [
        {
          label,
          data: series.map((p: TimeSeriesPoint) => ({ x: p.date as any, y: p.value })),
          borderColor: color,
          backgroundColor: color + '33',
          fill: true,
          pointRadius: 0,
          tension: 0.2,
        },
      ],
    };
  }, [props]);
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { type: 'time' as const, time: { unit: 'month' as const } },
      y: { beginAtZero: true },
    },
    plugins: { legend: { display: true, position: 'bottom' as const } },
  };
  return (
    <div style={{ height: 360 }}>
      <Line options={options} data={data} />
    </div>
  );
};

export default TimeSeriesChart;
