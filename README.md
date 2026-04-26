# Decision Support Tool for Suspected Phishing Activity

A human-centered decision-support tool for assessing phishing and social engineering risk in real time. Built for GT CS 6727 (Cybersecurity Practicum).

The tool walks users through 9 questions across a formal 3-layer framework and produces an immediate risk verdict with actionable next steps, before any irreversible action is taken.

---

## How It Works

**Layer 1: Contact & Identity**: Who is contacting you, how, and do you have a real relationship with them?

**Layer 2: Pressure & Tactics**: What urgency, threats, or manipulation tactics are present?

**Layer 3: Requested Actions**: What is being asked of you, and is it reversible?

The risk engine checks answers against a set of institutional "never event" rules (e.g., no legitimate entity ever asks for gift card payment or MFA codes) and computes a final risk level: **Low**, **Medium**, **High**, or an immediate **Hard Stop**.

---

## Requirements

- [Node.js](https://nodejs.org/) v18 or higher
- npm (included with Node.js)

---

## Quick Start

### Option 1: Automated setup (Mac/Linux/Git Bash on Windows)

```bash
bash setup.sh
```

This script checks for Node.js, installs dependencies, and launches the app automatically.

### Option 2: Manual setup

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

Then open your browser to the local URL shown in the terminal (usually `http://localhost:5173`).

---

## Project Structure

```
src/
  data/
    questions.js        # All 9 questions, options, and per-option risk colors
  utils/
    riskEngine.js       # Formal decision model: scoring, never-event rules, archetypes
  components/
    QuestionPanel.jsx   # Question display and answer selection
    PathTracker.jsx     # Sidebar showing progress and per-layer risk state
    RiskIndicator.jsx   # Live risk level badge in the header
    ResultPanel.jsx     # Final verdict, intervention guidance, and breakdown
  App.jsx               # Root component and state management
  main.jsx              # Entry point
index.html
vite.config.js
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local development server |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview the production build locally |

---

## Tech Stack

- [React 18](https://react.dev/)
- [Vite 5](https://vitejs.dev/)
