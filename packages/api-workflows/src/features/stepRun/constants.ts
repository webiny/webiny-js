/** The one private background task definition that runs an automation step (R142). */
export const STEP_RUN_TASK_DEFINITION_ID = "workflowsStepRun";

/**
 * The task definition's ceiling (R142). The handler enforces the automation definition's own
 * `maxIterations` below it (R145).
 */
export const STEP_RUN_MAX_ITERATIONS = 10000;

/**
 * How many times the handler waits for the review and the step to carry its task id before it
 * treats the run as stale (R143): it waits while `iterations <= STEP_RUN_TASKID_WAIT_TRIES`.
 */
export const STEP_RUN_TASKID_WAIT_TRIES = 3;

/** The continue delay, in seconds, of one wait for the task id (R143). */
export const STEP_RUN_TASKID_WAIT_SECONDS = 2;

/** Used when the automation definition has no `maxIterations` (R145). */
export const DEFAULT_AUTOMATION_MAX_ITERATIONS = 50;

/**
 * How long, in milliseconds, a `failed` or `aborted` task may be finished before stuck detection
 * treats the step as stuck (R152): until then the runner's `onError` / `onAbort` hooks may still
 * fail the step with the proper reason.
 */
export const STEP_RUN_STUCK_GRACE_MS = 300000;
