/**
 * Fund Table Component — แสดง table และ cards view ของกองทุน
 */
import { refreshIcons, generateSparkline } from '../utils/helpers.js';

/**
 * Render ทั้ง table view และ card view สำหรับ fund screener
 * @param {object[]} funds - array ของ fund objects
 * @param {Function} onDeepDive - callback เมื่อคลิก "วิเคราะห์เชิงลึก"
 */
export function renderFundTable(funds, onDeepDive) {
  const tbody = document.getElementById('fund-table-body');
  const cardsContainer = document.getElementById('screener-cards-view');
  const countEl = document.getElementById('fund-result-count');

  tbody.innerHTML = '';
  cardsContainer.innerHTML = '';
  countEl.innerText = funds.length;

  if (funds.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-400 text-xs">ไม่พบกองทุนที่ตรงตามเงื่อนไข ลองปรับตัวกรองดูใหม่อีกครั้ง</td></tr>`;
    return;
  }

  funds.forEach(fund => {
    const { svgPoints, strokeColor } = generateSparkline(fund.sparkline);
    const redFlagHTML = _buildRedFlagHTML(fund);

    const formattedPrice = `${fund.currency === 'USD' ? '$' : ''}${fund.nav.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${fund.currency === 'USD' ? 'USD' : '฿'}`;

    // --- Table Row ---
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50/80 transition cursor-pointer';
    tr.onclick = (e) => {
      if (!e.target.closest('button') && !e.target.closest('.group')) {
        onDeepDive(fund.id);
      }
    };

    tr.innerHTML = `
      <td class="py-3 px-4">
        <div class="font-bold text-slate-900 flex items-center gap-1.5">
          <span>${fund.code}</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-normal">${fund.amc}</span>
        </div>
        <div class="text-[11px] text-slate-500 truncate max-w-xs">${fund.name}</div>
      </td>
      <td class="py-3 px-3">
        <div class="text-slate-800 font-medium">${fund.categoryName}</div>
        <span class="text-[10px] text-slate-500">เสี่ยงระดับ ${fund.riskLevel}</span>
      </td>
      <td class="py-3 px-3 font-semibold text-slate-900">
        ${formattedPrice}
        <div class="text-[10px] ${fund.change1m.startsWith('+') ? 'text-emerald-600' : 'text-rose-500'} font-medium">1M: ${fund.change1m}</div>
      </td>
      <td class="py-3 px-3 text-center">
        <div class="flex items-center justify-center">
          <svg width="70" height="26" class="overflow-visible">
            <polyline fill="none" stroke="${strokeColor}" stroke-width="2" points="${svgPoints}" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </td>
      <td class="py-3 px-3 text-center">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold text-white ${fund.quantColor}">
          ${fund.quantScore}/10
        </span>
      </td>
      <td class="py-3 px-3">${redFlagHTML}</td>
      <td class="py-3 px-4 text-right">
        <button data-deepdive="${fund.id}" 
                class="px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-800 font-medium text-xs border border-brand-200 transition">
          วิเคราะห์เชิงลึก
        </button>
      </td>
    `;

    // Attach click handler for the button
    tr.querySelector(`[data-deepdive="${fund.id}"]`).addEventListener('click', (e) => {
      e.stopPropagation();
      onDeepDive(fund.id);
    });

    tbody.appendChild(tr);

    // --- Card View ---
    const card = document.createElement('div');
    card.className = 'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-brand-200 transition';
    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-1.5">
            <h4 class="font-bold text-slate-900">${fund.code}</h4>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">${fund.amc}</span>
          </div>
          <p class="text-xs text-slate-500 line-clamp-1">${fund.name}</p>
        </div>
        <span class="px-2 py-0.5 rounded-full text-xs font-bold text-white ${fund.quantColor}">
          ${fund.quantScore}
        </span>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
        <div>
          <span class="text-slate-400 block text-[10px]">NAV ปัจจุบัน</span>
          <span class="font-bold text-slate-800">${formattedPrice}</span>
        </div>
        <div>
          <span class="text-slate-400 block text-[10px]">ผลตอบแทน 1M</span>
          <span class="font-bold ${fund.change1m.startsWith('+') ? 'text-emerald-600' : 'text-rose-500'}">${fund.change1m}</span>
        </div>
      </div>

      <div class="pt-1">${redFlagHTML}</div>

      <button data-deepdive-card="${fund.id}" 
              class="w-full py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-medium text-xs transition">
        วิเคราะห์เชิงลึก (Deep-Dive)
      </button>
    `;

    card.querySelector(`[data-deepdive-card="${fund.id}"]`).addEventListener('click', () => {
      onDeepDive(fund.id);
    });

    cardsContainer.appendChild(card);
  });

  refreshIcons();
}

/**
 * สลับระหว่าง Table View / Card View
 * @param {'table'|'cards'} mode 
 */
export function toggleScreenerView(mode) {
  const tableView = document.getElementById('screener-table-view');
  const cardsView = document.getElementById('screener-cards-view');
  const btnTable = document.getElementById('view-btn-table');
  const btnCards = document.getElementById('view-btn-cards');

  if (mode === 'table') {
    tableView.classList.remove('hidden');
    cardsView.classList.add('hidden');
    btnTable.className = 'px-3 py-1.5 rounded-lg bg-white shadow-sm text-slate-900 flex items-center gap-1.5 transition';
    btnCards.className = 'px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition';
  } else {
    tableView.classList.add('hidden');
    cardsView.classList.remove('hidden');
    btnCards.className = 'px-3 py-1.5 rounded-lg bg-white shadow-sm text-slate-900 flex items-center gap-1.5 transition';
    btnTable.className = 'px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition';
  }
  refreshIcons();
}

// --- Private helpers ---

function _buildRedFlagHTML(fund) {
  if (fund.redFlags.length > 0) {
    return `<div class="group relative inline-block cursor-help">
      <span class="inline-flex items-center gap-1 text-rose-600 font-medium px-2 py-0.5 rounded bg-rose-50 border border-rose-200">
        <i data-lucide="flag" class="w-3 h-3 fill-rose-500 text-rose-600"></i>
        <span>${fund.redFlags.length} รายการ</span>
      </span>
      <div class="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-56 p-2.5 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl z-30 pointer-events-none">
        <div class="font-bold text-rose-300 mb-1">ตรวจพบข้อควรระวัง:</div>
        <ul class="list-disc pl-3.5 space-y-0.5 text-slate-200">
          ${fund.redFlags.map(f => `<li>${f.replace('🚩 ', '')}</li>`).join('')}
        </ul>
      </div>
    </div>`;
  }

  return `<span class="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50">
    <i data-lucide="check" class="w-3 h-3"></i> ปลอดภัย
  </span>`;
}
