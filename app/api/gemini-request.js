import axios from 'axios';
import { getAllKeys } from './gemini-client';

export async function geminiRequest(url, body) {
  const keys = getAllKeys();
  const firstBatch = keys.slice(0, 3);

  // Coba 3 key pertama secara paralel
  try {
    const result = await Promise.any(
      firstBatch.map(key =>
        axios.post(`${url}?key=${key}`, body)
          .then(res => res.data)
      )
    );
    return { success: true, data: result };

  } catch {
    // Kalau 3 pertama gagal, coba sisanya sequential
    for (const key of keys.slice(3)) {
      try {
        const response = await axios.post(`${url}?key=${key}`, body);
        return { success: true, data: response.data };
      } catch {
        continue;
      }
    }
    return { success: false };
  }
}