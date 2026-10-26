/**
 * SkySimple - Premium Weather Application Engine
 * Supports Open-Meteo (No API key needed, high reliability) & OpenWeatherMap (Custom API Key)
 */
const express = require('express');
const app = express();
(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // Application State
  // --------------------------------------------------------------------------
  const DEFAULT_CITY = {
    name: 'San Francisco',
    country: 'United States',
    admin1: 'California',
    lat: 37.7749,
    lon: -122.4194
  };

  const state = {
    currentCity: JSON.parse(localStorage.getItem('skysimple_current_city')) || DEFAULT_CITY,
    unit: localStorage.getItem('skysimple_unit') || 'c', // 'c' or 'f'
    provider: localStorage.getItem('skysimple_provider') || 'open-meteo', // 'open-meteo' or 'openweathermap'
    owmApiKey: localStorage.getItem('skysimple_owm_key') || '',
    activeTab: 'today',
    savedPlaces: JSON.parse(localStorage.getItem('skysimple_saved_places')) || [
      { name: 'San Francisco', country: 'United States', lat: 37.7749, lon: -122.4194, temp: 18, code: 2, desc: 'Partly cloudy' },
      { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278, temp: 15, code: 3, desc: 'Overcast' },
      { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503, temp: 22, code: 0, desc: 'Clear sky' }
    ],
    weatherData: null,
    isLoading: false
  };

  // --------------------------------------------------------------------------
  // DOM Elements Cache
  // --------------------------------------------------------------------------
  const DOM = {
    // Navigation
    tabToday: document.getElementById('tabToday'),
    tabForecast: document.getElementById('tabForecast'),
    tabSaved: document.getElementById('tabSaved'),
    todayView: document.getElementById('todayView'),
    forecastView: document.getElementById('forecastView'),
    savedView: document.getElementById('savedView'),
    savedCountBadge: document.getElementById('savedCountBadge'),
    viewFullForecastBtn: document.getElementById('viewFullForecastBtn'),
    backToTodayBtn: document.getElementById('backToTodayBtn'),
    mobileNavItems: document.querySelectorAll('.mob-item'),

    // Unit toggle buttons
    btnCelsius: document.getElementById('btnCelsius'),
    btnFahrenheit: document.getElementById('btnFahrenheit'),
    modalUnitC: document.getElementById('modalUnitC'),
    modalUnitF: document.getElementById('modalUnitF'),

    // Search & Geolocation
    citySearchInput: document.getElementById('citySearchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    searchDropdown: document.getElementById('searchDropdown'),
    geoBtn: document.getElementById('geoBtn'),
    bookmarkBtn: document.getElementById('bookmarkBtn'),
    bookmarkIcon: document.getElementById('bookmarkIcon'),

    // Hero Weather Card
    cityName: document.getElementById('cityName'),
    dateStr: document.getElementById('dateStr'),
    apiBadge: document.getElementById('apiBadge'),
    heroWeatherIcon: document.getElementById('heroWeatherIcon'),
    currentTemp: document.getElementById('currentTemp'),
    weatherDesc: document.getElementById('weatherDesc'),
    highLow: document.getElementById('highLow'),

    // Weather Details
    valHumidity: document.getElementById('valHumidity'),
    valWind: document.getElementById('valWind'),
    valFeels: document.getElementById('valFeels'),
    valVisibility: document.getElementById('valVisibility'),
    valPressure: document.getElementById('valPressure'),
    valPrecip: document.getElementById('valPrecip'),
    valUV: document.getElementById('valUV'),
    notePressure: document.getElementById('notePressure'),
    notePrecip: document.getElementById('notePrecip'),

    // Forecast Containers
    forecastDays: document.getElementById('forecastDays'),
    forecastSubtitle: document.getElementById('forecastSubtitle'),
    hourlySlider: document.getElementById('hourlySlider'),
    weekList: document.getElementById('weekList'),

    // Saved places
    savedPlacesGrid: document.getElementById('savedPlacesGrid'),
    noSavedPlacesPrompt: document.getElementById('noSavedPlacesPrompt'),
    saveCurrentLocationAction: document.getElementById('saveCurrentLocationAction'),

    // Notification Banner
    notificationBanner: document.getElementById('notificationBanner'),
    notificationMessage: document.getElementById('notificationMessage'),
    closeNotification: document.getElementById('closeNotification'),

    // Settings Modal
    settingsModal: document.getElementById('settingsModal'),
    openSettingsBtn: document.getElementById('openSettingsBtn'),
    profileBtn: document.getElementById('profileBtn'),
    mobSettingsBtn: document.getElementById('mobSettingsBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    providerOpenMeteo: document.getElementById('providerOpenMeteo'),
    providerOpenWeatherMap: document.getElementById('providerOpenWeatherMap'),
    owmKeyBox: document.getElementById('owmKeyBox'),
    owmApiKeyInput: document.getElementById('owmApiKeyInput'),
    toggleKeyVisibility: document.getElementById('toggleKeyVisibility'),
    quickCityChips: document.querySelectorAll('.quick-city-chip')
  };

  // --------------------------------------------------------------------------
  // Weather Code Mapper & SVG Graphics
  // --------------------------------------------------------------------------
  function getWeatherInfo(code) {
    // WMO Weather interpretation codes (WW)
    const codeMap = {
      0: { text: 'Clear sky', icon: 'clear' },
      1: { text: 'Mainly clear', icon: 'partly-cloudy' },
      2: { text: 'Partly cloudy', icon: 'partly-cloudy' },
      3: { text: 'Overcast', icon: 'cloudy' },
      45: { text: 'Fog', icon: 'fog' },
      48: { text: 'Depositing rime fog', icon: 'fog' },
      51: { text: 'Light drizzle', icon: 'drizzle' },
      53: { text: 'Moderate drizzle', icon: 'drizzle' },
      55: { text: 'Dense drizzle', icon: 'drizzle' },
      61: { text: 'Slight rain', icon: 'rain' },
      63: { text: 'Moderate rain', icon: 'rain' },
      65: { text: 'Heavy rain', icon: 'rain' },
      71: { text: 'Slight snow fall', icon: 'snow' },
      73: { text: 'Moderate snow fall', icon: 'snow' },
      75: { text: 'Heavy snow fall', icon: 'snow' },
      77: { text: 'Snow grains', icon: 'snow' },
      80: { text: 'Slight rain showers', icon: 'rain' },
      81: { text: 'Moderate rain showers', icon: 'rain' },
      82: { text: 'Violent rain showers', icon: 'rain' },
      85: { text: 'Slight snow showers', icon: 'snow' },
      86: { text: 'Heavy snow showers', icon: 'snow' },
      95: { text: 'Thunderstorm', icon: 'thunderstorm' },
      96: { text: 'Thunderstorm with slight hail', icon: 'thunderstorm' },
      99: { text: 'Thunderstorm with heavy hail', icon: 'thunderstorm' }
    };

    return codeMap[code] || { text: 'Partly cloudy', icon: 'partly-cloudy' };
  }

  function getSVGIcon(type) {
    switch (type) {
      case 'clear':
        return `
          <svg viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="14" fill="#FBBF24" />
            <path d="M32 6V12M32 52V58M6 32H12M52 32H58M13.62 13.62L17.86 17.86M46.14 46.14L50.38 50.38M13.62 50.38L17.86 46.14M46.14 17.86L50.38 13.62" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"/>
          </svg>
        `;

      case 'partly-cloudy':
        return `
          <svg viewBox="0 0 64 64" fill="none">
            <!-- Radiant Golden Sun -->
            <circle cx="25" cy="25" r="12" fill="#FBBF24" />
            <path d="M25 7V11M25 39V43M7 25H11M39 25H43M12.27 12.27L15.1 15.1M34.9 34.9L37.73 37.73M12.27 37.73L15.1 34.9M34.9 15.1L37.73 12.27" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/>
            <!-- Soft White & Sky Blue Cloud -->
            <path d="M20 44C20 38.4772 24.4772 34 30 34C31.5647 34 33.0531 34.3601 34.3798 35.0028C36.1963 31.3912 39.8821 29 44.15 29C49.5901 29 54 33.4099 54 38.85C54 39.2605 53.9749 39.6652 53.926 40.0617C57.4815 41.0718 60 44.2987 60 48.1C60 52.7392 56.2392 56.5 51.6 56.5H29C24.0294 56.5 20 52.4706 20 47.5V44Z" fill="#E2E8F0" />
            <path d="M18 45C18 39.4772 22.4772 35 28 35C29.5647 35 31.0531 35.3601 32.3798 36.0028C34.1963 32.3912 37.8821 30 42.15 30C47.5901 30 52 34.4099 52 39.85C52 40.2605 51.9749 40.6652 51.926 41.0617C55.4815 42.0718 58 45.2987 58 49.1C58 53.7392 54.2392 57.5 49.6 57.5H27C22.0294 57.5 18 53.4706 18 48.5V45Z" fill="#FFFFFF" />
          </svg>
        `;

      case 'cloudy':
        return `
          <svg viewBox="0 0 64 64" fill="none">
            <path d="M14 42C14 36.4772 18.4772 32 24 32C25.5647 32 27.0531 32.3601 28.3798 33.0028C30.1963 29.3912 33.8821 27 38.15 27C43.5901 27 48 31.4099 48 36.85C48 37.2605 47.9749 37.6652 47.926 38.0617C51.4815 39.0718 54 42.2987 54 46.1C54 50.7392 50.2392 54.5 45.6 54.5H23C18.0294 54.5 14 50.4706 14 45.5V42Z" fill="#CBD5E1" />
            <path d="M22 34C22 28.4772 26.4772 24 32 24C33.5647 24 35.0531 24.3601 36.3798 25.0028C38.1963 21.3912 41.8821 19 46.15 19C51.5901 19 56 23.4099 56 28.85C56 29.2605 55.9749 29.6652 55.926 30.0617C59.4815 31.0718 62 34.2987 62 38.1C62 42.7392 58.2392 46.5 53.6 46.5H31C26.0294 46.5 22 42.4706 22 37.5V34Z" fill="#94A3B8" />
          </svg>
        `;

      case 'rain':
      case 'drizzle':
        return `
          <svg viewBox="0 0 64 64" fill="none">
            <path d="M16 34C16 29.5817 19.5817 26 24 26C25.2518 26 26.4425 26.2881 27.5038 26.8023C28.957 23.913 31.9057 22 35.32 22C39.6721 22 43.2 25.5279 43.2 29.88C43.2 30.2084 43.1799 30.5322 43.1408 30.8494C45.9852 31.6574 48 34.2389 48 37.28C48 40.9913 44.9913 44 41.28 44H23.2C19.2235 44 16 40.7765 16 36.8V34Z" fill="#93C5FD" />
            <line x1="22" y1="48" x2="18" y2="56" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/>
            <line x1="32" y1="48" x2="28" y2="56" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/>
            <line x1="42" y1="48" x2="38" y2="56" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/>
          </svg>
        `;

      case 'thunderstorm':
        return `
          <svg viewBox="0 0 64 64" fill="none">
            <path d="M16 30C16 25.5817 19.5817 22 24 22C25.2518 22 26.4425 22.2881 27.5038 22.8023C28.957 19.913 31.9057 18 35.32 18C39.6721 18 43.2 21.5279 43.2 25.88C43.2 26.2084 43.1799 26.5322 43.1408 26.8494C45.9852 27.6574 48 30.2389 48 33.28C48 36.9913 44.9913 40 41.28 40H23.2C19.2235 40 16 36.7765 16 32.8V30Z" fill="#64748B" />
            <polygon points="32 38 26 49 32 49 28 58 40 46 33 46" fill="#FBBF24" />
          </svg>
        `;

      case 'snow':
        return `
          <svg viewBox="0 0 64 64" fill="none">
            <path d="M18 34C18 29.5817 21.5817 26 26 26C27.2518 26 28.4425 26.2881 29.5038 26.8023C30.957 23.913 33.9057 22 37.32 22C41.6721 22 45.2 25.5279 45.2 29.88C45.2 30.2084 45.1799 30.5322 45.1408 30.8494C47.9852 31.6574 50 34.2389 50 37.28C50 40.9913 46.9913 44 43.28 44H25.2C21.2235 44 18 40.7765 18 36.8V34Z" fill="#BAE6FD" />
            <circle cx="24" cy="52" r="2.5" fill="#38BDF8"/>
            <circle cx="34" cy="54" r="2.5" fill="#38BDF8"/>
            <circle cx="44" cy="51" r="2.5" fill="#38BDF8"/>
          </svg>
        `;

      case 'fog':
      default:
        return `
          <svg viewBox="0 0 64 64" fill="none">
            <path d="M18 28C18 23.5817 21.5817 20 26 20C27.2518 20 28.4425 20.2881 29.5038 20.8023C30.957 17.913 33.9057 16 37.32 16C41.6721 16 45.2 19.5279 45.2 23.88C45.2 24.2084 45.1799 24.5322 45.1408 24.8494C47.9852 25.6574 50 28.2389 50 31.28C50 34.9913 46.9913 38 43.28 38H25.2C21.2235 38 18 34.7765 18 30.8V28Z" fill="#CBD5E1" />
            <line x1="16" y1="46" x2="48" y2="46" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
            <line x1="20" y1="52" x2="44" y2="52" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
          </svg>
        `;
    }
  }

  // --------------------------------------------------------------------------
  // Temperature & Unit Conversion
  // --------------------------------------------------------------------------
  function formatTemp(celsiusVal) {
    if (celsiusVal === undefined || celsiusVal === null || isNaN(celsiusVal)) return '--°';
    if (state.unit === 'f') {
      const fVal = Math.round((celsiusVal * 9) / 5 + 32);
      return `${fVal}°F`;
    }
    return `${Math.round(celsiusVal)}°C`;
  }

  function getWindDirection(deg) {
    if (deg === undefined || deg === null) return '';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  }

  function formatWindSpeed(kmh) {
    if (kmh === undefined || kmh === null) return '--';
    if (state.unit === 'f') {
      const mph = Math.round(kmh * 0.621371);
      return `${mph} mph`;
    }
    return `${Math.round(kmh)} km/h`;
  }

  // --------------------------------------------------------------------------
  // Weather API Integrations
  // --------------------------------------------------------------------------
  async function fetchWeatherData(lat, lon) {
    // If OpenWeatherMap is chosen and API key is provided
    if (state.provider === 'openweathermap' && state.owmApiKey.trim().length > 0) {
      try {
        const owmRes = await fetchOWMWeather(lat, lon, state.owmApiKey.trim());
        if (owmRes) return owmRes;
      } catch (err) {
        console.warn('OWM fetch failed, falling back to Open-Meteo:', err);
        showNotification('OpenWeatherMap key invalid or limited. Using Open-Meteo automatically!');
      }
    }

    // Default: Open-Meteo API (High precision, Free, No API key needed)
    return await fetchOpenMeteoWeather(lat, lon);
  }

  async function fetchOpenMeteoWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo API HTTP error: ${res.status}`);
    }

    const data = await res.json();
    return parseOpenMeteoResponse(data);
  }

  function parseOpenMeteoResponse(data) {
    const cur = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    const weatherInfo = getWeatherInfo(cur.weather_code);

    // Calculate approximate visibility or use standard 10 km if clear
    let visibilityKm = 10;
    if (cur.weather_code >= 45 && cur.weather_code <= 48) visibilityKm = 1.5;
    else if (cur.weather_code >= 61) visibilityKm = 6;

    // Process 7-day forecast
    const forecastDays = [];
    if (daily && daily.time) {
      for (let i = 0; i < daily.time.length; i++) {
        const dateObj = new Date(daily.time[i] + 'T00:00:00');
        const dayShort = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const dayFull = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        const dayInfo = getWeatherInfo(daily.weather_code[i]);

        forecastDays.push({
          dateStr: daily.time[i],
          dayShort: dayShort,
          dayFull: dayFull,
          maxTemp: daily.temperature_2m_max[i],
          minTemp: daily.temperature_2m_min[i],
          code: daily.weather_code[i],
          text: dayInfo.text,
          icon: dayInfo.icon,
          uv: daily.uv_index_max ? daily.uv_index_max[i] : 4
        });
      }
    }

    // Process next 24 hours
    const hourlyForecast = [];
    if (hourly && hourly.time) {
      const now = new Date();
      let count = 0;
      for (let i = 0; i < hourly.time.length && count < 24; i++) {
        const hDate = new Date(hourly.time[i]);
        if (hDate >= new Date(now.getTime() - 3600000)) {
          const hInfo = getWeatherInfo(hourly.weather_code[i]);
          hourlyForecast.push({
            time: hDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
            temp: hourly.temperature_2m[i],
            icon: hInfo.icon,
            code: hourly.weather_code[i],
            isNow: count === 0
          });
          count++;
        }
      }
    }

    return {
      provider: 'Open-Meteo',
      temp: cur.temperature_2m,
      feelsLike: cur.apparent_temperature,
      humidity: cur.relative_humidity_2m,
      windSpeed: cur.wind_speed_10m,
      windDir: getWindDirection(cur.wind_direction_10m),
      visibility: visibilityKm,
      pressure: Math.round(cur.surface_pressure || 1013),
      precipitation: cur.precipitation || 0,
      uvIndex: daily.uv_index_max && daily.uv_index_max[0] ? Math.round(daily.uv_index_max[0]) : 3,
      weatherCode: cur.weather_code,
      weatherDesc: weatherInfo.text,
      iconType: weatherInfo.icon,
      todayHigh: daily.temperature_2m_max ? daily.temperature_2m_max[0] : cur.temperature_2m + 3,
      todayLow: daily.temperature_2m_min ? daily.temperature_2m_min[0] : cur.temperature_2m - 4,
      dailyForecast: forecastDays,
      hourlyForecast: hourlyForecast
    };
  }

  // OpenWeatherMap Integration with Fallback
  async function fetchOWMWeather(lat, lon, apiKey) {
    const curUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const curRes = await fetch(curUrl);
    if (!curRes.ok) throw new Error(`OWM HTTP ${curRes.status}`);
    const curData = await curRes.json();

    const fcUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const fcRes = await fetch(fcUrl);
    const fcData = fcRes.ok ? await fcRes.json() : null;

    // Map OWM condition code to our icon
    const owmId = curData.weather && curData.weather[0] ? curData.weather[0].id : 800;
    let mappedCode = 0;
    if (owmId >= 200 && owmId < 300) mappedCode = 95;
    else if (owmId >= 300 && owmId < 600) mappedCode = 61;
    else if (owmId >= 600 && owmId < 700) mappedCode = 71;
    else if (owmId >= 700 && owmId < 800) mappedCode = 45;
    else if (owmId === 800) mappedCode = 0;
    else if (owmId === 801 || owmId === 802) mappedCode = 2;
    else mappedCode = 3;

    const weatherInfo = getWeatherInfo(mappedCode);

    // Build 5-day daily from 3-hour forecasts
    const dailyMap = {};
    if (fcData && fcData.list) {
      fcData.list.forEach(item => {
        const dateKey = item.dt_txt.split(' ')[0];
        if (!dailyMap[dateKey]) {
          dailyMap[dateKey] = {
            temps: [],
            codes: []
          };
        }
        dailyMap[dateKey].temps.push(item.main.temp);
        dailyMap[dateKey].codes.push(item.weather[0].id);
      });
    }

    const forecastDays = Object.keys(dailyMap).slice(0, 7).map(dateKey => {
      const d = new Date(dateKey + 'T00:00:00');
      const max = Math.max(...dailyMap[dateKey].temps);
      const min = Math.min(...dailyMap[dateKey].temps);
      return {
        dateStr: dateKey,
        dayShort: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayFull: d.toLocaleDateString('en-US', { weekday: 'long' }),
        maxTemp: max,
        minTemp: min,
        code: mappedCode,
        text: weatherInfo.text,
        icon: weatherInfo.icon,
        uv: 4
      };
    });

    return {
      provider: 'OpenWeatherMap',
      temp: curData.main.temp,
      feelsLike: curData.main.feels_like,
      humidity: curData.main.humidity,
      windSpeed: curData.wind.speed * 3.6, // m/s to km/h
      windDir: getWindDirection(curData.wind.deg),
      visibility: Math.round((curData.visibility || 10000) / 1000),
      pressure: curData.main.pressure,
      precipitation: curData.rain ? (curData.rain['1h'] || 0) : 0,
      uvIndex: 4,
      weatherCode: mappedCode,
      weatherDesc: curData.weather[0].description.replace(/^\w/, c => c.toUpperCase()),
      iconType: weatherInfo.icon,
      todayHigh: curData.main.temp_max,
      todayLow: curData.main.temp_min,
      dailyForecast: forecastDays,
      hourlyForecast: []
    };
  }

  // --------------------------------------------------------------------------
  // Geocoding Search (Live Auto-complete via Open-Meteo Geocoding)
  // --------------------------------------------------------------------------
  let searchDebounceTimer = null;

  async function searchCities(query) {
    if (!query || query.trim().length < 2) {
      DOM.searchDropdown.style.display = 'none';
      return;
    }

    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`);
      if (!res.ok) return;
      const data = await res.json();

      if (!data.results || data.results.length === 0) {
        DOM.searchDropdown.innerHTML = `<div class="search-result-item" style="cursor: default; color: #94a3b8;">No cities found for "${query}"</div>`;
        DOM.searchDropdown.style.display = 'block';
        return;
      }

      renderSearchResults(data.results);
    } catch (err) {
      console.error('Search error:', err);
    }
  }

  function renderSearchResults(results) {
    DOM.searchDropdown.innerHTML = '';
    results.forEach(item => {
      const el = document.createElement('div');
      el.className = 'search-result-item';

      const regionPart = [item.admin1, item.country].filter(Boolean).join(', ');

      el.innerHTML = `
        <div>
          <span class="search-result-city">${item.name}</span>
          <span class="search-result-country"> • ${regionPart}</span>
        </div>
        <span style="font-size: 0.75rem; color: #94a3b8;">${item.country_code || ''}</span>
      `;

      el.addEventListener('click', () => {
        selectCity({
          name: item.name,
          country: item.country || '',
          admin1: item.admin1 || '',
          lat: item.latitude,
          lon: item.longitude
        });
        DOM.searchDropdown.style.display = 'none';
        DOM.citySearchInput.value = '';
        DOM.clearSearchBtn.style.display = 'none';
      });

      DOM.searchDropdown.appendChild(el);
    });

    DOM.searchDropdown.style.display = 'block';
  }

  function selectCity(cityObj) {
    state.currentCity = cityObj;
    localStorage.setItem('skysimple_current_city', JSON.stringify(cityObj));
    updateBookmarkState();
    loadWeather();
  }

  // --------------------------------------------------------------------------
  // Update UI & Render
  // --------------------------------------------------------------------------
  async function loadWeather() {
    state.isLoading = true;
    DOM.cityName.textContent = state.currentCity.name;
    DOM.dateStr.textContent = 'Loading live weather...';

    try {
      const data = await fetchWeatherData(state.currentCity.lat, state.currentCity.lon);
      state.weatherData = data;
      renderAll();
    } catch (err) {
      console.error('Failed to load weather:', err);
      showNotification('Error loading weather data. Please check internet connection.');
      DOM.dateStr.textContent = 'Unable to fetch data';
    } finally {
      state.isLoading = false;
    }
  }

  function renderAll() {
    if (!state.weatherData) return;
    const w = state.weatherData;

    // Header & Hero Card
    DOM.cityName.textContent = state.currentCity.name;
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    DOM.dateStr.textContent = `Today, ${dayName}`;

    DOM.apiBadge.textContent = w.provider === 'Open-Meteo' ? 'Open-Meteo Live' : 'OpenWeatherMap';
    DOM.apiBadge.style.background = w.provider === 'Open-Meteo' ? '#ecfdf5' : '#fef3c7';
    DOM.apiBadge.style.color = w.provider === 'Open-Meteo' ? '#059669' : '#b45309';

    DOM.heroWeatherIcon.innerHTML = getSVGIcon(w.iconType);
    DOM.currentTemp.textContent = formatTemp(w.temp);
    DOM.weatherDesc.textContent = w.weatherDesc;
    DOM.highLow.innerHTML = `H: <span class="temp-high">${formatTemp(w.todayHigh)}</span> &nbsp; L: <span class="temp-low">${formatTemp(w.todayLow)}</span>`;

    // Weather Details
    DOM.valHumidity.textContent = `${w.humidity}%`;
    DOM.valWind.textContent = `${formatWindSpeed(w.windSpeed)} ${w.windDir}`;
    DOM.valFeels.textContent = formatTemp(w.feelsLike);
    DOM.valVisibility.textContent = `${w.visibility} km`;

    // Extra highlights
    DOM.valPressure.textContent = `${w.pressure} hPa`;
    DOM.valPrecip.textContent = `${w.precipitation.toFixed(1)} mm`;
    DOM.valUV.textContent = `${w.uvIndex} (${w.uvIndex <= 2 ? 'Low' : w.uvIndex <= 5 ? 'Moderate' : 'High'})`;

    if (w.precipitation > 0) {
      DOM.notePrecip.textContent = `Current precipitation: ${w.precipitation} mm`;
    } else {
      DOM.notePrecip.textContent = 'No rain expected in the next hours';
    }

    // 5-Day Forecast (Matches SkySimple screenshot bottom card)
    render5DayForecast(w.dailyForecast);

    // Hourly Forecast
    renderHourlyForecast(w.hourlyForecast);

    // 7-Day Extended Forecast List
    renderWeekList(w.dailyForecast);

    // Update Saved Places View
    renderSavedPlaces();
    updateBookmarkState();
  }

  function render5DayForecast(dailyList) {
    if (!dailyList || dailyList.length === 0) return;
    DOM.forecastDays.innerHTML = '';

    // Take the next 5 days
    const nextFiveDays = dailyList.slice(1, 6);

    nextFiveDays.forEach(day => {
      const item = document.createElement('div');
      item.className = 'forecast-day-item';

      item.innerHTML = `
        <span class="fc-day-name">${day.dayShort}</span>
        <div class="fc-day-icon">${getSVGIcon(day.icon)}</div>
        <span class="fc-day-high">${formatTemp(day.maxTemp)}</span>
        <span class="fc-day-low">${formatTemp(day.minTemp)}</span>
      `;

      DOM.forecastDays.appendChild(item);
    });
  }

  function renderHourlyForecast(hourlyList) {
    if (!hourlyList || hourlyList.length === 0) {
      DOM.hourlySlider.innerHTML = '<p style="padding: 12px; color: #94a3b8;">Hourly forecast is not available for this provider.</p>';
      return;
    }

    DOM.hourlySlider.innerHTML = '';
    hourlyList.forEach(item => {
      const el = document.createElement('div');
      el.className = `hourly-item ${item.isNow ? 'is-now' : ''}`;

      el.innerHTML = `
        <span class="hourly-time">${item.isNow ? 'Now' : item.time}</span>
        <div class="hourly-icon">${getSVGIcon(item.icon)}</div>
        <span class="hourly-temp">${formatTemp(item.temp)}</span>
      `;

      DOM.hourlySlider.appendChild(el);
    });
  }

  function renderWeekList(dailyList) {
    if (!dailyList || dailyList.length === 0) return;
    DOM.weekList.innerHTML = '';

    dailyList.forEach(day => {
      const row = document.createElement('div');
      row.className = 'week-row';

      row.innerHTML = `
        <div class="week-row-day">${day.dayFull}</div>
        <div class="week-row-cond">
          ${getSVGIcon(day.icon)}
          <span>${day.text}</span>
        </div>
        <div class="week-temp-bar-wrapper">
          <div class="week-temp-bar">
            <div class="week-temp-fill" style="width: 75%; margin-left: 10%;"></div>
          </div>
        </div>
        <div class="week-row-temps">
          <span style="color: #1e293b;">${formatTemp(day.maxTemp)}</span> / <span style="color: #3b82f6;">${formatTemp(day.minTemp)}</span>
        </div>
      `;

      DOM.weekList.appendChild(row);
    });
  }

  // --------------------------------------------------------------------------
  // Saved Places (Bookmarks)
  // --------------------------------------------------------------------------
  function isCurrentCitySaved() {
    return state.savedPlaces.some(
      p => p.name.toLowerCase() === state.currentCity.name.toLowerCase()
    );
  }

  function updateBookmarkState() {
    if (isCurrentCitySaved()) {
      DOM.bookmarkBtn.classList.add('is-saved');
      DOM.bookmarkIcon.style.fill = '#f59e0b';
      DOM.bookmarkIcon.style.color = '#f59e0b';
    } else {
      DOM.bookmarkBtn.classList.remove('is-saved');
      DOM.bookmarkIcon.style.fill = 'none';
      DOM.bookmarkIcon.style.color = '#64748b';
    }
    DOM.savedCountBadge.textContent = state.savedPlaces.length;
  }

  function toggleSaveCurrentCity() {
    const isSaved = isCurrentCitySaved();
    if (isSaved) {
      state.savedPlaces = state.savedPlaces.filter(
        p => p.name.toLowerCase() !== state.currentCity.name.toLowerCase()
      );
      showNotification(`${state.currentCity.name} removed from saved places.`);
    } else {
      const currentTemp = state.weatherData ? state.weatherData.temp : 20;
      const currentCode = state.weatherData ? state.weatherData.weatherCode : 0;
      const currentDesc = state.weatherData ? state.weatherData.weatherDesc : 'Clear';

      state.savedPlaces.push({
        name: state.currentCity.name,
        country: state.currentCity.country,
        admin1: state.currentCity.admin1,
        lat: state.currentCity.lat,
        lon: state.currentCity.lon,
        temp: currentTemp,
        code: currentCode,
        desc: currentDesc
      });
      showNotification(`${state.currentCity.name} added to saved places!`);
    }

    localStorage.setItem('skysimple_saved_places', JSON.stringify(state.savedPlaces));
    updateBookmarkState();
    renderSavedPlaces();
  }

  function renderSavedPlaces() {
    if (!state.savedPlaces || state.savedPlaces.length === 0) {
      DOM.savedPlacesGrid.innerHTML = '';
      DOM.noSavedPlacesPrompt.style.display = 'block';
      return;
    }

    DOM.noSavedPlacesPrompt.style.display = 'none';
    DOM.savedPlacesGrid.innerHTML = '';

    state.savedPlaces.forEach((place, index) => {
      const card = document.createElement('div');
      card.className = 'saved-place-card';

      const info = getWeatherInfo(place.code !== undefined ? place.code : 2);

      card.innerHTML = `
        <div class="sp-header">
          <div>
            <div class="sp-city">${place.name}</div>
            <div class="sp-country">${[place.admin1, place.country].filter(Boolean).join(', ')}</div>
          </div>
          <button class="sp-del-btn" data-index="${index}" title="Remove place">✕</button>
        </div>
        <div class="sp-body">
          <div class="sp-temp">${formatTemp(place.temp)}</div>
          <div class="sp-icon">${getSVGIcon(info.icon)}</div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.sp-del-btn')) return;
        selectCity({
          name: place.name,
          country: place.country,
          admin1: place.admin1,
          lat: place.lat,
          lon: place.lon
        });
        switchTab('today');
      });

      const delBtn = card.querySelector('.sp-del-btn');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.savedPlaces.splice(index, 1);
        localStorage.setItem('skysimple_saved_places', JSON.stringify(state.savedPlaces));
        updateBookmarkState();
        renderSavedPlaces();
      });

      DOM.savedPlacesGrid.appendChild(card);
    });
  }

  // --------------------------------------------------------------------------
  // Tab Navigation
  // --------------------------------------------------------------------------
  function switchTab(tabId) {
    state.activeTab = tabId;

    // Sidebar items
    [DOM.tabToday, DOM.tabForecast, DOM.tabSaved].forEach(btn => {
      if (btn) btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Mobile nav items
    DOM.mobileNavItems.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // View Panels
    DOM.todayView.classList.toggle('active', tabId === 'today');
    DOM.forecastView.classList.toggle('active', tabId === 'forecast');
    DOM.savedView.classList.toggle('active', tabId === 'saved');

    if (tabId === 'forecast') {
      DOM.forecastSubtitle.textContent = `Hourly trends & 7-day outlook for ${state.currentCity.name}`;
    }
  }

  // --------------------------------------------------------------------------
  // Notification Banner
  // --------------------------------------------------------------------------
  let notificationTimer = null;
  function showNotification(msg) {
    DOM.notificationMessage.textContent = msg;
    DOM.notificationBanner.style.display = 'flex';
    if (notificationTimer) clearTimeout(notificationTimer);
    notificationTimer = setTimeout(() => {
      DOM.notificationBanner.style.display = 'none';
    }, 4500);
  }

  // --------------------------------------------------------------------------
  // Units Management (°C / °F)
  // --------------------------------------------------------------------------
  function setUnit(newUnit) {
    state.unit = newUnit;
    localStorage.setItem('skysimple_unit', newUnit);

    DOM.btnCelsius.classList.toggle('active', newUnit === 'c');
    DOM.btnFahrenheit.classList.toggle('active', newUnit === 'f');
    DOM.modalUnitC.classList.toggle('active', newUnit === 'c');
    DOM.modalUnitF.classList.toggle('active', newUnit === 'f');

    renderAll();
  }

  // --------------------------------------------------------------------------
  // Geolocation (GPS)
  // --------------------------------------------------------------------------
  function handleGeolocation() {
    if (!navigator.geolocation) {
      showNotification('Geolocation is not supported by your browser.');
      return;
    }

    showNotification('Locating your GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        try {
          // Reverse geocode with Open-Meteo / BigDataCloud
          const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          let resolvedName = 'Current Location';
          let resolvedCountry = '';

          if (revRes.ok) {
            const revData = await revRes.json();
            resolvedName = revData.address.city || revData.address.town || revData.address.village || revData.address.county || 'Current Location';
            resolvedCountry = revData.address.country || '';
          }

          selectCity({
            name: resolvedName,
            country: resolvedCountry,
            lat: lat,
            lon: lon
          });
          showNotification(`Location set to: ${resolvedName}`);
        } catch (err) {
          selectCity({
            name: 'Local Weather',
            country: '',
            lat: lat,
            lon: lon
          });
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        showNotification('Unable to retrieve location. Please check location permissions.');
      },
      { timeout: 10000 }
    );
  }

  // --------------------------------------------------------------------------
  // Settings & API Keys Modal Handlers
  // --------------------------------------------------------------------------
  function openSettings() {
    DOM.providerOpenMeteo.checked = state.provider === 'open-meteo';
    DOM.providerOpenWeatherMap.checked = state.provider === 'openweathermap';
    DOM.owmApiKeyInput.value = state.owmApiKey;
    DOM.owmKeyBox.style.display = state.provider === 'openweathermap' ? 'flex' : 'none';

    DOM.modalUnitC.classList.toggle('active', state.unit === 'c');
    DOM.modalUnitF.classList.toggle('active', state.unit === 'f');

    DOM.settingsModal.style.display = 'flex';
  }

  function closeSettings() {
    DOM.settingsModal.style.display = 'none';
  }

  function saveSettings() {
    const selectedProvider = DOM.providerOpenMeteo.checked ? 'open-meteo' : 'openweathermap';
    const keyVal = DOM.owmApiKeyInput.value.trim();

    state.provider = selectedProvider;
    state.owmApiKey = keyVal;

    localStorage.setItem('skysimple_provider', selectedProvider);
    localStorage.setItem('skysimple_owm_key', keyVal);

    closeSettings();
    showNotification(`Settings updated: using ${selectedProvider === 'open-meteo' ? 'Open-Meteo' : 'OpenWeatherMap'}`);
    loadWeather();
  }

  // --------------------------------------------------------------------------
  // Event Listeners Setup
  // --------------------------------------------------------------------------
  function setupEventListeners() {
    // Navigation
    DOM.tabToday.addEventListener('click', () => switchTab('today'));
    DOM.tabForecast.addEventListener('click', () => switchTab('forecast'));
    DOM.tabSaved.addEventListener('click', () => switchTab('saved'));
    DOM.viewFullForecastBtn.addEventListener('click', () => switchTab('forecast'));
    DOM.backToTodayBtn.addEventListener('click', () => switchTab('today'));

    DOM.mobileNavItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        if (tab) switchTab(tab);
      });
    });

    // Units toggle
    DOM.btnCelsius.addEventListener('click', () => setUnit('c'));
    DOM.btnFahrenheit.addEventListener('click', () => setUnit('f'));
    DOM.modalUnitC.addEventListener('click', () => setUnit('c'));
    DOM.modalUnitF.addEventListener('click', () => setUnit('f'));

    // Search bar
    DOM.citySearchInput.addEventListener('input', (e) => {
      const q = e.target.value;
      DOM.clearSearchBtn.style.display = q.length > 0 ? 'flex' : 'none';

      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => searchCities(q), 300);
    });

    DOM.citySearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const first = DOM.searchDropdown.querySelector('.search-result-item');
        if (first) first.click();
      }
    });

    DOM.clearSearchBtn.addEventListener('click', () => {
      DOM.citySearchInput.value = '';
      DOM.clearSearchBtn.style.display = 'none';
      DOM.searchDropdown.style.display = 'none';
      DOM.citySearchInput.focus();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!DOM.searchDropdown.contains(e.target) && e.target !== DOM.citySearchInput) {
        DOM.searchDropdown.style.display = 'none';
      }
    });

    // Current location & Bookmarks
    DOM.geoBtn.addEventListener('click', handleGeolocation);
    DOM.bookmarkBtn.addEventListener('click', toggleSaveCurrentCity);
    DOM.saveCurrentLocationAction.addEventListener('click', toggleSaveCurrentCity);

    // Notification banner close
    DOM.closeNotification.addEventListener('click', () => {
      DOM.notificationBanner.style.display = 'none';
    });

    // Settings Modal
    DOM.openSettingsBtn.addEventListener('click', openSettings);
    DOM.profileBtn.addEventListener('click', openSettings);
    if (DOM.mobSettingsBtn) DOM.mobSettingsBtn.addEventListener('click', openSettings);
    DOM.closeSettingsBtn.addEventListener('click', closeSettings);
    DOM.cancelSettingsBtn.addEventListener('click', closeSettings);
    DOM.saveSettingsBtn.addEventListener('click', saveSettings);

    DOM.providerOpenMeteo.addEventListener('change', () => {
      DOM.owmKeyBox.style.display = 'none';
    });

    DOM.providerOpenWeatherMap.addEventListener('change', () => {
      DOM.owmKeyBox.style.display = 'flex';
    });

    DOM.toggleKeyVisibility.addEventListener('click', () => {
      const isPwd = DOM.owmApiKeyInput.type === 'password';
      DOM.owmApiKeyInput.type = isPwd ? 'text' : 'password';
      DOM.toggleKeyVisibility.textContent = isPwd ? 'Hide' : 'Show';
    });

    // Quick City chips in Settings modal
    DOM.quickCityChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const cityName = chip.dataset.city;
        DOM.citySearchInput.value = cityName;
        closeSettings();
        searchCities(cityName).then(() => {
          const first = DOM.searchDropdown.querySelector('.search-result-item');
          if (first) first.click();
        });
      });
    });
  }

  // --------------------------------------------------------------------------
  // Application Bootstrap
  // --------------------------------------------------------------------------
  function init() {
    setUnit(state.unit);
    setupEventListeners();
    updateBookmarkState();
    loadWeather();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
p