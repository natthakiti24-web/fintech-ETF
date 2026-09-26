/**
 * Watchtower View — แผงควบคุมและหอคอยเฝ้าระวัง
 */
import { state, removeHolding } from '../data/state.js';
import { refreshIcons, formatCurrency } from '../utils/helpers.js';
import { switchTab } from '../utils/router.js';

/**
 * Mount Watchtower View — ผูก event listeners
 */
export function mountWatchtowerView() {
  // ปุ่มเพิ่มกองทุนใหม่
  document.getElementById('btn-add-new-fund')?.addEventListener('click', () => {
    switchTab('screener');
  });
}

/**
 * Render Holdings Dashboard — แสดงรายการกองทุนในพอร์ตพร้อมสรุปมูลค่า
 */
export function renderHoldingsDashboard() {
  const container = document.getElementById('holdings-list-container');
  container.innerHTML = '';

  let totalValue = 0;
  let totalCost = 0;

  state.userHoldings.forEach((holding, idx) => {
    const curVal = holding.units * holding.currentNav;
    const costVal = holding.units * holding.costNav;
    const profit = curVal - costVal;
    const profitPct = ((profit / costVal) * 100).toFixed(2);

    totalValue += curVal;
    totalCost += costVal;

    const card = document.createElement('div');
    card.className = `p-4 rounded-xl border ${holding.driftAlert ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 bg-white'} space-y-2.5`;

    card.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-900 text-sm">${holding.code}</span>
            ${holding.driftAlert ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1"><i data-lucide="alert-triangle" class="w-3 h-3"></i> เตือน Style Drift</span>' : ''}
          </div>
          <div class="text-[11px] text-slate-500">${holding.name}</div>
        </div>

        <div class="text-right">
          <div class="font-bold text-slate-900 text-sm">${formatCurrency(curVal)}</div>
          <div class="text-[11px] font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
            ${profit >= 0 ? '+' : ''}${profit.toLocaleString('th-TH', { maximumFractionDigits: 0 })} ฿ (${profitPct}%)
          </div>
        </div>
      </div>

      <!-- Thesis Note Container -->
      <div class="p-2.5 rounded-lg bg-slate-50 text-[11px] text-slate-600 border border-slate-100 space-y-1">
        <div class="font-semibold text-slate-800 flex items-center gap-1">
          <i data-lucide="file-check" class="w-3 h-3 text-brand-700"></i>
          เหตุผลที่คุณซื้อ (Thesis):
        </div>
        <p class="italic text-slate-600">"${holding.thesis}"</p>
      </div>

      <div class="flex items-center justify-between pt-1 text-[11px] text-slate-400">
        <span>ต้นทุนเฉลี่ย: ${holding.costNav.toFixed(4)} ฿ | NAV ปัจจุบัน: ${holding.currentNav.toFixed(4)} ฿</span>
        <div class="flex items-center gap-2">
          <button data-deepdive-holding="${holding.id}" class="text-brand-700 hover:underline font-medium">ดู Factsheet AI</button>
          <button data-remove-holding="${idx}" class="text-slate-400 hover:text-rose-600" title="ลบออกจากพอร์ต"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
        </div>
      </div>
    `;

    // Event: Open deep dive
    card.querySelector(`[data-deepdive-holding="${holding.id}"]`)?.addEventListener('click', () => {
      const fund = (state.apiFunds || []).find(f => f.id === holding.id);
      if (fund) {
        state.currentSelectedFund = fund;
        switchTab('deepdive');
      }
    });

    // Event: Remove holding
    card.querySelector(`[data-remove-holding="${idx}"]`)?.addEventListener('click', () => {
      removeHolding(idx);
      renderHoldingsDashboard();
    });

    container.appendChild(card);
  });

  // Update dashboard summary
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? ((totalGain / totalCost) * 100).toFixed(2) : 0;

  document.getElementById('dash-total-value').innerText = formatCurrency(totalValue);
  document.getElementById('dash-holdings-count').innerText = `${state.userHoldings.length} กองทุน`;
  document.getElementById('nav-portfolio-total').innerText = formatCurrency(totalValue);
  document.getElementById('nav-portfolio-gain').innerText = `(${totalGain >= 0 ? '+' : ''}${totalGainPct}%)`;

  refreshIcons();
}
