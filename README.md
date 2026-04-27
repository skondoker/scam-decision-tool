# Decision Support Tool for Suspected Phishing Activity

GT CS 6727 Practicum, Georgia Institute of Technology.

This tool supports real-time decision-making for individuals who have received a suspected phishing or social engineering contact. It implements a formal three-layer risk assessment model based on established human factors research and official institutional guidance. The goal is to produce a structured risk verdict with actionable intervention steps before any irreversible action is taken.

## Framework Overview

The assessment follows a three-layer decision model derived from the CS 6727 practicum research framework.

**Layer 1: Contact and Identity.** Evaluates the contact modality, the identity being claimed, whether the contact was solicited, and whether a verifiable prior relationship exists.

**Layer 2: Pressure and Tactics.** Evaluates the presence of urgency signals, legal or arrest threats, secrecy instructions, stay-on-the-line demands, and other manipulation tactics documented in social engineering literature.

**Layer 3: Requested Actions.** Evaluates what the contact is asking the user to do. Actions are categorized by reversibility. Irreversible actions (financial transfers, MFA approval, credential disclosure, remote access installation, identity document sharing) trigger hard-stop evaluation rules.

The risk engine evaluates answers against approximately 80 institutional never-event rules sourced from official guidance published by the FTC, IRS, SSA, FBI, Apple, Google, Microsoft, USPS, FedEx, UPS, Amazon, Walmart, and the American Bankers Association. Each triggered rule displays a direct citation link to the source document. The final risk output is one of three levels: Low Risk, Caution, or Hard Stop.

## Setup

Node.js v18 or higher is required.

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

To produce a production build:

```bash
npm run build
```

## Project Structure

```
src/
  data/
    questions.js       # Nine assessment questions with grouped options, risk colors, and per-option explanations
  utils/
    riskEngine.js      # Formal decision model: never-event rules, per-question scoring, layer aggregation, archetype detection
  components/
    QuestionPanel.jsx  # Question rendering with inline explanations and grouped option layout support
    PathTracker.jsx    # Decision path sidebar driven entirely by engine output
    RiskIndicator.jsx  # Live risk level indicator updated after each answer
    ResultPanel.jsx    # Final verdict, triggered institutional rules, citation links, and recommended next steps
  App.jsx              # Application root, state management, and engine integration
```

## Academic Context

This tool is the prototype component of the CS 6727 practicum submission at Georgia Tech. The formal decision model, institutional rule normalization, and variable extraction are documented in the accompanying IEEE final report. The never-event rules in `riskEngine.js` map one-to-one to the normalized rules in Appendix C of that report, and the question structure follows the variable extraction defined in Appendix B.
