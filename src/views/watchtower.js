/**
 * Watchtower View — แผงควบคุมและหอคอยเฝ้าระวัง
 */
import { state, removeHolding } from '../data/state.js';
import {
  refreshIcons,
  convertToPortfolioThb,
  formatThbCurrency
} from '../utils/helpers.js';
import { switchTab } from '../utils/router.js';
import { fetchFundNews } from '../services/newsApi.js';

const FUND_NEWS_CACHE_TTL_MS = 10 * 60_000;
const fundNewsCache = new Map();
let feedRenderVersion = 0;

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
 * Render portfolio-based watchtower alerts based on holdings in the user's portfolio.
 */
export function renderWatchtowerFeed() {
  const container = document.getElementById('watchtower-feed-container');
  if (!container) return;
  const renderVersion = ++feedRenderVersion;

  const holdings = state.userHoldings || [];

  if (!holdings.length) {
    container.innerHTML = `
      <div class="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200 text-slate-800">
        <div class="flex items-center justify-between">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-600 text-white flex items-center gap-1">
            <i data-lucide="info" class="w-3 h-3"></i> ยังไม่มีพอร์ต
          </span>
          <span class="text-[10px] text-slate-400 font-mono">วันนี้</span>
        </div>
        <p class="font-semibold text-sky-950 mt-2">เพิ่มกองทุนเข้า Watchtower เพื่อรับข่าวและการเฝ้าระวังแบบรายกองทุน</p>
      </div>
    `;
    refreshIcons();
    return;
  }

  const alerts = holdings.map((holding) => {
    const fund = state.apiFunds.find(item => item.id === holding.id);
    const currency = fund?.currency || holding.currency || 'THB';
    const usdToThbRate = fund?.usdToThbRate || holding.usdToThbRate || 1;
    const currentNav = fund?.nav ?? holding.currentNav;
    const currentValue = getHoldingMarketValueThb(holding, currentNav, currency, usdToThbRate);
    const costValue = holding.investedAmountThb;
    const pnl = currentValue - costValue;
    const pnlPct = costValue > 0 ? (pnl / costValue) * 100 : 0;

    if (holding.driftAlert) {
      return {
        tone: 'amber',
        tag: 'เตือน Style Drift!',
        icon: 'shuffle',
        title: `${holding.code} มีความผันผวนสูงกว่าพอร์ต`,
        detail: `สัดส่วน ${holding.name} ยังตรงกับ thesis "${holding.thesis}" แต่ความแปรผันของตลาดทำให้ความเสี่ยงสูงขึ้นกว่าระดับที่คุณยอมรับ`,
        time: 'วันนี้'
      };
    }

    if (holding.code === '1DIV' || /Dividend|ปันผล/i.test(holding.thesis)) {
      return {
        tone: 'emerald',
        tag: 'ประเมินผลตอบแทน',
        icon: 'badge-percent',
        title: `${holding.code} ยังสอดคล้องกับ thesis เงินปันผล`,
        detail: `ปัจจุบันทำกำไร ${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}% จากต้นทุน โดย thesis "${holding.thesis}" ยังคงสอดคล้องกับเป้าหมาย passive income ของพอร์ต`,
        time: 'ล่าสุด'
      };
    }

    if (pnlPct >= 0) {
      return {
        tone: 'emerald',
        tag: 'ผลตอบแทนพอร์ต',
        icon: 'trending-up',
        title: `${holding.code} ทำกำไร ${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%`,
        detail: `มูลค่าปัจจุบัน ${formatThbCurrency(currentValue)} จากต้นทุน ${formatThbCurrency(costValue)} โดย thesis ของคุณคือ "${holding.thesis}" ยังคงทำงานได้ดี`,
        time: 'ล่าสุด'
      };
    }

    return {
      tone: 'rose',
      tag: 'ราคาลดลงถึงเกณฑ์',
      icon: 'alert-octagon',
      title: `${holding.code} ปรับตัวลด ${Math.abs(pnlPct).toFixed(1)}%`,
      detail: `ความกังวลหลักอยู่ที่ thesis "${holding.thesis}" ขอให้เฝ้าระวังและประเมินใหม่หากตลาดยังคงชะลอตัวต่อเนื่อง`,
      time: 'วันนี้'
    };
  });

  container.innerHTML = alerts.map((alert, index) => {
    const palette = {
      rose: { card: 'bg-rose-50/80 border-rose-200', badge: 'bg-rose-600', text: 'text-rose-950' },
      amber: { card: 'bg-amber-50/80 border-amber-200', badge: 'bg-amber-600', text: 'text-amber-950' },
      emerald: { card: 'bg-emerald-50/80 border-emerald-200', badge: 'bg-emerald-600', text: 'text-emerald-950' },
      sky: { card: 'bg-sky-50/80 border-sky-200', badge: 'bg-sky-600', text: 'text-sky-950' }
    }[alert.tone] || palette.sky;

    return `
      <div data-news-index="${index}" class="p-3.5 rounded-xl ${palette.card} border text-slate-800 space-y-1.5 transition hover:bg-white/80">
        <div class="flex items-center justify-between">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${palette.badge} text-white flex items-center gap-1">
            <i data-lucide="${alert.icon}" class="w-3 h-3"></i> ${alert.tag}
          </span>
          <span class="text-[10px] text-slate-400 font-mono">${alert.time}</span>
        </div>
        <p class="font-semibold ${palette.text}">${alert.title}</p>
        <p class="text-slate-600 text-[11px] leading-relaxed">${alert.detail}</p>
        <div data-fund-news class="border-t border-slate-200/70 pt-2 mt-2">
          <p class="text-[10px] text-slate-500">กำลังโหลดข่าวล่าสุดจาก Finnhub...</p>
        </div>
      </div>
    `;
  }).join('');

  refreshIcons();
  void loadFundNews(holdings, container, renderVersion);
}

async function loadFundNews(holdings, container, renderVersion) {
  await Promise.all(holdings.map(async (holding, index) => {
    try {
      const result = await getCachedFundNews(holding.code);
      if (renderVersion !== feedRenderVersion) return;
      const card = container.querySelector(`[data-news-index="${index}"] [data-fund-news]`);
      if (card) renderFundNews(card, holding.code, result.news, result.translationError);
    } catch (error) {
      if (renderVersion !== feedRenderVersion) return;
      const card = container.querySelector(`[data-news-index="${index}"] [data-fund-news]`);
      if (card) {
        card.replaceChildren();
        const message = document.createElement('p');
        message.className = 'text-[10px] text-rose-700';
        message.textContent = `โหลดข่าวไม่สำเร็จ: ${error.message}`;
        card.appendChild(message);
      }
    }
  }));
}

function getCachedFundNews(symbol) {
  const normalizedSymbol = String(symbol || '').trim().toUpperCase();
  const cached = fundNewsCache.get(normalizedSymbol);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;

  const promise = fetchFundNews(normalizedSymbol);
  fundNewsCache.set(normalizedSymbol, {
    expiresAt: Date.now() + FUND_NEWS_CACHE_TTL_MS,
    promise
  });
  promise.catch(() => {
    if (fundNewsCache.get(normalizedSymbol)?.promise === promise) {
      fundNewsCache.delete(normalizedSymbol);
    }
  });
  return promise;
}

function renderFundNews(container, symbol, news, translationError) {
  container.replaceChildren();
  const heading = document.createElement('p');
  heading.className = 'text-[10px] font-semibold text-slate-700 mb-1';
  heading.textContent = `ข่าว ${symbol} • 7 วันล่าสุด • Finnhub`;
  container.appendChild(heading);

  const languageNote = document.createElement('p');
  languageNote.className = `text-[10px] ${translationError ? 'text-amber-700' : 'text-emerald-700'} mb-1.5`;
  languageNote.textContent = translationError || 'แปลเป็นภาษาไทยอัตโนมัติ';
  container.appendChild(languageNote);

  if (!news.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'text-[10px] text-slate-500';
    emptyMessage.textContent = 'ไม่พบข่าวในช่วง 7 วันที่ผ่านมา';
    container.appendChild(emptyMessage);
    return;
  }

  news.forEach(item => {
    const article = document.createElement('div');
    article.className = 'border-t border-slate-200/60 pt-1.5 mt-1.5';

    const metadata = document.createElement('p');
    metadata.className = 'text-[10px] text-slate-500';
    const publishedAt = Number.isFinite(item.datetime)
      ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'short', timeStyle: 'short' })
        .format(new Date(item.datetime * 1000))
      : 'เวลาไม่ระบุ';
    metadata.textContent = [item.source, publishedAt].filter(Boolean).join(' • ');
    article.appendChild(metadata);

    const title = item.url ? document.createElement('a') : document.createElement('p');
    title.className = 'block text-[11px] font-medium text-sky-800 hover:underline';
    title.textContent = item.headlineTh || item.headline;
    if (item.url) {
      title.href = item.url;
      title.target = '_blank';
      title.rel = 'noopener noreferrer';
    }
    article.appendChild(title);

    const summaryText = item.summaryTh ?? item.summary;
    if (summaryText) {
      const summary = document.createElement('p');
      summary.className = 'text-[10px] text-slate-600 leading-relaxed';
      summary.textContent = summaryText;
      article.appendChild(summary);
    }
    container.appendChild(article);
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
    const fund = state.apiFunds.find(item => item.id === holding.id);
    const currency = fund?.currency || holding.currency || 'THB';
    const usdToThbRate = fund?.usdToThbRate || holding.usdToThbRate || 1;
    const currentNav = fund?.nav ?? holding.currentNav;
    const curVal = getHoldingMarketValueThb(holding, currentNav, currency, usdToThbRate);
    const costVal = holding.investedAmountThb;
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
          <div class="font-bold text-slate-900 text-sm">${formatThbCurrency(curVal)}</div>
          <div class="text-[11px] font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
            ${profit >= 0 ? '+' : ''}${formatThbCurrency(profit)} (${profitPct}%)
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
        <span>เงินลงทุนเริ่มต้น: ${formatThbCurrency(holding.investedAmountThb)} | NAV ปัจจุบัน: ${formatThbCurrency(convertToPortfolioThb(currentNav, currency, usdToThbRate))}</span>
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

  document.getElementById('dash-total-value').innerText = formatThbCurrency(totalValue);
  document.getElementById('dash-holdings-count').innerText = `${state.userHoldings.length} กองทุน`;
  document.getElementById('nav-portfolio-total').innerText = formatThbCurrency(totalValue);
  document.getElementById('nav-portfolio-gain').innerText = `(${totalGain >= 0 ? '+' : ''}${totalGainPct}%)`;

  const portfolioBreakdown = calculatePortfolioAllocation();
  renderAllocationBar(portfolioBreakdown);
  renderWatchtowerFeed();
  refreshIcons();
}

function calculatePortfolioAllocation() {
  const breakdown = {
    'US_TECH': 0,
    'THAI_INDEX': 0,
    'FIXED_INCOME': 0
  };

  state.userHoldings.forEach((holding) => {
    const fund = state.apiFunds.find(item => item.id === holding.id);
    const category = fund?.category || 'THAI_INDEX';
    const currency = fund?.currency || holding.currency || 'THB';
    const usdToThbRate = fund?.usdToThbRate || holding.usdToThbRate || 1;
    const currentNav = fund?.nav ?? holding.currentNav;
    const value = getHoldingMarketValueThb(holding, currentNav, currency, usdToThbRate);

    if (category === 'US_TECH' || category === 'GLOBAL_EQUITY' || category === 'INDEX_S500' || category === 'COMMODITY') {
      breakdown['US_TECH'] += value;
    } else if (category === 'THAI_INDEX') {
      breakdown['THAI_INDEX'] += value;
    } else {
      breakdown['FIXED_INCOME'] += value;
    }
  });

  const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0) || 1;
  return Object.entries(breakdown).map(([key, value]) => ({
    key,
    label: key === 'US_TECH' ? 'ETF สหรัฐฯ' : key === 'THAI_INDEX' ? 'ETF หุ้นไทย' : 'ETF ตราสารหนี้',
    percent: (value / total) * 100,
    color: key === 'US_TECH' ? '#2563eb' : key === 'THAI_INDEX' ? '#14b8a6' : '#eab308'
  }));
}

function getHoldingMarketValueThb(holding, currentNav, currency, usdToThbRate) {
  const currentNavThb = convertToPortfolioThb(currentNav, currency, usdToThbRate);
  const purchaseNavThb = holding.purchaseNavThb || currentNavThb;
  return holding.investedAmountThb * (purchaseNavThb > 0 ? currentNavThb / purchaseNavThb : 1);
}

function renderAllocationBar(breakdown) {
  const bar = document.getElementById('asset-allocation-bar');
  const labels = document.getElementById('asset-allocation-labels');
  if (!bar || !labels) return;

  bar.innerHTML = breakdown.map(item => `
    <div class="h-full" style="width: ${Math.max(item.percent, 4)}%; background: ${item.color};" title="${item.label} ${item.percent.toFixed(0)}%"></div>
  `).join('');

  labels.innerHTML = breakdown.map(item => `
    <span style="color:${item.color};">● ${item.label} ${item.percent.toFixed(0)}%</span>
  `).join('');
}
