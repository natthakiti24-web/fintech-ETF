/**
 * Fetch recent company news for a fund ticker through the backend.
 * @param {string} symbol
 * @returns {Promise<{ news: Array<{ headline: string, headlineTh?: string, source: string, summary: string, summaryTh?: string, url: string, datetime: number|null }>, translationError: string|null }>}
 */
export async function fetchFundNews(symbol) {
  const response = await fetch(`/api/finnhub/news?symbol=${encodeURIComponent(symbol)}`);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || 'ดึงข่าวจาก Finnhub ไม่สำเร็จ');
  }
  if (!Array.isArray(result.news) || (result.translationError !== null
    && typeof result.translationError !== 'string')) {
    throw new Error('ได้รับข้อมูลข่าวในรูปแบบที่ไม่ถูกต้อง');
  }
  return { news: result.news, translationError: result.translationError };
}
