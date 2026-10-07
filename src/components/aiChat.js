/**
 * AI Chat Component — Factsheet AI แชทแปลภาษาคน
 */
import { refreshIcons } from '../utils/helpers.js';

/**
 * เพิ่มข้อความใน chat
 * @param {'user'|'ai'} sender 
 * @param {string} text 
 * @param {{ title: string, snippet: string }[]} citations 
 */
export function appendChatMessage(sender, text, citations = []) {
  const container = document.getElementById('ai-chat-messages');
  const isUser = sender === 'user';

  const msgDiv = document.createElement('div');
  msgDiv.className = `flex gap-2.5 items-start ${isUser ? 'flex-row-reverse' : ''}`;

  const avatar = document.createElement('div');
  avatar.className = `w-6 h-6 rounded-full ${isUser ? 'bg-slate-800 text-white' : 'bg-brand-700 text-white'} flex items-center justify-center shrink-0 text-[10px] font-bold`;
  avatar.textContent = isUser ? 'คุณ' : 'AI';

  const messageBody = document.createElement('div');
  messageBody.className = `${isUser ? 'bg-brand-700 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'} p-3 rounded-2xl max-w-[85%] space-y-1`;
  const messageText = document.createElement('p');
  messageText.className = 'leading-relaxed whitespace-pre-wrap';
  messageText.textContent = text;
  messageBody.appendChild(messageText);

  if (citations.length > 0) {
    const citationList = document.createElement('div');
    citationList.className = 'pt-2 flex flex-wrap gap-1.5';
    citations.forEach(citation => {
      const button = document.createElement('button');
      button.className = 'citation-btn inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300/60 transition';
      button.textContent = `[${citation.title}]`;
      button.addEventListener('click', () => _openCitationModal(citation.title, citation.snippet));
      citationList.appendChild(button);
    });
    messageBody.appendChild(citationList);
  }

  msgDiv.append(avatar, messageBody);

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;

  refreshIcons();
}

import { askGeminiAboutFund } from '../services/aiApi.js';

/**
 * สร้างคำตอบจาก Gemini API
 * @param {string} query - คำถามจากผู้ใช้
 * @param {object} fund - fund object
 */
export async function generateFactsheetAnswer(query, fund) {
  // 1. เพิ่มสถานะ "กำลังคิด..." ชั่วคราว
  const container = document.getElementById('ai-chat-messages');
  const tempId = `loading-${Date.now()}`;
  
  const loadingDiv = document.createElement('div');
  loadingDiv.id = tempId;
  loadingDiv.className = `flex gap-2.5 items-start`;
  loadingDiv.innerHTML = `
    <div class="w-6 h-6 rounded-full bg-brand-700 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">AI</div>
    <div class="bg-slate-100 text-slate-800 rounded-2xl rounded-tl-none p-3 max-w-[85%] flex items-center gap-2">
      <div class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
      <div class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
      <div class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
    </div>
  `;
  container.appendChild(loadingDiv);
  container.scrollTop = container.scrollHeight;

  try {
    const result = await askGeminiAboutFund(query, fund);
    appendChatMessage('ai', result.answer, result.citations);
  } catch (error) {
    appendChatMessage('ai', error.message || 'เรียก Gemini ไม่สำเร็จ กรุณาลองอีกครั้ง');
  } finally {
    document.getElementById(tempId)?.remove();
  }
}

/**
 * Reset chat สำหรับกองทุนใหม่
 * @param {object} fund 
 */
export function resetChat(fund) {
  const chatContainer = document.getElementById('ai-chat-messages');
  chatContainer.innerHTML = `
    <div class="flex gap-2.5 items-start">
      <div class="w-6 h-6 rounded-full bg-brand-700 text-white flex items-center justify-center shrink-0 text-[10px]">AI</div>
      <div class="bg-slate-100 text-slate-800 p-3 rounded-2xl rounded-tl-none space-y-1 max-w-[85%]">
        <p>สวัสดีครับ! ตอนนี้เรากำลังดูข้อมูลของ <strong>${fund.code}</strong> มีจุดไหนในหนังสือชี้ชวนที่อยากให้ผมแปลเป็นภาษาคนให้ฟัง ถามได้เลยครับ!</p>
        <div class="text-[10px] text-slate-400 mt-1">อ้างอิงข้อมูล ก.ล.ต. รายไตรมาสล่าสุด</div>
      </div>
    </div>
  `;
}

// --- Private ---

function _openCitationModal(title, snippet) {
  document.getElementById('citation-title').innerText = title;
  document.getElementById('citation-body').innerText = `"${snippet}"`;
  document.getElementById('modal-citation').classList.remove('hidden');
  refreshIcons();
}
