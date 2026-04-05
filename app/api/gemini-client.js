const API_KEYS = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    // process.env.GEMINI_API_KEY_3,
    // process.env.GEMINI_API_KEY_4,
    // process.env.GEMINI_API_KEY_5,
    // process.env.GEMINI_API_KEY_6,
    // process.env.GEMINI_API_KEY_7,
    // process.env.GEMINI_API_KEY_8,
    // process.env.GEMINI_API_KEY_9,
    // process.env.GEMINI_API_KEY_10,
    // process.env.GEMINI_API_KEY_11,
    // process.env.GEMINI_API_KEY_12,
    // process.env.GEMINI_API_KEY_13,
    // process.env.GEMINI_API_KEY_14,
    // process.env.GEMINI_API_KEY_15,
    // process.env.GEMINI_API_KEY_16,
    // process.env.GEMINI_API_KEY_17,
    // process.env.GEMINI_API_KEY_18,
    // process.env.GEMINI_API_KEY_19,
    // process.env.GEMINI_API_KEY_20,
].filter(Boolean);

export function getAllKeys() {
  return API_KEYS;
}