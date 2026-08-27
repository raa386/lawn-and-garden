import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify Vercel Cron Secret
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Fetch 7-Day Forecast from Open-Meteo API (Latitude/Longitude set to your location)
    const lat = 40.7128; // Update to your latitude
    const lon = -74.0060; // Update to your longitude
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,soil_temperature_0to10cm_max&temperature_unit=fahrenheit&forecast_days=8&timezone=auto`);
    const weatherData = await weatherRes.json();

    // 2. Extract Conditions for Day +7
    const day7SoilTemp = weatherData.daily.soil_temperature_0to10cm_max[7];
    const day7AirTemp = weatherData.daily.temperature_2m_max[7];

    // 3. Evaluate 7-Day Trigger Condition (e.g., Soil reaching 50°F-55°F pre-emergent window)
    if (day7SoilTemp >= 50 && day7SoilTemp <= 55) {
      
      // Fetch Live Lowest Price via SerpAPI
      const serpRes = await fetch(`https://serpapi.com/search.json?engine=google_shopping&q=Scotts+Turf+Builder+Crabgrass+Preventer&api_key=${process.env.SERPAPI_KEY}`);
      const serpData = await serpRes.json();
      const topDeal = serpData.shopping_results?.[0];
      
      const price = topDeal?.price || '$24.99';
      const vendor = topDeal?.source || 'Home Depot';

      // 4. Send FCM Push Notification to Registered Devices
      const message = {
        notification: {
          title: '🌱 7-Day Lawn Alert: Time to Buy!',
          body: `Soil temp hits ${day7SoilTemp}°F in 7 days. Buy Pre-Emergent now (${price} at ${vendor}) to apply on time!`,
        },
        topic: 'lawn-alerts' // Sends to all subscribed devices
      };

      await admin.messaging().send(message);
      return res.status(200).json({ success: true, alerted: true, targetSoilTemp: day7SoilTemp });
    }

    return res.status(200).json({ success: true, alerted: false, targetSoilTemp: day7SoilTemp });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
