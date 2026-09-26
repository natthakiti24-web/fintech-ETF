/**
 * Risk Quiz Modal — แบบประเมินความเสี่ยงและจัดสัดส่วนอัจฉริยะ
 */
import { quizQuestions } from '../data/funds.js';
import { state } from '../data/state.js';
import { refreshIcons } from '../utils/helpers.js';
import { createAllocationChart } from '../components/charts.js';
import { switchTab } from '../utils/router.js';

/**
 * Mount Risk Quiz Modal — ผูก event listeners
 */
export function mountRiskQuizModal() {
  document.getElementById('btn-close-quiz')?.addEventListener('click', closeRiskQuizModal);
  document.getElementById('btn-confirm-quiz')?.addEventListener('click', () => {
    closeRiskQuizModal();
    applyPortfolioFilter();
  });
}

/**
 * เปิด Risk Quiz Modal
 */
export function openRiskQuizModal() {
  state.currentQuizStep = 1;
  state.quizAnswers = {};
  document.getElementById('quiz-title').innerText = 'แบบประเมินความเสี่ยงและจัดสัดส่วนอัจฉริยะ';
  document.getElementById('quiz-step-content').classList.remove('hidden');
  document.getElementById('quiz-result-content').classList.add('hidden');
  renderQuizStep(1);
  document.getElementById('modal-risk-quiz').classList.remove('hidden');
  refreshIcons();
}

/**
 * ปิด Risk Quiz Modal
 */
export function closeRiskQuizModal() {
  document.getElementById('modal-risk-quiz').classList.add('hidden');
}

// --- Private ---

function renderQuizStep(stepNumber) {
  const q = quizQuestions.find(item => item.id === stepNumber);
  if (!q) return;

  // Update progress bar
  for (let i = 1; i <= 4; i++) {
    const bar = document.getElementById(`quiz-step-${i}`);
    bar.className = i <= stepNumber
      ? 'h-1.5 flex-1 rounded-full bg-brand-600 transition-all'
      : 'h-1.5 flex-1 rounded-full bg-slate-200 transition-all';
  }

  const content = document.getElementById('quiz-step-content');
  content.innerHTML = `
    <div class="space-y-4 animate-fadeIn">
      <div>
        <span class="text-[11px] font-bold text-brand-700 uppercase tracking-wide">คำถามข้อที่ ${stepNumber} จาก 4</span>
        <h4 class="text-base sm:text-lg font-bold text-slate-900 mt-1">${q.question}</h4>
        <p class="text-xs text-slate-500">${q.subtext}</p>
      </div>

      <div class="space-y-2.5 pt-2">
        ${q.options.map((opt) => `
          <button data-quiz-score="${opt.score}" data-quiz-step="${stepNumber}"
                  class="quiz-option-btn w-full text-left p-3.5 rounded-2xl border border-slate-200 hover:border-brand-600 hover:bg-brand-50/50 text-xs text-slate-800 transition flex items-center justify-between group">
            <span class="leading-relaxed font-medium">${opt.text}</span>
            <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300 group-hover:text-brand-700 transition"></i>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  // Attach click handlers
  content.querySelectorAll('.quiz-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const score = parseInt(btn.dataset.quizScore);
      const step = parseInt(btn.dataset.quizStep);
      handleQuizAnswer(step, score);
    });
  });

  refreshIcons();
}

function handleQuizAnswer(step, score) {
  state.quizAnswers[step] = score;
  if (step < 4) {
    state.currentQuizStep++;
    renderQuizStep(state.currentQuizStep);
  } else {
    showQuizResults();
  }
}

function showQuizResults() {
  document.getElementById('quiz-step-content').classList.add('hidden');
  document.getElementById('quiz-result-content').classList.remove('hidden');

  const totalScore = Object.values(state.quizAnswers).reduce((a, b) => a + b, 0);

  let profile = {
    title: 'พอร์ตเติบโตสูง (Aggressive Growth)',
    allocation: { tech: 50, thai: 30, debt: 20 },
    desc: 'เน้นโอกาสรับผลตอบแทนสูงจากหุ้นเทคโนโลยีโลก พร้อมกระจายความเสี่ยงด้วยหุ้นไทยและตราสารหนี้'
  };

  if (totalScore <= 6) {
    profile = {
      title: 'พอร์ตเน้นความปลอดภัย (Conservative)',
      allocation: { tech: 15, thai: 25, debt: 60 },
      desc: 'เน้นปกป้องเงินต้น สร้างผลตอบแทนสม่ำเสมอ ผันผวนต่ำ เหมาะกับการออมระยะสั้นถึงกลาง'
    };
  } else if (totalScore <= 9) {
    profile = {
      title: 'พอร์ตเติบโตสมดุล (Balanced Growth)',
      allocation: { tech: 35, thai: 35, debt: 30 },
      desc: 'เน้นความสมดุลระหว่างผลตอบแทนและความปลอดภัย รับความผันผวนได้ปานกลาง'
    };
  }

  document.getElementById('quiz-result-type').innerText = profile.title;
  document.getElementById('result-profile-name').innerText = profile.title;
  document.getElementById('result-profile-desc').innerText = profile.desc;
  document.getElementById('onboarding-result-banner').classList.remove('hidden');

  const breakdown = document.getElementById('quiz-result-breakdown');
  breakdown.innerHTML = `
    <div class="p-2 bg-brand-50 rounded-xl">
      <span class="text-brand-800 font-bold block text-sm">${profile.allocation.tech}%</span>
      <span class="text-slate-600 text-[10px]">หุ้นเทคสหรัฐฯ</span>
    </div>
    <div class="p-2 bg-teal-50 rounded-xl">
      <span class="text-teal-800 font-bold block text-sm">${profile.allocation.thai}%</span>
      <span class="text-slate-600 text-[10px]">หุ้นไทยปันผล</span>
    </div>
    <div class="p-2 bg-slate-100 rounded-xl">
      <span class="text-slate-800 font-bold block text-sm">${profile.allocation.debt}%</span>
      <span class="text-slate-600 text-[10px]">ตราสารหนี้</span>
    </div>
  `;

  // Render doughnut chart
  setTimeout(() => {
    const canvas = document.getElementById('quizAllocationPie');
    if (state.quizChartInstance) {
      state.quizChartInstance.destroy();
    }
    state.quizChartInstance = createAllocationChart(canvas, profile.allocation);
  }, 50);

  refreshIcons();
}

function applyPortfolioFilter() {
  switchTab('screener');
  document.getElementById('filter-category').value = 'US_TECH';
  // Trigger filter
  document.getElementById('filter-category').dispatchEvent(new Event('change'));
}
