/**
 * Phase 5 Integration & Unit Test Suite — Verified Indian Complaint Routing & Generalization Preservation
 */

window.runPhase5DirectRoutingUnitTests = function() {
  console.log("=== RUNNING DIRECT ROUTING LAYER UNIT TESTS ===");

  const results = [];

  // TEST 1: Telegram fake job scam (₹8,000, UPI, Victim blocked)
  const rec1 = {
    fraud_category: "Fake Job Offer & Registration Fee Extortion",
    semantic_confidence: 87,
    victim_loss: { amount: 8000, currency: "INR", payment_method: "UPI" },
    platform: "Telegram",
    suspect_information: ["Phone: +91 9876543210"],
    incident_date: null,
    transaction_reference: null,
    incident_summary: "I joined a Telegram group where someone promised me a software job..."
  };
  const r1 = window.zeroShotEngine.evaluateIndianComplaintRouting(rec1);
  const p1 = r1.routing_status === "ROUTED" && r1.primary_pathway && r1.primary_pathway.id === "cyber_crime_1930" && r1.primary_pathway.official_url === "https://cybercrime.gov.in/" && r1.secondary_pathways.some(s => s.id === "npci_upi_dispute");
  results.push({ test_id: "TEST_1", name: "Telegram Fake Job Scam (₹8,000, UPI)", passed: p1, status: r1.routing_status, primary: r1.primary_pathway ? r1.primary_pathway.name : "None", url: r1.primary_pathway ? r1.primary_pathway.official_url : "None" });

  // TEST 2: Online purchase/service grievance
  const rec2 = {
    fraud_category: "E-Commerce Non-Delivery & Marketplace Seller Scam",
    semantic_confidence: 85,
    victim_loss: { amount: 450, currency: "USD", payment_method: "Debit Card" },
    platform: "Web Portal / Site",
    suspect_information: [],
    incident_date: "2026-08-10",
    transaction_reference: "ORDER-450",
    incident_summary: "On August 10, 2026, I ordered a camera online for $450 via debit card. The merchant never shipped..."
  };
  const r2 = window.zeroShotEngine.evaluateIndianComplaintRouting(rec2);
  const p2 = r2.routing_status === "ROUTED" && r2.primary_pathway && r2.primary_pathway.id === "national_consumer_helpline" && r2.primary_pathway.official_url === "https://consumerhelpline.gov.in/";
  results.push({ test_id: "TEST_2", name: "Online Purchase / Service Grievance (NCH)", passed: p2, status: r2.routing_status, primary: r2.primary_pathway ? r2.primary_pathway.name : "None", url: r2.primary_pathway ? r2.primary_pathway.official_url : "None" });

  // TEST 3: Case with no payment information
  const rec3 = {
    fraud_category: "Low Semantic Match / Potentially Unseen Fraud Scenario",
    semantic_confidence: 40,
    victim_loss: { amount: null, currency: null, payment_method: null },
    platform: null,
    suspect_information: [],
    incident_date: null,
    transaction_reference: null,
    incident_summary: "I received a suspicious message asking me to log into a website..."
  };
  const r3 = window.zeroShotEngine.evaluateIndianComplaintRouting(rec3);
  const p3 = r3.routing_status === "INSUFFICIENT_INFORMATION" && r3.primary_pathway === null;
  results.push({ test_id: "TEST_3", name: "No Payment Information Case", passed: p3, status: r3.routing_status, primary: "None (Correctly Avoided False Financial Routing)" });

  // TEST 4: Missing transaction information
  const rec4 = {
    fraud_category: "Emerging Cyber-Biometric Fraud",
    semantic_confidence: 80,
    victim_loss: { amount: 3500, currency: "INR", payment_method: "UPI" },
    platform: "Telegram",
    suspect_information: [],
    incident_date: null,
    transaction_reference: null,
    incident_summary: "I transferred ₹3,500 via UPI for a freelance design certificate scam..."
  };
  const r4 = window.zeroShotEngine.evaluateIndianComplaintRouting(rec4);
  const refItem4 = r4.required_information.find(r => r.field.includes("UTR") || r.field.includes("Reference"));
  const p4 = r4.routing_status === "ROUTED" && refItem4 && refItem4.status === "MISSING";
  results.push({ test_id: "TEST_4", name: "Missing Transaction Reference Case", passed: p4, status: r4.routing_status, primary: r4.primary_pathway ? r4.primary_pathway.name : "None", utr_status: refItem4 ? refItem4.status : "Not found" });

  // TEST 5: Completely benign narrative
  const rec5 = {
    fraud_category: "Emerging Cyber-Biometric Fraud",
    semantic_confidence: 10,
    victim_loss: { amount: null, currency: null, payment_method: null },
    platform: null,
    suspect_information: [],
    incident_date: null,
    transaction_reference: null,
    incident_summary: "I bought a coffee at a local cafe today and had a pleasant conversation..."
  };
  const r5 = window.zeroShotEngine.evaluateIndianComplaintRouting(rec5);
  const p5 = r5.routing_status === "BENIGN_NO_ROUTING" && r5.primary_pathway === null;
  results.push({ test_id: "TEST_5", name: "Completely Benign Narrative", passed: p5, status: r5.routing_status, primary: "None (No Forced Fraud Routing)" });

  const allPassed = results.every(r => r.passed);
  console.log(`DIRECT ROUTING UNIT TESTS RESULT: ${allPassed ? 'ALL 5 PASSED' : 'FAILED'}`);
  console.table(results);

  return { all_passed: allPassed, test_results: results };
};

window.runPhase5RoutingTests = async function() {
  console.log("=== STARTING PHASE 5 INTEGRATION & ROUTING TEST SUITE ===");

  // Run Direct Synchronous Routing Unit Tests First
  const directUnitResults = window.runPhase5DirectRoutingUnitTests();

  if (!window.zeroShotEngine.isLoaded) {
    console.log("Initializing Zero-Shot NLI Engine...");
    await window.zeroShotEngine.initModel();
  }

  const testResults = [];

  // TEST 1: Telegram fake job scam (₹8,000, UPI, Victim blocked)
  console.log("\nRunning TEST 1: Telegram fake job scam (₹8,000, UPI, Victim blocked)...");
  const t1_narrative = "I joined a Telegram group where someone promised me a software job. They asked me to pay ₹8,000 as a registration fee through UPI. I sent the money and shared my Aadhaar number and bank account details. After that they blocked me.";
  const t1_analysis = await window.zeroShotEngine.analyzeNarrative(t1_narrative);
  const t1_routing = t1_analysis.indian_routing;
  const t1_pass = t1_routing.routing_status === "ROUTED" && t1_routing.primary_pathway && t1_routing.primary_pathway.id === "cyber_crime_1930" && t1_routing.primary_pathway.official_url === "https://cybercrime.gov.in/" && t1_routing.secondary_pathways.some(s => s.id === "npci_upi_dispute");
  testResults.push({ test_id: "TEST_1", name: "Telegram Fake Job Scam (₹8,000, UPI)", passed: t1_pass, status: t1_routing.routing_status, primary_pathway: t1_routing.primary_pathway ? t1_routing.primary_pathway.name : "None", primary_url: t1_routing.primary_pathway ? t1_routing.primary_pathway.official_url : "None" });

  // TEST 2: Online purchase/service grievance
  console.log("\nRunning TEST 2: Online purchase/service grievance...");
  const t2_narrative = "On August 10, 2026, I ordered a camera online for $450 via debit card. I received an order receipt and tracking number showing delivered to a different state. The merchant never shipped the item and stopped responding.";
  const t2_analysis = await window.zeroShotEngine.analyzeNarrative(t2_narrative);
  const t2_routing = t2_analysis.indian_routing;
  const t2_pass = t2_routing.routing_status === "ROUTED" && t2_routing.primary_pathway && t2_routing.primary_pathway.id === "national_consumer_helpline" && t2_routing.primary_pathway.official_url === "https://consumerhelpline.gov.in/";
  testResults.push({ test_id: "TEST_2", name: "Online Purchase / Service Grievance (Merchant Non-Delivery)", passed: t2_pass, status: t2_routing.routing_status, primary_pathway: t2_routing.primary_pathway ? t2_routing.primary_pathway.name : "None", primary_url: t2_routing.primary_pathway ? t2_routing.primary_pathway.official_url : "None" });

  // TEST 3: Case with no payment information
  console.log("\nRunning TEST 3: Case with no payment information...");
  const t3_narrative = "I received an suspicious message asking me to log into a website to check an update. I did not make any payments or send any money.";
  const t3_analysis = await window.zeroShotEngine.analyzeNarrative(t3_narrative);
  const t3_routing = t3_analysis.indian_routing;
  const t3_pass = t3_routing.routing_status === "INSUFFICIENT_INFORMATION" && t3_routing.primary_pathway === null;
  testResults.push({ test_id: "TEST_3", name: "Non-Financial / No Payment Information Case", passed: t3_pass, status: t3_routing.routing_status, primary_pathway: "None (Correctly Avoided False Financial Routing)" });

  // TEST 4: Missing transaction information
  console.log("\nRunning TEST 4: Missing transaction information...");
  const t4_narrative = "I transferred ₹3,500 via UPI for a freelance design certificate scam, but I don't have the UTR transaction ID or date with me right now.";
  const t4_analysis = await window.zeroShotEngine.analyzeNarrative(t4_narrative);
  const t4_routing = t4_analysis.indian_routing;
  const t4_refItem = t4_routing.required_information.find(r => r.field.includes("UTR") || r.field.includes("Reference"));
  const t4_pass = t4_routing.routing_status === "ROUTED" && t4_refItem && t4_refItem.status === "MISSING";
  testResults.push({ test_id: "TEST_4", name: "Missing Transaction Reference Case", passed: t4_pass, status: t4_routing.routing_status, primary_pathway: t4_routing.primary_pathway ? t4_routing.primary_pathway.name : "None", utr_field_status: t4_refItem ? t4_refItem.status : "Not found" });

  // TEST 5: Completely benign narrative
  console.log("\nRunning TEST 5: Completely benign narrative...");
  const t5_narrative = "I bought a coffee at a local cafe today and had a pleasant conversation with my friend.";
  const t5_analysis = await window.zeroShotEngine.analyzeNarrative(t5_narrative);
  const t5_routing = t5_analysis.indian_routing;
  const t5_pass = t5_routing.routing_status === "BENIGN_NO_ROUTING" && t5_routing.primary_pathway === null;
  testResults.push({ test_id: "TEST_5", name: "Completely Benign Non-Fraud Narrative", passed: t5_pass, status: t5_routing.routing_status, primary_pathway: "None (No Forced Fraud Routing)" });

  // PRESERVATION VERIFICATION (Phase 1-4)
  const preservationPass = (t1_analysis.inference_type === 'zero-shot-nli') && (t1_analysis.model === window.zeroShotEngine.modelName) && (t1_analysis.structured_case_record.complaint_readiness !== undefined) && (t1_analysis.formal_complaint_doc.length > 100);

  const allPassed = testResults.every(t => t.passed) && preservationPass && directUnitResults.all_passed;

  console.log("\n=================================================");
  console.log(`PHASE 5 INTEGRATION TEST SUMMARY: ${allPassed ? 'ALL TESTS PASSED SUCCESSFUL' : 'SOME TESTS FAILED'}`);
  console.log("=================================================");

  return {
    all_passed: allPassed,
    direct_unit_tests: directUnitResults,
    preservation_passed: preservationPass,
    integration_test_results: testResults,
    timestamp: new Date().toISOString()
  };
};
