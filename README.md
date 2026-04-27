# Decision Support Tool for Suspected Phishing Activity

GT CS 6727 Practicum project. The idea is to give someone a quick structured way to assess whether a contact (call, text, email, pop-up) is a scam before they do something they can't undo.

It asks 9 questions across 3 layers — who's contacting you, what tactics they're using, and what they're asking you to do — and spits out a risk level with specific next steps.

---

## The 3 Layers

**Layer 1 - Contact & Identity**: How did they reach you? Who do they claim to be? Did you initiate this? Is the relationship real?

**Layer 2 - Pressure & Tactics**: Are there urgency threats, secrecy demands, stay-on-the-line instructions, or other manipulation signals?

**Layer 3 - Requested Actions**: What do they want you to do? Anything irreversible (gift cards, wire transfer, MFA approval, remote access, SSN) is a hard stop.

The engine checks your answers against ~80 institutional "never event" rules pulled from official guidance by the FTC, IRS, SSA, FBI, Apple, Google, Microsoft, USPS, FedEx, UPS, Amazon, Walmart, and the ABA. Each triggered rule shows a direct link to the actual source so you can read it yourself.

---

## Running It

You need Node.js 18+.

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

To build for production:

```bash
npm run build
```

---

## Project Structure

```
src/
  data/
    questions.js       # the 9 questions, grouped options, risk colors, explanations
  utils/
    riskEngine.js      # all the scoring logic, never-event rules, archetype detection
  components/
    QuestionPanel.jsx  # renders each question, handles grouped option layouts
    PathTracker.jsx    # sidebar progress tracker, colors from engine output only
    RiskIndicator.jsx  # live risk badge in the header
    ResultPanel.jsx    # final result, triggered rules, citation links, next steps
  App.jsx              # state management, wires everything together
```

---

## Context

This is part of the practicum component for CS 6727 at Georgia Tech. The formal decision model and institutional rule set are documented in the accompanying IEEE report. The never-event rules in `riskEngine.js` map 1-to-1 to the normalized rules in Appendix C of that report.
