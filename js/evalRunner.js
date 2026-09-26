/**
 * Phase 4 Evaluation Runner
 * Runs the dataset scenarios through window.zeroShotEngine.analyzeNarrative()
 * and logs/stores full metrics for report generation.
 */

window.runPhase4Evaluation = async function() {
  console.log("Starting Phase 4 Zero-Shot Generalization Evaluation...");
  
  const datasetResp = await fetch('data/zero_shot_eval/dataset.json');
  const dataset = await datasetResp.json();

  const results = {
    known: [],
    unseen: [],
    ablated: [],
    paraphrased: [],
    non_fraud: []
  };

  // Ensure engine model is loaded
  if (!window.zeroShotEngine.isLoaded) {
    console.log("Loading DeBERTa NLI Model...");
    await window.zeroShotEngine.initModel();
  }

  // 1. KNOWN CASES
  for (const scenario of dataset.known_cases) {
    console.log(`Evaluating KNOWN: ${scenario.id} - ${scenario.name}...`);
    const res = await window.zeroShotEngine.analyzeNarrative(scenario.text);
    const top = res.candidateScores[0];
    const second = res.candidateScores[1];

    results.known.push({
      id: scenario.id,
      name: scenario.name,
      type: scenario.type,
      text: scenario.text,
      predicted_category: res.detected_category,
      top_score: top ? top.rawScore : 0,
      second_score: second ? second.rawScore : 0,
      second_category: second ? second.label : '',
      match_status: res.classification_status,
      confidence_pct: res.semantic_match_strength,
      readiness: res.structured_case_record ? res.structured_case_record.complaint_readiness : 'INCOMPLETE',
      missing_info: res.structured_case_record ? res.structured_case_record.missing_information : []
    });
  }

  // 2. UNSEEN CASES
  for (const scenario of dataset.unseen_cases) {
    console.log(`Evaluating UNSEEN: ${scenario.id} - ${scenario.name}...`);
    const res = await window.zeroShotEngine.analyzeNarrative(scenario.text);
    const top = res.candidateScores[0];
    const second = res.candidateScores[1];

    results.unseen.push({
      id: scenario.id,
      name: scenario.name,
      type: scenario.type,
      text: scenario.text,
      predicted_category: res.detected_category,
      top_score: top ? top.rawScore : 0,
      second_score: second ? second.rawScore : 0,
      second_category: second ? second.label : '',
      match_status: res.classification_status,
      confidence_pct: res.semantic_match_strength,
      readiness: res.structured_case_record ? res.structured_case_record.complaint_readiness : 'INCOMPLETE',
      missing_info: res.structured_case_record ? res.structured_case_record.missing_information : []
    });
  }

  // 3. ABLATED CASES
  for (const scenario of dataset.ablated_cases) {
    console.log(`Evaluating ABLATED: ${scenario.id} - ${scenario.name}...`);
    const res = await window.zeroShotEngine.analyzeNarrative(scenario.text);
    const top = res.candidateScores[0];
    const second = res.candidateScores[1];

    // Find original matching unseen scenario
    const orig = results.unseen.find(u => u.id === scenario.original_id);

    results.ablated.push({
      id: scenario.id,
      original_id: scenario.original_id,
      name: scenario.name,
      text: scenario.text,
      predicted_category: res.detected_category,
      original_score: orig ? orig.top_score : 0,
      ablated_score: top ? top.rawScore : 0,
      score_diff: orig ? parseFloat((top.rawScore - orig.top_score).toFixed(4)) : 0,
      classification_preserved: orig ? (res.detected_category === orig.predicted_category) : false
    });
  }

  // 4. PARAPHRASED CASES
  for (const group of dataset.paraphrased_cases) {
    for (const v of group.versions) {
      console.log(`Evaluating PARAPHRASE: ${v.id} (${group.group} - Ver ${v.version})...`);
      const res = await window.zeroShotEngine.analyzeNarrative(v.text);
      const top = res.candidateScores[0];

      results.paraphrased.push({
        group: group.group,
        version: v.version,
        id: v.id,
        text: v.text,
        predicted_category: res.detected_category,
        top_score: top ? top.rawScore : 0,
        score_pct: res.semantic_match_strength
      });
    }
  }

  // 5. NON-FRAUD CASE
  for (const scenario of dataset.non_fraud_cases) {
    console.log(`Evaluating NON-FRAUD: ${scenario.id}...`);
    const res = await window.zeroShotEngine.analyzeNarrative(scenario.text);
    const top = res.candidateScores[0];

    results.non_fraud.push({
      id: scenario.id,
      name: scenario.name,
      text: scenario.text,
      predicted_category: res.detected_category,
      top_score: top ? top.rawScore : 0,
      match_status: res.classification_status,
      confidence_pct: res.semantic_match_strength,
      is_novel_or_low_match: res.isNovelZeroShotScenario
    });
  }

  window.evalResults = results;
  console.log("Phase 4 Evaluation Complete!", results);

  // Render to DOM for headless capture
  let container = document.getElementById('eval-result-json');
  if (!container) {
    container = document.createElement('pre');
    container.id = 'eval-result-json';
    container.style.display = 'none';
    document.body.appendChild(container);
  }
  container.textContent = JSON.stringify(results, null, 2);

  return results;
};

// Check for autorun URL parameter
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('autorun') === 'true') {
    setTimeout(async () => {
      try {
        await window.runPhase4Evaluation();
      } catch (err) {
        console.error("Auto-run evaluation failed:", err);
      }
    }, 2000);
  }
});
