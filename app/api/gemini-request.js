import axios from 'axios';
import { Redis } from '@upstash/redis';
import { getAllKeys } from './gemini-client';

// ── Redis client (Upstash) ────────────────────────────────────────────────
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const COOLDOWN_MINUTE_MS = 60_000;       // 60 detik — limit per menit
const COOLDOWN_DAILY_MS  = 24 * 3600_000; // 24 jam  — limit per hari

// ── Redis key helpers ─────────────────────────────────────────────────────
const redisKey   = (i) => `gemini:cooldown:${i}`;
const rrKey      = 'gemini:rr_index';

// ── Cek apakah error adalah daily limit ───────────────────────────────────
function isDailyLimit(error) {
  const data    = error.response?.data || {};
  const message = (data.error?.message || '').toLowerCase();
  const status  = (data.error?.status  || '').toLowerCase();

  // Per-minute selalu ada kata ini — BUKAN daily
  if (message.includes('per_minute') || 
      message.includes('per minute') ||
      message.includes('rate_limit_exceeded') ||
      message.includes('requests per minute')) {
    return false;
  }

  // Daily limit punya ciri khas ini
  return (
    message.includes('quota exceeded') ||
    message.includes('daily limit')    ||
    message.includes('exceeded your current quota') ||
    (status === 'resource_exhausted' && message.includes('daily'))
  );
}

// ── Main request function ─────────────────────────────────────────────────
export async function geminiRequest(url, body) {
  const keys = getAllKeys();
  if (keys.length === 0) {
    console.error('[gemini-request] Tidak ada key tersedia.');
    return { success: false, allCooldown: false };
  }

  const total = keys.length;

  // Ambil round-robin index dari Redis (persist antar serverless invocation)
  let startIndex = 0;
  try {
    const saved = await redis.get(rrKey);
    startIndex = saved ? Number(saved) % total : 0;
  } catch {
    startIndex = Math.floor(Math.random() * total);
  }

  const now = Date.now();

  // Cek cooldown semua key dari Redis sekaligus
  const cooldownKeys = Array.from({ length: total }, (_, i) => redisKey(i));
  let cooldownValues = [];
  try {
    cooldownValues = await redis.mget(...cooldownKeys);
  } catch {
    cooldownValues = Array(total).fill(null);
  }

  // Kumpulkan key yang tidak sedang cooldown, urut dari startIndex
  const availableIndices = [];
  for (let i = 0; i < total; i++) {
    const index = (startIndex + i) % total;
    const cooldownUntil = cooldownValues[index] ? Number(cooldownValues[index]) : 0;
    if (now >= cooldownUntil) {
      availableIndices.push(index);
    }
  }

  if (availableIndices.length === 0) {
    console.error('[gemini-request] ❌ Semua key sedang cooldown.');
    await logKeyStatus(keys, cooldownValues);
    return { success: false, allCooldown: true };
  }

  // Coba satu per satu key yang available
  for (const index of availableIndices) {
    const key = keys[index];

    try {
      const response = await axios.post(`${url}?key=${key}`, body);

      // Simpan round-robin index berikutnya ke Redis
      const nextIndex = (index + 1) % total;
      await redis.set(rrKey, nextIndex).catch(() => {});

      console.log(`[gemini-request] ✅ Berhasil dengan key index ${index}`);
      return { success: true, data: response.data };

    } catch (error) {
      const status = error.response?.status;

      if (status === 429 || status === 403) {
        // Bedakan daily limit vs per-minute limit
        const daily       = isDailyLimit(error);
        const cooldownMs  = daily ? COOLDOWN_DAILY_MS : COOLDOWN_MINUTE_MS;
        const cooldownUntil = Date.now() + cooldownMs;

        // Simpan cooldown ke Redis dengan TTL otomatis
        const ttlSeconds = Math.ceil(cooldownMs / 1000);
        await redis.set(redisKey(index), cooldownUntil, { ex: ttlSeconds }).catch(() => {});

        console.warn(
          `[gemini-request] ⚠️ Key[${index}] kena ${status} ` +
          `(${daily ? '🔴 DAILY LIMIT' : '🟡 per-minute'}), ` +
          `cooldown ${daily ? '24 jam' : '60 detik'}`
        );
        continue;
      }

      // Error lain (network, bad request) — stop langsung
      console.error('[gemini-request] ❌ Error non-quota:', error.response?.data || error.message);
      return { success: false, allCooldown: false };
    }
  }

  console.error('[gemini-request] ❌ Semua key dicoba, semua gagal.');
  return { success: false, allCooldown: true };
}

// ── Debug helper ──────────────────────────────────────────────────────────
async function logKeyStatus(keys, cooldownValues) {
  const now = Date.now();
  const lines = keys.map((_, i) => {
    const cooldownUntil = cooldownValues[i] ? Number(cooldownValues[i]) : 0;
    if (now >= cooldownUntil) return `  Key[${i}]: ✅ ready`;
    const sisa = Math.ceil((cooldownUntil - now) / 1000);
    const jam  = sisa > 3600 ? ` (~${Math.ceil(sisa / 3600)} jam)` : '';
    return `  Key[${i}]: ⏳ cooldown ${sisa}s lagi${jam}`;
  });
  console.log('[gemini-request] Status keys:\n' + lines.join('\n'));
}

// ── Expose status untuk monitoring endpoint ───────────────────────────────
export async function getKeyStatus() {
  const keys = getAllKeys();
  const total = keys.length;
  if (total === 0) return [];

  const cooldownKeys = Array.from({ length: total }, (_, i) => redisKey(i));
  let cooldownValues = [];
  try {
    cooldownValues = await redis.mget(...cooldownKeys);
  } catch {
    cooldownValues = Array(total).fill(null);
  }

  const now = Date.now();
  return keys.map((_, i) => {
    const cooldownUntil = cooldownValues[i] ? Number(cooldownValues[i]) : 0;
    const secsLeft = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
    return {
      index: i,
      ready: now >= cooldownUntil,
      cooldownSecondsLeft: secsLeft,
      isDaily: secsLeft > 120, // lebih dari 2 menit = kemungkinan daily limit
    };
  });
}