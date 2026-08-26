import { ProductRecommendation, SevenDayForecastPrediction, LawnCondition } from '../types';

export interface RecommendationResponse {
  recommendations: ProductRecommendation[];
  predictions: SevenDayForecastPrediction[];
  summary: string;
  searchGrounded: boolean;
  groundingSources?: Array<{ title: string; url: string }>;
  source: string;
  error?: string;
}

export async function fetchRecommendationsAndPrices(params: {
  locationName: string;
  latitude: number;
  longitude: number;
  soilTempF: number;
  airTempF: number;
  zone: string;
  currentDate?: string;
  currentSeason?: string;
  currentMonth?: number;
  filterCategory?: string;
  lawnCondition?: LawnCondition;
}): Promise<RecommendationResponse> {
  try {
    const response = await fetch('/api/recommendations-pricing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data: RecommendationResponse = await response.json();
    return data;
  } catch (err: any) {
    console.error('Failed to fetch recommendations and pricing from server:', err);
    throw err;
  }
}
