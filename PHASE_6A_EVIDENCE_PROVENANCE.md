# PHASE 6A — EVIDENCE INTAKE & PROVENANCE DOCUMENTATION

## A. Objective

Phase 6A establishes the **Evidence Intake & Provenance** foundation for the Consumer Fraud Complaint Assistant.
The goal is to enable traceable, non-hallucinatory handling of victim-supplied evidence items.

Every extracted fact is linked to a specific provenance source, ensuring that missing information is explicitly marked as `NOT_AVAILABLE` and conflicting statements across narrative and evidence are preserved without silent overwriting or automated speculation.

---

## B. Existing Architecture Preserved

The following core components remain 100% untouched and preserved:

1. **Zero-Shot NLI Engine**: Pretrained `Xenova/nli-deberta-v3-small` NLI model remains the sole engine for zero-shot candidate hypothesis evaluation.
2. **Phase 2 Structured Case Record**: `extractStructuredCaseRecord` semantics remain unchanged.
3. **Phase 3 Complaint Generator**: The 11-section statutory complaint structure is strictly preserved.
4. **Phase 4 Generalization Evaluation**: 25 evaluation benchmarks remain active.
5. **Phase 5 Verified Indian Routing**: Cyber Crime Portal 1930, National Consumer Helpline 1915, and NPCI UPI dispute pathways remain unchanged.
6. **Zero External Dependencies**: No OCR, computer vision, webcam capture, live streaming, or external API uploads were added.

---

## C. Evidence Data Model

Each evidence item is represented as a structured object:

```js
{
    evidence_id: "E001",
    type: "SCREENSHOT", // SCREENSHOT | PDF | CHAT_EXPORT | TRANSACTION_RECORD | IMAGE | TEXT | OTHER
    description: "UPI payment screenshot",
    source: "victim_provided",
    provided_at: "2026-09-27T02:11:26.222Z",
    extracted_facts: [
        {
            field: "transaction_amount",
            value: 8000
        }
    ],
    provenance: {
        source_type: "victim_provided",
        source_reference: "E001"
    },
    verification_status: "UNVERIFIED"
}
```

### Initial Supported Evidence Types
* `SCREENSHOT`
* `PDF`
* `CHAT_EXPORT`
* `TRANSACTION_RECORD`
* `IMAGE`
* `TEXT`
* `OTHER`

### Verification Status Definition
* `UNVERIFIED`: Evidence item has been supplied by the victim, but system has not independently verified its content. (Does NOT imply false).
* `AVAILABLE`: Evidence is attached and accessible.
* `MISSING`: Required evidence type is absent.

---

## D. Provenance Model

The system enforces strict multi-source traceability. Facts distinguish four distinct provenance origins:

```text
VICTIM_NARRATIVE
CASE_COMPLETION_FORM
VICTIM_PROVIDED_EVIDENCE
SYSTEM_INFERENCE
```

### Traceability Object Structure

```js
{
    field: "transaction_amount",
    value: 8000,
    source: "E001",
    source_type: "VICTIM_PROVIDED_EVIDENCE",
    evidence_type: "SCREENSHOT"
}
```

---

## E. No-Hallucination Behavior

If an evidence item or narrative does NOT explicitly contain a fact, the system must NOT create that fact.

* **Explicitly Provided**: `transaction_amount = 8000` -> Linked with source `E001`.
* **Not Provided**: `transaction_reference` -> Defaulted to `"NOT_AVAILABLE"`.

The system strictly forbids fabricating random transaction numbers (e.g., `XYZ123`), mock UTRs, or mock dates.

---

## F. Conflict Handling

When a fact reported in the victim narrative conflicts with a fact extracted from evidence, the system **preserves both sources** and marks the status as `CONFLICT`.

### Example
* Narrative fact: `transaction_amount = ₹8,000` (`source: victim_narrative`)
* Evidence fact: `transaction_amount = ₹7,500` (`source: E001`)

### System Representation
```js
[
    {
        field: "disputed_amount",
        value: 8000,
        source: "victim_narrative",
        source_type: "VICTIM_NARRATIVE",
        status: "CONFLICT"
    },
    {
        field: "disputed_amount",
        value: 7500,
        source: "E001",
        source_type: "VICTIM_PROVIDED_EVIDENCE",
        evidence_type: "SCREENSHOT",
        status: "CONFLICT"
    }
]
```

The system does NOT automatically pick a winner or overwrite earlier records.

---

## G. Test Results

The test suite (`js/evidenceProvenanceTester.js`) was executed via Edge headless runner:

### Phase 6A Test Suite Summary
| Test Case | Description | Result |
| :--- | :--- | :--- |
| **Test 1** | Evidence creation (`E001`, `SCREENSHOT`) | **PASSED** |
| **Test 2** | Stable ID generation (`E002` created without overwriting `E001`) | **PASSED** |
| **Test 3** | Fact linking (`transaction_amount = 8000` -> `E001`) | **PASSED** |
| **Test 4** | Missing fact representation (`transaction_reference = NOT_AVAILABLE`) | **PASSED** |
| **Test 5** | Multiple evidence sources preserved (`victim_narrative` + `E002`) | **PASSED** |
| **Test 6** | Conflict preservation (8000 vs 7500 marked `CONFLICT`) | **PASSED** |
| **Test 7** | Full existing functionality regression suite | **PASSED** |

### Complete Regression Results
* **Total Tests Executed**: 27
* **Passed**: 27 (100%)
* **Failed**: 0
* **Unsupported Hallucinations Detected**: 0
* **Demo Readiness Status**: `DEMO READY`

---

## H. Explicit Limitations

The following features were intentionally excluded from Phase 6A:

1. **No OCR**: Optical character recognition is not included.
2. **No Image Analysis**: Computer vision & image understanding are not included.
3. **No Automatic Evidence Extraction**: System does not attempt automated pattern extraction from uploaded binary files.
4. **No External Uploads**: Evidence objects exist in local browser memory only.
5. **No Real Victim Data**: System utilizes synthesized evaluation scenarios only.
6. **No Automatic Filing**: The assistant prepares structured legal documentation for victim review but does not auto-submit complaints to law enforcement portals.
