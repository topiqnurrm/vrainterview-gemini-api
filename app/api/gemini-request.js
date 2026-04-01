import axios from 'axios';
import { getAllKeys } from './gemini-client';

export async function geminiRequest(url, body) {
  const keys = getAllKeys();

  for (const key of keys) {
    try {
      const response = await axios.post(`${url}?key=${key}`, body);
      return { success: true, data: response.data };
    } catch (error) {
      const status = error.response?.status;
      if (status === 429 || status === 403) {
        console.warn(`Key gagal (${status}), coba key berikutnya...`);
        continue;
      }
      console.error(error.response?.data || error.message);
      return { success: false };
    }
  }

  return { success: false };
}