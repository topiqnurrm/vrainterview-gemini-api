import axios from 'axios';
import { getAllKeys } from './gemini-client';

// Simpan index key yang terakhir berhasil (persisten selama server hidup)
let lastWorkingIndex = 0;

export async function geminiRequest(url, body) {
  const keys = getAllKeys();
  if (keys.length === 0) return { success: false };

  const total = keys.length;

  // Mulai dari key terakhir yang berhasil
  for (let i = 0; i < total; i++) {
    const index = (lastWorkingIndex + i) % total;
    const key = keys[index];

    try {
      const response = await axios.post(`${url}?key=${key}`, body);
      
      // Simpan index yang berhasil untuk request berikutnya
      lastWorkingIndex = index;
      console.log(`[gemini-request] Berhasil dengan key index ${index}`);
      
      return { success: true, data: response.data };

    } catch (error) {
      const status = error.response?.status;
      if (status === 429 || status === 403) {
        console.warn(`[gemini-request] Key index ${index} gagal (${status}), coba berikutnya...`);
        continue;
      }
      // Error lain (bukan quota) — langsung stop
      console.error('[gemini-request] Error non-quota:', error.response?.data || error.message);
      return { success: false };
    }
  }

  // Semua key sudah dicoba, semua gagal
  console.error('[gemini-request] Semua key habis quota.');
  return { success: false };
}