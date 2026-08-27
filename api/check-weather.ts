import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Core weather checking and FCM push execution function required by server.ts
export async function processWeatherCheckAndPush(lat = 40.7128, lon = -74.0060) {
  try {
    // Fetch 7-day forecast from Open-Meteo
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,soil_temperature_0to10cm_max&temperature_unit=fahrenheit&forecast_days=8&timezone=auto`
    );
    const weatherData = await weatherRes.json();

    // Day +7 forecasts
    const day7SoilTemp = weatherData?.daily?.soil_temperature_0to10cm_max?.[7] ?? 52;
    const day7AirTemp = weatherData?.daily?.temperature_2m_max?.[7] ?? 68;

    let alerted = false;

    // Trigger condition: soil temp entering pre-emergent window (50°F - 55°F)
    if (day7SoilTemp >= 50 && day7SoilTemp <= 55) {
      let price = '$24.99';
      let vendor = 'Home Depot';

      // Fetch live price via SerpAPI if key is available
      if (process.env.SERPAPI_KEY) {
        try {
          const serpRes = await fetch(
            `https://serpapi.com/search.json?engine=google_shopping&q=Scotts+Turf+Builder+Crabgrass+Preventer&api_key=${process.env.SERPAPI_KEY}`
          );
          const serpData = await serpRes.json();
          const topDeal = serpData.shopping_results?.[0];
          if (topDeal?.price) price = topDeal.price;
          if (topDeal?.source) vendor = topDeal.source;
        } catch (e) {
          console.error('SerpAPI error:', e);
        }
      }

      // Send Push Notification
      const message = {
        notification: {
          title: '🌱 7-Day Lawn Alert: Time to Buy!',
          body: `Soil temp hits ${day7SoilTemp}°F in 7 days. Buy Pre-Emergent now (${price} at ${vendor}) to apply on time!`,
        },
        topic: 'lawn-alerts',
      };

      await admin.messaging().send(message);
      alerted = true;
    }

    return { success: true, alerted, targetSoilTemp: day7SoilTemp, targetAirTemp: day7AirTemp };
  } catch (error: any) {
    console.error('Error in processWeatherCheckAndPush:', error);
    return { success: false, error: error.message };
  }
}

// Vercel Serverless / Cron Handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const result = await processWeatherCheckAndPush();
  return res.status(result.success ? 200 : 500).json(result);
}
