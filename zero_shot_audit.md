# Zero-Shot Consumer Fraud Analyzer: Technical Audit & Model Implementation Report

---

## Executive Summary & Verdict

- **Audit Date**: September 26, 2026
- **Target Files**: `js/zeroShotEngine.js`, `js/app.js`, `index.html`
- **Model Executed**: `Xenova/nli-deberta-v3-small` (via `@xenova/transformers`)
- **Primary Objective**: Replace keyword heuristic rules with genuine pretrained Zero-Shot NLI model inference.

### 🏆 Verdict: **`GENUINE ZERO-SHOT NLI`**

---

## A. Current Genuine Architecture

The application executes browser-side Zero-Shot Natural Language Inference (NLI) using ONNX Transformer weights initialized via `@xenova/transformers`:

```
+-----------------------------------------------------------------------+
|                              index.html                               |
|   - Imports @xenova/transformers library via ES Module                |
|   - Renders UI, NLI Model Status Indicator & Dynamic Form Panels       |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------+-----------------------------------+
|                              js/app.js                                |
|   - Triggers window.zeroShotEngine.initModel() on page load            |
|   - Tracks loading progress & model status                            |
|   - Handles test benchmark suite (Known & Unseen Scenarios)           |
|   - Renders Chart.js charts showing softmax entailment probabilities  |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------+-----------------------------------+
|                       js/zeroShotEngine.js                            |
|   - Pipeline: pipeline('zero-shot-classification', 'nli-deberta-v3')  |
|   - Natural Language Candidate Hypotheses (no keyword matching)      |
|   - NLI Model Entailment Inference: classifier(narrative, labels)     |
|   - Low-Match Thresholding (< 0.22 -> LOW_MATCH_POTENTIALLY_NOVEL)    |
|   - Model-Derived Semantic Match Strength                             |
+-----------------------------------------------------------------------+
```

---

## B. What is Genuinely Zero-Shot

1. **Pretrained NLI Model Execution**:
   - The classifier uses `Xenova/nli-deberta-v3-small` running ONNX weights in the browser.
   - Computes cross-encoder entailment probabilities $P(\text{Entailment} \mid \text{Premise, Hypothesis})$ directly from the model's logits.
2. **No Keyword Rules for Classification**:
   - Classification scores are derived purely from model inference without checking hard-coded string arrays.
3. **Generalization to Unseen Scenarios**:
   - The model generalizes from novel narrative premises (e.g., *"transferred ₹30,000 to a gaming community member who deleted their account"*) to abstract candidate concepts (*"online marketplace non-delivery or seller disappearance"*) without needing special "gaming" rules or keywords.
4. **Threshold-Based Novel Case Handling**:
   - Inputs with low entailment probabilities across all candidate concepts (`< 0.22`) are classified as `LOW_MATCH_POTENTIALLY_NOVEL` rather than defaulting to an arbitrary first index.

---

## C. Model Specifications & Implementation Pointers

- **Model Name**: `Xenova/nli-deberta-v3-small` (Fallback: `Xenova/typeform-distilbert-base-uncased-mnli`)
- **Library**: `@xenova/transformers` (v2.17.2)
- **Pipeline Initialization**: [`zeroShotEngine.js`: L202-L215](file:///c:/Users/hp/Desktop/zero%20shot/js/zeroShotEngine.js#L202-L215)
- **NLI Inference Execution**: [`zeroShotEngine.js`: L257-L262](file:///c:/Users/hp/Desktop/zero%20shot/js/zeroShotEngine.js#L257-L262)
- **Thresholding Logic**: [`zeroShotEngine.js`: L285-L310](file:///c:/Users/hp/Desktop/zero%20shot/js/zeroShotEngine.js#L285-L310)
- **Test Results Log**: [`zero_shot_test_results.md`](file:///c:/Users/hp/Desktop/zero%20shot/zero_shot_test_results.md)

---

### Final Verdict

### **`GENUINE ZERO-SHOT NLI`**
