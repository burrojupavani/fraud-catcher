# Phase 3 Evaluation Results — Evidence-Guided Complaint Generation

## Executive Summary
This document records the evaluation of **Phase 3 — Evidence-Guided Complaint Generation** for the Consumer Fraud Complaint Assistant.

All tests were conducted without modifying or bypassing the genuine zero-shot NLI classifier (`Xenova/nli-deberta-v3-small`). Strict adherence to the **No-Hallucination Rule** was maintained across all cases.

---

## 1. Test Case 1: Telegram Employment Fraud (Completed Case)

### Initial Input Narrative
> "I joined a Telegram group where someone promised me a software job. They asked me to pay ₹8,000 as a registration fee through UPI. I sent the money and shared my Aadhaar number and bank account details. After that they blocked me."

### Initial Evaluation & Case Structuring
- **Fraud Category**: Fake Job Offer & Registration Fee Extortion
- **Semantic Confidence**: 87%
- **Loss Amount**: ₹8,000 (INR)
- **Payment Method**: UPI
- **Platform**: Telegram
- **Promised Service**: Software job / Employment opportunity
- **Personal Information Shared**: Aadhaar number, Bank account details
- **Current Status**: Blocked after payment
- **Initial Complaint Readiness**: `PARTIALLY_READY`
- **Initial Missing Information**:
  - Transaction date
  - Transaction/reference ID (UTR)
  - Recipient details
  - Screenshots / chat evidence

### Victim Completion Data (Simulated Test Data)
- **Transaction Date**: `2026-09-20` (TEST DATA)
- **Transaction Reference**: `TEST-ONLY-UPI-12345` (TEST DATA)
- **Recipient Details**: `example@upi` (TEST DATA)
- **Attached Evidence**: `UPI payment screenshot, Telegram chat screenshots` (TEST DATA)

### Recalculated Complaint Readiness
- **Status**: `READY`
- **Explanation**: *"The incident, financial loss, payment details and supporting evidence are sufficiently documented for complaint drafting."*
- **Notice**: *This is NOT a legal determination.*

### Evidence Mapping
```json
{
  "financial_loss": {
    "category": "Financial Loss / Payment Evidence",
    "evidence": [
      "Transaction Reference / UTR Record (TEST-ONLY-UPI-12345)",
      "UPI / Payment receipt screenshot"
    ],
    "status": "AVAILABLE"
  },
  "communication": {
    "category": "Communication Evidence",
    "evidence": [
      "Telegram chat screenshots"
    ],
    "status": "AVAILABLE"
  },
  "identity": {
    "category": "Identity & Personal Info Evidence",
    "evidence": [
      "Aadhaar number",
      "Bank account details"
    ],
    "status": "AVAILABLE"
  }
}
```

### Generated Complaint Document
```text
CONSUMER FRAUD COMPLAINT

1. Subject
Formal Complaint Regarding Fake Job Offer & Registration Fee Extortion

2. Complainant Information
Complainant: [Victim / Complainant]
Contact Info: On file

3. Incident Summary
I joined a Telegram group where someone promised me a software job. They asked me to pay ₹8,000 as a registration fee through UPI. I sent the money and shared my Aadhaar number and bank account details. After that they blocked me.

4. Fraudulent Activity
The complainant reported an incident classified as Fake Job Offer & Registration Fee Extortion (Semantic Confidence: 87%). The perpetrator solicited funds on Telegram under the pretense of Software job / Employment opportunity. After receiving the payment, the perpetrator Blocked after payment.

5. Financial Loss
- Amount Stolen: ₹8,000
- Payment Method: UPI
- Transaction Date: 2026-09-20
- Transaction Reference Number: TEST-ONLY-UPI-12345

6. Suspect/Service Information
- Recipient / Suspect Details: example@upi
- Platform / Channel: Telegram
- Promised Product/Service: Software job / Employment opportunity

7. Communication Details
Primary communications took place over Telegram. Personal data requested during interaction: Aadhaar number, Bank account details.

8. Evidence Available
- Transaction Reference / UTR Record (TEST-ONLY-UPI-12345)
- UPI / Payment receipt screenshot
- Telegram chat screenshots

9. Missing/Unavailable Information
- None (All primary case details collected)

10. Requested Assistance
I request that the concerned authority review the incident, examine the available transaction and communication records, and take appropriate action under the applicable procedures.

11. Declaration
I declare that the information provided above is true and accurate to the best of my knowledge based on the facts available.
```

---

## 2. Test Case 2: Unknown Information Test (Missing Reference ID)

### Narrative Input
> "I joined a Telegram group where someone promised me a software job. They asked me to pay ₹8,000 as a registration fee through UPI. I sent the money and shared my Aadhaar number and bank account details. After that they blocked me."

### Victim Completion Data
- **Transaction Reference**: Marked `"I don't have this information"` (`NOT_AVAILABLE`)

### Verification Results
- **Transaction Reference in Complaint**: `Not available`
- **Hallucinated Reference ID**: None (0 instances of fabricated numbers).
- **Complaint Readiness**: `PARTIALLY_READY`

### Generated Complaint Excerpt (Section 5 & Section 9)
```text
5. Financial Loss
- Amount Stolen: ₹8,000
- Payment Method: UPI
- Transaction Date: Not available
- Transaction Reference Number: Not available

9. Missing/Unavailable Information
- Transaction date: Not available
- Transaction reference number: Not available
```

---

## 3. Test Case 3: Unseen Fraud Test (Freelance Design Certificate Scam)

### Input Narrative
> "I found a freelance design opportunity through an online community. They asked me to pay ₹3,500 for a mandatory verification certificate. After I paid, the account disappeared and the website stopped working."

### Zero-Shot Classifier Analysis (No Custom Rules Added)
- **Model**: `Xenova/nli-deberta-v3-small`
- **Primary Hypothesis Match**: Fake Job Offer & Registration Fee Extortion / E-Commerce Non-Delivery
- **Semantic Confidence**: 84%
- **Extracted Loss**: ₹3,500
- **Platform**: Web Portal / Site (Online community)
- **Promised Service**: Freelance verification certificate
- **Current Status**: Suspect account disappeared / site stopped working

### Evidence Mapping
```json
{
  "financial_loss": {
    "category": "Financial Loss / Payment Evidence",
    "evidence": [],
    "status": "MISSING"
  },
  "communication": {
    "category": "Communication Evidence",
    "evidence": [],
    "status": "MISSING"
  },
  "identity": {
    "category": "Identity & Personal Info Evidence",
    "evidence": [],
    "status": "MISSING"
  }
}
```

### Generated Complaint Document
```text
CONSUMER FRAUD COMPLAINT

1. Subject
Formal Complaint Regarding Fake Job Offer & Registration Fee Extortion

2. Complainant Information
Complainant: [Victim / Complainant]
Contact Info: On file

3. Incident Summary
I found a freelance design opportunity through an online community. They asked me to pay ₹3,500 for a mandatory verification certificate. After I paid, the account disappeared and the website stopped working.

4. Fraudulent Activity
The complainant reported an incident classified as Fake Job Offer & Registration Fee Extortion (Semantic Confidence: 84%). The perpetrator solicited funds on Web Portal / Site under the pretense of Freelance verification certificate. After receiving the payment, the perpetrator Suspect account disappeared / site stopped working.

5. Financial Loss
- Amount Stolen: ₹3,500
- Payment Method: Not provided
- Transaction Date: Not available
- Transaction Reference Number: Not available

6. Suspect/Service Information
- Recipient / Suspect Details: Not available
- Platform / Channel: Web Portal / Site
- Promised Product/Service: Freelance verification certificate

7. Communication Details
Primary communications took place over Web Portal / Site. Personal data requested during interaction: None specified.

8. Evidence Available
- None provided

9. Missing/Unavailable Information
- Transaction date: Not available
- Transaction reference number: Not available
- Recipient details: Not available
- Supporting evidence / Screenshots: Not available

10. Requested Assistance
I request that the concerned authority review the incident, examine the available transaction and communication records, and take appropriate action under the applicable procedures.

11. Declaration
I declare that the information provided above is true and accurate to the best of my knowledge based on the facts available.
```

---

## 4. Mandatory Verification Checklist

- [x] No fabricated facts
- [x] No fabricated evidence
- [x] No fabricated transaction IDs
- [x] No fabricated legal claims
- [x] Unavailable information remains unavailable
- [x] Zero-shot classifier remains active
- [x] Existing functionality remains intact

---

## Conclusion
Phase 3 (Evidence-Guided Complaint Generation) is fully implemented, verified, and complaint-ready under strict zero-hallucination constraints.
