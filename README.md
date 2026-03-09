# HOMECARE – Digital Twins Water Management & Avatar Platform

A browser-based platform for monitoring and managing residential water systems using digital twin technology and an intelligent home avatar.

## Features

| Module | Description |
|--------|-------------|
| **Dashboard** | Real-time water flow, pressure & temperature KPIs, live charts, quick valve controls |
| **Digital Twin** | Interactive SVG floor-plan showing pipe network, sensor locations, live status |
| **Home Avatar** | Animated house avatar with health score, personality modes and intelligent messages |
| **Analytics** | Weekly/monthly usage trends, cost breakdown, comparison charts |
| **Alerts** | Critical/warning/info notifications with resolve & detail actions |
| **Settings** | Threshold configuration, notification preferences, sensor inventory |

## Quick Start

No build step required – the platform runs entirely in the browser.

```bash
# Option 1 – open directly
open index.html

# Option 2 – serve with any static file server
npx serve .
# or
python3 -m http.server 8080
```

Then visit `http://localhost:8080` (or `http://localhost:3000` for `npx serve`).

## File Structure

```
├── index.html   # Main application shell & all page markup
├── styles.css   # Complete responsive stylesheet
├── app.js       # Application logic, charts, live simulation
└── README.md    # This file
```

## Technology

- Vanilla HTML5, CSS3, JavaScript (ES2020, no framework dependencies)
- [Chart.js 4](https://www.chartjs.org/) for data visualisation (loaded from CDN)
- SVG floor plan for interactive digital twin view
- CSS animations for live data feel and avatar personality

## Sensor Simulation

The platform includes a built-in sensor data simulator that updates every 1.5 s so the
dashboard feels live without needing a backend. Replace the `state.sensors` array and the
`simulateLiveUpdates` / `tickLiveFlow` functions in `app.js` with real WebSocket or REST
calls to connect to physical sensors.
