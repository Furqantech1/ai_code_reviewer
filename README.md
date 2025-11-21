# AI Code Reviewer & Documentation Generator (DeepSeek-V3.1)

A full-stack AI-powered platform that performs intelligent code review, automated documentation generation, and PDF export for multiple programming languages — built using **React (Vite)** and **FastAPI**, integrated with **DeepSeek-V3.1** via **OpenRouter**.

## 🚀 Overview
This project automates common developer workflows:

- **Code Review** — Detects bugs, security issues, and performance bottlenecks  
- **Documentation Generation** — Creates PEP-257, JSDoc, and Javadoc-style docstrings  
- **PDF Reporting** — Exports analysis results in a professional format  

Developed as a **5th Semester Mini Project (ISE – 2025)** by a team of 4 over 14 weeks.

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

### 💻 Multi-Language Support  
Supported languages:  
**Python, JavaScript, TypeScript, Java, C++, Go, Rust, C#**

### 🧑‍💻 Monaco Code Editor  
- Syntax highlighting  
- Line numbers  
- Code folding  
- Example code loader  

### 🗂️ Tabbed Results Interface  
- Review tab  
- Documentation tab  
- Export tab  

### 📄 PDF Export  
- One-click export  
- Includes formatted code & AI feedback  

### 📱 Responsive UI  
Supports:
- Desktop  
- Tablet  
- Mobile  

## 🛠️ Technology Stack

### Frontend (React + Vite)
- React 18  
- Vite  
- Monaco Editor  
- Tailwind CSS (CDN)  
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
- DeepSeek-V3.1 via OpenRouter  
- Fallback models: Gemini 2.0 Flash, LLaMA 3.2, Phi-3  

## ⚙️ System Architecture

[React Frontend] → FastAPI Backend → OpenRouter → DeepSeek-V3.1

## 📦 Project Structure

AI_CODE_REVIEWER/  
│── backend/  
│── frontend/  
│── .gitignore  
│── README.md  

## ▶️ How to Run

### Backend
cd backend  
pip install -r requirements.txt  
uvicorn main:app --reload  

### Frontend
cd frontend  
npm install  
npm run dev  

## 📈 Performance Summary
- Avg. Response Time: ~45 sec  
- Supported Languages: 8  
- Total LOC: ~1500  
- Mobile Responsive: Yes  
- PDF Export: Yes  

## 🚧 Future Enhancements
- Authentication + user history  
- GitHub repo analysis  
- Real-time code review  
- Auto-fix suggestions  
- VS Code extension  
- Metrics dashboard  

## 🏁 Conclusion
This project demonstrates how modern LLMs like **DeepSeek-V3.1** can enhance developer workflows by automating code review and documentation generation.
