import { getKeyStatus } from '../gemini-request';
import { getAllKeys } from '../gemini-client';

export async function GET() {
  const keys = getAllKeys();
  const statuses = await getKeyStatus();

  const detail = {};
  keys.forEach((_, i) => {
    const s = statuses[i];
    detail[`key${i + 1}`] = s.ready
      ? '✅ ready'
      : s.isDaily
        ? `🔴 daily limit (${Math.ceil(s.cooldownSecondsLeft / 3600)} jam lagi)`
        : `🟡 cooldown (${s.cooldownSecondsLeft}s lagi)`;
  });

  const totalReady  = statuses.filter((s) => s.ready).length;
  const totalDaily  = statuses.filter((s) => !s.ready && s.isDaily).length;
  const totalMinute = statuses.filter((s) => !s.ready && !s.isDaily).length;

  return Response.json({
    ...detail,
    summary: {
      total_keys:      keys.length,
      ready:           totalReady,
      cooldown_minute: totalMinute,
      cooldown_daily:  totalDaily,
    },
  });
}