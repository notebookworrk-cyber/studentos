export interface WeatherData {
  temperature: number;
  condition: string;
  conditionCode: number;
  high: number;
  low: number;
  city: string;
  lat: number;
  lon: number;
  fetchedAt: number;
}

export interface LocationConfig {
  city: string;
  lat: number;
  lon: number;
}

const WEATHER_CACHE_KEY = "studentos.weather.cache.v1";
const LOCATION_KEY = "studentos.location.v1";
const CACHE_TTL_MS = 30 * 60 * 1000;

const WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

export function getCachedWeather(): WeatherData | null {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as WeatherData;
    if (Date.now() - data.fetchedAt > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

export function setCachedWeather(data: WeatherData): void {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data));
  } catch {}
}

export function getSavedLocation(): LocationConfig | null {
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    return raw ? (JSON.parse(raw) as LocationConfig) : null;
  } catch {
    return null;
  }
}

export function saveLocation(loc: LocationConfig): void {
  try {
    localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
  } catch {}
}

export async function geocodeCity(city: string): Promise<LocationConfig | null> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results?.length) return null;
    const r = data.results[0];
    return { city: r.name, lat: r.latitude, lon: r.longitude };
  } catch {
    return null;
  }
}

export async function detectLocation(): Promise<LocationConfig | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ city: "Current location", lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => resolve(null),
      { timeout: 8000, maximumAge: 0 }
    );
  });
}

export async function fetchWeather(lat: number, lon: number, city: string): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const current = data.current;
    const daily = data.daily;
    if (!current || !daily) return null;
    return {
      temperature: Math.round(current.temperature_2m),
      condition: WEATHER_CODES[current.weather_code] ?? "Unknown",
      conditionCode: current.weather_code,
      high: Math.round(daily.temperature_2m_max[0]),
      low: Math.round(daily.temperature_2m_min[0]),
      city,
      lat,
      lon,
      fetchedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

export async function refreshWeather(): Promise<WeatherData | null> {
  const cached = getCachedWeather();
  if (cached) return cached;

  let loc = getSavedLocation();
  if (!loc) {
    loc = await detectLocation();
    if (!loc) return null;
    saveLocation(loc);
  }

  const weather = await fetchWeather(loc.lat, loc.lon, loc.city);
  if (weather) setCachedWeather(weather);
  return weather;
}

export function getConditionIcon(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "🌤️";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌧️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "❄️";
  if (code <= 99) return "⛈️";
  return "🌡️";
}