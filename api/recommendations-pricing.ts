import type { VercelRequest, VercelResponse } from '@vercel/node';

async function getLivePrice(productQuery: string) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return { price: 'Check Price', vendor: 'Online Retailer', url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(productQuery)}` };

  try {
    const res = await fetch(`https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(productQuery)}&api_key=${apiKey}`);
    const data = await res.json();
    const topResult = data.shopping_results?.[0];

    return {
      price: topResult?.price || 'Check Price',
      vendor: topResult?.source || 'Retail Store',
      url: topResult?.link || `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(productQuery)}`
    };
  } catch {
    return { price: 'Check Price', vendor: 'Retail Store', url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(productQuery)}` };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { soilTempF = 55, airTempF = 70, zone = 'Cool Season', locationName = 'Your Area' } = req.body;
    const recommendations = [];

    // 1. Determine Product Query based on 7-Day Predicted Conditions
    let targetProduct = 'Scotts Turf Builder Crabgrass Preventer';
    let category = 'Pre-Emergent Weed Control';
    let reasoning = `Predicted 7-day soil temp is ${soilTempF}°F. Apply before 55°F to stop crabgrass seeds.`;
    let tip = 'Water in with 0.5 inches of rain or sprinkler immediately after spreading.';

    if (soilTempF >= 55) {
      targetProduct = 'Spectracide Weed Stop for Lawns';
      category = 'Post-Emergent Weed Control';
      reasoning = `Predicted soil temp is ${soilTempF}°F. Broadleaf weeds will emerge; spot treat actively.`;
      tip = 'Apply directly to weeds on warm, calm mornings.';
    }

    // 2. Fetch Live Price & Store Link
    const liveData = await getLivePrice(targetProduct);

    recommendations.push({
      id: 'rec_predictive_1',
      name: targetProduct,
      category,
      price: liveData.price,
      vendor: liveData.vendor,
      reasoning,
      applicationTip: tip,
      url: liveData.url
    });

    return res.status(200).json({
      summary: `7-Day Predictive Analysis for ${locationName}: Target Soil ${soilTempF}°F | Air ${airTempF}°F`,
      recommendations,
      source: 'Live SerpAPI + Agronomy Engine'
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
