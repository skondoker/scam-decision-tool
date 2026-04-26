/**
 * App.jsx
 * =======
 * Root component. All risk logic is delegated to evaluateAssessment() —
 * the single source of truth defined in the Formal Decision Model.
 *
 * evaluateAssessment() returns the complete result object including:
 *   finalRisk, questionRisk, layerRisk, complexityScore, triggeredNeverEvents,
 *   triggeredConditions, intervention
 *
 * These are passed directly to child components — no logic is computed here.
 */

import React, { useState, useMemo } from 'react';
import { QUESTIONS } from './data/questions';
import { evaluateAssessment, detectArchetype } from './utils/riskEngine';
import QuestionPanel from './components/QuestionPanel';
import PathTracker from './components/PathTracker';
import RiskIndicator from './components/RiskIndicator';
import ResultPanel from './components/ResultPanel';

export default function App() {
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // ── Single formal model evaluation — runs after every answer ─────────────
  const assessment = useMemo(() => {
    if (Object.keys(answers).length === 0) return null;
    return evaluateAssessment(answers);
  }, [answers]);

  const finalData = useMemo(() => {
    if (!isComplete || !assessment) return null;
    return {
      ...assessment,
      archetype: detectArchetype(answers),
    };
  }, [isComplete, assessment, answers]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleAnswer(questionId, value) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }

  function handleNext() {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsComplete(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleBack() {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(i => i - 1);
  }

  function handleRestart() {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setIsComplete(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Derived display values ────────────────────────────────────────────────
  const currentRisk = assessment?.finalRisk ?? 'none';
  const complexityScore = assessment?.complexityScore ?? 0;
  const questionRisk = assessment?.questionRisk ?? {};
  const layerRisk = assessment?.layerRisk ?? {};

  return (
    <div className="app">
      {/* Header with persistent risk indicator */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-title-block">
            <h1 className="app-title">Decision Support Tool for Suspected Phishing Activity</h1>
            <p className="app-subtitle">
              GT CS 6727 · Human-Centered Phishing &amp; Social Engineering Framework
            </p>
          </div>
          <RiskIndicator
            riskLevel={currentRisk}
            complexityScore={complexityScore}
            questionsAnswered={Object.keys(answers).length}
            totalQuestions={QUESTIONS.length}
          />
        </div>
      </header>

      {/* Intro banner shown before first answer */}
      {Object.keys(answers).length === 0 && !isComplete && (
        <div className="intro-banner">
          <div className="intro-content">
            <h2>Is this contact legitimate?</h2>
            <p>
              Answer 9 questions about this suspicious contact. The tool will assess risk
              using a formal 3-layer decision model, apply institutional rules, and give
              you clear next steps — before you take any irreversible action.
            </p>
            <div className="intro-layers">
              <div className="intro-layer"><span className="intro-layer-icon">📡</span><span>Layer 1: Contact &amp; Identity</span></div>
              <div className="intro-layer"><span className="intro-layer-icon">⚠️</span><span>Layer 2: Pressure &amp; Tactics</span></div>
              <div className="intro-layer"><span className="intro-layer-icon">🚨</span><span>Layer 3: Requested Actions</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="app-body">
        {/* Path tracker receives questionRisk and layerRisk from the engine — no UI-derived logic */}
        <PathTracker
          answers={answers}
          currentQuestionIndex={isComplete ? QUESTIONS.length : currentQuestionIndex}
          questionRisk={questionRisk}
          layerRisk={layerRisk}
          finalRisk={currentRisk}
          isComplete={isComplete}
        />

        <main className="main-content">
          {!isComplete ? (
            <QuestionPanel
              currentQuestionIndex={currentQuestionIndex}
              answers={answers}
              onAnswer={handleAnswer}
              onNext={handleNext}
              onBack={handleBack}
              riskLevel={currentRisk === 'none' ? 'green' : currentRisk}
            />
          ) : (
            finalData && (
              <ResultPanel
                riskLevel={finalData.finalRisk}
                intervention={finalData.intervention}
                complexityScore={finalData.complexityScore}
                complexityFactors={finalData.complexityFactors}
                triggeredNeverEvents={finalData.triggeredNeverEvents}
                triggeredConditions={finalData.triggeredConditions}
                questionRisk={finalData.questionRisk}
                layerRisk={finalData.layerRisk}
                archetype={finalData.archetype}
                answers={answers}
                onRestart={handleRestart}
              />
            )
          )}
        </main>
      </div>
    </div>
  );
}
