# 🌾 KisanVriddhi
### *Empowering Farmers Through Intelligence*

> A multilingual AI-powered agricultural intelligence platform for Indian farmers — providing real-time weather alerts, expert crop advisory, disease diagnosis, and direct officer support.

---

## 🚀 Live Demo

| Role | Username | Password |
|------|----------|----------|
| Farmer | One-click Demo button | auto |
| Officer | `officer_amit` | `demo1234` |

---

## ✨ Features

- 🌦️ **Real-time Weather Intelligence** — Open-Meteo API, risk alerts (Heat/Rain/Dry Spell/Wind)
- 🌾 **AI Crop Recommendation** — Soil, pH, irrigation-based recommendations with confidence scores
- 💬 **Expert Advisory Chatbot** — Knowledge Base → Rule Engine → Gemini AI fallback
- 📋 **Google Form Knowledge Base** — Agronomists submit Q&As via Google Form → synced to chatbot
- 📞 **Contact Officer** — Farmer sends query → officer replies → farmer notified in-chat
- 👮 **Officer Dashboard** — Cases, farmer messages, disease & weather impact reports
- 🌐 **4 Languages** — English, Hindi (हिंदी), Malayalam (മലയാളം), Telugu (తెలుగు)
- 🔐 **Secure Auth** — JWT cookies, role-based access, bcrypt password hashing
- 🎨 **Premium UI** — Dark mode, Framer Motion animations, voice TTS readout

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS + Framer Motion |
| Backend | FastAPI + SQLAlchemy + SQLite + Uvicorn |
| Auth | JWT (HttpOnly cookies) + bcrypt |
| Weather | Open-Meteo API (free, no key needed) |
| AI | Google Gemini 1.5 Flash (optional fallback) |
| Deploy | Docker + docker-compose |

---

## ⚡ Quick Start

### Option 1: Docker (Recommended)
```bash
git clone https://github.com/spoilerOP/KisanVriddhi.git
cd KisanVriddhi
cp .env.example .env
docker-compose up --build
```
Open → http://localhost:3000

### Option 2: Manual

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Open → http://localhost:3000

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
GEMINI_API_KEY=your_gemini_api_key_here    # Optional — for AI fallback
JWT_SECRET_KEY=your_secret_key_here
GOOGLE_SHEET_CSV_URL=                      # Optional — Google Sheet published CSV URL
```

---

## 🗂️ Project Structure

```
KisanVriddhi/
├── frontend/                # React + Vite app
│   └── src/
│       ├── components/      # Dashboard, Chat, Weather, Officer UI
│       ├── services/api.ts  # All API calls
│       └── utils/translate.ts  # 4-language dictionary (300+ keys)
│
├── backend/                 # FastAPI server
│   └── app/
│       ├── routers/         # assistant, officer, farmers, auth
│       ├── models.py        # SQLAlchemy DB models
│       ├── schemas.py       # Pydantic validation
│       ├── demo_data.py     # One-click demo seeder
│       └── expert_kb.csv   # Expert Q&A knowledge base
│
├── docker-compose.yml
└── .env.example
```

---

## 📡 API Documentation

Start the backend and visit: **http://localhost:8000/docs**

---

## 🎬 Demo Flow

1. Click **"Launch One-Click Demo Mode"**
2. View live dashboard with weather alerts & risk scores
3. Switch to **हिंदी** — entire UI translates
4. Type in chat → get **✅ Expert Verified** answer
5. Click **"अधिकारी से संपर्क करें"** → send problem to officer
6. Switch to Officer View → reply to farmer
7. Switch back → see 🔔 reply notification

---

## 📜 License

MIT License — free to use, modify, and distribute.

---

*Built with ❤️ for Indian farmers — KisanVriddhi, 2026*
