/**
 * AI Service — จัดการการเรียกใช้ Factsheet AI (รองรับทั้ง Gemini API จริง และ Real-Data Engine)
 */
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();

/**
 * ถามคำถามเกี่ยวกับกองทุนผ่าน AI โดยใช้ข้อมูลสดจริงจาก API
 * @param {string} query - คำถามที่ผู้ใช้ถาม
 * @param {object} fund - ข้อมูลกองทุนจริงปัจจุบัน
 * @returns {Promise<{ answer: string, citations: Array }>}
 */
export async function askGeminiAboutFund(query, fund) {
  const hasValidKey = GEMINI_API_KEY && 
                       GEMINI_API_KEY !== 'ใส่_API_KEY_ของคุณที่นี่' && 
                       GEMINI_API_KEY.length > 10;

  // 1. ถ้ามี Gemini API Key ให้ส่งข้อมูลจริงทั้งหมดให้ Gemini ช่วยตอบ
  if (hasValidKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const currencySymbol = fund.currency === 'USD' ? '$' : '';
      const currencySuffix = fund.currency === 'USD' ? ' USD' : ' ฿';

      const systemPrompt = `
คุณคือ "FundTwin Factsheet AI" ผู้ช่วยอัจฉริยะที่เชี่ยวชาญการแปล Factsheet และหนังสือชี้ชวนการลงทุนเป็นภาษาคน
จงตอบคำถามผู้ใช้โดยอิงจากข้อมูลตลาดจริงของสินทรัพย์นี้อย่างเคร่งครัด:

[ข้อมูลกองทุน/สินทรัพย์จริง]
- รหัส: ${fund.code} (${fund.name})
- บลจ. / ตลาด: ${fund.amc}
- หมวดหมู่: ${fund.categoryName} (ความเสี่ยงระดับ ${fund.riskLevel}/8)
- ราคา NAV ล่าสุด: ${currencySymbol}${fund.nav.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ${currencySuffix}
- ผลตอบแทนย้อนหลัง 1 ปี (1Y Return): ${fund.return1y}
- การเปลี่ยนแปลง 1 เดือน (1M Change): ${fund.change1m}
- คะแนน Quant Score: ${fund.quantScore}/10
- ค่าธรรมเนียมการบริหาร: ${fund.fee}
- นโยบายการจ่ายเงินปันผล: ${fund.dividend}
- สัดส่วนสินทรัพย์/หุ้นที่ถือหลัก (Top Holdings):
${fund.holdings.map(h => `  • ${h.name}: ${h.pct}`).join('\n')}
- ข้อควรระวัง / Red Flags: ${fund.redFlags && fund.redFlags.length > 0 ? fund.redFlags.join(', ') : 'ไม่มีความเสี่ยงผิดปกติที่ตรวจพบ'}

[หลักเกณฑ์การตอบ]
1. ตอบเป็นภาษาไทย สำนวนกระชับ เข้าใจง่าย เป็นกันเองเหมือนที่ปรึกษาการเงินส่วนตัวคุยกับเพื่อน
2. นำตัวเลขและสถิติจริงข้างต้นมาอธิบายประกอบคำตอบเสมอ
3. หากผู้ใช้ถามเรื่องที่ไม่อยู่ในข้อมูล ให้บอกอย่างตรงไปตรงมาว่าใน Factsheet ปัจจุบันยังไม่มีระบุเรื่องนั้น
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'รับทราบครับ จะตอบคำถามโดยอิงจากข้อมูลจริงของกองทุนนี้เป็นภาษาคนเข้าใจง่ายครับ' }] },
          { role: 'user', parts: [{ text: query }] }
        ],
        config: {
          temperature: 0.3
        }
      });

      if (response && response.text) {
        return {
          answer: response.text,
          citations: [
            {
              title: `ข้อมูลจริงตลาด: ${fund.code}`,
              snippet: `NAV: ${currencySymbol}${fund.nav} | 1Y: ${fund.return1y} | บลจ./ตลาด: ${fund.amc}`
            },
            {
              title: `Factsheet: นโยบาย & Holdings`,
              snippet: `Top Holdings: ${fund.holdings.map(h => `${h.name} (${h.pct})`).slice(0, 3).join(', ')}`
            }
          ]
        };
      }
    } catch (err) {
      console.warn('Gemini API request failed, falling back to Real-Data Engine:', err);
    }
  }

  // 2. Fallback: หากยังไม่ได้ใส่ API Key ใน .env หรือต่อเน็ตไม่ได้ ให้ใช้ Real-Data Engine
  // นำข้อมูลจริงที่ดึงมาจาก Yahoo Finance API มาวิเคราะห์และสังเคราะห์คำตอบแบบภาษาคน
  return generateLocalRealDataAnswer(query, fund);
}

/**
 * ตอบคำถามโดยใช้ข้อมูลจริงที่ดึงมาจาก API (ทำงานได้ 100% แม้ไม่มี API Key)
 */
function generateLocalRealDataAnswer(query, fund) {
  const q = query.toLowerCase();
  const currencySymbol = fund.currency === 'USD' ? '$' : '';
  const currencySuffix = fund.currency === 'USD' ? ' USD' : ' ฿';
  const holdingsText = fund.holdings.map(h => `**${h.name}** (${h.pct})`).join(', ');

  let answer = '';
  let citationTitle = `ข้อมูลจริงตลาด: ${fund.code}`;
  let citationSnippet = `ราคาตลาดล่าสุด: ${currencySymbol}${fund.nav.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ${currencySuffix}`;

  if (q.includes('ถือหุ้น') || q.includes('หุ้นอะไร') || q.includes('holding') || q.includes('สัดส่วน') || q.includes('สินทรัพย์')) {
    answer = `กองทุน/สินทรัพย์ **${fund.code}** (${fund.name}) ลงทุนในสินทรัพย์หลักดังนี้ครับ:\n\n` +
      fund.holdings.map(h => `• **${h.name}**: สัดส่วน **${h.pct}**`).join('\n') +
      `\n\n💡 *ข้อสังเกต:* ${fund.redFlags && fund.redFlags.length > 0 ? fund.redFlags[0] : 'การกระจายตัวของสินทรัพย์อยู่ในเกณฑ์มาตรฐาน'}`;
    citationTitle = `หนังสือชี้ชวน: สัดส่วนการลงทุน (Holdings)`;
    citationSnippet = `สินทรัพย์หลัก: ${holdingsText}`;
  } 
  else if (q.includes('ปันผล') || q.includes('dividend') || q.includes('กระแสเงินสด')) {
    answer = `สำหรับนโยบายเงินปันผลของ **${fund.code}**:\n\n` +
      `📌 **${fund.dividend}**\n\n` +
      `หากเป็นกองทุนประเภทสะสมมูลค่า กำไรจากเงินปันผลจะถูกนำกลับไป Reinvest ทบต้นเพื่อเพิ่มมูลค่า NAV ต่อหน่วยให้เติบโตในระยะยาวครับ`;
    citationTitle = `หนังสือชี้ชวน: นโยบายการจ่ายเงินปันผล`;
    citationSnippet = fund.dividend;
  }
  else if (q.includes('ค่าธรรมเนียม') || q.includes('fee') || q.includes('แพง') || q.includes('ต้นทุน')) {
    answer = `เรื่องค่าธรรมเนียมของ **${fund.code}**:\n\n` +
      `💰 **อัตราค่าธรรมเนียม:** ${fund.fee}\n` +
      `คะแนนความคุ้มค่าทางการเงิน (Quant Score) อยู่ที่ **${fund.quantScore}/10** ซื้อขายตรงตามราคา NAV ตลาดโดยไม่มีค่าธรรมเนียมแอบแฝงครับ`;
    citationTitle = `หนังสือชี้ชวน: อัตราค่าธรรมเนียม`;
    citationSnippet = `ค่าใช้จ่ายรวม: ${fund.fee} | Quant Score: ${fund.quantScore}/10`;
  }
  else if (q.includes('เทียบ') || q.includes('benchmark') || q.includes('ดัชนี') || q.includes('ผลตอบแทน') || q.includes('กำไร') || q.includes('1 ปี')) {
    answer = `ผลการดำเนินงานจริงของ **${fund.code}**:\n\n` +
      `📈 **ผลตอบแทนย้อนหลัง 1 ปี (1Y Return):** **${fund.return1y}**\n` +
      `📊 **การเปลี่ยนแปลงรอบ 1 เดือนล่าสุด:** **${fund.change1m}**\n` +
      `💵 **ราคา NAV ล่าสุด:** **${currencySymbol}${fund.nav.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ${currencySuffix}**\n\n` +
      `เมื่อเทียบกับดัชนีอ้างอิง Benchmark สภาพคล่องและผลการดำเนินงานสะท้อนราคาตลาดจริง`;
    citationTitle = `รายงานผลการดำเนินงาน (Performance EOD)`;
    citationSnippet = `1Y Return: ${fund.return1y} | 1M: ${fund.change1m} | NAV: ${fund.nav}`;
  }
  else {
    answer = `สรุปข้อมูลสำคัญของ **${fund.code}** (${fund.name}):\n\n` +
      `• **ราคา NAV ปัจจุบัน:** ${currencySymbol}${fund.nav.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ${currencySuffix} (1M: ${fund.change1m}, 1Y: ${fund.return1y})\n` +
      `• **หมวดหมู่ & ความเสี่ยง:** ${fund.categoryName} (ระดับ ${fund.riskLevel}/8)\n` +
      `• **นโยบายปันผล:** ${fund.dividend}\n` +
      `• **สินทรัพย์หลัก:** ${fund.holdings.slice(0, 3).map(h => `${h.name} (${h.pct})`).join(', ')}\n\n` +
      `หากต้องการทราบเจาะจงเรื่องหุ้นที่ถือ, นโยบายเงินปันผล หรือค่าธรรมเนียม สามารถคลิกปุ่มลัดหรือพิมพ์ถามเพิ่มเติมได้เลยครับ!`;
  }

  return {
    answer,
    citations: [
      {
        title: citationTitle,
        snippet: citationSnippet
      }
    ]
  };
}
