/**
 * Navigation Router — จัดการ navigation tabs ระหว่าง views ต่างๆ
 */
import { refreshIcons, scrollToTop } from './helpers.js';

/** ชื่อ view ที่รองรับ */
const VIEW_IDS = ['landing', 'screener', 'deepdive', 'watchtower'];

/** CSS classes สำหรับสถานะ nav button */
const NAV_CLASSES = {
  active: 'px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 text-brand-800 bg-brand-50 border border-blue-400 shadow-sm',
  inactive: 'px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 text-slate-600 border border-blue-400 hover:text-slate-900 hover:bg-slate-100 relative',
  watchtowerActive: 'px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 text-brand-800 bg-brand-50 border border-blue-400 shadow-sm relative'
};

/** Callbacks ที่จะเรียกเมื่อเปลี่ยน tab */
const _onTabChangeCallbacks = {};

/**
 * ลงทะเบียน callback เมื่อ tab เปลี่ยน
 * @param {string} tabName
 * @param {Function} callback
 */
export function onTabChange(tabName, callback) {
  _onTabChangeCallbacks[tabName] = callback;
}

/**
 * สลับ view ไปยัง tab ที่ระบุ
 * @param {string} tabName - 'landing' | 'screener' | 'deepdive' | 'watchtower'
 */
export function switchTab(tabName) {
  // ซ่อน views ทั้งหมด
  VIEW_IDS.forEach(id => {
    const el = document.getElementById(`view-${id}`);
    if (el) el.classList.add('hidden');
  });

  // Reset nav button styles
  ['landing', 'screener', 'watchtower'].forEach(t => {
    const btn = document.getElementById(`nav-${t}`);
    if (btn) btn.className = NAV_CLASSES.inactive;
  });

  // แสดง view ที่เลือก
  const targetView = document.getElementById(`view-${tabName}`);
  if (targetView) targetView.classList.remove('hidden');

  // เซ็ต active nav button
  if (tabName === 'watchtower') {
    const btn = document.getElementById('nav-watchtower');
    if (btn) btn.className = NAV_CLASSES.watchtowerActive;
  } else {
    const btn = document.getElementById(`nav-${tabName}`);
    if (btn) btn.className = NAV_CLASSES.active;
  }

  // เรียก callback ถ้ามี
  if (_onTabChangeCallbacks[tabName]) {
    _onTabChangeCallbacks[tabName]();
  }

  scrollToTop();
  refreshIcons();
}
