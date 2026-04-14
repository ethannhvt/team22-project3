import React, { useState, useEffect } from 'react';
import './WeatherWidget.css';

function getWeatherIcon(code) {
  if (code === 0) return '☀️'; // Clear
  if (code === 1 || code === 2 || code === 3) return '⛅'; // Partly cloudy
  if (code >= 45 && code <= 48) return '🌫️'; // Fog
  if (code >= 51 && code <= 67) return '🌧️'; // Rain / Drizzle
  if (code >= 71 && code <= 77) return '❄️'; // Snow
  if (code >= 80 && code <= 82) return '🌧️'; // Showers
  if (code >= 95) return '⛈️'; // Thunderstorm
  return '☁️';
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // College Station Coordinates
    const lat = 30.6280;
    const lon = -96.3344;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.current_weather) {
          setWeather(data.current_weather);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load weather:', err);
        setLoading(false);
      });
  }, []);

  if (loading || !weather) return null;

  return (
    <div className="weather-widget">
      <span className="weather-widget__icon">{getWeatherIcon(weather.weathercode)}</span>
      <div className="weather-widget__details">
        <span className="weather-widget__temp">{Math.round(weather.temperature)}°F</span>
        <span className="weather-widget__location">College Station</span>
      </div>
    </div>
  );
}
