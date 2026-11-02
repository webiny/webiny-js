# Phase 6 open questions: answers (2026-10-14)

- Q5 (package cycle): resolved by controller — no workflows package depends on @webiny/ai-powerups (checked package.json files); ai-powerups may depend on @webiny/api-workflows; the end-to-end AI step test lives in ai-powerups.
- Q1 runner: (a) reuse the private `workflowsStepRun` task; a step-type-neutral step runner dispatches by step type; stale guard, waits, stuck detection, abort and restart shared by AI and automation steps; phase 5 tests must stay green through the refactor.
- Q2 model: the workflow author chooses the model on the step (D101). Implemented as (a): ResolveAiCapabilityUseCase.execute gains optional `model`; keeps enabled/licence gate; picks the first configured connection whose provider matches the chosen model; none → step fails with fixed model-not-available reason. The editor should offer only models that have a configured connection (save-time validation refuses others).
- Q3 updateTargetFields: (a) CMS top-level + nested object fields by dotted path, validated against the model, no dynamic zones or references; WB read full, write only page title/properties/SEO, not the element tree.
- Q4 limits: (a) fixed input cap 200000 characters (constant) failing the step with a fixed reason; abort signal tied to the task's remaining runtime failing with "The AI review timed out."; no truncation.
