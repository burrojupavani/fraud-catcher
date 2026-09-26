/**
 * Main Application Controller for Consumer Fraud Complaint Assistant
 * Handles UI tabs, Transformers.js NLI model state, Chart.js visualizations,
 * Adaptive Form, Timeline Builder, and Affidavit Exporter.
 * Phase 2: Structured Case Record & Complaint Readiness UI Rendering.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Global Application State
  const state = {
    narrativeText: '',
    analysisResult: null,
    formValues: {},
    financialLosses: [{ description: 'Primary Fraudulent Transfer', amount: 0, date: '', paymentMethod: 'UPI / Wire Transfer' }],
    timelineEvents: [],
    evidenceItems: [],
    activeTab: 'intake',
    theme: 'dark'
  };

  // Test Benchmark Cases (Known & Unseen Scenarios for NLI Generalization Evaluation)
  const presetScenarios = {
    // TELEGRAM EMPLOYMENT FRAUD CASE (PHASE 2 BENCHMARK)
    employment_telegram_fee: {
      name: "⚡ Case Intake: Telegram Job Registration Fee (₹8,000)",
      text: "I joined a Telegram group where someone promised me a software job. They asked me to pay ₹8,000 as a registration fee through UPI. I sent the money and shared my Aadhaar number and bank account details. After that they blocked me."
    },

    // KNOWN / FAMILIAR CASES
    fake_product: {
      name: "Known: Fake Product Purchase",
      text: "On August 10, 2026, I ordered a camera online for $450 via debit card. I received an order receipt and tracking number showing delivered to a different state. The merchant never shipped the item and stopped responding."
    },
    unauthorized_payment: {
      name: "Known: Unauthorized Payment Transfer",
      text: "I noticed three unauthorized transfers of $500 each sent from my bank account to an unknown recipient via Zelle on September 1. I never initiated or authorized these transactions."
    },
    subscription_deception: {
      name: "Known: Subscription Deception",
      text: "I signed up for a $1 trial of an online service. They automatically enrolled me into a $99/month recurring plan without clear disclosure and hid the cancellation button."
    },

    // UNSEEN SCENARIOS (No keyword rules or hard-coded definitions used)
    unseen_freelance_certificate: {
      name: "⚡ Unseen Fraud: Freelance Design Certificate Scam (₹3,500)",
      text: "I found a freelance design opportunity through an online community. They asked me to pay ₹3,500 for a mandatory verification certificate. After I paid, the account disappeared and the website stopped working."
    },
    gaming_seller: {
      name: "Unseen 1: Gaming Community Seller Disappears",
      text: "A person contacted me through a gaming community and offered a limited-edition console. I transferred ₹30,000, and immediately afterward the account disappeared."
    },
    fake_job_fee: {
      name: "Unseen 2: Fake Job Course Registration Fee",
      text: "I applied for a remote data entry position on a job board. The recruiter sent an official-looking offer letter but demanded I pay $350 for mandatory onboarding training modules before starting work."
    },
    ai_voice_request: {
      name: "Unseen 3: AI Voice Impersonation Money Request",
      text: "I received a phone call sounding exactly like my brother crying saying he was in jail after a car crash and needed $4,000 immediately. I wired the money before realizing his voice was synthesized."
    },
    remote_access_support: {
      name: "Unseen 4: Fake Support Remote Access Session",
      text: "A pop-up appeared on my screen warning of a virus and listing a phone number. When I called, the support technician convinced me to install AnyDesk remote access software, then drained $2,800 from my online banking."
    }
  };

  // Phase 3 Completion Fields State
  state.completionFields = {};

  // Initialize UI Event Listeners
  initThemeToggle();
  initNavigationTabs();
  initIntakeSection();
  initSandboxSection();
  initFinancialCalculator();
  initEvidenceLocker();
  initAffidavitExporter();

  // Initialize NLI Model
  initModelLoading();

  async function initModelLoading() {
    const statusText = document.getElementById('model-status-text');
    const statusPing = document.getElementById('model-status-ping');

    try {
      if (statusText) statusText.textContent = "INITIALIZING MODEL (Xenova/nli-deberta-v3-small)...";
      
      const loaded = await window.zeroShotEngine.initModel((progress) => {
        if (progress.status === 'progress' && statusText) {
          const pct = Math.round(progress.progress || 0);
          statusText.textContent = `DOWNLOADING MODEL WEIGHTS (${pct}%)...`;
        }
      });

      if (loaded) {
        if (statusText) {
          statusText.textContent = `AI MODEL READY (${window.zeroShotEngine.modelName})`;
          statusText.className = "text-emerald-400";
        }
        if (statusPing) statusPing.className = "w-2 h-2 rounded-full bg-emerald-400 animate-pulse";
        
        // Auto-run Phase 2 benchmark scenario
        loadPresetScenario('employment_telegram_fee');
      }
    } catch (err) {
      console.error("NLI Model initialization error:", err);
      if (statusText) {
        statusText.textContent = `MODEL LOAD ERROR: ${err.message || 'Network blocked'}`;
        statusText.className = "text-rose-400 font-mono";
      }
      if (statusPing) statusPing.className = "w-2 h-2 rounded-full bg-rose-500";
    }
  }

  // Theme Toggle Handler
  function initThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    themeBtn.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', state.theme);
      themeBtn.innerHTML = state.theme === 'dark' 
        ? `<i class="fa-solid fa-sun text-amber-400 text-lg"></i>` 
        : `<i class="fa-solid fa-moon text-indigo-500 text-lg"></i>`;
      updateChartsTheme();
    });
  }

  // Tab Navigation Handler
  function initNavigationTabs() {
    const navButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        state.activeTab = targetTab;

        navButtons.forEach(b => b.classList.remove('active', 'text-cyan-400', 'border-b-2', 'border-cyan-400'));
        btn.classList.add('active', 'text-cyan-400');

        tabPanels.forEach(panel => {
          if (panel.id === `tab-${targetTab}`) {
            panel.classList.remove('hidden');
          } else {
            panel.classList.add('hidden');
          }
        });

        if (targetTab === 'sandbox' || targetTab === 'agency') {
          setTimeout(renderCharts, 100);
        }
      });
    });
  }

  // Intake Section Handlers
  function initIntakeSection() {
    const narrativeInput = document.getElementById('narrative-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const presetSelect = document.getElementById('preset-select');

    Object.keys(presetScenarios).forEach(key => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = presetScenarios[key].name;
      presetSelect.appendChild(opt);
    });

    presetSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        loadPresetScenario(e.target.value);
      }
    });

    analyzeBtn.addEventListener('click', async () => {
      await runNarrativeAnalysis();
    });

    narrativeInput.addEventListener('input', () => {
      const charCount = document.getElementById('char-count');
      if (charCount) charCount.textContent = narrativeInput.value.length;
    });
  }

  async function loadPresetScenario(presetKey) {
    const scenario = presetScenarios[presetKey];
    if (!scenario) return;
    const narrativeInput = document.getElementById('narrative-input');
    narrativeInput.value = scenario.text;
    document.getElementById('char-count').textContent = scenario.text.length;
    state.completionFields = {};
    await runNarrativeAnalysis();
  }

  async function runNarrativeAnalysis() {
    const text = document.getElementById('narrative-input').value;
    state.narrativeText = text;
    state.completionFields = {};

    const analyzeBtn = document.getElementById('analyze-btn');
    if (analyzeBtn) {
      analyzeBtn.disabled = true;
      analyzeBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Structuring Case Record...`;
    }

    try {
      state.analysisResult = await window.zeroShotEngine.analyzeNarrative(text);

      renderIntakeSummary(state.analysisResult);
      renderDynamicForm(state.analysisResult);
      renderAgencyRouting(state.analysisResult);
      renderCharts();
      updateTimelineFromEntities(state.analysisResult.entities);
      updateFinancialsFromEntities(state.analysisResult.entities);
      renderAffidavitPreview();

    } catch (err) {
      console.error("Narrative Analysis failed:", err);
      alert(`Model Inference Error: ${err.message || 'Engine failed'}`);
    } finally {
      if (analyzeBtn) {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = `<i class="fa-solid fa-microchip"></i><span>Run Zero-Shot Model Inference</span>`;
      }
    }
  }

  // Render Summary Cards & Case Completion Panel in Intake View (Phase 3 Output)
  function renderIntakeSummary(result) {
    const match = result.primaryMatch;
    const rec = result.structured_case_record || {};
    
    // 1. FRAUD UNDERSTANDING
    document.getElementById('primary-category-label').textContent = result.detected_category || match.label;
    document.getElementById('primary-category-badge').textContent = match.category;
    
    const pctScore = Math.round((result.confidence || 0) * 100);
    document.getElementById('confidence-meter-text').textContent = `${pctScore}% Semantic Confidence`;
    document.getElementById('confidence-meter-bar').style.width = `${pctScore}%`;

    const matchStrength = result.semantic_match_strength || pctScore;
    document.getElementById('novelty-score-text').textContent = `${matchStrength}%`;
    document.getElementById('novelty-meter-bar').style.width = `${matchStrength}%`;

    // 2. CASE FACTS & EXTRACTED ENTITIES
    const entityContainer = document.getElementById('extracted-entities-list');
    entityContainer.innerHTML = '';

    if (rec.victim_loss && rec.victim_loss.amount) {
      const currSymbol = rec.victim_loss.currency === "INR" ? "₹" : "$";
      entityContainer.appendChild(createEntityPill('fa-indian-rupee-sign text-emerald-400', `Amount: ${currSymbol}${rec.victim_loss.amount.toLocaleString()}`));
    }
    if (rec.victim_loss && rec.victim_loss.payment_method) {
      entityContainer.appendChild(createEntityPill('fa-credit-card text-cyan-400', `Payment: ${rec.victim_loss.payment_method}`));
    }
    if (rec.platform) {
      entityContainer.appendChild(createEntityPill('fa-comments text-indigo-400', `Platform: ${rec.platform}`));
    }
    if (rec.promised_service_or_product) {
      entityContainer.appendChild(createEntityPill('fa-briefcase text-amber-400', `Promised: ${rec.promised_service_or_product}`));
    }
    if (rec.personal_information_requested && rec.personal_information_requested.length > 0) {
      entityContainer.appendChild(createEntityPill('fa-id-card text-purple-400', `Personal Info: ${rec.personal_information_requested.join(', ')}`));
    }
    if (rec.current_status) {
      entityContainer.appendChild(createEntityPill('fa-user-slash text-rose-400', `Status: ${rec.current_status}`));
    }

    // 3. RENDER EVIDENCE MAP
    renderEvidenceMap(result);

    // 4. RENDER CASE COMPLETION FORM & RECALCULATE READINESS
    renderCaseCompletionForm(result);
  }

  function renderEvidenceMap(result) {
    const rec = result.structured_case_record || {};
    const map = window.zeroShotEngine.generateEvidenceMap(rec, state.evidenceItems, state.completionFields);
    result.evidence_map = map;

    const container = document.getElementById('evidence-map-container');
    if (!container) return;
    container.innerHTML = '';

    Object.keys(map).forEach(key => {
      const item = map[key];
      const isAvail = item.status === "AVAILABLE";
      
      const card = document.createElement('div');
      card.className = `p-2.5 rounded-lg border text-xs flex items-center justify-between ${
        isAvail ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-slate-900/60 border-slate-800 text-slate-400'
      }`;

      card.innerHTML = `
        <div class="space-y-0.5">
          <div class="font-bold flex items-center space-x-1.5">
            <i class="fa-solid ${isAvail ? 'fa-check-circle text-emerald-400' : 'fa-circle-xmark text-slate-500'}"></i>
            <span>${item.category}</span>
          </div>
          <div class="text-[11px] ${isAvail ? 'text-emerald-300' : 'text-slate-500'}">
            ${item.evidence.length > 0 ? item.evidence.join(', ') : 'No attached evidence recorded'}
          </div>
        </div>
        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
          isAvail ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'
        }">${item.status}</span>
      `;

      container.appendChild(card);
    });
  }

  function renderCaseCompletionForm(result) {
    const rec = result.structured_case_record || {};
    const readinessInfo = window.zeroShotEngine.recalculateReadiness(rec, state.completionFields, result.evidence_map);

    // Update Top Readiness Badge
    const readinessBadge = document.getElementById('novelty-badge');
    if (readinessBadge) {
      if (readinessInfo.status === "READY") {
        readinessBadge.className = 'px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
        readinessBadge.innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i> READINESS: READY`;
      } else if (readinessInfo.status === "PARTIALLY_READY") {
        readinessBadge.className = 'px-3 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40';
        readinessBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> READINESS: PARTIALLY_READY`;
      } else {
        readinessBadge.className = 'px-3 py-1 text-xs font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40';
        readinessBadge.innerHTML = `<i class="fa-solid fa-circle-xmark mr-1"></i> READINESS: INCOMPLETE`;
      }
    }

    // Update Readiness Explanation Box
    const explanationBox = document.getElementById('readiness-explanation-box');
    if (explanationBox) {
      explanationBox.innerHTML = `
        <div class="flex items-center space-x-2">
          <span class="font-bold uppercase font-mono ${
            readinessInfo.status === "READY" ? 'text-emerald-400' : (readinessInfo.status === "PARTIALLY_READY" ? 'text-amber-400' : 'text-rose-400')
          }">${readinessInfo.status}</span>
          <span>— ${readinessInfo.explanation}</span>
        </div>
      `;
    }

    // Render Missing Field Intake Form
    const formContainer = document.getElementById('missing-fields-completion-form');
    if (!formContainer) return;
    formContainer.innerHTML = '';

    const missingConfig = [
      {
        key: "transaction_date",
        name: "Transaction Date",
        why: "Identifies exact date funds were moved and establishes timeline for bank dispute rules.",
        type: "date",
        placeholder: "e.g. 2026-09-20"
      },
      {
        key: "transaction_reference",
        name: "Transaction / Reference ID (UTR / IMAD)",
        why: "Essential reference number required by banking institutions and cybercrime authorities.",
        type: "text",
        placeholder: "e.g. TEST-ONLY-UPI-12345 or UTR number"
      },
      {
        key: "recipient_details",
        name: "Recipient UPI ID / Handle / Phone",
        why: "Identifies receiving fraudulent account or suspect handle.",
        type: "text",
        placeholder: "e.g. example@upi or Telegram handle"
      },
      {
        key: "evidence_attached",
        name: "Evidence / Screenshots Description",
        why: "Corroborates narrative statement with verified receipt or chat logs.",
        type: "text",
        placeholder: "e.g. UPI payment screenshot, Telegram chat screenshots"
      }
    ];

    missingConfig.forEach(field => {
      const currentValue = state.completionFields[field.key] || "";
      const isUnavailable = currentValue === "NOT_AVAILABLE";

      const card = document.createElement('div');
      card.className = 'p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5';

      card.innerHTML = `
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold text-slate-200 uppercase tracking-wider">${field.name}</label>
          <label class="inline-flex items-center space-x-1.5 cursor-pointer text-[11px] text-slate-400 hover:text-slate-200">
            <input type="checkbox" class="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500 missing-not-avail-chk" data-key="${field.key}" ${isUnavailable ? 'checked' : ''}>
            <span>I don't have this information</span>
          </label>
        </div>
        <p class="text-[11px] text-slate-400 leading-snug">${field.why}</p>
        <input type="${field.type}" value="${isUnavailable ? '' : currentValue}" ${isUnavailable ? 'disabled placeholder="Marked as Not available"' : `placeholder="${field.placeholder}"`} class="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none missing-field-input" data-key="${field.key}">
      `;

      formContainer.appendChild(card);
    });

    // Wire Up Field Handlers
    formContainer.querySelectorAll('.missing-field-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const key = e.target.dataset.key;
        if (e.target.value.trim()) {
          state.completionFields[key] = e.target.value.trim();
        } else {
          delete state.completionFields[key];
        }
        recalculateAndRefreshUI();
      });
    });

    formContainer.querySelectorAll('.missing-not-avail-chk').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const key = e.target.dataset.key;
        const textInput = formContainer.querySelector(`.missing-field-input[data-key="${key}"]`);
        
        if (e.target.checked) {
          state.completionFields[key] = "NOT_AVAILABLE";
          if (textInput) {
            textInput.value = "";
            textInput.disabled = true;
            textInput.placeholder = "Marked as Not available";
          }
        } else {
          delete state.completionFields[key];
          if (textInput) {
            textInput.disabled = false;
            textInput.placeholder = "Provide value if available";
          }
        }
        recalculateAndRefreshUI();
      });
    });
  }

  function recalculateAndRefreshUI() {
    if (!state.analysisResult) return;
    const rec = state.analysisResult.structured_case_record || {};
    
    // Regenerate evidence map
    renderEvidenceMap(state.analysisResult);
    
    // Recalculate readiness status
    const readinessInfo = window.zeroShotEngine.recalculateReadiness(rec, state.completionFields, state.analysisResult.evidence_map);
    rec.complaint_readiness = readinessInfo.status;

    // Refresh Top Badge
    const readinessBadge = document.getElementById('novelty-badge');
    if (readinessBadge) {
      if (readinessInfo.status === "READY") {
        readinessBadge.className = 'px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
        readinessBadge.innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i> READINESS: READY`;
      } else if (readinessInfo.status === "PARTIALLY_READY") {
        readinessBadge.className = 'px-3 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40';
        readinessBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> READINESS: PARTIALLY_READY`;
      } else {
        readinessBadge.className = 'px-3 py-1 text-xs font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40';
        readinessBadge.innerHTML = `<i class="fa-solid fa-circle-xmark mr-1"></i> READINESS: INCOMPLETE`;
      }
    }

    // Refresh Explanation Box
    const explanationBox = document.getElementById('readiness-explanation-box');
    if (explanationBox) {
      explanationBox.innerHTML = `
        <div class="flex items-center space-x-2">
          <span class="font-bold uppercase font-mono ${
            readinessInfo.status === "READY" ? 'text-emerald-400' : (readinessInfo.status === "PARTIALLY_READY" ? 'text-amber-400' : 'text-rose-400')
          }">${readinessInfo.status}</span>
          <span>— ${readinessInfo.explanation}</span>
        </div>
      `;
    }

    // Regenerate Formal Complaint Document & Phase 5 Indian Routing
    state.analysisResult.formal_complaint_doc = window.zeroShotEngine.generateFormalComplaintDocument(rec, state.completionFields, state.analysisResult.evidence_map);
    state.analysisResult.indian_routing = window.zeroShotEngine.evaluateIndianComplaintRouting(rec, state.completionFields);
    renderAgencyRouting(state.analysisResult);
    renderAffidavitPreview();
  }

  function createEntityPill(iconClass, text) {
    const pill = document.createElement('div');
    pill.className = 'flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-200';
    pill.innerHTML = `<i class="fa-solid ${iconClass}"></i><span>${text}</span>`;
    return pill;
  }

  // Render Dynamic Adaptive Form Fields
  function renderDynamicForm(result) {
    const container = document.getElementById('dynamic-form-fields');
    container.innerHTML = '';

    const schema = result.dynamicSchema;

    if (schema.customNotice) {
      const noticeBox = document.createElement('div');
      noticeBox.className = 'p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 text-xs leading-relaxed flex items-start space-x-3 mb-4';
      noticeBox.innerHTML = `<i class="fa-solid fa-lightbulb-on text-indigo-400 text-base mt-0.5"></i><div><strong class="font-semibold block mb-1">Genuine NLI Zero-Shot Inference Engine:</strong>${schema.customNotice}</div>`;
      container.appendChild(noticeBox);
    }

    schema.fields.forEach(field => {
      const group = document.createElement('div');
      group.className = 'space-y-1.5';

      const label = document.createElement('label');
      label.className = 'block text-xs font-semibold text-slate-300 uppercase tracking-wider';
      label.innerHTML = `${field.label} ${field.required ? '<span class="text-rose-400">*</span>' : ''}`;

      let input;
      if (field.type === 'select') {
        input = document.createElement('select');
        input.className = 'w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none';
        field.options.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = opt;
          input.appendChild(o);
        });
      } else {
        input = document.createElement('input');
        input.type = field.type;
        input.className = 'w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none';
        input.placeholder = `Enter ${field.label.toLowerCase()}`;
      }

      input.id = `dyn-field-${field.key}`;
      input.addEventListener('change', (e) => {
        state.formValues[field.key] = e.target.value;
        renderAffidavitPreview();
      });

      group.appendChild(label);
      group.appendChild(input);
      container.appendChild(group);
    });

    const evidenceList = document.getElementById('required-evidence-checklist');
    if (evidenceList) {
      evidenceList.innerHTML = '';
      schema.evidenceNeeded.forEach(item => {
        const li = document.createElement('li');
        li.className = 'flex items-center space-x-2 text-xs text-slate-300';
        li.innerHTML = `<i class="fa-solid fa-circle-check text-cyan-400 text-sm"></i><span>${item}</span>`;
        evidenceList.appendChild(li);
      });
    }
  }

  // Render Agency Routing Matrix (Phase 5 Verified Indian Complaint Routing)
  function renderAgencyRouting(result) {
    const container = document.getElementById('agency-routing-matrix');
    if (!container) return;

    const routing = result.indian_routing || window.zeroShotEngine.evaluateIndianComplaintRouting(result.structured_case_record, state.completionFields);

    if (!routing || routing.routing_status === "BENIGN_NO_ROUTING") {
      container.innerHTML = `
        <div class="col-span-full p-6 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
          <i class="fa-solid fa-circle-info text-3xl text-slate-500 mb-1"></i>
          <h4 class="text-base font-bold text-slate-200">No Fraud-Specific Routing Required</h4>
          <p class="text-xs text-slate-400">Based on the submitted narrative, no active consumer dispute or financial cyber fraud indicators were detected.</p>
        </div>
      `;
      return;
    }

    let html = '';

    // Primary Pathway Card
    if (routing.primary_pathway) {
      const p = routing.primary_pathway;
      html += `
        <div class="col-span-full p-6 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-2 border-indigo-500/50 shadow-xl space-y-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-indigo-500/30 pb-3">
            <div>
              <span class="px-2.5 py-1 text-[10px] font-extrabold font-mono rounded uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">PRIMARY RECOMMENDED PATHWAY</span>
              <h4 class="text-lg font-bold text-white mt-1 flex items-center space-x-2">
                <i class="fa-solid fa-shield-halved text-indigo-400"></i>
                <span>${p.name}</span>
              </h4>
              <p class="text-xs text-slate-400 font-medium">${p.official_source}</p>
            </div>
            <a href="${p.official_url}" target="_blank" rel="noopener noreferrer" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg flex items-center space-x-2">
              <span>Visit Official Portal</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i>
            </a>
          </div>

          <div class="space-y-2 text-xs">
            <div class="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300 leading-relaxed">
              <strong class="text-indigo-300 font-bold block mb-1"><i class="fa-solid fa-circle-question mr-1"></i> WHY THIS PATHWAY WAS SUGGESTED:</strong>
              ${p.reason}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div class="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block"><i class="fa-solid fa-phone text-emerald-400 mr-1"></i> Official Contact / Helpline:</span>
                <p class="text-xs font-mono font-bold text-emerald-300">${p.official_contact}</p>
              </div>
              <div class="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block"><i class="fa-solid fa-link text-cyan-400 mr-1"></i> Verified Filing Link:</span>
                <p class="text-xs font-mono text-cyan-300 truncate">${p.official_url}</p>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (routing.routing_status === "INSUFFICIENT_INFORMATION") {
      html += `
        <div class="col-span-full p-6 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2">
          <div class="flex items-center space-x-2 text-amber-300 font-bold text-sm">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>Insufficient Case Facts for Specific Financial Fraud Routing</span>
          </div>
          <p class="text-xs text-amber-200/80">The narrative lacks confirmed financial transaction details (amount, payment method). General guidance pathways are listed below.</p>
        </div>
      `;
    }

    // Secondary Pathways
    if (routing.secondary_pathways && routing.secondary_pathways.length > 0) {
      html += `<div class="col-span-full pt-2"><h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Secondary / Contextual Official Pathways</h4></div>`;
      routing.secondary_pathways.forEach(sec => {
        html += `
          <div class="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div class="flex items-start justify-between">
              <div>
                <span class="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-slate-800 text-slate-300 uppercase">CONTEXTUAL PATHWAY</span>
                <h5 class="text-sm font-bold text-slate-200 mt-1">${sec.name}</h5>
                <p class="text-[11px] text-slate-400">${sec.official_source}</p>
              </div>
              <a href="${sec.official_url}" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 text-xs font-bold flex items-center space-x-1">
                <span>Portal</span>
                <i class="fa-solid fa-external-link text-[10px]"></i>
              </a>
            </div>
            <p class="text-xs text-slate-400 leading-snug p-2.5 rounded bg-slate-950 border border-slate-800/80">${sec.reason}</p>
            <div class="text-[11px] font-mono text-emerald-400"><i class="fa-solid fa-phone mr-1"></i>${sec.official_contact}</div>
          </div>
        `;
      });
    }

    // Required Information Checklist (Available vs Missing)
    if (routing.required_information && routing.required_information.length > 0) {
      html += `
        <div class="col-span-full p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
            <i class="fa-solid fa-list-check text-cyan-400"></i>
            <span>Filing Parameter Availability Checklist</span>
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
      `;
      routing.required_information.forEach(item => {
        const isAvail = item.status === "AVAILABLE";
        html += `
          <div class="p-2.5 rounded-lg border text-xs flex items-center justify-between ${isAvail ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-slate-950 border-slate-800 text-slate-400'}">
            <div>
              <div class="font-bold text-[11px]">${item.field}</div>
              <div class="text-[10px] font-mono ${isAvail ? 'text-emerald-300' : 'text-slate-500'}">${item.value}</div>
            </div>
            <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold ${isAvail ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}">${item.status}</span>
          </div>
        `;
      });
      html += `</div></div>`;
    }

    // Safety Disclaimers Box
    html += `
      <div class="col-span-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
        <div class="font-bold text-amber-400 flex items-center space-x-1.5">
          <i class="fa-solid fa-shield-triangle-exclamation"></i>
          <span>Official Filing Disclaimers & Safety Notice</span>
        </div>
        <ul class="list-disc list-inside space-y-1 text-slate-400">
          ${(routing.limitations || []).map(l => `<li>${l}</li>`).join('')}
        </ul>
      </div>
    `;

    container.innerHTML = html;
  }

  // Financial Calculator Initializer
  function initFinancialCalculator() {
    const addLossBtn = document.getElementById('add-loss-btn');
    if (addLossBtn) {
      addLossBtn.addEventListener('click', () => {
        state.financialLosses.push({ description: 'Additional Loss Item', amount: 0, date: '', paymentMethod: 'Credit Card / Bank Transfer' });
        renderFinancialLosses();
      });
    }
  }

  function updateFinancialsFromEntities(entities) {
    if (entities.estimatedMaxLoss > 0) {
      state.financialLosses = [
        { description: 'Extracted Primary Loss Vector', amount: entities.estimatedMaxLoss, date: entities.dates[0] || new Date().toISOString().split('T')[0], paymentMethod: 'UPI / Electronic Transfer' }
      ];
    }
    renderFinancialLosses();
  }

  function renderFinancialLosses() {
    const container = document.getElementById('financial-loss-items');
    if (!container) return;
    container.innerHTML = '';

    let totalAmount = 0;

    state.financialLosses.forEach((item, index) => {
      totalAmount += parseFloat(item.amount) || 0;

      const row = document.createElement('div');
      row.className = 'grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 rounded-lg bg-slate-900 border border-slate-800';

      row.innerHTML = `
        <div class="md:col-span-5">
          <input type="text" value="${item.description}" class="w-full px-3 py-1.5 text-xs rounded bg-slate-800 border border-slate-700 text-slate-200 outline-none loss-desc-input" data-index="${index}" placeholder="Description">
        </div>
        <div class="md:col-span-3">
          <div class="relative">
            <span class="absolute left-2.5 top-1.5 text-xs text-slate-500">₹</span>
            <input type="number" value="${item.amount}" class="w-full pl-6 pr-2 py-1.5 text-xs rounded bg-slate-800 border border-slate-700 text-slate-200 outline-none loss-amount-input" data-index="${index}" placeholder="0.00">
          </div>
        </div>
        <div class="md:col-span-3">
          <input type="text" value="${item.paymentMethod}" class="w-full px-3 py-1.5 text-xs rounded bg-slate-800 border border-slate-700 text-slate-200 outline-none loss-method-input" data-index="${index}" placeholder="Method">
        </div>
        <div class="md:col-span-1 text-right">
          <button class="text-rose-400 hover:text-rose-300 text-sm remove-loss-btn" data-index="${index}"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;

      container.appendChild(row);
    });

    document.getElementById('total-financial-loss').textContent = `₹${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    container.querySelectorAll('.loss-desc-input').forEach(i => i.addEventListener('change', e => {
      state.financialLosses[e.target.dataset.index].description = e.target.value;
      renderAffidavitPreview();
    }));
    container.querySelectorAll('.loss-amount-input').forEach(i => i.addEventListener('change', e => {
      state.financialLosses[e.target.dataset.index].amount = parseFloat(e.target.value) || 0;
      renderFinancialLosses();
      renderAffidavitPreview();
    }));
    container.querySelectorAll('.remove-loss-btn').forEach(b => b.addEventListener('click', e => {
      const idx = e.currentTarget.dataset.index;
      state.financialLosses.splice(idx, 1);
      renderFinancialLosses();
      renderAffidavitPreview();
    }));
  }

  // Evidence Locker & Timeline
  function initEvidenceLocker() {
    const uploadArea = document.getElementById('evidence-upload-dropzone');
    const uploadInput = document.getElementById('evidence-file-input');

    if (uploadArea && uploadInput) {
      uploadArea.addEventListener('click', () => uploadInput.click());
      uploadInput.addEventListener('change', (e) => {
        Array.from(e.target.files).forEach(file => {
          state.evidenceItems.push({
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            type: file.type || 'Document/Image',
            dateAdded: new Date().toLocaleDateString()
          });
        });
        renderEvidenceLocker();
      });
    }
  }

  function updateTimelineFromEntities(entities) {
    state.timelineEvents = [
      { date: entities.dates[0] || 'Day 1', title: 'Initial Suspect Contact / Fraud Initiation', desc: 'First communications established via spoofed channel or malicious site.' },
      { date: entities.dates[1] || 'Incident Date', title: 'Unauthorized Transaction Execution', desc: `Funds transferred. Primary loss estimated at ₹${entities.estimatedMaxLoss.toLocaleString()}` },
      { date: new Date().toLocaleDateString(), title: 'Fraud Discovery & Immediate Mitigation', desc: 'Victim discovered deception, gathered initial evidence, and initiated affidavit filing.' }
    ];
    renderTimeline();
  }

  function renderTimeline() {
    const container = document.getElementById('incident-timeline-list');
    if (!container) return;
    container.innerHTML = '';

    state.timelineEvents.forEach((ev, idx) => {
      const item = document.createElement('div');
      item.className = 'relative pl-6 pb-6 border-l-2 border-indigo-500/40 last:pb-0';
      item.innerHTML = `
        <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-2 border-slate-900"></div>
        <div class="text-xs font-semibold text-indigo-400 mb-1">${ev.date}</div>
        <h5 class="text-sm font-bold text-slate-200 mb-1">${ev.title}</h5>
        <p class="text-xs text-slate-400">${ev.desc}</p>
      `;
      container.appendChild(item);
    });
  }

  function renderEvidenceLocker() {
    const container = document.getElementById('evidence-files-list');
    if (!container) return;
    container.innerHTML = '';

    if (state.evidenceItems.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-xs text-slate-500 italic">No evidence files attached yet. Drag & drop files above.</div>`;
      return;
    }

    state.evidenceItems.forEach((file, idx) => {
      const card = document.createElement('div');
      card.className = 'flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300';
      card.innerHTML = `
        <div class="flex items-center space-x-3">
          <i class="fa-solid fa-file-shield text-cyan-400 text-base"></i>
          <div>
            <div class="font-semibold text-slate-200">${file.name}</div>
            <div class="text-[11px] text-slate-500">${file.size} • ${file.type}</div>
          </div>
        </div>
        <button class="text-rose-400 hover:text-rose-300 remove-ev-btn" data-index="${idx}"><i class="fa-solid fa-trash"></i></button>
      `;
      container.appendChild(card);
    });

    container.querySelectorAll('.remove-ev-btn').forEach(b => b.addEventListener('click', e => {
      const idx = e.currentTarget.dataset.index;
      state.evidenceItems.splice(idx, 1);
      renderEvidenceLocker();
    }));
  }

  function initSandboxSection() {
    const recalcBtn = document.getElementById('recalculate-sandbox-btn');
    if (recalcBtn) {
      recalcBtn.addEventListener('click', () => {
        renderCharts();
      });
    }
  }

  // Chart.js Chart Renderers
  let candidateChart = null;
  let radarChart = null;

  function renderCharts() {
    if (!state.analysisResult) return;

    // 1. Candidate Hypothesis Bar Chart
    const ctxBar = document.getElementById('candidate-scores-chart');
    if (ctxBar) {
      const topCandidates = (state.analysisResult.candidate_scores || state.analysisResult.candidateScores || []).slice(0, 5);
      const labels = topCandidates.map(c => c.label.length > 28 ? c.label.substring(0, 28) + '...' : c.label);
      const data = topCandidates.map(c => Math.round((c.entailment || c.rawScore || 0) * 100));

      if (candidateChart) candidateChart.destroy();

      candidateChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'DeBERTa NLI Model Entailment (%)',
            data,
            backgroundColor: [
              'rgba(6, 182, 212, 0.85)',
              'rgba(99, 102, 241, 0.75)',
              'rgba(139, 92, 246, 0.65)',
              'rgba(16, 185, 129, 0.55)',
              'rgba(245, 158, 11, 0.45)'
            ],
            borderColor: [
              '#06b6d4', '#6366f1', '#8b5cf6', '#10b981', '#f59e0b'
            ],
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => ` NLI Softmax Probability: ${context.raw}%`
              }
            }
          },
          scales: {
            x: {
              max: 100,
              grid: { color: 'rgba(255, 255, 255, 0.08)' },
              ticks: { color: '#94a3b8' }
            },
            y: {
              grid: { display: false },
              ticks: { color: '#f8fafc', font: { size: 11 } }
            }
          }
        }
      });
    }

    // 2. Latent Vector Radar Chart
    const ctxRadar = document.getElementById('primitives-radar-chart');
    if (ctxRadar) {
      if (radarChart) radarChart.destroy();

      const topConfidence = state.analysisResult.confidence ? Math.round(state.analysisResult.confidence * 100) : 50;

      radarChart = new Chart(ctxRadar, {
        type: 'radar',
        data: {
          labels: ['Model Entailment', 'Entity Density', 'Financial Impact', 'Completeness Score', 'Dynamic Field Count', 'Jurisdiction Reach'],
          datasets: [{
            label: 'Inferred Fraud Vector Metrics',
            data: [
              topConfidence,
              Math.min(95, state.analysisResult.entities.phoneNumbers.length * 25 + state.analysisResult.entities.urls.length * 25 + 20),
              Math.min(100, Math.log10(state.analysisResult.entities.estimatedMaxLoss + 1) * 20),
              state.analysisResult.structured_case_record && state.analysisResult.structured_case_record.complaint_readiness === 'READY' ? 95 : 60,
              state.analysisResult.dynamicSchema.fields.length * 20,
              50
            ],
            fill: true,
            backgroundColor: 'rgba(99, 102, 241, 0.25)',
            borderColor: '#6366f1',
            pointBackgroundColor: '#06b6d4',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#6366f1'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            r: {
              angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' },
              pointLabels: { color: '#94a3b8', font: { size: 10 } },
              ticks: { display: false, max: 100 }
            }
          }
        }
      });
    }
  }

  function updateChartsTheme() {
    renderCharts();
  }

  // Formal Affidavit Renderer & Exporters
  function initAffidavitExporter() {
    const copyBtn = document.getElementById('copy-affidavit-btn');
    const printBtn = document.getElementById('print-affidavit-btn');
    const jsonBtn = document.getElementById('export-json-btn');

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const text = generateAffidavitText();
        navigator.clipboard.writeText(text).then(() => {
          alert('Formal Complaint Affidavit copied to clipboard!');
        });
      });
    }

    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    if (jsonBtn) {
      jsonBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `Consumer_Fraud_CaseFile_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      });
    }
  }

  function generateAffidavitText() {
    if (!state.analysisResult) return 'No analysis performed yet.';

    const res = state.analysisResult;
    const rec = res.structured_case_record || {};
    const map = res.evidence_map || window.zeroShotEngine.generateEvidenceMap(rec, state.evidenceItems, state.completionFields);

    return window.zeroShotEngine.generateFormalComplaintDocument(rec, state.completionFields, map);
  }

  function renderAffidavitPreview() {
    const container = document.getElementById('affidavit-preview-container');
    if (!container) return;

    if (!state.analysisResult) {
      container.innerHTML = `<div class="text-center text-slate-500 py-10">Run narrative analysis to generate legal affidavit preview.</div>`;
      return;
    }

    const text = generateAffidavitText();
    container.innerHTML = `
      <div class="legal-document legal-document-dark shadow-2xl text-xs sm:text-sm font-mono whitespace-pre-wrap leading-relaxed border border-slate-700/60 rounded-xl p-6">
        ${escapeHtml(text)}
      </div>
    `;
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
