import axios from 'axios';

const KEY_NAMES = Array.from({ length: 20 }, (_, i) => `GEMINI_API_KEY_${i + 1}`);

async function testKey(key, type) {
  const models = {
    analisis: 'gemini-2.5-flash',
    tts: 'gemini-2.5-flash-preview-tts'
  };

  const model = models[type];

  try {
    await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${key}`,
      { timeout: 10000 }
    );
    return { status: 'ok' };
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.error?.message || error.message;
    if (status === 429) return { status: 'quota_habis', message };
    if (status === 403) return { status: 'forbidden', message };
    if (status === 400) return { status: 'invalid_key', message };
    return { status: `error_${status || 'unknown'}`, message };
  }
}

export async function GET() {
  const results = await Promise.all(
    KEY_NAMES.map(async (name) => {
      const key = process.env[name];
      if (!key) return { name, ada: false };

      const [analisis, tts] = await Promise.all([
        testKey(key, 'analisis'),
        testKey(key, 'tts')
      ]);

      return { name, ada: true, analisis, tts };
    })
  );

  const aktif = results.filter(r => r.ada);
  const analisisOk = aktif.filter(r => r.analisis?.status === 'ok').map(r => r.name);
  const ttsOk = aktif.filter(r => r.tts?.status === 'ok').map(r => r.name);
  const keduaOk = aktif.filter(r => r.analisis?.status === 'ok' && r.tts?.status === 'ok').map(r => r.name);

  return Response.json({
    summary: {
      total_key_terdaftar: aktif.length,
      analisis_ok: analisisOk.length,
      tts_ok: ttsOk.length,
      keduanya_ok: keduaOk.length,
      analisis_keys: analisisOk,
      tts_keys: ttsOk,
      keduanya_keys: keduaOk,
    },
    detail: results.map(r => {
      if (!r.ada) return { name: r.name, ada: false };
      return {
        name: r.name,
        ada: true,
        analisis: r.analisis,
        tts: r.tts,
        catatan: r.analisis?.status === 'ok' && r.tts?.status === 'ok'
          ? '✅ semua ok'
          : r.analisis?.status === 'ok'
          ? '⚠️ analisis ok, tts tidak'
          : r.tts?.status === 'ok'
          ? '⚠️ tts ok, analisis tidak'
          : '❌ semua gagal'
      };
    })
  });
}