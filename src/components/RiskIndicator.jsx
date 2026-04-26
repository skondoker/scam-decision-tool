/**
 * RiskIndicator.jsx
 * =================
 * Displays the current risk level as a prominent color-coded badge.
 * Updates dynamically after every question answer.
 * Shown persistently in the header so users always see their current risk state.
 */

import React from 'react';

const RISK_CONFIG = {
  green: {
    label: 'LOW RISK',
    sublabel: 'Continue Cautiously',
    icon: '✓',
    className: 'risk-green',
  },
  yellow: {
    label: 'CAUTION',
    sublabel: 'Verify First',
    icon: '!',
    className: 'risk-yellow',
  },
  red: {
    label: 'HARD STOP',
    sublabel: 'Do Not Proceed',
    icon: '✕',
    className: 'risk-red',
  },
  none: {
    label: 'ASSESSING',
    sublabel: 'Answer to begin',
    icon: '?',
    className: 'risk-none',
  },
};

export default function RiskIndicator({ riskLevel, complexityScore, questionsAnswered, totalQuestions }) {
  const config = RISK_CONFIG[riskLevel] || RISK_CONFIG.none;

  return (
    <div className={`risk-indicator ${config.className}`}>
      <div className="risk-icon">{config.icon}</div>
      <div className="risk-text">
        <span className="risk-label">{config.label}</span>
        <span className="risk-sublabel">{config.sublabel}</span>
      </div>
      {questionsAnswered > 0 && (
        <div className="risk-meta">
          <span className="risk-complexity">
            Complexity: <strong>{complexityScore}/6</strong>
          </span>
          <span className="risk-progress">
            {questionsAnswered}/{totalQuestions} questions
          </span>
        </div>
      )}
    </div>
  );
}
