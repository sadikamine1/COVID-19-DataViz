# Covid-19 DataViz

This project visualizes global COVID-19 data in near real-time, using Johns Hopkins CSSE time series data. It provides:

- Global time series chart (Confirmed / Deaths / Recovered)
- Top countries table with search
- Summary cards and last updated date
- Responsive dashboard for desktop and mobile

Stack: React + Vite + TypeScript, Chart.js, PapaParse, date-fns.

## Quick start

Prerequisites: Node.js 18+.

```bash
# install deps
npm install

# start dev server
npm run dev

# build for production
npm run build
npm run preview
```

The app fetches CSVs from the CSSEGISandData/COVID-19 GitHub repository at runtime.

## Data sources
- https://github.com/CSSEGISandData/COVID-19
- Dashboard reference: https://www.arcgis.com/apps/opsdashboard/index.html#/bda7594740fd40299423467b48e9ecf6

## Notes
- Recovered series is no longer updated in late data; when missing, it's displayed as 0 and excluded from some charts.
- When GitHub rate limiting occurs, try refresh or run a local proxy.

## License
Educational use only. Data owned by the respective providers.