import { useEffect, useState } from "react";
import { useOS } from "../../state/os";
import { refreshWeather, getCachedWeather, getConditionIcon, type WeatherData } from "../../lib/weather";
import { Icon } from "../Icon";

export function WeatherCard() {
  const { location, setLocation } = useOS();
  const [weather, setWeather] = useState<WeatherData | null>(() => getCachedWeather());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!location) {
        if (mounted) {
          setWeather(null);
          setError("Set your city in Settings → Location to see weather");
        }
        return;
      }
      setLoading(true);
      setError(null);
      const data = await refreshWeather();
      if (mounted) {
        if (data) {
          setWeather(data);
          setError(null);
        } else {
          setWeather(null);
          setError("Could not fetch weather. Check your connection.");
        }
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [location]);

  const handleSetCity = async () => {
    const city = prompt("Enter your city:", location?.city ?? "");
    if (!city) return;
    setLoading(true);
    setError(null);
    const { geocodeCity, saveLocation } = await import("../../lib/weather");
    const loc = await geocodeCity(city);
    if (loc) {
      saveLocation(loc);
      setLocation(loc);
    } else {
      setError("City not found. Try a different name.");
    }
    setLoading(false);
  };

  if (!weather) {
    return (
      <section className="weather-card glass">
        <div className="weather-header">
          <span className="weather-title">Weather</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={handleSetCity} disabled={loading} title="Set city">
            <Icon name="search" size={14} />
          </button>
        </div>
        {loading && <div className="weather-loading">Loading…</div>}
        {error && !loading && <div className="weather-error">{error}</div>}
        {!loading && !error && <div className="weather-empty">No weather data</div>}
      </section>
    );
  }

  return (
    <section className="weather-card glass">
      <div className="weather-header">
        <span className="weather-title">Weather</span>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={handleSetCity} disabled={loading} title="Change city">
          <Icon name="search" size={14} />
        </button>
      </div>
      <div className="weather-main">
        <span className="weather-icon" aria-hidden>{getConditionIcon(weather.conditionCode)}</span>
        <div className="weather-temp">
          <span className="weather-current">{weather.temperature}°</span>
          <span className="weather-condition">{weather.condition}</span>
        </div>
      </div>
      <div className="weather-details">
        <span className="weather-location">{weather.city}</span>
        <div className="weather-hi-lo">
          <span className="weather-hi">H:{weather.high}°</span>
          <span className="weather-lo">L:{weather.low}°</span>
        </div>
      </div>
      {error && <div className="weather-error">{error}</div>}
    </section>
  );
}