import { geminiRequest } from '../gemini-request';

export async function POST(request) {
  const { text, voice } = await request.json();

  if (!text) {
    return Response.json({ error: 'text wajib diisi' }, { status: 400 });
  }

  const result = await geminiRequest(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent',
    {
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' }
          }
        }
      }
    }
  );

  console.log('[tts] geminiRequest result success:', result.success);

  if (!result.success) {
    return Response.json(
      { error: result.allCooldown ? 'LIMIT_HABIS' : 'Request gagal' },
      { status: 429 }
    );
  }

  return Response.json({ audioContent: result.data.candidates[0].content.parts[0].inlineData.data });
}