/**
 * ResultPanel.jsx
 * ===============
 * Final output screen. Displays the complete formal model evaluation result.
 *
 * For every RED or YELLOW result, the user sees:
 *   - WHY that risk level was triggered (formal model condition that fired)
 *   - WHICH never-event institutional rules were triggered (with rationale)
 *   - WHAT they should do next (context-specific guidance)
 *
 * All data comes from the engine's evaluateAssessment() output.
 * No risk logic is computed here.
 */

import React, { useState } from 'react';
import { QUESTIONS } from '../data/questions';

const RISK_DISPLAY = {
  red: {
    label: 'HARD STOP',
    sublabel: 'Do Not Proceed',
    icon: '⛔',
    bgClass: 'result-banner-red',
  },
  yellow: {
    label: 'CAUTION',
    sublabel: 'Verify Before Proceeding',
    icon: '⚠️',
    bgClass: 'result-banner-yellow',
  },
  green: {
    label: 'LOW RISK',
    sublabel: 'Continue Cautiously',
    icon: '✅',
    bgClass: 'result-banner-green',
  },
};

const COMPLEXITY_LABELS = ['Minimal', 'Low', 'Low-Moderate', 'Moderate', 'High', 'Very High', 'Critical'];

const LAYER_LABELS = {
  contact: 'Layer 1 · Contact & Identity',
  lure: 'Layer 2 · Pressure & Tactics',
  action: 'Layer 3 · Requested Actions',
};

const Q_LABELS = {
  q1: 'Q1 — Contact Modality',
  q2: 'Q2 — Claimed Identity',
  q3: 'Q3 — Initiated Contact',
  q4: 'Q4 — Relationship Validity',
  q5: 'Q5 — Personalization',
  q6: 'Q6 — Pressure Signals',
  q7: 'Q7 — Escalation',
  q8: 'Q8 — Requested Actions',
  q9: 'Q9 — Verification State',
};

export default function ResultPanel({
  riskLevel,
  intervention,
  complexityScore,
  complexityFactors,
  triggeredNeverEvents,
  triggeredConditions,
  questionRisk,
  layerRisk,
  archetype,
  answers,
  onRestart,
}) {
  const [showAnswerSummary, setShowAnswerSummary] = useState(false);
  const [showModelDetail, setShowModelDetail] = useState(false);

  const display = RISK_DISPLAY[riskLevel] || RISK_DISPLAY.yellow;
  const complexityLabel = COMPLEXITY_LABELS[complexityScore] ?? 'Unknown';

  const redQuestions = Object.entries(questionRisk).filter(([, v]) => v === 'red');
  const yellowQuestions = Object.entries(questionRisk).filter(([, v]) => v === 'yellow');

  return (
    <div className="result-panel">
      {/* ── Risk Banner ───────────────────────────────────────────────── */}
      <div className={`result-banner ${display.bgClass}`}>
        <div className="result-banner-icon">{display.icon}</div>
        <div className="result-banner-text">
          <h1 className="result-risk-label">{display.label}</h1>
          <p className="result-risk-sublabel">{display.sublabel}</p>
        </div>
      </div>

      {/* ── Assessment Summary ────────────────────────────────────────── */}
      <div className="result-section">
        <h2 className="result-section-title">Assessment Summary</h2>
        <p className="result-summary-text">{intervention.summary}</p>
        {archetype && (
          <div className="archetype-match">
            <span className="archetype-badge">Pattern Match</span>
            <div>
              <strong>{archetype.name}</strong>
              <p className="archetype-description">{archetype.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── WHY This Risk Level Was Triggered ────────────────────────── */}
      {triggeredConditions.length > 0 && (
        <div className="result-section">
          <h2 className="result-section-title">
            <span className="section-icon">{riskLevel === 'red' ? '🛑' : '🔶'}</span>
            Why This Risk Level Was Triggered
          </h2>
          <p className="result-section-desc">
            The following formal model conditions fired and determined the final risk level.
            Conditions are evaluated in strict precedence order — the first condition that
            fires sets the final result.
          </p>
          <div className="triggered-conditions-list">
            {triggeredConditions.map((cond, i) => (
              <div
                key={i}
                className={`triggered-condition triggered-condition-${riskLevel}`}
              >
                <div className="tc-header">
                  <span className={`tc-badge tc-badge-${riskLevel}`}>
                    {riskLevel === 'red' ? 'HARD STOP RULE' : 'CAUTION RULE'}
                  </span>
                  <span className="tc-rule">{cond.rule}</span>
                </div>
                <p className="tc-detail">{cond.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Never Events ─────────────────────────────────────────────── */}
      {triggeredNeverEvents.length > 0 && (
        <div className="result-section never-events-section">
          <h2 className="result-section-title">
            <span className="section-icon">🚫</span>
            Institutional "Never Event" Rules Triggered
            <span className="badge badge-red">{triggeredNeverEvents.length}</span>
          </h2>
          <p className="result-section-desc">
            These rules are derived from official guidance by the FTC, IRS, SSA, FBI, NIST,
            and financial institutions. A legitimate entity will NEVER violate these rules.
            Their presence is a hard override — no other condition can downgrade this to yellow
            or green.
          </p>
          <div className="never-event-list">
            {triggeredNeverEvents.map((ne) => (
              <div key={ne.id} className="never-event-card">
                <div className="ne-header">
                  <span className="ne-stop">NEVER EVENT</span>
                  <span className="ne-title">{ne.title}</span>
                </div>
                <p className="ne-rule">Rule: {ne.rule}</p>
                <div className="ne-message">{ne.message}</div>
                <p className="ne-source">Source: {ne.source}</p>
                {ne.url && (
                  <p className="ne-link">
                    <a href={ne.url} target="_blank" rel="noreferrer">
                      View official guidance
                    </a>
                  </p>
                )}
                {ne.rationale && (
                  <p className="ne-rationale">Why this matters: {ne.rationale}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Intervention Guidance ─────────────────────────────────────── */}
      <div className="result-section">
        <h2 className="result-section-title">
          <span className="section-icon">📋</span>
          Intervention Guidance
        </h2>
        <div className="intervention-messages">
          {intervention.interventions.map((msg, i) => (
            <div key={i} className={`intervention-msg intervention-msg-${riskLevel}`}>
              {msg}
            </div>
          ))}
        </div>
      </div>

      {/* ── Recommended Next Steps ────────────────────────────────────── */}
      <div className="result-section">
        <h2 className="result-section-title">
          <span className="section-icon">✅</span>
          Recommended Next Steps
        </h2>
        <ol className="next-steps-list">
          {intervention.nextSteps.map((step, i) => (
            <li key={i} className={`next-step next-step-${riskLevel}`}>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* ── Complexity Score ──────────────────────────────────────────── */}
      <div className="result-section">
        <h2 className="result-section-title">
          <span className="section-icon">📊</span>
          Structural Complexity Score
        </h2>
        <div className="complexity-display">
          <div className="complexity-score-box">
            <span className={`complexity-number complexity-${riskLevel}`}>
              {complexityScore}
            </span>
            <span className="complexity-max">/ 6</span>
          </div>
          <div className="complexity-bar-wrap">
            <div className="complexity-bar-track">
              <div
                className={`complexity-bar-fill complexity-fill-${riskLevel}`}
                style={{ width: `${(complexityScore / 6) * 100}%` }}
              />
            </div>
            <div className="complexity-bar-labels">
              <span>0</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
              <span>6</span>
            </div>
          </div>
          <div className="complexity-label-text">
            <strong>{complexityLabel}</strong> complexity
          </div>
        </div>
        {complexityFactors.length > 0 ? (
          <div className="complexity-factors">
            <p className="factors-intro">
              Active factors ({complexityFactors.length}/6):
            </p>
            <ul className="factor-list">
              {complexityFactors.map((f, i) => (
                <li key={i} className="factor-item">
                  <span className="factor-dot" />
                  <div>
                    <strong>{f.label}</strong>
                    <span className="factor-desc"> — {f.description}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="no-factors">
            No complexity factors detected — interaction appears structurally simple.
          </p>
        )}
        <div className="complexity-rubric">
          <p className="rubric-title">Scoring Rubric (each factor = +1 point):</p>
          <div className="rubric-grid">
            {[
              'Multi-step interaction',
              'Multi-channel escalation',
              'Impersonation / authority',
              'Urgency / time pressure',
              'Tooling / system interaction',
              'Irreversible action boundary',
            ].map((item, i) => {
              const active = complexityFactors.some((f) =>
                f.label.toLowerCase().startsWith(item.split(' ')[0].toLowerCase())
              );
              return (
                <div
                  key={i}
                  className={`rubric-item ${active ? 'rubric-active' : 'rubric-inactive'}`}
                >
                  <span className="rubric-check">{active ? '✓' : '○'}</span>
                  <span>{item}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Layer Risk Summary ────────────────────────────────────────── */}
      <div className="result-section">
        <h2 className="result-section-title">
          <span className="section-icon">🗂️</span>
          Layer Risk Summary (Worst-of-Layer Aggregation)
        </h2>
        <p className="result-section-desc">
          Each layer score equals the highest-risk answer within that layer. Final risk is
          determined by combining all three layers using the formal precedence rules.
        </p>
        <div className="layer-summary">
          {Object.entries(layerRisk).map(([layerId, risk]) => (
            <div key={layerId} className={`layer-summary-row layer-row-${risk}`}>
              <span className={`layer-risk-dot dot-sm dot-${risk}`} />
              <span className="layer-summary-name">{LAYER_LABELS[layerId]}</span>
              <span className={`layer-risk-badge badge-inline-${risk}`}>
                {risk === 'red'
                  ? 'HIGH RISK'
                  : risk === 'yellow'
                  ? 'CAUTION'
                  : risk === 'green'
                  ? 'LOW RISK'
                  : 'PENDING'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Per-Question Risk Breakdown ───────────────────────────────── */}
      {(redQuestions.length > 0 || yellowQuestions.length > 0) && (
        <div className="result-section">
          <h2 className="result-section-title">
            <span className="section-icon">🔍</span>
            Per-Question Risk Signals
            {redQuestions.length > 0 && (
              <span className="badge badge-red">{redQuestions.length} red</span>
            )}
            {yellowQuestions.length > 0 && (
              <span className="badge badge-yellow">{yellowQuestions.length} yellow</span>
            )}
          </h2>
          {redQuestions.length > 0 && (
            <div className="signals-group">
              <p className="signals-group-label red-label">High-Risk Signals (RED)</p>
              <ul className="signal-list">
                {redQuestions.map(([key]) => {
                  const qId = QUESTIONS.find((q) => {
                    const map = {
                      q1: 'contactModality',
                      q2: 'claimedIdentity',
                      q3: 'initiatedContact',
                      q4: 'relationshipValidity',
                      q5: 'personalization',
                      q6: 'pressureSignals',
                      q7: 'escalation',
                      q8: 'requestedAction',
                      q9: 'verificationState',
                    };
                    return map[key] === q.id;
                  });
                  return (
                    <li key={key} className="signal-item signal-red">
                      <span className="signal-icon">●</span>
                      <strong>{Q_LABELS[key]}</strong>
                      {qId && answers[qId.id] && (
                        <span className="signal-answer">
                          {' '}
                          — answer scored RED by formal model
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {yellowQuestions.length > 0 && (
            <div className="signals-group">
              <p className="signals-group-label yellow-label">Caution Signals (YELLOW)</p>
              <ul className="signal-list">
                {yellowQuestions.map(([key]) => (
                  <li key={key} className="signal-item signal-yellow">
                    <span className="signal-icon">●</span>
                    <strong>{Q_LABELS[key]}</strong>
                    <span className="signal-answer">
                      {' '}
                      — answer scored YELLOW by formal model
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Formal Model Debug View (for UAT / review) ───────────────── */}
      <div className="result-section">
        <button
          className="btn-toggle-answers"
          onClick={() => setShowModelDetail((v) => !v)}
        >
          {showModelDetail ? '▾ Hide' : '▸ Show'} Formal Model Output (UAT Review)
        </button>
        {showModelDetail && (
          <div className="answer-summary" style={{ marginTop: 12 }}>
            <div className="answer-summary-row">
              <span className="answer-key">finalRisk:</span>
              <span className="answer-val">{riskLevel}</span>
            </div>
            <div className="answer-summary-row">
              <span className="answer-key">complexityScore:</span>
              <span className="answer-val">{complexityScore} / 6</span>
            </div>
            <div className="answer-summary-row">
              <span className="answer-key">triggeredNeverEvents:</span>
              <span className="answer-val">
                {triggeredNeverEvents.length > 0
                  ? triggeredNeverEvents.map((ne) => ne.id).join(', ')
                  : 'none'}
              </span>
            </div>
            {Object.entries(layerRisk).map(([k, v]) => (
              <div key={k} className="answer-summary-row">
                <span className="answer-key">layerRisk.{k}:</span>
                <span className="answer-val">{v}</span>
              </div>
            ))}
            {Object.entries(questionRisk).map(([k, v]) => (
              <div key={k} className="answer-summary-row">
                <span className="answer-key">questionRisk.{k}:</span>
                <span className="answer-val">{v}</span>
              </div>
            ))}
          </div>
        )}
        <button
          className="btn-toggle-answers"
          style={{ marginTop: 8 }}
          onClick={() => setShowAnswerSummary((v) => !v)}
        >
          {showAnswerSummary ? '▾ Hide' : '▸ Show'} Raw Answers
        </button>
        {showAnswerSummary && (
          <div className="answer-summary" style={{ marginTop: 12 }}>
            {Object.entries(answers).map(([key, val]) => (
              <div key={key} className="answer-summary-row">
                <span className="answer-key">{key}:</span>
                <span className="answer-val">
                  {Array.isArray(val) ? val.join(', ') : val}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Restart ───────────────────────────────────────────────────── */}
      <div className="result-actions">
        <button className="btn-restart" onClick={onRestart}>
          ↩ Start Over / New Scenario
        </button>
        <p className="restart-note">
          GT CS 6727 Practicum · A Human-Centered Analysis of Phishing and Social Engineering
          Risk
        </p>
      </div>
    </div>
  );
}