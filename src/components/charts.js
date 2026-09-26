/**
 * Chart Manager — จัดการ Chart.js instances สำหรับกราฟ NAV
 */
import { Chart, registerables } from 'chart.js';

// Register all Chart.js components
Chart.register(...registerables);

/**
 * สร้างกราฟ NAV ย้อนหลังในหน้า Deep Dive
 * @param {HTMLCanvasElement} canvas 
 * @param {object} fund 
 * @returns {Chart} Chart instance
 */
export function createNavChart(canvas, fund) {
  const ctx = canvas.getContext('2d');

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: fund.navHistory.labels,
      datasets: [
        {
          label: `${fund.code} (NAV)`,
          data: fund.navHistory.fundNav,
          borderColor: '#059669',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          borderWidth: 2.5
        },
        {
          label: 'Benchmark (ดัชนีอ้างอิง)',
          data: fund.navHistory.benchmark,
          borderColor: '#94a3b8',
          borderDash: [5, 5],
          fill: false,
          tension: 0.3,
          pointRadius: 2,
          borderWidth: 1.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { family: 'Prompt', size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.dataset.label}: ${context.parsed.y} บาท`
          }
        }
      },
      scales: {
        y: {
          grid: { color: '#f1f5f9' },
          ticks: { font: { family: 'Prompt', size: 10 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Prompt', size: 10 } }
        }
      }
    }
  });
}

/**
 * สลับกราฟระหว่างโหมดปกติและโหมดวิกฤต
 * @param {Chart} chartInstance 
 * @param {object} fund 
 * @param {boolean} isCrisis 
 */
export function toggleCrisisChart(chartInstance, fund, isCrisis) {
  if (!chartInstance) return;

  const dataset = chartInstance.data.datasets[0];

  if (isCrisis) {
    dataset.data = fund.navHistory.crisisNav;
    dataset.label = `${fund.code} [วิกฤตจำลอง -25.5%]`;
    dataset.borderColor = '#e11d48';
    dataset.backgroundColor = 'rgba(225, 29, 72, 0.12)';
  } else {
    dataset.data = fund.navHistory.fundNav;
    dataset.label = `${fund.code} (NAV)`;
    dataset.borderColor = '#059669';
    dataset.backgroundColor = 'rgba(16, 185, 129, 0.08)';
  }

  chartInstance.update();
}

/**
 * สร้าง Doughnut chart สำหรับ quiz allocation result
 * @param {HTMLCanvasElement} canvas 
 * @param {object} allocation - { tech, thai, debt }
 * @returns {Chart}
 */
export function createAllocationChart(canvas, allocation) {
  const ctx = canvas.getContext('2d');

  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['หุ้นเทคโนโลยี', 'หุ้นไทยปันผล', 'ตราสารหนี้'],
      datasets: [{
        data: [allocation.tech, allocation.thai, allocation.debt],
        backgroundColor: ['#059669', '#14b8a6', '#94a3b8'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      cutout: '65%'
    }
  });
}
