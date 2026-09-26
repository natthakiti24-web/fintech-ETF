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
 * Format ตัวเลขเงินเป็น ฿xx,xxx
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  return `฿${amount.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;
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
