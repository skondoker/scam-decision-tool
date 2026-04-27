/**
 * QuestionPanel.jsx
 * =================
 * One question at a time with real-time inline explanations.
 * Supports both flat `options` arrays and grouped `optionGroups` arrays.
 * When `optionGroups` is present, each group renders a header label above its options.
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

  const [lastClickedValue, setLastClickedValue] = useState(null);

  // Flatten optionGroups or use flat options array
  const allOptions = question.optionGroups
    ? question.optionGroups.flatMap(g => g.options)
    : question.options;

  const hasAnswer =
    question.type === 'single'
      ? Boolean(currentAnswer)
      : Array.isArray(currentAnswer) && currentAnswer.length > 0;

  function handleSingleSelect(value) {
    onAnswer(question.id, value);
    setLastClickedValue(value);
  }

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

  const explanationValue =
    question.type === 'single'
      ? currentAnswer
      : (lastClickedValue && getArr(currentAnswer).includes(lastClickedValue))
        ? lastClickedValue
        : getArr(currentAnswer).filter(v => v !== 'none' && v !== 'nothing')[0] ?? null;

  const explanationOption = allOptions.find(o => o.value === explanationValue);

  const progress = (currentQuestionIndex / QUESTIONS.length) * 100;

  // Renders a single option button (shared between grouped and flat rendering)
  function renderOption(option) {
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
  }

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

        {/* Options — grouped or flat */}
        <div className="options-list">
          {question.optionGroups
            ? question.optionGroups.map(group => (
                <div key={group.label} className="option-group">
                  <div className="option-group-label">{group.label}</div>
                  {group.options.map(option => renderOption(option))}
                </div>
              ))
            : question.options.map(option => renderOption(option))
          }
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
