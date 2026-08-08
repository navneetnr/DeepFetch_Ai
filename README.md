# DeepFetch AI

**DeepFetch AI** is an autonomous AI research workspace that helps you research topics using live web data instead of relying only on a model's existing knowledge.

You give it a research question, and DeepFetch handles the rest: it plans the research, searches and collects information from web sources, verifies the findings, and turns everything into a structured Markdown report.

The goal is simple: **make web research faster, more organized, and less prone to hallucinations.**

---

##  What DeepFetch AI Can Do

* **Autonomous research**
  Breaks a research question into smaller tasks and runs a multi-step research workflow automatically.

* **Live web research**
  Uses real-time web sources instead of depending entirely on pre-trained knowledge.

* **Source verification**
  Cross-checks collected information before including it in the final report.

* **AI-generated research reports**
  Combines the gathered information into a clean, structured Markdown report.

* **Minimal and focused UI**
  Inspired by modern AI search interfaces, with a simple workspace that keeps the focus on the research.

* **Dark & light mode**
  Switch between themes, with the selected preference saved locally.

* **Research history**
  Previous research sessions and reports are stored locally using SQLite, making it easy to return to earlier work.

* **Authentication**
  Supports secure user authentication using PBKDF2 password hashing and JWT access tokens.

* **Markdown export**
  Export completed research reports as `.md` files.

---

##  How It Works

DeepFetch follows a simple research pipeline:

```text
Research Question
       ↓
   Query Planning
       ↓
   Web Searching
       ↓
  Source Collection
       ↓
  Fact Verification
       ↓
   Information Synthesis
       ↓
  Structured Report
```

Instead of asking an AI model to answer everything in one step, the system separates the research process into multiple stages.

This makes the workflow easier to inspect, verify, and extend.

---

##  Project Architecture

```text
DeepFetch AI
│
├── Frontend
│   ├── React
│   ├── Vite
│   ├── Tailwind CSS
│   └── React Markdown
│
├── Backend
│   ├── FastAPI
│   ├── Research Engine
│   ├── Authentication
│   └── API Routes
│
├── Research Layer
│   ├── Query Planning
│   ├── Web Scraping
│   ├── Source Verification
│   └── Report Generation
│
├── Database
│   └── SQLite
│
└── Browser Automation
    └── Playwright
```

---

## 🛠️ Tech Stack

### Frontend

* **React.js** with Vite
* **Tailwind CSS**
* **Lucide React**
* **react-markdown**
* Syntax highlighting for code blocks

### Backend

* **Python**
* **FastAPI**
* **SQLite**
* **Playwright**
* **OAuth2**
* **PBKDF2 password hashing**
* **JWT authentication**

### Other Technologies

* Git & GitHub
* MCP (Model Context Protocol)
* Markdown

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

* Python 3.9+
* Node.js 18+
* Git

### 1. Clone the repository

```bash
git clone https://github.com/your-username/deepfetch-ai.git
cd deepfetch-ai
```

### 2. Set up the backend

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Or on Linux/macOS:

```bash
source venv/bin/activate
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

### 3. Install Playwright

```bash
playwright install
```

### 4. Start the backend

```bash
uvicorn main:app --reload
```

The FastAPI server should now be running locally.

### 5. Set up the frontend

Open another terminal:

```bash
cd frontend
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Open the URL shown in the terminal to access DeepFetch AI.

---

## Project Structure

```text
deepfetch-ai/
│
├── frontend/
│   ├── public/
│   │   └── logo.png
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── main.py
│   ├── routes/
│   ├── services/
│   └── models/
│
├── deepfetch.db
├── requirements.txt
├── README.md
└── .gitignore
```

> The exact structure may vary depending on the current implementation.

---

##  Authentication

DeepFetch includes token-based authentication.

Passwords are protected using **PBKDF2 hashing**, while authenticated requests use **JWT access tokens**.

The authentication flow is designed to keep user credentials separate from the research workflow.

---

##  Web Research

DeepFetch uses **Playwright** for browser automation and web scraping.

This allows the research engine to access dynamically rendered websites and collect information that may not be available through simple HTTP requests.

The project also uses **MCP integration** to make external research tools easier to connect with the agent workflow.

---

##  Local Storage

Research sessions are stored locally using SQLite.

This allows DeepFetch to keep track of previous research without requiring a separate database server during local development.

The database can store information such as:

* User sessions
* Research queries
* Generated reports
* Research history

---

##  Exporting Reports

Once a research task is completed, the generated report can be exported as a Markdown file.

This makes it easy to move the research into:

* GitHub
* Notion
* Documentation
* Personal notes
* Other Markdown-compatible tools

---

##  Future Improvements

Some areas that could be added or improved in future versions:

* [ ] PDF report export
* [ ] Citation management
* [ ] More research agents
* [ ] Better source ranking
* [ ] Cloud database support
* [ ] Research sharing
* [ ] User-specific workspaces
* [ ] Streaming agent responses
* [ ] Advanced research analytics
* [ ] Docker deployment
* [ ] Production deployment configuration

---

##  Contributing

Contributions are welcome.

If you find a bug, have an idea, or want to improve the research workflow:

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature/your-feature
```

3. Make your changes
4. Commit them

```bash
git commit -m "Add your feature"
```

5. Push the branch

```bash
git push origin feature/your-feature
```

6. Open a Pull Request

---

## 📄 License

This project is currently available for personal and educational use.

Add your preferred open-source license here if you plan to publish the project publicly.

---

## 👨‍💻 About

DeepFetch AI was built as a project exploring **autonomous AI agents, web research, browser automation, and full-stack application development**.

It combines a React-based research interface with a Python/FastAPI backend and an autonomous research pipeline to turn a simple question into a structured research report.

**Built with React, FastAPI, Python, Playwright, SQLite, and a lot of debugging.**
