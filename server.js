// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());

// =============================
// 🌦️ WEATHER ENDPOINT
// =============================
// Example: /weather?lat=7.5&lon=4.5
app.get("/weather", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon)
      return res.status(400).json({ error: "Missing lat/lon parameters" });

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,windspeed_10m&hourly=temperature_2m,precipitation,relative_humidity_2m,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (err) {
    console.error("❌ Weather API error:", err);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

// =============================
// 📍 CITY ENDPOINT
// =============================
// Supports both:
//   - Reverse: /city?lat=7.5&lon=4.5
//   - Forward: /city?name=Lagos
app.get("/city", async (req, res) => {
  try {
    const { lat, lon, name } = req.query;

    // Reverse Geocoding (lat/lon → city)
    if (lat && lon) {
      const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const place = data.results[0];
        return res.json({
          city:
            place.name ||
            place.city ||
            place.town ||
            place.village ||
            "Unknown",
          country: place.country || "",
          lat,
          lon,
        });
      }
      return res.json({ city: "Unknown", country: "", lat, lon });
    }

    // Forward Geocoding (city name → lat/lon)
    if (name) {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        name
      )}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const place = data.results[0];
        return res.json({
          city: place.name || name,
          country: place.country || "",
          lat: place.latitude,
          lon: place.longitude,
        });
      }
      return res.status(404).json({ error: "City not found" });
    }

    // Missing parameters
    res.status(400).json({ error: "Missing parameters (lat/lon or name)" });
  } catch (err) {
    console.error("❌ City API error:", err);
    res.status(500).json({ error: "Failed to fetch city data" });
  }
});

app.get("/", (req, res) => {
  res.send("Server is working ✅");
});

// =============================
// 🏁 START SERVER
// =============================
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
