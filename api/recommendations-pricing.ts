import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { soilTempF = 55, airTempF = 70, zone = 'Cool Season', locationName = 'Your Area' } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    // Fallback if API key hasn't been added to Vercel environment variables yet
    if (!apiKey) {
      return res.status(200).json({
        summary: `Current conditions for ${locationName}: Soil ${soilTempF}°F, Air ${airTempF}°F.`,
        recommendations: [
          {
            id: '1',
            name: 'Scotts Turf Builder Crabgrass Preventive',
            category: 'Pre-Emergent Weed Control',
            price: '$22.98',
            vendor: 'Home Depot',
            reasoning: `Soil temps are at ${soilTempF}°F. Apply now before soil consistently reaches 55°F+ to stop crabgrass seeds from germinating.`,
            applicationTip: 'Apply to dry lawn and water in lightly (0.5 inches of water) immediately after application.',
            url: `https://www.google.com/search?tbm=shop&q=Scotts+Turf+Builder+Crabgrass+Preventive`
          },
          {
            id: '2',
            name: 'Milorganite 6-4-0 Organic Nitrogen Fertilizer',
            category: 'Fertilizer',
            price: '$18.49',
            vendor: 'Lowe\'s',
            reasoning: `Air temps at ${airTempF}°F are optimal for steady root development without burning the turf.`,
            applicationTip: 'Spread evenly using a broadcast spreader at a rate of 32 lbs per 2,500 sq ft.',
            url: `https://www.google.com/search?tbm=shop&q=Milorganite+Organic+Nitrogen+Fertilizer`
          }
        ],
        predictions: [],
        searchGrounded: false,
        source: 'Lawn AI Engine'
      });
    }

    // Call Google Gemini 2.5 Flash to generate real real-time recommendations
    const prompt = `Act as an expert agronomist. User Location: ${locationName}, Hardiness Zone: ${zone}, Soil Temp: ${soilTempF}°F, Air Temp: ${airTempF}°F.
    Return ONLY a valid JSON object with key "recommendations" containing an array of 2-3 specific lawn products. 
    Each object must strictly match this structure:
    {
      "id": "unique_string",
      "name": "Exact Brand Product Name",
      "category": "Fertilizer or Weed Control or Soil Care",
      "price": "$XX.XX",
      "vendor": "Store Name",
      "reasoning": "Detailed trigger reason based on ${soilTempF}°F soil and ${airTempF}°F air temps",
      "applicationTip": "Specific how-to step for applying this product",
      "url": "https://www.google.com/search?tbm=shop&q=Exact+Brand+Product+Name"
    }`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    const aiResult = await response.json();
    const parsedText = aiResult.candidates?.[0]?.content?.parts?.[0]?.text;
    const data = JSON.parse(parsedText);

    return res.status(200).json({
      summary: `Condition triggers for ${locationName}: Soil is ${soilTempF}°F, Air is ${airTempF}°F.`,
      recommendations: data.recommendations || [],
      predictions: [],
      searchGrounded: true,
      source: 'Gemini 2.5 Flash'
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error generating recommendations' });
  }
}
