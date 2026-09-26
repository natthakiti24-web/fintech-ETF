/**
 * FundTwin OS — Main Entry Point
 * 
 * จุดเริ่มต้นของแอปพลิเคชัน
 * - Import styles
 * - ลงทะเบียน Lucide icons
 * - Mount views, modals
 * - ตั้ง tab router callbacks
 */
import './styles/global.css';

// Icons
import { createIcons, icons } from 'lucide';

// Data
import { state } from './data/state.js';
import { fetchAllFunds } from './services/fundApi.js';

// Router
import { switchTab, onTabChange } from './utils/router.js';

// Views
import { mountScreenerView, renderScreener } from './views/screener.js';
import { mountDeepDiveView, loadDeepDive } from './views/deepdive.js';
import { mountWatchtowerView, renderHoldingsDashboard } from './views/watchtower.js';

// Modals
import { mountRiskQuizModal, openRiskQuizModal } from './modals/riskQuiz.js';
import { mountThesisModal } from './modals/thesis.js';

// Components
import { renderFundTable } from './components/fundTable.js';

/* ==================================================================
   Initialize Application
   ================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // 1) Initialize Lucide icons
  createIcons({ icons });

  // 2) Mount all views & modals (attach event listeners)
  mountScreenerView();
  mountDeepDiveView();
  mountWatchtowerView();
  mountRiskQuizModal();
  mountThesisModal();

  // 3) Register tab change callbacks
  onTabChange('screener', renderScreener);
  onTabChange('deepdive', loadDeepDive);
  onTabChange('watchtower', renderHoldingsDashboard);

  // 4) Wire up global navigation buttons
  wireGlobalNavigation();

  // 5) Show loading state
  const tbody = document.getElementById('fund-table-body');
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-slate-500 text-xs font-medium">
      <div class="inline-flex items-center gap-2">
        <svg class="animate-spin h-5 w-5 text-emerald-600 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>กำลังโหลดข้อมูลราคาและ NAV จริง 100% จาก Yahoo Finance API...</span>
      </div>
    </td></tr>`;
  }

  // 6) Fetch real API data & Initial render
  fetchAllFunds().then(funds => {
    state.apiFunds = funds;
    if (funds.length > 0) {
      state.currentSelectedFund = funds[0];
    }
    
    renderFundTable(funds, (fundId) => {
      state.currentSelectedFund = funds.find(f => f.id === fundId) || funds[0];
      switchTab('deepdive');
    });

    // Re-create icons after initial render
    createIcons({ icons });
  });
});

/**
 * ผูกปุ่มต่างๆ ที่อยู่ใน HTML กับฟังก์ชัน routing/modal
 */
function wireGlobalNavigation() {
  // Header nav buttons
  document.getElementById('nav-landing')?.addEventListener('click', () => switchTab('landing'));
  document.getElementById('nav-screener')?.addEventListener('click', () => switchTab('screener'));
  document.getElementById('nav-watchtower')?.addEventListener('click', () => switchTab('watchtower'));

  // Logo click => landing
  document.getElementById('logo-home')?.addEventListener('click', () => switchTab('landing'));

  // Landing CTA buttons
  document.getElementById('cta-start-quiz')?.addEventListener('click', () => openRiskQuizModal());
  document.getElementById('cta-search-funds')?.addEventListener('click', () => switchTab('screener'));

  // Portfolio header pill => watchtower
  document.getElementById('btn-portfolio-header')?.addEventListener('click', () => switchTab('watchtower'));

  // Onboarding banner: ดูกองทุนที่ตรงกับสัดส่วน
  document.getElementById('btn-apply-portfolio')?.addEventListener('click', () => {
    switchTab('screener');
    document.getElementById('filter-category').value = 'US_TECH';
    document.getElementById('filter-category').dispatchEvent(new Event('change'));
  });

  // Onboarding banner: ทำแบบทดสอบใหม่
  document.getElementById('btn-redo-quiz')?.addEventListener('click', () => openRiskQuizModal());

  // Citation modal close
  document.getElementById('btn-close-citation')?.addEventListener('click', () => {
    document.getElementById('modal-citation').classList.add('hidden');
  });
  document.getElementById('btn-close-citation-2')?.addEventListener('click', () => {
    document.getElementById('modal-citation').classList.add('hidden');
  });
}
