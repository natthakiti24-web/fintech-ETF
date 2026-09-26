/**
 * Thesis Modal — บันทึกเหตุผลการลงทุนก่อนเพิ่มเข้า Watchtower
 */
import { state, addHolding } from '../data/state.js';
import { refreshIcons } from '../utils/helpers.js';
import { switchTab } from '../utils/router.js';

/** กองทุนที่กำลังจะเพิ่ม */
let _targetFund = null;

/**
 * Mount Thesis Modal — ผูก event listeners
 */
export function mountThesisModal() {
  document.getElementById('btn-close-thesis')?.addEventListener('click', closeThesisModal);
  document.getElementById('btn-confirm-watchtower')?.addEventListener('click', confirmAddToWatchtower);

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
  document.getElementById('thesis-user-input').value = `เชื่อว่ากลุ่ม ${fund.categoryName} จะเติบโตได้ดีในระยะยาว และต้องการ DCA ทุกเดือน`;

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
  const userReason = document.getElementById('thesis-user-input').value.trim() || 'ลงทุนเพื่อการเติบโตระยะยาว';
  addHolding(_targetFund, userReason);
  closeThesisModal();
  switchTab('watchtower');
}
