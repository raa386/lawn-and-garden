import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { soilTempF, airTempF, zone } = req.body;

    // Default lawn care product recommendations based on conditions
    const recommendations = [
      {
        id: '1',
        name: 'Pre-Emergent Lawn Fertilizer & Weed Control',
        category: 'Fertilizer',
        price: '$24.99',
        vendor: 'Lawn Care Supply',
        reasoning: `Recommended for current soil temperature around ${soilTempF || 55}°F to prevent summer weeds.`,
        url: 'https://www.google.com/search?q=pre+emergent+herbicide+lawn'
      },
      {
        id: '2',
        name: 'Organic Turf Builder & Soil Conditioner',
        category: 'Soil Care',
        price: '$19.95',
        vendor: 'Garden Center',
        reasoning: `Formulated for hardiness zone ${zone || 'Cool Season'} to promote deep root growth.`,
        url: 'https://www.google.com/search?q=organic+turf+builder'
      }
    ];

    return res.status(200).json({
      recommendations,
      predictions: [],
      summary: `Based on your soil temp of ${soilTempF || 55}°F and air temp of ${airTempF || 70}°F, here are your optimal seasonal products.`,
      searchGrounded: false,
      source: 'Vercel Serverless'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
