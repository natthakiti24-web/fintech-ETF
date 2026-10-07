const YAHOO_FINANCE_BASE_URL = 'https://query2.finance.yahoo.com';
const ALLOWED_QUERY_PARAMS = new Set(['interval', 'range']);

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const pathname = new URL(request.url, 'http://localhost').pathname;
  const match = pathname.match(/^\/api\/yahoo\/v8\/finance\/chart\/([^/]+)$/);
  if (!match) {
    response.status(404).json({ error: 'Yahoo Finance route not found' });
    return;
  }

  let symbol;
  try {
    symbol = decodeURIComponent(match[1]);
  } catch {
    response.status(400).json({ error: 'Invalid Yahoo Finance ticker' });
    return;
  }
  if (!/^[A-Za-z0-9.^=_-]{1,32}$/.test(symbol)) {
    response.status(400).json({ error: 'Invalid Yahoo Finance ticker' });
    return;
  }

  const requestUrl = new URL(`${YAHOO_FINANCE_BASE_URL}/v8/finance/chart/${encodeURIComponent(symbol)}`);
  const searchParams = new URL(request.url, 'http://localhost').searchParams;
  for (const [key, value] of searchParams) {
    if (!ALLOWED_QUERY_PARAMS.has(key)) continue;
    if (key === 'interval' && !/^\d+(?:m|h|d|wk|mo)$/.test(value)) continue;
    if (key === 'range' && !/^(?:\d+(?:d|mo|y)|ytd|max)$/.test(value)) continue;
    requestUrl.searchParams.set(key, value);
  }

  try {
    const upstream = await fetch(requestUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      signal: AbortSignal.timeout(10_000)
    });
    const body = await upstream.text();
    response.status(upstream.status);
    response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    response.send(body);
  } catch (error) {
    console.error('Yahoo Finance request failed:', error.message);
    response.status(502).json({ error: 'Yahoo Finance data is temporarily unavailable' });
  }
}
