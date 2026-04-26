/**
 * questions.js
 * ============
 * All 9 questions across 3 framework layers.
 *
 * Each option includes:
 *   value       — machine key used by the risk engine
 *   label       — user-facing answer text
 *   riskColor   — engine-assigned risk level for path tracker coloring
 *   explanation — real-time contextual note shown immediately when the user selects this option
 *
 * The explanation is NOT the final risk determination — it is an
 * informational note to help users understand why an answer matters.
 * Final risk is always determined by the formal model in riskEngine.js.
 */

export const QUESTIONS = [
  // ─── LAYER 1: Contact Method & Identity ──────────────────────────────────
  {
    id: 'contactModality',
    step: 1,
    layer: 'contact',
    layerLabel: 'Layer 1 · Contact & Identity',
    text: 'How did this contact reach you?',
    helpText: 'Select the channel used. The contact method is the first structural signal — some channels are more strongly associated with specific scam archetypes than others.',
    type: 'single',
    options: [
      {
        value: 'sms',
        label: 'SMS / Text message',
        riskColor: 'yellow',
        explanation: 'SMS is one of the fastest-growing scam contact channels. Attackers use texts because they trigger urgent device notifications and bypass email spam filters. Strongly associated with package delivery scams, fake bank fraud alerts, and MFA fatigue attacks. This answer raises a caution signal — continue to the next questions to build the full picture.',
      },
      {
        value: 'phone',
        label: 'Phone call (incoming)',
        riskColor: 'yellow',
        explanation: 'Incoming phone calls are associated with the highest median financial loss per victim of any contact method. Live voice interaction enables real-time psychological manipulation and prevents you from pausing to verify. This is a caution signal — especially if combined with urgency or authority claims.',
      },
      {
        value: 'email',
        label: 'Email',
        riskColor: 'yellow',
        explanation: 'Email is the highest-volume phishing vector by complaint count. Sender addresses and brand logos are easy to spoof. Often the opening step before escalating to a phone call. This is a caution signal — your next answers about identity and pressure will determine overall risk.',
      },
      {
        value: 'social',
        label: 'Social media / messaging app (WhatsApp, Instagram, Facebook, etc.)',
        riskColor: 'yellow',
        explanation: 'Social media and messaging apps are rapidly growing phishing channels. They exploit existing trust networks and platform familiarity. Crypto investment scams and romance scams frequently begin here before moving to private messaging. This is a caution signal.',
      },
      {
        value: 'popup',
        label: 'Pop-up / device alert on my screen',
        riskColor: 'red',
        explanation: 'Screen pop-ups are the signature entry point for tech support scams — a top-3 loss category. Legitimate operating systems and antivirus software do NOT display pop-ups with phone numbers to call. If you see a pop-up telling you your device is infected and to call a number, do not call it. This is a high-risk signal.',
      },
      {
        value: 'inapp',
        label: 'In-app notification / other',
        riskColor: 'yellow',
        explanation: 'In-app notifications from platforms you actually use are lower risk as a starting point, but can still be spoofed or used in impersonation attacks. Continue answering to assess the full context.',
      },
    ],
  },

  {
    id: 'claimedIdentity',
    step: 2,
    layer: 'contact',
    layerLabel: 'Layer 1 · Contact & Identity',
    text: 'Who does the sender or caller claim to be?',
    helpText: 'Impersonating a trusted authority is the primary manipulation mechanism in most scams. This answer feeds into the complexity score and never-event rule checks.',
    type: 'single',
    options: [
      {
        value: 'bank',
        label: 'Bank / financial institution',
        riskColor: 'yellow',
        explanation: 'Banks are among the most commonly impersonated entities. Key rule: your bank will NEVER ask you to share your full password, MFA code, or approve a push notification for a login you did not initiate. This is a caution signal — risk depends heavily on what they are asking you to do.',
      },
      {
        value: 'irs',
        label: 'IRS / government agency (IRS, SSA, Medicare, etc.)',
        riskColor: 'red',
        explanation: 'Government agency impersonation is one of the most reported scam types. The IRS, SSA, and Medicare have explicit rules they NEVER break: they do not demand payment via gift cards or cryptocurrency, do not threaten arrest by phone, and do not contact you via social media. Your overall risk level is based on the combination of all your answers — but if they are asking for payment or threatening you, expect a hard stop.',
      },
      {
        value: 'ssa',
        label: 'SSA / Social Security Administration',
        riskColor: 'red',
        explanation: 'Social Security Administration impersonation is among the most commonly reported government scam types targeting older adults. The SSA will NEVER threaten to suspend your Social Security number, demand immediate payment, accept gift cards or cryptocurrency, or threaten arrest by phone. If someone claims to be from the SSA and is demanding action or payment, this is a scam.',
      },
      {
        value: 'lawenforcement',
        label: 'Law enforcement (FBI, police, sheriff, etc.)',
        riskColor: 'red',
        explanation: 'Law enforcement impersonation is a high-risk signal. Real police, FBI, or sheriff departments do NOT demand payment over the phone to prevent arrest, do NOT threaten deportation or criminal charges by phone, and do NOT ask you to purchase gift cards. This answer is flagged RED at the question level. Your overall risk level shown in the header is based on your combination of answers — a single red question alone does not always trigger a hard stop, but it will if combined with pressure tactics or payment requests.',
      },
      {
        value: 'techsupport',
        label: 'Tech support / device provider (Microsoft, Apple, etc.)',
        riskColor: 'red',
        explanation: 'Tech support impersonation is a top-3 scam category by total financial loss. Key rule: Microsoft, Apple, and legitimate tech companies do NOT initiate unsolicited contact about viruses or device problems, and will NEVER request remote access following an uninvited call or pop-up. This is a high-risk signal — especially if they are asking you to install software.',
      },
      {
        value: 'utility',
        label: 'Utility company (electric, gas, internet, etc.)',
        riskColor: 'yellow',
        explanation: 'Utility impersonation is a common scam — callers threaten immediate service disconnection to force fast payment. Real utility companies send written notices before disconnection and accept payment through established channels, not gift cards or cryptocurrency. This is a caution signal.',
      },
      {
        value: 'employer',
        label: 'Employer / coworker / executive (boss, CEO, HR)',
        riskColor: 'yellow',
        explanation: 'Executive and employer impersonation is the core of Business Email Compromise (BEC) — the #1 cybercrime by total dollar loss ($2.9B in 2024, average wire: $84,059). Attackers impersonate executives or vendors to redirect payments. Key rule: always verify unusual payment requests by calling the person directly using a number you already have — not one from this message. This is a high-risk signal.',
      },
      {
        value: 'marketplace',
        label: 'Marketplace platform (Amazon, eBay, Etsy, etc.)',
        riskColor: 'yellow',
        explanation: 'Marketplace impersonation often involves fake order confirmations, refund scams, or account security alerts. Real marketplaces do not ask you to pay via gift cards, call external numbers, or install software. This is a caution signal — check what they are asking you to do.',
      },
      {
        value: 'delivery',
        label: 'Delivery / shipping platform (UPS, FedEx, USPS)',
        riskColor: 'yellow',
        explanation: 'Package delivery scam texts are among the highest-volume phishing patterns. They typically include a link to "reschedule delivery" that leads to a fake payment page. Real delivery companies do not charge fees via text message links to release packages. This is a caution signal.',
      },
      {
        value: 'friend',
        label: 'Friend / family member',
        riskColor: 'yellow',
        explanation: 'Friend or family impersonation (sometimes called the "grandparent scam") involves attackers posing as someone you know who is in trouble. Always verify by calling the person directly on a number you already have — not any number provided in this message. This is a caution signal.',
      },
      {
        value: 'romance',
        label: 'Romantic interest / online individual you met recently',
        riskColor: 'red',
        explanation: 'Romance and confidence scams are among the highest-loss categories per victim ($1.3B in 2024). Scammers build emotional trust over weeks or months before manufacturing a crisis that requires financial help. Key rule: never send money, crypto, or gift cards to someone you have only met online, regardless of how long you have communicated. This is a high-risk signal.',
      },
      {
        value: 'crypto',
        label: 'Crypto / investment advisor (unsolicited)',
        riskColor: 'red',
        explanation: 'Unsolicited investment and crypto contacts represent the #1 loss category by total dollars ($6.6B in 2024). "Pig butchering" scams build trust slowly before directing victims to fraudulent investment platforms. All gains are fake until you try to withdraw — at which point you are asked to pay more fees. This is a high-risk signal.',
      },
      {
        value: 'other',
        label: 'Other / unclear',
        riskColor: 'yellow',
        explanation: 'An unclear or unidentifiable sender is itself a caution signal. Legitimate organizations identify themselves clearly. Continue answering to assess what they are asking and how they are behaving.',
      },
    ],
  },

  {
    id: 'initiatedContact',
    step: 3,
    layer: 'contact',
    layerLabel: 'Layer 1 · Contact & Identity',
    text: 'Did YOU initiate this contact?',
    helpText: 'Whether you reached out first is one of the most important signals in the framework. The vast majority of scams begin with unsolicited contact.',
    type: 'single',
    options: [
      {
        value: 'yes',
        label: 'Yes — I reached out first (I called their number, visited their website, etc.)',
        riskColor: 'green',
        explanation: 'You initiated contact — this is a positive signal. Scams almost always begin with the attacker reaching out. However, still verify that you reached the correct entity: scammers can intercept searches, register look-alike domain names, or spoof phone numbers even for outgoing calls.',
      },
      {
        value: 'no',
        label: 'No — they contacted me unexpectedly',
        riskColor: 'red',
        explanation: 'You did NOT initiate this contact — this is a significant risk signal. The vast majority of scams begin with unsolicited outreach. An unexpected contact claiming to require urgent action should be treated with heightened suspicion throughout. This does not automatically mean it is a scam, but your other answers will determine the risk level.',
      },
    ],
  },

  {
    id: 'relationshipValidity',
    step: 4,
    layer: 'contact',
    layerLabel: 'Layer 1 · Contact & Identity',
    text: 'Do you have a real, pre-existing relationship with this entity?',
    helpText: 'For example: you actually have an account at this bank, you actually ordered from this company, or you actually know this person in real life.',
    type: 'single',
    options: [
      {
        value: 'yes',
        label: 'Yes — I have a real, existing relationship with them',
        riskColor: 'green',
        explanation: 'You have a real relationship — this is a positive signal. However, scammers can impersonate entities you have real accounts with, and they may use real account details obtained from data breaches to appear credible. A real relationship does not confirm this specific contact is legitimate.',
      },
      {
        value: 'no',
        label: 'No — I have no relationship with this entity',
        riskColor: 'red',
        explanation: 'No pre-existing relationship — this is a high-risk signal. If you do not have an account with this bank, a package from this company, or a prior connection with this person, there is no legitimate reason for them to contact you with an urgent request. This answer increases overall risk.',
      },
      {
        value: 'unsure',
        label: 'Not sure / I cannot confirm right now',
        riskColor: 'yellow',
        explanation: 'Uncertainty about the relationship is itself a caution signal. If you cannot quickly confirm whether you have a real account or relationship with this entity, pause before proceeding. A 2-minute search can often resolve this.',
      },
    ],
  },

  // ─── LAYER 2: Lure Mechanics ─────────────────────────────────────────────
  {
    id: 'personalization',
    step: 5,
    layer: 'lure',
    layerLabel: 'Layer 2 · Pressure & Tactics',
    text: 'How much personal or account-specific information did they reference?',
    helpText: 'Attackers often use data from prior breaches to appear more legitimate. More personalization does not mean the contact is real — it means the attacker is better prepared.',
    type: 'single',
    options: [
      {
        value: 'none',
        label: 'No personalization — generic message with no personal details',
        riskColor: 'green',
        explanation: 'No personalization — this is consistent with a mass phishing campaign rather than a targeted attack. Lower sophistication, but still not necessarily safe. Generic scams succeed at high volume even without personalization.',
      },
      {
        value: 'basic',
        label: 'Basic info only (my name, general location)',
        riskColor: 'yellow',
        explanation: 'Basic personal details (name, location) are widely available through public records, social media, and data breaches. This level of personalization does not confirm the contact is legitimate — it only means the attacker had access to minimal data. This is a caution signal.',
      },
      {
        value: 'account',
        label: 'Account / order / activity details (specific account #, recent order, transaction)',
        riskColor: 'yellow',
        explanation: 'Specific account or order details increase perceived credibility and are designed to lower your guard. Scammers obtain this information from data breaches, dark web markets, and compromised vendor systems. Real account details in a scam message do not mean the contact is from your actual institution. This is a caution signal.',
      },
      {
        value: 'context',
        label: 'Detailed context that matches my current life or work situation closely',
        riskColor: 'yellow',
        explanation: 'Highly contextual personalization is the most sophisticated form. Scammers who know your current circumstances may have obtained this through social media monitoring, prior breaches, or extended surveillance. This level of personalization is deliberately designed to make you trust the contact. It does not confirm legitimacy — it confirms a prepared attacker.',
      },
    ],
  },

  {
    id: 'pressureSignals',
    step: 6,
    layer: 'lure',
    layerLabel: 'Layer 2 · Pressure & Tactics',
    text: 'Which pressure or urgency tactics are present?',
    helpText: 'Select ALL that apply. These signals are designed to bypass verification and force action. Each one you select is a structural risk factor.',
    type: 'multi',
    options: [
      {
        value: 'urgency',
        label: 'Strong urgency / "act now" / "you have 24 hours" language',
        riskColor: 'yellow',
        explanation: 'Urgency is the primary driver of irreversible action in scams. Artificial time pressure reduces verification behavior and bypasses rational decision-making. If you feel you do not have time to verify, that is exactly what the attacker wants. Legitimate contacts can wait.',
      },
      {
        value: 'legalThreat',
        label: 'Legal threat (arrest, lawsuit, deportation, fines, warrant)',
        riskColor: 'red',
        explanation: 'Legal threats are a hard-stop signal. No government agency, court, or legitimate company threatens immediate arrest, prosecution, or deportation via phone, text, or email. This tactic exploits fear to override rational judgment and is one of the clearest indicators of a scam. This alone will trigger an elevated risk level.',
      },
      {
        value: 'accountSuspension',
        label: 'Account suspension / lock threat',
        riskColor: 'yellow',
        explanation: 'Account suspension threats are designed to trigger panic. Scammers know that the fear of losing access to a bank account or platform will push you to act without verifying. If your account were truly at risk, the institution would still allow you to call their official number to resolve it.',
      },
      {
        value: 'financialLoss',
        label: 'Financial loss threat (you owe money, your account is compromised)',
        riskColor: 'yellow',
        explanation: 'Financial loss threats create urgency and fear. Whether it is "your account has been compromised" or "you owe back taxes," these claims are designed to make you act before you can think clearly or verify. Legitimate institutions give you time to respond through official channels.',
      },
      {
        value: 'stayOnLine',
        label: '"Stay on the line" — told not to hang up while they "work on it"',
        riskColor: 'red',
        explanation: '"Stay on the line" is a control tactic. It prevents you from hanging up, calling the institution independently, or consulting anyone else. Legitimate contacts do not require you to remain continuously connected. The moment you are told not to hang up, hang up.',
      },
      {
        value: 'doNotTell',
        label: '"Do not tell anyone" — secrecy instruction',
        riskColor: 'red',
        explanation: '"Do not tell anyone" is one of the clearest scam indicators. Legitimate institutions never require secrecy. This instruction is specifically designed to prevent you from consulting a trusted friend, family member, or your actual bank — people who would immediately tell you this is a scam. If you have been told to keep this secret, tell someone now.',
      },
      {
        value: 'doNotVerify',
        label: '"Do not call / check elsewhere" — blocking verification',
        riskColor: 'red',
        explanation: 'Blocking verification is the clearest sign that a contact cannot withstand scrutiny. Any legitimate institution — your bank, the IRS, any company — will always allow and encourage you to verify through official channels. If you are being told not to, it is because verification would expose the scam.',
      },
      {
        value: 'none',
        label: 'None of the above — no unusual pressure tactics',
        riskColor: 'green',
        explanation: 'No pressure signals detected — this is a positive signal at this layer. The absence of urgency, threats, and isolation tactics is consistent with legitimate contact. Continue to assess what action is being requested.',
      },
    ],
  },

  {
    id: 'escalation',
    step: 7,
    layer: 'lure',
    layerLabel: 'Layer 2 · Pressure & Tactics',
    text: 'Has the interaction escalated or become more complex?',
    helpText: 'Select ALL that apply. Multi-step and multi-channel escalation is a key structural risk factor — people tend to evaluate each step in isolation and miss the cumulative pattern.',
    type: 'multi',
    options: [
      {
        value: 'multiStep',
        label: 'Multiple steps / decisions have already occurred in this interaction',
        riskColor: 'yellow',
        explanation: 'Multi-step interactions are a complexity factor (+1 to complexity score). Each step in isolation may seem reasonable, but humans are poor at recognizing cumulative escalation. Scams are designed to be progressive — each step normalizes the next. Evaluating the full sequence, not just the current step, is what this framework is designed to help you do.',
      },
      {
        value: 'channelSwitch',
        label: 'Moved to another channel (e.g., email → phone, SMS → WhatsApp, pop-up → phone)',
        riskColor: 'yellow',
        explanation: 'Channel switching is a significant structural complexity factor (+1 to complexity score). Scammers move between channels to exploit different trust mechanisms, bypass technical filters, and create confusion about the source of the contact. Moving from email or text to a phone call is especially common in hybrid phishing attacks — it adds human voice interaction, which dramatically increases compliance.',
      },
      {
        value: 'thirdParty',
        label: 'Asked to contact a third party, a specific number, or a specific website they provided',
        riskColor: 'yellow',
        explanation: 'Being directed to a third party or a number/website they provided means you are surrendering control of who you speak to next. The third party could be the same scammer in a different role, a call center operated by the scam network, or a fake website. Always find contact information independently.',
      },
      {
        value: 'none',
        label: 'No escalation — this is the first contact, nothing unusual yet',
        riskColor: 'green',
        explanation: 'No escalation detected — this is the first contact with no unusual complexity at the structural level. Lower complexity is a positive signal, but the interaction is still being assessed. Continue to the action layer.',
      },
    ],
  },

  // ─── LAYER 3: Irreversible Actions ───────────────────────────────────────
  {
    id: 'requestedAction',
    step: 8,
    layer: 'action',
    layerLabel: 'Layer 3 · Requested Actions',
    text: 'What is this contact asking you to do?',
    helpText: 'Check everything they are asking for — select all that apply. Actions toward the bottom of this list represent irreversible harm boundaries: once taken, they cannot be undone.',
    type: 'multi',
    options: [
      {
        value: 'nothing',
        label: 'Nothing sensitive yet — just reading / listening',
        riskColor: 'green',
        explanation: 'No action has been requested yet — this is the lowest-risk state at this layer. The interaction is still in an early stage. Your overall risk is determined by the other answers you have provided.',
      },
      {
        value: 'clickLink',
        label: 'Click a link in the message',
        riskColor: 'yellow',
        explanation: 'Link clicks are the primary delivery mechanism for credential theft and malware. Even if the link appears legitimate, URLs can be spoofed, misspelled, or redirected. Always go directly to the official website by typing the address yourself rather than clicking a link in an unsolicited message.',
      },
      {
        value: 'openAttachment',
        label: 'Open an attachment / download a file',
        riskColor: 'yellow',
        explanation: 'Attachments from unsolicited contacts are a common malware delivery method. Even files that appear to be PDFs, Word documents, or invoices can execute malicious code when opened. Do not open attachments from contacts you did not expect.',
      },
      {
        value: 'callNumber',
        label: 'Call an alternate phone number they provided',
        riskColor: 'yellow',
        explanation: 'Calling a number they provided means you are calling the attacker, not the institution. Scammers provide phone numbers that route directly to their operation while appearing to be a bank, government agency, or tech company. Always find the official phone number yourself — on the back of your card, on the official website, or in a prior statement.',
      },
      {
        value: 'enterPassword',
        label: 'Enter my password or log in to something via a link they sent',
        riskColor: 'red',
        explanation: 'This is an irreversible boundary. Entering your credentials via a link they sent is a credential phishing attack — the login page is fake and captures everything you type. Once credentials are captured, account takeover can occur immediately. Do NOT log in via any link from an unsolicited message. Go directly to the official website instead.',
      },
      {
        value: 'resetPassword',
        label: 'Reset my password (they are initiating it)',
        riskColor: 'red',
        explanation: 'A password reset initiated by someone else while they are on the line with you is a real-time account takeover technique. They already have your username and are using the reset process to gain access. Do NOT follow password reset instructions from someone who contacted you first.',
      },
      {
        value: 'approveMFA',
        label: 'Approve an MFA push notification on my device',
        riskColor: 'red',
        explanation: 'This triggers a hard-stop never event. Approving an MFA push you did not initiate grants immediate account access to the attacker — no password required. If you are on a call and your phone suddenly receives an MFA notification, the person on the line has your password and is completing the account takeover in real time. Do NOT approve it. Hang up and contact your institution directly.',
      },
      {
        value: 'shareMFA',
        label: 'Share my MFA / one-time verification code with them verbally or via text',
        riskColor: 'red',
        explanation: 'This triggers a hard-stop never event. Sharing a verification code is equivalent to handing over your account. Legitimate services that issue codes never need to ask you to read one back — the code is proof that you are the account holder. If someone is asking you to read your code to them, they are not the institution.',
      },
      {
        value: 'transferMoney',
        label: 'Transfer money (wire, Zelle, Venmo, bank transfer, etc.)',
        riskColor: 'red',
        explanation: 'This is an irreversible harm boundary. Wire transfers, Zelle, Venmo, and bank transfers cannot be recalled once processed. This is the primary financial loss mechanism in Business Email Compromise, romance scams, and government impersonation scams. No legitimate entity requires you to transfer money as a security measure, to receive a refund, or to avoid arrest.',
      },
      {
        value: 'giftCards',
        label: 'Buy gift cards and share the codes with them',
        riskColor: 'red',
        explanation: 'Gift card payment is a definitive scam indicator — it is the subject of explicit "never event" rules from the IRS, SSA, FTC, and virtually every legitimate institution. No government agency, bank, tech company, or legitimate business will ever request payment via gift cards. Gift cards are untraceable and non-recoverable. This is a hard stop.',
      },
      {
        value: 'sendCrypto',
        label: 'Send cryptocurrency to an address they provided',
        riskColor: 'red',
        explanation: 'Cryptocurrency transfers are irreversible, anonymous, and non-recoverable. Crypto is now the #1 payment method in scams by total dollar loss ($9.3B in 2024 — a 66% increase year over year). Once sent, it cannot be reversed or traced. No government agency or legitimate business requires crypto payment to resolve an issue.',
      },
      {
        value: 'installSoftware',
        label: 'Install software / allow remote access / share my screen',
        riskColor: 'red',
        explanation: 'Installing remote access software gives the attacker full control of your device — everything visible on your screen, all saved passwords, your banking apps, and your files. This is the irreversible boundary in tech support scams. Scammers use this access to drain accounts and steal credentials while keeping you distracted on the phone. Do NOT install anything or share your screen.',
      },
      {
        value: 'shareSSN',
        label: 'Share my SSN / bank account info / sensitive identity documents',
        riskColor: 'red',
        explanation: 'Sharing your Social Security Number, bank account numbers, or identity documents enables identity theft and financial fraud. Once disclosed, this information is extremely difficult to protect. Legitimate organizations that already have your SSN or account details on file will never need to ask you to provide them again over the phone.',
      },
    ],
  },

  {
    id: 'verificationState',
    step: 9,
    layer: 'action',
    layerLabel: 'Layer 3 · Requested Actions',
    text: 'Can you independently verify this contact right now?',
    helpText: 'For example: hang up and call the official number yourself, check the official website, or look up the company directly — without using any links or numbers from this message.',
    type: 'single',
    options: [
      {
        value: 'canVerify',
        label: 'Yes — I can verify through an official channel (official website, known number, official app)',
        riskColor: 'green',
        explanation: 'You can verify independently — this is a strong positive signal. The ability to hang up and call back using an official number you found yourself is one of the most effective defenses against social engineering. If the contact is legitimate, your institution will confirm it. If it is a scam, you will find out before taking any irreversible action.',
      },
      {
        value: 'blocked',
        label: 'No — they told me not to hang up, not to contact others, or I cannot verify easily',
        riskColor: 'red',
        explanation: 'Verification is blocked — this is a hard-stop signal. Any contact that discourages or prevents you from independently verifying cannot withstand scrutiny. Legitimate institutions always allow you to hang up and call back. The fact that you are being told not to verify is itself the strongest evidence that this contact is fraudulent.',
      },
      {
        value: 'notSure',
        label: 'Not sure / I have not tried',
        riskColor: 'yellow',
        explanation: 'Verification status unclear — always attempt to verify before acting, especially before taking any irreversible action. Even a 2-minute search for the official phone number is enough to disrupt most social engineering attacks. Hang up, find the official contact yourself, and call back.',
      },
    ],
  },
];

/**
 * PATH_STEPS defines the three layers shown in the Path Tracker sidebar.
 */
export const PATH_STEPS = [
  {
    id: 'contact',
    label: 'Contact & Identity',
    layer: 'Layer 1',
    icon: '📡',
    questions: ['contactModality', 'claimedIdentity', 'initiatedContact', 'relationshipValidity'],
  },
  {
    id: 'lure',
    label: 'Pressure & Tactics',
    layer: 'Layer 2',
    icon: '⚠️',
    questions: ['personalization', 'pressureSignals', 'escalation'],
  },
  {
    id: 'action',
    label: 'Requested Actions',
    layer: 'Layer 3',
    icon: '🚨',
    questions: ['requestedAction', 'verificationState'],
  },
];
