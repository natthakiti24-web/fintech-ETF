/**
 * Deep Dive View — วิเคราะห์กองทุนเชิงลึก + AI Factsheet Chat
 */
import { state } from '../data/state.js';
import { refreshIcons } from '../utils/helpers.js';
import { switchTab } from '../utils/router.js';
import { createNavChart, toggleCrisisChart } from '../components/charts.js';
import { appendChatMessage, generateFactsheetAnswer, resetChat } from '../components/aiChat.js';
import { openThesisModal } from '../modals/thesis.js';

/**
 * Mount Deep Dive View — ผูก event listeners
 */
export function mountDeepDiveView() {
  // ปุ่มกลับไปหน้า screener
  document.getElementById('btn-back-screener')?.addEventListener('click', () => {
    switchTab('screener');
  });

  // ปุ่มจำลองวิกฤต
  document.getElementById('btn-crisis-toggle')?.addEventListener('click', () => {
    toggleCrisisSimulation();
  });

  // ปุ่มเพิ่มเข้าพอร์ต
  document.getElementById('btn-add-portfolio')?.addEventListener('click', () => {
    openThesisModal(state.currentSelectedFund);
  });

  // Chat form
  document.getElementById('ai-chat-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleChatSubmit();
  });

  // Quick prompts
  document.querySelectorAll('[data-quick-prompt]').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.quickPrompt;
      document.getElementById('ai-chat-input').value = text;
      handleChatSubmit();
    });
  });
}

/**
 * Load deep dive data สำหรับกองทุนที่เลือก
 */
export function loadDeepDive() {
  const fund = state.currentSelectedFund;
  state.isCrisisActive = false;

  // Update text fields
  document.getElementById('dd-fund-code').innerText = fund.code;
  document.getElementById('dd-fund-name').innerText = fund.name;
  document.getElementById('dd-fund-risk').innerText = `เสี่ยงระดับ ${fund.riskLevel}`;
  const currencySymbol = fund.currency === 'USD' ? '$' : '';
  const currencySuffix = fund.currency === 'USD' ? ' USD' : ' ฿';
  document.getElementById('dd-fund-nav').innerText = `${currencySymbol}${fund.nav.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}${currencySuffix}`;
  document.getElementById('dd-fund-return1y').innerText = fund.return1y;
  document.getElementById('dd-fund-dividend').innerText = fund.dividend;
  document.getElementById('dd-fund-fee').innerText = fund.fee;

  // Reset crisis UI
  document.getElementById('crisis-alert-box').classList.add('hidden');
  const statusPill = document.getElementById('crisis-status-pill');
  statusPill.innerText = 'สภาวะปกติ (Benchmark S&P500)';
  statusPill.className = 'text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium';

  const toggleBtn = document.getElementById('btn-crisis-toggle');
  toggleBtn.innerHTML = `<i data-lucide="flame" class="w-3.5 h-3.5 text-rose-600"></i><span>💥 จำลองสถานการณ์วิกฤต (Crisis Test)</span>`;

  // Render Holdings
  const holdingsContainer = document.getElementById('dd-holdings-list');
  holdingsContainer.innerHTML = '';
  fund.holdings.forEach(h => {
    const item = document.createElement('div');
    item.className = 'flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs border border-slate-100';
    item.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-brand-600"></span>
        <span class="font-medium text-slate-800">${h.name}</span>
      </div>
      <span class="font-bold text-slate-900">${h.pct}</span>
    `;
    holdingsContainer.appendChild(item);
  });

  // Reset AI Chat
  resetChat(fund);

  // Init Chart
  if (state.deepdiveChartInstance) {
    state.deepdiveChartInstance.destroy();
  }
  const canvas = document.getElementById('deepdiveNavChart');
  state.deepdiveChartInstance = createNavChart(canvas, fund);

  refreshIcons();
}

// --- Private ---

function toggleCrisisSimulation() {
  state.isCrisisActive = !state.isCrisisActive;
  const fund = state.currentSelectedFund;
  const alertBox = document.getElementById('crisis-alert-box');
  const statusPill = document.getElementById('crisis-status-pill');
  const toggleBtn = document.getElementById('btn-crisis-toggle');

  toggleCrisisChart(state.deepdiveChartInstance, fund, state.isCrisisActive);

  if (state.isCrisisActive) {
    alertBox.classList.remove('hidden');
    statusPill.innerText = '⚠️ กำลังแสดงผลจำลองสภาวะวิกฤต (Crisis Mode)';
    statusPill.className = 'text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold';
    toggleBtn.innerHTML = `<i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i><span>กลับสู่กราฟปกติ</span>`;
  } else {
    alertBox.classList.add('hidden');
    statusPill.innerText = 'สภาวะปกติ (Benchmark S&P500)';
    statusPill.className = 'text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium';
    toggleBtn.innerHTML = `<i data-lucide="flame" class="w-3.5 h-3.5 text-rose-600"></i><span>💥 จำลองสถานการณ์วิกฤต (Crisis Test)</span>`;
  }

  refreshIcons();
}

function handleChatSubmit() {
  const input = document.getElementById('ai-chat-input');
  const question = input.value.trim();
  if (!question) return;

  appendChatMessage('user', question);
  input.value = '';

  setTimeout(() => {
    generateFactsheetAnswer(question, state.currentSelectedFund);
  }, 400);
}
