/**
 * Request a fund-specific Gemini answer from the backend.
 * @param {string} query
 * @param {object} fund
 * @returns {Promise<{ answer: string, citations: Array<{ title: string, snippet: string }> }>}
 */
export async function askGeminiAboutFund(query, fund) {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, fund })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || 'เรียก Gemini ไม่สำเร็จ กรุณาลองอีกครั้ง');
  }
  if (typeof result.answer !== 'string' || !result.answer.trim()) {
    throw new Error('ได้รับคำตอบจาก Gemini ในรูปแบบที่ไม่ถูกต้อง');
  }
  return result;
}
