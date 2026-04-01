export async function GET() {
  return Response.json({
    key1: process.env.GEMINI_API_KEY_1 ? 'ada' : 'tidak ada',
    key2: process.env.GEMINI_API_KEY_2 ? 'ada' : 'tidak ada',
    key3: process.env.GEMINI_API_KEY_3 ? 'ada' : 'tidak ada',
    key4: process.env.GEMINI_API_KEY_4 ? 'ada' : 'tidak ada',
    key5: process.env.GEMINI_API_KEY_5 ? 'ada' : 'tidak ada',
    key6: process.env.GEMINI_API_KEY_6 ? 'ada' : 'tidak ada',
    key7: process.env.GEMINI_API_KEY_7 ? 'ada' : 'tidak ada',
    key8: process.env.GEMINI_API_KEY_8 ? 'ada' : 'tidak ada',
    key9: process.env.GEMINI_API_KEY_9 ? 'ada' : 'tidak ada',
    key10: process.env.GEMINI_API_KEY_10 ? 'ada' : 'tidak ada',
    key11: process.env.GEMINI_API_KEY_11 ? 'ada' : 'tidak ada',
    key12: process.env.GEMINI_API_KEY_12 ? 'ada' : 'tidak ada',
    key13: process.env.GEMINI_API_KEY_13 ? 'ada' : 'tidak ada',
    key14: process.env.GEMINI_API_KEY_14 ? 'ada' : 'tidak ada',
    key15: process.env.GEMINI_API_KEY_15 ? 'ada' : 'tidak ada',
    key16: process.env.GEMINI_API_KEY_16 ? 'ada' : 'tidak ada',
    key17: process.env.GEMINI_API_KEY_17 ? 'ada' : 'tidak ada',
    key18: process.env.GEMINI_API_KEY_18 ? 'ada' : 'tidak ada',
    key19: process.env.GEMINI_API_KEY_19 ? 'ada' : 'tidak ada',
    key20: process.env.GEMINI_API_KEY_20 ? 'ada' : 'tidak ada',
    total_aktif: [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
      process.env.GEMINI_API_KEY_5,
      process.env.GEMINI_API_KEY_6,
      process.env.GEMINI_API_KEY_7,
      process.env.GEMINI_API_KEY_8,
      process.env.GEMINI_API_KEY_9,
      process.env.GEMINI_API_KEY_10,
      process.env.GEMINI_API_KEY_11,
      process.env.GEMINI_API_KEY_12,
      process.env.GEMINI_API_KEY_13,
      process.env.GEMINI_API_KEY_14,
      process.env.GEMINI_API_KEY_15,
      process.env.GEMINI_API_KEY_16,
      process.env.GEMINI_API_KEY_17,
      process.env.GEMINI_API_KEY_18,
      process.env.GEMINI_API_KEY_19,
      process.env.GEMINI_API_KEY_20,
    ].filter(Boolean).length
  });
}

export function getAllKeys() {
  return API_KEYS;
}