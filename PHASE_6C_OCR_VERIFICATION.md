# PHASE 6C — REAL EVIDENCE OCR & VERIFICATION DOCUMENTATION

## A. Objective

Phase 6C implements the **Real Evidence OCR & Verification Layer** for the Consumer Fraud Complaint Assistant.
The system accepts real victim evidence files (PNG, JPG/JPEG screenshots, text PDFs, and TXT documents) and extracts only factual information that is actually readable from the files.

The system enforces a strict boundary between automated OCR extraction (`UNVERIFIED`) and explicit victim confirmation (`USER_CONFIRMED`), while preserving source provenance and conflict tracking without fabricating missing information.

> **CRITICAL MANDATORY NOTICE**: `OCR extraction is not authenticity verification.`
> OCR confidence measures pattern recognition accuracy. It does NOT prove document authenticity, account ownership, or transaction legitimacy.

---

## B. Supported Evidence Formats

1. **Images**: `PNG`, `JPG`, `JPEG` (Processed via browser-compatible Tesseract.js OCR or local canvas text reader).
2. **Documents**: `PDF` (Parsed text content), `TXT` (Plain text evidence).
3. **Unsupported Formats**: `.exe`, `.zip`, `.mp4`, or unreadable binary payloads return:
   ```json
   {
     "evidence_id": "E204",
     "format": "EXE",
     "processing_status": "UNSUPPORTED_FORMAT",
     "supported": false,
     "facts_extracted": 0,
     "extracted_facts": []
   }
   ```
   *No unsafe format conversion is attempted, and zero facts are fabricated.*

---

## C. OCR Implementation

* **Engine**: Browser-compatible Tesseract.js OCR integration (`window.Tesseract.recognize`).
* **Fallback Behavior**: If OCR encounters corrupted image noise, unreadable blurs, or missing text payloads, the engine reports `processing_status: "OCR_FAILED"` with 0 extracted facts. It strictly refuses to simulate or fabricate OCR output.

---

## D. Extraction Schema & Controlled Fields

Fact extraction is strictly constrained to the 13 controlled fields:

1. `transaction_amount`
2. `currency`
3. `transaction_date`
4. `transaction_reference`
5. `payment_method`
6. `recipient_details`
7. `sender_identifier`
8. `platform`
9. `phone_number`
10. `email_address`
11. `username_or_handle`
12. `service_or_product`
13. `evidence_timestamp`

### Fact Schema
```json
{
  "field": "transaction_amount",
  "value": 8000,
  "source_evidence_id": "E205",
  "source_location": "OCR:text-region",
  "extraction_method": "OCR",
  "extraction_confidence": 0.91,
  "verification_status": "UNVERIFIED"
}
```

---

## E. Provenance & Confidence Rules

* Every OCR fact retains `source_evidence_id`, `source_location` (`"OCR:text-region"`), `extraction_method` (`"OCR"`), and `extraction_confidence` (`0.0 - 1.0`).
* **Rule**: OCR confidence (even `0.99`) is **NOT** factual verification. Status remains `UNVERIFIED` until explicitly confirmed by user.

---

## F. Verification States & User Boundary

The system manages 4 explicit fact verification states:

1. `EXTRACTED`: Pattern detected by OCR engine.
2. `UNVERIFIED`: Default initial state for all OCR facts.
3. `USER_CONFIRMED`: Transitioned ONLY when the user explicitly clicks "Confirm" or validates the extracted value.
4. `CONFLICT`: Active when narrative value differs from evidence value.

```text
[OCR Engine Extracted Fact] ---> UNVERIFIED ---> (User Confirms) ---> USER_CONFIRMED
```

---

## G. Conflict Detection & Preservation

When victim narrative states `₹8,000` and OCR screenshot states `₹7,500`:

```json
{
  "field": "transaction_amount",
  "status": "CONFLICT",
  "values": [
    { "value": 8000, "source": "VICTIM_NARRATIVE" },
    { "value": 7500, "source": "VICTIM_PROVIDED_EVIDENCE" }
  ]
}
```
*Neither value is overwritten or silently discarded.*

---

## H. Failure Behavior

If OCR fails or file is unreadable:
* Status set to `OCR_FAILED`.
* `facts_extracted = 0`.
* Missing values remain absent / `NOT_AVAILABLE`.
* Zero dummy transaction IDs or placeholder dates generated.

---

## I. Privacy & Security Behavior

* **100% Local Browser Processing**: OCR and text extraction execute entirely within local browser memory.
* **No Server Uploads**: No evidence files or extracted text are uploaded to external APIs or cloud servers.
* **Synthetic Test Fixtures**: `data/evidence_ocr_eval/dataset.json` contains synthetic test fixtures clearly labeled `SYNTHETIC_TEST_FIXTURE`.

---

## J. Test Results

Executed via Edge headless automated test harness:

| Test Case | Description | Status |
| :--- | :--- | :--- |
| **Test 1** | PNG image accepted and processed | **PASSED** |
| **Test 2** | JPG image accepted and processed | **PASSED** |
| **Test 3** | Text PDF accepted and processed | **PASSED** |
| **Test 4** | Unsupported EXE file rejected with `UNSUPPORTED_FORMAT` | **PASSED** |
| **Test 5** | OCR provenance retained (`source_evidence_id`, `OCR:text-region`) | **PASSED** |
| **Test 6** | High OCR confidence (0.90) keeps status `UNVERIFIED` | **PASSED** |
| **Test 7** | Missing values remain absent without fabrication | **PASSED** |
| **Test 8** | Transaction amount extraction (₹8,000 -> 8000) | **PASSED** |
| **Test 9** | Transaction reference extraction (UTR8877665544) | **PASSED** |
| **Test 10**| Date extraction (2026-09-22) | **PASSED** |
| **Test 11**| Username/handle extraction (@crypto_job_scammer) | **PASSED** |
| **Test 12**| Narrative vs OCR conflict preservation (8000 vs 7500 -> `CONFLICT`) | **PASSED** |
| **Test 13**| `USER_CONFIRMED` transition strictly after explicit confirmation | **PASSED** |
| **Test 14**| OCR failure produces 0 fabricated facts (`OCR_FAILED`) | **PASSED** |
| **Test 15**| Phase 6A Evidence Provenance regression suite | **PASSED** |
| **Test 16**| Phase 6B Evidence Extraction regression suite | **PASSED** |
| **Test 17**| Phase 1–5 End-to-End Pipeline regression suite | **PASSED** |

### Comprehensive Suite Summary
* **Phase 6C OCR Tests**: 17 / 17 Passed (100%)
* **Phase 6B Extraction Tests**: 12 / 12 Passed (100%)
* **Phase 6A Provenance Tests**: 7 / 7 Passed (100%)
* **Phase 1–5 E2E Pipeline Tests**: 20 / 20 Passed (100%)
* **Total Suite Pass Count**: **56 / 56 PASSED (100%)**
* **Unsupported Hallucinations Detected**: 0
* **Demo Readiness Status**: `DEMO READY`

---

## K. Known Limitations

1. **OCR Quality Dependency**: Heavily blurred, low-resolution, or stylized font screenshots may fail OCR, producing `OCR_FAILED` with 0 extracted facts.
2. **Text-Only Scope**: Extraction does not perform deepfake image detection or visual forgery analysis.
3. **No Automatic Filing**: The system generates legal complaint documentation for victim review but does not submit files automatically to external authorities.
