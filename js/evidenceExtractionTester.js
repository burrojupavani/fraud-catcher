/**
 * Phase 6B: Evidence Extraction & Verification Test Suite
 * Validates 12 specific extraction, provenance, confidence vs verification,
 * conflict handling, missing fact default, unsupported format, and regression tests.
 */

window.runPhase6BExtractionTests = async function() {
  console.log("=== STARTING PHASE 6B EVIDENCE EXTRACTION & VERIFICATION TEST SUITE ===");

  const results = {
    test1_text_amount: null,
    test2_upi_reference: null,
    test3_transaction_date: null,
    test4_telegram_handle: null,
    test5_multiple_facts: null,
    test6_missing_reference: null,
    test7_malformed_text: null,
    test8_conflict_handling: null,
    test9_provenance_preservation: null,
    test10_confidence_vs_verification: null,
    test11_unsupported_format: null,
    test12_phase6a_regression: null,
    all_passed: false
  };

  const extractor = new EvidenceExtractor();

  // Reset engine evidence registry before running tests
  if (window.zeroShotEngine) {
    window.zeroShotEngine.resetEvidenceRegistry();
  }

  // ----------------------------------------------------
  // TEST 1 — TEXT evidence with amount
  // ----------------------------------------------------
  console.log("\n--- Test 1: TEXT evidence with amount ---");
  try {
    const textSample = "Payment Receipt: Paid ₹8,000 to merchant";
    const res = extractor.extractEvidenceFacts({ evidence_id: "E101", type: "TEXT" }, textSample);
    const amtFact = res.extracted_facts.find(f => f.field === "transaction_amount");

    const passed = amtFact && amtFact.value === 8000 && amtFact.confidence > 0.8;
    results.test1_text_amount = {
      passed: passed,
      fact: amtFact,
      details: passed ? "Extracted amount 8000 successfully." : "Failed to extract transaction_amount 8000."
    };
    console.log(`Test 1 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test1_text_amount = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 2 — TEXT evidence with UPI transaction reference
  // ----------------------------------------------------
  console.log("\n--- Test 2: TEXT evidence with UPI transaction reference ---");
  try {
    const textSample = "UPI Payment Successful. UTR Reference: UTR123456789012.";
    const res = extractor.extractEvidenceFacts({ evidence_id: "E102", type: "TEXT" }, textSample);
    const refFact = res.extracted_facts.find(f => f.field === "transaction_reference");

    const passed = refFact && refFact.value === "UTR123456789012";
    results.test2_upi_reference = {
      passed: passed,
      fact: refFact,
      details: passed ? "Extracted UTR reference UTR123456789012 successfully." : "Failed to extract transaction reference."
    };
    console.log(`Test 2 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test2_upi_reference = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 3 — TEXT evidence with date
  // ----------------------------------------------------
  console.log("\n--- Test 3: TEXT evidence with date ---");
  try {
    const textSample = "Transfer executed on 2026-09-20 via bank portal.";
    const res = extractor.extractEvidenceFacts({ evidence_id: "E103", type: "TEXT" }, textSample);
    const dateFact = res.extracted_facts.find(f => f.field === "transaction_date");

    const passed = dateFact && dateFact.value === "2026-09-20";
    results.test3_transaction_date = {
      passed: passed,
      fact: dateFact,
      details: passed ? "Extracted date 2026-09-20 successfully." : "Failed to extract transaction date."
    };
    console.log(`Test 3 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test3_transaction_date = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 4 — TEXT evidence with Telegram handle
  // ----------------------------------------------------
  console.log("\n--- Test 4: TEXT evidence with Telegram handle ---");
  try {
    const textSample = "Chat log export from Telegram channel. Suspect handle: @fake_recruiter.";
    const res = extractor.extractEvidenceFacts({ evidence_id: "E104", type: "CHAT_EXPORT" }, textSample);
    const handleFact = res.extracted_facts.find(f => f.field === "username_or_handle");

    const passed = handleFact && handleFact.value === "@fake_recruiter";
    results.test4_telegram_handle = {
      passed: passed,
      fact: handleFact,
      details: passed ? "Extracted handle @fake_recruiter successfully." : "Failed to extract username_or_handle."
    };
    console.log(`Test 4 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test4_telegram_handle = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 5 — Evidence with multiple facts
  // ----------------------------------------------------
  console.log("\n--- Test 5: Evidence with multiple facts ---");
  try {
    const multiText = "Paid ₹8,000 on 2026-09-20 via UPI to merchant@upi. UTR: UTR99887766. Suspect Telegram: @scammer";
    const res = extractor.extractEvidenceFacts({ evidence_id: "E105", type: "TRANSACTION_RECORD" }, multiText);

    const hasAmt = res.extracted_facts.some(f => f.field === "transaction_amount" && f.value === 8000);
    const hasRef = res.extracted_facts.some(f => f.field === "transaction_reference" && f.value === "UTR99887766");
    const hasDate = res.extracted_facts.some(f => f.field === "transaction_date" && f.value === "2026-09-20");
    const hasRecipient = res.extracted_facts.some(f => f.field === "recipient_identifier" && f.value === "merchant@upi");
    const hasHandle = res.extracted_facts.some(f => f.field === "username_or_handle" && f.value === "@scammer");

    const passed = hasAmt && hasRef && hasDate && hasRecipient && hasHandle;
    results.test5_multiple_facts = {
      passed: passed,
      extracted_count: res.extracted_facts.length,
      details: passed ? "Extracted 5 distinct factual fields cleanly from single payload." : `Failed to extract multiple facts.`
    };
    console.log(`Test 5 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test5_multiple_facts = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 6 — Missing transaction reference (No Hallucination)
  // ----------------------------------------------------
  console.log("\n--- Test 6: Missing transaction reference ---");
  try {
    const textSample = "Payment completed for ₹8,000 via UPI. Status: Processing.";
    const singleRes = extractor.extractFieldPattern("transaction_reference", textSample, "E106");

    const passed = singleRes.value === null && singleRes.status === "NOT_AVAILABLE" && singleRes.value !== "TEST-12345";
    results.test6_missing_reference = {
      passed: passed,
      result: singleRes,
      details: passed ? "Missing transaction reference returned status NOT_AVAILABLE without hallucination." : "Fabricated value returned!"
    };
    console.log(`Test 6 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test6_missing_reference = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 7 — Malformed / ambiguous text
  // ----------------------------------------------------
  console.log("\n--- Test 7: Malformed/ambiguous text ---");
  try {
    const ambiguousText = "I think maybe some money was lost around there or nowhere.";
    const res = extractor.extractEvidenceFacts({ evidence_id: "E107", type: "TEXT" }, ambiguousText);

    const hasNoFakeAmt = !res.extracted_facts.some(f => f.field === "transaction_amount");
    const passed = hasNoFakeAmt;

    results.test7_malformed_text = {
      passed: passed,
      extracted_count: res.extracted_facts.length,
      details: passed ? "Ambiguous text yielded 0 fabricated amounts." : "Fabricated facts from ambiguous text!"
    };
    console.log(`Test 7 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test7_malformed_text = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 8 — Conflict between narrative and evidence
  // ----------------------------------------------------
  console.log("\n--- Test 8: Conflict between narrative and evidence ---");
  try {
    const narrativeAmt = 8000;
    const evidenceAmt = 7500;

    const conflictRes = extractor.evaluateFactConflicts("transaction_amount", narrativeAmt, evidenceAmt);

    const passed = conflictRes.status === "CONFLICT" &&
      conflictRes.values.length === 2 &&
      conflictRes.values.some(v => v.value === 8000 && v.source === "VICTIM_NARRATIVE") &&
      conflictRes.values.some(v => v.value === 7500 && v.source === "VICTIM_PROVIDED_EVIDENCE");

    results.test8_conflict_handling = {
      passed: passed,
      conflict: conflictRes,
      details: passed ? "Narrative 8000 vs Evidence 7500 preserved as CONFLICT without auto-overwriting." : "Conflict handling failed."
    };
    console.log(`Test 8 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test8_conflict_handling = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 9 — Provenance preservation
  // ----------------------------------------------------
  console.log("\n--- Test 9: Provenance preservation ---");
  try {
    const textSample = "Amount ₹8,000 paid.";
    const res = extractor.extractEvidenceFacts({ evidence_id: "E109", type: "TEXT" }, textSample);
    const amtFact = res.extracted_facts.find(f => f.field === "transaction_amount");

    const passed = amtFact &&
      amtFact.source_evidence_id === "E109" &&
      amtFact.extraction_method === "TEXT_PATTERN" &&
      amtFact.source_location !== null;

    results.test9_provenance_preservation = {
      passed: passed,
      fact: amtFact,
      details: passed ? "Fact retained source_evidence_id E109 and extraction_method TEXT_PATTERN." : "Provenance tracking failed."
    };
    console.log(`Test 9 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test9_provenance_preservation = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 10 — Extraction confidence remains separate from verification status
  // ----------------------------------------------------
  console.log("\n--- Test 10: Confidence vs Verification status ---");
  try {
    const textSample = "Paid ₹8,000 via UPI.";
    const res = extractor.extractEvidenceFacts({ evidence_id: "E110", type: "TEXT" }, textSample);
    const amtFact = res.extracted_facts.find(f => f.field === "transaction_amount");

    const passed = amtFact &&
      typeof amtFact.confidence === 'number' &&
      amtFact.confidence >= 0.8 &&
      amtFact.verification_status === "UNVERIFIED" &&
      amtFact.verification_status !== "VERIFIED";

    results.test10_confidence_vs_verification = {
      passed: passed,
      fact: amtFact,
      details: passed ? "High extraction confidence (0.90) correctly maintained verification_status as UNVERIFIED." : "Auto-promoted to VERIFIED illegally!"
    };
    console.log(`Test 10 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test10_confidence_vs_verification = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 11 — Unsupported evidence type does not fabricate facts
  // ----------------------------------------------------
  console.log("\n--- Test 11: Unsupported evidence type ---");
  try {
    const imageEvidence = {
      evidence_id: "E111",
      type: "IMAGE",
      description: "Screenshot image without OCR text payload",
      content: null
    };

    const res = extractor.extractEvidenceFacts(imageEvidence);

    const passed = res.status === "UNSUPPORTED_FORMAT" &&
      res.supported === false &&
      res.extracted_facts.length === 0;

    results.test11_unsupported_format = {
      passed: passed,
      response: res,
      details: passed ? "IMAGE without OCR reported UNSUPPORTED_FORMAT with 0 facts fabricated." : "Fabricated facts for image format!"
    };
    console.log(`Test 11 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test11_unsupported_format = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 12 — Phase 6A Regression Check
  // ----------------------------------------------------
  console.log("\n--- Test 12: Phase 6A Regression Check ---");
  try {
    let p6aRes = null;
    if (typeof window.runPhase6AEvidenceTests === 'function') {
      p6aRes = await window.runPhase6AEvidenceTests();
    }

    const passed = p6aRes && p6aRes.all_passed === true;

    results.test12_phase6a_regression = {
      passed: passed,
      summary: p6aRes,
      details: passed ? "All 7 Phase 6A evidence intake & provenance tests passed with 0 regressions." : "Phase 6A regression failed!"
    };
    console.log(`Test 12 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test12_phase6a_regression = { passed: false, error: err.message };
  }

  // Overall pass condition
  results.all_passed = Boolean(
    results.test1_text_amount && results.test1_text_amount.passed &&
    results.test2_upi_reference && results.test2_upi_reference.passed &&
    results.test3_transaction_date && results.test3_transaction_date.passed &&
    results.test4_telegram_handle && results.test4_telegram_handle.passed &&
    results.test5_multiple_facts && results.test5_multiple_facts.passed &&
    results.test6_missing_reference && results.test6_missing_reference.passed &&
    results.test7_malformed_text && results.test7_malformed_text.passed &&
    results.test8_conflict_handling && results.test8_conflict_handling.passed &&
    results.test9_provenance_preservation && results.test9_provenance_preservation.passed &&
    results.test10_confidence_vs_verification && results.test10_confidence_vs_verification.passed &&
    results.test11_unsupported_format && results.test11_unsupported_format.passed &&
    results.test12_phase6a_regression && results.test12_phase6a_regression.passed
  );

  console.log("\n====================================================");
  console.log(`PHASE 6B EVIDENCE EXTRACTION OVERALL: ${results.all_passed ? "SUCCESS (ALL 12 TESTS PASSED)" : "FAILURE"}`);
  console.log("====================================================\n");

  return results;
};
