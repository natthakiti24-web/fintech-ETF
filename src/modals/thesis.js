/**
 * Thesis Modal — บันทึกเหตุผลการลงทุนก่อนเพิ่มเข้า Watchtower
 */
import { state, addHolding } from '../data/state.js';
import { convertToPortfolioThb, formatThbCurrency, refreshIcons } from '../utils/helpers.js';
import { switchTab } from '../utils/router.js';

/** กองทุนที่กำลังจะเพิ่ม */
let _targetFund = null;

/**
 * Mount Thesis Modal — ผูก event listeners
 */
export function mountThesisModal() {
  document.getElementById('btn-close-thesis')?.addEventListener('click', closeThesisModal);
  document.getElementById('btn-confirm-watchtower')?.addEventListener('click', confirmAddToWatchtower);
  document.getElementById('thesis-purchase-price')?.addEventListener('input', updatePurchasePriceThb);

  // Quick fill buttons
  document.querySelectorAll('[data-thesis-example]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('thesis-user-input').value = btn.dataset.thesisExample;
    });
  });
}

/**
 * เปิด Thesis Modal สำหรับกองทุนที่ระบุ
 * @param {object} fund 
 */
export function openThesisModal(fund) {
  _targetFund = fund;
  document.getElementById('thesis-target-code').innerText = fund.code;
  const currentNav = Number(fund.nav);
  document.getElementById('thesis-purchase-price').value = '';
  document.getElementById('thesis-price-currency').innerText = fund.currency || 'THB';
  document.getElementById('thesis-current-nav').innerText =
    Number.isFinite(currentNav) && currentNav > 0
      ? `${currentNav.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${fund.currency || 'THB'}`
      : 'ไม่มีข้อมูล NAV';
  updatePurchasePriceThb();
  document.getElementById('thesis-user-input').value = '';

  // Customize Bull / Bear based on category / asset
  if (fund.category === 'US_TECH') {
    document.getElementById('thesis-bull-text').innerText = `กำไรของกลุ่ม ${fund.code} และ Big Tech โตแกร่ง รับแรงหนุนจากการลงทุน Cloud AI และ Data Center ทั่วโลก`;
    document.getElementById('thesis-bear-text').innerText = `Valuation Forward P/E อยู่ในเกณฑ์สูง หากผลประกอบการเติบโตช้ากว่าคาด หุ้นมีโอกาสปรับฐานรุนแรง`;
  } else if (fund.category === 'THAI_DIVIDEND' || fund.category === 'INDEX_S500') {
    document.getElementById('thesis-bull-text').innerText = `สินทรัพย์ ${fund.code} กระจายการลงทุนในบริษัทชั้นนำ มีเงินปันผลสม่ำเสมอช่วยลดความผันผวนของพอร์ต`;
    document.getElementById('thesis-bear-text').innerText = `อัตราการเติบโตอาจไม่หวือหวาเท่าหุ้นเทคโนโลยี และผันผวนตามทิศทางเศรษฐกิจมหภาค`;
  } else if (fund.code === 'GLD') {
    document.getElementById('thesis-bull-text').innerText = `ทองคำแท่งแท้เป็น Safe Haven ป้องกันความเสี่ยงจากเงินเฟ้อและความตึงเครียดทางภูมิรัฐศาสตร์`;
    document.getElementById('thesis-bear-text').innerText = `ทองคำไม่จ่ายเงินปันผลหรือดอกเบี้ย ผลตอบแทนขึ้นอยู่กับส่วนต่างราคาซื้อขายล้วนๆ`;
  } else {
    document.getElementById('thesis-bull-text').innerText = `กระจายความเสี่ยงข้ามอุตสาหกรรมในพอร์ตการลงทุนระดับสากล สร้างผลตอบแทนสมดุล`;
    document.getElementById('thesis-bear-text').innerText = `เผชิญความผันผวนจากอัตราแลกเปลี่ยนและสภาวะตลาดการเงินโลก`;
  }

  document.getElementById('modal-thesis').classList.remove('hidden');
  refreshIcons();
}

/**
 * ปิด Thesis Modal
 */
export function closeThesisModal() {
  document.getElementById('modal-thesis').classList.add('hidden');
}

// --- Private ---

function confirmAddToWatchtower() {
  if (!_targetFund) return;
  const priceInput = document.getElementById('thesis-purchase-price');
  if (!priceInput.reportValidity()) return;

  const investmentAmount = Number(priceInput.value);
  if (!Number.isFinite(investmentAmount) || investmentAmount <= 0) return;

  const investmentAmountThb = updatePurchasePriceThb();
  if (!investmentAmountThb) return;

  const userReason = document.getElementById('thesis-user-input').value.trim();
  addHolding(_targetFund, userReason, investmentAmountThb);
  closeThesisModal();
  switchTab('watchtower');
}

function updatePurchasePriceThb() {
  const priceInput = document.getElementById('thesis-purchase-price');
  const preview = document.getElementById('thesis-purchase-price-thb');
  if (!_targetFund || !priceInput || !preview) return;

  const investmentAmount = Number(priceInput.value);
  const currency = _targetFund.currency || 'THB';
  const usdToThbRate = Number(_targetFund.usdToThbRate);
  if (!Number.isFinite(investmentAmount) || investmentAmount <= 0) {
    priceInput.setCustomValidity('');
    preview.innerText = '';
    return null;
  }
  if (currency === 'USD' && (!Number.isFinite(usdToThbRate) || usdToThbRate <= 0)) {
    priceInput.setCustomValidity('ไม่พบอัตราแลกเปลี่ยน USD/THB');
    preview.innerText = 'ไม่พบอัตราแลกเปลี่ยน USD/THB';
    return null;
  }

  priceInput.setCustomValidity('');
  const amountThb = Math.round(convertToPortfolioThb(investmentAmount, currency, usdToThbRate) * 100) / 100;
  if (!Number.isFinite(amountThb) || amountThb <= 0) {
    preview.innerText = '';
    return null;
  }

  preview.innerText = `มูลค่าที่บันทึกในพอร์ต: ${formatThbCurrency(amountThb)}`;
  return amountThb;
}
