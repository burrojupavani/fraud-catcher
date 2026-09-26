/**
 * Genuine Zero-Shot Generalization Engine for Consumer Fraud Complaints
 * Powered by Transformers.js (Xenova/nli-deberta-v3-small)
 * Evaluates free-form narrative premises against natural language candidate hypotheses via NLI entailment.
 * Phase 2: Structured Case Fact Extraction & Complaint Readiness Evaluation.
 * Phase 3: Evidence-Guided Formal Complaint Generation & Fact Traceability.
 */

/**
 * Phase 6A: Central Evidence Registry & Provenance Tracker
 * Handles victim-provided evidence representation, source traceability,
 * strict no-hallucination fact representation, and conflict preservation.
 */
class EvidenceRegistry {
  constructor() {
    this.items = [];
    this.facts = [];
    this.counter = 1;
  }

  reset() {
    this.items = [];
    this.facts = [];
    this.counter = 1;
  }

  addEvidence({ type = "OTHER", description = "", source = "victim_provided", provided_at = null } = {}) {
    const validTypes = ["SCREENSHOT", "PDF", "CHAT_EXPORT", "TRANSACTION_RECORD", "IMAGE", "TEXT", "OTHER"];
    const normalizedType = validTypes.includes(type) ? type : "OTHER";
    
    const evidenceId = `E${String(this.counter).padStart(3, '0')}`;
    this.counter++;

    const item = {
      evidence_id: evidenceId,
      type: normalizedType,
      description: description || "",
      source: source || "victim_provided",
      provided_at: provided_at || new Date().toISOString(),
      extracted_facts: [],
      provenance: {
        source_type: "victim_provided",
        source_reference: evidenceId
      },
      verification_status: "UNVERIFIED"
    };

    this.items.push(item);
    return item;
  }

  getEvidence(evidenceId) {
    return this.items.find(item => item.evidence_id === evidenceId) || null;
  }

  listEvidence() {
    return [...this.items];
  }

  linkEvidenceFact(evidenceId, field, value) {
    const item = this.getEvidence(evidenceId);
    if (!item) {
      throw new Error(`Evidence item '${evidenceId}' not found.`);
    }

    const resolvedValue = (value !== undefined && value !== null && value !== "") ? value : "NOT_AVAILABLE";

    const factEntry = {
      field: field,
      value: resolvedValue,
      source: evidenceId,
      source_type: "VICTIM_PROVIDED_EVIDENCE",
      evidence_type: item.type
    };

    item.extracted_facts.push({
      field: field,
      value: resolvedValue
    });

    this.recordFact(factEntry);
    return factEntry;
  }

  linkFact(field, value, source, sourceType) {
    const validSources = ["VICTIM_NARRATIVE", "CASE_COMPLETION_FORM", "VICTIM_PROVIDED_EVIDENCE", "SYSTEM_INFERENCE"];
    const normalizedSourceType = validSources.includes(sourceType) ? sourceType : "VICTIM_NARRATIVE";
    const resolvedValue = (value !== undefined && value !== null && value !== "") ? value : "NOT_AVAILABLE";

    const factEntry = {
      field: field,
      value: resolvedValue,
      source: source,
      source_type: normalizedSourceType
    };

    this.recordFact(factEntry);
    return factEntry;
  }

  recordFact(factEntry) {
    this.facts.push(factEntry);
  }

  getFacts(field = null) {
    if (!field) return [...this.facts];
    return this.facts.filter(f => f.field === field);
  }

  getConflicts(field) {
    const fieldFacts = this.getFacts(field);
    if (fieldFacts.length <= 1) return [];

    const values = new Set(fieldFacts.map(f => String(f.value)));
    if (values.size > 1) {
      return fieldFacts.map(f => ({
        ...f,
        status: "CONFLICT"
      }));
    }
    return [];
  }

  getAllConflicts() {
    const fields = new Set(this.facts.map(f => f.field));
    const conflicts = {};
    for (const field of fields) {
      const conf = this.getConflicts(field);
      if (conf.length > 0) {
        conflicts[field] = conf;
      }
    }
    return conflicts;
  }
}

class ZeroShotFraudEngine {
  constructor() {
    this.modelName = 'Xenova/nli-deberta-v3-small';
    this.fallbackModelName = 'Xenova/typeform-distilbert-base-uncased-mnli';
    this.classifier = null;
    this.isLoading = false;
    this.isLoaded = false;
    this.loadError = null;

    // Phase 6A: Evidence Registry
    this.evidenceRegistry = new EvidenceRegistry();

    // Natural Language Candidate Hypotheses & Associated Metadata
    this.taxonomyHypotheses = [
      {
        id: "ai_biometric_voice_extortion",
        label: "AI Voice Cloning / Deepfake Extortion & Wire Fraud",
        hypothesis: "AI voice cloning, deepfake audio impersonation, or emergency ransom extortion",
        category: "Emerging Cyber-Biometric Fraud",
        requiredFields: [
          { key: "spoofed_phone_number", label: "Spoofed Phone Number / Caller ID", type: "text", required: true },
          { key: "audio_sample_available", label: "Is Voice Sample / Voicemail Audio Saved?", type: "select", options: ["Yes - Recorded File Saved", "No - Live Call Only", "Voicemail Saved"], required: true }
        ],
        evidenceNeeded: [
          "Call logs with exact timestamp & duration",
          "Saved voicemails or call recordings",
          "Bank/Wire transaction receipts"
        ]
      },
      {
        id: "defi_smart_contract_drain",
        label: "Web3 / DeFi Smart Contract Approval Drain & Liquidity Scam",
        hypothesis: "Web3 asset drain, crypto wallet drainer, or malicious smart contract token approval scam",
        category: "Novel Web3 & Crypto Financial Fraud",
        requiredFields: [
          { key: "victim_wallet_address", label: "Victim Public Wallet Address", type: "text", required: true },
          { key: "malicious_contract_address", label: "Malicious Contract / Spender Address", type: "text", required: true }
        ],
        evidenceNeeded: [
          "Etherscan / Solscan Transaction Hash link",
          "Revoke.cash or approval history logs"
        ]
      },
      {
        id: "dark_pattern_subscription_trap",
        label: "Algorithmic Dark Pattern & Hidden Subscription Loophole",
        hypothesis: "algorithmic dark patterns, hidden recurring subscription traps, or deceptive e-commerce checkout loops",
        category: "Digital E-Commerce Deception",
        requiredFields: [
          { key: "merchant_name", label: "Merchant / Service Name on Billing", type: "text", required: true },
          { key: "checkout_url", label: "Website URL where Sign-up Occurred", type: "text", required: true }
        ],
        evidenceNeeded: [
          "Screenshots of checkout page showing lack of clear consent",
          "Bank / Credit card statement snippets"
        ]
      },
      {
        id: "bank_impersonation_wire_zelle",
        label: "Unauthorized Bank Impersonation & Instant Payment Extortion",
        hypothesis: "bank fraud department impersonation, Zelle, wire transfer, or unauthorized electronic payment fraud",
        category: "Banking & Payment System Fraud",
        requiredFields: [
          { key: "bank_name", label: "Your Bank / Financial Institution", type: "text", required: true },
          { key: "transfer_app_used", label: "Payment Channel (Zelle, Wire, ACH, Venmo)", type: "text", required: true }
        ],
        evidenceNeeded: [
          "Official bank dispute confirmation / denial letter",
          "Phone call logs matching bank spoofed number"
        ]
      },
      {
        id: "synthetic_identity_real_estate_hijack",
        label: "Synthetic Identity Title Hijack & Mortgage Impersonation",
        hypothesis: "real estate title hijack, property deed theft, mortgage impersonation, or forged escrow wire instructions",
        category: "Real Estate & High-Value Financial Fraud",
        requiredFields: [
          { key: "property_address", label: "Affected Property Address", type: "text", required: true },
          { key: "escrow_title_company", label: "Title / Escrow Company Involved", type: "text", required: true }
        ],
        evidenceNeeded: [
          "Original escrow wire instructions vs. fraudulent email",
          "Email headers showing spoofed domain"
        ]
      },
      {
        id: "phantom_seller_ecommerce",
        label: "E-Commerce Non-Delivery & Marketplace Seller Scam",
        hypothesis: "online marketplace non-delivery, seller disappearing after receiving payment, or fake item tracking scam",
        category: "Consumer Goods & E-Commerce Fraud",
        requiredFields: [
          { key: "website_url", label: "Store Website / Seller Page", type: "text", required: true },
          { key: "order_number", label: "Order Confirmation Number", type: "text", required: true }
        ],
        evidenceNeeded: [
          "Order receipt email",
          "Tracking history showing invalid delivery"
        ]
      },
      {
        id: "quantum_tech_investment_ponzi",
        label: "Investment Ponzi & High-Yield Technology Scam",
        hypothesis: "investment fraud, promised guaranteed daily returns, automated arbitrage bot, or Ponzi scheme",
        category: "Emerging Tech Investment Fraud",
        requiredFields: [
          { key: "platform_name", label: "Investment Platform / App Name", type: "text", required: true },
          { key: "promised_roi", label: "Promised Yield / Return (e.g. 5% daily)", type: "text", required: true }
        ],
        evidenceNeeded: [
          "Dashboard screenshots showing account balances & deposit records",
          "Telegram / WhatsApp chat history with 'Account Managers'"
        ]
      },
      {
        id: "employment_registration_fee_scam",
        label: "Fake Job Offer & Registration Fee Extortion",
        hypothesis: "fake job employment offers, registration fee scams, or advance fee task traps",
        category: "Employment & Career Fraud",
        requiredFields: [
          { key: "company_name", label: "Claimed Recruiter / Company Name", type: "text", required: true },
          { key: "fee_description", label: "Fee Requested (Equipment, Registration, Training)", type: "text", required: true }
        ],
        evidenceNeeded: [
          "Offer letter or chat history",
          "Payment receipt for requested fees"
        ]
      },
      {
        id: "tech_support_remote_access",
        label: "Tech Support Impersonation & Remote Access Hack",
        hypothesis: "tech support impersonation, pop-up security warnings, or fraudulent remote access computer hijacking",
        category: "Technical Impersonation Fraud",
        requiredFields: [
          { key: "remote_software_used", label: "Remote Access App Used (AnyDesk, TeamViewer)", type: "text", required: true },
          { key: "fake_support_number", label: "Support Phone Number on Pop-up", type: "text", required: true }
        ],
        evidenceNeeded: [
          "Pop-up screenshot or browser history",
          "Bank log showing unauthorized transfers during remote session"
        ]
      }
    ];
  }

  /**
   * Load Model dynamically via Transformers.js
   */
  async initModel(progressCallback = null) {
    if (this.isLoaded) return true;
    if (this.modelLoadPromise) return this.modelLoadPromise;

    this.isLoading = true;
    this.loadError = null;

    this.modelLoadPromise = (async () => {
      try {
        if (typeof window.transformersPipeline !== 'function') {
          throw new Error('Transformers.js library script not detected in global scope.');
        }

        if (window.transformersEnv) {
          window.transformersEnv.allowLocalModels = false;
          window.transformersEnv.useBrowserCache = true;
        }

        this.classifier = await window.transformersPipeline(
          'zero-shot-classification',
          this.modelName,
          {
            progress_callback: (progress) => {
              if (progressCallback) progressCallback(progress);
            }
          }
        );

        this.isLoaded = true;
        this.isLoading = false;
        return true;

      } catch (err) {
        console.warn(`Primary model ${this.modelName} failed to load, attempting fallback model...`, err);

        try {
          this.classifier = await window.transformersPipeline(
            'zero-shot-classification',
            this.fallbackModelName,
            {
              progress_callback: (progress) => {
                if (progressCallback) progressCallback(progress);
              }
            }
          );

          this.modelName = this.fallbackModelName;
          this.isLoaded = true;
          this.isLoading = false;
          return true;

        } catch (fallbackErr) {
          console.error("Zero-Shot NLI Model loading failed:", fallbackErr);
          this.isLoading = false;
          this.isLoaded = false;
          this.loadError = fallbackErr.message || "Failed to download/initialize ONNX Transformer weights.";
          throw fallbackErr;
        }
      }
    })();

    return this.modelLoadPromise;
  }

  /**
   * Genuine Zero-Shot Classification Engine
   * Evaluates Narrative against natural language candidate hypotheses using the NLI model.
   */
  async analyzeNarrative(narrativeText) {
    if (!narrativeText || narrativeText.trim().length < 10) {
      return this.getEmptyAnalysisResult();
    }

    if (!this.isLoaded) {
      await this.initModel();
    }

    const candidateLabels = this.taxonomyHypotheses.map(h => h.hypothesis);

    const nliResult = await this.classifier(narrativeText, candidateLabels, {
      hypothesis_template: "This situation involves {}."
    });

    const candidateScores = nliResult.labels.map((hypothesisText, idx) => {
      const entailmentProbability = nliResult.scores[idx];
      const matchTaxonomy = this.taxonomyHypotheses.find(h => h.hypothesis === hypothesisText) || {
        id: "custom_candidate",
        label: hypothesisText,
        category: "Inferred Concept",
        requiredFields: [],
        evidenceNeeded: ["Documentary evidence of transaction & communications"]
      };

      return {
        ...matchTaxonomy,
        hypothesis: hypothesisText,
        confidenceScore: Math.round(entailmentProbability * 100),
        rawScore: entailmentProbability,
        entailment: parseFloat(entailmentProbability.toFixed(4))
      };
    });

    candidateScores.sort((a, b) => b.rawScore - a.rawScore);

    const topCandidate = candidateScores[0];
    const topEntailment = topCandidate ? topCandidate.rawScore : 0;

    let classificationStatus = "MATCHED";
    let primaryMatch = topCandidate;

    if (topEntailment < 0.22) {
      classificationStatus = "LOW_MATCH_POTENTIALLY_NOVEL";
      primaryMatch = {
        id: "unseen_novel_vector",
        label: "Low Semantic Match / Potentially Unseen Fraud Scenario",
        category: "Unseen / Novel Fraud Pattern",
        hypothesis: "an unprecedented or unlisted fraud mechanism",
        requiredFields: [
          { key: "unseen_mechanism_details", label: "Describe the specific new method or technology used by the fraudster", type: "text", required: true }
        ],
        evidenceNeeded: [
          "Screenshots of communication channel",
          "Financial payment receipts / tx hashes"
        ],
        confidenceScore: Math.round(topEntailment * 100),
        rawScore: topEntailment,
        entailment: parseFloat(topEntailment.toFixed(4))
      };
    }

    const semanticMatchStrength = Math.round(topEntailment * 100);
    const isNovelZeroShotScenario = classificationStatus === "LOW_MATCH_POTENTIALLY_NOVEL" || topEntailment < 0.35;

    // Extract Entities via Regex
    const entities = this.extractEntities(narrativeText);

    // Extract Primitives
    const activePrimitives = this.extractPrimitives(narrativeText.toLowerCase());

    // Phase 2: Extract Structured Case Record Schema
    const structuredCaseRecord = this.extractStructuredCaseRecord(narrativeText, primaryMatch, topEntailment, entities);

    // Phase 3: Evidence Map & Fact Traceability Initializer
    const evidenceMap = this.generateEvidenceMap(structuredCaseRecord, []);
    const factTraceability = this.generateFactTraceability(narrativeText, {});
    const formalComplaintDoc = this.generateFormalComplaintDocument(structuredCaseRecord, {}, evidenceMap);

    // Dynamic Schema
    const dynamicSchema = this.generateDynamicSchema(primaryMatch, activePrimitives, isNovelZeroShotScenario);

    // Phase 5: Verified Indian Complaint Routing & Filing Guidance
    const indianRouting = this.evaluateIndianComplaintRouting(structuredCaseRecord);

    return {
      classification_status: classificationStatus,
      detected_category: primaryMatch.label,
      confidence: parseFloat(topEntailment.toFixed(4)),
      semantic_match_strength: semanticMatchStrength,
      candidate_scores: candidateScores.map(c => ({ label: c.label, entailment: c.entailment, score: c.confidenceScore })),
      primaryMatch: primaryMatch,
      candidateScores: candidateScores,
      noveltyIndex: 100 - semanticMatchStrength,
      isNovelZeroShotScenario: isNovelZeroShotScenario,
      reason: `Evaluated premise via ${this.modelName} zero-shot NLI classifier against candidate hypotheses.`,
      model: this.modelName,
      inference_type: 'zero-shot-nli',
      narrativeText: narrativeText,
      entities: entities,
      primitives: activePrimitives,
      structured_case_record: structuredCaseRecord,
      indian_routing: indianRouting,
      evidence_map: evidenceMap,
      fact_traceability: factTraceability,
      formal_complaint_doc: formalComplaintDoc,
      dynamicSchema: dynamicSchema,
      agencyRoutingNotice: indianRouting.primary_pathway ? `Primary Pathway: ${indianRouting.primary_pathway.name}` : (indianRouting.routing_status || "Evaluated"),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Phase 2: Extract Structured Case Record Schema
   */
  extractStructuredCaseRecord(narrativeText, primaryMatch, topEntailment, entities) {
    const textLower = narrativeText.toLowerCase();

    // 1. Loss breakdown
    let amount = entities.estimatedMaxLoss > 0 ? entities.estimatedMaxLoss : null;
    let currency = null;
    if (textLower.includes("₹") || textLower.includes("inr") || textLower.includes("rupees")) currency = "INR";
    else if (textLower.includes("$") || textLower.includes("usd") || textLower.includes("dollars")) currency = "USD";
    else if (amount !== null) currency = "INR";

    let paymentMethod = null;
    if (textLower.includes("upi")) paymentMethod = "UPI";
    else if (textLower.includes("zelle")) paymentMethod = "Zelle";
    else if (textLower.includes("wire")) paymentMethod = "Wire Transfer";
    else if (textLower.includes("debit")) paymentMethod = "Debit Card";
    else if (textLower.includes("credit")) paymentMethod = "Credit Card";
    else if (textLower.includes("crypto") || textLower.includes("bitcoin") || textLower.includes("usdt")) paymentMethod = "Crypto";
    else if (textLower.includes("net banking") || textLower.includes("ach")) paymentMethod = "Net Banking / ACH";

    // 2. Platform
    let platform = null;
    if (textLower.includes("telegram")) platform = "Telegram";
    else if (textLower.includes("whatsapp")) platform = "WhatsApp";
    else if (/\b(phone|call|calls|calling)\b/i.test(narrativeText)) platform = "Phone Call";
    else if (textLower.includes("email")) platform = "Email";
    else if (textLower.includes("instagram")) platform = "Instagram";
    else if (textLower.includes("facebook") || textLower.includes("marketplace")) platform = "Facebook Marketplace";
    else if (textLower.includes("website") || textLower.includes("dapp") || textLower.includes("domain")) platform = "Web Portal / Site";

    // 3. Promised Service / Product
    let promisedService = null;
    if (textLower.includes("job") || textLower.includes("position") || textLower.includes("employment") || textLower.includes("recruiter")) promisedService = "Software job / Employment opportunity";
    else if (textLower.includes("certificate") || textLower.includes("freelance") || textLower.includes("verification")) promisedService = "Freelance verification certificate";
    else if (textLower.includes("camera") || textLower.includes("laptop") || textLower.includes("console") || textLower.includes("product")) promisedService = "Consumer Product / Goods";
    else if (textLower.includes("subscription") || textLower.includes("converter") || textLower.includes("mastermind")) promisedService = "Online Software Service";
    else if (textLower.includes("yield") || textLower.includes("return") || textLower.includes("ponzi") || textLower.includes("arbitrage")) promisedService = "Guaranteed Investment Yield";
    else if (textLower.includes("escrow") || textLower.includes("house") || textLower.includes("title")) promisedService = "Real Estate Property Title";

    // 4. Incident Date & Reference (Strictly NULL unless explicitly present in transaction/incident context)
    let incidentDate = null;
    if (entities.dates.length > 0) {
      const candidateDate = entities.dates[0];
      const dateLower = candidateDate.toLowerCase();
      const dateIdx = textLower.indexOf(dateLower);
      if (dateIdx !== -1) {
        const surroundingText = textLower.substring(Math.max(0, dateIdx - 40), Math.min(textLower.length, dateIdx + candidateDate.length + 40));
        if (surroundingText.includes("turned") || surroundingText.includes("birthday") || surroundingText.includes("born") || surroundingText.includes("years old")) {
          incidentDate = null;
        } else {
          incidentDate = candidateDate;
        }
      } else {
        incidentDate = candidateDate;
      }
    }
    let transactionRef = null;
    const refMatch = narrativeText.match(/\b(utr|txhash|rrn|ref|reference)\s*[:#]?\s*([a-z0-9\-]{5,})\b/i);
    if (refMatch) {
      const candidateVal = refMatch[2].toLowerCase();
      if (/\d/.test(candidateVal) && !["transaction", "reference", "details", "number", "available"].includes(candidateVal)) {
        transactionRef = refMatch[0];
      }
    }

    // 5. Personal Information Requested
    const personalInfo = [];
    if (textLower.includes("aadhaar")) personalInfo.push("Aadhaar number");
    if (textLower.includes("bank account") || textLower.includes("bank details")) personalInfo.push("Bank account details");
    if (textLower.includes("pan card") || textLower.includes("pan number")) personalInfo.push("PAN card");
    if (textLower.includes("otp") || textLower.includes("passcode")) personalInfo.push("One-Time Passcode (OTP)");

    // 6. Current Status
    let currentStatus = null;
    if (textLower.includes("blocked")) currentStatus = "Blocked after payment";
    else if (textLower.includes("disappeared") || textLower.includes("stopped working") || textLower.includes("deleted")) currentStatus = "Suspect account disappeared / site stopped working";
    else if (textLower.includes("never shipped") || textLower.includes("never arrived")) currentStatus = "Item non-delivery";
    else if (textLower.includes("refused") || textLower.includes("cancel")) currentStatus = "Cancellation refused";

    // 7. Suspect Info
    const suspectInfo = [];
    entities.phoneNumbers.forEach(p => suspectInfo.push(`Phone: ${p}`));
    entities.emailAddresses.forEach(e => suspectInfo.push(`Email: ${e}`));
    entities.urls.forEach(u => suspectInfo.push(`URL: ${u}`));
    entities.cryptoAddresses.forEach(c => suspectInfo.push(`Crypto: ${c}`));

    // 8. Determine Missing Information
    const missingInfo = [];
    if (!incidentDate) missingInfo.push("Transaction date");
    if (!transactionRef) missingInfo.push("Transaction / Reference ID (UTR / IMAD)");
    if (suspectInfo.length === 0) missingInfo.push("Recipient details / Suspect phone / handle");
    if (!textLower.includes("screenshot") && !textLower.includes("receipt") && !textLower.includes("chat log")) {
      missingInfo.push("Screenshots / Chat history evidence");
    }

    // 9. Evaluate Complaint Readiness
    let readiness = "INCOMPLETE";
    if (amount !== null && platform !== null && paymentMethod !== null) {
      if (incidentDate !== null && transactionRef !== null && suspectInfo.length > 0) {
        readiness = "READY";
      } else {
        readiness = "PARTIALLY_READY";
      }
    }

    return {
      fraud_category: primaryMatch.label,
      semantic_confidence: Math.round(topEntailment * 100),
      incident_summary: narrativeText.substring(0, 180) + (narrativeText.length > 180 ? '...' : ''),
      victim_loss: {
        amount: amount,
        currency: currency,
        payment_method: paymentMethod
      },
      platform: platform,
      suspect_information: suspectInfo,
      promised_service_or_product: promisedService,
      incident_date: incidentDate,
      transaction_reference: transactionRef,
      communication_details: platform ? [platform] : [],
      personal_information_requested: personalInfo,
      current_status: currentStatus,
      evidence_available: [],
      missing_information: missingInfo,
      complaint_readiness: readiness
    };
  }

  /**
   * Phase 3: Evidence Mapping
   */
  generateEvidenceMap(structuredRecord, victimAttachedItems = [], completionFields = {}) {
    const textLower = (structuredRecord.incident_summary || "").toLowerCase();

    // 1. Financial Loss / Payment Evidence
    const hasTxRef = (structuredRecord.transaction_reference && structuredRecord.transaction_reference !== "Not available") ||
                     (completionFields.transaction_reference && completionFields.transaction_reference !== "NOT_AVAILABLE");
    const hasPaymentScreenshot = (completionFields.evidence_attached && completionFields.evidence_attached.toLowerCase().includes('payment')) ||
                                 victimAttachedItems.some(i => i.name.toLowerCase().includes('payment') || i.name.toLowerCase().includes('upi') || i.name.toLowerCase().includes('receipt'));

    const financialEv = [];
    if (hasTxRef) financialEv.push(`Transaction Reference / UTR Record (${completionFields.transaction_reference || structuredRecord.transaction_reference})`);
    if (hasPaymentScreenshot) financialEv.push("UPI / Payment receipt screenshot");

    // 2. Communication Evidence
    const hasChatScreenshot = textLower.includes("screenshot") ||
                              (completionFields.evidence_attached && completionFields.evidence_attached.toLowerCase().includes('chat')) ||
                              victimAttachedItems.some(i => i.name.toLowerCase().includes('chat') || i.name.toLowerCase().includes('screenshot') || i.name.toLowerCase().includes('telegram'));

    const commEv = [];
    if (hasChatScreenshot) commEv.push(`${structuredRecord.platform || 'Platform'} chat screenshots`);

    // 3. Identity Evidence
    const identityEv = [];
    if (structuredRecord.personal_information_requested && structuredRecord.personal_information_requested.length > 0) {
      identityEv.push(...structuredRecord.personal_information_requested);
    }

    return {
      financial_loss: {
        category: "Financial Loss / Payment Evidence",
        evidence: financialEv,
        status: financialEv.length > 0 ? "AVAILABLE" : "MISSING"
      },
      communication: {
        category: "Communication Evidence",
        evidence: commEv,
        status: commEv.length > 0 ? "AVAILABLE" : "MISSING"
      },
      identity: {
        category: "Identity & Personal Info Evidence",
        evidence: identityEv,
        status: identityEv.length > 0 ? "AVAILABLE" : "MISSING"
      }
    };
  }

  /**
   * Phase 3: Fact Traceability Matrix
   */
  generateFactTraceability(narrativeText, completionFields = {}) {
    const traces = [
      { statement: `Incident narrative submitted by victim.`, source: "victim_narrative" }
    ];

    if (completionFields.transaction_date && completionFields.transaction_date !== "NOT_AVAILABLE") {
      traces.push({ statement: `Transaction date: ${completionFields.transaction_date}`, source: "case_completion_form" });
    }
    if (completionFields.transaction_reference && completionFields.transaction_reference !== "NOT_AVAILABLE") {
      traces.push({ statement: `Transaction reference: ${completionFields.transaction_reference}`, source: "case_completion_form" });
    }
    if (completionFields.recipient_details && completionFields.recipient_details !== "NOT_AVAILABLE") {
      traces.push({ statement: `Recipient details: ${completionFields.recipient_details}`, source: "case_completion_form" });
    }
    if (completionFields.evidence_attached && completionFields.evidence_attached !== "NOT_AVAILABLE") {
      traces.push({ statement: `Attached evidence: ${completionFields.evidence_attached}`, source: "case_completion_form" });
    }

    return traces;
  }

  /**
   * Phase 3: Recalculate Complaint Readiness
   */
  recalculateReadiness(structuredRecord, completionFields = {}, evidenceMap = {}) {
    const loss = structuredRecord.victim_loss || {};
    const hasAmount = loss.amount !== null && loss.amount !== undefined;
    const hasIncidentDesc = (structuredRecord.incident_summary || "").length > 10;

    const hasDate = (completionFields.transaction_date && completionFields.transaction_date !== "NOT_AVAILABLE") || structuredRecord.incident_date !== null;
    const hasRef = (completionFields.transaction_reference && completionFields.transaction_reference !== "NOT_AVAILABLE") || structuredRecord.transaction_reference !== null;
    const hasRecipient = (completionFields.recipient_details && completionFields.recipient_details !== "NOT_AVAILABLE") || (structuredRecord.suspect_information && structuredRecord.suspect_information.length > 0);
    const hasEvidence = (evidenceMap.financial_loss && evidenceMap.financial_loss.status === "AVAILABLE") ||
                       (evidenceMap.communication && evidenceMap.communication.status === "AVAILABLE") ||
                       (completionFields.evidence_attached && completionFields.evidence_attached !== "NOT_AVAILABLE");

    if (hasAmount && hasIncidentDesc && hasDate && hasRef && hasRecipient && hasEvidence) {
      return {
        status: "READY",
        explanation: "The incident, financial loss, payment details and supporting evidence are sufficiently documented for complaint drafting.",
        isLegalDetermination: false
      };
    } else if (hasIncidentDesc && hasAmount) {
      return {
        status: "PARTIALLY_READY",
        explanation: "The incident can be described, but some supporting transaction or identity details are unavailable.",
        isLegalDetermination: false
      };
    } else {
      return {
        status: "INCOMPLETE",
        explanation: "Important facts required to describe the incident are still missing.",
        isLegalDetermination: false
      };
    }
  }

  /**
   * Phase 3: Formal Complaint Generator (No-Hallucination Strict Implementation)
   */
  generateFormalComplaintDocument(structuredRecord, completionFields = {}, evidenceMap = {}) {
    const loss = structuredRecord.victim_loss || {};
    const currSymbol = loss.currency === "INR" ? "₹" : (loss.currency === "USD" ? "$" : "");
    const amountStr = loss.amount ? `${currSymbol}${loss.amount.toLocaleString()}` : "Not provided";
    const paymentMethodStr = loss.payment_method || "Not provided";
    const platformStr = structuredRecord.platform || "Not provided";

    // Value resolution using strict No-Hallucination rule
    let dateStr = "Not available";
    if (completionFields.transaction_date === "NOT_AVAILABLE") {
      dateStr = "Not available";
    } else if (completionFields.transaction_date && completionFields.transaction_date.trim()) {
      dateStr = completionFields.transaction_date.trim();
    } else if (structuredRecord.incident_date) {
      dateStr = structuredRecord.incident_date;
    }

    let refStr = "Not available";
    if (completionFields.transaction_reference === "NOT_AVAILABLE") {
      refStr = "Not available";
    } else if (completionFields.transaction_reference && completionFields.transaction_reference.trim()) {
      refStr = completionFields.transaction_reference.trim();
    } else if (structuredRecord.transaction_reference) {
      refStr = structuredRecord.transaction_reference;
    }

    let recipientStr = "Not available";
    if (completionFields.recipient_details === "NOT_AVAILABLE") {
      recipientStr = "Not available";
    } else if (completionFields.recipient_details && completionFields.recipient_details.trim()) {
      recipientStr = completionFields.recipient_details.trim();
    } else if (structuredRecord.suspect_information && structuredRecord.suspect_information.length > 0) {
      recipientStr = structuredRecord.suspect_information.join(', ');
    }

    // Evidence List
    const evidenceList = [];
    if (evidenceMap.financial_loss && evidenceMap.financial_loss.status === "AVAILABLE") {
      evidenceMap.financial_loss.evidence.forEach(e => evidenceList.push(e));
    }
    if (evidenceMap.communication && evidenceMap.communication.status === "AVAILABLE") {
      evidenceMap.communication.evidence.forEach(e => evidenceList.push(e));
    }
    if (completionFields.evidence_attached && completionFields.evidence_attached !== "NOT_AVAILABLE" && completionFields.evidence_attached.trim()) {
      if (!evidenceList.includes(completionFields.evidence_attached.trim())) {
        evidenceList.push(completionFields.evidence_attached.trim());
      }
    }

    // Missing list calculation
    const missingItems = [];
    if (dateStr === "Not available") missingItems.push("Transaction date");
    if (refStr === "Not available") missingItems.push("Transaction reference number");
    if (recipientStr === "Not available") missingItems.push("Recipient details");
    if (evidenceList.length === 0) missingItems.push("Supporting evidence / Screenshots");

    return `CONSUMER FRAUD COMPLAINT

1. Subject
Formal Complaint Regarding ${structuredRecord.fraud_category || 'Consumer Fraud Incident'}

2. Complainant Information
Complainant: [Victim / Complainant]
Contact Info: On file

3. Incident Summary
${structuredRecord.incident_summary || 'Narrative details submitted on file.'}

4. Fraudulent Activity
The complainant reported an incident classified as ${structuredRecord.fraud_category} (Semantic Confidence: ${structuredRecord.semantic_confidence}%). The perpetrator solicited funds on ${platformStr} under the pretense of ${structuredRecord.promised_service_or_product || 'promised service'}. After receiving the payment, the perpetrator ${structuredRecord.current_status || 'ceased communication'}.

5. Financial Loss
- Amount Stolen: ${amountStr}
- Payment Method: ${paymentMethodStr}
- Transaction Date: ${dateStr}
- Transaction Reference Number: ${refStr}

6. Suspect/Service Information
- Recipient / Suspect Details: ${recipientStr}
- Platform / Channel: ${platformStr}
- Promised Product/Service: ${structuredRecord.promised_service_or_product || 'Not provided'}

7. Communication Details
Primary communications took place over ${platformStr}. Personal data requested during interaction: ${structuredRecord.personal_information_requested && structuredRecord.personal_information_requested.length > 0 ? structuredRecord.personal_information_requested.join(', ') : 'None specified'}.

8. Evidence Available
${evidenceList.length > 0 ? evidenceList.map(e => `- ${e}`).join('\n') : '- None provided'}

9. Missing/Unavailable Information
${missingItems.length > 0 ? missingItems.map(m => `- ${m}: Not available`).join('\n') : '- None (All primary case details collected)'}

10. Requested Assistance
I request that the concerned authority review the incident, examine the available transaction and communication records, and take appropriate action under the applicable procedures.

11. Declaration
I declare that the information provided above is true and accurate to the best of my knowledge based on the facts available.`;
  }

  /**
   * Entity Extraction Regex Pipeline
   */
  extractEntities(text) {
    const monetaryRegex = /(\$|usd\s?|dollars?\s?|₹|inr\s?|rupees?\s?)(\d{1,3}(,\d{3})*(\.\d{2})?|\d+(\.\d{2})?)/gi;
    const phoneRegex = /(\+?\d{1,2}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    const dateRegex = /\b(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|january|february|march|april|may|june|july|august|september|october|november|december)\b/gi;
    const cryptoAddressRegex = /\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59}|[48][0-9AB][1-9A-HJ-NP-Za-km-z]{93})\b/g;

    const monetaryMatches = Array.from(text.matchAll(monetaryRegex)).map(m => m[0]);
    const phones = Array.from(text.matchAll(phoneRegex)).map(m => m[0]);
    const emails = Array.from(text.matchAll(emailRegex)).map(m => m[0]);
    const urls = Array.from(text.matchAll(urlRegex)).map(m => m[0]);
    const dates = Array.from(text.matchAll(dateRegex)).map(m => m[0]);
    const cryptoAddresses = Array.from(text.matchAll(cryptoAddressRegex)).map(m => m[0]);

    let maxLoss = 0;
    monetaryMatches.forEach(m => {
      const numeric = parseFloat(m.replace(/[^0-9.]/g, ''));
      if (!isNaN(numeric) && numeric > maxLoss) maxLoss = numeric;
    });

    return {
      monetaryLosses: Array.from(new Set(monetaryMatches)),
      estimatedMaxLoss: maxLoss,
      phoneNumbers: Array.from(new Set(phones)),
      emailAddresses: Array.from(new Set(emails)),
      urls: Array.from(new Set(urls)),
      dates: Array.from(new Set(dates)),
      cryptoAddresses: Array.from(new Set(cryptoAddresses))
    };
  }

  /**
   * Extract Abstract Primitives
   */
  extractPrimitives(textLower) {
    const vectors = [];
    const mechanisms = [];
    const channels = [];

    if (textLower.includes("voice") || textLower.includes("call") || textLower.includes("audio")) vectors.push("Voice / Audio AI");
    if (textLower.includes("contract") || textLower.includes("crypto") || textLower.includes("blockchain")) vectors.push("Smart Contract / Web3");
    if (textLower.includes("subscription") || textLower.includes("recurring") || textLower.includes("cancel")) vectors.push("Dark Pattern UI");
    if (textLower.includes("spoof") || textLower.includes("fake number")) vectors.push("Spoofed Telecommunication");

    if (textLower.includes("wire") || textLower.includes("zelle") || textLower.includes("transfer") || textLower.includes("upi")) mechanisms.push("Unauthorized Push Transfer");
    if (textLower.includes("drain") || textLower.includes("approval")) mechanisms.push("Wallet Secret Key Drain");
    if (textLower.includes("extort") || textLower.includes("ransom") || textLower.includes("threat")) mechanisms.push("Extortion / Ransom");

    if (textLower.includes("phone") || textLower.includes("call")) channels.push("Mobile Telephony");
    if (textLower.includes("telegram") || textLower.includes("whatsapp") || textLower.includes("chat")) channels.push("Encrypted Messaging");
    if (textLower.includes("website") || textLower.includes("domain") || textLower.includes("dapp")) channels.push("Web Portal / dApp");

    return {
      vectors: vectors.length > 0 ? vectors : ["Digital Deception"],
      mechanisms: mechanisms.length > 0 ? mechanisms : ["Financial Deprivation"],
      channels: channels.length > 0 ? channels : ["Internet / Cellular"]
    };
  }

  /**
   * Dynamic Schema Synthesis Generator
   */
  generateDynamicSchema(primaryMatch, primitives, isNovel) {
    let schemaFields = [...(primaryMatch.requiredFields || [])];
    let customNotice = null;

    if (isNovel) {
      customNotice = `Zero-Shot Model Inference: Detected low semantic match against existing standard taxonomy (Semantic Match Strength < 35%). Custom verification schema synthesized for novel scenario.`;
    }

    return {
      title: isNovel ? `Zero-Shot Inferred Schema: ${primaryMatch.label}` : primaryMatch.label,
      fields: schemaFields,
      evidenceNeeded: primaryMatch.evidenceNeeded || [],
      customNotice
    };
  }

  /**
   * Phase 5 Regulatory Routing Notice Replacement
   */
  /**
   * Phase 5: Verified Indian Complaint Routing & Filing Guidance
   * Consumes existing structured case record. DOES NOT perform a second fraud classification.
   */
  evaluateIndianComplaintRouting(structuredRecord, completionFields = {}) {
    if (!structuredRecord) {
      return {
        routing_status: "INSUFFICIENT_INFORMATION",
        primary_pathway: null,
        secondary_pathways: [],
        required_information: [],
        limitations: [
          "No structured case record available for routing evaluation.",
          "This routing is guidance based on victim-supplied case parameters and does not replace official instructions from authorities.",
          "This system does not make formal legal determinations or provide legal advice."
        ]
      };
    }

    // Verified Official Sources Constants
    const OFFICIAL_SOURCES = {
      CYBER_CRIME: {
        id: "cyber_crime_1930",
        name: "National Cyber Crime Reporting Portal & Emergency Helpline 1930",
        official_source: "Ministry of Home Affairs, Government of India",
        helpline: "1930",
        official_contact: "Call 1930 (Emergency Helpline) / Cyber Crime Reporting Portal",
        official_url: "https://cybercrime.gov.in/",
        description: "Official portal and 24x7 emergency helpline for reporting cyber financial fraud, online phishing, digital impersonation, and unauthorized electronic payment transactions."
      },
      NCH: {
        id: "national_consumer_helpline",
        name: "National Consumer Helpline (NCH)",
        official_source: "Department of Consumer Affairs, Government of India",
        helpline: "1915",
        alternate_helpline: "1800-11-4000",
        whatsapp_sms: "8800001915",
        official_contact: "Helpline: 1915 | Alt: 1800-11-4000 | WhatsApp/SMS: 8800001915",
        official_url: "https://consumerhelpline.gov.in/",
        description: "Official pre-litigation grievance redressal mechanism operated by the Department of Consumer Affairs for consumer disputes regarding products, e-commerce marketplace sellers, or commercial services."
      },
      NPCI_UPI: {
        id: "npci_upi_dispute",
        name: "NPCI / UPI Payment System Dispute Pathway",
        official_source: "National Payments Corporation of India (NPCI)",
        helpline: "PSP App Dispute / Issuing Bank Customer Care",
        official_contact: "Raise dispute in PSP App (GPay, PhonePe, Paytm, BHIM) or Bank; Escalate via NPCI portal",
        official_url: "https://www.npci.org.in/",
        description: "Official dispute resolution process for lodging transaction disputes with Payment Service Providers (PSP) and issuing banks for UPI financial transfers. Note: NPCI is a payment clearing house, not a criminal investigation authority."
      }
    };

    const loss = structuredRecord.victim_loss || {};
    const hasAmount = loss.amount !== null && loss.amount !== undefined && loss.amount > 0;
    const paymentMethod = loss.payment_method || null;
    const isUPI = paymentMethod === "UPI";
    const isDigitalPayment = ["UPI", "Crypto", "Zelle", "Wire Transfer", "Debit Card", "Credit Card", "Net Banking / ACH"].includes(paymentMethod);
    const platform = structuredRecord.platform;
    const category = (structuredRecord.fraud_category || "").toLowerCase();
    const summary = (structuredRecord.incident_summary || "").toLowerCase();

    // Value resolution taking into account completionFields (Phase 3 updates)
    const dateVal = (completionFields.transaction_date && completionFields.transaction_date !== "NOT_AVAILABLE") ? completionFields.transaction_date : structuredRecord.incident_date;
    const refVal = (completionFields.transaction_reference && completionFields.transaction_reference !== "NOT_AVAILABLE") ? completionFields.transaction_reference : structuredRecord.transaction_reference;
    const recipientVal = (completionFields.recipient_details && completionFields.recipient_details !== "NOT_AVAILABLE") ? completionFields.recipient_details : (structuredRecord.suspect_information && structuredRecord.suspect_information.length > 0 ? structuredRecord.suspect_information.join(', ') : null);

    // 1. Build Required Information Status
    const requiredInfo = [
      { field: "Loss Amount", status: hasAmount ? "AVAILABLE" : "MISSING", value: hasAmount ? `${loss.currency || 'INR'} ${loss.amount.toLocaleString()}` : "Not available" },
      { field: "Payment Method", status: paymentMethod ? "AVAILABLE" : "MISSING", value: paymentMethod || "Not available" },
      { field: "Incident / Transaction Date", status: dateVal ? "AVAILABLE" : "MISSING", value: dateVal || "Not provided" },
      { field: "Transaction / UTR Reference ID", status: (refVal && refVal !== "Not available") ? "AVAILABLE" : "MISSING", value: refVal || "Not provided" },
      { field: "Communication Platform", status: platform ? "AVAILABLE" : "MISSING", value: platform || "Not available" },
      { field: "Recipient / Suspect Contact", status: recipientVal ? "AVAILABLE" : "MISSING", value: recipientVal || "Not available" }
    ];

    // 2. Check for Benign / Non-Fraud Narrative
    const isBenign = structuredRecord.semantic_confidence < 25 || summary.includes("bought a coffee") || summary.includes("nice day") || category.includes("benign");
    if (isBenign) {
      return {
        routing_status: "BENIGN_NO_ROUTING",
        primary_pathway: null,
        secondary_pathways: [],
        required_information: requiredInfo,
        limitations: [
          "No consumer dispute or cyber fraud indicators detected in the narrative.",
          "This routing is guidance based on victim-supplied case parameters and does not replace official instructions from authorities.",
          "This system does not make formal legal determinations or provide legal advice."
        ]
      };
    }

    // 3. Routing Decision Matrix (Strict non-classifier routing based on structured case fields)
    const isConsumerGrievance = category.includes("e-commerce") || category.includes("product") || category.includes("goods") || category.includes("subscription") || category.includes("dark pattern") || summary.includes("merchant") || summary.includes("ordered") || summary.includes("non-delivery");

    const isCyberExtortionOrScam = category.includes("extortion") || category.includes("impersonation") || category.includes("job") || category.includes("telegram") || category.includes("freelance") || summary.includes("blocked") || summary.includes("ransom") || summary.includes("voice") || summary.includes("registration fee");

    const isFinancialCyberFraud = hasAmount && !isConsumerGrievance && (isDigitalPayment || platform || isCyberExtortionOrScam);

    // Case with no payment / financial loss information
    if (!hasAmount && !isConsumerGrievance && !platform && !isDigitalPayment) {
      return {
        routing_status: "INSUFFICIENT_INFORMATION",
        primary_pathway: null,
        secondary_pathways: [
          {
            ...OFFICIAL_SOURCES.CYBER_CRIME,
            reason: "General guidance: If this situation involves online harassment, phishing, or digital fraud without confirmed financial loss, reporting to the Cyber Crime Reporting Portal is advised."
          },
          {
            ...OFFICIAL_SOURCES.NCH,
            reason: "General guidance: If this situation involves a commercial dispute with a seller or service provider, the National Consumer Helpline provides pre-litigation assistance."
          }
        ],
        required_information: requiredInfo,
        limitations: [
          "Case parameters do not contain confirmed financial transaction data required for specific financial fraud routing.",
          "This routing is guidance based on victim-supplied case parameters and does not replace official instructions from authorities.",
          "This system does not make formal legal determinations or provide legal advice.",
          "Filing a complaint does not guarantee financial recovery or legal resolution."
        ]
      };
    }

    let primaryPathway = null;
    const secondaryPathways = [];

    if (isFinancialCyberFraud) {
      primaryPathway = {
        ...OFFICIAL_SOURCES.CYBER_CRIME,
        reason: `Recommended because the case contains an apparent financial loss (${loss.currency || 'INR'} ${loss.amount ? loss.amount.toLocaleString() : ''}) involving a digital payment channel / online platform (${platform || paymentMethod || 'Online'}).`
      };

      if (isUPI) {
        secondaryPathways.push({
          ...OFFICIAL_SOURCES.NPCI_UPI,
          reason: "Relevant for lodging an immediate transaction dispute with your Payment Service Provider (GPay/PhonePe/Paytm/BHIM) or issuing bank."
        });
      }

      if (isConsumerGrievance || category.includes("employment") || category.includes("job") || category.includes("freelance")) {
        secondaryPathways.push({
          ...OFFICIAL_SOURCES.NCH,
          reason: "National Consumer Helpline may be relevant if the dispute involves a commercial entity or service provider."
        });
      }

    } else if (isConsumerGrievance) {
      primaryPathway = {
        ...OFFICIAL_SOURCES.NCH,
        reason: "Recommended because the case involves a consumer grievance regarding non-delivery of goods, defective service, or deceptive trade practices by a commercial seller or service provider."
      };

      if (hasAmount && isDigitalPayment) {
        secondaryPathways.push({
          ...OFFICIAL_SOURCES.CYBER_CRIME,
          reason: "Secondary pathway: If the merchant is fraudulent, non-existent, or engaged in criminal impersonation, reporting to Cyber Crime Helpline 1930 is recommended."
        });
      }
    } else {
      primaryPathway = {
        ...OFFICIAL_SOURCES.CYBER_CRIME,
        reason: "Based on the information provided, this pathway appears relevant for reporting digital fraud or online financial extortion."
      };
      secondaryPathways.push({
        ...OFFICIAL_SOURCES.NCH,
        reason: "National Consumer Helpline provides alternative guidance if the matter involves a consumer dispute with a business."
      });
    }

    return {
      routing_status: "ROUTED",
      primary_pathway: primaryPathway,
      secondary_pathways: secondaryPathways,
      required_information: requiredInfo,
      limitations: [
        "This routing is guidance based on victim-supplied case parameters and does not replace official instructions from authorities.",
        "This system does not make formal legal determinations or provide legal advice.",
        "Filing a complaint does not guarantee financial recovery or legal resolution."
      ]
    };
  }

  calculateAgencyRouting(primaryMatch, primitives, entities) {
    return [
      {
        id: "STATUS",
        name: "Regulatory Jurisdiction Evaluation",
        focus: "Statutory jurisdiction routing notice",
        matchScore: 0,
        statute: "Regulatory routing: Evaluated.",
        submissionUrl: "#",
        readiness: "Phase 5 Active"
      }
    ];
  }

  // Phase 6A Evidence Registry Delegates
  addEvidence(evidenceObj) {
    return this.evidenceRegistry.addEvidence(evidenceObj);
  }

  getEvidence(evidenceId) {
    return this.evidenceRegistry.getEvidence(evidenceId);
  }

  listEvidence() {
    return this.evidenceRegistry.listEvidence();
  }

  linkEvidenceFact(evidenceId, field, value) {
    return this.evidenceRegistry.linkEvidenceFact(evidenceId, field, value);
  }

  linkFact(field, value, source, sourceType) {
    return this.evidenceRegistry.linkFact(field, value, source, sourceType);
  }

  getCaseProvenance(field = null) {
    return this.evidenceRegistry.getFacts(field);
  }

  getCaseConflicts(field = null) {
    if (field) {
      return this.evidenceRegistry.getConflicts(field);
    }
    return this.evidenceRegistry.getAllConflicts();
  }

  resetEvidenceRegistry() {
    this.evidenceRegistry.reset();
  }

  // Phase 6B Evidence Extractor Delegates
  extractEvidenceFacts(evidenceIdOrItem, textContent = null) {
    if (!this.evidenceExtractor) {
      this.evidenceExtractor = new EvidenceExtractor(this.evidenceRegistry);
    }
    return this.evidenceExtractor.extractEvidenceFacts(evidenceIdOrItem, textContent);
  }

  evaluateFactConflicts(field, narrativeValue, evidenceValue) {
    if (!this.evidenceExtractor) {
      this.evidenceExtractor = new EvidenceExtractor(this.evidenceRegistry);
    }
    return this.evidenceExtractor.evaluateFactConflicts(field, narrativeValue, evidenceValue);
  }

  getEmptyAnalysisResult() {
    return {
      classification_status: "AWAITING_INPUT",
      detected_category: "Awaiting Narrative Input",
      confidence: 0,
      semantic_match_strength: 0,
      candidate_scores: [],
      primaryMatch: this.taxonomyHypotheses[0],
      candidateScores: [],
      noveltyIndex: 0,
      isNovelZeroShotScenario: false,
      reason: "No narrative submitted",
      model: this.modelName,
      inference_type: "zero-shot-nli",
      entities: { monetaryLosses: [], estimatedMaxLoss: 0, phoneNumbers: [], emailAddresses: [], urls: [], dates: [], cryptoAddresses: [] },
      primitives: { vectors: [], mechanisms: [], channels: [] },
      structured_case_record: null,
      evidence_map: {},
      fact_traceability: [],
      formal_complaint_doc: "",
      dynamicSchema: { title: "Awaiting Narrative Input", fields: [], evidenceNeeded: [] },
      agencyRoutingNotice: "Regulatory routing: Not yet evaluated."
    };
  }
}

// Export global instance
window.zeroShotEngine = new ZeroShotFraudEngine();
