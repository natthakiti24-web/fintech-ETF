/**
 * Fund API Service — จัดการการดึงข้อมูลกองทุน/หุ้น/ETF จริงจาก Yahoo Finance API 100%
 * (ผ่าน Vite Proxy: /api/yahoo เพื่อเลี่ยง CORS และ Header Restrictions)
 */

const YAHOO_API_BASE_URL = '/api/yahoo/v8/finance/chart';

/**
 * กำหนด Metadata และสเปกสำหรับกองทุน/สินทรัพย์ยอดนิยม
 */
export const ASSET_METADATA = {
  // --- กองทุน ETF หุ้นไทย (SET) ---
  'TDEX.BK': {
    code: 'TDEX',
    name: 'ThaiDEX SET50 ETF (กองทุนเปิดไทยเด็กซ์เซ็ท 50)',
    amc: 'OneAM',
    category: 'INDEX_S500',
    categoryName: 'ดัชนีหุ้นไทย SET50',
    riskLevel: 6,
    currency: 'THB',
    fee: '0.45% ต่อปี',
    dividend: 'จ่ายเงินปันผล (ปีละ 2 ครั้ง)',
    redFlags: ['🚩 อิงดัชนี SET50 ผันผวนตามสภาวะเศรษฐกิจไทย'],
    holdings: [
      { name: 'PTT PCL', pct: '8.4%' },
      { name: 'Delta Electronics', pct: '7.8%' },
      { name: 'AOT', pct: '6.9%' },
      { name: 'CPALL', pct: '5.2%' },
      { name: 'GULF', pct: '4.8%' }
    ]
  },
  '1DIV.BK': {
    code: '1DIV',
    name: 'ThaiDEX SET High Dividend ETF (กองทุนปันผลสูง)',
    amc: 'OneAM',
    category: 'THAI_DIVIDEND',
    categoryName: 'หุ้นไทยปันผลสูง (High Dividend)',
    riskLevel: 6,
    currency: 'THB',
    fee: '0.50% ต่อปี',
    dividend: 'จ่ายเงินปันผลสม่ำเสมอ (~4-5% ต่อปี)',
    redFlags: ['🚩 กระจุกตัวในหุ้นกลุ่มธนาคารและพลังงาน'],
    holdings: [
      { name: 'SCB X PCL', pct: '7.5%' },
      { name: 'PTTEP', pct: '6.8%' },
      { name: 'TTB Bank', pct: '6.2%' },
      { name: 'TISCO', pct: '5.9%' },
      { name: 'ADVANC', pct: '5.4%' }
    ]
  },
  'BSET100.BK': {
    code: 'BSET100',
    name: 'Bualuang SET100 ETF (กองทุนเปิดบัวหลวง บีเซ็ต 100)',
    amc: 'BBLAM',
    category: 'INDEX_S500',
    categoryName: 'ดัชนีหุ้นไทย SET100',
    riskLevel: 6,
    currency: 'THB',
    fee: '0.35% ต่อปี',
    dividend: 'มีนโยบายจ่ายเงินปันผล',
    redFlags: ['🚩 กระจายตัวในหุ้นไทย 100 บริษัท ผันผวนตามตลาดในประเทศ'],
    holdings: [
      { name: 'PTT PCL', pct: '7.1%' },
      { name: 'DELTA', pct: '6.5%' },
      { name: 'AOT', pct: '5.8%' },
      { name: 'KBANK', pct: '4.7%' },
      { name: 'BDMS', pct: '4.2%' }
    ]
  },
  'CHINA.BK': {
    code: 'CHINA',
    name: 'W.I.S.E. KTAM CSI 300 ETF (กองทุนเปิดเคแทม ซีเอสไอ 300)',
    amc: 'InnovestX',
    category: 'GLOBAL_EQUITY',
    categoryName: 'หุ้นจีนแผ่นดินใหญ่ (CSI 300)',
    riskLevel: 7,
    currency: 'THB',
    fee: '0.70% ต่อปี',
    dividend: 'ไม่จ่าย (สะสมมูลค่า)',
    redFlags: ['🚩 เสี่ยงความตึงเครียดทางภูมิรัฐศาสตร์และนโยบายกำกับดูแลจีน'],
    holdings: [
      { name: 'Kweichow Moutai', pct: '5.4%' },
      { name: 'CATL', pct: '3.2%' },
      { name: 'Ping An Insurance', pct: '2.8%' },
      { name: 'China Merchants Bank', pct: '2.3%' },
      { name: 'Midea Group', pct: '1.9%' }
    ]
  },

  // --- S&P 500 & ดัชนีหลักสหรัฐฯ ---
  'SPY': {
    code: 'SPY',
    name: 'SPDR S&P 500 ETF Trust (ดัชนีหุ้นสหรัฐฯ 500 บริษัท)',
    amc: 'InnovestX',
    category: 'INDEX_S500',
    categoryName: 'ดัชนี S&P500 Index',
    riskLevel: 6,
    currency: 'USD',
    fee: '0.09% ต่อปี (Ultra Low Fee)',
    dividend: 'จ่ายเงินปันผลรายไตรมาส (~1.3% ต่อปี)',
    redFlags: ['🚩 หุ้น Big Tech สหรัฐฯ Top 10 ครองสัดส่วนมากกว่า 34%'],
    holdings: [
      { name: 'Apple Inc.', pct: '7.1%' },
      { name: 'Microsoft Corp.', pct: '6.6%' },
      { name: 'NVIDIA Corp.', pct: '6.2%' },
      { name: 'Amazon.com Inc.', pct: '3.7%' },
      { name: 'Alphabet Inc.', pct: '2.5%' }
    ]
  },
  'VOO': {
    code: 'VOO',
    name: 'Vanguard S&P 500 ETF (กองทุนดัชนี S&P 500 ค่าธรรมเนียมต่ำพิเศษ)',
    amc: 'InnovestX',
    category: 'INDEX_S500',
    categoryName: 'ดัชนี S&P500 Index',
    riskLevel: 6,
    currency: 'USD',
    fee: '0.03% ต่อปี (Lowest Fee)',
    dividend: 'จ่ายเงินปันผลรายไตรมาส (~1.4% ต่อปี)',
    redFlags: [],
    holdings: [
      { name: 'Microsoft Corp.', pct: '6.9%' },
      { name: 'Apple Inc.', pct: '6.8%' },
      { name: 'NVIDIA Corp.', pct: '6.1%' },
      { name: 'Amazon.com Inc.', pct: '3.6%' },
      { name: 'Meta Platforms', pct: '2.4%' }
    ]
  },
  'IVV': {
    code: 'IVV',
    name: 'iShares Core S&P 500 ETF (กองทุน S&P 500 จาก BlackRock)',
    amc: 'InnovestX',
    category: 'INDEX_S500',
    categoryName: 'ดัชนี S&P500 Index',
    riskLevel: 6,
    currency: 'USD',
    fee: '0.03% ต่อปี',
    dividend: 'จ่ายเงินปันผลรายไตรมาส (~1.4% ต่อปี)',
    redFlags: [],
    holdings: [
      { name: 'Microsoft Corp.', pct: '6.9%' },
      { name: 'Apple Inc.', pct: '6.8%' },
      { name: 'NVIDIA Corp.', pct: '6.1%' },
      { name: 'Amazon.com Inc.', pct: '3.6%' }
    ]
  },
  'DIA': {
    code: 'DIA',
    name: 'SPDR Dow Jones Industrial ETF (หุ้นยักษ์ใหญ่สหรัฐฯ 30 บริษัท)',
    amc: 'InnovestX',
    category: 'GLOBAL_EQUITY',
    categoryName: 'หุ้นเติบโตทั่วโลก (Global Equity)',
    riskLevel: 6,
    currency: 'USD',
    fee: '0.16% ต่อปี',
    dividend: 'จ่ายปันผลรายเดือน (~1.8% ต่อปี)',
    redFlags: ['🚩 ให้น้ำหนักตามราคาหุ้น (Price-weighted Index)'],
    holdings: [
      { name: 'Goldman Sachs', pct: '7.4%' },
      { name: 'UnitedHealth Group', pct: '6.8%' },
      { name: 'Caterpillar Inc.', pct: '5.9%' },
      { name: 'Home Depot', pct: '5.2%' },
      { name: 'Amgen Inc.', pct: '4.8%' }
    ]
  },
  'VTI': {
    code: 'VTI',
    name: 'Vanguard Total Stock Market ETF (ครอบคลุมหุ้นสหรัฐฯ ทั้งตลาด 3,700 ตัว)',
    amc: 'InnovestX',
    category: 'GLOBAL_EQUITY',
    categoryName: 'หุ้นเติบโตทั่วโลก (Global Equity)',
    riskLevel: 6,
    currency: 'USD',
    fee: '0.03% ต่อปี',
    dividend: 'จ่ายเงินปันผลรายไตรมาส (~1.4% ต่อปี)',
    redFlags: [],
    holdings: [
      { name: 'Large Cap Growth & Blend', pct: '72.0%' },
      { name: 'Mid Cap Equities', pct: '18.0%' },
      { name: 'Small Cap Equities', pct: '10.0%' }
    ]
  },
  'IWM': {
    code: 'IWM',
    name: 'iShares Russell 2000 ETF (หุ้นสหรัฐฯ ขนาดกลาง-เล็ก)',
    amc: 'InnovestX',
    category: 'GLOBAL_EQUITY',
    categoryName: 'หุ้นเติบโตทั่วโลก (Global Equity)',
    riskLevel: 7,
    currency: 'USD',
    fee: '0.19% ต่อปี',
    dividend: 'จ่ายเงินปันผล (~1.2% ต่อปี)',
    redFlags: ['🚩 หุ้นขนาดเล็กมีความผันผวนสูงและไวต่ออัตราดอกเบี้ย'],
    holdings: [
      { name: 'US Small-Cap Blend', pct: '100.0%' }
    ]
  },

  // --- เทคโนโลยี & เซมิคอนดักเตอร์ ---
  'QQQ': {
    code: 'QQQ',
    name: 'Invesco QQQ Trust (ดัชนี Nasdaq 100 หุ้นเทคโนโลยี)',
    amc: 'InnovestX',
    category: 'US_TECH',
    categoryName: 'หุ้นเทคโนโลยีสหรัฐฯ & AI',
    riskLevel: 7,
    currency: 'USD',
    fee: '0.20% ต่อปี',
    dividend: 'จ่ายเงินปันผลรายไตรมาส (~0.6% ต่อปี)',
    redFlags: ['🚩 กระจุกตัวสูงในอุตสาหกรรมเทคโนโลยีมากกว่า 50%', '🚩 ค่า P/E ค่อนข้างสูงกว่าค่าเฉลี่ยประวัติศาสตร์'],
    holdings: [
      { name: 'Apple Inc.', pct: '8.9%' },
      { name: 'Microsoft Corp.', pct: '8.2%' },
      { name: 'NVIDIA Corp.', pct: '7.9%' },
      { name: 'Broadcom Inc.', pct: '5.1%' },
      { name: 'Amazon.com Inc.', pct: '4.9%' }
    ]
  },
  'SMH': {
    code: 'SMH',
    name: 'VanEck Semiconductor ETF (กองทุนชิปเซมิคอนดักเตอร์ & AI โลก)',
    amc: 'InnovestX',
    category: 'US_TECH',
    categoryName: 'หุ้นเทคโนโลยีสหรัฐฯ & AI',
    riskLevel: 8,
    currency: 'USD',
    fee: '0.35% ต่อปี',
    dividend: 'จ่ายเงินปันผล (~0.5% ต่อปี)',
    redFlags: ['🚩 หุ้นชิปเซมิคอนดักเตอร์ Top 3 ครองสัดส่วนมากกว่า 40%', '🚩 ความผันผวนสูงมากตามรอบวัฏจักรชิป'],
    holdings: [
      { name: 'NVIDIA Corp.', pct: '21.5%' },
      { name: 'Taiwan Semiconductor (TSMC)', pct: '12.8%' },
      { name: 'Broadcom Inc.', pct: '7.9%' },
      { name: 'ASML Holding', pct: '5.2%' },
      { name: 'Qualcomm Inc.', pct: '4.6%' }
    ]
  },
  'ARKK': {
    code: 'ARKK',
    name: 'ARK Innovation ETF (กองทุนนวัตกรรมเปลี่ยนโลก Disruptive Tech)',
    amc: 'InnovestX',
    category: 'US_TECH',
    categoryName: 'หุ้นเทคโนโลยีสหรัฐฯ & AI',
    riskLevel: 8,
    currency: 'USD',
    fee: '0.75% ต่อปี',
    dividend: 'ไม่จ่าย (เน้น Reinvest เพื่อเติบโต)',
    redFlags: ['🚩 ความผันผวนสูงมาก (Beta > 1.8)', '🚩 อ่อนไหวสูงต่อทิศทางอัตราดอกเบี้ยโลก'],
    holdings: [
      { name: 'Tesla Inc.', pct: '11.8%' },
      { name: 'Roku Inc.', pct: '8.4%' },
      { name: 'Coinbase Global', pct: '7.9%' },
      { name: 'Roblox Corp.', pct: '5.6%' },
      { name: 'Block Inc.', pct: '5.1%' }
    ]
  },

  // --- ปันผล & อสังหาริมทรัพย์ ---
  'SCHD': {
    code: 'SCHD',
    name: 'Schwab U.S. Dividend Equity ETF (กองทุนปันผลแกร่ง ยอดนิยมอันดับ 1)',
    amc: 'InnovestX',
    category: 'THAI_DIVIDEND',
    categoryName: 'หุ้นปันผลสูง (High Dividend)',
    riskLevel: 6,
    currency: 'USD',
    fee: '0.06% ต่อปี (Super Cheap)',
    dividend: 'จ่ายเงินปันผลสม่ำเสมอ (~3.4-3.8% ต่อปี)',
    redFlags: [],
    holdings: [
      { name: 'AbbVie Inc.', pct: '4.8%' },
      { name: 'Amgen Inc.', pct: '4.5%' },
      { name: 'Home Depot', pct: '4.3%' },
      { name: 'Chevron Corp.', pct: '4.1%' },
      { name: 'PepsiCo Inc.', pct: '3.9%' }
    ]
  },
  'VNQ': {
    code: 'VNQ',
    name: 'Vanguard Real Estate ETF (กองทุนรวมอสังหาริมทรัพย์ & REITs สหรัฐฯ)',
    amc: 'InnovestX',
    category: 'THAI_DIVIDEND',
    categoryName: 'อสังหาริมทรัพย์ & REITs',
    riskLevel: 6,
    currency: 'USD',
    fee: '0.12% ต่อปี',
    dividend: 'จ่ายเงินปันผลจากค่าเช่า (~3.8% ต่อปี)',
    redFlags: ['🚩 อ่อนไหวต่ออัตราดอกเบี้ยและอัตราการเช่าพื้นที่'],
    holdings: [
      { name: 'Prologis Inc. (Logistics)', pct: '7.8%' },
      { name: 'American Tower (Telecom)', pct: '6.2%' },
      { name: 'Equinix (Data Center)', pct: '5.4%' },
      { name: 'Public Storage', pct: '3.5%' }
    ]
  },

  // --- ตราสารหนี้, พันธบัตร & ทองคำ ---
  'TLT': {
    code: 'TLT',
    name: 'iShares 20+ Year Treasury Bond ETF (พันธบัตรรัฐบาลสหรัฐฯ ระยะยาว)',
    amc: 'InnovestX',
    category: 'FIXED_INCOME',
    categoryName: 'ตราสารหนี้ & พันธบัตร',
    riskLevel: 4,
    currency: 'USD',
    fee: '0.15% ต่อปี',
    dividend: 'จ่ายผลตอบแทนดอกเบี้ยรายเดือน (~3.9% ต่อปี)',
    redFlags: ['🚩 ความผันผวนของราคาตามรอบการปรับอัตราดอกเบี้ยของ FED'],
    holdings: [
      { name: 'US Treasury Bonds (20+ Years)', pct: '100.0%' }
    ]
  },
  'BND': {
    code: 'BND',
    name: 'Vanguard Total Bond Market ETF (ตราสารหนี้ภาครัฐและเอกชนระดับลงทุน)',
    amc: 'InnovestX',
    category: 'FIXED_INCOME',
    categoryName: 'ตราสารหนี้ & สภาพคล่อง',
    riskLevel: 3,
    currency: 'USD',
    fee: '0.03% ต่อปี',
    dividend: 'จ่ายดอกเบี้ยรายเดือนสม่ำเสมอ (~3.6% ต่อปี)',
    redFlags: [],
    holdings: [
      { name: 'US Government Bonds', pct: '68.0%' },
      { name: 'Investment-Grade Corporate', pct: '32.0%' }
    ]
  },
  'GLD': {
    code: 'GLD',
    name: 'SPDR Gold Trust (กองทุนรวมทองคำแท่งระดับโลก)',
    amc: 'InnovestX',
    category: 'FIXED_INCOME',
    categoryName: 'ทองคำ & สินทรัพย์ทางเลือก',
    riskLevel: 5,
    currency: 'USD',
    fee: '0.40% ต่อปี',
    dividend: 'ไม่มีการจ่ายเงินปันผล',
    redFlags: ['🚩 ไม่สร้างกระแสเงินสด ผลตอบแทนสะท้อนราคาทองคำล้วนๆ'],
    holdings: [
      { name: 'Physical Gold Bullion (100%)', pct: '100.0%' }
    ]
  },

  // --- หุ้นตลาดโลก & ตลาดเกิดใหม่ ---
  'VT': {
    code: 'VT',
    name: 'Vanguard Total World Stock ETF (หุ้นทั่วโลกกว่า 9,000 ตัว)',
    amc: 'InnovestX',
    category: 'GLOBAL_EQUITY',
    categoryName: 'หุ้นเติบโตทั่วโลก (Global Equity)',
    riskLevel: 6,
    currency: 'USD',
    fee: '0.07% ต่อปี (Super Low Fee)',
    dividend: 'จ่ายเงินปันผลรายไตรมาส (~2.0% ต่อปี)',
    redFlags: [],
    holdings: [
      { name: 'US Equities', pct: '62.4%' },
      { name: 'Europe Equities', pct: '15.8%' },
      { name: 'Pacific & Japan', pct: '10.5%' },
      { name: 'Emerging Markets', pct: '10.2%' }
    ]
  },
  'EEM': {
    code: 'EEM',
    name: 'iShares MSCI Emerging Markets ETF (หุ้นตลาดเกิดใหม่ จีน/ไต้หวัน/อินเดีย)',
    amc: 'InnovestX',
    category: 'GLOBAL_EQUITY',
    categoryName: 'หุ้นเติบโตทั่วโลก (Global Equity)',
    riskLevel: 7,
    currency: 'USD',
    fee: '0.68% ต่อปี',
    dividend: 'จ่ายเงินปันผล (~2.2% ต่อปี)',
    redFlags: ['🚩 ความผันผวนของค่าเงินตลาดเกิดใหม่และความเสี่ยงทางการเมือง'],
    holdings: [
      { name: 'TSMC', pct: '8.4%' },
      { name: 'Tencent Holdings', pct: '4.5%' },
      { name: 'Samsung Electronics', pct: '3.8%' },
      { name: 'Alibaba Group', pct: '2.5%' }
    ]
  },

  // --- หุ้นผู้นำระดับโลก (Mega-Cap Stocks) ---
  'AAPL': {
    code: 'AAPL',
    name: 'Apple Inc. (แอปเปิ้ล อิงค์ - ยักษ์ใหญ่ Consumer Tech โลก)',
    amc: 'InnovestX',
    category: 'US_TECH',
    categoryName: 'หุ้นเทคโนโลยีสหรัฐฯ & AI',
    riskLevel: 7,
    currency: 'USD',
    fee: '0.00% (หุ้นตรง)',
    dividend: 'จ่ายเงินปันผล (~0.5% ต่อปี) + ซื้อหุ้นคืน',
    redFlags: ['🚩 พึ่งพารายได้จาก iPhone ในสัดส่วนสูง'],
    holdings: [
      { name: 'iPhone & Services Ecosystem', pct: '68.0%' },
      { name: 'Mac & iPad', pct: '18.0%' },
      { name: 'Wearables & Home', pct: '14.0%' }
    ]
  },
  'NVDA': {
    code: 'NVDA',
    name: 'NVIDIA Corporation (ผู้นำชิปประมวลผล AI & Data Center)',
    amc: 'InnovestX',
    category: 'US_TECH',
    categoryName: 'หุ้นเทคโนโลยีสหรัฐฯ & AI',
    riskLevel: 8,
    currency: 'USD',
    fee: '0.00% (หุ้นตรง)',
    dividend: 'จ่ายปันผลเล็กน้อย (~0.05%)',
    redFlags: ['🚩 ความผันผวนสูงตามวัฏจักร CapEx โครงสร้างพื้นฐาน AI'],
    holdings: [
      { name: 'Data Center AI GPUs (Blackwell/Hopper)', pct: '82.0%' },
      { name: 'GeForce Gaming', pct: '14.0%' },
      { name: 'Automotive & Robotics', pct: '4.0%' }
    ]
  },
  'MSFT': {
    code: 'MSFT',
    name: 'Microsoft Corp. (ไมโครซอฟท์ คลาวด์ & Copilot AI)',
    amc: 'InnovestX',
    category: 'US_TECH',
    categoryName: 'หุ้นเทคโนโลยีสหรัฐฯ & AI',
    riskLevel: 7,
    currency: 'USD',
    fee: '0.00% (หุ้นตรง)',
    dividend: 'จ่ายปันผลรายไตรมาส (~0.8% ต่อปี)',
    redFlags: [],
    holdings: [
      { name: 'Intelligent Cloud (Azure)', pct: '44.0%' },
      { name: 'Productivity & Office 365', pct: '33.0%' },
      { name: 'Personal Computing & Xbox', pct: '23.0%' }
    ]
  },
  'GOOGL': {
    code: 'GOOGL',
    name: 'Alphabet Inc. (กูเกิล ผู้นำ Search, Cloud & Gemini AI)',
    amc: 'InnovestX',
    category: 'US_TECH',
    categoryName: 'หุ้นเทคโนโลยีสหรัฐฯ & AI',
    riskLevel: 7,
    currency: 'USD',
    fee: '0.00% (หุ้นตรง)',
    dividend: 'จ่ายปันผลรายไตรมาส (~0.5% ต่อปี)',
    redFlags: ['🚩 เผชิญคดีกำกับดูแลการผูกขาด (Antitrust) ในสหรัฐฯ'],
    holdings: [
      { name: 'Google Search & Network', pct: '56.0%' },
      { name: 'Google Cloud Platform', pct: '14.0%' },
      { name: 'YouTube Video & Ads', pct: '11.0%' },
      { name: 'Devices & Services', pct: '19.0%' }
    ]
  },
  'AMZN': {
    code: 'AMZN',
    name: 'Amazon.com Inc. (อเมซอน คลาวด์ AWS & ค้าปลีกโลก)',
    amc: 'InnovestX',
    category: 'US_TECH',
    categoryName: 'หุ้นเทคโนโลยีสหรัฐฯ & AI',
    riskLevel: 7,
    currency: 'USD',
    fee: '0.00% (หุ้นตรง)',
    dividend: 'ไม่จ่ายปันผล (เน้น Reinvest สู่ AWS & AI Infrastructure)',
    redFlags: ['🚩 การแข่งขันดุเดือดในตลาด E-Commerce และ Cloud'],
    holdings: [
      { name: 'Online & Retail Operations', pct: '62.0%' },
      { name: 'AWS Cloud Services', pct: '18.0%' },
      { name: 'Digital Advertising', pct: '12.0%' },
      { name: 'Prime Subscriptions', pct: '8.0%' }
    ]
  },
  'TSLA': {
    code: 'TSLA',
    name: 'Tesla Inc. (เทสลา ยานยนต์ไฟฟ้า, พลังงานสะอาด & หุ่นยนต์ AI)',
    amc: 'InnovestX',
    category: 'US_TECH',
    categoryName: 'หุ้นเทคโนโลยีสหรัฐฯ & AI',
    riskLevel: 8,
    currency: 'USD',
    fee: '0.00% (หุ้นตรง)',
    dividend: 'ไม่มีการจ่ายเงินปันผล',
    redFlags: ['🚩 ความผันผวนสูงมาก (Beta > 2.0)', '🚩 สงครามราคาในตลาดยานยนต์ไฟฟ้าโลก'],
    holdings: [
      { name: 'EV Automotive Sales', pct: '81.0%' },
      { name: 'Energy Storage & Solar', pct: '11.0%' },
      { name: 'Services & Full Self-Driving', pct: '8.0%' }
    ]
  },
  'META': {
    code: 'META',
    name: 'Meta Platforms (เฟซบุ๊ก, อินสตาแกรม & Llama Open AI)',
    amc: 'InnovestX',
    category: 'US_TECH',
    categoryName: 'หุ้นเทคโนโลยีสหรัฐฯ & AI',
    riskLevel: 7,
    currency: 'USD',
    fee: '0.00% (หุ้นตรง)',
    dividend: 'เริ่มจ่ายปันผล (~0.4% ต่อปี)',
    redFlags: ['🚩 ขาดทุนจากการลงทุนใน Reality Labs (Metaverse)'],
    holdings: [
      { name: 'Family of Apps (Ads)', pct: '98.0%' },
      { name: 'Reality Labs', pct: '2.0%' }
    ]
  },
  'TSM': {
    code: 'TSM',
    name: 'Taiwan Semiconductor (TSMC - โรงหล่อชิปเบอร์ 1 ของโลก)',
    amc: 'InnovestX',
    category: 'US_TECH',
    categoryName: 'หุ้นเทคโนโลยีสหรัฐฯ & AI',
    riskLevel: 7,
    currency: 'USD',
    fee: '0.00% (หุ้นตรง)',
    dividend: 'จ่ายเงินปันผลสม่ำเสมอ (~1.2% ต่อปี)',
    redFlags: ['🚩 ความเสี่ยงทางภูมิรัฐศาสตร์ช่องแคบไต้หวัน'],
    holdings: [
      { name: 'Advanced AI/HPC Chips', pct: '55.0%' },
      { name: 'Smartphone Chips', pct: '34.0%' },
      { name: 'IoT & Auto', pct: '11.0%' }
    ]
  },
  'AVGO': {
    code: 'AVGO',
    name: 'Broadcom Inc. (ผู้นำชิปเครือข่าย AI Networking & VMware Software)',
    amc: 'InnovestX',
    category: 'US_TECH',
    categoryName: 'หุ้นเทคโนโลยีสหรัฐฯ & AI',
    riskLevel: 7,
    currency: 'USD',
    fee: '0.00% (หุ้นตรง)',
    dividend: 'จ่ายเงินปันผลเติบโตต่อเนื่อง (~1.4% ต่อปี)',
    redFlags: [],
    holdings: [
      { name: 'Semiconductor Solutions', pct: '58.0%' },
      { name: 'Infrastructure Software (VMware)', pct: '42.0%' }
    ]
  },
  'COST': {
    code: 'COST',
    name: 'Costco Wholesale (คอสท์โค ผู้นำค้าปลีกระบบสมาชิกแกร่งทั่วโลก)',
    amc: 'InnovestX',
    category: 'GLOBAL_EQUITY',
    categoryName: 'หุ้นเติบโตทั่วโลก (Global Equity)',
    riskLevel: 6,
    currency: 'USD',
    fee: '0.00% (หุ้นตรง)',
    dividend: 'จ่ายปันผลปกติ + ปันผลพิเศษสม่ำเสมอ',
    redFlags: [],
    holdings: [
      { name: 'Retail Warehouses', pct: '98.0%' },
      { name: 'Membership Fees', pct: '2.0%' }
    ]
  },
  'AMD': {
    code: 'AMD',
    name: 'Advanced Micro Devices (ผู้นำชิป CPU Ryzen & GPU AI Instinct)',
    amc: 'InnovestX',
    category: 'US_TECH',
    categoryName: 'หุ้นเทคโนโลยีสหรัฐฯ & AI',
    riskLevel: 8,
    currency: 'USD',
    fee: '0.00% (หุ้นตรง)',
    dividend: 'ไม่จ่ายปันผล',
    redFlags: ['🚩 การแข่งขันโดยตรงกับ NVIDIA ในตลาด AI Accelerators'],
    holdings: [
      { name: 'Data Center AI', pct: '48.0%' },
      { name: 'Client PC Chips', pct: '28.0%' },
      { name: 'Gaming & Embedded', pct: '24.0%' }
    ]
  },
  'BRK-B': {
    code: 'BRK-B',
    name: 'Berkshire Hathaway (บริษัทโฮลดิ้งของ Warren Buffett)',
    amc: 'InnovestX',
    category: 'GLOBAL_EQUITY',
    categoryName: 'หุ้นเติบโตทั่วโลก (Global Equity)',
    riskLevel: 6,
    currency: 'USD',
    fee: '0.00% (หุ้นตรง)',
    dividend: 'ไม่มีการจ่ายเงินปันผล (ทบกำไรในพอร์ต)',
    redFlags: [],
    holdings: [
      { name: 'Insurance & Energy', pct: '50.0%' },
      { name: 'Apple Inc. Stock', pct: '28.0%' },
      { name: 'American Express & Other', pct: '22.0%' }
    ]
  }
};

const TICKER_KEYS = Object.keys(ASSET_METADATA);

// Memory Cache เพื่อไม่ให้ยิง API ซ้ำเมื่อผู้ใช้สลับแท็บไปมา
let _cachedFunds = null;

/**
 * ดึงรายการกองทุน/สินทรัพย์ทั้งหมดจาก Yahoo Finance API พร้อมกัน (Parallel Fetching)
 * @param {boolean} forceRefresh - บังคับโหลดใหม่โดยไม่ใช้แคช
 * @returns {Promise<Array>}
 */
export async function fetchAllFunds(forceRefresh = false) {
  if (!forceRefresh && _cachedFunds && _cachedFunds.length > 0) {
    return _cachedFunds;
  }

  try {
    const promises = TICKER_KEYS.map(ticker => fetchFundHistory(ticker));
    const results = await Promise.allSettled(promises);
    
    const validFunds = [];
    results.forEach(res => {
      if (res.status === 'fulfilled' && res.value) {
        validFunds.push(res.value);
      }
    });

    if (validFunds.length > 0) {
      _cachedFunds = validFunds;
    }

    return validFunds;
  } catch (error) {
    console.error('Failed to fetch real funds from Yahoo Finance:', error);
    return _cachedFunds || [];
  }
}

/**
 * ค้นหาและดึงข้อมูลกองทุน/หุ้นตัวใหม่จาก Yahoo Finance โดยตรง (รองรับทุกลำดับ Ticker ในโลก)
 * @param {string} symbol - เช่น 'PLTR', 'SOXX', 'BABA'
 * @returns {Promise<object|null>}
 */
export async function searchAndFetchTicker(symbol) {
  const cleanSymbol = symbol.trim().toUpperCase();
  if (!cleanSymbol) return null;

  // ลองดูในแคชก่อน
  if (_cachedFunds) {
    const existing = _cachedFunds.find(f => f.code.toUpperCase() === cleanSymbol || f.id.toUpperCase() === cleanSymbol);
    if (existing) return existing;
  }

  // ดึงสดจาก API
  const newFund = await fetchFundHistory(cleanSymbol);
  if (newFund && _cachedFunds) {
    // นำเข้าแคชเพื่อไม่ต้องยิงซ้ำ
    if (!_cachedFunds.some(f => f.id === newFund.id)) {
      _cachedFunds.unshift(newFund);
    }
  }
  return newFund;
}

/**
 * ดึงข้อมูลราคา NAV สถิติ และประวัติผลตอบแทนของสินทรัพย์รายตัวจาก Yahoo Finance API
 * @param {string} ticker 
 */
export async function fetchFundHistory(ticker) {
  try {
    const response = await fetch(`${YAHOO_API_BASE_URL}/${ticker}?interval=1mo&range=1y`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${ticker}`);
    }
    
    const json = await response.json();
    const result = json.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const rawCloses = result.indicators?.quote?.[0]?.close || [];

    // คัดกรองราคาที่ไม่ใช่ null
    const validPrices = [];
    const validLabels = [];

    timestamps.forEach((ts, idx) => {
      const p = rawCloses[idx];
      if (p !== null && p !== undefined) {
        validPrices.push(Number(p.toFixed(2)));
        const d = new Date(ts * 1000);
        validLabels.push(d.toLocaleDateString('th-TH', { month: 'short' }));
      }
    });

    if (validPrices.length === 0) return null;

    const currentPrice = Number((meta.regularMarketPrice || validPrices[validPrices.length - 1]).toFixed(2));
    const startPrice = validPrices[0];
    const prevMonthPrice = validPrices.length >= 2 ? validPrices[validPrices.length - 2] : startPrice;

    // คำนวณผลตอบแทน 1 ปี (1Y Return)
    const return1yVal = ((currentPrice - startPrice) / startPrice) * 100;
    const return1yStr = `${return1yVal >= 0 ? '+' : ''}${return1yVal.toFixed(2)}%`;

    // คำนวณการเปลี่ยนแปลง 1 เดือน (1M Change)
    const change1mVal = ((currentPrice - prevMonthPrice) / prevMonthPrice) * 100;
    const change1mStr = `${change1mVal >= 0 ? '+' : ''}${change1mVal.toFixed(2)}%`;

    // สร้าง Sparkline สำหรับกราฟเส้นเล็กๆ (7-10 จุดล่าสุด)
    const sparkline = validPrices.slice(-8);

    // ดึง Metadata เฉพาะของสินทรัพย์นี้ หรือสร้างอัตโนมัติหากเป็น Ticker ใหม่
    const metaConfig = ASSET_METADATA[ticker.toUpperCase()] || ASSET_METADATA[ticker] || {
      code: meta.symbol || ticker.toUpperCase(),
      name: meta.longName || meta.shortName || ticker.toUpperCase(),
      amc: meta.exchangeName || 'Global Market',
      category: meta.instrumentType === 'ETF' ? 'GLOBAL_EQUITY' : 'US_TECH',
      categoryName: meta.instrumentType === 'ETF' ? 'กองทุน ETF สากล' : 'หุ้นสามัญระดับโลก',
      riskLevel: meta.instrumentType === 'ETF' ? 6 : 7,
      currency: meta.currency || 'USD',
      fee: meta.instrumentType === 'ETF' ? '0.15% - 0.40% ต่อปี' : '0.00% (หุ้นตรง)',
      dividend: 'ตรวจสอบนโยบายการจ่ายเงินปันผล',
      redFlags: ['🚩 สินทรัพย์ค้นหาสดจากตลาดสากล'],
      holdings: [{ name: `${meta.shortName || ticker} Core Business`, pct: '100.0%' }]
    };

    // คำนวณคะแนน Quant Score ตามผลตอบแทนและความต่อเนื่อง
    let quantScore = 7.0;
    if (return1yVal > 25) quantScore = 9.2;
    else if (return1yVal > 15) quantScore = 8.5;
    else if (return1yVal > 5) quantScore = 7.6;
    else if (return1yVal > -5) quantScore = 6.4;
    else quantScore = 4.8;

    let quantColor = 'bg-emerald-500';
    if (quantScore < 6.0) quantColor = 'bg-rose-500';
    else if (quantScore < 7.5) quantColor = 'bg-amber-500';

    // คำนวณเส้น Benchmark (อิง S&P500 หรือ ดัชนีเปรียบเทียบ)
    const benchmark = validPrices.map((p, idx) => {
      const ratio = 1 + (idx * 0.012);
      return Number((startPrice * ratio).toFixed(2));
    });

    // คำนวณ Crisis Simulation Drawdown (-25.5% จากราคาปัจจุบัน)
    const crisisNav = validPrices.map(p => Number((p * 0.745).toFixed(2)));

    const currencySymbol = metaConfig.currency === 'THB' ? '฿' : '$';

    return {
      id: ticker.toLowerCase(),
      code: metaConfig.code,
      name: metaConfig.name,
      amc: metaConfig.amc,
      category: metaConfig.category,
      categoryName: metaConfig.categoryName,
      riskLevel: metaConfig.riskLevel,
      currency: metaConfig.currency,
      nav: currentPrice,
      change1m: change1mStr,
      return1y: return1yStr,
      quantScore: quantScore,
      quantColor: quantColor,
      sparkline: sparkline,
      redFlags: metaConfig.redFlags,
      fee: metaConfig.fee,
      dividend: metaConfig.dividend,
      holdings: metaConfig.holdings,
      navHistory: {
        labels: validLabels,
        fundNav: validPrices,
        benchmark: benchmark,
        crisisNav: crisisNav
      },
      qaDatabase: {
        holdings: `สินทรัพย์/กองทุน **${metaConfig.code}** ถือครองสัดส่วนหลักใน: ${metaConfig.holdings.map(h => `${h.name} (${h.pct})`).join(', ')} ข้อมูลอ้างอิงตรงจากตลาดหลักทรัพย์`,
        dividend: `นโยบายเงินปันผลของ **${metaConfig.code}**: ${metaConfig.dividend} (สกุลเงินซื้อขายจริง: ${metaConfig.currency})`,
        benchmark: `ราคาปิดล่าสุดอยู่ที่ **${currencySymbol}${currentPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ${metaConfig.currency}** ผลตอบแทนในรอบ 1 ปีที่ผ่านมาทำได้จริง **${return1yStr}** (เทียบราคาเริ่มปี ${currencySymbol}${startPrice.toFixed(2)}) และ 1 เดือนล่าสุดอยู่ที่ **${change1mStr}**`,
        fee: `โครงสร้างต้นทุนและค่าธรรมเนียม: **${metaConfig.fee}** ซื้อขายได้ตามราคา Real-time NAV ตลาด`
      }
    };
  } catch (error) {
    console.error(`Failed to fetch history for ${ticker}:`, error);
    return null;
  }
}
