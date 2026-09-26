# Phase 5 — Verified Indian Complaint Routing & Filing Guidance

## A. Official Sources

The Phase 5 routing engine relies exclusively on verified official Government of India and official industry payment authority channels:

1. **National Consumer Helpline (NCH)**
   - **Operating Authority**: Department of Consumer Affairs, Ministry of Consumer Affairs, Food & Public Distribution, Government of India.
   - **Official Website**: [https://consumerhelpline.gov.in/](https://consumerhelpline.gov.in/)
   - **National Helpline**: `1915`
   - **Toll-Free Helpline**: `1800-11-4000`
   - **WhatsApp / SMS Contact**: `8800001915`
   - **Scope**: Pre-litigation consumer grievance redressal mechanism for commercial disputes involving goods, e-commerce marketplace sellers, service providers, or deceptive trade practices.

2. **National Cyber Crime Reporting Portal & Emergency Helpline 1930**
   - **Operating Authority**: Ministry of Home Affairs, Government of India.
   - **Official Website**: [https://cybercrime.gov.in/](https://cybercrime.gov.in/)
   - **Emergency Helpline**: `1930` (24x7 National Cyber Financial Fraud Helpline)
   - **Scope**: Centralized reporting portal and emergency helpline for financial cyber fraud, online phishing, digital impersonation, unauthorized electronic payment transfers, and cybercrime incidents.

3. **NPCI / UPI Payment System Dispute Pathway**
   - **Operating Authority**: National Payments Corporation of India (NPCI).
   - **Official Website**: [https://www.npci.org.in/](https://www.npci.org.in/)
   - **Resolution Channel**: Payment Service Provider (PSP) App (Google Pay, PhonePe, Paytm, BHIM) / Issuing Bank Customer Care; Escalation via NPCI portal.
   - **Scope**: Guidance for lodging transaction disputes with payment service providers and issuing banks for UPI transfers.
   - **Mandatory Clarification**: NPCI is a payment clearing house and retail payments umbrella organization, **NOT** a criminal investigation authority.

---

## B. Routing Logic

The routing engine (`evaluateIndianComplaintRouting`) is implemented as a dedicated deterministic layer that consumes the **EXISTING** `structured_case_record` generated during Phase 2.

### Key Architectural Principles:
1. **Zero Re-Classification**: The routing layer does **NOT** run a second zero-shot model inference or keyword classifier. It reads structured case attributes (`victim_loss`, `platform`, `fraud_category`, `incident_summary`, `suspect_information`).
2. **Fact-Based Evaluation**:
   - **Financial Cyber Fraud**: Apparent financial loss (`amount > 0`) + digital payment method (UPI, Debit/Credit Card, Net Banking, Crypto) or online platform (Telegram, WhatsApp, Web Portal) or cyber extortion/job scam -> **Primary Pathway**: National Cyber Crime Reporting Portal & Helpline 1930 (`https://cybercrime.gov.in/`).
   - **UPI Payment Dispute**: If payment method is `UPI` -> **Contextual Pathway**: NPCI / PSP Dispute Mechanism (`https://www.npci.org.in/`).
   - **Consumer Merchant Grievance**: Merchant non-delivery, defective goods, subscription trap, or e-commerce seller dispute without cyber extortion -> **Primary Pathway**: National Consumer Helpline (`https://consumerhelpline.gov.in/`).
   - **Non-Financial / Insufficient Info**: Narrative lacks confirmed financial transaction parameters -> **Routing Status**: `INSUFFICIENT_INFORMATION`. Lists missing parameters without forcing false financial fraud routing.
   - **Benign Narrative**: Non-fraud / benign narrative -> **Routing Status**: `BENIGN_NO_ROUTING`. No forced routing.

---

## C. Example Case Step-by-Step Trace

### Victim Input Narrative:
> *"I joined a Telegram group where someone promised me a software job. They asked me to pay ₹8,000 as a registration fee through UPI. I sent the money and shared my Aadhaar number and bank account details. After that they blocked me."*

### Phase 2 Structured Case Record:
```json
{
  "fraud_category": "Fake Job Offer & Registration Fee Extortion",
  "semantic_confidence": 87,
  "incident_summary": "I joined a Telegram group where someone promised me a software job...",
  "victim_loss": {
    "amount": 8000,
    "currency": "INR",
    "payment_method": "UPI"
  },
  "platform": "Telegram",
  "suspect_information": ["Phone: +91 9876543210"],
  "personal_information_requested": ["Aadhaar number", "Bank account details"],
  "current_status": "Blocked after payment",
  "incident_date": null,
  "transaction_reference": null,
  "missing_information": [
    "Transaction date",
    "Transaction / Reference ID (UTR / IMAD)",
    "Recipient details / Suspect phone / handle",
    "Screenshots / Chat history evidence"
  ],
  "complaint_readiness": "PARTIALLY_READY"
}
```

### Phase 5 Routing Result:
```json
{
  "routing_status": "ROUTED",
  "primary_pathway": {
    "id": "cyber_crime_1930",
    "name": "National Cyber Crime Reporting Portal & Emergency Helpline 1930",
    "official_source": "Ministry of Home Affairs, Government of India",
    "helpline": "1930",
    "official_contact": "Call 1930 (Emergency Helpline) / Cyber Crime Reporting Portal",
    "official_url": "https://cybercrime.gov.in/",
    "reason": "Recommended because the case contains an apparent financial loss (INR 8,000) involving a digital payment channel / online platform (Telegram)."
  },
  "secondary_pathways": [
    {
      "id": "npci_upi_dispute",
      "name": "NPCI / UPI Payment System Dispute Pathway",
      "official_source": "National Payments Corporation of India (NPCI)",
      "official_contact": "Raise dispute in PSP App (GPay, PhonePe, Paytm, BHIM) or Bank; Escalate via NPCI portal",
      "official_url": "https://www.npci.org.in/",
      "reason": "Relevant for lodging an immediate transaction dispute with your Payment Service Provider (GPay/PhonePe/Paytm/BHIM) or issuing bank."
    },
    {
      "id": "national_consumer_helpline",
      "name": "National Consumer Helpline (NCH)",
      "official_source": "Department of Consumer Affairs, Government of India",
      "official_contact": "Helpline: 1915 | Alt: 1800-11-4000 | WhatsApp/SMS: 8800001915",
      "official_url": "https://consumerhelpline.gov.in/",
      "reason": "National Consumer Helpline may be relevant if the dispute involves a commercial entity or service provider."
    }
  ],
  "required_information": [
    { "field": "Loss Amount", "status": "AVAILABLE", "value": "INR 8,000" },
    { "field": "Payment Method", "status": "AVAILABLE", "value": "UPI" },
    { "field": "Incident / Transaction Date", "status": "MISSING", "value": "Not provided" },
    { "field": "Transaction / UTR Reference ID", "status": "MISSING", "value": "Not provided" },
    { "field": "Communication Platform", "status": "AVAILABLE", "value": "Telegram" },
    { "field": "Recipient / Suspect Contact", "status": "AVAILABLE", "value": "Phone: +91 9876543210" }
  ],
  "limitations": [
    "This routing is guidance based on victim-supplied case parameters and does not replace official instructions from authorities.",
    "This system does not make formal legal determinations or provide legal advice.",
    "Filing a complaint does not guarantee financial recovery or legal resolution."
  ]
}
```

---

## D. Safety Constraints Compliance

- **No Legal Determination**: The system explicitly disclaims formal legal conclusions.
- **No Fabricated Data**: Missing fields are rendered as `"Not provided"` or `"Not available"`.
- **No Recovery Guarantees**: Prominently displays that filing a complaint does not guarantee financial recovery or legal resolution.
- **Verified Official Links Only**: Uses strictly verified URLs (`https://cybercrime.gov.in/`, `https://consumerhelpline.gov.in/`, `https://www.npci.org.in/`). Unverified or third-party links are never generated.
- **Zero Second Classifier**: Routing relies exclusively on structured case facts without invoking a second machine learning model.
- **Zero-Shot NLI Preservation**: Core `Xenova/nli-deberta-v3-small` zero-shot NLI engine remains untouched and fully functional.

---

## E. Integration Test Results

| Test ID | Test Scenario | Routing Status | Primary Recommended Pathway | Verified Official URL | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST 1** | Telegram Fake Job Scam (₹8,000, UPI) | `ROUTED` | National Cyber Crime Reporting Portal & Helpline 1930 | `https://cybercrime.gov.in/` | **PASSED** |
| **TEST 2** | Online Purchase / Service Grievance ($450) | `ROUTED` | National Consumer Helpline (NCH) | `https://consumerhelpline.gov.in/` | **PASSED** |
| **TEST 3** | Non-Financial / No Payment Info Case | `INSUFFICIENT_INFORMATION` | None (Avoided False Financial Routing) | N/A | **PASSED** |
| **TEST 4** | Missing Transaction Reference Case | `ROUTED` | National Cyber Crime Reporting Portal & Helpline 1930 (UTR: MISSING) | `https://cybercrime.gov.in/` | **PASSED** |
| **TEST 5** | Completely Benign Narrative | `BENIGN_NO_ROUTING` | None (No Forced Fraud Routing) | N/A | **PASSED** |

### Phase 1–4 Preservation Verification:
- **Phase 1 Zero-Shot NLI Inference**: 100% Preserved (`Xenova/nli-deberta-v3-small`).
- **Phase 2 Structured Case Record**: 100% Preserved.
- **Phase 3 Evidence-Guided Complaint Generator**: 100% Preserved.
- **Phase 4 Empirical Zero-Shot Evaluation Suite**: 100% Preserved.

---

## F. System Limitations

1. **Informational Filing Guidance Only**: System routing provides preliminary filing guidance based on victim-supplied narratives and case facts.
2. **Does Not Substitute Official Intake**: Guidance does not replace official filing protocols, verification, or instructions issued by law enforcement, police stations, or statutory tribunals.
3. **No Direct Submission**: The system does not automatically submit complaints to government APIs or external portals.
