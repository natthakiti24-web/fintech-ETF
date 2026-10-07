import { generateFundAnswer } from './_lib/gemini.js';

export const config = {
  api: {
    bodyParser: { sizeLimit: '32kb' }
  }
};

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { query, fund } = request.body || {};
  if (typeof query !== 'string' || !query.trim() || query.length > 4000) {
    response.status(400).json({ error: 'คำถามต้องมีข้อความและยาวไม่เกิน 4,000 ตัวอักษร' });
    return;
  }
  if (!fund || typeof fund !== 'object' || Array.isArray(fund)
    || typeof fund.code !== 'string' || typeof fund.name !== 'string') {
    response.status(400).json({ error: 'ข้อมูลกองทุนไม่ถูกต้อง' });
    return;
  }

  try {
    response.status(200).json(await generateFundAnswer(query, fund));
  } catch (error) {
    if (error.statusCode) {
      response.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Vercel Gemini request failed:', error.message);
    response.status(502).json({ error: 'Gemini ตอบคำขอไม่สำเร็จ กรุณาลองอีกครั้ง' });
  }
}
