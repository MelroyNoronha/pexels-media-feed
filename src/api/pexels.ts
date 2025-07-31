import { CollectionResponse, MediaItem, MediaType, VideoFile } from '../types/pexels';

const API_KEY = 'M9Moel9GsArJamlr5r9jreQwZm4Z8EZRyIRAN29lEs1UszjOfZrklVAy';
const COLLECTION_ID = 'vog4mjt';
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
    console.log(JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error fetching media:', error);
    throw error;
  }
};
