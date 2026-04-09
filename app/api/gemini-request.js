import axios from 'axios';
import { getAllKeys } from './gemini-client';

// ── Per-key cooldown tracking ─────────────────────────────────────────────
const keyCooldownUntil = {}; // { keyIndex: timestampMs }
const COOLDOWN_MS = 60_000;  // 60 detik cooldown setelah kena 429

// ── Round-robin index ─────────────────────────────────────────────────────
let roundRobinIndex = 0;

// ── Main request function ─────────────────────────────────────────────────
export async function geminiRequest(url, body) {
  const keys = getAllKeys();
  if (keys.length === 0) {
    console.error('[gemini-request] Tidak ada key tersedia.');
    return { success: false, allCooldown: false };
  }

  const total = keys.length;
  const now = Date.now();

  // Kumpulkan semua key yang TIDAK sedang cooldown, urut dari roundRobinIndex
  const availableIndices = [];
  for (let i = 0; i < total; i++) {
    const index = (roundRobinIndex + i) % total;
    const cooldownUntil = keyCooldownUntil[index] ?? 0;
    if (now >= cooldownUntil) availableIndices.push(index);
  }

  // Semua key sedang cooldown
  if (availableIndices.length === 0) {
    logKeyStatus(keys);
    console.error('[gemini-request] ❌ Semua key sedang cooldown.');
    return { success: false, allCooldown: true };
  }

  // Coba satu per satu key yang available (tidak ada retry ke key yang sama)
  for (const index of availableIndices) {
    const key = keys[index];

    try {
      const response = await axios.post(`${url}?key=${key}`, body);

      // Geser round-robin agar request berikutnya mulai dari key setelah ini
      roundRobinIndex = (index + 1) % total;
      console.log(`[gemini-request] ✅ Berhasil dengan key index ${index}`);
      return { success: true, data: response.data };

    } catch (error) {
      const status = error.response?.status;

      if (status === 429 || status === 403) {
        // Tandai cooldown, lanjut ke key berikutnya
        keyCooldownUntil[index] = Date.now() + COOLDOWN_MS;
        console.warn(
          `[gemini-request] ⚠️ Key[${index}] kena ${status}, ` +
          `cooldown hingga ${new Date(keyCooldownUntil[index]).toLocaleTimeString()}`
        );
        logKeyStatus(keys);
        continue;
      }

      // Error non-quota (network error, bad request, dll) — stop langsung
      console.error('[gemini-request] ❌ Error non-quota:', error.response?.data || error.message);
      return { success: false, allCooldown: false };
    }
  }

  // Semua available key sudah dicoba, semua kena 429
  console.error('[gemini-request] ❌ Semua key dicoba, semua gagal.');
  return { success: false, allCooldown: true };
}

// ── Debug helper ──────────────────────────────────────────────────────────
function logKeyStatus(keys) {
  const now = Date.now();
  const lines = keys.map((_, i) => {
    const cooldownUntil = keyCooldownUntil[i] ?? 0;
    if (now >= cooldownUntil) return `  Key[${i}]: ✅ ready`;
    const sisa = Math.ceil((cooldownUntil - now) / 1000);
    return `  Key[${i}]: ⏳ cooldown ${sisa}s lagi`;
  });
  console.log('[gemini-request] Status keys:\n' + lines.join('\n'));
}

// ── Expose status (opsional, untuk monitoring endpoint) ───────────────────
export function getKeyStatus() {
  const keys = getAllKeys();
  const now = Date.now();
  return keys.map((_, i) => {
    const cooldownUntil = keyCooldownUntil[i] ?? 0;
    return {
      index: i,
      ready: now >= cooldownUntil,
      cooldownSecondsLeft: Math.max(0, Math.ceil((cooldownUntil - now) / 1000)),
    };
  });
}