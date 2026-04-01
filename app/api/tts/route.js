import axios from 'axios';
import { getApiKey, rotateApiKey } from '../gemini-client';

export async function POST(request) {
  const body = await request.json();
  const { text, voice, languageCode } = body;

  if (!text) {
    return Response.json({ error: 'text wajib diisi' }, { status: 400 });
  }

  let retryCount = 0;
  const maxRetry = 3;

  while (retryCount < maxRetry) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${getApiKey()}`,
        {
          contents: [{ parts: [{ text: text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice || 'Kore'
                }
              }
            }
          }
        }
      );

      // Ambil audio dari response Gemini
      const audioData = response.data.candidates[0].content.parts[0].inlineData.data;
      return Response.json({ audioContent: audioData });

    } catch (error) {
      const status = error.response?.status;

      if (status === 429) {
        console.warn(`Key index ${retryCount} quota habis, ganti key...`);
        rotateApiKey();
        retryCount++;
      } else {
        console.error(error.response?.data || error.message);
        return Response.json({ error: 'Gagal TTS' }, { status: 500 });
      }
    }
  }

  return Response.json({ error: 'Semua API key sudah habis quota' }, { status: 429 });
}