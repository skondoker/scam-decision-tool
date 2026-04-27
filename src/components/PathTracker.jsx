/**
 * PathTracker.jsx
 * ===============
 * Visual path tracker sidebar.
 *
 * IMPORTANT: All node colors come directly from the engine's questionRisk and
 * layerRisk outputs (computed by evaluateAssessment in riskEngine.js).
 * This component does NOT compute or infer any risk logic - it only renders
 * what the formal decision model has already determined.
 *
 * Per-question node colors:
 *   gray   = not yet answered
 *   blue   = currently active question
 *   green  = low-risk answer (engine: 'green')
 *   yellow = caution (engine: 'yellow')
 *   red    = high-risk / hard-stop (engine: 'red')
 *
 * Layer colors = worst-of-layer as computed by the engine.
 */

import React from 'react';
import { QUESTIONS, PATH_STEPS } from '../data/questions';

// Maps question ID → engine questionRisk key
const Q_ID_TO_KEY = {
  contactModality:    'q1',
  claimedIdentity:    'q2',
  initiatedContact:   'q3',
  relationshipValidity: 'q4',
  personalization:    'q5',
  pressureSignals:    'q6',
  escalation:         'q7',
  requestedAction:    'q8',
  verificationState:  'q9',
};

function truncate(str, maxLen) {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

function getAllOptions(question) {
  if (question.optionGroups) return question.optionGroups.flatMap(g => g.options);
  return question.options || [];
}

/** Get display label for a given answer to show inline in the path */
function getAnswerLabel(question, answer) {
  if (!answer) return null;
  const opts = getAllOptions(question);

  if (question.type === 'single') {
    const opt = opts.find(o => o.value === answer);
    return opt ? truncate(opt.label, 40) : answer;
  }

  if (question.type === 'multi') {
    if (!Array.isArray(answer) || answer.length === 0) return null;
    if (answer.includes('none') && answer.length === 1) return 'None selected';
    const filtered = answer.filter(v => v !== 'none' && v !== 'nothing');
    const labels = filtered.map(v => {
      const opt = opts.find(o => o.value === v);
      return opt ? truncate(opt.label, 28) : v;
    });
    if (labels.length === 0) return 'Nothing selected';
    if (labels.length <= 2) return labels.join(', ');
    return `${labels[0]}, +${labels.length - 1} more`;
  }

  return null;
}

export default function PathTracker({
  answers,
  currentQuestionIndex,
  questionRisk,   // from engine: { q1..q9 }
  layerRisk,      // from engine: { contact, lure, action }
  finalRisk,
  isComplete,
}) {
  return (
    <aside className="path-tracker">
      <div className="path-tracker-header">
        <h3>Decision Path</h3>
        <p className="path-tracker-subtitle">3-layer formal decision model · colors from risk engine</p>
      </div>

      <div className="path-layers">
        {PATH_STEPS.map((layer, layerIdx) => {
          const layerQuestions = QUESTIONS.filter(q => q.layer === layer.id);
          const firstQIdx = QUESTIONS.findIndex(q => q.layer === layer.id);
          const lastQIdxRaw = [...QUESTIONS].reverse().findIndex(q => q.layer === layer.id);
          const lastQIdx = lastQIdxRaw === -1 ? -1 : QUESTIONS.length - 1 - lastQIdxRaw;

          const isLayerComplete = isComplete || currentQuestionIndex > lastQIdx;
          const isLayerActive = currentQuestionIndex >= firstQIdx && currentQuestionIndex <= lastQIdx;
          const isLayerPending = currentQuestionIndex < firstQIdx;

          // Layer color comes directly from engine's layerRisk
          const lrColor = isLayerPending ? 'gray' : (layerRisk[layer.id] ?? 'gray');

          return (
            <div key={layer.id} className="path-layer">
              {/* Layer header */}
              <div className={[
                'path-layer-header',
                isLayerActive ? 'active' : '',
                isLayerComplete ? `complete risk-bg-${lrColor}` : '',
              ].join(' ')}>
                <div className={[
                  'path-layer-dot',
                  `dot-${isLayerPending ? 'gray' : lrColor}`,
                  isLayerActive ? 'dot-pulsing' : '',
                ].join(' ')}>
                  <span className="dot-icon">
                    {isLayerComplete ? '✓' : layerIdx + 1}
                  </span>
                </div>
                <div className="path-layer-info">
                  <span className="path-layer-num">{layer.layer}</span>
                  <span className="path-layer-name">{layer.label}</span>
                </div>
                <span className="path-layer-icon">{layer.icon}</span>
              </div>

              {/* Questions within this layer */}
              <div className="path-questions">
                {layerQuestions.map((question) => {
                  const qIdx = QUESTIONS.findIndex(q => q.id === question.id);
                  const answer = answers[question.id];
                  const isAnswered = answer !== undefined && answer !== null &&
                    (Array.isArray(answer) ? answer.length > 0 : answer !== '');
                  const isCurrent = qIdx === currentQuestionIndex && !isComplete;
                  const isPending = qIdx > currentQuestionIndex && !isComplete;

                  // Color from engine's questionRisk - NOT computed locally
                  const engineKey = Q_ID_TO_KEY[question.id];
                  const engineColor = questionRisk[engineKey];

                  let dotColor = 'gray';
                  if (isCurrent) {
                    dotColor = 'blue';
                  } else if (isAnswered && engineColor) {
                    dotColor = engineColor;
                  }

                  const label = getAnswerLabel(question, answer);

                  return (
                    <div
                      key={question.id}
                      className={[
                        'path-question',
                        isCurrent ? 'path-question-current' : '',
                        isPending ? 'path-question-pending' : '',
                      ].join(' ')}
                    >
                      <div className="path-connector">
                        <div className={`path-connector-line line-${isAnswered || isCurrent ? dotColor : 'gray'}`} />
                        <div className={[
                          'path-question-dot dot-sm',
                          `dot-${dotColor}`,
                          isCurrent ? 'dot-pulsing' : '',
                        ].join(' ')} />
                      </div>

                      <div className="path-question-content">
                        <span className={[
                          'path-question-text',
                          isCurrent ? 'text-current' : '',
                          isPending ? 'text-pending' : '',
                        ].join(' ')}>
                          {`Q${question.step}: ${truncate(question.text, 38)}`}
                        </span>
                        {isAnswered && label && (
                          <span className={`path-answer-label label-${dotColor}`}>
                            → {label}
                          </span>
                        )}
                        {isCurrent && !isAnswered && (
                          <span className="path-answer-label label-current">← Answering now</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Connector line between layers */}
              {layerIdx < PATH_STEPS.length - 1 && (
                <div className={`layer-connector lc-${isLayerPending ? 'gray' : lrColor}`} />
              )}
            </div>
          );
        })}

        {/* Final result node */}
        <div className="path-result-node">
          <div className={`path-layer-dot ${isComplete ? `dot-${finalRisk}` : 'dot-gray'}`}>
            <span className="dot-icon">{isComplete ? '★' : '?'}</span>
          </div>
          <div className="path-result-label">
            {isComplete ? (
              <span className={`result-tag result-tag-${finalRisk}`}>
                {finalRisk === 'red' ? 'HARD STOP' : finalRisk === 'yellow' ? 'CAUTION' : 'LOW RISK'}
              </span>
            ) : (
              <span className="result-tag result-tag-pending">Final Result</span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
