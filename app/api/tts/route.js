import { geminiRequest } from '../gemini-request';

export async function POST(request) {
  const { text, voice } = await request.json();

  if (!text) {
    return Response.json({ error: 'text wajib diisi' }, { status: 400 });
  }

  const { success, data } = await geminiRequest(
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

  if (!success) {
    return Response.json({ error: 'Semua API key sudah habis quota' }, { status: 429 });
  }

  return Response.json({ audioContent: data.candidates[0].content.parts[0].inlineData.data });
}