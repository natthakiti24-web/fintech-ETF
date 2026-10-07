/**
 * Screener View — ค้นหาและคัดกรอง ETF
 */
import { state } from '../data/state.js';
import { renderFundTable, toggleScreenerView } from '../components/fundTable.js';
import { switchTab } from '../utils/router.js';
import { refreshIcons } from '../utils/helpers.js';
import { searchAndFetchTicker } from '../services/fundApi.js';

let _searchDebounceTimer = null;

/**
 * Mount Screener View — ผูก event listeners และ render ครั้งแรก
 */
export function mountScreenerView() {
  const searchInput = document.getElementById('filter-search');

  // Filter inputs
  searchInput?.addEventListener('input', () => {
    state.recommendedFundIds = null;
    filterFunds();
    
    // ตั้ง Debounce สำหรับค้นหา Ticker จาก Yahoo Finance หากไม่มีในรายการ
    clearTimeout(_searchDebounceTimer);
    const query = searchInput.value.trim();
    if (query.length >= 2) {
      _searchDebounceTimer = setTimeout(() => {
        handleRemoteTickerSearch(query);
      }, 700);
    }
  });

  // ค้นหาทันทีเมื่อกด Enter
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(_searchDebounceTimer);
      const query = searchInput.value.trim();
      if (query.length >= 2) {
        handleRemoteTickerSearch(query);
      }
    }
  });

  document.getElementById('filter-amc')?.addEventListener('change', () => {
    state.recommendedFundIds = null;
    filterFunds();
  });
  document.getElementById('filter-category')?.addEventListener('change', () => {
    state.recommendedFundIds = null;
    filterFunds();
  });
  document.getElementById('filter-only-clean')?.addEventListener('change', () => {
    state.recommendedFundIds = null;
    filterFunds();
  });

  // Risk level buttons
  document.querySelectorAll('.risk-btn').forEach(btn => {
    const level = btn.dataset.riskLevel;
    if (level) {
      btn.addEventListener('click', () => setRiskFilter(level, btn));
    }
  });

  // View toggle
  document.getElementById('view-btn-table')?.addEventListener('click', () => toggleScreenerView('table'));
  document.getElementById('view-btn-cards')?.addEventListener('click', () => toggleScreenerView('cards'));

  // Reset filters
  document.getElementById('btn-reset-filters')?.addEventListener('click', () => resetScreenerFilters());
}

/**
 * ค้นหา Ticker จาก Yahoo Finance โดยตรงหากไม่มีอยู่ในตาราง
 */
async function handleRemoteTickerSearch(query) {
  const search = query.toLowerCase().trim();
  const sourceFunds = state.apiFunds || [];
  const exists = sourceFunds.some(f => f.code.toLowerCase() === search || f.id.toLowerCase() === search);
  
  if (!exists) {
    const newFund = await searchAndFetchTicker(query);
    if (newFund) {
      if (!state.apiFunds.some(f => f.id === newFund.id)) {
        state.apiFunds.unshift(newFund);
      }
      filterFunds();
    }
  }
}

/**
 * Render กองทุนทั้งหมดใน screener (เรียกเมื่อ tab เปลี่ยน)
 */
export function renderScreener() {
  const fundsToRender = state.recommendedFundIds === null
    ? state.apiFunds || []
    : state.recommendedFundIds
      .map(id => state.apiFunds.find(fund => fund.id === id))
      .filter(Boolean);
  renderFundTable(fundsToRender, openDeepDive);
}

function openDeepDive(fundId) {
  const fund = (state.apiFunds || []).find(f => f.id === fundId);
  if (fund) {
    state.currentSelectedFund = fund;
    switchTab('deepdive');
  }
}

function filterFunds() {
  const search = (document.getElementById('filter-search')?.value || '').toLowerCase().trim();
  const amc = document.getElementById('filter-amc')?.value || 'ALL';
  const category = document.getElementById('filter-category')?.value || 'ALL';
  const onlyClean = document.getElementById('filter-only-clean')?.checked || false;

  const sourceFunds = state.apiFunds && state.apiFunds.length > 0 ? state.apiFunds : [];

  const filtered = sourceFunds.filter(f => {
    const matchSearch = f.code.toLowerCase().includes(search) || f.name.toLowerCase().includes(search);
    const matchAmc = amc === 'ALL' || f.amc === amc;
    const matchCat = category === 'ALL' || f.category === category;

    let matchRisk = true;
    if (state.currentRiskFilter === 'LOW') matchRisk = f.riskLevel <= 4;
    if (state.currentRiskFilter === 'MID') matchRisk = f.riskLevel === 5;
    if (state.currentRiskFilter === 'HIGH') matchRisk = f.riskLevel >= 6;

    let matchClean = true;
    if (onlyClean) matchClean = f.redFlags.length === 0;

    return matchSearch && matchAmc && matchCat && matchRisk && matchClean;
  });

  renderFundTable(filtered, openDeepDive);
}

function setRiskFilter(level, btn) {
  state.recommendedFundIds = null;
  document.querySelectorAll('.risk-btn').forEach(b => {
    b.className = 'risk-btn py-1.5 text-[11px] rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 font-medium';
  });

  if (state.currentRiskFilter === level) {
    state.currentRiskFilter = 'ALL';
    document.getElementById('risk-level-display').innerText = '1 - 8 (ทั้งหมด)';
  } else {
    state.currentRiskFilter = level;
    btn.className = 'risk-btn py-1.5 text-[11px] rounded-lg border border-brand-600 bg-brand-50 text-brand-800 font-bold';
    const labels = { LOW: '1 - 4 (เสี่ยงต่ำ)', MID: '5 (เสี่ยงปานกลาง)', HIGH: '6 - 8 (เสี่ยงสูง)' };
    document.getElementById('risk-level-display').innerText = labels[level] || '1 - 8 (ทั้งหมด)';
  }
  filterFunds();
}

function resetScreenerFilters() {
  state.recommendedFundIds = null;
  document.getElementById('filter-search').value = '';
  document.getElementById('filter-amc').value = 'ALL';
  document.getElementById('filter-category').value = 'ALL';
  document.getElementById('filter-only-clean').checked = false;
  state.currentRiskFilter = 'ALL';
  document.querySelectorAll('.risk-btn').forEach(b => {
    b.className = 'risk-btn py-1.5 text-[11px] rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 font-medium';
  });
  document.getElementById('risk-level-display').innerText = '1 - 8 (ทั้งหมด)';
  
  const fundsToRender = state.apiFunds && state.apiFunds.length > 0 ? state.apiFunds : [];
  renderFundTable(fundsToRender, openDeepDive);
}
