import { CollectionResponse } from '../types/pexels';

import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig?.extra?.PEXELS_API_KEY;
const COLLECTION_ID = Constants.expoConfig?.extra?.PEXELS_COLLECTION_ID;
const API_BASE_URL = 'https://api.pexels.com/v1/collections';

export const fetchMedia = async (page: number = 1): Promise<CollectionResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${COLLECTION_ID}?page=${page}`, {
      headers: {
        Authorization: API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: CollectionResponse = await response.json();

    return data;
  } catch (error) {
    console.error('Error fetching media:', error);
    throw error;
  }
};
