# PHASE 6B — EVIDENCE EXTRACTION & VERIFICATION DOCUMENTATION

## A. Objective

Phase 6B adds a controlled, non-hallucinatory **Evidence Extraction & Verification Layer** to the Consumer Fraud Complaint Assistant.
The goal is to enable traceable fact extraction from victim-provided evidence items while strictly preserving uncertainty, provenance, and conflict state without converting unverified extracted facts into verified facts.

---

## B. Supported Evidence Formats

The extraction layer supports text-bearing evidence formats:

* `TEXT` (Raw victim-provided transaction text)
* `PDF` (Parsed text content from PDF statements)
* `CHAT_EXPORT` (Exported conversation text from messaging apps)
* `TRANSACTION_RECORD` (Text-formatted bank/payment gateway receipts)

### Unsupported Format Handling
Binary or visual evidence formats lacking local OCR (such as `IMAGE` or raw `SCREENSHOT` files without text payloads) return:
```json
{
  "evidence_id": "E001",
  "type": "IMAGE",
  "status": "UNSUPPORTED_FORMAT",
  "supported": false,
  "message": "Format 'IMAGE' without plain text content is unsupported for local pattern extraction without OCR. No facts fabricated.",
  "extracted_facts": []
}
```
The system strictly refuses to fabricate facts when reading unsupported formats.

---

## C. Extraction Schema

Extraction is restricted to a controlled list of 13 factual fields:

1. `transaction_amount`
2. `currency`
3. `transaction_date`
4. `transaction_reference`
5. `payment_method`
6. `recipient_identifier`
7. `sender_identifier`
8. `platform`
9. `phone_number`
10. `email_address`
11. `username_or_handle`
12. `service_or_product`
13. `evidence_timestamp`

### Fact Schema Structure
```json
{
  "field": "transaction_amount",
  "value": 8000,
  "confidence": 0.90,
  "source_evidence_id": "E001",
  "source_location": "pattern:amount_regex ('Paid ₹8,000')",
  "extraction_method": "TEXT_PATTERN",
  "verification_status": "UNVERIFIED"
}
```

---

## D. Provenance Model

Extracted facts are automatically linked to `EvidenceRegistry` and preserve:

* `source_evidence_id`: Originating evidence item ID (e.g. `E001`).
* `source_location`: Pattern or string snippet where the match occurred.
* `extraction_method`: Method used (`TEXT_PATTERN`, `PARSER`, or `MANUAL`).
* `source_type`: `VICTIM_PROVIDED_EVIDENCE`.

The original evidence record remains untouched.

---

## E. Confidence vs Verification

Extraction confidence (e.g., `0.90`) measures pattern match certainty. It is **fundamentally distinct** from legal verification status.

* **Rule**: Extraction confidence NEVER auto-promotes a fact from `UNVERIFIED` to `VERIFIED`.
* All extracted facts remain `verification_status: "UNVERIFIED"` until explicitly validated by official process or victim confirmation.

---

## F. Conflict Handling

When victim narrative facts conflict with evidence-derived facts, **neither value is overwritten**.

### Example
* Victim narrative: `transaction_amount = 8000`
* Evidence E001: `transaction_amount = 7500`

### Conflict Representation
```json
{
  "field": "transaction_amount",
  "values": [
    { "value": 8000, "source": "VICTIM_NARRATIVE" },
    { "value": 7500, "source": "VICTIM_PROVIDED_EVIDENCE" }
  ],
  "status": "CONFLICT"
}
```

---

## G. Missing Information Behavior

If extraction cannot locate a requested field in the evidence payload:
```json
{
  "field": "transaction_reference",
  "value": null,
  "status": "NOT_AVAILABLE"
}
```
The system **never** generates dummy codes such as `TEST-12345`, `UNKNOWN-UTR`, or `example@upi`.

---

## H. Unsupported Evidence Behavior

When an evidence format is not text-bearing or lacks plain text payload:
* Status is reported as `UNSUPPORTED_FORMAT`.
* 0 facts are added to the case record.
* No speculative placeholders are created.

---

## I. Test Results

Tests were executed via Edge headless automated test harness:

| Test Case | Description | Status |
| :--- | :--- | :--- |
| **Test 1** | TEXT evidence with amount (₹8,000 -> 8000) | **PASSED** |
| **Test 2** | TEXT evidence with UPI transaction reference (UTR123456789012) | **PASSED** |
| **Test 3** | TEXT evidence with date (2026-09-20) | **PASSED** |
| **Test 4** | TEXT evidence with Telegram handle (@fake_recruiter) | **PASSED** |
| **Test 5** | Evidence with multiple facts extracted simultaneously | **PASSED** |
| **Test 6** | Missing transaction reference defaults to `NOT_AVAILABLE` | **PASSED** |
| **Test 7** | Ambiguous/malformed text yields 0 fabricated amounts | **PASSED** |
| **Test 8** | Conflict handling preserves both narrative & evidence values | **PASSED** |
| **Test 9** | Provenance preservation (`source_evidence_id`, `extraction_method`) | **PASSED** |
| **Test 10** | High confidence (0.90) keeps `verification_status: UNVERIFIED` | **PASSED** |
| **Test 11** | Unsupported `IMAGE` type returns `UNSUPPORTED_FORMAT` with 0 facts | **PASSED** |
| **Test 12** | Full Phase 6A & Phase 1–5 regression suite execution | **PASSED** |

### Suite Summary
* **Phase 6B Tests**: 12 / 12 Passed (100%)
* **Phase 6A Tests**: 7 / 7 Passed (100%)
* **Phase 1–5 Regression Tests**: 20 / 20 Passed (100%)
* **Total Active Test Count**: 39 / 39 Passed
* **Unsupported Hallucinations Detected**: 0

---

## J. Known Limitations

1. **No OCR**: Image files and screenshots require pre-extracted text payloads.
2. **Deterministic Pattern Matching**: Extraction relies on strict regex/keyword patterns; complex ambiguous prose defaults to `NOT_AVAILABLE`.
3. **No Authenticity Verification**: Extraction identifies text values but does not verify document authenticity or ownership.

---

## K. Security & Privacy Considerations

* All processing occurs strictly client-side / locally in browser JS memory.
* No evidence data, narrative text, or extracted facts are uploaded to cloud servers.
* Test fixtures in `data/evidence_eval/dataset.json` are synthetic test inputs labeled `SYNTHETIC_TEST_FIXTURE`.

---

## L. What Remains for Phase 7

* End-to-end user workflow UI integration for evidence file dropping.
* Optional local Tesseract/WASM OCR integration for visual evidence.
* Automated victim conflict resolution UI prompts.
