import axios from 'axios';
import { getApiKey, rotateApiKey } from '../gemini-client'; 

export async function POST(request) {
  const body = await request.json();
  const { prompt } = body;

  if (!prompt) {
    return Response.json({ error: 'prompt wajib diisi' }, { status: 400 });
  }

  let retryCount = 0;
  const maxRetry = 3;

  while (retryCount < maxRetry) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${getApiKey()}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        }
      );

      const result = response.data.candidates[0].content.parts[0].text;
      return Response.json({ result });

    } catch (error) {
      const status = error.response?.status;

      if (status === 429) {
        console.warn(`Key index ${retryCount} quota habis, ganti key...`);
        rotateApiKey();
        retryCount++;
      } else {
        console.error(error.response?.data || error.message);
        return Response.json({ error: 'Gagal analisis' }, { status: 500 });
      }
    }
  }

  return Response.json({ error: 'Semua API key sudah habis quota' }, { status: 429 });
}