# 🛡️ FundTwin OS — Thai Mutual Fund Watchtower & Factsheet Translator

> เปลี่ยน Factsheet ทางการเงินหนาหลายหน้า ให้เป็นภาษาคนเข้าใจง่าย  
> พร้อมระบบ **Watchtower** เฝ้าระวังความเสี่ยงอัตโนมัติแบบ End-of-Day (EOD)

---

## ✨ Features

| Feature | รายละเอียด |
|---|---|
| **🚀 Smart Risk Profiling** | แบบประเมินความเสี่ยง 4 ข้อ พร้อมแนะนำสัดส่วนพอร์ตอัตโนมัติ (Conservative / Balanced / Aggressive) และคัด 10 ETF ตามระดับความเสี่ยง |
| **🔍 Fund Screener** | คัดกรอง ETF ไทยและต่างประเทศด้วย Quant Score, Red Flag, ระดับความเสี่ยง, บลจ. |
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
    │   ├── funds.js              #   คำถาม Quiz
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
│ funds.js (quiz data) │
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

### Yahoo Finance on Vercel

`vercel.json` rewrites the chart endpoint to the `api/yahoo.js` serverless
function, which proxies requests to Yahoo Finance. The frontend can continue
requesting `/api/yahoo/v8/finance/chart/{ticker}?interval=1d&range=5d`; no Yahoo
API key is required. Set the Vercel project Root Directory to `fintech-ETF` so
both `vercel.json` and the `api/` function are included in the deployment.

### Factsheet AI (Gemini)

Factsheet AI generates answers through Gemini on the backend. The browser calls
`/api/gemini` and never receives the API key. Set `GEMINI_API_KEY` in `.env` in
the project root or its parent directory before starting the app:

```env
GEMINI_API_KEY=your_gemini_api_key
```

If your existing `.env` uses `VITE_GEMINI_API_KEY`, rename it to
`GEMINI_API_KEY`; never use the `VITE_` prefix for secrets. Start both the Vite
frontend and Gemini backend with `npm run dev`. For production, deploy the
backend separately and route `/api/gemini` to it. Keep `GEMINI_API_KEY` only in
the backend environment.

### Watchtower News (Finnhub)

Watchtower requests up to three company-news articles from the past seven days
for each fund ticker. Add a Finnhub API key to the backend environment:

```env
FINNHUB_API_KEY=your_finnhub_api_key
```

The key is used only by `server.js` and is never exposed to the browser. During
development, `npm run dev` proxies `/api/finnhub` to the backend. For production,
route `/api/finnhub` to the backend as well. News is cached for ten minutes;
availability depends on Finnhub coverage for each ticker and the API plan.
News headlines and summaries are translated into Thai with Gemini. Set both
`FINNHUB_API_KEY` and `GEMINI_API_KEY` in the backend environment; without a
Gemini key, the original English news remains visible with a translation notice.
If the primary Gemini model is temporarily unavailable, the backend falls back
to a tested lightweight model for news translation.

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
- **`funds.js`** — คำถามแบบประเมินความเสี่ยงสำหรับจัดพอร์ต ETF
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

## 📝 License

Private project — All rights reserved.
