import { useState } from "react";
import "./App.css";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState("C");
  const [favorites, setFavorites] = useState(["Chennai", "London", "Tokyo", "Dubai"]);

  const weatherInfo = (code) => {
    if (code === 0) return { text: "Clear sky", icon: "☀️" };
    if ([1, 2].includes(code)) return { text: "Partly cloudy", icon: "🌤️" };
    if (code === 3) return { text: "Cloudy", icon: "☁️" };
    if ([45, 48].includes(code)) return { text: "Fog", icon: "🌫️" };
    if ([51, 53, 55, 56, 57].includes(code)) return { text: "Drizzle", icon: "🌦️" };
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { text: "Rain", icon: "🌧️" };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { text: "Snow", icon: "❄️" };
    if ([95, 96, 99].includes(code)) return { text: "Thunderstorm", icon: "⛈️" };
    return { text: "Unknown", icon: "🌈" };
  };

  const convert = (value) => unit === "C" ? value : (value * 9) / 5 + 32;

  const formatTemp = (value) => `${Math.round(convert(value))}°${unit}`;

  async function searchWeather(searchCity) {
    if (!searchCity.trim()) {
      setError("Enter a city name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchCity)}&count=1&language=en&format=json`
      );

      const geoData = await geoResponse.json();

      if (!geoData.results?.length) {
        throw new Error("City not found.");
      }

      const place = geoData.results[0];

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl,cloud_cover&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=5`
      );

      const data = await response.json();

      setWeather({
        name: place.name,
        country: place.country || "",
        temperature: data.current.temperature_2m,
        feels: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        wind: data.current.wind_speed_10m,
        pressure: data.current.pressure_msl,
        clouds: data.current.cloud_cover,
        code: data.current.weather_code,
        sunrise: data.daily.sunrise[0],
        sunset: data.daily.sunset[0],
      });

      setForecast(
        data.daily.time.map((day, index) => ({
          date: day,
          code: data.daily.weather_code[index],
          high: data.daily.temperature_2m_max[index],
          low: data.daily.temperature_2m_min[index],
          sunrise: data.daily.sunrise[index],
          sunset: data.daily.sunset[index],
        }))
      );

      setCity(place.name);

      setFavorites((old) =>
        old.includes(place.name) ? old : [place.name, ...old].slice(0, 6)
      );
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function dayName(date, index) {
    if (index === 0) return "Today";
    return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
    });
  }

  const currentInfo = weather ? weatherInfo(weather.code) : null;

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="logo">☁</span>
          <div>
            <h2>SkyCast</h2>
            <p>Weather intelligence</p>
          </div>
        </div>

        <div className="header-right">
          <span className="live"><span className="dot"></span> LIVE WEATHER</span>
          <button className="unit-toggle" onClick={() => setUnit(unit === "C" ? "F" : "C")}>
            °{unit === "C" ? "C" : "F"} / °{unit === "C" ? "F" : "C"}
          </button>
        </div>
      </header>

      <main className="container">
        <section className="intro">
          <p className="overline">WEATHER DASHBOARD</p>
          <h1>Know your <span>sky.</span></h1>
          <p className="intro-text">
            Real-time weather conditions and forecasts around the world.
          </p>
        </section>

        <section className="search-area">
          <div className="search">
            <span>⌕</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchWeather(city)}
              placeholder="Search city or location..."
            />
            <button onClick={() => searchWeather(city)}>Search</button>
          </div>

          <div className="favorites">
            <span className="favorite-label">QUICK SEARCH</span>
            {favorites.map((name) => (
              <button key={name} onClick={() => searchWeather(name)}>
                {name}
              </button>
            ))}
          </div>
        </section>

        {loading && <div className="message">Loading weather...</div>}
        {error && <div className="error">{error}</div>}

        {weather && (
          <>
            <section className="hero-card">
              <div className="hero-left">
                <p className="location">📍 {weather.name}, {weather.country}</p>
                <h2>{formatTemp(weather.temperature)}</h2>
                <p className="condition">{currentInfo.text}</p>
                <p className="feels">Feels like {formatTemp(weather.feels)}</p>
              </div>

              <div className="hero-right">
                <span className="hero-icon">{currentInfo.icon}</span>
                <div className="high-low">
                  <span>↑ {formatTemp(forecast[0]?.high ?? weather.temperature)}</span>
                  <span>↓ {formatTemp(forecast[0]?.low ?? weather.temperature)}</span>
                </div>
              </div>
            </section>

            <section className="section">
              <div className="section-heading">
                <div>
                  <p className="overline">FORECAST</p>
                  <h2>5-Day Outlook</h2>
                </div>
              </div>

              <div className="forecast-grid">
                {forecast.map((day, index) => {
                  const info = weatherInfo(day.code);
                  return (
                    <div className="forecast-card" key={day.date}>
                      <p className="day">{dayName(day.date, index)}</p>
                      <span className="forecast-icon">{info.icon}</span>
                      <p className="forecast-condition">{info.text}</p>
                      <h3>{formatTemp(day.high)}</h3>
                      <p className="low">{formatTemp(day.low)}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="section">
              <div className="section-heading">
                <div>
                  <p className="overline">ATMOSPHERE</p>
                  <h2>Weather Details</h2>
                </div>
              </div>

              <div className="details-grid">
                <div className="detail-card">
                  <span>💧</span>
                  <p>Humidity</p>
                  <h3>{weather.humidity}%</h3>
                </div>

                <div className="detail-card">
                  <span>💨</span>
                  <p>Wind speed</p>
                  <h3>{weather.wind} km/h</h3>
                </div>

                <div className="detail-card">
                  <span>🌡️</span>
                  <p>Pressure</p>
                  <h3>{weather.pressure} hPa</h3>
                </div>

                <div className="detail-card">
                  <span>☁️</span>
                  <p>Cloud cover</p>
                  <h3>{weather.clouds}%</h3>
                </div>

                <div className="detail-card">
                  <span>🌅</span>
                  <p>Sunrise</p>
                  <h3>
                    {new Date(weather.sunrise).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </h3>
                </div>

                <div className="detail-card">
                  <span>🌇</span>
                  <p>Sunset</p>
                  <h3>
                    {new Date(weather.sunset).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </h3>
                </div>
              </div>
            </section>
          </>
        )}

        {!weather && !loading && (
          <section className="empty">
            <span>🌍</span>
            <h2>Explore the world</h2>
            <p>Search a city to discover its weather and forecast.</p>
          </section>
        )}
      </main>

      <footer>
        <div className="footer-brand">☁ SkyCast</div>
        <p>Weather data powered by Open-Meteo</p>
        <p>© 2026 SkyCast Weather Dashboard</p>
      </footer>
    </div>
  );
}

export default App;