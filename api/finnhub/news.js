import { translateFundNews } from '../_lib/gemini.js';

const FINNHUB_CACHE_TTL_MS = 10 * 60_000;
const newsCache = new Map();

async function fetchFundNews(symbol) {
  const cached = newsCache.get(symbol);
  if (cached && Date.now() - cached.cachedAt < FINNHUB_CACHE_TTL_MS) {
    return cached.result;
  }

  const finnhubApiKey = process.env.FINNHUB_API_KEY?.trim();
  if (!finnhubApiKey) {
    const error = new Error('ยังไม่ได้ตั้งค่า FINNHUB_API_KEY ใน Vercel Environment Variables');
    error.statusCode = 503;
    throw error;
  }

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    symbol,
    from: startDate.toISOString().slice(0, 10),
    to: endDate.toISOString().slice(0, 10),
    token: finnhubApiKey
  });
  const upstream = await fetch(`https://finnhub.io/api/v1/company-news?${params}`, {
    signal: AbortSignal.timeout(10_000)
  });
  if (!upstream.ok) {
    const error = new Error(upstream.status === 429
      ? 'Finnhub จำกัดจำนวนคำขอข่าวชั่วคราว กรุณาลองใหม่ภายหลัง'
      : `Finnhub ตอบกลับด้วยสถานะ HTTP ${upstream.status}`);
    error.statusCode = upstream.status === 429 ? 429 : 502;
    throw error;
  }

  const newsData = await upstream.json();
  if (!Array.isArray(newsData)) {
    throw new Error('Finnhub ส่งข้อมูลข่าวในรูปแบบที่ไม่ถูกต้อง');
  }
  const news = newsData.slice(0, 3).map(item => ({
    headline: typeof item.headline === 'string' ? item.headline.slice(0, 500) : '',
    source: typeof item.source === 'string' ? item.source.slice(0, 120) : '',
    summary: typeof item.summary === 'string' ? item.summary.slice(0, 1500) : '',
    url: typeof item.url === 'string' && item.url.startsWith('https://') ? item.url : '',
    datetime: Number.isFinite(item.datetime) ? item.datetime : null
  })).filter(item => item.headline);

  const result = { news, translationError: null };
  if (news.length) {
    try {
      result.news = await translateFundNews(news);
    } catch (error) {
      console.error(`Vercel Finnhub news translation failed for ${symbol}:`, error.message);
      result.translationError = error.statusCode === 503
        ? error.message
        : 'แปลข่าวเป็นภาษาไทยไม่สำเร็จ จึงแสดงต้นฉบับภาษาอังกฤษ';
    }
  }

  newsCache.set(symbol, { cachedAt: Date.now(), result });
  return result;
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const symbol = typeof request.query?.symbol === 'string'
    ? request.query.symbol.trim().toUpperCase()
    : '';
  if (!/^[A-Z0-9.-]{1,20}$/.test(symbol)) {
    response.status(400).json({ error: 'รหัสกองทุนไม่ถูกต้องสำหรับค้นหาข่าว' });
    return;
  }

  try {
    response.status(200).json({ symbol, ...await fetchFundNews(symbol) });
  } catch (error) {
    if (error.statusCode) {
      response.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error(`Vercel Finnhub news request failed for ${symbol}:`, error.message);
    response.status(502).json({ error: 'ดึงข่าวจาก Finnhub ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' });
  }
}
