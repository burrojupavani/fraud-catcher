/**
 * Phase 6C: Real Evidence OCR & Verification Test Suite
 * Validates 17 specific OCR processing, provenance, verification state boundaries,
 * conflict preservation, fallback rules, and Phase 1-6B regression checks.
 */

window.runPhase6COcrTests = async function(options = {}) {
  console.log("=== STARTING PHASE 6C REAL EVIDENCE OCR & VERIFICATION TEST SUITE ===");

  const results = {
    test1_png_accepted: null,
    test2_jpg_accepted: null,
    test3_pdf_accepted: null,
    test4_unsupported_format_rejected: null,
    test5_ocr_provenance: null,
    test6_confidence_vs_verification: null,
    test7_missing_values_unavailable: null,
    test8_amount_extraction: null,
    test9_reference_extraction: null,
    test10_date_extraction: null,
    test11_handle_extraction: null,
    test12_conflict_preservation: null,
    test13_user_confirmed_transition: null,
    test14_ocr_failure_zero_facts: null,
    test15_phase6a_regression: null,
    test16_phase6b_regression: null,
    test17_phase1to5_regression: null,
    all_passed: false
  };

  const ocrEngine = new EvidenceOcrEngine();

  if (window.zeroShotEngine) {
    window.zeroShotEngine.resetEvidenceRegistry();
  }

  // ----------------------------------------------------
  // TEST 1 — PNG/image accepted
  // ----------------------------------------------------
  console.log("\n--- Test 1: PNG format accepted ---");
  try {
    const res = await ocrEngine.processEvidenceFile({ evidence_id: "E201", filename: "receipt.png", format: "PNG" }, "Amount ₹8,000");
    const passed = res.supported === true && res.processing_status === "PROCESSED";
    results.test1_png_accepted = {
      passed: passed,
      result: res,
      details: passed ? "PNG format accepted and processed." : "PNG format rejected unexpectedly."
    };
    console.log(`Test 1 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test1_png_accepted = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 2 — JPG accepted
  // ----------------------------------------------------
  console.log("\n--- Test 2: JPG format accepted ---");
  try {
    const res = await ocrEngine.processEvidenceFile({ evidence_id: "E202", filename: "chat.jpg", format: "JPG" }, "Suspect Telegram @scammer");
    const passed = res.supported === true && res.processing_status === "PROCESSED";
    results.test2_jpg_accepted = {
      passed: passed,
      result: res,
      details: passed ? "JPG format accepted and processed." : "JPG format rejected."
    };
    console.log(`Test 2 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test2_jpg_accepted = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 3 — Text PDF accepted
  // ----------------------------------------------------
  console.log("\n--- Test 3: Text PDF format accepted ---");
  try {
    const res = await ocrEngine.processEvidenceFile({ evidence_id: "E203", filename: "statement.pdf", format: "PDF" }, "Bank transfer Date: 2026-09-22");
    const passed = res.supported === true && res.processing_status === "PROCESSED";
    results.test3_pdf_accepted = {
      passed: passed,
      result: res,
      details: passed ? "PDF format accepted and processed." : "PDF format rejected."
    };
    console.log(`Test 3 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test3_pdf_accepted = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 4 — Unsupported format rejected
  // ----------------------------------------------------
  console.log("\n--- Test 4: Unsupported format rejected ---");
  try {
    const res = await ocrEngine.processEvidenceFile({ evidence_id: "E204", filename: "malicious.exe", format: "EXE" });
    const passed = res.supported === false && res.processing_status === "UNSUPPORTED_FORMAT" && res.facts_extracted === 0;
    results.test4_unsupported_format_rejected = {
      passed: passed,
      result: res,
      details: passed ? "EXE format rejected with UNSUPPORTED_FORMAT status and 0 facts." : "Failed to reject unsupported EXE."
    };
    console.log(`Test 4 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test4_unsupported_format_rejected = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 5 — OCR extraction produces provenance
  // ----------------------------------------------------
  console.log("\n--- Test 5: OCR provenance tracking ---");
  try {
    const res = await ocrEngine.processEvidenceFile({ evidence_id: "E205", filename: "shot.png", format: "PNG" }, "Amount: ₹8,000");
    const fact = res.extracted_facts.find(f => f.field === "transaction_amount");
    const passed = fact &&
      fact.source_evidence_id === "E205" &&
      fact.source_location === "OCR:text-region" &&
      fact.extraction_method === "OCR" &&
      fact.verification_status === "UNVERIFIED";

    results.test5_ocr_provenance = {
      passed: passed,
      fact: fact,
      details: passed ? "OCR fact retained source_evidence_id E205, OCR:text-region location, and UNVERIFIED status." : "OCR provenance failed."
    };
    console.log(`Test 5 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test5_ocr_provenance = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 6 — OCR confidence remains separate from verification
  // ----------------------------------------------------
  console.log("\n--- Test 6: Confidence vs Verification status ---");
  try {
    const res = await ocrEngine.processEvidenceFile({ evidence_id: "E206", filename: "shot.png", format: "PNG" }, "Amount: ₹8,000");
    const fact = res.extracted_facts.find(f => f.field === "transaction_amount");

    const passed = fact &&
      typeof fact.extraction_confidence === 'number' &&
      fact.extraction_confidence >= 0.85 &&
      fact.verification_status === "UNVERIFIED" &&
      fact.verification_status !== "USER_CONFIRMED";

    results.test6_confidence_vs_verification = {
      passed: passed,
      fact: fact,
      details: passed ? "OCR extraction confidence (0.90) correctly maintained UNVERIFIED status." : "Auto-promoted to verified!"
    };
    console.log(`Test 6 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test6_confidence_vs_verification = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 7 — Missing values remain unavailable
  // ----------------------------------------------------
  console.log("\n--- Test 7: Missing values remain unavailable ---");
  try {
    const res = await ocrEngine.processEvidenceFile({ evidence_id: "E207", filename: "shot.png", format: "PNG" }, "Payment processed");
    const refFact = res.extracted_facts.find(f => f.field === "transaction_reference");

    const passed = refFact === undefined; // Not in extracted facts list, or absent
    results.test7_missing_values_unavailable = {
      passed: passed,
      extracted_facts: res.extracted_facts,
      details: passed ? "Unfound fields remained completely absent/unavailable without fabrication." : "Fabricated missing field!"
    };
    console.log(`Test 7 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test7_missing_values_unavailable = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 8 — Transaction amount extraction
  // ----------------------------------------------------
  console.log("\n--- Test 8: Transaction amount extraction ---");
  try {
    const res = await ocrEngine.processEvidenceFile({ evidence_id: "E208", filename: "receipt.jpg", format: "JPG" }, "Total Paid: ₹8,000");
    const fact = res.extracted_facts.find(f => f.field === "transaction_amount");

    const passed = fact && fact.value === 8000;
    results.test8_amount_extraction = {
      passed: passed,
      fact: fact,
      details: passed ? "Extracted amount 8000 cleanly from image payload." : "Failed amount extraction."
    };
    console.log(`Test 8 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test8_amount_extraction = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 9 — Transaction reference extraction
  // ----------------------------------------------------
  console.log("\n--- Test 9: Transaction reference extraction ---");
  try {
    const res = await ocrEngine.processEvidenceFile({ evidence_id: "E209", filename: "receipt.jpg", format: "JPG" }, "UTR: UTR8877665544");
    const fact = res.extracted_facts.find(f => f.field === "transaction_reference");

    const passed = fact && fact.value === "UTR8877665544";
    results.test9_reference_extraction = {
      passed: passed,
      fact: fact,
      details: passed ? "Extracted UTR8877665544 cleanly." : "Failed reference extraction."
    };
    console.log(`Test 9 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test9_reference_extraction = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 10 — Date extraction
  // ----------------------------------------------------
  console.log("\n--- Test 10: Date extraction ---");
  try {
    const res = await ocrEngine.processEvidenceFile({ evidence_id: "E210", filename: "receipt.jpg", format: "JPG" }, "Transaction Date: 2026-09-22");
    const fact = res.extracted_facts.find(f => f.field === "transaction_date");

    const passed = fact && fact.value === "2026-09-22";
    results.test10_date_extraction = {
      passed: passed,
      fact: fact,
      details: passed ? "Extracted date 2026-09-22 cleanly." : "Failed date extraction."
    };
    console.log(`Test 10 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test10_date_extraction = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 11 — Username / Handle extraction
  // ----------------------------------------------------
  console.log("\n--- Test 11: Username/handle extraction ---");
  try {
    const res = await ocrEngine.processEvidenceFile({ evidence_id: "E211", filename: "chat.png", format: "PNG" }, "Suspect handle: @crypto_job_scammer");
    const fact = res.extracted_facts.find(f => f.field === "username_or_handle");

    const passed = fact && fact.value === "@crypto_job_scammer";
    results.test11_handle_extraction = {
      passed: passed,
      fact: fact,
      details: passed ? "Extracted handle @crypto_job_scammer cleanly." : "Failed handle extraction."
    };
    console.log(`Test 11 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test11_handle_extraction = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 12 — Narrative / Evidence conflict preservation
  // ----------------------------------------------------
  console.log("\n--- Test 12: Narrative vs Evidence conflict preservation ---");
  try {
    await ocrEngine.processEvidenceFile({ evidence_id: "E212", filename: "receipt.png", format: "PNG" }, "Amount: ₹7,500");
    const evalRes = ocrEngine.evaluateConflicts({ victim_loss: { amount: 8000 } }, "E212");

    const passed = evalRes.hasConflicts === true &&
      evalRes.conflicts.length > 0 &&
      evalRes.conflicts[0].status === "CONFLICT" &&
      evalRes.conflicts[0].values.some(v => v.value === 8000 && v.source === "VICTIM_NARRATIVE") &&
      evalRes.conflicts[0].values.some(v => v.value === 7500 && v.source === "VICTIM_PROVIDED_EVIDENCE");

    results.test12_conflict_preservation = {
      passed: passed,
      conflictResult: evalRes,
      details: passed ? "Narrative 8000 vs OCR 7500 preserved as CONFLICT without auto-overwriting." : "Conflict preservation failed."
    };
    console.log(`Test 12 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test12_conflict_preservation = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 13 — USER_CONFIRMED transition only through explicit confirmation
  // ----------------------------------------------------
  console.log("\n--- Test 13: USER_CONFIRMED explicit transition ---");
  try {
    await ocrEngine.processEvidenceFile({ evidence_id: "E213", filename: "shot.png", format: "PNG" }, "Amount ₹8,000");
    const preReport = ocrEngine.getQualityReport("E213");
    const preFact = preReport.extracted_facts.find(f => f.field === "transaction_amount");
    const wasUnverified = preFact.verification_status === "UNVERIFIED";

    // Explicit confirmation
    const confirmedFact = ocrEngine.confirmFact("E213", "transaction_amount", 8000);
    const postVerified = confirmedFact.verification_status === "USER_CONFIRMED";

    const passed = wasUnverified && postVerified;
    results.test13_user_confirmed_transition = {
      passed: passed,
      fact: confirmedFact,
      details: passed ? "Fact transitioned UNVERIFIED -> USER_CONFIRMED strictly after explicit user action." : "User transition failed."
    };
    console.log(`Test 13 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test13_user_confirmed_transition = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 14 — OCR failure produces zero fabricated facts
  // ----------------------------------------------------
  console.log("\n--- Test 14: OCR failure produces zero fabricated facts ---");
  try {
    const res = await ocrEngine.processEvidenceFile({ evidence_id: "E214", filename: "corrupt.png", format: "PNG" }, "");
    const passed = res.processing_status === "OCR_FAILED" && res.facts_extracted === 0 && res.extracted_facts.length === 0;

    results.test14_ocr_failure_zero_facts = {
      passed: passed,
      result: res,
      details: passed ? "Empty text payload returned OCR_FAILED with 0 facts fabricated." : "Fabricated facts on OCR failure!"
    };
    console.log(`Test 14 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test14_ocr_failure_zero_facts = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 15 — Phase 6A Regression
  // ----------------------------------------------------
  console.log("\n--- Test 15: Phase 6A Regression ---");
  try {
    let p6a = null;
    if (typeof window.runPhase6AEvidenceTests === 'function') {
      p6a = await window.runPhase6AEvidenceTests({ skipRegression: true });
    }
    const passed = p6a && p6a.all_passed === true;
    results.test15_phase6a_regression = {
      passed: passed,
      details: passed ? "Phase 6A evidence intake & provenance tests passed 100%." : "Phase 6A regression failed."
    };
    console.log(`Test 15 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test15_phase6a_regression = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 16 — Phase 6B Regression
  // ----------------------------------------------------
  console.log("\n--- Test 16: Phase 6B Regression ---");
  try {
    let p6b = null;
    if (typeof window.runPhase6BExtractionTests === 'function') {
      p6b = await window.runPhase6BExtractionTests({ skipRegression: true });
    }
    const passed = p6b && p6b.all_passed === true;
    results.test16_phase6b_regression = {
      passed: passed,
      details: passed ? "Phase 6B evidence extraction tests passed 100%." : "Phase 6B regression failed."
    };
    console.log(`Test 16 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test16_phase6b_regression = { passed: false, error: err.message };
  }

  // ----------------------------------------------------
  // TEST 17 — Phase 1–5 Regression
  // ----------------------------------------------------
  console.log("\n--- Test 17: Phase 1-5 Regression ---");
  try {
    let p6e2e = null;
    if (typeof window.runPhase6E2ETests === 'function') {
      p6e2e = await window.runPhase6E2ETests();
    }
    const passed = p6e2e && p6e2e.regression_summary && p6e2e.regression_summary.total_failed === 0;
    results.test17_phase1to5_regression = {
      passed: passed,
      summary: p6e2e ? p6e2e.regression_summary : null,
      details: passed ? "Phase 1-5 core pipeline tests passed 100% with 0 regressions." : "Phase 1-5 regression failed."
    };
    console.log(`Test 17 Result: ${passed ? "PASSED" : "FAILED"}`);
  } catch (err) {
    results.test17_phase1to5_regression = { passed: false, error: err.message };
  }

  // Overall pass condition
  results.all_passed = Boolean(
    results.test1_png_accepted && results.test1_png_accepted.passed &&
    results.test2_jpg_accepted && results.test2_jpg_accepted.passed &&
    results.test3_pdf_accepted && results.test3_pdf_accepted.passed &&
    results.test4_unsupported_format_rejected && results.test4_unsupported_format_rejected.passed &&
    results.test5_ocr_provenance && results.test5_ocr_provenance.passed &&
    results.test6_confidence_vs_verification && results.test6_confidence_vs_verification.passed &&
    results.test7_missing_values_unavailable && results.test7_missing_values_unavailable.passed &&
    results.test8_amount_extraction && results.test8_amount_extraction.passed &&
    results.test9_reference_extraction && results.test9_reference_extraction.passed &&
    results.test10_date_extraction && results.test10_date_extraction.passed &&
    results.test11_handle_extraction && results.test11_handle_extraction.passed &&
    results.test12_conflict_preservation && results.test12_conflict_preservation.passed &&
    results.test13_user_confirmed_transition && results.test13_user_confirmed_transition.passed &&
    results.test14_ocr_failure_zero_facts && results.test14_ocr_failure_zero_facts.passed &&
    results.test15_phase6a_regression && results.test15_phase6a_regression.passed &&
    results.test16_phase6b_regression && results.test16_phase6b_regression.passed &&
    results.test17_phase1to5_regression && results.test17_phase1to5_regression.passed
  );

  console.log("\n====================================================");
  console.log(`PHASE 6C EVIDENCE OCR OVERALL: ${results.all_passed ? "SUCCESS (ALL 17 TESTS PASSED)" : "FAILURE"}`);
  console.log("====================================================\n");

  return results;
};
