/**
 * Utility Functions — ฟังก์ชันช่วยเหลือทั่วไป
 */
import { createIcons, icons } from 'lucide';

/**
 * Refresh ไอคอน Lucide ทั้งหมดใน DOM
 */
export function refreshIcons() {
  createIcons({ icons });
}

/**
 * Format ตัวเลขเงินเป็น $xx,xxx (แสดงแบบ USD เหมือนเวอร์ชันก่อนหน้า)
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/**
 * Convert an asset price to USD for display, matching the previous price format.
 * @param {number} amount
 * @param {string} currency
 * @param {number} usdToThbRate
 * @returns {number}
 */
export function convertToThb(amount, currency = 'THB', usdToThbRate = 1) {
  return currency === 'THB' ? amount / usdToThbRate : amount;
}

/**
 * Convert a native asset price to Thai baht for portfolio calculations.
 * @param {number} amount
 * @param {string} currency
 * @param {number} usdToThbRate
 * @returns {number}
 */
export function convertToPortfolioThb(amount, currency = 'THB', usdToThbRate = 1) {
  return currency === 'USD' ? amount * usdToThbRate : amount;
}

/**
 * Format a portfolio amount in Thai baht.
 * @param {number} amount
 * @returns {string}
 */
export function formatThbCurrency(amount) {
  return `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format a fund's NAV in USD display mode.
 * @param {object} fund
 * @returns {string}
 */
export function formatFundNav(fund) {
  if (fund.currency === 'THB') {
    return `฿${Number(fund.nav).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  }
  const amount = convertToThb(fund.nav, fund.currency, fund.usdToThbRate);
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

/**
 * สร้าง SVG sparkline จาก array ตัวเลข
 * @param {number[]} data - ค่า NAV ย้อนหลัง
 * @returns {{ svgPoints: string, strokeColor: string }}
 */
export function generateSparkline(data) {
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;
  const pts = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * 70;
    const y = 24 - ((val - minVal) / range) * 20;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const isPositive = data[data.length - 1] >= data[0];
  const strokeColor = isPositive ? '#10b981' : '#f43f5e';

  return { svgPoints: pts, strokeColor };
}

/**
 * Scroll หน้าจอไปด้านบนแบบ smooth
 */
export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
