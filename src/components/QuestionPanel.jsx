/**
 * QuestionPanel.jsx
 * =================
 * One question at a time with real-time inline explanations.
 *
 * When the user selects any option, an explanation callout appears
 * immediately below that option - before they press Next.
 * This ensures users get context even if they never finish the assessment.
 *
 * For single-select: shows explanation for the currently selected option.
 * For multi-select:  shows explanation for the most recently toggled option,
 *                    plus a summary count of all selected items.
 *
 * Explanation callout is color-coded to match the option's riskColor.
 */

import React, { useState } from 'react';
import { QUESTIONS } from '../data/questions';

const LAYER_COLORS = { contact: 'layer-contact', lure: 'layer-lure', action: 'layer-action' };
const LAYER_LABELS = {
  contact: 'Layer 1 · Contact & Identity',
  lure:    'Layer 2 · Pressure & Tactics',
  action:  'Layer 3 · Requested Actions',
};

export default function QuestionPanel({
  currentQuestionIndex,
  answers,
  onAnswer,
  onNext,
  onBack,
  riskLevel,
}) {
  const question = QUESTIONS[currentQuestionIndex];
  const isLast = currentQuestionIndex === QUESTIONS.length - 1;
  const currentAnswer = answers[question.id];

  // Track the most recently clicked option for multi-select explanation display
  const [lastClickedValue, setLastClickedValue] = useState(null);

  // Reset last clicked when question changes
  const questionKey = question.id;

  const hasAnswer =
    question.type === 'single'
      ? Boolean(currentAnswer)
      : Array.isArray(currentAnswer) && currentAnswer.length > 0;

  // ── Single select ──────────────────────────────────────────────────────────
  function handleSingleSelect(value) {
    onAnswer(question.id, value);
    setLastClickedValue(value);
  }

  // ── Multi select ───────────────────────────────────────────────────────────
  function handleMultiToggle(value) {
    const prev = Array.isArray(currentAnswer) ? currentAnswer : [];

    if (value === 'none' || value === 'nothing') {
      if (prev.includes(value)) {
        onAnswer(question.id, []);
        setLastClickedValue(null);
      } else {
        onAnswer(question.id, [value]);
        setLastClickedValue(value);
      }
      return;
    }

    let next = prev.filter(v => v !== 'none' && v !== 'nothing');
    if (next.includes(value)) {
      next = next.filter(v => v !== value);
      // If deselecting, show explanation for a still-selected item if any
      setLastClickedValue(next.length > 0 ? next[next.length - 1] : null);
    } else {
      next = [...next, value];
      setLastClickedValue(value);
    }

    onAnswer(question.id, next.length > 0 ? next : []);
  }

  const isMultiNoneSelected =
    question.type === 'multi' &&
    Array.isArray(currentAnswer) &&
    (currentAnswer.includes('none') || currentAnswer.includes('nothing'));

  // ── Which option's explanation to show ────────────────────────────────────
  // Single: the selected option
  // Multi: the last clicked option (or first selected if none clicked yet)
  const explanationValue =
    question.type === 'single'
      ? currentAnswer
      : (lastClickedValue && getArr(currentAnswer).includes(lastClickedValue))
        ? lastClickedValue
        : getArr(currentAnswer).filter(v => v !== 'none' && v !== 'nothing')[0] ?? null;

  const explanationOption = question.options.find(o => o.value === explanationValue);

  const progress = (currentQuestionIndex / QUESTIONS.length) * 100;

  return (
    <div className="question-panel">
      {/* Progress bar */}
      <div className="progress-bar-wrap">
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="progress-label">
          Question {currentQuestionIndex + 1} of {QUESTIONS.length}
        </span>
      </div>

      {/* Layer badge */}
      <div className={`layer-badge ${LAYER_COLORS[question.layer]}`}>
        {LAYER_LABELS[question.layer]}
      </div>

      {/* Question card */}
      <div className={`question-card border-${riskLevel}`}>
        <h2 className="question-text">{question.text}</h2>
        {question.helpText && (
          <p className="question-help">{question.helpText}</p>
        )}

        {/* Options */}
        <div className="options-list">
          {question.options.map(option => {
            const isSelected =
              question.type === 'single'
                ? currentAnswer === option.value
                : Array.isArray(currentAnswer) && currentAnswer.includes(option.value);

            const isDisabled =
              question.type === 'multi' &&
              isMultiNoneSelected &&
              option.value !== 'none' &&
              option.value !== 'nothing';

            return (
              <div key={option.value} className="option-wrapper">
                {/* The button itself */}
                <button
                  className={[
                    'option-btn',
                    isSelected ? `option-selected option-selected-${option.riskColor}` : '',
                    isDisabled ? 'option-disabled' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() =>
                    question.type === 'single'
                      ? handleSingleSelect(option.value)
                      : handleMultiToggle(option.value)
                  }
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                >
                  <span className="option-selector">
                    {question.type === 'single' ? (
                      <span className={`radio-circle ${isSelected ? 'radio-filled' : ''}`} />
                    ) : (
                      <span className={`checkbox-box ${isSelected ? 'checkbox-checked' : ''}`}>
                        {isSelected && <span>✓</span>}
                      </span>
                    )}
                  </span>
                  <span className="option-label">{option.label}</span>
                  <span
                    className={`option-risk-dot dot-tiny dot-${option.riskColor}`}
                    title={`Risk signal: ${option.riskColor}`}
                  />
                </button>

                {/* Inline explanation - shown immediately when this option is selected */}
                {isSelected && option.explanation && option.value === explanationValue && (
                  <div className={`option-explanation explanation-${option.riskColor}`}>
                    <span className="explanation-icon">
                      {option.riskColor === 'red' ? '⚠️' : option.riskColor === 'yellow' ? 'ℹ️' : '✓'}
                    </span>
                    <p>{option.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Multi-select hint */}
        {question.type === 'multi' && (
          <p className="multi-select-hint">
            {Array.isArray(currentAnswer) && currentAnswer.filter(v => v !== 'none' && v !== 'nothing').length > 0
              ? `${currentAnswer.filter(v => v !== 'none' && v !== 'nothing').length} selected: select all that apply`
              : 'Select all that apply, or choose "None of the above"'}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="nav-buttons">
        <button
          className="btn-back"
          onClick={() => { onBack(); setLastClickedValue(null); }}
          disabled={currentQuestionIndex === 0}
        >
          ← Back
        </button>
        <button
          className={`btn-next ${!hasAnswer ? 'btn-disabled' : `btn-next-${riskLevel}`}`}
          onClick={() => { onNext(); setLastClickedValue(null); }}
          disabled={!hasAnswer}
        >
          {isLast ? 'See Results →' : 'Next →'}
        </button>
      </div>

      {riskLevel === 'red' && hasAnswer && (
        <div className="inline-warning">
          ⚠️ Your current answers have triggered risk signals. Continue to see the full assessment and recommended next steps.
        </div>
      )}
    </div>
  );
}

function getArr(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}
