export const QUESTIONS = [
  // ─── LAYER 1: Contact & Identity ─────────────────────────────────────────
  {
    id: 'contactModality',
    step: 1,
    layer: 'contact',
    layerLabel: 'Layer 1 · Contact & Identity',
    text: 'How did this contact reach you?',
    helpText: 'Select the channel used. The contact method is the first structural signal: some channels are more strongly associated with specific scam archetypes than others.',
    type: 'single',
    options: [
      {
        value: 'sms',
        label: 'SMS / Text Message',
        riskColor: 'yellow',
        explanation: 'SMS is one of the fastest-growing scam contact channels. Attackers use texts because they trigger urgent device notifications and bypass email spam filters. Strongly associated with package delivery scams, fake bank fraud alerts, and MFA fatigue attacks.',
      },
      {
        value: 'phone',
        label: 'Phone Call',
        riskColor: 'yellow',
        explanation: 'Incoming phone calls are associated with the highest median financial loss per victim of any contact method. Live voice interaction enables real-time psychological manipulation and prevents you from pausing to verify.',
      },
      {
        value: 'email',
        label: 'Email',
        riskColor: 'yellow',
        explanation: 'Email is the highest-volume phishing vector by complaint count. Sender addresses and brand logos are easy to spoof. Often the opening step before escalating to a phone call.',
      },
      {
        value: 'social',
        label: 'Social Media / Messaging Platform (WhatsApp, Instagram, Facebook, etc.)',
        riskColor: 'yellow',
        explanation: 'Social media and messaging apps are rapidly growing phishing channels. They exploit existing trust networks and platform familiarity. Government agencies and financial institutions never initiate contact via social media.',
      },
      {
        value: 'popup',
        label: 'Browser Pop-Up / System Alert',
        riskColor: 'red',
        explanation: 'Screen pop-ups are the signature entry point for tech support scams. Legitimate operating systems and antivirus software do NOT display pop-ups with phone numbers to call. If you see a pop-up telling you to call a number, do not call it.',
      },
      {
        value: 'inapp',
        label: 'In-App Notification',
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
    helpText: 'Select the entity being impersonated. Each institution has published explicit "never event" rules — actions they will never take. This answer feeds directly into institutional rule checks.',
    type: 'single',
    optionGroups: [
      {
        label: 'Government Agencies',
        options: [
          {
            value: 'ssa',
            label: 'Social Security Administration (SSA)',
            riskColor: 'red',
            explanation: 'SSA impersonation is among the most reported government scam types. The SSA will NEVER threaten to suspend your Social Security number, demand payment via gift cards or cryptocurrency, threaten arrest, contact you via social media, or request personal info by text or email.',
          },
          {
            value: 'irs',
            label: 'IRS (Internal Revenue Service)',
            riskColor: 'red',
            explanation: 'The IRS will NEVER demand payment via gift cards or cryptocurrency, threaten immediate arrest, reach out via social media, or initiate contact by text or email to request personal information. All IRS communication begins via U.S. mail.',
          },
          {
            value: 'lawenforcement',
            label: 'FBI / Law Enforcement (FBI, police, sheriff, etc.)',
            riskColor: 'red',
            explanation: 'Real law enforcement will NEVER call you to demand payment to avoid arrest, accept gift cards or cryptocurrency as payment, or resolve legal issues over the phone. Any such contact is a law enforcement impersonation scam.',
          },
          {
            value: 'govother',
            label: 'Other government agency (Medicare, USDA, DHS, etc.)',
            riskColor: 'red',
            explanation: 'Government agencies at all levels communicate through official mail and verified websites. No government agency will call or text you to demand immediate payment, personal information, or gift cards.',
          },
        ],
      },
      {
        label: 'Utility Company',
        options: [
          {
            value: 'utility',
            label: 'Utility company (electric, gas, water, internet, etc.)',
            riskColor: 'yellow',
            explanation: 'Utility impersonation is a common scam: callers threaten immediate service disconnection to force fast payment. Real utility companies provide written notice before disconnection and never accept gift cards, cryptocurrency, or Bitcoin ATM payments.',
          },
        ],
      },
      {
        label: 'Tech Companies',
        options: [
          {
            value: 'apple',
            label: 'Apple',
            riskColor: 'red',
            explanation: 'Apple will NEVER make unsolicited support calls, ask for your Apple ID password or verification codes, request gift card or wire transfer payment, direct you to a non-apple.com website, or ask you to install remote desktop software during unsolicited contact.',
          },
          {
            value: 'google',
            label: 'Google',
            riskColor: 'red',
            explanation: 'Google will NEVER call you to verify your account or ask for your password or MFA code over the phone, initiate unsolicited calls about account security, threaten account deletion unless you pay, demand immediate payment, or use generic greetings in security alerts.',
          },
          {
            value: 'microsoft',
            label: 'Microsoft',
            riskColor: 'red',
            explanation: 'Microsoft will NEVER make unsolicited tech support calls or send unsolicited emails requesting personal info, include phone numbers in error messages, ask for cryptocurrency or gift card payment, or ask for your password via unsolicited contact. Pop-ups with Microsoft phone numbers are always scams.',
          },
          {
            value: 'techother',
            label: 'Other tech company (Meta, Zoom, Netflix, etc.)',
            riskColor: 'red',
            explanation: 'Tech companies do not make unsolicited calls about account issues, request gift card payment, ask for your password over the phone, or send pop-ups with support numbers to call. Any such contact is an impersonation scam.',
          },
        ],
      },
      {
        label: 'Delivery Companies',
        options: [
          {
            value: 'usps',
            label: 'USPS (United States Postal Service)',
            riskColor: 'yellow',
            explanation: 'USPS will NEVER send unsolicited texts or emails about packages without prior opt-in, include clickable links in messages, request money or fees via text or email, or ask for your SSN or passwords by SMS. Official USPS emails come from @usps.gov only.',
          },
          {
            value: 'fedex',
            label: 'FedEx',
            riskColor: 'yellow',
            explanation: 'FedEx will NEVER send unsolicited texts or emails requesting payment or personal info for packages in transit, request verification codes via phone or SMS, ask for wire transfers or gift cards for delivery, or connect you to "law enforcement" about a shipment.',
          },
          {
            value: 'ups',
            label: 'UPS (United Parcel Service)',
            riskColor: 'yellow',
            explanation: 'UPS will NEVER ask for payment, personal info, or passwords in an unsolicited manner, require gift cards or wire transfers for delivery, or send texts from numbers other than 75137. Any UPS text from another number is a scam.',
          },
          {
            value: 'deliveryother',
            label: 'Other delivery / shipping company (DHL, OnTrac, etc.)',
            riskColor: 'yellow',
            explanation: 'No legitimate delivery company sends unsolicited texts or emails requesting payment before delivery, or asks for personal financial information. Verify any delivery request directly on the carrier\'s official website.',
          },
        ],
      },
      {
        label: 'Marketplace',
        options: [
          {
            value: 'amazon',
            label: 'Amazon',
            riskColor: 'yellow',
            explanation: 'Amazon will NEVER ask for your password or OTP over the phone, request payment outside its official website or app, ask you to purchase gift cards, request remote desktop software installation, or send text messages about product recalls.',
          },
          {
            value: 'walmart',
            label: 'Walmart',
            riskColor: 'yellow',
            explanation: 'Walmart will NEVER ask for SSNs, account numbers, or PINs during unsolicited calls, ask you to pay bills using Walmart Gift Cards, accept cryptocurrency, or pressure you to act impulsively to resolve a mistaken charge.',
          },
          {
            value: 'marketplaceother',
            label: 'Other online marketplace / retailer (eBay, Target, etc.)',
            riskColor: 'yellow',
            explanation: 'No legitimate online retailer requests gift card payment, demands immediate action via unsolicited call or text, or asks you to install software to resolve an order issue. Verify any concern directly on the retailer\'s official website.',
          },
        ],
      },
      {
        label: 'Banks',
        options: [
          {
            value: 'banks',
            label: 'Bank / Financial Institution',
            riskColor: 'yellow',
            explanation: 'Your bank will NEVER ask for your OTP or MFA code, instruct you to move money to a "safe" account, ask for your full PIN or online banking password via unsolicited contact, or ask you to install remote access software to investigate fraud.',
          },
          {
            value: 'bankother',
            label: 'Other financial service (credit union, PayPal, Venmo, Zelle, etc.)',
            riskColor: 'yellow',
            explanation: 'No legitimate financial service asks you to transfer money to a "safe" account, approve MFA you did not initiate, share your PIN or password, or purchase gift cards as payment. Verify directly through the official app or website.',
          },
        ],
      },
      {
        label: 'Other',
        options: [
          {
            value: 'employer',
            label: 'Employer / coworker / executive (boss, CEO, HR)',
            riskColor: 'yellow',
            explanation: 'Executive and employer impersonation is the core of Business Email Compromise (BEC): the #1 cybercrime by total dollar loss. Attackers impersonate executives or vendors to redirect payments. Always verify unusual payment requests by calling the person directly using a number you already have.',
          },
          {
            value: 'friend',
            label: 'Friend / family member',
            riskColor: 'yellow',
            explanation: 'Friend or family impersonation involves attackers posing as someone you know who is in trouble. Always verify by calling the person directly on a number you already have, not any number provided in this message.',
          },
          {
            value: 'romance',
            label: 'Romantic interest / online individual you met recently',
            riskColor: 'red',
            explanation: 'Romance and confidence scams are among the highest-loss categories per victim. Scammers build emotional trust over weeks before manufacturing a crisis requiring financial help. Never send money, crypto, or gift cards to someone you have only met online.',
          },
          {
            value: 'crypto',
            label: 'Crypto / investment advisor (unsolicited)',
            riskColor: 'red',
            explanation: 'Unsolicited investment and crypto contacts represent the #1 loss category by total dollars. "Pig butchering" scams build trust slowly before directing victims to fraudulent investment platforms. All gains are fake until you try to withdraw.',
          },
          {
            value: 'other',
            label: 'Other / unclear',
            riskColor: 'yellow',
            explanation: 'An unclear or unidentifiable sender is itself a caution signal. Legitimate organizations identify themselves clearly. Continue answering to assess what they are asking and how they are behaving.',
          },
        ],
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
        label: 'Yes, I reached out first (I called their number, visited their website, etc.)',
        riskColor: 'green',
        explanation: 'You initiated contact: this is a positive signal. Scams almost always begin with the attacker reaching out. However, still verify that you reached the correct entity: scammers can intercept searches, register look-alike domains, or spoof phone numbers even for outgoing calls.',
      },
      {
        value: 'no',
        label: 'No, they contacted me unexpectedly',
        riskColor: 'red',
        explanation: 'You did NOT initiate this contact: this is a significant risk signal. The vast majority of scams begin with unsolicited outreach. An unexpected contact claiming to require urgent action should be treated with heightened suspicion throughout.',
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
        label: 'Yes, I have a real, existing relationship with them',
        riskColor: 'green',
        explanation: 'You have a real relationship: this is a positive signal. However, scammers can impersonate entities you have real accounts with, using real account details from data breaches to appear credible. A real relationship does not confirm this specific contact is legitimate.',
      },
      {
        value: 'no',
        label: 'No, I have no relationship with this entity',
        riskColor: 'red',
        explanation: 'No pre-existing relationship: this is a high-risk signal. If you do not have an account with this bank, a package from this company, or a prior connection with this person, there is no legitimate reason for them to contact you with an urgent request.',
      },
      {
        value: 'unsure',
        label: 'Not sure / I cannot confirm right now',
        riskColor: 'yellow',
        explanation: 'Uncertainty about the relationship is itself a caution signal. If you cannot quickly confirm whether you have a real account or relationship with this entity, pause before proceeding. A 2-minute search can often resolve this.',
      },
    ],
  },

  // ─── LAYER 2: Pressure & Tactics ─────────────────────────────────────────
  {
    id: 'personalization',
    step: 5,
    layer: 'lure',
    layerLabel: 'Layer 2 · Pressure & Tactics',
    text: 'How much personal or account-specific information did they reference?',
    helpText: 'Attackers often use data from prior breaches to appear more legitimate. More personalization does not mean the contact is real: it means the attacker is better prepared.',
    type: 'single',
    options: [
      {
        value: 'none',
        label: 'None: generic message with no personal details',
        riskColor: 'green',
        explanation: 'No personalization is consistent with a mass phishing campaign rather than a targeted attack. Lower sophistication, but still not necessarily safe. Generic scams succeed at high volume even without personalization.',
      },
      {
        value: 'basic',
        label: 'Basic: includes my name, email, or phone number',
        riskColor: 'yellow',
        explanation: 'Basic personal details are widely available through public records, social media, and data breaches. This level of personalization does not confirm the contact is legitimate.',
      },
      {
        value: 'account',
        label: 'Account-specific: includes account number, transaction reference, or login-related info',
        riskColor: 'yellow',
        explanation: 'Specific account or order details increase perceived credibility. Scammers obtain this from data breaches and dark web markets. Real account details in a scam message do not mean the contact is from your actual institution.',
      },
      {
        value: 'context',
        label: 'Contextual: detailed context matching my current life or work situation',
        riskColor: 'yellow',
        explanation: 'Highly contextual personalization is the most sophisticated form. Scammers who know your current circumstances may have obtained this through social media monitoring or prior breaches. This level of personalization is deliberately designed to make you trust the contact.',
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
        label: 'Urgency / time constraint ("act now," "you have 24 hours")',
        riskColor: 'yellow',
        explanation: 'Urgency is the primary driver of irreversible action in scams. Artificial time pressure reduces verification behavior and bypasses rational decision-making. If you feel you do not have time to verify, that is exactly what the attacker wants.',
      },
      {
        value: 'legalThreat',
        label: 'Legal threat / arrest threat (arrest, lawsuit, deportation, fines, warrant)',
        riskColor: 'red',
        explanation: 'Legal threats are a hard-stop signal. No government agency, court, or legitimate company threatens immediate arrest or prosecution via phone, text, or email. This tactic exploits fear to override rational judgment.',
      },
      {
        value: 'accountSuspension',
        label: 'Account suspension / service disruption threat',
        riskColor: 'yellow',
        explanation: 'Account suspension threats are designed to trigger panic. Scammers know that fear of losing access to a bank account or platform will push you to act without verifying. Legitimate institutions still allow you to call their official number to resolve it.',
      },
      {
        value: 'financialLoss',
        label: 'Financial loss warning (you owe money, your account is compromised)',
        riskColor: 'yellow',
        explanation: 'Financial loss threats create urgency and fear. Whether "your account has been compromised" or "you owe back taxes," these claims are designed to make you act before you can think clearly or verify.',
      },
      {
        value: 'stayOnLine',
        label: 'Instruction to stay on the line (told not to hang up while they "work on it")',
        riskColor: 'red',
        explanation: '"Stay on the line" is a control tactic. It prevents you from hanging up, calling the institution independently, or consulting anyone else. Legitimate contacts do not require you to remain continuously connected. The moment you are told not to hang up, hang up.',
      },
      {
        value: 'doNotTell',
        label: 'Instruction not to tell others (secrecy instruction)',
        riskColor: 'red',
        explanation: '"Do not tell anyone" is one of the clearest scam indicators. Legitimate institutions never require secrecy. This instruction is specifically designed to prevent you from consulting a trusted friend, family member, or your actual bank.',
      },
      {
        value: 'doNotVerify',
        label: 'Instruction not to verify independently ("do not call elsewhere")',
        riskColor: 'red',
        explanation: 'Blocking verification is the clearest sign that a contact cannot withstand scrutiny. Any legitimate institution will always allow and encourage you to verify through official channels. If you are being told not to, it is because verification would expose the scam.',
      },
      {
        value: 'none',
        label: 'None of the above: no unusual pressure tactics',
        riskColor: 'green',
        explanation: 'No pressure signals detected: this is a positive signal at this layer. The absence of urgency, threats, and isolation tactics is consistent with legitimate contact.',
      },
    ],
  },

  {
    id: 'escalation',
    step: 7,
    layer: 'lure',
    layerLabel: 'Layer 2 · Pressure & Tactics',
    text: 'Has the interaction escalated or become more complex?',
    helpText: 'Select ALL that apply. Multi-step and multi-channel escalation is a key structural risk factor.',
    type: 'multi',
    options: [
      {
        value: 'multiStep',
        label: 'Multi-step interaction: multiple steps or decisions have already occurred',
        riskColor: 'yellow',
        explanation: 'Multi-step interactions are a complexity factor. Each step in isolation may seem reasonable, but humans are poor at recognizing cumulative escalation. Scams are designed to be progressive: each step normalizes the next.',
      },
      {
        value: 'channelSwitch',
        label: 'Channel switch (e.g., email to phone, SMS to WhatsApp, pop-up to phone)',
        riskColor: 'yellow',
        explanation: 'Channel switching is a significant complexity factor. Scammers move between channels to exploit different trust mechanisms and bypass technical filters. Moving from text or email to a phone call adds live human voice interaction, which dramatically increases compliance.',
      },
      {
        value: 'thirdParty',
        label: 'Third-party redirect: asked to contact a specific number, person, or website they provided',
        riskColor: 'yellow',
        explanation: 'Being directed to a third party or a number/website they provided means you are surrendering control of who you speak to next. The third party could be the same scammer in a different role. Always find contact information independently.',
      },
      {
        value: 'none',
        label: 'None: this is the first contact, nothing unusual yet',
        riskColor: 'green',
        explanation: 'No escalation detected: this is the first contact with no unusual complexity. Lower complexity is a positive signal, but the interaction is still being assessed.',
      },
    ],
  },

  // ─── LAYER 3: Requested Actions ──────────────────────────────────────────
  {
    id: 'requestedAction',
    step: 8,
    layer: 'action',
    layerLabel: 'Layer 3 · Requested Actions',
    text: 'What is this contact asking you to do?',
    helpText: 'Check everything they are asking for: select all that apply. Actions further down this list represent irreversible harm boundaries — once taken, they cannot be undone.',
    type: 'multi',
    optionGroups: [
      {
        label: 'No Action',
        options: [
          {
            value: 'nothing',
            label: 'Nothing sensitive yet, just reading / listening',
            riskColor: 'green',
            explanation: 'No action has been requested yet: this is the lowest-risk state at this layer. Your overall risk is determined by the other answers you have provided.',
          },
        ],
      },
      {
        label: 'Interaction / Engagement',
        options: [
          {
            value: 'clickLink',
            label: 'Click a link in the message',
            riskColor: 'yellow',
            explanation: 'Link clicks are the primary delivery mechanism for credential theft and malware. Even if the link appears legitimate, URLs can be spoofed, misspelled, or redirected. Always go directly to the official website by typing the address yourself.',
          },
          {
            value: 'openAttachment',
            label: 'Open an attachment / download a file',
            riskColor: 'yellow',
            explanation: 'Attachments from unsolicited contacts are a common malware delivery method. Even files that appear to be PDFs or Word documents can execute malicious code when opened.',
          },
          {
            value: 'callNumber',
            label: 'Call an alternate phone number they provided',
            riskColor: 'yellow',
            explanation: 'Calling a number they provided means you are calling the attacker, not the institution. Scammers provide phone numbers that route directly to their operation. Always find the official phone number yourself from the institution\'s actual website.',
          },
        ],
      },
      {
        label: 'Credential / Authentication Actions (Irreversible)',
        options: [
          {
            value: 'enterPassword',
            label: 'Enter my password or log in via a link they sent',
            riskColor: 'red',
            explanation: 'This is an irreversible boundary. Entering your credentials via a link they sent is a credential phishing attack: the login page is fake and captures everything you type. Do NOT log in via any link from an unsolicited message.',
          },
          {
            value: 'resetPassword',
            label: 'Reset my password (they are initiating it)',
            riskColor: 'red',
            explanation: 'A password reset initiated by someone else while they are on the line with you is a real-time account takeover technique. They already have your username and are using the reset process to gain access.',
          },
          {
            value: 'approveMFA',
            label: 'Approve an MFA push notification on my device',
            riskColor: 'red',
            explanation: 'HARD STOP: Approving an MFA push you did not initiate grants immediate account access to the attacker. If you are on a call and your phone suddenly receives an MFA notification, the person on the line has your password and is completing account takeover in real time.',
          },
          {
            value: 'shareMFA',
            label: 'Share my MFA / one-time verification code verbally or via text',
            riskColor: 'red',
            explanation: 'HARD STOP: Sharing a verification code is equivalent to handing over your account. Legitimate services that issue codes never need to ask you to read one back. If someone is asking you to read your code, they are not the institution.',
          },
        ],
      },
      {
        label: 'Financial Actions (Irreversible)',
        options: [
          {
            value: 'transferMoney',
            label: 'Transfer money (wire, Zelle, Venmo, bank transfer, etc.)',
            riskColor: 'red',
            explanation: 'This is an irreversible harm boundary. Wire transfers and Zelle cannot be recalled once processed. No legitimate entity requires you to transfer money as a security measure, to receive a refund, or to avoid arrest.',
          },
          {
            value: 'giftCards',
            label: 'Buy gift cards and share the codes with them',
            riskColor: 'red',
            explanation: 'Gift card payment is a definitive scam indicator. No government agency, bank, tech company, or legitimate business will ever request payment via gift cards. The IRS, SSA, FTC, and every major institution explicitly prohibit this. Gift cards are untraceable and non-recoverable.',
          },
          {
            value: 'sendCrypto',
            label: 'Send cryptocurrency to an address they provided',
            riskColor: 'red',
            explanation: 'Cryptocurrency transfers are irreversible and non-recoverable. Crypto is the #1 payment method in scams by total dollar loss. Once sent, it cannot be reversed or traced. No government agency or legitimate business requires crypto payment to resolve an issue.',
          },
        ],
      },
      {
        label: 'Device / System Control (Irreversible)',
        options: [
          {
            value: 'installSoftware',
            label: 'Install software / allow remote access / share my screen',
            riskColor: 'red',
            explanation: 'Installing remote access software gives the attacker full control of your device: all saved passwords, your banking apps, and your files. This is the irreversible boundary in tech support scams. Scammers use this access to drain accounts while keeping you distracted on the phone.',
          },
        ],
      },
      {
        label: 'Identity / Data Disclosure (Irreversible)',
        options: [
          {
            value: 'shareSSN',
            label: 'Share my SSN, bank account info, or sensitive identity documents',
            riskColor: 'red',
            explanation: 'Sharing your Social Security Number, bank account numbers, or identity documents enables identity theft and financial fraud. Once disclosed, this information is extremely difficult to protect. Legitimate organizations that already have your SSN will never need to ask you to provide it again by phone.',
          },
        ],
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
        label: 'Yes, I can verify through an official channel (official website, known number, official app)',
        riskColor: 'green',
        explanation: 'You can verify independently: this is a strong positive signal. The ability to hang up and call back using an official number you found yourself is one of the most effective defenses against social engineering. If the contact is legitimate, your institution will confirm it.',
      },
      {
        value: 'blocked',
        label: 'No: they told me not to hang up, not to contact others, or I cannot verify easily',
        riskColor: 'red',
        explanation: 'Verification is blocked: this is a hard-stop signal. Any contact that discourages or prevents you from independently verifying cannot withstand scrutiny. Legitimate institutions always allow you to hang up and call back. Being told not to verify is itself the strongest evidence of fraud.',
      },
      {
        value: 'notSure',
        label: 'Not sure / I have not tried',
        riskColor: 'yellow',
        explanation: 'Verification status unclear: always attempt to verify before acting. Even a 2-minute search for the official phone number is enough to disrupt most social engineering attacks. Hang up, find the official contact yourself, and call back.',
      },
    ],
  },
];

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
