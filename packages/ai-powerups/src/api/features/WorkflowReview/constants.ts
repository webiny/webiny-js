/** The capability the AI step type resolves (R164). Persisted as a settings key: never rename it. */
export const WORKFLOWS_REVIEW_CAPABILITY_ID = "workflows.review";

/** Most model and tool steps one AI step run may take before it must have decided (R171). */
export const AI_STEP_MAX_TOOL_STEPS = 20;

/** Most issues one AI decision keeps; extras are dropped and logged (R171). */
export const AI_STEP_MAX_ISSUES = 50;

/** Most characters one AI decision comment keeps; the rest is cut (R171). */
export const AI_STEP_MAX_COMMENT_LENGTH = 5000;
