# 🛡️ FundTwin OS — Thai Mutual Fund Watchtower & Factsheet Translator

> เปลี่ยน Factsheet ทางการเงินหนาหลายหน้า ให้เป็นภาษาคนเข้าใจง่าย  
> พร้อมระบบ **Watchtower** เฝ้าระวังความเสี่ยงอัตโนมัติแบบ End-of-Day (EOD)

---

## ✨ Features

| Feature | รายละเอียด |
|---|---|
| **🚀 Smart Risk Profiling** | แบบประเมินความเสี่ยง 4 ข้อ พร้อมแนะนำสัดส่วนพอร์ตอัตโนมัติ (Conservative / Balanced / Aggressive) |
| **🔍 Fund Screener** | คัดกรองกองทุนรวมไทย + FIF ด้วย Quant Score, Red Flag, ระดับความเสี่ยง, บลจ. |
| **📊 Deep Dive Analysis** | กราฟ NAV ย้อนหลัง vs Benchmark พร้อม Crisis Simulation (Stress Test) |
| **🤖 Factsheet AI Chat** | แปลภาษาหนังสือชี้ชวนเป็นภาษาคนเข้าใจง่าย พร้อมอ้างอิงหน้าเอกสาร |
| **🏰 Watchtower Dashboard** | เฝ้าระวังพอร์ตจำลอง ตรวจจับ Style Drift, แจ้งเตือนปันผล, อัปเดต Factsheet |
| **📝 Investment Thesis** | บันทึกเหตุผลการลงทุน + AI Bull/Bear Debate ก่อนเพิ่มเข้าพอร์ต |

---

## 🏗️ Project Structure

```
koki/
├── index.html                    # HTML template (views + modals layout)
├── package.json                  # Dependencies & scripts
├── vite.config.js                # Vite configuration (ถ้ามี)
│
├── public/                       # Static assets (favicon, images)
│
└── src/
    ├── main.js                   # 🚀 Entry point — bootstrap, mount, wire events
    │
    ├── data/                     # 📦 Data Layer
    │   ├── funds.js              #   Mock dataset กองทุนรวม 5 กอง + คำถาม Quiz
    │   └── state.js              #   Centralized app state + CRUD operations
    │
    ├── views/                    # 📄 View Layer (แต่ละ tab/page)
    │   ├── landing.js            #   หน้าแรก & Hero Section
    │   ├── screener.js           #   ค้นหา/คัดกรองกองทุน + filter logic
    │   ├── deepdive.js           #   วิเคราะห์เชิงลึก + กราฟ + AI Chat
    │   └── watchtower.js         #   Dashboard & หอคอยเฝ้าระวัง
    │
    ├── components/               # 🧩 Reusable Components
    │   ├── fundTable.js          #   Table/Card render + sparkline SVG + red flags
    │   ├── aiChat.js             #   AI chat messages + QA matching + citations
    │   └── charts.js             #   Chart.js wrapper (NAV chart, allocation pie)
    │
    ├── modals/                   # 🪟 Modal Dialogs
    │   ├── riskQuiz.js           #   แบบประเมินความเสี่ยง 4 ขั้นตอน
    │   └── thesis.js             #   บันทึกเหตุผลลงทุน + Bull/Bear debate
    │
    ├── utils/                    # 🔧 Utilities
    │   ├── router.js             #   Tab-based navigation router
    │   └── helpers.js            #   Currency format, sparkline, icon refresh
    │
    └── styles/                   # 🎨 Stylesheets
        └── global.css            #   Design tokens, scrollbar, animations
```

### Architecture Diagram

```
┌─────────────────────────────────────────────┐
│                  index.html                 │
│  (HTML Structure: Header, Views, Modals)    │
└──────────────────┬──────────────────────────┘
                   │
           ┌───────▼───────┐
           │    main.js    │  ← Entry Point
           │  (Bootstrap)  │
           └───┬───┬───┬───┘
               │   │   │
    ┌──────────┘   │   └──────────┐
    ▼              ▼              ▼
┌────────┐  ┌───────────┐  ┌──────────┐
│ Views  │  │ Components│  │  Modals  │
├────────┤  ├───────────┤  ├──────────┤
│landing │  │ fundTable │  │ riskQuiz │
│screener│  │ aiChat    │  │ thesis   │
│deepdive│  │ charts    │  └──────────┘
│watchtwr│  └───────────┘
└────┬───┘        │
     │            │
     ▼            ▼
┌─────────────────────┐
│     Data Layer      │
├─────────────────────┤
│ funds.js  (dataset) │
│ state.js  (app state│
│            + CRUD)  │
└─────────────────────┘
```

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server (Hot Reload)
npm run dev

# 3. Open in browser
#    → http://localhost:5173/
```

### Build for Production

```bash
npm run build     # Output → dist/
npm run preview   # Preview production build
```

---

## 🛠️ Tech Stack

| Technology | ใช้ทำอะไร |
|---|---|
| [Vite](https://vite.dev/) | Build tool + Dev server (HMR) |
| [Tailwind CSS](https://tailwindcss.com/) (CDN) | Utility-first CSS framework |
| [Chart.js](https://www.chartjs.org/) | กราฟ NAV ย้อนหลัง + Allocation Pie |
| [Lucide Icons](https://lucide.dev/) | Icon library (tree-shakeable) |
| Vanilla JavaScript (ES Modules) | ไม่มี framework — ใช้ ES Modules import/export |

---

## 📂 Module Responsibilities

### `src/data/` — Data Layer
- **`funds.js`** — ข้อมูลกองทุนรวม 5 กอง (NAV, holdings, sparkline, QA database, risk quiz questions)
- **`state.js`** — Centralized state (selected fund, user holdings, quiz state) + helper functions (`addHolding`, `removeHolding`)

### `src/views/` — View Layer
- **`landing.js`** — Hero section & onboarding result banner
- **`screener.js`** — Fund screener ที่มี filter (keyword, บลจ., category, risk level, red flag)
- **`deepdive.js`** — Fund detail (metrics, NAV chart, crisis simulation, top 5 holdings, AI chat)
- **`watchtower.js`** — Portfolio dashboard (holdings cards, P&L, thesis notes, EOD alert timeline)

### `src/components/` — Reusable Components
- **`fundTable.js`** — Table/Card view renderer + SVG sparkline + red flag tooltip
- **`aiChat.js`** — Chat message rendering + keyword-based QA matching + citation modal
- **`charts.js`** — Chart.js wrapper (NAV line chart, crisis toggle, allocation doughnut)

### `src/modals/` — Modal Dialogs
- **`riskQuiz.js`** — 4-step risk assessment quiz → profile scoring → allocation chart
- **`thesis.js`** — Investment thesis input + fund-specific Bull/Bear debate

### `src/utils/` — Utilities
- **`router.js`** — Tab-based SPA router (switchTab, onTabChange callbacks)
- **`helpers.js`** — formatCurrency, generateSparkline, refreshIcons, scrollToTop

---

## 📊 Mock Data (กองทุนตัวอย่าง)

| รหัสกองทุน | บลจ. | ประเภท | ความเสี่ยง | Quant Score |
|---|---|---|---|---|
| K-USXNDQ-A(A) | KAsset | หุ้นเทคสหรัฐฯ | 6 | 8.8/10 |
| SCBDV-A | SCBAM | หุ้นไทยปันผลสูง | 6 | 6.2/10 |
| ONE-UGG-RA | OneAM | หุ้นเติบโตทั่วโลก | 7 | 8.4/10 |
| B-INNOTECH | BBLAM | หุ้นนวัตกรรม/เทค | 7 | 7.9/10 |
| K-FIXED-A | KAsset | ตราสารหนี้ | 3 | 9.1/10 |

---

## 📝 License

Private project — All rights reserved.
