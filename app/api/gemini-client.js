const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean); // hapus yang kosong

let currentKeyIndex = 0;

export function getApiKey() {
  return API_KEYS[currentKeyIndex];
}

export function rotateApiKey() {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  console.log(`Ganti ke API key index: ${currentKeyIndex}`);
}

export function hasMoreKeys() {
  return API_KEYS.length > 1;
}