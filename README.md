# AI Code Reviewer & Documentation Generator (Gemini 2.5 Flash)

A full-stack AI-powered platform that performs intelligent code review, automated documentation generation, and interactive diff comparisons for multiple programming languages — built using **React (Vite)** and **FastAPI**, integrated with **Google Gemini 2.5 Flash**.

## 🚀 Overview
This project automates common developer workflows:

- **Code Review** — Detects bugs, security issues, and performance bottlenecks  
- **Documentation Generation** — Creates PEP-257, JSDoc, and Javadoc-style docstrings  
- **Interactive Diff View** — Side-by-side comparison of original code vs. AI-suggested fixes
- **PDF Reporting** — Exports analysis results in a professional format  

Developed as a **5th Semester Mini Project (ISE – 2025)** by a team of 4 over 14 weeks, recently modernized with a new landing page and animated interactions.

## ✨ Features

### 🔍 AI-Powered Code Review  
- Detects logic errors, bugs, and edge cases  
- Suggests optimization & best practices  
- Flags security vulnerabilities  
- Gives structured, actionable feedback  

### 📝 Auto-Generated Documentation  
- Language-specific docstrings  
- Parameter & return descriptions  
- Usage examples  

### ⇄ Interactive Diff View
- Side-by-side Monaco Diff Editor
- Visually highlights added, modified, and removed lines
- Allows you to accept or reject changes with full context

### 💻 Multi-Language Support  
Supported languages:  
**Python, JavaScript, TypeScript, Java, C++, Go, Rust, C#**

### 🧑‍💻 Modern App Experience  
- **Landing Page & Routing**: Professional animated marketing page routing seamlessly into the core app.
- **Framer Motion Animations**: Code-editor curtain wipes, scroll reveals, and a sliding mobile drawer.
- **Dark/Light Mode**: Full theme support via CSS variables.
- **Local History**: Automatically stores your last 10 review sessions locally for instant retrieval.
- **Backend Health Polling**: Live server status indicator in the UI.

### 📄 PDF Export  
- One-click export  
- Includes formatted code & AI feedback  

## 🛠️ Technology Stack

### Frontend (React + Vite)
- React 18  
- Vite (Configured with backend proxy)
- React Router DOM
- Framer Motion
- Monaco Editor (`@monaco-editor/react`)
- Axios  
- ReactMarkdown  
- html2canvas + jsPDF  

### Backend (FastAPI)
- Python 3.11+  
- FastAPI  
- Uvicorn  
- httpx  
- Pydantic  
- python-dotenv  

### AI Integration
- Google Gemini 2.5 Flash
- Fallback models: Gemini 1.5 Flash, Gemini 2.5 Pro

## ⚙️ System Architecture

[React Frontend] ↔ (Vite Proxy) ↔ FastAPI Backend → Google Gemini API

## 📦 Project Structure

```
AI_CODE_REVIEWER/  
├── backend/          # FastAPI application, CORS, Gemini integration
├── frontend/         # React application, Framer Motion, Monaco Editor
├── .gitignore  
└── README.md  
```

## ▶️ How to Run

### Backend
1. Open a terminal in the `backend` folder.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set your Google Gemini API key in a `.env` file (`GEMINI_API_KEY=your_key`).
4. Start the server:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```

### Frontend
1. Open a terminal in the `frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open the provided `localhost` link in your browser to see the landing page.

## 📈 Performance Summary
- Avg. Response Time: ~45 sec (depends on Gemini API)
- Supported Languages: 8  
- Mobile Responsive: Yes  
- PDF Export: Yes  

## 🚧 Future Enhancements
- Authentication + cloud history synchronization
- GitHub repo analysis integration
- Real-time inline code review
- VS Code extension  

## 🏁 Conclusion
This project demonstrates how modern LLMs like **Gemini 2.5 Flash** can enhance developer workflows by automating code review and documentation generation, paired with a highly interactive, animated React frontend.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
