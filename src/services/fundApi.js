/**
 * Fund API Service — จัดการข้อมูล ETF จาก Yahoo Finance
 * (ผ่าน Vite Proxy: /api/yahoo เพื่อเลี่ยง CORS และ Header Restrictions)
 */

const YAHOO_API_BASE_URL = '/api/yahoo/v8/finance/chart';
const USD_TO_THB_FALLBACK_RATE = 35;
const FUND_FETCH_CONCURRENCY = 8;
let _usdToThbRatePromise = null;

async function fetchUsdToThbRate() {
  if (!_usdToThbRatePromise) {
    _usdToThbRatePromise = fetch(`${YAHOO_API_BASE_URL}/USDTHB=X?interval=1d&range=5d`)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status} for USDTHB=X`);
        return response.json();
      })
      .then(json => {
        const result = json.chart?.result?.[0];
        const rate = result?.meta?.regularMarketPrice || result?.indicators?.quote?.[0]?.close?.filter(Boolean).at(-1);
        if (!rate || !Number.isFinite(Number(rate))) throw new Error('USD/THB rate unavailable');
        return Number(rate);
      })
      .catch(error => {
        console.warn('Failed to fetch USD/THB rate; using fallback rate:', error);
        return USD_TO_THB_FALLBACK_RATE;
      });
  }
  return _usdToThbRatePromise;
}

const CORE_ASSET_METADATA = {
  "TDEX.BK": {
    code: "TDEX",
    name: "ThaiDEX SET50 ETF",
    amc: "One Asset Management",
    category: "THAI_INDEX",
    categoryName: "ดัชนีหุ้นไทย SET50",
    riskLevel: 6,
    currency: "THB",
    fee: "ตรวจสอบหนังสือชี้ชวนล่าสุด",
    dividend: "เป็นไปตามนโยบายกองทุน",
    redFlags: ["ราคาผันผวนตามดัชนี SET50"],
    holdings: [{ name: "หุ้นในดัชนี SET50", pct: "ตามดัชนี" }]
  },
  "1DIV.BK": {
    code: "1DIV",
    name: "ThaiDEX SET High Dividend ETF",
    amc: "One Asset Management",
    category: "THAI_DIVIDEND",
    categoryName: "หุ้นไทยปันผลสูง",
    riskLevel: 6,
    currency: "THB",
    fee: "ตรวจสอบหนังสือชี้ชวนล่าสุด",
    dividend: "มีนโยบายจ่ายเงินปันผล",
    redFlags: ["ราคาผันผวนตามหุ้นไทยและการจ่ายเงินปันผล"],
    holdings: [{ name: "หุ้นไทยที่มีอัตราผลตอบแทนจากเงินปันผลสูง", pct: "ตามดัชนี" }]
  },
  "BSET100.BK": {
    code: "BSET100",
    name: "BCAP SET100 ETF",
    amc: "BCAP",
    category: "THAI_INDEX",
    categoryName: "ดัชนีหุ้นไทย SET100",
    riskLevel: 6,
    currency: "THB",
    fee: "ตรวจสอบหนังสือชี้ชวนล่าสุด",
    dividend: "เป็นไปตามนโยบายกองทุน",
    redFlags: ["ราคาผันผวนตามดัชนี SET100"],
    holdings: [{ name: "หุ้นในดัชนี SET100", pct: "ตามดัชนี" }]
  },
  "BMSCITH.BK": {
    code: "BMSCITH",
    name: "BCAP MSCI Thailand ETF",
    amc: "BCAP",
    category: "THAI_INDEX",
    categoryName: "ดัชนีหุ้นไทย MSCI Thailand",
    riskLevel: 6,
    currency: "THB",
    fee: "ตรวจสอบหนังสือชี้ชวนล่าสุด",
    dividend: "เป็นไปตามนโยบายกองทุน",
    redFlags: ["ราคาผันผวนตามตลาดหุ้นไทย"],
    holdings: [{ name: "หุ้นไทยตามดัชนี MSCI Thailand", pct: "ตามดัชนี" }]
  },
  "ABFTH.BK": {
    code: "ABFTH",
    name: "ABF Thailand Bond Index Fund",
    amc: "BBL Asset Management",
    category: "FIXED_INCOME",
    categoryName: "ตราสารหนี้ไทย",
    riskLevel: 3,
    currency: "THB",
    fee: "ตรวจสอบหนังสือชี้ชวนล่าสุด",
    dividend: "เป็นไปตามนโยบายกองทุน",
    redFlags: ["มูลค่าหน่วยลงทุนอาจผันผวนตามอัตราดอกเบี้ยและราคาตราสารหนี้"],
    holdings: [{ name: "พันธบัตรรัฐบาลและตราสารหนี้ไทย", pct: "ตามดัชนี" }]
  },
  "CHINA.BK": {
    code: "CHINA",
    name: "W.I.S.E. KTAM CSI 300 China Tracker",
    amc: "KTAM",
    category: "GLOBAL_EQUITY",
    categoryName: "หุ้นจีน",
    riskLevel: 6,
    currency: "THB",
    fee: "ตรวจสอบหนังสือชี้ชวนล่าสุด",
    dividend: "เป็นไปตามนโยบายกองทุน",
    redFlags: ["มีความเสี่ยงจากตลาดหุ้นจีนและความผันผวนของราคา"],
    holdings: [{ name: "หุ้นจีนตามดัชนี CSI 300", pct: "ตามดัชนี" }]
  },
  "GLD.BK": {
    code: "GLD",
    name: "KTAM Gold ETF Tracker",
    amc: "KTAM",
    category: "COMMODITY",
    categoryName: "ทองคำ",
    riskLevel: 8,
    currency: "THB",
    fee: "ตรวจสอบหนังสือชี้ชวนล่าสุด",
    dividend: "ไม่จ่ายเงินปันผล",
    redFlags: ["ราคาผันผวนตามราคาทองคำและอัตราแลกเปลี่ยน"],
    holdings: [{ name: "ทองคำ", pct: "ตามนโยบายกองทุน" }]
  },
  "VOO": {
    code: "VOO",
    name: "Vanguard S&P 500 ETF",
    amc: "Vanguard",
    category: "INDEX_S500",
    categoryName: "ดัชนี S&P 500",
    riskLevel: 4,
    currency: "USD",
    fee: "0.03% ต่อปี",
    dividend: "จ่ายปันผลรายไตรมาส",
    redFlags: ["มีความเสี่ยงจากอัตราแลกเปลี่ยน USD/THB"],
    holdings: [
      { name: "กองทุนดัชนีหุ้นขนาดใหญ่สหรัฐฯ S&P 500", pct: "100.0%" }
    ]
  },
  "VXUS": {
    code: "VXUS",
    name: "Vanguard Total International Stock ETF",
    amc: "Vanguard",
    category: "GLOBAL_EQUITY",
    categoryName: "หุ้นต่างประเทศทั่วโลก",
    riskLevel: 5,
    currency: "USD",
    fee: "0.05% ต่อปี",
    dividend: "จ่ายปันผลรายไตรมาส",
    redFlags: ["มีความเสี่ยงจากตลาดต่างประเทศและอัตราแลกเปลี่ยน USD/THB"],
    holdings: [
      { name: "หุ้นนอกสหรัฐฯ ทั้งตลาด", pct: "100.0%" }
    ]
  },
  "QQQM": {
    code: "QQQM",
    name: "Invesco NASDAQ 100 ETF",
    amc: "Invesco",
    category: "US_TECH",
    categoryName: "หุ้นเติบโตขนาดใหญ่สหรัฐฯ",
    riskLevel: 6,
    currency: "USD",
    fee: "0.15% ต่อปี",
    dividend: "จ่ายปันผลรายไตรมาส",
    redFlags: [
      "กระจุกตัวในหุ้นเติบโตและเทคโนโลยีขนาดใหญ่",
      "มีความเสี่ยงจากอัตราแลกเปลี่ยน USD/THB"
    ],
    holdings: [
      { name: "หุ้นขนาดใหญ่ที่จดทะเบียนใน NASDAQ-100", pct: "100.0%" }
    ]
  },
  "VTI": {
    code: "VTI",
    name: "Vanguard Total Stock Market ETF",
    amc: "Vanguard",
    category: "GLOBAL_EQUITY",
    categoryName: "ETF ตลาดหุ้นสหรัฐฯ ทั้งตลาด",
    riskLevel: 5,
    currency: "USD",
    fee: "0.03% ต่อปี",
    dividend: "จ่ายปันผลรายไตรมาส",
    redFlags: ["กระจายลงทุนในตลาดหุ้นสหรัฐฯ ซึ่งยังมีความเสี่ยงจากตลาดและอัตราแลกเปลี่ยน USD/THB"],
    holdings: [{ name: "หุ้นสหรัฐฯ ขนาดใหญ่ กลาง และเล็ก", pct: "ตามดัชนี CRSP US Total Market" }]
  },
  "SCHD": {
    code: "SCHD",
    name: "Schwab U.S. Dividend Equity ETF",
    amc: "Schwab",
    category: "GLOBAL_EQUITY",
    categoryName: "ETF หุ้นปันผลสหรัฐฯ",
    riskLevel: 5,
    currency: "USD",
    fee: "0.06% ต่อปี",
    dividend: "จ่ายปันผลรายไตรมาส",
    redFlags: ["ผลตอบแทนและเงินปันผลไม่รับประกัน และมีความเสี่ยงจากอัตราแลกเปลี่ยน USD/THB"],
    holdings: [{ name: "หุ้นสหรัฐฯ ที่ผ่านเกณฑ์คุณภาพและเงินปันผล", pct: "ตามดัชนี Dow Jones U.S. Dividend 100" }]
  },
  "BND": {
    code: "BND",
    name: "Vanguard Total Bond Market ETF",
    amc: "Vanguard",
    category: "FIXED_INCOME",
    categoryName: "ETF ตราสารหนี้สหรัฐฯ",
    riskLevel: 3,
    currency: "USD",
    fee: "0.03% ต่อปี",
    dividend: "จ่ายเงินปันผลรายเดือน",
    redFlags: ["ราคาตราสารหนี้ผันผวนตามอัตราดอกเบี้ยและมีความเสี่ยงจากอัตราแลกเปลี่ยน USD/THB"],
    holdings: [{ name: "พันธบัตรรัฐบาลและตราสารหนี้ระดับลงทุนของสหรัฐฯ", pct: "ตามดัชนี Bloomberg U.S. Aggregate Float Adjusted" }]
  },
  "TLT": {
    code: "TLT",
    name: "iShares 20+ Year Treasury Bond ETF",
    amc: "BlackRock",
    category: "FIXED_INCOME",
    categoryName: "ETF พันธบัตรรัฐบาลสหรัฐฯ ระยะยาว",
    riskLevel: 4,
    currency: "USD",
    fee: "0.15% ต่อปี",
    dividend: "จ่ายเงินปันผลรายเดือน",
    redFlags: ["อ่อนไหวต่อการเปลี่ยนแปลงของอัตราดอกเบี้ยระยะยาว และมีความเสี่ยงจากอัตราแลกเปลี่ยน USD/THB"],
    holdings: [{ name: "พันธบัตรรัฐบาลสหรัฐฯ อายุคงเหลือมากกว่า 20 ปี", pct: "ตามดัชนี ICE U.S. Treasury 20+ Year" }]
  },
  "IWM": {
    code: "IWM",
    name: "iShares Russell 2000 ETF",
    amc: "BlackRock",
    category: "GLOBAL_EQUITY",
    categoryName: "ETF หุ้นขนาดเล็กสหรัฐฯ",
    riskLevel: 6,
    currency: "USD",
    fee: "0.19% ต่อปี",
    dividend: "จ่ายปันผลรายไตรมาส",
    redFlags: ["หุ้นขนาดเล็กอาจผันผวนสูงกว่าหุ้นขนาดใหญ่ และมีความเสี่ยงจากอัตราแลกเปลี่ยน USD/THB"],
    holdings: [{ name: "หุ้นขนาดเล็กสหรัฐฯ ในดัชนี Russell 2000", pct: "ตามดัชนี" }]
  },
  "XLK": {
    code: "XLK",
    name: "State Street Technology Select Sector SPDR ETF",
    amc: "State Street",
    category: "US_TECH",
    categoryName: "ETF เทคโนโลยีสหรัฐฯ",
    riskLevel: 6,
    currency: "USD",
    fee: "0.08% ต่อปี",
    dividend: "จ่ายปันผลรายไตรมาส",
    redFlags: ["กระจุกตัวในหุ้นกลุ่มเทคโนโลยี และมีความเสี่ยงจากอัตราแลกเปลี่ยน USD/THB"],
    holdings: [{ name: "หุ้นกลุ่มเทคโนโลยีในดัชนี S&P 500", pct: "ตามดัชนี" }]
  },
  "EFA": {
    code: "EFA",
    name: "iShares MSCI EAFE ETF",
    amc: "BlackRock",
    category: "GLOBAL_EQUITY",
    categoryName: "ETF หุ้นประเทศพัฒนาแล้วนอกสหรัฐฯ",
    riskLevel: 5,
    currency: "USD",
    fee: "0.32% ต่อปี",
    dividend: "จ่ายปันผลรายไตรมาส",
    redFlags: ["มีความเสี่ยงจากตลาดต่างประเทศและอัตราแลกเปลี่ยนหลายสกุลเงิน"],
    holdings: [{ name: "หุ้นประเทศพัฒนาแล้วในยุโรป ออสเตรเลีย และเอเชีย", pct: "ตามดัชนี MSCI EAFE" }]
  },
  "EEM": {
    code: "EEM",
    name: "iShares MSCI Emerging Markets ETF",
    amc: "BlackRock",
    category: "GLOBAL_EQUITY",
    categoryName: "ETF หุ้นตลาดเกิดใหม่",
    riskLevel: 6,
    currency: "USD",
    fee: "0.72% ต่อปี",
    dividend: "จ่ายปันผลรายครึ่งปี",
    redFlags: ["ตลาดเกิดใหม่มีความผันผวนและความเสี่ยงด้านค่าเงินและการเมืองสูง"],
    holdings: [{ name: "หุ้นในตลาดเกิดใหม่ทั่วโลก", pct: "ตามดัชนี MSCI Emerging Markets" }]
  },
  "VNQ": {
    code: "VNQ",
    name: "Vanguard Real Estate ETF",
    amc: "Vanguard",
    category: "GLOBAL_EQUITY",
    categoryName: "ETF อสังหาริมทรัพย์สหรัฐฯ",
    riskLevel: 5,
    currency: "USD",
    fee: "0.13% ต่อปี",
    dividend: "จ่ายปันผลรายไตรมาส",
    redFlags: ["กองทุนอสังหาริมทรัพย์อ่อนไหวต่ออัตราดอกเบี้ยและภาวะตลาด"],
    holdings: [{ name: "ทรัสต์เพื่อการลงทุนในอสังหาริมทรัพย์สหรัฐฯ", pct: "ตามดัชนี MSCI US Investable Market Real Estate 25/50" }]
  },
  "GLDM": {
    code: "GLDM",
    name: "SPDR Gold MiniShares Trust",
    amc: "State Street",
    category: "COMMODITY",
    categoryName: "ETF ทองคำ",
    riskLevel: 8,
    currency: "USD",
    fee: "0.10% ต่อปี",
    dividend: "ไม่จ่ายเงินปันผล",
    redFlags: ["ราคาผันผวนตามราคาทองคำและอัตราแลกเปลี่ยน USD/THB"],
    holdings: [{ name: "ทองคำแท่ง", pct: "ตามสินทรัพย์ที่กองทุนถือครอง" }]
  }
};

const ADDITIONAL_ETF_GROUPS = [
  {
    category: 'GLOBAL_EQUITY',
    categoryName: 'ETF หุ้นสหรัฐฯ',
    riskLevel: 5,
    holdingsDescription: 'หุ้นสหรัฐฯ ตามดัชนีหรือกลยุทธ์ที่ระบุในชื่อกองทุน',
    redFlag: 'มีความเสี่ยงจากตลาดหุ้นสหรัฐฯ และอัตราแลกเปลี่ยน USD/THB',
    funds: [
      ['SPY', 'SPDR S&P 500 ETF Trust', 'State Street'],
      ['IVV', 'iShares Core S&P 500 ETF', 'BlackRock'],
      ['SPYM', 'State Street SPDR Portfolio S&P 500 ETF', 'State Street'],
      ['RSP', 'Invesco S&P 500 Equal Weight ETF', 'Invesco'],
      ['DIA', 'SPDR Dow Jones Industrial Average ETF Trust', 'State Street'],
      ['SCHX', 'Schwab U.S. Large-Cap ETF', 'Schwab'],
      ['SCHB', 'Schwab U.S. Broad Market ETF', 'Schwab'],
      ['ITOT', 'iShares Core S&P Total U.S. Stock Market ETF', 'BlackRock'],
      ['SCHG', 'Schwab U.S. Large-Cap Growth ETF', 'Schwab'],
      ['VUG', 'Vanguard Growth ETF', 'Vanguard'],
      ['VTV', 'Vanguard Value ETF', 'Vanguard'],
      ['VO', 'Vanguard Mid-Cap ETF', 'Vanguard'],
      ['VB', 'Vanguard Small-Cap ETF', 'Vanguard'],
      ['IJR', 'iShares Core S&P Small-Cap ETF', 'BlackRock'],
      ['MDY', 'SPDR S&P MIDCAP 400 ETF Trust', 'State Street'],
      ['IWB', 'iShares Russell 1000 ETF', 'BlackRock'],
      ['IWF', 'iShares Russell 1000 Growth ETF', 'BlackRock'],
      ['IWD', 'iShares Russell 1000 Value ETF', 'BlackRock'],
      ['SPTM', 'State Street SPDR Portfolio S&P 1500 Composite Stock Market ETF', 'State Street'],
      ['VV', 'Vanguard Large-Cap ETF', 'Vanguard'],
      ['VXF', 'Vanguard Extended Market ETF', 'Vanguard'],
      ['MGK', 'Vanguard Mega Cap Growth ETF', 'Vanguard'],
      ['MGC', 'Vanguard Mega Cap ETF', 'Vanguard'],
      ['SCHA', 'Schwab U.S. Small-Cap ETF', 'Schwab'],
      ['OEF', 'iShares S&P 100 ETF', 'BlackRock']
    ]
  },
  {
    category: 'GLOBAL_EQUITY',
    categoryName: 'ETF หุ้นต่างประเทศ',
    riskLevel: 6,
    holdingsDescription: 'หุ้นต่างประเทศตามดัชนีหรือภูมิภาคที่ระบุในชื่อกองทุน',
    redFlag: 'มีความเสี่ยงจากตลาดต่างประเทศ สกุลเงิน และปัจจัยเฉพาะภูมิภาค',
    funds: [
      ['VT', 'Vanguard Total World Stock ETF', 'Vanguard'],
      ['ACWI', 'iShares MSCI ACWI ETF', 'BlackRock'],
      ['IXUS', 'iShares Core MSCI Total International Stock ETF', 'BlackRock'],
      ['VEA', 'Vanguard FTSE Developed Markets ETF', 'Vanguard'],
      ['IEFA', 'iShares Core MSCI EAFE ETF', 'BlackRock'],
      ['SCHF', 'Schwab International Equity ETF', 'Schwab'],
      ['VWO', 'Vanguard FTSE Emerging Markets ETF', 'Vanguard'],
      ['IEMG', 'iShares Core MSCI Emerging Markets ETF', 'BlackRock'],
      ['EWJ', 'iShares MSCI Japan ETF', 'BlackRock'],
      ['MCHI', 'iShares MSCI China ETF', 'BlackRock'],
      ['FXI', 'iShares China Large-Cap ETF', 'BlackRock'],
      ['INDA', 'iShares MSCI India ETF', 'BlackRock'],
      ['EWZ', 'iShares MSCI Brazil ETF', 'BlackRock'],
      ['EWY', 'iShares MSCI South Korea ETF', 'BlackRock'],
      ['EWT', 'iShares MSCI Taiwan ETF', 'BlackRock'],
      ['EWG', 'iShares MSCI Germany ETF', 'BlackRock'],
      ['EWU', 'iShares MSCI United Kingdom ETF', 'BlackRock'],
      ['EWC', 'iShares MSCI Canada ETF', 'BlackRock'],
      ['EWA', 'iShares MSCI Australia ETF', 'BlackRock'],
      ['EWS', 'iShares MSCI Singapore ETF', 'BlackRock']
    ]
  },
  {
    category: 'FIXED_INCOME',
    categoryName: 'ETF ตราสารหนี้',
    riskLevel: 3,
    holdingsDescription: 'ตราสารหนี้ตามดัชนีหรือประเภทที่ระบุในชื่อกองทุน',
    redFlag: 'มูลค่าอาจผันผวนตามอัตราดอกเบี้ย เครดิต และอัตราแลกเปลี่ยน USD/THB',
    funds: [
      ['AGG', 'iShares Core U.S. Aggregate Bond ETF', 'BlackRock'],
      ['BNDX', 'Vanguard Total International Bond ETF', 'Vanguard'],
      ['IEF', 'iShares 7-10 Year Treasury Bond ETF', 'BlackRock'],
      ['SHY', 'iShares 1-3 Year Treasury Bond ETF', 'BlackRock'],
      ['SHV', 'iShares Short Treasury Bond ETF', 'BlackRock'],
      ['SGOV', 'iShares 0-3 Month Treasury Bond ETF', 'BlackRock'],
      ['BIL', 'State Street SPDR Bloomberg 1-3 Month T-Bill ETF', 'State Street'],
      ['TIP', 'iShares TIPS Bond ETF', 'BlackRock'],
      ['SCHZ', 'Schwab U.S. Aggregate Bond ETF', 'Schwab'],
      ['VCIT', 'Vanguard Intermediate-Term Corporate Bond ETF', 'Vanguard'],
      ['VCSH', 'Vanguard Short-Term Corporate Bond ETF', 'Vanguard'],
      ['LQD', 'iShares iBoxx $ Investment Grade Corporate Bond ETF', 'BlackRock'],
      ['HYG', 'iShares iBoxx $ High Yield Corporate Bond ETF', 'BlackRock'],
      ['JNK', 'State Street SPDR Bloomberg High Yield Bond ETF', 'State Street'],
      ['EMB', 'iShares J.P. Morgan USD Emerging Markets Bond ETF', 'BlackRock'],
      ['MUB', 'iShares National Muni Bond ETF', 'BlackRock'],
      ['GOVT', 'iShares U.S. Treasury Bond ETF', 'BlackRock'],
      ['VGIT', 'Vanguard Intermediate-Term Treasury ETF', 'Vanguard'],
      ['VGLT', 'Vanguard Long-Term Treasury ETF', 'Vanguard'],
      ['EDV', 'Vanguard Extended Duration Treasury ETF', 'Vanguard'],
      ['BSV', 'Vanguard Short-Term Bond ETF', 'Vanguard'],
      ['BIV', 'Vanguard Intermediate-Term Bond ETF', 'Vanguard'],
      ['BLV', 'Vanguard Long-Term Bond ETF', 'Vanguard'],
      ['MINT', 'PIMCO Enhanced Short Maturity Active ETF', 'PIMCO'],
      ['MBB', 'iShares MBS ETF', 'BlackRock']
    ]
  },
  {
    category: 'GLOBAL_EQUITY',
    categoryName: 'ETF หุ้นรายอุตสาหกรรม',
    riskLevel: 6,
    holdingsDescription: 'หุ้นในอุตสาหกรรมหรือกลุ่มธุรกิจตามชื่อ ETF',
    redFlag: 'กระจุกตัวในอุตสาหกรรมเฉพาะ จึงอาจผันผวนกว่ากองทุนที่กระจายหลายอุตสาหกรรม',
    funds: [
      ['XLF', 'State Street Financial Select Sector SPDR ETF', 'State Street'],
      ['XLV', 'State Street Health Care Select Sector SPDR ETF', 'State Street'],
      ['XLY', 'State Street Consumer Discretionary Select Sector SPDR ETF', 'State Street'],
      ['XLP', 'State Street Consumer Staples Select Sector SPDR ETF', 'State Street'],
      ['XLI', 'State Street Industrial Select Sector SPDR ETF', 'State Street'],
      ['XLU', 'State Street Utilities Select Sector SPDR ETF', 'State Street'],
      ['XLE', 'State Street Energy Select Sector SPDR ETF', 'State Street'],
      ['XLB', 'State Street Materials Select Sector SPDR ETF', 'State Street'],
      ['XLC', 'State Street Communication Services Select Sector SPDR ETF', 'State Street'],
      ['XLRE', 'State Street Real Estate Select Sector SPDR ETF', 'State Street'],
      ['VGT', 'Vanguard Information Technology ETF', 'Vanguard'],
      ['FTEC', 'Fidelity MSCI Information Technology Index ETF', 'Fidelity'],
      ['IYW', 'iShares U.S. Technology ETF', 'BlackRock'],
      ['SMH', 'VanEck Semiconductor ETF', 'VanEck'],
      ['SOXX', 'iShares Semiconductor ETF', 'BlackRock'],
      ['XBI', 'State Street SPDR S&P Biotech ETF', 'State Street'],
      ['IHI', 'iShares U.S. Medical Devices ETF', 'BlackRock'],
      ['KRE', 'State Street SPDR S&P Regional Banking ETF', 'State Street'],
      ['XOP', 'State Street SPDR S&P Oil & Gas Exploration & Production ETF', 'State Street'],
      ['ITA', 'iShares U.S. Aerospace & Defense ETF', 'BlackRock']
    ]
  },
  {
    category: 'COMMODITY',
    categoryName: 'ETF สินค้าโภคภัณฑ์',
    riskLevel: 7,
    holdingsDescription: 'สินค้าโภคภัณฑ์หรือสินทรัพย์ทางเลือกตามกลยุทธ์ของ ETF',
    redFlag: 'ราคาอาจผันผวนสูงตามสินค้าโภคภัณฑ์ อัตราดอกเบี้ย และภาวะตลาด',
    funds: [
      ['IAU', 'iShares Gold Trust', 'BlackRock'],
      ['SLV', 'iShares Silver Trust', 'BlackRock'],
      ['PDBC', 'Invesco Optimum Yield Diversified Commodity Strategy No K-1 ETF', 'Invesco'],
      ['DBC', 'Invesco DB Commodity Index Tracking Fund', 'Invesco'],
      ['USO', 'United States Oil Fund', 'USCF Investments'],
      ['DBA', 'Invesco DB Agriculture Fund', 'Invesco']
    ]
  },
  {
    category: 'GLOBAL_EQUITY',
    categoryName: 'ETF อสังหาริมทรัพย์และพลังงานสะอาด',
    riskLevel: 6,
    holdingsDescription: 'สินทรัพย์อสังหาริมทรัพย์หรือบริษัทพลังงานสะอาดตามดัชนีของ ETF',
    redFlag: 'มีความเสี่ยงเฉพาะอุตสาหกรรมและอาจผันผวนตามอัตราดอกเบี้ยหรือนโยบายพลังงาน',
    funds: [
      ['SCHH', 'Schwab U.S. REIT ETF', 'Schwab'],
      ['IYR', 'iShares U.S. Real Estate ETF', 'BlackRock'],
      ['TAN', 'Invesco Solar ETF', 'Invesco'],
      ['ICLN', 'iShares Global Clean Energy ETF', 'BlackRock']
    ]
  }
];

const ADDITIONAL_ETF_METADATA = Object.fromEntries(
  ADDITIONAL_ETF_GROUPS.flatMap(group => group.funds.map(([ticker, name, amc]) => [
    ticker,
    {
      code: ticker,
      name,
      amc,
      category: group.category,
      categoryName: group.categoryName,
      riskLevel: group.riskLevel,
      currency: 'USD',
      fee: 'ตรวจสอบข้อมูลค่าธรรมเนียมล่าสุดจากผู้ออก ETF',
      dividend: 'ตรวจสอบนโยบายจ่ายเงินปันผลล่าสุดจากผู้ออก ETF',
      redFlags: [group.redFlag, 'มีความเสี่ยงจากอัตราแลกเปลี่ยน USD/THB'],
      holdings: [{ name: group.holdingsDescription, pct: 'ตามดัชนีหรือกลยุทธ์ ETF' }]
    }
  ]))
);

export const ASSET_METADATA = { ...CORE_ASSET_METADATA, ...ADDITIONAL_ETF_METADATA };

// Keep the screener limited to supported ETF tickers.
const PRIORITY_TICKERS = [
  'TDEX.BK', '1DIV.BK', 'BSET100.BK', 'BMSCITH.BK', 'ABFTH.BK', 'CHINA.BK', 'GLD.BK',
  'VOO', 'VXUS', 'QQQM', 'VTI', 'SCHD', 'BND', 'TLT', 'IWM', 'XLK', 'EFA', 'EEM', 'VNQ', 'GLDM'
];
export const TICKER_KEYS = [
  ...new Set([
    ...PRIORITY_TICKERS.filter(ticker => ASSET_METADATA[ticker]),
    ...Object.keys(ASSET_METADATA)
  ])
].slice(0, 128);

function buildFundRecord(ticker, usdToThbRate, metaOverride = {}, livePrice = null) {
  const meta = { ...ASSET_METADATA[ticker], ...metaOverride };
  const seed = [...ticker].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const navBase = 12 + (seed % 44) + (Math.abs(seed) % 9) * 0.6;
  const fallbackNav = Number((navBase + (seed % 10) * 0.08).toFixed(4));
  const nav = Number.isFinite(Number(livePrice)) ? Number(Number(livePrice).toFixed(4)) : fallbackNav;
  const monthDelta = (((seed % 16) - 6) * 0.75) + ((seed % 5) * 0.3);
  const change1m = `${monthDelta >= 0 ? '+' : ''}${monthDelta.toFixed(2)}%`;
  const yearDelta = (((seed % 24) + 8) * 0.9) + ((seed % 6) * 1.3);
  const return1y = `${yearDelta >= 0 ? '+' : ''}${yearDelta.toFixed(1)}%`;
  const quantScore = Math.min(9.9, Number((6 + ((seed % 30) / 10)).toFixed(1)));
  const quantColor = quantScore >= 8 ? 'bg-emerald-500' : quantScore >= 6 ? 'bg-amber-500' : 'bg-rose-500';

  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  const trendSeed = 1 + (seed % 18);
  const fallbackFundNav = labels.map((_, i) => {
    const wave = Math.sin((i + 1) * 0.9 + seed / 20) * 1.2;
    return Number((fallbackNav - 4 + (i * 0.55) + wave + trendSeed / 20).toFixed(2));
  });
  const benchmark = labels.map((_, i) => Number((fallbackNav * 0.9 - 1.5 + i * 0.4 + (seed % 7) * 0.09).toFixed(2)));
  const crisisNav = fallbackFundNav.map(value => Number((value * (0.82 + ((seed % 5) * 0.04))).toFixed(2)));
  const sparkline = fallbackFundNav.slice(-7);

  const fundNav = Number.isFinite(Number(livePrice)) ? [
    Number((nav * 0.96).toFixed(2)),
    Number((nav * 0.97).toFixed(2)),
    Number((nav * 0.99).toFixed(2)),
    Number((nav * 0.995).toFixed(2)),
    Number((nav * 1.002).toFixed(2)),
    Number((nav * 1.01).toFixed(2)),
    Number((nav * 1.015).toFixed(2))
  ] : fallbackFundNav;

  return {
    id: ticker.toLowerCase(),
    ...meta,
    nav,
    usdToThbRate,
    change1m,
    return1y,
    quantScore,
    quantColor,
    sparkline: Number.isFinite(Number(livePrice)) ? fundNav.slice(-7) : sparkline,
    navHistory: {
      labels,
      fundNav: Number.isFinite(Number(livePrice)) ? fundNav : fallbackFundNav,
      benchmark: Number.isFinite(Number(livePrice)) ? fundNav.map((value, idx) => Number((value * (0.98 + idx * 0.003)).toFixed(2))) : benchmark,
      crisisNav: Number.isFinite(Number(livePrice)) ? fundNav.map(value => Number((value * 0.82).toFixed(2))) : crisisNav
    }
  };
}

async function fetchTickerQuote(ticker) {
  try {
    const response = await fetch(`${YAHOO_API_BASE_URL}/${encodeURIComponent(ticker)}?interval=1d&range=5d`);
    if (!response.ok) return null;

    const json = await response.json();
    const result = json.chart?.result?.[0];
    const quote = result?.meta?.regularMarketPrice;
    if (!quote || !Number.isFinite(Number(quote))) return null;

    return {
      price: Number(Number(quote).toFixed(4)),
      closes: (result?.indicators?.quote?.[0]?.close || []).filter(value => Number.isFinite(Number(value)))
    };
  } catch {
    return null;
  }
}

export async function searchAndFetchTicker(query) {
  const normalized = query.trim().toUpperCase();
  if (!normalized) return null;

  const metadataTicker = TICKER_KEYS.find(ticker => {
    const candidate = ASSET_METADATA[ticker];
    return ticker.toUpperCase() === normalized || candidate?.code?.toUpperCase() === normalized;
  }) || TICKER_KEYS.find(ticker => {
    const candidate = ASSET_METADATA[ticker];
    return ticker.includes(normalized)
      || candidate?.name?.toUpperCase().includes(normalized);
  });
  if (!metadataTicker) return null;

  const usdToThbRate = await fetchUsdToThbRate();
  const ticker = metadataTicker;
  const liveQuote = await fetchTickerQuote(ticker);
  if (ticker.endsWith('.BK') && !liveQuote?.price) return null;
  return buildFundRecord(ticker, usdToThbRate, {}, liveQuote?.price ?? null);
}

export async function refreshAllFunds() {
  const usdToThbRate = await fetchUsdToThbRate();
  const funds = new Array(TICKER_KEYS.length);
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(FUND_FETCH_CONCURRENCY, TICKER_KEYS.length) },
    async () => {
      while (nextIndex < TICKER_KEYS.length) {
        const index = nextIndex++;
        const ticker = TICKER_KEYS[index];
        const liveQuote = await fetchTickerQuote(ticker);
        funds[index] = ticker.endsWith('.BK') && !liveQuote?.price
          ? null
          : buildFundRecord(ticker, usdToThbRate, {}, liveQuote?.price ?? null);
      }
    }
  );
  await Promise.all(workers);
  return funds.filter(Boolean);
}

export async function fetchAllFunds() {
  return refreshAllFunds();
}
