# PRODUCTION DEPLOYMENT & LIVE DEMO CHECKLIST

## 1. PRE-DEPLOYMENT ENVIRONMENT CHECKLIST

- [x] **Static Asset Bundling**: All HTML, CSS (`styles.css`), JavaScript (`js/*.js`), images (`hero_banner.jpg`), and evaluation datasets (`data/**/*.json`) are referenced using relative paths.
- [x] **Vercel / Netlify Configuration**: `vercel.json` includes static deployment rules and headers for Cross-Origin-Opener-Policy (`same-origin`) and Cross-Origin-Embedder-Policy (`credentialless`).
- [x] **No External Backend Server Dependency**: 100% of zero-shot NLI inference, evidence OCR, and complaint generation execute client-side in the browser runtime.

---

## 2. SECURITY & PRIVACY CHECKLIST

- [x] **XSS Input Escaping**: All user-provided narrative text, completion fields, and evidence payloads pass through `escapeHtml` before DOM rendering. `<script>` and `<img onerror>` tags are rendered strictly as raw text.
- [x] **Sensitive Data Masking**: Aadhaar numbers (`XXXX-XXXX-1234`), bank account numbers (`XXXX-XXXX-5678`), UPI IDs (`v***m@upi`), and phone numbers (`+91 XXXX-XX3210`) are masked in logs via `EvidenceOcrEngine.maskSensitiveData`.
- [x] **Local Data Boundary**: Privacy Notice banner informs victims that all evidence intake, OCR, and analysis run locally in the browser. Zero victim data is transmitted to external servers.
- [x] **File Validation**: Uploaded files exceeding 10MB return `UNSUPPORTED_SIZE`. Dangerous file extensions (`.exe`, `.sh`, `.bat`) return `UNSUPPORTED_FORMAT`.

---

## 3. ZERO-SHOT MODEL & OCR ENGINE CHECKLIST

- [x] **Model Specification**: NLI Model `Xenova/nli-deberta-v3-small` configured via Transformers.js module import.
- [x] **CDN Fallback & Model Caching**: In-browser weight caching via IndexedDB/CacheStorage with fallback gracefully handled.
- [x] **Zero-Shot Transparency**: UI explicitly displays model specification, inference type, candidate entailment scores, and disclaimer that the pretrained NLI model is evaluating natural language hypotheses without fine-tuning or hard-coded rules.
- [x] **OCR Engine Fallback**: Client-side canvas text parsing and Tesseract.js OCR engine process images and text documents. Failed or unreadable images return `OCR_FAILED` with 0 fabricated facts.

---

## 4. 10-STEP LIVE DEMO FLOW VERIFICATION

- [x] **STEP 1 — Tell What Happened**: Victim enters narrative or selects preset benchmark scenario.
- [x] **STEP 2 — AI Fraud Understanding**: Model outputs top entailment category, candidate hypotheses scores, and novelty index.
- [x] **STEP 3 — Structured Case Record**: Loss amount, payment method, platform, and date extracted into structured schema.
- [x] **STEP 4 — Missing Information**: Dynamic schema identifies missing fields required for complaint readiness.
- [x] **STEP 5 — Upload Evidence**: File dropzone accepts `.PNG`, `.JPG`, `.PDF`, `.TXT` under 10MB.
- [x] **STEP 6 — Evidence Extraction / OCR**: Deterministic OCR extracts transaction amount, UTR/reference, date, and handles.
- [x] **STEP 7 — Review & Confirm Facts**: Human-in-the-loop confirmation converts `UNVERIFIED` facts to `USER_CONFIRMED`.
- [x] **STEP 8 — Complaint Readiness**: Status badges display `READY`, `PARTIALLY_READY`, or `INCOMPLETE`.
- [x] **STEP 9 — Generate Complaint**: Formal draft complaint rendered with zero unanchored/fabricated facts.
- [x] **STEP 10 — Indian Filing Guidance**: Verified filing guidance routes financial cyber fraud to **1930** / Cyber Crime Reporting Portal, e-commerce grievances to National Consumer Helpline **1915**, and payment disputes to NPCI/PSP bank pathways.

---

## 5. REPEAT REGRESSION SUITE VERIFICATION

- [x] **Phase 1–4 Benchmark**: 20 / 20 PASSED
- [x] **Phase 5 Routing**: ROUTED / BENIGN VERIFIED
- [x] **Phase 6A Provenance**: 7 / 7 PASSED
- [x] **Phase 6B Extraction**: 12 / 12 PASSED
- [x] **Phase 6C OCR**: 17 / 17 PASSED
- [x] **Phase 7 E2E Validation**: 7 / 7 PASSED
- [x] **Phase 8 Security & Privacy**: 12 / 12 PASSED
- [x] **Phase 9 Deployment**: 11 / 11 PASSED
- [x] **Fabricated Facts Count**: 0
- [x] **Final Verdict**: **DEMO READY & DEPLOYED**
