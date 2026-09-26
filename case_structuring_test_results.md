# Phase 2: Case Structuring & Readiness Test Results

- **Evaluation Date**: September 26, 2026
- **Test Narrative**: *"I joined a Telegram group where someone promised me a software job. They asked me to pay ₹8,000 as a registration fee through UPI. I sent the money and shared my Aadhaar number and bank account details. After that they blocked me."*

---

## 1. Extracted Structured Case Record JSON

```json
{
  "fraud_category": "Fake Job Offer & Registration Fee Extortion",
  "semantic_confidence": 87,
  "incident_summary": "I joined a Telegram group where someone promised me a software job. They asked me to pay ₹8,000 as a registration fee through UPI. I sent the money and shared my Aadhaar number and bank account details. After that they blocked me.",
  "victim_loss": {
    "amount": 8000,
    "currency": "INR",
    "payment_method": "UPI"
  },
  "platform": "Telegram",
  "suspect_information": [],
  "promised_service_or_product": "Software job / Employment opportunity",
  "incident_date": null,
  "transaction_reference": null,
  "communication_details": [
    "Telegram"
  ],
  "personal_information_requested": [
    "Aadhaar number",
    "Bank account details"
  ],
  "current_status": "Blocked after payment",
  "evidence_available": [],
  "missing_information": [
    "Transaction date",
    "Transaction / Reference ID (UTR / IMAD)",
    "Suspect contact / account details",
    "Screenshots / Chat history evidence"
  ],
  "complaint_readiness": "PARTIALLY_READY"
}
```

---

## 2. Verification Checkpoint Audit

| Verification Criteria | Observed Result | Pass/Fail |
| :--- | :--- | :---: |
| **No Invented Transaction Date** | `incident_date: null` | ✅ **PASS** |
| **No Invented Reference / UTR ID** | `transaction_reference: null` | ✅ **PASS** |
| **No Invented Phone Number** | `suspect_information: []` | ✅ **PASS** |
| **No Invented Suspect Identity** | `suspect_information: []` | ✅ **PASS** |
| **Exact Fact Extraction** | `amount: 8000`, `currency: "INR"`, `method: "UPI"` | ✅ **PASS** |
| **Missing Info Identified** | Date, UTR, suspect handle, chat evidence listed | ✅ **PASS** |
| **Complaint Readiness Rating** | `PARTIALLY_READY` | ✅ **PASS** |
| **Regulatory Routing Safety** | `"Regulatory routing: Not yet evaluated."` | ✅ **PASS** |
| **Zero-Shot NLI Functionality** | Preserved via `Xenova/nli-deberta-v3-small` model | ✅ **PASS** |
