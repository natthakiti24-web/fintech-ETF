/**
 * Application State — ศูนย์กลางสถานะของแอปทั้งหมด
 * ใช้ reactive pattern ผ่าน event emitter เพื่อให้ views ต่างๆ อัปเดตตาม state
 */

/** กองทุนจริงที่จำลองผู้ใช้เพิ่มเข้า Watchtower */
const _userHoldings = [
  {
    id: 'tdex.bk',
    code: 'TDEX',
    name: 'ThaiDEX SET50 ETF (กองทุนเปิดไทยเด็กซ์เซ็ท 50)',
    units: 5000,
    costNav: 10.20,
    currentNav: 10.69,
    thesis: 'ลงทุนเกาะดัชนีหุ้นไทย SET50 กระจายความเสี่ยงในบริษัทขนาดใหญ่ที่สุด 50 บริษัท',
    dateAdded: '15 ส.ค. 2026',
    driftAlert: false
  },
  {
    id: '1div.bk',
    code: '1DIV',
    name: 'ThaiDEX SET High Dividend ETF',
    units: 3000,
    costNav: 13.80,
    currentNav: 14.50,
    thesis: 'ต้องการกระแสเงินสดจากเงินปันผลสม่ำเสมอ ~4-5% ต่อปีเพื่อเป็น Passive Income',
    dateAdded: '01 ก.ค. 2026',
    driftAlert: false
  },
  {
    id: 'qqq',
    code: 'QQQ',
    name: 'Invesco QQQ Trust (Nasdaq 100)',
    units: 50,
    costNav: 480.00,
    currentNav: 535.20,
    thesis: 'เชื่อมั่นในการเติบโตของ Big Tech และ AI ในระยะยาว 5 ปีข้างหน้า',
    dateAdded: '20 ส.ค. 2026',
    driftAlert: true
  }
];

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
  userHoldings: _userHoldings
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
 */
export function addHolding(fund, thesis) {
  const existing = state.userHoldings.find(h => h.id === fund.id);
  if (existing) {
    existing.thesis = thesis;
  } else {
    state.userHoldings.push({
      id: fund.id,
      code: fund.code,
      name: fund.name,
      units: 1000,
      costNav: fund.nav,
      currentNav: fund.nav,
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
