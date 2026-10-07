/**
 * Application State — ศูนย์กลางสถานะของแอปทั้งหมด
 * ใช้ reactive pattern ผ่าน event emitter เพื่อให้ views ต่างๆ อัปเดตตาม state
 */

/**
 * Centralized App State
 */
export const state = {
  apiFunds: [],
  currentSelectedFund: null,
  isCrisisActive: false,
  deepdiveChartInstance: null,
  quizChartInstance: null,
  currentQuizStep: 1,
  quizAnswers: {},
  currentRiskFilter: 'ALL',
  recommendedFundIds: null,
  userHoldings: []
};

/**
 * ค้นหากองทุนจาก ID
 * @param {string} fundId 
 * @returns {object|undefined}
 */
export function getFundById(fundId) {
  return state.apiFunds.find(f => f.id === fundId);
}

/**
 * เพิ่มกองทุนเข้า Watchtower
 * @param {object} fund - fund object จาก API
 * @param {string} thesis - เหตุผลในการลงทุน
 * @param {number} investmentAmountThb - มูลค่าเงินลงทุนรวมที่แปลงเป็น THB แล้ว
 */
export function addHolding(fund, thesis, investmentAmountThb) {
  const currency = fund.currency || 'THB';
  const usdToThbRate = Number(fund.usdToThbRate);
  if (!Number.isFinite(investmentAmountThb) || investmentAmountThb <= 0) {
    throw new RangeError('Investment amount must be greater than zero');
  }
  if (currency === 'USD' && (!Number.isFinite(usdToThbRate) || usdToThbRate <= 0)) {
    throw new RangeError('A valid USD/THB exchange rate is required');
  }

  const nav = Number(fund.nav);
  if (!Number.isFinite(nav) || nav <= 0) {
    throw new RangeError('A valid fund NAV is required');
  }
  const purchaseNavThb = currency === 'USD' ? nav * usdToThbRate : nav;
  const existing = state.userHoldings.find(h => h.id === fund.id);
  if (existing) {
    existing.thesis = thesis;
    existing.investedAmountThb = investmentAmountThb;
    existing.purchaseNavThb = purchaseNavThb;
  } else {
    state.userHoldings.push({
      id: fund.id,
      code: fund.code,
      name: fund.name,
      investedAmountThb: investmentAmountThb,
      purchaseNavThb,
      currentNav: fund.nav,
      currency,
      usdToThbRate,
      thesis,
      dateAdded: 'วันนี้',
      driftAlert: false
    });
  }
}

/**
 * ลบกองทุนออกจาก Watchtower
 * @param {number} index 
 */
export function removeHolding(index) {
  state.userHoldings.splice(index, 1);
}
