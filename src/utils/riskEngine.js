/**
 * riskEngine.js
 * =============
 * FINAL DECISION MODEL - Single Source of Truth
 * Source: "Final Decision Model.docx" - CS 6727 Practicum
 *
 * Evaluation order (STRICT - DO NOT REORDER):
 *   Step 1:  Evaluate ALL never-event rules          → if any fire, finalRisk = RED (hard override)
 *   Step 2:  Compute per-question risk (Q1–Q9)
 *   Step 3:  Compute layer-level risk (worst-of-layer)
 *   Step 4:  Compute complexity score (0–6)
 *   Step 5:  Evaluate Explicit RED rules
 *   Step 6:  Apply High-Risk Signal Aggregation
 *   Step 7:  Apply Cautionary Signal Aggregation
 *   Step 8:  Safe Condition fallback → GREEN
 */

// ─── Array-safe accessors ─────────────────────────────────────────────────────

function getArr(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

export function hasAction(answers, x) {
  return getArr(answers.requestedAction).includes(x);
}

function hasPressure(answers, x) {
  return getArr(answers.pressureSignals).includes(x);
}

function hasEscalation(answers, x) {
  return getArr(answers.escalation).includes(x);
}

// ─── Entity Helpers ───────────────────────────────────────────────────────────

function IS_SSA(a)          { return a.claimedIdentity === 'ssa'; }
function IS_IRS(a)          { return a.claimedIdentity === 'irs'; }
function IS_LE(a)           { return a.claimedIdentity === 'lawenforcement'; }
function IS_GOV(a)          { return ['ssa', 'irs', 'lawenforcement', 'govother'].includes(a.claimedIdentity); }
function IS_UTILITY(a)      { return a.claimedIdentity === 'utility'; }
function IS_APPLE(a)        { return a.claimedIdentity === 'apple'; }
function IS_GOOGLE(a)       { return a.claimedIdentity === 'google'; }
function IS_MICROSOFT(a)    { return a.claimedIdentity === 'microsoft'; }
function IS_TECH(a)         { return ['apple', 'google', 'microsoft', 'techother'].includes(a.claimedIdentity); }
function IS_USPS(a)         { return a.claimedIdentity === 'usps'; }
function IS_FEDEX(a)        { return a.claimedIdentity === 'fedex'; }
function IS_UPS(a)          { return a.claimedIdentity === 'ups'; }
function IS_DELIVERY(a)     { return ['usps', 'fedex', 'ups', 'deliveryother'].includes(a.claimedIdentity); }
function IS_AMAZON(a)       { return a.claimedIdentity === 'amazon'; }
function IS_WALMART(a)      { return a.claimedIdentity === 'walmart'; }
function IS_MARKETPLACE(a)  { return ['amazon', 'walmart', 'marketplaceother'].includes(a.claimedIdentity); }
function IS_BANK(a)         { return ['banks', 'bankother'].includes(a.claimedIdentity); }
function IS_ROMANCE(a)      { return a.claimedIdentity === 'romance'; }
function IS_CRYPTO(a)       { return a.claimedIdentity === 'crypto'; }

function IS_PAYMENT(a)      { return hasAction(a,'transferMoney') || hasAction(a,'giftCards') || hasAction(a,'sendCrypto'); }
function IS_CREDENTIAL(a)   { return hasAction(a,'enterPassword') || hasAction(a,'resetPassword') || hasAction(a,'shareSSN'); }
function IS_MFA(a)          { return hasAction(a,'approveMFA') || hasAction(a,'shareMFA'); }
function IS_REMOTE(a)       { return hasAction(a,'installSoftware'); }
function IS_LINK(a)         { return hasAction(a,'clickLink') || hasAction(a,'openAttachment') || hasAction(a,'callNumber'); }
function IS_UNSOLICITED(a)  { return a.initiatedContact === 'no'; }
function IS_BLOCKED(a)      { return a.verificationState === 'blocked'; }

function IRREVERSIBLE_ACTION(a) {
  return IS_PAYMENT(a) || IS_CREDENTIAL(a) || IS_MFA(a) || IS_REMOTE(a);
}

function INSTRUCTION_SAFE_ACCOUNT(a)   { return !!a.instructionSafeAccount; }
function INSTRUCTION_SEND_TO_RECEIVE(a){ return !!a.instructionSendToReceive; }
function INSTRUCTION_SECURE_ACCOUNT(a) { return !!a.instructionSecureAccount; }
function INSTRUCTION_OFF_PLATFORM(a)   { return !!a.instructionOffPlatform; }

// ─── Risk Ordering ────────────────────────────────────────────────────────────

const RISK_PRIORITY = { red: 3, yellow: 2, green: 1, gray: 0 };

function worst(risks) {
  let max = 'gray';
  for (const r of risks) {
    if ((RISK_PRIORITY[r] ?? 0) > (RISK_PRIORITY[max] ?? 0)) max = r;
  }
  return max;
}

// ─── Step 2: Per-Question Risk ────────────────────────────────────────────────

function riskQ1(a) {
  const cm = a.contactModality;
  if (cm === 'popup') return 'red';
  if (['sms','email','phone','social','inapp'].includes(cm)) return 'yellow';
  return 'gray';
}

function riskQ2(a) {
  const ci = a.claimedIdentity;
  if (['ssa','irs','lawenforcement','govother','apple','google','microsoft','techother','romance','crypto'].includes(ci)) return 'red';
  if (['utility','usps','fedex','ups','deliveryother','amazon','walmart','marketplaceother','banks','bankother','employer','friend','other'].includes(ci)) return 'yellow';
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

  const authorityIds = ['ssa','irs','lawenforcement','govother','apple','google','microsoft','techother','usps','fedex','ups','deliveryother','amazon','walmart','marketplaceother','banks','bankother','utility','employer','romance','crypto'];
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

// ─── Step 1: Never-Event Rules ────────────────────────────────────────────────
// 1-to-1 mapping to Appendix B Institutional Rules. Each rule has a citation URL.

const NEVER_EVENT_RULES = [

  // ── SSA (11 rules) ────────────────────────────────────────────────────────
  {
    id: 'ne_ssa_sms_action',
    title: 'SSA: Text Message Demanding Action',
    rule: 'SSA will not contact you by text message to request personal information, payment, or any urgent action.',
    source: 'Social Security Administration — Scam Awareness (ssa.gov/scam)',
    url: 'https://www.ssa.gov/scam/',
    rationale: 'SSA and SSA OIG state that SSA does not initiate contact via text message to request personal information or payment.',
    message: 'HARD STOP: The SSA does not contact people by text to request action. Treat this as a Social Security impostor scam. Do not reply or click any link.',
    severity: 'RED',
    check: (a) => {
      const ra = getArr(a.requestedAction);
      const hasAnyAction = ra.length > 0 && !ra.every(v => v === 'nothing');
      return IS_SSA(a) && a.contactModality === 'sms' && hasAnyAction;
    },
  },
  {
    id: 'ne_ssa_payment_gift_cards',
    title: 'SSA: Demands Payment via Gift Cards, Wire, or Crypto',
    rule: 'SSA will never ask for payment via gift cards, wire transfer, or cryptocurrency.',
    source: 'Social Security Administration — Scam Awareness (ssa.gov/scam)',
    url: 'https://www.ssa.gov/scam/',
    rationale: 'SSA states explicitly that it will never demand payment via gift cards, cryptocurrency, or wire transfer.',
    message: 'HARD STOP: The SSA never demands payment by gift card, wire transfer, or cryptocurrency. This is a government impersonation scam.',
    severity: 'RED',
    check: (a) => IS_SSA(a) && IS_PAYMENT(a),
  },
  {
    id: 'ne_ssa_arrest_threat',
    title: 'SSA: Threatens Arrest or Legal Action',
    rule: 'SSA will never threaten arrest or legal action to pressure payment.',
    source: 'Social Security Administration — Scam Awareness (ssa.gov/scam)',
    url: 'https://www.ssa.gov/scam/',
    rationale: 'SSA OIG warns that threats of arrest or legal consequences are hallmark SSA impostor scam tactics.',
    message: 'HARD STOP: SSA never threatens arrest. This is a known Social Security impersonation scam tactic.',
    severity: 'RED',
    check: (a) => IS_SSA(a) && hasPressure(a, 'legalThreat'),
  },
  {
    id: 'ne_ssa_ssn_phone',
    title: 'SSA: Requests SSN Verification via Phone or Text',
    rule: 'SSA will never call or text to ask you to verify your Social Security Number.',
    source: 'Social Security Administration — Scam Awareness (ssa.gov/scam)',
    url: 'https://www.ssa.gov/scam/',
    rationale: 'SSA already has your SSN on file. Any call or text asking you to confirm it is an impostor.',
    message: 'HARD STOP: SSA already has your SSN. Never give it to someone who called or texted you claiming to be SSA.',
    severity: 'RED',
    check: (a) => IS_SSA(a) && hasAction(a, 'shareSSN'),
  },
  {
    id: 'ne_ssa_stay_on_line',
    title: 'SSA: Instructs You to Stay on the Line During Transfer',
    rule: 'SSA will never instruct you to remain on the phone while you transfer money or purchase gift cards.',
    source: 'Social Security Administration — Scam Awareness (ssa.gov/scam)',
    url: 'https://www.ssa.gov/scam/',
    rationale: 'Keeping a victim on the phone during a payment prevents them from seeking verification or reconsidering.',
    message: 'HARD STOP: SSA never keeps you on the phone during a money transfer. Hang up immediately.',
    severity: 'RED',
    check: (a) => IS_SSA(a) && hasPressure(a, 'stayOnLine'),
  },
  {
    id: 'ne_ssa_unsolicited_link',
    title: 'SSA: Unsolicited Text with Link',
    rule: 'SSA does not send unsolicited texts containing links.',
    source: 'Social Security Administration — Scam Awareness (ssa.gov/scam)',
    url: 'https://www.ssa.gov/scam/',
    rationale: 'Unsolicited SSA texts with links are phishing attempts designed to steal credentials or install malware.',
    message: 'HARD STOP: SSA does not send unsolicited texts with links. Do not click the link.',
    severity: 'RED',
    check: (a) => IS_SSA(a) && IS_UNSOLICITED(a) && a.contactModality === 'sms' && hasAction(a, 'clickLink'),
  },
  {
    id: 'ne_ssa_secrecy',
    title: 'SSA: Demands Secrecy About the Contact',
    rule: 'SSA will never instruct you to keep the contact secret or not to tell anyone.',
    source: 'Social Security Administration — Scam Awareness (ssa.gov/scam)',
    url: 'https://www.ssa.gov/scam/',
    rationale: 'Secrecy instructions isolate the victim and prevent them from getting help. No legitimate agency requests this.',
    message: 'HARD STOP: SSA never asks you to keep a contact secret. This secrecy demand is a social engineering tactic — hang up.',
    severity: 'RED',
    check: (a) => IS_SSA(a) && hasPressure(a, 'doNotTell'),
  },
  {
    id: 'ne_ssa_remote_access',
    title: 'SSA: Requests Remote Access to Your Device',
    rule: 'SSA will never ask you to install software or grant remote access to your computer.',
    source: 'Social Security Administration — Scam Awareness (ssa.gov/scam)',
    url: 'https://www.ssa.gov/scam/',
    rationale: 'Remote access gives attackers full control of the victim\'s device and data.',
    message: 'HARD STOP: SSA never requests remote access to your device. Do not install anything.',
    severity: 'RED',
    check: (a) => IS_SSA(a) && IS_REMOTE(a),
  },
  {
    id: 'ne_ssa_bank_account',
    title: 'SSA: Requests Bank Account or Financial Information',
    rule: 'SSA will never call or text to collect your bank account number or financial credentials.',
    source: 'Social Security Administration — Scam Awareness (ssa.gov/scam)',
    url: 'https://www.ssa.gov/scam/',
    rationale: 'SSA communicates benefit payment changes by mail. Any phone or text request for banking information is fraud.',
    message: 'HARD STOP: SSA never requests your bank account number by phone or text. This is financial fraud.',
    severity: 'RED',
    check: (a) => IS_SSA(a) && (hasAction(a, 'enterPassword') || hasAction(a, 'resetPassword')),
  },
  {
    id: 'ne_ssa_immediate_payment',
    title: 'SSA: Demands Immediate Payment Under Urgency',
    rule: 'SSA will never demand immediate payment under threat or urgency.',
    source: 'Social Security Administration — Scam Awareness (ssa.gov/scam)',
    url: 'https://www.ssa.gov/scam/',
    rationale: 'Urgency is the primary manipulation lever in SSA impersonation scams. All legitimate SSA issues are handled via formal written process.',
    message: 'HARD STOP: SSA never demands immediate payment. Urgency is the scam\'s primary tool — hang up.',
    severity: 'RED',
    check: (a) => IS_SSA(a) && IS_PAYMENT(a) && hasPressure(a, 'urgency'),
  },
  {
    id: 'ne_ssa_social_media',
    title: 'SSA: Contacts via Social Media to Request Information',
    rule: 'SSA does not contact individuals through social media platforms to request personal information.',
    source: 'Social Security Administration — Scam Awareness (ssa.gov/scam)',
    url: 'https://www.ssa.gov/scam/',
    rationale: 'Official SSA communication is by mail or through MySocialSecurity.gov. Social media outreach is not a legitimate channel.',
    message: 'HARD STOP: SSA does not contact people through social media. Report this to SSA OIG.',
    severity: 'RED',
    check: (a) => IS_SSA(a) && a.contactModality === 'social' && IS_UNSOLICITED(a),
  },

  // ── IRS (5 rules) ────────────────────────────────────────────────────────
  {
    id: 'ne_irs_sms_email_contact',
    title: 'IRS: Initiates Contact via Email, Text, or Social Media',
    rule: 'The IRS does not initiate contact with taxpayers by email, text messages, or social media.',
    source: 'IRS Tax Scams and Consumer Alerts',
    url: 'https://www.irs.gov/newsroom/tax-scams-consumer-alerts',
    rationale: 'The IRS contacts taxpayers by US mail. Any electronic unsolicited contact claiming to be the IRS is fraudulent.',
    message: 'HARD STOP: The IRS does not initiate contact by email, text, or social media. This is an IRS impostor scam.',
    severity: 'RED',
    check: (a) => {
      const ra = getArr(a.requestedAction);
      const hasAnyAction = ra.length > 0 && !ra.every(v => v === 'nothing');
      return IS_IRS(a) && ['sms','email','social'].includes(a.contactModality) && IS_UNSOLICITED(a) && hasAnyAction;
    },
  },
  {
    id: 'ne_irs_no_payment_appeal',
    title: 'IRS: Demands Payment Without Opportunity to Question or Appeal',
    rule: 'The IRS never demands immediate payment without first giving the taxpayer an opportunity to question or appeal.',
    source: 'IRS Tax Scams and Consumer Alerts',
    url: 'https://www.irs.gov/newsroom/tax-scams-consumer-alerts',
    rationale: 'Taxpayers have legal rights to dispute IRS assessments. Immediate payment demands with no recourse violate taxpayer rights.',
    message: 'HARD STOP: The IRS always provides an opportunity to question or appeal before any payment is required.',
    severity: 'RED',
    check: (a) => IS_IRS(a) && IS_PAYMENT(a) && hasPressure(a, 'urgency'),
  },
  {
    id: 'ne_irs_gift_cards_crypto',
    title: 'IRS: Requires Specific Payment Methods (Gift Cards, Crypto, Wire)',
    rule: 'The IRS does not require a specific payment method such as gift cards, cryptocurrency, or wire transfer.',
    source: 'IRS Tax Scams and Consumer Alerts',
    url: 'https://www.irs.gov/newsroom/tax-scams-consumer-alerts',
    rationale: 'These payment methods are untraceable and non-refundable — preferred by scammers precisely because victims cannot recover funds.',
    message: 'HARD STOP: The IRS never demands gift cards, cryptocurrency, or wire transfers as payment. This is a definitive fraud indicator.',
    severity: 'RED',
    check: (a) => IS_IRS(a) && (hasAction(a,'giftCards') || hasAction(a,'sendCrypto')),
  },
  {
    id: 'ne_irs_arrest_threat',
    title: 'IRS: Threatens Police or Immigration Arrest for Non-Payment',
    rule: 'The IRS never threatens to bring in police or immigration authorities to arrest someone for not paying.',
    source: 'IRS Tax Scams and Consumer Alerts',
    url: 'https://www.irs.gov/newsroom/tax-scams-consumer-alerts',
    rationale: 'Arrest threats are a defining trait of IRS phone scams. The IRS resolves tax issues through the formal civil tax system, not police action.',
    message: 'HARD STOP: The IRS never threatens arrest. This is a classic IRS impersonation scam tactic.',
    severity: 'RED',
    check: (a) => IS_IRS(a) && hasPressure(a, 'legalThreat'),
  },
  {
    id: 'ne_irs_card_number_phone',
    title: 'IRS: Asks for Credit/Debit Card Numbers Over the Phone',
    rule: 'The IRS does not ask for credit or debit card numbers over the phone.',
    source: 'IRS Tax Scams and Consumer Alerts',
    url: 'https://www.irs.gov/newsroom/tax-scams-consumer-alerts',
    rationale: 'IRS payments are made through IRS.gov/payments or official IRS correspondence, never over an unsolicited phone call.',
    message: 'HARD STOP: The IRS does not take card payments over the phone. Do not provide any financial information.',
    severity: 'RED',
    check: (a) => IS_IRS(a) && a.contactModality === 'phone' && (hasAction(a,'enterPassword') || hasAction(a,'transferMoney')),
  },

  // ── FBI / Law Enforcement (3 rules) ──────────────────────────────────────
  {
    id: 'ne_le_payment_demand',
    title: 'Law Enforcement: Demands Payment to Avoid Arrest via Phone or Text',
    rule: 'Legitimate law enforcement does not demand payment to avoid arrest via phone call or text message.',
    source: 'FBI Internet Crime Complaint Center (IC3) — Law Enforcement Impostor Alert',
    url: 'https://www.ic3.gov/Media/Y2024/PSA240221',
    rationale: 'Police and federal agencies do not collect payments by phone. Payment-to-avoid-arrest calls are a well-documented scam category.',
    message: 'HARD STOP: Law enforcement never demands phone or text payment to avoid arrest. This is an impostor scam — hang up.',
    severity: 'RED',
    check: (a) => IS_LE(a) && IS_PAYMENT(a),
  },
  {
    id: 'ne_le_gift_cards_crypto',
    title: 'Law Enforcement: Requests Gift Cards or Crypto as Payment',
    rule: 'Law enforcement agencies never accept or request gift cards or cryptocurrency as payment for fines or fees.',
    source: 'FBI Internet Crime Complaint Center (IC3) — Law Enforcement Impostor Alert',
    url: 'https://www.ic3.gov/Media/Y2024/PSA240221',
    rationale: 'Gift cards and crypto are untraceable — no real law enforcement agency accepts them.',
    message: 'HARD STOP: Real law enforcement never accepts gift cards or cryptocurrency. This is a definitive fraud indicator.',
    severity: 'RED',
    check: (a) => IS_LE(a) && (hasAction(a,'giftCards') || hasAction(a,'sendCrypto')),
  },
  {
    id: 'ne_le_secrecy',
    title: 'Law Enforcement: Demands Secrecy About the Contact',
    rule: 'Legitimate law enforcement never instructs you to keep their contact secret or not tell family members.',
    source: 'FBI Internet Crime Complaint Center (IC3) — Law Enforcement Impostor Alert',
    url: 'https://www.ic3.gov/Media/Y2024/PSA240221',
    rationale: 'Secrecy instructions isolate victims from intervention. All legitimate law enforcement contact is documentable and non-secret.',
    message: 'HARD STOP: Real law enforcement never demands secrecy. This is a manipulation tactic to prevent you from getting help.',
    severity: 'RED',
    check: (a) => IS_LE(a) && hasPressure(a, 'doNotTell'),
  },

  // ── Utility (4 rules) ────────────────────────────────────────────────────
  {
    id: 'ne_utility_immediate_disconnect',
    title: 'Utility: Threatens Immediate Disconnection Without Prior Written Notice',
    rule: 'Utility companies do not threaten immediate disconnection without first sending written notice.',
    source: 'FTC Consumer Information — Utility Scams',
    url: 'https://consumer.ftc.gov/articles/utility-scams',
    rationale: 'Utility disconnection requires a formal written notice process. Same-day threats of immediate cutoff are manufactured urgency.',
    message: 'HARD STOP: Utility companies must provide written notice before disconnection. This immediate threat is a scam.',
    severity: 'RED',
    check: (a) => IS_UTILITY(a) && hasPressure(a, 'urgency') && IS_PAYMENT(a),
  },
  {
    id: 'ne_utility_gift_card_payment',
    title: 'Utility: Demands Payment Exclusively via Gift Cards or Prepaid Cards',
    rule: 'Utility companies do not exclusively demand payment via gift cards or prepaid debit cards.',
    source: 'FTC Consumer Information — Utility Scams',
    url: 'https://consumer.ftc.gov/articles/utility-scams',
    rationale: 'Gift card payment demands are the single most common utility scam indicator, per FTC reporting.',
    message: 'HARD STOP: No real utility company demands payment by gift card. Hang up and report to your utility through their official number.',
    severity: 'RED',
    check: (a) => IS_UTILITY(a) && hasAction(a, 'giftCards'),
  },
  {
    id: 'ne_utility_crypto_payment',
    title: 'Utility: Demands Cryptocurrency as Payment',
    rule: 'Utility companies do not accept or request cryptocurrency for bill payment.',
    source: 'FTC Consumer Information — Utility Scams',
    url: 'https://consumer.ftc.gov/articles/utility-scams',
    rationale: 'Crypto is non-refundable and untraceable — utility companies do not accept it. Any such demand is fraud.',
    message: 'HARD STOP: Utility companies do not accept cryptocurrency. This is a fraud indicator.',
    severity: 'RED',
    check: (a) => IS_UTILITY(a) && hasAction(a, 'sendCrypto'),
  },
  {
    id: 'ne_utility_unannounced_collector',
    title: 'Utility: Sends Unannounced Workers to Collect Immediate Payment',
    rule: 'Utility companies do not send unannounced representatives to collect immediate payment at the door.',
    source: 'FTC Consumer Information — Utility Scams',
    url: 'https://consumer.ftc.gov/articles/utility-scams',
    rationale: 'In-person collection without notice is not a utility company practice. Verify by calling the utility\'s official number.',
    message: 'HARD STOP: Do not pay anyone claiming to be an unannounced utility collector. Call your utility\'s official number to verify.',
    severity: 'RED',
    check: (a) => IS_UTILITY(a) && a.initiatedContact === 'no' && a.contactModality === 'phone' && IS_PAYMENT(a) && hasPressure(a,'urgency'),
  },

  // ── MFA / Verification Codes (6 rules) ───────────────────────────────────
  {
    id: 'ne_mfa_share_code',
    title: 'MFA: Asks You to Share or Read Back a One-Time Code',
    rule: 'No legitimate service will ever ask you to share or read back a one-time password or MFA code.',
    source: 'FTC Consumer Alerts — Verification Code Scams',
    url: 'https://consumer.ftc.gov/consumer-alerts/2024/03/whats-verification-code-why-would-someone-ask-me-it',
    rationale: 'Legitimate services that issue a verification code never need to ask you to read it back. Sharing the code is equivalent to handing over full account access.',
    message: 'HARD STOP: Do NOT share your verification code. No bank, government agency, or tech company will ever ask you to read your MFA code to them.',
    severity: 'RED',
    check: (a) => hasAction(a, 'shareMFA'),
  },
  {
    id: 'ne_mfa_approve_unsolicited',
    title: 'MFA: Asks You to Approve a Push Notification You Did Not Initiate',
    rule: 'No bank or service asks you to approve an MFA push notification you did not personally trigger.',
    source: 'FTC Consumer Alerts — Verification Code Scams',
    url: 'https://consumer.ftc.gov/consumer-alerts/2024/03/whats-verification-code-why-would-someone-ask-me-it',
    rationale: 'MFA fatigue attacks send repeated push notifications hoping the user approves one accidentally. Approving such a request grants full account access.',
    message: 'HARD STOP: Do NOT approve any MFA push notification you did not personally initiate. Deny all requests and change your password immediately.',
    severity: 'RED',
    check: (a) => hasAction(a, 'approveMFA') && IS_UNSOLICITED(a),
  },
  {
    id: 'ne_mfa_tech_read_code',
    title: 'Tech Company: Asks You to Read Back an Authentication Code',
    rule: 'No tech company support call will ask you to read back an authentication code sent to your phone.',
    source: 'FTC Consumer Alerts — Verification Code Scams',
    url: 'https://consumer.ftc.gov/consumer-alerts/2024/03/whats-verification-code-why-would-someone-ask-me-it',
    rationale: 'Legitimate tech support does not need your authentication code to verify your identity. This is an account takeover technique.',
    message: 'HARD STOP: Do not read any authentication code to this caller. This is an account takeover attempt.',
    severity: 'RED',
    check: (a) => IS_TECH(a) && hasAction(a, 'shareMFA'),
  },
  {
    id: 'ne_mfa_disable_instruction',
    title: 'MFA: Instructs You to Disable MFA for Security Purposes',
    rule: 'No legitimate service instructs users to disable MFA for security or troubleshooting purposes.',
    source: 'FTC Consumer Alerts — Verification Code Scams',
    url: 'https://consumer.ftc.gov/consumer-alerts/2024/03/whats-verification-code-why-would-someone-ask-me-it',
    rationale: 'Disabling MFA removes account protection entirely. Legitimate security processes always increase, not decrease, authentication requirements.',
    message: 'HARD STOP: Do not disable your MFA. Any instruction to do so is an attempt to compromise your account.',
    severity: 'RED',
    check: (a) => hasAction(a, 'resetPassword') && hasAction(a, 'approveMFA') && IS_UNSOLICITED(a),
  },
  {
    id: 'ne_mfa_authenticator_share',
    title: 'MFA: Asks You to Share Your Authenticator App Code',
    rule: 'No legitimate service asks you to share your authenticator app TOTP code via phone or message.',
    source: 'NIST SP 800-63B — Digital Identity Guidelines',
    url: 'https://consumer.ftc.gov/consumer-alerts/2024/03/whats-verification-code-why-would-someone-ask-me-it',
    rationale: 'Authenticator codes are single-use, time-limited, and private by design. Any request to share them is an interception attempt.',
    message: 'HARD STOP: Authenticator codes are private. Never share them, regardless of who is asking.',
    severity: 'RED',
    check: (a) => hasAction(a, 'shareMFA') && a.contactModality === 'phone',
  },
  {
    id: 'ne_mfa_multiple_push',
    title: 'MFA: Sends Repeated Push Notifications Asking You to Approve',
    rule: 'Legitimate services do not send repeated MFA push requests in rapid succession.',
    source: 'FTC Consumer Alerts — Verification Code Scams',
    url: 'https://consumer.ftc.gov/consumer-alerts/2024/03/whats-verification-code-why-would-someone-ask-me-it',
    rationale: 'Repeated push approvals indicate an MFA fatigue attack — an automated attempt to get the victim to approve a fraudulent login.',
    message: 'HARD STOP: Multiple MFA push requests indicate an MFA fatigue attack. Deny all and contact your provider immediately.',
    severity: 'RED',
    check: (a) => hasAction(a, 'approveMFA') && hasPressure(a, 'urgency') && IS_UNSOLICITED(a),
  },

  // ── Google (7 rules) ──────────────────────────────────────────────────────
  {
    id: 'ne_google_unsolicited_call',
    title: 'Google: Makes Unsolicited Calls About Account Problems',
    rule: 'Google does not make unsolicited calls to users about account security problems.',
    source: 'Google Safety Center — Stay Safe Online',
    url: 'https://safety.google/intl/en_us/security/google-safety/',
    rationale: 'Google contacts users through in-app notifications and email to verified addresses — never unsolicited phone calls.',
    message: 'HARD STOP: Google does not make unsolicited calls about account issues. This is a Google impersonation scam.',
    severity: 'RED',
    check: (a) => IS_GOOGLE(a) && a.contactModality === 'phone' && IS_UNSOLICITED(a),
  },
  {
    id: 'ne_google_sms_link',
    title: 'Google: Sends Unsolicited Texts Asking You to Click Links',
    rule: 'Google does not send unsolicited texts asking users to click links to fix account problems.',
    source: 'Google Safety Center — Stay Safe Online',
    url: 'https://safety.google/intl/en_us/security/google-safety/',
    rationale: 'Unsolicited texts with links impersonating Google are phishing attempts designed to steal Google account credentials.',
    message: 'HARD STOP: Google does not send unsolicited texts with links. Do not click this link.',
    severity: 'RED',
    check: (a) => IS_GOOGLE(a) && a.contactModality === 'sms' && IS_UNSOLICITED(a) && hasAction(a, 'clickLink'),
  },
  {
    id: 'ne_google_gift_cards',
    title: 'Google: Asks for Payment via Gift Cards',
    rule: 'Google does not request payment via Google Play gift cards or any other gift cards.',
    source: 'Google Safety Center — Stay Safe Online',
    url: 'https://safety.google/intl/en_us/security/google-safety/',
    rationale: 'Gift card payment requests are a definitive fraud indicator. Google Play cards are a top currency for impersonation scams.',
    message: 'HARD STOP: Google never requests gift card payments. This is fraud.',
    severity: 'RED',
    check: (a) => IS_GOOGLE(a) && hasAction(a, 'giftCards'),
  },
  {
    id: 'ne_google_popup_number',
    title: 'Google: Sends Pop-Up Warnings With a Phone Number to Call',
    rule: 'Google does not display pop-up warnings with a support phone number instructing you to call.',
    source: 'Google Safety Center — Stay Safe Online',
    url: 'https://safety.google/intl/en_us/security/google-safety/',
    rationale: 'Pop-ups with phone numbers are a browser-based tech support scam. Calling the number connects the victim to fraudsters, not Google.',
    message: 'HARD STOP: Google does not use pop-ups with phone numbers. Close the browser tab and do not call the number.',
    severity: 'RED',
    check: (a) => IS_GOOGLE(a) && a.contactModality === 'popup' && hasAction(a, 'callNumber'),
  },
  {
    id: 'ne_google_remote_access',
    title: 'Google: Requests Remote Access to Your Device',
    rule: 'Google does not ask users to install remote access software to resolve account issues.',
    source: 'Google Safety Center — Stay Safe Online',
    url: 'https://safety.google/intl/en_us/security/google-safety/',
    rationale: 'Remote access gives attackers full control over the device, including access to all accounts and stored credentials.',
    message: 'HARD STOP: Google never requests remote access to your device. Do not install any software.',
    severity: 'RED',
    check: (a) => IS_GOOGLE(a) && IS_REMOTE(a),
  },
  {
    id: 'ne_google_password_request',
    title: 'Google: Asks for Your Google Account Password',
    rule: 'Google never asks for your password via phone, text, or email.',
    source: 'Google Safety Center — Stay Safe Online',
    url: 'https://safety.google/intl/en_us/security/google-safety/',
    rationale: 'Account credentials are private. Google engineers and support staff do not have access to and will not ask for your password.',
    message: 'HARD STOP: Google never asks for your password. Do not provide it.',
    severity: 'RED',
    check: (a) => IS_GOOGLE(a) && hasAction(a, 'enterPassword'),
  },
  {
    id: 'ne_google_transfer_funds',
    title: 'Google: Asks You to Transfer Funds to Protect Your Account',
    rule: 'Google never instructs users to transfer money or move funds to a "safe" account for protection.',
    source: 'Google Safety Center — Stay Safe Online',
    url: 'https://safety.google/intl/en_us/security/google-safety/',
    rationale: 'Fund transfer requests to protect accounts are a hallmark of tech impersonation scams targeting bank account access.',
    message: 'HARD STOP: Google never asks you to move money. This is a fraud attempt.',
    severity: 'RED',
    check: (a) => IS_GOOGLE(a) && IS_PAYMENT(a),
  },

  // ── Microsoft (8 rules) ───────────────────────────────────────────────────
  {
    id: 'ne_microsoft_unsolicited_call',
    title: 'Microsoft: Makes Unsolicited Calls About Computer Problems',
    rule: 'Microsoft does not make unsolicited calls to users about computer viruses, licensing problems, or security issues.',
    source: 'Microsoft — Protect Yourself from Tech Support Scams',
    url: 'https://support.microsoft.com/en-us/windows/protect-yourself-from-tech-support-scams-2ebf91bd-f94c-2a8a-e541-f5c800d18435',
    rationale: 'Microsoft explicitly states it does not make unsolicited phone calls. Such calls are a primary tech support scam vector.',
    message: 'HARD STOP: Microsoft does not make unsolicited calls. This is a tech support scam — hang up.',
    severity: 'RED',
    check: (a) => IS_MICROSOFT(a) && a.contactModality === 'phone' && IS_UNSOLICITED(a),
  },
  {
    id: 'ne_microsoft_popup_number',
    title: 'Microsoft: Pop-Up Warnings With a Phone Number to Call',
    rule: 'Microsoft does not send pop-up alerts with a phone number to call for technical support.',
    source: 'Microsoft — Protect Yourself from Tech Support Scams',
    url: 'https://support.microsoft.com/en-us/windows/protect-yourself-from-tech-support-scams-2ebf91bd-f94c-2a8a-e541-f5c800d18435',
    rationale: 'Browser pop-ups with Microsoft branding and support numbers are consistently fraudulent. Microsoft communicates through Windows Update and the official support site.',
    message: 'HARD STOP: Microsoft does not use pop-up alerts with phone numbers. Close the browser and do not call.',
    severity: 'RED',
    check: (a) => IS_MICROSOFT(a) && a.contactModality === 'popup' && hasAction(a, 'callNumber'),
  },
  {
    id: 'ne_microsoft_gift_cards',
    title: 'Microsoft: Asks for Gift Cards as Payment',
    rule: 'Microsoft does not require payment via gift cards for any service, subscription, or fine.',
    source: 'Microsoft — Protect Yourself from Tech Support Scams',
    url: 'https://support.microsoft.com/en-us/windows/protect-yourself-from-tech-support-scams-2ebf91bd-f94c-2a8a-e541-f5c800d18435',
    rationale: 'Gift cards are a primary fraud currency. Microsoft processes payments only through official Microsoft channels.',
    message: 'HARD STOP: Microsoft never requires gift card payments. This is a definitive fraud indicator.',
    severity: 'RED',
    check: (a) => IS_MICROSOFT(a) && hasAction(a, 'giftCards'),
  },
  {
    id: 'ne_microsoft_remote_access',
    title: 'Microsoft: Requests Unsolicited Remote Access to Your Device',
    rule: 'Microsoft does not request remote access to your computer unless you contacted them first.',
    source: 'Microsoft — Protect Yourself from Tech Support Scams',
    url: 'https://support.microsoft.com/en-us/windows/protect-yourself-from-tech-support-scams-2ebf91bd-f94c-2a8a-e541-f5c800d18435',
    rationale: 'Remote access grants full device control to the attacker. Microsoft support only uses remote access in sessions you initiate.',
    message: 'HARD STOP: Microsoft does not request unsolicited remote access. Do not install any software.',
    severity: 'RED',
    check: (a) => IS_MICROSOFT(a) && IS_REMOTE(a) && IS_UNSOLICITED(a),
  },
  {
    id: 'ne_microsoft_password_request',
    title: 'Microsoft: Asks for Your Password',
    rule: 'Microsoft never asks for your account password via phone, email, or pop-up.',
    source: 'Microsoft — Protect Yourself from Tech Support Scams',
    url: 'https://support.microsoft.com/en-us/windows/protect-yourself-from-tech-support-scams-2ebf91bd-f94c-2a8a-e541-f5c800d18435',
    rationale: 'Passwords are private. Microsoft engineers cannot and will not ask for your password to troubleshoot.',
    message: 'HARD STOP: Microsoft never asks for your password. Do not provide it.',
    severity: 'RED',
    check: (a) => IS_MICROSOFT(a) && hasAction(a, 'enterPassword'),
  },
  {
    id: 'ne_microsoft_virus_removal_fee',
    title: 'Microsoft: Charges Fees to Remove a Virus',
    rule: 'Microsoft does not charge fees to remove viruses from your computer.',
    source: 'Microsoft — Protect Yourself from Tech Support Scams',
    url: 'https://support.microsoft.com/en-us/windows/protect-yourself-from-tech-support-scams-2ebf91bd-f94c-2a8a-e541-f5c800d18435',
    rationale: 'Fake virus alerts followed by payment requests are a core tech support scam. Microsoft Defender is free and built into Windows.',
    message: 'HARD STOP: Microsoft does not charge to remove viruses. This is a tech support scam.',
    severity: 'RED',
    check: (a) => IS_MICROSOFT(a) && IS_PAYMENT(a) && a.contactModality === 'popup',
  },
  {
    id: 'ne_microsoft_urgent_email_link',
    title: 'Microsoft: Sends Urgent Email Alerts Requiring You to Click a Link',
    rule: 'Microsoft does not send unsolicited urgent email alerts requiring immediate action via a link.',
    source: 'Microsoft — Protect Yourself from Tech Support Scams',
    url: 'https://support.microsoft.com/en-us/windows/protect-yourself-from-tech-support-scams-2ebf91bd-f94c-2a8a-e541-f5c800d18435',
    rationale: 'Phishing emails mimicking Microsoft with urgent calls to action and embedded links are the most common Microsoft impersonation vector.',
    message: 'HARD STOP: Do not click links in unsolicited urgent Microsoft emails. Go to account.microsoft.com directly.',
    severity: 'RED',
    check: (a) => IS_MICROSOFT(a) && a.contactModality === 'email' && IS_UNSOLICITED(a) && hasAction(a,'clickLink') && hasPressure(a,'urgency'),
  },
  {
    id: 'ne_microsoft_disable_security',
    title: 'Microsoft: Asks You to Disable Security Software',
    rule: 'Microsoft never instructs users to disable security software, Windows Defender, or firewall settings.',
    source: 'Microsoft — Protect Yourself from Tech Support Scams',
    url: 'https://support.microsoft.com/en-us/windows/protect-yourself-from-tech-support-scams-2ebf91bd-f94c-2a8a-e541-f5c800d18435',
    rationale: 'Disabling security software is a prerequisite for malware installation. Legitimate support never requires this.',
    message: 'HARD STOP: Microsoft never asks you to disable security software. This is a precursor to malware installation.',
    severity: 'RED',
    check: (a) => IS_MICROSOFT(a) && IS_REMOTE(a) && hasPressure(a, 'doNotVerify'),
  },

  // ── Apple (5 rules) ───────────────────────────────────────────────────────
  {
    id: 'ne_apple_unsolicited_call',
    title: 'Apple: Makes Unsolicited Calls About Account Security',
    rule: 'Apple does not make unsolicited calls to users about iCloud or Apple ID security issues.',
    source: 'Apple Support — Recognize and Avoid Social Engineering Scams',
    url: 'https://support.apple.com/en-us/102568',
    rationale: 'Apple communicates account security through in-device notifications and email. Unsolicited support calls claiming to be Apple are impersonation scams.',
    message: 'HARD STOP: Apple does not make unsolicited calls. This is an Apple impersonation scam — hang up.',
    severity: 'RED',
    check: (a) => IS_APPLE(a) && a.contactModality === 'phone' && IS_UNSOLICITED(a),
  },
  {
    id: 'ne_apple_gift_card_payment',
    title: 'Apple: Asks for Apple Gift Cards as Payment',
    rule: 'Apple never requests payment via Apple Gift Cards for any Apple service or fine.',
    source: 'Apple Support — Recognize and Avoid Social Engineering Scams',
    url: 'https://support.apple.com/en-us/102568',
    rationale: 'Apple Gift Card payment demands are a primary fraud vector specifically exploiting Apple brand trust.',
    message: 'HARD STOP: Apple never requests gift card payments. If someone does, report it to reportphishing@apple.com.',
    severity: 'RED',
    check: (a) => IS_APPLE(a) && hasAction(a, 'giftCards'),
  },
  {
    id: 'ne_apple_password_request',
    title: 'Apple: Asks for Your Apple ID Password via Phone or Text',
    rule: 'Apple never asks for your Apple ID password, verification codes, or security answers via phone or text.',
    source: 'Apple Support — Recognize and Avoid Social Engineering Scams',
    url: 'https://support.apple.com/en-us/102568',
    rationale: 'Apple\'s support model never requires sharing account credentials. Any request for your Apple ID password is an account takeover attempt.',
    message: 'HARD STOP: Apple never asks for your Apple ID password. Do not provide it.',
    severity: 'RED',
    check: (a) => IS_APPLE(a) && (hasAction(a,'enterPassword') || hasAction(a,'resetPassword')),
  },
  {
    id: 'ne_apple_disable_security',
    title: 'Apple: Asks You to Disable Security Features',
    rule: 'Apple does not ask users to disable Find My, two-factor authentication, or other security features.',
    source: 'Apple Support — Recognize and Avoid Social Engineering Scams',
    url: 'https://support.apple.com/en-us/102568',
    rationale: 'Disabling Apple security features enables device takeover. Legitimate Apple support never requires weakening account security.',
    message: 'HARD STOP: Apple never asks you to disable security features. This is a device compromise attempt.',
    severity: 'RED',
    check: (a) => IS_APPLE(a) && hasAction(a, 'resetPassword') && IS_UNSOLICITED(a),
  },
  {
    id: 'ne_apple_remote_access',
    title: 'Apple: Requests Remote Access to Your Device',
    rule: 'Apple does not ask users to install remote access apps or grant control of their devices.',
    source: 'Apple Support — Recognize and Avoid Social Engineering Scams',
    url: 'https://support.apple.com/en-us/102568',
    rationale: 'Remote access to an Apple device grants full access to iCloud, passwords, and financial apps.',
    message: 'HARD STOP: Apple never requests remote access to your device. Do not install anything.',
    severity: 'RED',
    check: (a) => IS_APPLE(a) && IS_REMOTE(a),
  },

  // ── USPS (5 rules) ────────────────────────────────────────────────────────
  {
    id: 'ne_usps_sms_payment',
    title: 'USPS: Sends Texts Requesting Payment to Deliver a Package',
    rule: 'USPS does not send text messages requesting payment before a package can be delivered.',
    source: 'USPS Postal Inspection Service — Smishing Fraud',
    url: 'https://postalinspectors.uspis.gov/investigations/mailfraud/fraudschemes/smishing.aspx',
    rationale: 'USPS "smishing" scams (package delivery texts demanding payment) are among the highest-volume phishing campaigns tracked by the USPS Postal Inspection Service.',
    message: 'HARD STOP: USPS does not request payment via text message. This is a USPS smishing scam.',
    severity: 'RED',
    check: (a) => IS_USPS(a) && a.contactModality === 'sms' && IS_PAYMENT(a),
  },
  {
    id: 'ne_usps_sms_fees',
    title: 'USPS: Charges Delivery Fees via Text Message Links',
    rule: 'USPS does not charge delivery fees through links in text messages.',
    source: 'USPS Postal Inspection Service — Smishing Fraud',
    url: 'https://postalinspectors.uspis.gov/investigations/mailfraud/fraudschemes/smishing.aspx',
    rationale: 'Text-based fee collection links are the standard attack delivery in USPS smishing campaigns. USPS collects fees only through official USPS channels.',
    message: 'HARD STOP: USPS does not charge fees via text links. Do not click the link.',
    severity: 'RED',
    check: (a) => IS_USPS(a) && a.contactModality === 'sms' && hasAction(a,'clickLink'),
  },
  {
    id: 'ne_usps_credit_card_sms',
    title: 'USPS: Asks for Credit Card Information via SMS',
    rule: 'USPS does not request credit card or financial information via SMS.',
    source: 'USPS Postal Inspection Service — Smishing Fraud',
    url: 'https://postalinspectors.uspis.gov/investigations/mailfraud/fraudschemes/smishing.aspx',
    rationale: 'Financial data collection via SMS is phishing. USPS never requests card information through text messages.',
    message: 'HARD STOP: USPS never requests financial information by text. This is a smishing attack.',
    severity: 'RED',
    check: (a) => IS_USPS(a) && a.contactModality === 'sms' && (hasAction(a,'enterPassword') || IS_PAYMENT(a)),
  },
  {
    id: 'ne_usps_unsolicited_tracking',
    title: 'USPS: Sends Unsolicited Tracking Notifications',
    rule: 'USPS Informed Delivery tracking notifications are only sent when you have signed up for the service.',
    source: 'USPS Postal Inspection Service — Smishing Fraud',
    url: 'https://postalinspectors.uspis.gov/investigations/mailfraud/fraudschemes/smishing.aspx',
    rationale: 'Scammers send fake tracking texts to create a pretext for phishing links. Legitimate USPS tracking texts come only from opted-in Informed Delivery.',
    message: 'HARD STOP: Unsolicited USPS tracking texts are a common phishing vector. Verify any delivery at usps.com directly.',
    severity: 'RED',
    check: (a) => IS_USPS(a) && IS_UNSOLICITED(a) && a.contactModality === 'sms' && hasAction(a,'clickLink'),
  },
  {
    id: 'ne_usps_unofficial_links',
    title: 'USPS: Directs You to Unofficial Links for Package Information',
    rule: 'USPS does not direct users to unofficial or third-party sites for package tracking or payment.',
    source: 'USPS Postal Inspection Service — Smishing Fraud',
    url: 'https://postalinspectors.uspis.gov/investigations/mailfraud/fraudschemes/smishing.aspx',
    rationale: 'Fake USPS domains are used to harvest credentials and payment information. Always use usps.com or the official USPS app.',
    message: 'HARD STOP: Only use usps.com for USPS tracking. Do not click links from texts claiming to be USPS.',
    severity: 'RED',
    check: (a) => IS_USPS(a) && hasAction(a,'clickLink') && a.verificationState === 'blocked',
  },

  // ── FedEx (4 rules) ───────────────────────────────────────────────────────
  {
    id: 'ne_fedex_unsolicited_payment',
    title: 'FedEx: Sends Unsolicited Texts or Emails Requesting Payment',
    rule: 'FedEx does not send unsolicited emails or texts requesting payment before package delivery.',
    source: 'FedEx — Report Fraud',
    url: 'https://www.fedex.com/en-us/security/report-fraud.html',
    rationale: 'FedEx states it does not request payment or personal information via unsolicited email or text.',
    message: 'HARD STOP: FedEx does not request payment via unsolicited text or email. This is a delivery impersonation scam.',
    severity: 'RED',
    check: (a) => IS_FEDEX(a) && IS_UNSOLICITED(a) && IS_PAYMENT(a),
  },
  {
    id: 'ne_fedex_sms_link_fee',
    title: 'FedEx: Charges Delivery Fees via Text Message Links',
    rule: 'FedEx does not collect delivery fees via links in text messages.',
    source: 'FedEx — Report Fraud',
    url: 'https://www.fedex.com/en-us/security/report-fraud.html',
    rationale: 'SMS-delivered payment links impersonating FedEx are a common smishing attack pattern.',
    message: 'HARD STOP: FedEx does not charge fees via text links. Do not click the link.',
    severity: 'RED',
    check: (a) => IS_FEDEX(a) && a.contactModality === 'sms' && hasAction(a,'clickLink'),
  },
  {
    id: 'ne_fedex_personal_info_sms',
    title: 'FedEx: Requests Personal or Financial Information via SMS',
    rule: 'FedEx does not request personal or financial information via text message.',
    source: 'FedEx — Report Fraud',
    url: 'https://www.fedex.com/en-us/security/report-fraud.html',
    rationale: 'FedEx communicates delivery status through its app and official email channels, never SMS-based data requests.',
    message: 'HARD STOP: FedEx never requests personal or financial information via SMS.',
    severity: 'RED',
    check: (a) => IS_FEDEX(a) && a.contactModality === 'sms' && IS_CREDENTIAL(a),
  },
  {
    id: 'ne_fedex_gift_card_delivery',
    title: 'FedEx: Requests Gift Card Payment for Delivery Fees',
    rule: 'FedEx does not accept or request gift cards as payment for delivery fees.',
    source: 'FedEx — Report Fraud',
    url: 'https://www.fedex.com/en-us/security/report-fraud.html',
    rationale: 'Gift card payment for delivery is universally fraudulent — no legitimate carrier accepts this payment method.',
    message: 'HARD STOP: FedEx never accepts gift cards. This is a delivery impersonation scam.',
    severity: 'RED',
    check: (a) => IS_FEDEX(a) && hasAction(a, 'giftCards'),
  },

  // ── UPS (4 rules) ─────────────────────────────────────────────────────────
  {
    id: 'ne_ups_unsolicited_payment',
    title: 'UPS: Sends Unsolicited Texts Requesting Payment Before Delivery',
    rule: 'UPS does not send unsolicited text messages requesting payment before a package can be delivered.',
    source: 'UPS — Fight Fraud',
    url: 'https://www.ups.com/us/en/support/shipping-support/legal-terms-conditions/fight-fraud.page',
    rationale: 'UPS smishing messages exploit the expectation of package delivery to trick victims into paying fees or clicking malicious links.',
    message: 'HARD STOP: UPS does not request pre-delivery payment by text. This is a smishing scam.',
    severity: 'RED',
    check: (a) => IS_UPS(a) && IS_UNSOLICITED(a) && IS_PAYMENT(a),
  },
  {
    id: 'ne_ups_sms_link',
    title: 'UPS: Charges Delivery Fees via Text Message Links',
    rule: 'UPS does not collect delivery fees through links in text messages.',
    source: 'UPS — Fight Fraud',
    url: 'https://www.ups.com/us/en/support/shipping-support/legal-terms-conditions/fight-fraud.page',
    rationale: 'Fraudulent UPS texts direct victims to phishing sites to capture payment card data.',
    message: 'HARD STOP: UPS does not charge fees through text links. Verify at ups.com directly.',
    severity: 'RED',
    check: (a) => IS_UPS(a) && a.contactModality === 'sms' && hasAction(a,'clickLink'),
  },
  {
    id: 'ne_ups_financial_info_sms',
    title: 'UPS: Requests Personal Financial Information via SMS',
    rule: 'UPS does not request personal financial information via text message.',
    source: 'UPS — Fight Fraud',
    url: 'https://www.ups.com/us/en/support/shipping-support/legal-terms-conditions/fight-fraud.page',
    rationale: 'Financial data collection via SMS is phishing. UPS account and payment management is only through ups.com.',
    message: 'HARD STOP: UPS never requests financial information by text. This is a phishing attack.',
    severity: 'RED',
    check: (a) => IS_UPS(a) && a.contactModality === 'sms' && IS_CREDENTIAL(a),
  },
  {
    id: 'ne_ups_gift_cards',
    title: 'UPS: Accepts Gift Cards as Payment',
    rule: 'UPS does not accept gift cards as payment for any delivery fee or service.',
    source: 'UPS — Fight Fraud',
    url: 'https://www.ups.com/us/en/support/shipping-support/legal-terms-conditions/fight-fraud.page',
    rationale: 'No legitimate shipping carrier accepts gift cards as payment. This is universally a fraud indicator.',
    message: 'HARD STOP: UPS never accepts gift cards. This is a delivery impersonation scam.',
    severity: 'RED',
    check: (a) => IS_UPS(a) && hasAction(a, 'giftCards'),
  },

  // ── Amazon (7 rules) ──────────────────────────────────────────────────────
  {
    id: 'ne_amazon_unsolicited_call',
    title: 'Amazon: Calls You Unsolicited About Suspicious Account Activity',
    rule: 'Amazon does not make unsolicited calls to inform users of suspicious account activity.',
    source: 'Amazon — Identify Whether an Email, Phone Call, Text, or Webpage is from Amazon',
    url: 'https://www.amazon.com/gp/help/customer/display.html?nodeId=GU5EEWD6T3H6V6FR',
    rationale: 'Amazon communicates account security alerts through the Amazon app and verified email. Unsolicited calls claiming to be Amazon are impersonation scams.',
    message: 'HARD STOP: Amazon does not make unsolicited calls about account activity. Hang up and verify at amazon.com.',
    severity: 'RED',
    check: (a) => IS_AMAZON(a) && a.contactModality === 'phone' && IS_UNSOLICITED(a),
  },
  {
    id: 'ne_amazon_gift_cards',
    title: 'Amazon: Asks for Gift Cards as Payment for Any Service',
    rule: 'Amazon does not request gift card payment for any Amazon service, fee, or fine.',
    source: 'Amazon — Identify Whether an Email, Phone Call, Text, or Webpage is from Amazon',
    url: 'https://www.amazon.com/gp/help/customer/display.html?nodeId=GU5EEWD6T3H6V6FR',
    rationale: 'Amazon Gift Card fraud is among the most reported impersonation scam categories. Amazon never uses gift cards as a fee collection method.',
    message: 'HARD STOP: Amazon never requests gift card payments. This is an Amazon impersonation scam.',
    severity: 'RED',
    check: (a) => IS_AMAZON(a) && hasAction(a, 'giftCards'),
  },
  {
    id: 'ne_amazon_remote_access',
    title: 'Amazon: Asks You to Install Remote Access Software',
    rule: 'Amazon does not ask customers to install remote access or screen-sharing software.',
    source: 'Amazon — Identify Whether an Email, Phone Call, Text, or Webpage is from Amazon',
    url: 'https://www.amazon.com/gp/help/customer/display.html?nodeId=GU5EEWD6T3H6V6FR',
    rationale: 'Remote access allows fraudsters to take over the device, including access to the Amazon account and banking apps.',
    message: 'HARD STOP: Amazon never requests remote access to your device. Do not install any software.',
    severity: 'RED',
    check: (a) => IS_AMAZON(a) && IS_REMOTE(a),
  },
  {
    id: 'ne_amazon_phone_account_verify',
    title: 'Amazon: Asks You to Verify Your Account via Phone',
    rule: 'Amazon does not call you to verify your account credentials.',
    source: 'Amazon — Identify Whether an Email, Phone Call, Text, or Webpage is from Amazon',
    url: 'https://www.amazon.com/gp/help/customer/display.html?nodeId=GU5EEWD6T3H6V6FR',
    rationale: 'Amazon account verification is performed through the Amazon app and website, not by phone calls requesting credential confirmation.',
    message: 'HARD STOP: Amazon does not call to verify account credentials. Do not provide account information.',
    severity: 'RED',
    check: (a) => IS_AMAZON(a) && a.contactModality === 'phone' && IS_CREDENTIAL(a),
  },
  {
    id: 'ne_amazon_password_reset_link',
    title: 'Amazon: Sends Texts with Links to Reset Your Password',
    rule: 'Amazon does not send unsolicited text messages with links to reset your password.',
    source: 'Amazon — Identify Whether an Email, Phone Call, Text, or Webpage is from Amazon',
    url: 'https://www.amazon.com/gp/help/customer/display.html?nodeId=GU5EEWD6T3H6V6FR',
    rationale: 'Unsolicited password reset texts with links are credential phishing attacks. Amazon password resets are only initiated from amazon.com.',
    message: 'HARD STOP: Do not click password reset links from unsolicited Amazon texts. Go to amazon.com directly.',
    severity: 'RED',
    check: (a) => IS_AMAZON(a) && a.contactModality === 'sms' && IS_UNSOLICITED(a) && hasAction(a,'resetPassword'),
  },
  {
    id: 'ne_amazon_card_number_phone',
    title: 'Amazon: Asks for Your Full Card Number Over the Phone',
    rule: 'Amazon does not ask for your full credit or debit card number over the phone.',
    source: 'Amazon — Identify Whether an Email, Phone Call, Text, or Webpage is from Amazon',
    url: 'https://www.amazon.com/gp/help/customer/display.html?nodeId=GU5EEWD6T3H6V6FR',
    rationale: 'Legitimate payment processing is done through secure web forms, not phone calls reading card numbers aloud.',
    message: 'HARD STOP: Amazon never asks for your card number by phone. Do not provide financial information.',
    severity: 'RED',
    check: (a) => IS_AMAZON(a) && a.contactModality === 'phone' && hasAction(a,'enterPassword'),
  },
  {
    id: 'ne_amazon_prime_cancel_phone',
    title: 'Amazon: Prime Cancellation Handled Over Phone or Text',
    rule: 'Amazon Prime cancellations are only processed through the official Amazon website or app — never by phone call or text.',
    source: 'Amazon — Identify Whether an Email, Phone Call, Text, or Webpage is from Amazon',
    url: 'https://www.amazon.com/gp/help/customer/display.html?nodeId=GU5EEWD6T3H6V6FR',
    rationale: 'Fake Amazon Prime cancellation calls are a major fraud category, often used to gain remote access or payment information.',
    message: 'HARD STOP: Amazon Prime cancellations are only done at amazon.com. Do not provide information to this caller.',
    severity: 'RED',
    check: (a) => IS_AMAZON(a) && a.contactModality === 'phone' && IS_UNSOLICITED(a) && (IS_PAYMENT(a) || IS_REMOTE(a)),
  },

  // ── Walmart (6 rules) ─────────────────────────────────────────────────────
  {
    id: 'ne_walmart_prize_winner_call',
    title: 'Walmart: Calls to Notify Prize Winners and Requests Fees',
    rule: 'Walmart does not call customers to notify them of prize winnings and request advance fees.',
    source: 'Walmart Corporate — Gift Card Scam Awareness',
    url: 'https://corporate.walmart.com/privacy-security/gift-card-scams',
    rationale: 'Advance fee fraud (lottery/prize scams) using Walmart branding are among the most reported Walmart impersonation complaints.',
    message: 'HARD STOP: Walmart does not call to announce prize winners or demand fees. This is a lottery/prize scam.',
    severity: 'RED',
    check: (a) => IS_WALMART(a) && a.contactModality === 'phone' && IS_UNSOLICITED(a) && IS_PAYMENT(a),
  },
  {
    id: 'ne_walmart_gift_card_fees',
    title: 'Walmart: Asks for Gift Cards as Payment for Fees',
    rule: 'Walmart does not request payment via Walmart gift cards for any fee, fine, or prize claim.',
    source: 'Walmart Corporate — Gift Card Scam Awareness',
    url: 'https://corporate.walmart.com/privacy-security/gift-card-scams',
    rationale: 'Walmart gift card scams are a significant category of fraud. Walmart trains its store associates specifically to watch for this activity.',
    message: 'HARD STOP: Walmart never requests gift card payment for any purpose. This is fraud.',
    severity: 'RED',
    check: (a) => IS_WALMART(a) && hasAction(a, 'giftCards'),
  },
  {
    id: 'ne_walmart_sms_personal_info',
    title: 'Walmart: Sends Texts Asking for Personal Information to Claim Prizes',
    rule: 'Walmart does not send texts requesting personal information for prize or sweepstakes claims.',
    source: 'Walmart Corporate — Gift Card Scam Awareness',
    url: 'https://corporate.walmart.com/privacy-security/gift-card-scams',
    rationale: 'Fake prize claim texts harvesting personal data are used to enable identity theft and further fraud.',
    message: 'HARD STOP: Walmart does not request personal information via text for prizes. This is a phishing scam.',
    severity: 'RED',
    check: (a) => IS_WALMART(a) && a.contactModality === 'sms' && IS_UNSOLICITED(a) && IS_CREDENTIAL(a),
  },
  {
    id: 'ne_walmart_gift_card_balance_calls',
    title: 'Walmart: Makes Unsolicited Calls About Gift Card Balances',
    rule: 'Walmart does not make unsolicited calls asking about gift card balances or requesting card numbers.',
    source: 'Walmart Corporate — Gift Card Scam Awareness',
    url: 'https://corporate.walmart.com/privacy-security/gift-card-scams',
    rationale: 'Gift card draining scams involve obtaining card numbers and PINs by phone. Walmart never initiates such calls.',
    message: 'HARD STOP: Walmart does not call about gift card balances. Do not read card numbers to this caller.',
    severity: 'RED',
    check: (a) => IS_WALMART(a) && a.contactModality === 'phone' && IS_UNSOLICITED(a) && hasAction(a,'shareSSN'),
  },
  {
    id: 'ne_walmart_crypto_fees',
    title: 'Walmart: Accepts Cryptocurrency for Fees or Payments',
    rule: 'Walmart does not accept cryptocurrency for in-store or online payments or as fee collection.',
    source: 'Walmart Corporate — Gift Card Scam Awareness',
    url: 'https://corporate.walmart.com/privacy-security/gift-card-scams',
    rationale: 'Cryptocurrency payment demands in the context of Walmart impersonation are universally fraudulent.',
    message: 'HARD STOP: Walmart does not accept cryptocurrency. This is a fraud indicator.',
    severity: 'RED',
    check: (a) => IS_WALMART(a) && hasAction(a, 'sendCrypto'),
  },
  {
    id: 'ne_walmart_advance_sweepstakes_fee',
    title: 'Walmart: Charges Advance Fees for Sweepstakes Prizes',
    rule: 'Walmart does not charge advance fees to claim sweepstakes or contest prizes.',
    source: 'Walmart Corporate — Gift Card Scam Awareness',
    url: 'https://corporate.walmart.com/privacy-security/gift-card-scams',
    rationale: 'Advance fee fraud is the mechanism behind most Walmart prize scams. Legitimate prizes never require upfront payment.',
    message: 'HARD STOP: Legitimate sweepstakes never require an upfront fee. This is an advance fee scam.',
    severity: 'RED',
    check: (a) => IS_WALMART(a) && IS_PAYMENT(a) && hasPressure(a, 'urgency'),
  },

  // ── Banks (5 rules) ───────────────────────────────────────────────────────
  {
    id: 'ne_bank_pin_request',
    title: 'Bank: Asks for Your Full PIN via Phone or Text',
    rule: 'Banks never ask for your full PIN number by phone, text, or email.',
    source: 'American Bankers Association — Bank Fraud Scam Guidance',
    url: 'https://www.aba.com/banking-topics/consumer-resources/protecting-yourself/bank-fraud-scams',
    rationale: 'Bank employees and fraud departments do not need your PIN to verify your identity or investigate fraud. PIN requests are always fraudulent.',
    message: 'HARD STOP: Your bank will never ask for your full PIN. Do not provide it.',
    severity: 'RED',
    check: (a) => IS_BANK(a) && hasAction(a, 'enterPassword'),
  },
  {
    id: 'ne_bank_mfa_approve_unsolicited',
    title: 'Bank: Asks You to Approve an MFA Push You Did Not Initiate',
    rule: 'Banks never ask you to approve a multi-factor authentication push notification you did not personally trigger.',
    source: 'American Bankers Association — Bank Fraud Scam Guidance',
    url: 'https://www.aba.com/banking-topics/consumer-resources/protecting-yourself/bank-fraud-scams',
    rationale: 'Approving an unsolicited bank MFA push grants the attacker access to your account. Only approve MFA you personally triggered.',
    message: 'HARD STOP: Do NOT approve any bank MFA push you did not initiate. Deny it and contact your bank directly.',
    severity: 'RED',
    check: (a) => IS_BANK(a) && hasAction(a, 'approveMFA') && IS_UNSOLICITED(a),
  },
  {
    id: 'ne_bank_safe_account',
    title: 'Bank: Asks You to Move Money to a "Safe" Account',
    rule: 'Banks never instruct customers to transfer money to a "safe" or "secure" account to protect it from fraud.',
    source: 'American Bankers Association — Bank Fraud Scam Guidance',
    url: 'https://www.aba.com/banking-topics/consumer-resources/protecting-yourself/bank-fraud-scams',
    rationale: '"Safe account" transfers are the core mechanism of bank impersonation fraud. Once transferred, the money goes directly to the attacker.',
    message: 'HARD STOP: Your bank will NEVER ask you to move money to protect it. This is a definitive bank impersonation scam.',
    severity: 'RED',
    check: (a) => IS_BANK(a) && hasAction(a, 'transferMoney'),
  },
  {
    id: 'ne_bank_password_request',
    title: 'Bank: Asks for Your Online Banking Password',
    rule: 'Banks never ask for your full online banking password by phone, text, or email.',
    source: 'American Bankers Association — Bank Fraud Scam Guidance',
    url: 'https://www.aba.com/banking-topics/consumer-resources/protecting-yourself/bank-fraud-scams',
    rationale: 'Banking passwords are never required for customer service purposes. Any request for them is credential theft.',
    message: 'HARD STOP: Your bank never needs your password. Do not provide it to anyone who calls or texts you.',
    severity: 'RED',
    check: (a) => IS_BANK(a) && (hasAction(a,'enterPassword') || hasAction(a,'resetPassword')),
  },
  {
    id: 'ne_bank_gift_card_payment',
    title: 'Bank: Asks You to Buy Gift Cards and Read the Numbers',
    rule: 'Banks never instruct customers to purchase gift cards and read back the card numbers as payment.',
    source: 'American Bankers Association — Bank Fraud Scam Guidance',
    url: 'https://www.aba.com/banking-topics/consumer-resources/protecting-yourself/bank-fraud-scams',
    rationale: 'Gift card payment demands from a "bank" are universally fraudulent. No bank collects payments this way.',
    message: 'HARD STOP: Your bank will never ask you to buy gift cards. This is a definitive bank impersonation scam.',
    severity: 'RED',
    check: (a) => IS_BANK(a) && hasAction(a, 'giftCards'),
  },
];

// ─── Signal Count Functions ───────────────────────────────────────────────────

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
  if (['ssa','irs','lawenforcement','govother','apple','google','microsoft','techother','crypto','romance'].includes(answers.claimedIdentity)) {
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
    signals.push('Personalization present: attacker may have accessed prior breach data');
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
    signals.push('Verification status unclear: independent check not yet attempted');
  }

  return { count, signals };
}

// ─── Main Evaluation Function ─────────────────────────────────────────────────

export function evaluateAssessment(answers) {
  const triggeredNeverEvents = NEVER_EVENT_RULES.filter(ne => ne.check(answers));

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

  const layerRisk = {
    contact: worst([questionRisk.q1, questionRisk.q2, questionRisk.q3, questionRisk.q4]),
    lure:    worst([questionRisk.q5, questionRisk.q6, questionRisk.q7]),
    action:  worst([questionRisk.q8, questionRisk.q9]),
  };

  const complexityResult = computeComplexityScore(answers);
  const highRiskSignals = computeHighRiskSignalCount(answers);
  const cautionSignals  = computeCautionSignalCount(answers);

  let finalRisk = 'green';
  const triggeredConditions = [];

  if (triggeredNeverEvents.length > 0) {
    finalRisk = 'red';
    triggeredConditions.push({
      rule: 'Never-Event Hard Override',
      detail: `${triggeredNeverEvents.length} institutional never-event rule(s) triggered. This is an unconditional hard stop: no other condition can downgrade this result.`,
    });
  }

  if (finalRisk !== 'red') {
    const highRiskContext =
      IS_UNSOLICITED(answers) ||
      answers.relationshipValidity === 'no' ||
      ['ssa','irs','lawenforcement','govother','apple','google','microsoft','techother','crypto','romance'].includes(answers.claimedIdentity);

    if (highRiskContext && IRREVERSIBLE_ACTION(answers)) {
      finalRisk = 'red';
      const what = [];
      if (IS_PAYMENT(answers))    what.push('payment transfer');
      if (IS_CREDENTIAL(answers)) what.push('credential disclosure');
      if (IS_MFA(answers))        what.push('MFA approval/sharing');
      if (IS_REMOTE(answers))     what.push('remote access installation');
      triggeredConditions.push({
        rule: 'High-Risk Combination - Irreversible Action in High-Risk Context',
        detail: `An irreversible action (${what.join(', ')}) is being requested within a high-risk contact context. The framework mandates a hard stop when these conditions co-occur.`,
      });
    }
  }

  if (finalRisk !== 'red') {
    if (questionRisk.q8 === 'red') {
      finalRisk = 'red';
      triggeredConditions.push({
        rule: 'Irreversible Action Requested (Q8 = RED)',
        detail: 'The selected action(s) include credential disclosure, MFA approval/sharing, financial transfer, or remote access — all of which are irreversible harm boundaries.',
      });
    }
    if (questionRisk.q9 === 'red') {
      finalRisk = 'red';
      triggeredConditions.push({
        rule: 'Verification Blocked (Q9 = RED)',
        detail: 'Independent verification is blocked or discouraged. Any legitimate institution allows and encourages you to verify through official channels.',
      });
    }
  }

  if (finalRisk !== 'red' && highRiskSignals.count >= 2) {
    finalRisk = 'yellow';
    triggeredConditions.push({
      rule: `High-Risk Signal Aggregation (count = ${highRiskSignals.count}/5)`,
      detail: `${highRiskSignals.count} independent high-risk conditions detected simultaneously: ${highRiskSignals.signals.join('; ')}.`,
    });
  }

  if (finalRisk !== 'red') {
    if (cautionSignals.count >= 2) {
      finalRisk = 'yellow';
      triggeredConditions.push({
        rule: `Cautionary Signal Aggregation (count = ${cautionSignals.count}/7)`,
        detail: `${cautionSignals.count} caution signals detected: ${cautionSignals.signals.join('; ')}.`,
      });
    }

    if (complexityResult.score >= 3) {
      if (finalRisk !== 'red') finalRisk = 'yellow';
      triggeredConditions.push({
        rule: `Complexity Score ≥ 3 (Score = ${complexityResult.score}/6)`,
        detail: `Structural complexity of ${complexityResult.score} indicates multiple manipulation mechanisms are present simultaneously.`,
      });
    }

    if (layerRisk.contact === 'yellow' && layerRisk.lure === 'yellow') {
      if (finalRisk !== 'red') finalRisk = 'yellow';
      triggeredConditions.push({
        rule: 'Layer 1 + Layer 2 Both YELLOW',
        detail: 'Both the Contact & Identity layer and the Pressure & Tactics layer scored CAUTION.',
      });
    }

    if (layerRisk.lure === 'yellow' && layerRisk.action === 'yellow') {
      if (finalRisk !== 'red') finalRisk = 'yellow';
      triggeredConditions.push({
        rule: 'Layer 2 + Layer 3 Both YELLOW',
        detail: 'Both the Pressure & Tactics layer and the Requested Actions layer scored CAUTION.',
      });
    }

    if (layerRisk.action === 'yellow') {
      if (finalRisk !== 'red') finalRisk = 'yellow';
      triggeredConditions.push({
        rule: 'Action Layer YELLOW',
        detail: 'Layer 3 (Requested Actions) scored CAUTION. Any non-trivial action request in an uncertain context requires verification before proceeding.',
      });
    }
  }

  const seen = new Set();
  const uniqueConditions = triggeredConditions.filter(c => {
    if (seen.has(c.rule)) return false;
    seen.add(c.rule);
    return true;
  });

  const intervention = generateIntervention(answers, finalRisk, triggeredNeverEvents, complexityResult, uniqueConditions);

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

function generateIntervention(answers, finalRisk, triggeredNeverEvents, complexityResult, triggeredConditions) {
  const interventions = [];
  const nextSteps = [];
  let summary = '';
  const identity = answers.claimedIdentity;

  const HARD_STOP_RULES = new Set([
    'Never-Event Hard Override',
    'High-Risk Combination - Irreversible Action in High-Risk Context',
    'Irreversible Action Requested (Q8 = RED)',
    'Verification Blocked (Q9 = RED)',
  ]);

  const hasHardStopBasis =
    triggeredNeverEvents.length > 0 ||
    triggeredConditions.some(c => HARD_STOP_RULES.has(c.rule));

  if (finalRisk === 'red' && hasHardStopBasis) {
    summary = 'Multiple serious risk factors have been detected. This interaction matches the structural profile of a known scam archetype. Do not proceed with any requested action.';

    triggeredNeverEvents.forEach(ne => interventions.push(ne.message));
    triggeredConditions
      .filter(c => c.rule !== 'Never-Event Hard Override')
      .forEach(c => interventions.push(`Rule triggered - ${c.rule}: ${c.detail}`));

    nextSteps.push('Stop responding to this contact immediately: hang up or close the message');
    nextSteps.push('Do NOT send money, buy gift cards, or send cryptocurrency');
    nextSteps.push('Do NOT approve any MFA push notifications you did not personally initiate');
    nextSteps.push('Do NOT install any software or allow remote access to your device');

    if (['banks','bankother'].includes(identity)) {
      nextSteps.push('Call your bank using the number on the back of your card or their official app — not any number from this contact');
    } else if (['ssa','irs','lawenforcement','govother'].includes(identity)) {
      nextSteps.push('Contact the agency only through their official government website (IRS.gov, SSA.gov) — not via any number or link in this message');
      nextSteps.push('Report government impersonation to the Treasury Inspector General: 1-800-366-4484');
    } else if (['apple','google','microsoft','techother'].includes(identity)) {
      nextSteps.push("Contact tech support through the company's official website only — never call a number shown in a pop-up or text");
    } else if (identity === 'romance') {
      nextSteps.push('Do not send money to someone you have only met online, regardless of how long you have communicated');
      nextSteps.push('Call the AARP Fraud Watch Network: 1-877-908-3360');
    } else if (identity === 'crypto') {
      nextSteps.push('Report investment fraud to the FTC at ReportFraud.ftc.gov and the FBI at IC3.gov');
    } else if (['employer','amazon','walmart','marketplaceother'].includes(identity)) {
      nextSteps.push('Call the person using a number from your company directory or prior known correspondence — not this message');
    } else if (['usps','fedex','ups','deliveryother'].includes(identity)) {
      nextSteps.push('Verify any delivery status directly on the carrier\'s official website using your tracking number — do not use any link from this message');
    }

    nextSteps.push('Report fraud to the FTC at ReportFraud.ftc.gov or 1-877-FTC-HELP');

  } else if (finalRisk === 'red') {
    summary = 'Multiple high-risk signals are present. The overall pattern is strongly consistent with a scam. Treat this interaction as very high risk and verify independently before any action.';

    triggeredConditions.forEach(c => interventions.push(`Caution: ${c.rule} - ${c.detail}`));
    interventions.push('Do not rely on information, links, or phone numbers provided in this contact. Independent verification is required before any action.');

    nextSteps.push('Pause the interaction: do not respond further until you verify through an official channel');
    nextSteps.push('Do not use any links, phone numbers, or contact details from this message');
    nextSteps.push('Call back using an independently sourced number to confirm whether this contact is genuine');
    nextSteps.push('If any "never event" appears (gift cards, crypto, remote access, verification code sharing), treat it as an immediate hard stop');

  } else if (finalRisk === 'yellow') {
    summary = 'Caution signals are present. This contact has not triggered a hard stop, but independent verification is required before taking any action.';

    triggeredConditions.forEach(c => interventions.push(`Caution: ${c.rule} - ${c.detail}`));
    interventions.push('Do not use any links, phone numbers, or attachments from this contact. Find official contact information independently before responding.');

    nextSteps.push('Do not use any links, phone numbers, or attachments from this contact');
    nextSteps.push('Find the official contact information yourself: search engine, official app, or back of your card');
    nextSteps.push('Call back using an official number you found independently to confirm legitimacy');
    nextSteps.push('Legitimate contacts can wait for you to verify. Scammers cannot afford to let you.');

  } else {
    summary = 'No major red flags detected based on your answers. Proceed with normal caution.';

    interventions.push('LOW RISK: The signals present in this interaction are consistent with a legitimate contact. Continue with normal caution.');

    nextSteps.push('Remain alert: if anything changes or new pressure appears, re-run this assessment');
    nextSteps.push('Verify the contact is who they say they are before sharing any sensitive information');
    nextSteps.push('Legitimate organizations will not pressure you to act immediately or block you from verifying');
  }

  return { summary, interventions, nextSteps };
}

// ─── Archetype Detection ──────────────────────────────────────────────────────

export function detectArchetype(answers) {
  const ci = answers.claimedIdentity;
  const cm = answers.contactModality;
  const e = getArr(answers.escalation);
  const has = (vals) => getArr(answers.requestedAction).some(a => vals.includes(a));

  if (['banks','bankother'].includes(ci) && has(['approveMFA','shareMFA','enterPassword']) && (cm === 'sms' || e.includes('channelSwitch')))
    return { name: 'A1: Bank Impersonation Phishing', description: 'SMS-to-phone escalation targeting bank credentials or MFA. Begins with a fake fraud alert text followed by a call from the "bank fraud department." Irreversible boundary: credential entry or MFA approval.' };

  if (['ssa','irs','lawenforcement','govother'].includes(ci) && has(['giftCards','sendCrypto','transferMoney']))
    return { name: 'A2: Government Impersonation Scam', description: 'Threat-based authority coercion demanding immediate payment. IRS and SSA have explicit written policy prohibiting all forms of this interaction.' };

  if (['employer','amazon','walmart','marketplaceother'].includes(ci) && has(['transferMoney','giftCards']))
    return { name: 'A3: Business Email Compromise (BEC)', description: 'Executive or vendor impersonation requesting unauthorized wire transfers. #1 cybercrime by total dollar loss ($2.9B in 2024).' };

  if (['apple','google','microsoft','techother'].includes(ci) && has(['installSoftware']))
    return { name: 'A4: Tech Support Remote Access Scam', description: 'Fake technical alert leading to a call requesting remote access software. Full device control is the irreversible boundary.' };

  if (ci === 'crypto' && has(['sendCrypto','transferMoney']))
    return { name: 'A5: Crypto Investment Fraud (Pig Butchering)', description: 'Long-duration confidence scam using fabricated investment platforms. #1 loss category ($6.6B in 2024). Crypto is non-recoverable.' };

  if (ci === 'romance' && has(['sendCrypto','transferMoney','giftCards']))
    return { name: 'A6: Romance / Confidence Scam', description: 'Emotional trust-building followed by a manufactured crisis and financial request. $1.3B in losses in 2024. Highest loss per victim.' };

  if (ci === 'banks' && has(['resetPassword','enterPassword','approveMFA']))
    return { name: 'A7: Account Recovery Phishing', description: 'Platform impersonation targeting password reset and MFA code theft. Enables downstream financial fraud.' };

  if (['usps','fedex','ups'].includes(ci) && has(['clickLink','enterPassword','transferMoney']))
    return { name: 'A8: Package Delivery Smishing', description: 'High-volume SMS phishing impersonating shipping companies with malicious payment links.' };

  return null;
}

// ─── Legacy compatibility exports ─────────────────────────────────────────────
export function checkNeverEvents(answers)         { return NEVER_EVENT_RULES.filter(ne => ne.check(answers)); }
export function calculateComplexityScore(answers) { return computeComplexityScore(answers); }
export function determineRiskLevel(answers)       { return evaluateAssessment(answers).finalRisk; }
export const IRREVERSIBLE_ACTIONS = new Set(['approveMFA','shareMFA','transferMoney','giftCards','sendCrypto','installSoftware','shareSSN','enterPassword','resetPassword']);
