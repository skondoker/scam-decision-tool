/**
 * riskEngine.js
 * =============
 * FINAL DECISION MODEL — Single Source of Truth
 * Source: "Final Decision Model.docx" — CS 6727 Practicum
 *
 * Evaluation order (STRICT — DO NOT REORDER):
 *   Step 1:  Evaluate ALL never-event rules          → if any fire, finalRisk = RED (hard override)
 *   Step 2:  Compute per-question risk (Q1–Q9)
 *   Step 3:  Compute layer-level risk (worst-of-layer)
 *   Step 4:  Compute complexity score (0–6)
 *   Step 5:  Evaluate Explicit RED rules
 *   Step 6:  Apply High-Risk Signal Aggregation
 *   Step 7:  Apply Cautionary Signal Aggregation
 *   Step 8:  Safe Condition fallback → GREEN
 *
 * Once finalRisk = RED, no later rule may downgrade it.
 * Once finalRisk = YELLOW, only a later RED rule may override it.
 * GREEN is assigned only if no RED or YELLOW rule fires.
 */

// ─── Array-safe accessors ─────────────────────────────────────────────────────

function getArr(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

/** HAS_ACTION(x) := RA contains x */
export function hasAction(answers, x) {
  return getArr(answers.requestedAction).includes(x);
}

/** HAS_PRESSURE(x) := PS contains x */
function hasPressure(answers, x) {
  return getArr(answers.pressureSignals).includes(x);
}

/** HAS_ESCALATION(x) := E contains x */
function hasEscalation(answers, x) {
  return getArr(answers.escalation).includes(x);
}

// ─── Grouped Conditions (Final Decision Model — exactly as defined) ───────────
function IS_IRS(a)        { return a.claimedIdentity === 'irs'; }
function IS_SSA(a)        { return a.claimedIdentity === 'ssa'; }
function IS_LE(a)         { return a.claimedIdentity === 'lawenforcement'; }

function IS_GOV(a)        { return ['irs', 'lawenforcement', 'ssa'].includes(a.claimedIdentity); }

function IS_BANK(a)       { return a.claimedIdentity === 'bank'; }
function IS_UTILITY(a)    { return a.claimedIdentity === 'utility'; }
function IS_TECH(a)       { return a.claimedIdentity === 'techsupport'; }
function IS_AMAZON(a)     { return a.claimedIdentity === 'marketplace'; }
function IS_ROMANCE(a)    { return a.claimedIdentity === 'romance'; }
function IS_CRYPTO(a)     { return a.claimedIdentity === 'crypto'; }
function IS_PAYMENT_APP(a){ return ['zelle','paypal','venmo','cashapp'].includes(a.claimedIdentity); }

function IS_PAYMENT(a)    { return hasAction(a,'transferMoney') || hasAction(a,'giftCards') || hasAction(a,'sendCrypto'); }
function IS_CREDENTIAL(a) { return hasAction(a,'enterPassword') || hasAction(a,'resetPassword') || hasAction(a,'shareSSN'); }
function IS_MFA(a)        { return hasAction(a,'approveMFA') || hasAction(a,'shareMFA'); }
function IS_REMOTE(a)     { return hasAction(a,'installSoftware'); }
function IS_LINK(a)       { return hasAction(a,'clickLink') || hasAction(a,'openAttachment') || hasAction(a,'callNumber'); }
function IS_UNSOLICITED(a){ return a.initiatedContact === 'no'; }
function IS_BLOCKED(a)    { return a.verificationState === 'blocked'; }

/** IRREVERSIBLE_ACTION := IS_PAYMENT OR IS_CREDENTIAL OR IS_MFA OR IS_REMOTE */
function IRREVERSIBLE_ACTION(a) {
  return IS_PAYMENT(a) || IS_CREDENTIAL(a) || IS_MFA(a) || IS_REMOTE(a);
}

/**
 * Instruction-based conditions.
 * These are captured via the answers object if such questions are added.
 * They evaluate to false when the relevant question is not present.
 */
function INSTRUCTION_SAFE_ACCOUNT(a)  { return !!a.instructionSafeAccount; }
function INSTRUCTION_SEND_TO_RECEIVE(a){ return !!a.instructionSendToReceive; }
function INSTRUCTION_SECURE_ACCOUNT(a){ return !!a.instructionSecureAccount; }
function INSTRUCTION_OFF_PLATFORM(a)  { return !!a.instructionOffPlatform; }

// ─── Risk Ordering ────────────────────────────────────────────────────────────

const RISK_PRIORITY = { red: 3, yellow: 2, green: 1, gray: 0 };

function worst(risks) {
  let max = 'gray';
  for (const r of risks) {
    if ((RISK_PRIORITY[r] ?? 0) > (RISK_PRIORITY[max] ?? 0)) max = r;
  }
  return max;
}

// ─── Step 2: Per-Question Risk (exact branch logic from model) ────────────────

function riskQ1(a) {
  const cm = a.contactModality;
  if (cm === 'popup') return 'red';
  if (['sms','email','phone','social','inapp'].includes(cm)) return 'yellow';
  return 'gray';
}

function riskQ2(a) {
  const ci = a.claimedIdentity;
  if (['irs','lawenforcement','ssa','techsupport','crypto','romance'].includes(ci)) return 'red';
  if (['bank','utility','marketplace','delivery','friend','other'].includes(ci)) return 'yellow';
  return 'gray';
}

function riskQ3(a) {
  if (a.initiatedContact === 'yes') return 'green';
  if (a.initiatedContact === 'no')  return 'red';
  return 'gray';
}

function riskQ4(a) {
  if (a.relationshipValidity === 'yes')   return 'green';
  if (a.relationshipValidity === 'unsure') return 'yellow';
  if (a.relationshipValidity === 'no')    return 'red';
  return 'gray';
}

function riskQ5(a) {
  if (a.personalization === 'none') return 'green';
  if (['basic','account','context'].includes(a.personalization)) return 'yellow';
  return 'gray';
}

function riskQ6(a) {
  const ps = getArr(a.pressureSignals);
  if (ps.length === 1 && ps[0] === 'none') return 'green';
  if (ps.includes('legalThreat') || ps.includes('doNotTell') ||
      ps.includes('doNotVerify') || ps.includes('stayOnLine')) return 'red';
  if (ps.includes('urgency') || ps.includes('accountSuspension') ||
      ps.includes('financialLoss')) return 'yellow';
  return 'gray';
}

function riskQ7(a) {
  const e = getArr(a.escalation);
  if (e.length === 1 && e[0] === 'none') return 'green';
  if (e.includes('multiStep') || e.includes('channelSwitch') || e.includes('thirdParty')) return 'yellow';
  return 'gray';
}

function riskQ8(a) {
  const ra = getArr(a.requestedAction);
  if (ra.length > 0 && ra.every(v => v === 'nothing')) return 'green';
  if (IRREVERSIBLE_ACTION(a)) return 'red';
  if (IS_LINK(a)) return 'yellow';
  return 'gray';
}

function riskQ9(a) {
  if (a.verificationState === 'canVerify') return 'green';
  if (a.verificationState === 'notSure')   return 'yellow';
  if (a.verificationState === 'blocked')   return 'red';
  return 'gray';
}

// ─── Step 4: Complexity Score ─────────────────────────────────────────────────

export function computeComplexityScore(answers) {
  let score = 0;
  const factors = [];

  if (hasEscalation(answers, 'multiStep')) {
    score += 1;
    factors.push({ label: 'Multi-step interaction', description: 'Multiple decisions or exchanges have already occurred before this point.' });
  }

  if (hasEscalation(answers, 'channelSwitch') || hasEscalation(answers, 'thirdParty')) {
    score += 1;
    factors.push({ label: 'Multi-channel escalation', description: 'The interaction moved across communication channels or directed you to a third-party contact.' });
  }

  const authorityIds = ['irs','lawenforcement','ssa','techsupport','employer','romance','crypto','bank','utility','marketplace'];
  if (answers.claimedIdentity && authorityIds.includes(answers.claimedIdentity)) {
    score += 1;
    factors.push({ label: 'Impersonation / authority', description: `Sender claims to be a trusted authority (${answers.claimedIdentity}). Impersonation is the primary manipulation mechanism.` });
  }

  const urgencyPressures = ['urgency','legalThreat','accountSuspension','financialLoss','stayOnLine','doNotTell','doNotVerify'];
  if (urgencyPressures.some(s => hasPressure(answers, s))) {
    score += 1;
    factors.push({ label: 'Urgency / time pressure', description: 'Pressure tactics present that reduce verification behavior and force rapid decisions.' });
  }

  if (IS_LINK(answers) || IS_REMOTE(answers)) {
    score += 1;
    factors.push({ label: 'Tooling / system interaction', description: 'Requires technical steps beyond conversation (links, downloads, software, alternate numbers).' });
  }

  if (IRREVERSIBLE_ACTION(answers)) {
    score += 1;
    factors.push({ label: 'Irreversible action boundary', description: "The requested action cannot be undone once completed. This is the framework's core harm threshold." });
  }

  return { score, factors };
}

// ─── Step 1: Never-Event Conditions ──────────────────────────────────────────
// Every condition is implemented exactly as specified in the Final Decision Model.

const NEVER_EVENT_RULES = [
  {
    id: 'ne_mfa_share',
    title: 'MFA Code Share Request',
    rule: 'Never share your MFA or one-time verification code with anyone.',
    source: 'FTC Consumer Alerts · NIST 800-63 · Bank Security Policies',
    url: 'https://consumer.ftc.gov/consumer-alerts/2024/03/whats-verification-code-why-would-someone-ask-me-it',
    rationale:
      'Legitimate services that issue a verification code never need to ask you to read it back. Sharing the code is equivalent to handing over full account access.',
    message:
      'HARD STOP: Do NOT share your verification code. No bank, government agency, or tech company will ever ask you to read your MFA code to them. The moment you share it, your account is compromised.',
    severity: 'RED',
    check: (a) => hasAction(a, 'shareMFA'),
  },
  // {
  //   id: 'ne_gov_sms_action',
  //   title: 'Government Agency via SMS Requesting Action',
  //   rule: 'Government agencies do not initiate contact via SMS to request any action.',
  //   source: 'IRS.gov · SSA.gov · FTC Consumer Alerts',
  //   url: 'https://www.irs.gov/help/tax-scams/recognize-tax-scams-and-fraud',
  //   rationale:
  //     'The IRS and SSA send official correspondence by mail, not SMS. Any SMS claiming to be a government agency requesting action is fraudulent.',
  //   message:
  //     'HARD STOP: The IRS, SSA, and law enforcement do not contact people via text message to request any action. This is a government impersonation scam.',
  //   severity: 'RED',
  //   check: (a) => {
  //     const ra = getArr(a.requestedAction);
  //     const hasAnyAction = ra.length > 0 && !ra.every((v) => v === 'nothing');
  //     return IS_GOV(a) && a.contactModality === 'sms' && hasAnyAction;
  //   },
  // },

  // IRS — SMS requesting action
{
  id: 'ne_irs_sms_action',
  title: 'IRS Text Message Requesting Action',
  rule: 'The IRS does not initiate contact by text message to request personal information or payment.',
  source: 'IRS Tax Scams and Consumer Alerts',
  url: 'https://www.irs.gov/help/tax-scams/recognize-tax-scams-and-fraud',
  rationale:
    'The IRS states that it does not use text messages to discuss personal tax issues such as bills or refunds, and will not request personal or financial information by SMS.',
  message:
    'HARD STOP: Treat this as an IRS impostor scam. Do not reply, click links, or call any number in the message. Contact the IRS only using information from IRS.gov or official letters.',
  severity: 'RED',
  check: (a) => {
    const ra = getArr(a.requestedAction);
    const hasAnyAction = ra.length > 0 && !ra.every(v => v === 'nothing');
    return IS_IRS(a) && a.contactModality === 'sms' && hasAnyAction;
  },
},

// SSA — SMS requesting action
{
  id: 'ne_ssa_sms_action',
  title: 'SSA Text Message Requesting Sensitive Information or Payment',
  rule: 'SSA will not contact you by text to request personal information, verification codes, or payment.',
  source: 'SSA Scam Guidance (ssa.gov/scam)',
  url: 'https://www.ssa.gov/scam/',
  rationale:
    'SSA and SSA OIG warn that SSA will not request personal information or payment via text, and that texts asking you to call unknown numbers or take urgent action are scams.',
  message:
    'HARD STOP: Treat this as a Social Security impostor scam. Do not reply, click links, call any number in the message, or provide information. Contact SSA only using information from SSA.gov or official letters.',
  severity: 'RED',
  check: (a) => {
    const asksForSensitiveInfoOrPayment =
      hasAction(a, 'enterPassword') ||
      hasAction(a, 'resetPassword') ||
      hasAction(a, 'shareSSN') ||
      hasAction(a, 'transferMoney') ||
      hasAction(a, 'giftCards') ||
      hasAction(a, 'sendCrypto') ||
      hasAction(a, 'callNumber') ||
      hasAction(a, 'clickLink');

    return (
      IS_SSA(a) &&
      a.contactModality === 'sms' &&
      IS_UNSOLICITED(a) &&
      asksForSensitiveInfoOrPayment
    );
  },
},

// Law enforcement — SMS requesting action
{
  id: 'ne_le_sms_action',
  title: 'Law Enforcement Text Message Requesting Action',
  rule: 'Legitimate law enforcement does not initiate investigations or payment requests by text message.',
  source: 'FBI IC3 · FTC Law Enforcement Impostor Scam Guidance',
  url: 'https://www.ic3.gov/Media/Y2024/PSA240221',
  rationale:
    'Law enforcement agencies do not open cases or demand payment by SMS. Text messages threatening arrest, warrants, or legal action are a hallmark of impostor scams.',
  message:
    'HARD STOP: This matches a law enforcement impostor scam pattern. Do not respond, do not pay, and do not share any personal or financial information.',
  severity: 'RED',
  check: (a) => {
    const ra = getArr(a.requestedAction);
    const hasAnyAction = ra.length > 0 && !ra.every(v => v === 'nothing');
    return IS_LE(a) && a.contactModality === 'sms' && hasAnyAction;
  },
},

//   {
//     id: 'ne_ssa_sms_unsolicited_contact',
//   title: 'Unsolicited SSA Text Message',
//   rule: 'SSA will never request personal information or payment via text message.',
//   source: 'SSA Scam Guidance (ssa.gov/scam)',
//   url: 'https://www.ssa.gov/scam/',
//   rationale:
//     'SSA states it will not request personal information or payment via text, and SSA OIG warns that unsolicited SSA texts asking you to call unknown numbers are scams.',
//   message:
//     'HARD STOP: Treat this as a Social Security impostor scam. Do not reply, click links, or call any number in the message. Contact SSA only using contact information from SSA.gov or official letters.',
//   severity: 'RED',
//   check: (a) => {
//     const ra = getArr(a.requestedAction);
//     const hasAnyAction =
//       ra.length > 0 && !ra.every((v) => v === 'nothing');

//     // Only fire this rule when there is NO requested action yet
//     return (
//       IS_SSA(a) &&
//       a.contactModality === 'sms' &&
//       IS_UNSOLICITED(a) &&
//       !hasAnyAction
//     );
//   },
// },

];


// ─── Signal Count Functions (Final Decision Model — explicit counts) ───────────

/**
 * highRiskSignalCount
 * Counts specific high-risk conditions as defined in the model.
 * Threshold: >= 2 → finalRisk = RED
 */
function computeHighRiskSignalCount(answers) {
  let count = 0;
  const signals = [];

  if (IS_UNSOLICITED(answers)) {
    count++;
    signals.push('Contact was unsolicited (you did not initiate)');
  }
  if (answers.relationshipValidity === 'no') {
    count++;
    signals.push('No pre-existing relationship with the claimed entity');
  }
  if (['irs','lawenforcement','ssa','techsupport','crypto','romance'].includes(answers.claimedIdentity)) {
    count++;
    signals.push(`High-risk claimed identity: ${answers.claimedIdentity}`);
  }
  if (hasPressure(answers,'legalThreat') || hasPressure(answers,'doNotTell') ||
      hasPressure(answers,'doNotVerify') || hasPressure(answers,'stayOnLine')) {
    count++;
    signals.push('Hard-stop pressure tactic present (legal threat, secrecy, or stay-on-line instruction)');
  }
  if (IS_BLOCKED(answers)) {
    count++;
    signals.push('Independent verification is blocked or discouraged');
  }

  return { count, signals };
}

/**
 * cautionSignalCount
 * Counts specific cautionary conditions as defined in the model.
 * Threshold: >= 2 → finalRisk = YELLOW
 */
function computeCautionSignalCount(answers) {
  let count = 0;
  const signals = [];

  if (['sms','email','phone','social','inapp'].includes(answers.contactModality)) {
    count++;
    signals.push(`Contact method (${answers.contactModality}) is associated with scam outreach`);
  }
  if (answers.relationshipValidity === 'unsure') {
    count++;
    signals.push('Relationship with claimed entity is uncertain');
  }
  if (['basic','account','context'].includes(answers.personalization)) {
    count++;
    signals.push('Personalization present — attacker may have accessed prior breach data');
  }
  if (hasPressure(answers,'urgency') || hasPressure(answers,'accountSuspension') ||
      hasPressure(answers,'financialLoss')) {
    count++;
    signals.push('Urgency or financial pressure tactic present');
  }
  if (hasEscalation(answers,'multiStep') || hasEscalation(answers,'channelSwitch') ||
      hasEscalation(answers,'thirdParty')) {
    count++;
    signals.push('Escalation detected (multi-step, channel switch, or third-party redirect)');
  }
  if (IS_LINK(answers)) {
    count++;
    signals.push('Requested action involves a link, attachment, or alternate number');
  }
  if (answers.verificationState === 'notSure') {
    count++;
    signals.push('Verification status unclear — independent check not yet attempted');
  }

  return { count, signals };
}

// ─── Main Evaluation Function ─────────────────────────────────────────────────

/**
 * evaluateAssessment(answers)
 *
 * Single source of truth. Deterministic — same inputs always produce same outputs.
 *
 * @param {Object} answers
 * @returns {{
 *   finalRisk: 'red'|'yellow'|'green',
 *   triggeredNeverEvents: Array,
 *   triggeredConditions: Array,
 *   complexityScore: number,
 *   complexityFactors: Array,
 *   layerRisk: { contact, lure, action },
 *   questionRisk: { q1..q9 },
 *   highRiskSignals: { count, signals },
 *   cautionSignals: { count, signals },
 *   intervention: { summary, interventions, nextSteps },
 * }}
 */
export function evaluateAssessment(answers) {
  // STEP 1: Evaluate ALL never-event rules
  const triggeredNeverEvents = NEVER_EVENT_RULES.filter(ne => ne.check(answers));

  // STEP 2: Per-question risk
  const questionRisk = {
    q1: riskQ1(answers),
    q2: riskQ2(answers),
    q3: riskQ3(answers),
    q4: riskQ4(answers),
    q5: riskQ5(answers),
    q6: riskQ6(answers),
    q7: riskQ7(answers),
    q8: riskQ8(answers),
    q9: riskQ9(answers),
  };

  // STEP 3: Layer-level risk (worst-of-layer)
  const layerRisk = {
    contact: worst([questionRisk.q1, questionRisk.q2, questionRisk.q3, questionRisk.q4]),
    lure:    worst([questionRisk.q5, questionRisk.q6, questionRisk.q7]),
    action:  worst([questionRisk.q8, questionRisk.q9]),
  };

  // STEP 4: Complexity score
  const complexityResult = computeComplexityScore(answers);

  // Signal counts
  const highRiskSignals = computeHighRiskSignalCount(answers);
  const cautionSignals  = computeCautionSignalCount(answers);

  // STEP 5–8: Apply decision logic in strict precedence order
  let finalRisk = 'green';
  const triggeredConditions = [];

  // ── Never-Event Override (highest priority) ──
  if (triggeredNeverEvents.length > 0) {
    finalRisk = 'red';
    triggeredConditions.push({
      rule: 'Never-Event Hard Override',
      detail: `${triggeredNeverEvents.length} institutional never-event rule(s) triggered. This is an unconditional hard stop — no other condition can downgrade this result.`,
    });
  }

  // ── Explicit RED: Irreversible Action + High-Risk Context ──
  if (finalRisk !== 'red') {
    const highRiskContext =
      IS_UNSOLICITED(answers) ||
      answers.relationshipValidity === 'no' ||
      ['irs','lawenforcement','ssa','techsupport','crypto','romance'].includes(answers.claimedIdentity);

    if (highRiskContext && IRREVERSIBLE_ACTION(answers)) {
      finalRisk = 'red';
      const what = [];
      if (IS_PAYMENT(answers))    what.push('payment transfer');
      if (IS_CREDENTIAL(answers)) what.push('credential disclosure');
      if (IS_MFA(answers))        what.push('MFA approval/sharing');
      if (IS_REMOTE(answers))     what.push('remote access installation');
      triggeredConditions.push({
        rule: 'High-Risk Combination — Irreversible Action in High-Risk Context',
        detail: `An irreversible action (${what.join(', ')}) is being requested within a high-risk contact context (unsolicited contact, no prior relationship, or high-risk claimed identity). The framework mandates a hard stop when these conditions co-occur, because the combination represents a near-certain harm boundary.`,
      });
    }
  }

  // ── Explicit RED: Q8 or Q9 individually red ──
  if (finalRisk !== 'red') {
    if (questionRisk.q8 === 'red') {
      finalRisk = 'red';
      triggeredConditions.push({
        rule: 'Irreversible Action Requested (Q8 = RED)',
        detail: 'The selected action(s) include credential disclosure, MFA approval/sharing, financial transfer, or remote access — all of which are irreversible harm boundaries. Once taken, these actions cannot be undone.',
      });
    }
    if (questionRisk.q9 === 'red') {
      finalRisk = 'red';
      triggeredConditions.push({
        rule: 'Verification Blocked (Q9 = RED)',
        detail: 'Independent verification is blocked or discouraged. Any legitimate institution allows and encourages you to verify through official channels. Blocking verification is the clearest sign that this contact cannot withstand scrutiny.',
      });
    }
  }

  // ── High-Risk Signal Aggregation: count >= 2 → RED ──
  // if (finalRisk !== 'red' && highRiskSignals.count >= 2) {
  //   finalRisk = 'red';
  //   triggeredConditions.push({
  //     rule: `High-Risk Signal Aggregation (count = ${highRiskSignals.count}/5)`,
  //     detail: `${highRiskSignals.count} independent high-risk conditions detected simultaneously: ${highRiskSignals.signals.join('; ')}. When two or more high-risk signals co-occur, the framework mandates a hard stop — the combination indicates systemic manipulation across multiple dimensions.`,
  //   });
  // }

  // High-Risk Signal Aggregation → strong caution (YELLOW)
  if (finalRisk !== 'red' && highRiskSignals.count >= 2) {
    finalRisk = 'yellow';
    triggeredConditions.push({
      rule: `High-Risk Signal Aggregation (count = ${highRiskSignals.count}/5)`,
      detail: `${highRiskSignals.count} independent high-risk conditions detected simultaneously: ${highRiskSignals.signals.join(
        '; '
      )}. While no single “never event” has fired, the pattern is strongly consistent with known scam structures and requires independent verification before taking any action.`,
    });
  }

  // ── Cautionary Signal Aggregation ──
  if (finalRisk !== 'red') {
    if (cautionSignals.count >= 2) {
      finalRisk = 'yellow';
      triggeredConditions.push({
        rule: `Cautionary Signal Aggregation (count = ${cautionSignals.count}/7)`,
        detail: `${cautionSignals.count} caution signals detected: ${cautionSignals.signals.join('; ')}. Multiple simultaneous caution signals indicate a pattern consistent with a scam interaction, even if no individual signal alone is conclusive.`,
      });
    }

    if (complexityResult.score >= 3) {
      if (finalRisk !== 'red') finalRisk = 'yellow';
      triggeredConditions.push({
        rule: `Complexity Score ≥ 3 (Score = ${complexityResult.score}/6)`,
        detail: `Structural complexity of ${complexityResult.score} indicates multiple manipulation mechanisms are present simultaneously. Per the framework, a score of 3+ escalates to CAUTION because it correlates with deliberate scam architecture.`,
      });
    }

    if (layerRisk.contact === 'yellow' && layerRisk.lure === 'yellow') {
      if (finalRisk !== 'red') finalRisk = 'yellow';
      triggeredConditions.push({
        rule: 'Layer 1 + Layer 2 Both YELLOW',
        detail: 'Both the Contact & Identity layer and the Pressure & Tactics layer scored CAUTION. When the contact profile and manipulation mechanics both raise concern together, verification is required before any action.',
      });
    }

    if (layerRisk.lure === 'yellow' && layerRisk.action === 'yellow') {
      if (finalRisk !== 'red') finalRisk = 'yellow';
      triggeredConditions.push({
        rule: 'Layer 2 + Layer 3 Both YELLOW',
        detail: 'Both the Pressure & Tactics layer and the Requested Actions layer scored CAUTION. Pressure combined with a non-trivial action request matches the structural pattern of an active social engineering attempt.',
      });
    }

    if (layerRisk.action === 'yellow') {
      if (finalRisk !== 'red') finalRisk = 'yellow';
      triggeredConditions.push({
        rule: 'Action Layer YELLOW',
        detail: 'Layer 3 (Requested Actions) scored CAUTION. Even without upper-layer red signals, any non-trivial action request in an uncertain context requires verification before proceeding.',
      });
    }
  }

  // Deduplicate triggered conditions (in case multiple paths fire same rule)
  const seen = new Set();
  const uniqueConditions = triggeredConditions.filter(c => {
    if (seen.has(c.rule)) return false;
    seen.add(c.rule);
    return true;
  });

  // Generate intervention
  const intervention = generateIntervention(
    answers, finalRisk, triggeredNeverEvents, complexityResult, uniqueConditions
  );

  return {
    finalRisk,
    triggeredNeverEvents,
    triggeredConditions: uniqueConditions,
    complexityScore: complexityResult.score,
    complexityFactors: complexityResult.factors,
    layerRisk,
    questionRisk,
    highRiskSignals,
    cautionSignals,
    intervention,
  };
}

// ─── Intervention Generation ──────────────────────────────────────────────────
function generateIntervention(
  answers,
  finalRisk,
  triggeredNeverEvents,
  complexityResult,
  triggeredConditions
) {
  const interventions = [];
  const nextSteps = [];
  let summary = '';
  const identity = answers.claimedIdentity;

  // Rules that represent explicit “hard boundary” conditions (not just aggregation)
  const HARD_STOP_RULES = new Set([
    'Never-Event Hard Override',
    'High-Risk Combination — Irreversible Action in High-Risk Context',
    'Irreversible Action Requested (Q8 = RED)',
    'Verification Blocked (Q9 = RED)',
  ]);

  const hasHardStopBasis =
    triggeredNeverEvents.length > 0 ||
    triggeredConditions.some((c) => HARD_STOP_RULES.has(c.rule));

  if (finalRisk === 'red' && hasHardStopBasis) {
    // ── TRUE HARD STOP: at least one institutional or explicit boundary rule fired ──
    summary =
      'Multiple serious risk factors have been detected. This interaction matches the structural profile of a known scam archetype. Do not proceed with any requested action.';

    // Institutional “never event” messages first
    triggeredNeverEvents.forEach((ne) => interventions.push(ne.message));

    // Then any explicit RED conditions (except the meta “Never-Event Hard Override”)
    triggeredConditions
      .filter((c) => c.rule !== 'Never-Event Hard Override')
      .forEach((c) => interventions.push(`Rule triggered — ${c.rule}: ${c.detail}`));

    // Global hard-stop next steps
    nextSteps.push('Stop responding to this contact immediately — hang up or close the message');
    nextSteps.push('Do NOT send money, buy gift cards, or send cryptocurrency');
    nextSteps.push('Do NOT approve any MFA push notifications you did not personally initiate');
    nextSteps.push('Do NOT install any software or allow remote access to your device');

    // Context-specific guidance based on claimed identity
    if (identity === 'bank') {
      nextSteps.push(
        'Call your bank using the number on the back of your card or their official app — not any number from this contact'
      );
    } else if (['irs', 'lawenforcement', 'ssa'].includes(identity)) {
      nextSteps.push(
        'Contact the agency only through their official government website (IRS.gov, SSA.gov) — not via any number or link in this message'
      );
      nextSteps.push('Report government impersonation to the Treasury Inspector General: 1-800-366-4484');
    } else if (identity === 'techsupport') {
      nextSteps.push(
        "Contact tech support through the company's official website only — never call a number shown in a pop-up"
      );
    } else if (identity === 'romance') {
      nextSteps.push(
        'Do not send money to someone you have only met online — regardless of how long you have communicated'
      );
      nextSteps.push('Call the AARP Fraud Watch Network: 1-877-908-3360');
    } else if (identity === 'crypto') {
      nextSteps.push(
        'Report investment fraud to the FTC at ReportFraud.ftc.gov and the FBI at IC3.gov'
      );
    } else if (['employer', 'marketplace'].includes(identity)) {
      nextSteps.push(
        'Call the person using a number from your company directory or prior known correspondence — not this message'
      );
    }

    nextSteps.push('Report fraud to the FTC at ReportFraud.ftc.gov or 1-877-FTC-HELP');
  } else if (finalRisk === 'red') {
    // ── AGGREGATION-ONLY RED: no never-event or explicit irreversible boundary ──
    summary =
      'Multiple high-risk signals are present at the same time. While no single “never event” rule has fired, the overall pattern is strongly consistent with a scam. Treat this interaction as very high risk and verify independently before taking any action.';

    triggeredConditions.forEach((c) => {
      interventions.push(`Caution: ${c.rule} — ${c.detail}`);
    });

    interventions.push(
      'Do not rely on information, links, or phone numbers provided in this contact. Independent verification is required before any action.'
    );

    nextSteps.push(
      'Pause the interaction — do not respond further until you verify through an official channel'
    );
    nextSteps.push(
      'Do not use any links, phone numbers, or contact details from this message. Instead, find official contact information yourself (official website, app, card, or prior statement).'
    );
    nextSteps.push(
      'Call back using an independently sourced number to confirm whether this contact is genuine before taking any irreversible action.'
    );
    nextSteps.push(
      'If any “never event” appears (gift cards, crypto, remote access, verification code sharing, threats of arrest, etc.), treat it as an immediate hard stop.'
    );
  } else if (finalRisk === 'yellow') {
    // ── CAUTION ──
    summary =
      'Caution signals are present. This contact has not triggered a hard stop, but independent verification is required before taking any action.';

    triggeredConditions.forEach((c) => {
      interventions.push(`Caution: ${c.rule} — ${c.detail}`);
    });

    interventions.push(
      'Do not use any links, phone numbers, or attachments from this contact. Find official contact information independently before responding.'
    );

    nextSteps.push('Do not use any links, phone numbers, or attachments from this contact');
    nextSteps.push(
      'Find the official contact information yourself — search engine, official app, or back of your card'
    );
    nextSteps.push(
      'Call back using an official number you found independently to confirm legitimacy'
    );
    nextSteps.push(
      'Legitimate contacts can wait for you to verify. Scammers cannot afford to let you.'
    );
  } else {
    // ── GREEN / LOW RISK ──
    summary =
      'No major red flags detected based on your answers. Proceed with normal caution.';

    interventions.push(
      'LOW RISK: The signals present in this interaction are consistent with a legitimate contact. Continue with normal caution.'
    );

    nextSteps.push(
      'Remain alert — if anything changes or new pressure appears, re-run this assessment'
    );
    nextSteps.push(
      'Verify the contact is who they say they are before sharing any sensitive information'
    );
    nextSteps.push(
      'Legitimate organizations will not pressure you to act immediately or block you from verifying'
    );
  }

  return { summary, interventions, nextSteps };
}
// ─── Archetype Detection ──────────────────────────────────────────────────────

export function detectArchetype(answers) {
  const ci = answers.claimedIdentity;
  const cm = answers.contactModality;
  const e = getArr(answers.escalation);
  const has = (vals) => getArr(answers.requestedAction).some(a => vals.includes(a));

  if (ci === 'bank' && has(['approveMFA','shareMFA','enterPassword']) && (cm === 'sms' || e.includes('channelSwitch')))
    return { name: 'A1: Bank Impersonation Phishing', description: 'SMS-to-phone escalation targeting bank credentials or MFA. Complexity: 4. Begins with a fake fraud alert text followed by a call from the "bank fraud department." Irreversible boundary: credential entry or MFA approval.' };

  if (['irs','lawenforcement','ssa'].includes(ci) && has(['giftCards','sendCrypto','transferMoney']))
    return { name: 'A2: IRS / Government Tax Threat Scam', description: 'Threat-based authority coercion demanding immediate payment. Complexity: 3. IRS and SSA have explicit written policy prohibiting all forms of this interaction.' };

  if (['employer','marketplace'].includes(ci) && has(['transferMoney','giftCards']))
    return { name: 'A3: Business Email Compromise (BEC)', description: 'Executive or vendor impersonation requesting unauthorized wire transfers. #1 cybercrime by total dollar loss ($2.9B in 2024). Average wire: $84,059.' };

  if (ci === 'techsupport' && has(['installSoftware']))
    return { name: 'A4: Tech Support Remote Access Scam', description: 'Fake technical alert leading to a phone call requesting remote access software. Complexity: 5. Full device control is the irreversible boundary.' };

  if (ci === 'crypto' && has(['sendCrypto','transferMoney']))
    return { name: 'A5: Crypto Investment Fraud (Pig Butchering)', description: 'Long-duration confidence scam using fabricated investment platforms. #1 loss category ($6.6B in 2024). Crypto is non-recoverable.' };

  if (ci === 'romance' && has(['sendCrypto','transferMoney','giftCards']))
    return { name: 'A6: Romance / Confidence Scam', description: 'Emotional trust-building followed by a manufactured crisis and financial request. $1.3B in losses in 2024. Highest loss per victim.' };

  if (ci === 'bank' && has(['resetPassword','enterPassword','approveMFA']))
    return { name: 'A7: Account Recovery Phishing', description: 'Platform impersonation targeting password reset and MFA code theft. Complexity: 4. Enables downstream financial fraud.' };

  if (ci === 'delivery' && has(['clickLink','enterPassword','transferMoney']))
    return { name: 'A8: Package Delivery Scam', description: 'High-volume SMS phishing impersonating shipping companies with malicious payment links. Complexity: 2.' };

  return null;
}

// ─── Legacy compatibility exports ─────────────────────────────────────────────
export function checkNeverEvents(answers)      { return NEVER_EVENT_RULES.filter(ne => ne.check(answers)); }
export function calculateComplexityScore(answers) { return computeComplexityScore(answers); }
export function determineRiskLevel(answers)    { return evaluateAssessment(answers).finalRisk; }
export const IRREVERSIBLE_ACTIONS = new Set(['approveMFA','shareMFA','transferMoney','giftCards','sendCrypto','installSoftware','shareSSN','enterPassword','resetPassword']);
