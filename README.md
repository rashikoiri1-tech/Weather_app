# SkySimple ⛅ - Modern Weather Application

A sleek, responsive weather application inspired by modern clean design, with real-time global weather forecasting, instant search, geolocation, unit toggling (°C/°F), 7-day outlook, 24-hour hourly graphs, and customizable API providers.

---

## ✨ Features

- **Pixel-Perfect UI**: Matches the SkySimple aesthetic with soft pastel sky backgrounds, rounded glass cards, vibrant weather illustrations, and clear typography.
- **Hero Weather Card**:
  - Live temperature & "feels like" metric.
  - Weather condition description and dynamic SVG artwork.
  - Daily High & Low temperatures.
  - Formatted day & date.
- **Detailed Atmospheric Metrics**:
  - Humidity (%)
  - Wind speed (km/h or mph) & 8-point compass direction (e.g. NW, SE)
  - Atmospheric pressure (hPa)
  - Visibility (km)
  - Precipitation (mm)
  - UV Index with safety rating
- **5-Day & 7-Day Extended Forecasts**:
  - Daily forecast cards with high and low temperature indicators.
  - Visual temperature range comparison bar.
- **24-Hour Hourly Forecast Slider**:
  - Hour-by-hour temperature progression with time badges.
- **Smart City Search with Autocomplete**:
  - Fast, debounced search querying global meteorological databases.
  - Shows city, state/province, and country name.
- **Geolocation**:
  - One-click "Current Location" button using HTML5 GPS geolocation and reverse geocoding.
- **Saved Places (Bookmarks)**:
  - Bookmark favorite cities with live weather mini-cards.
  - Quick-switch between saved cities with a single click.
  - Persistent state saved to `localStorage`.
- **Unit Conversion**:
  - Instant toggle between Celsius (°C) and Fahrenheit (°F).
- **API Key & Provider Integration**:
  - **Open-Meteo API (Default)**: Completely free, zero-config, highly accurate, **no API key needed**!
  - **OpenWeatherMap API**: User can provide an OpenWeatherMap API key in the Settings modal with automatic fallback if the key expires or fails.
- **Responsive Design**:
  - Full desktop layout with sidebar navigation.
  - Mobile layout with bottom navigation bar (matches mobile preview in design mockup).

---

## 🚀 How to Run the App

### Option 1: Direct in Browser
Simply open the `index.html` file in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari):

```bash
# In Windows PowerShell:
Start-Process "C:\Users\RASHI KOIRI\.gemini\antigravity\scratch\skysimple-weather-app\index.html"
```

### Option 2: Local HTTP Server (Optional)
If you prefer running through a local development server:

```bash
# Using Python:
cd "C:\Users\RASHI KOIRI\.gemini\antigravity\scratch\skysimple-weather-app"
python -m http.server 8080

# Then open in browser:
http://localhost:8080
```

---

## 🔑 API Keys & Settings

Click on **API Settings** in the sidebar (or click the avatar icon on mobile/top right) to open the configuration modal:

1. **Default Mode (Open-Meteo)**:
   - Works immediately out-of-the-box without requiring any signup or key.
2. **OpenWeatherMap Mode**:
   - Select OpenWeatherMap and paste your API key from [openweathermap.org](https://home.openweathermap.org/users/sign_up).
   - If an API key is ever invalid or rate-limited, SkySimple will seamlessly fall back to Open-Meteo so you never see a broken screen.

---

## 📁 File Structure

```
skysimple-weather-app/
├── index.html       # Semantic HTML5 layout (Sidebar, Hero, Details, Forecast, Modals)
├── style.css        # Clean CSS3 design system, responsive breakpoints & animations
├── app.js           # Weather engine, API integrations, geocoding & state management
└── README.md        # Documentation and usage guide
```
