import { geminiRequest } from '../gemini-request';

export async function POST(request) {
  const { prompt } = await request.json();

  if (!prompt) {
    return Response.json({ error: 'prompt wajib diisi' }, { status: 400 });
  }

  const { success, data } = await geminiRequest(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    { contents: [{ parts: [{ text: prompt }] }] }
  );

  if (!success) {
    return Response.json({ error: 'Semua API key sudah habis quota' }, { status: 429 });
  }

  return Response.json({ result: data.candidates[0].content.parts[0].text });
}