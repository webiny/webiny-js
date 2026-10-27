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

/**
 * How much of the task's remaining runtime the handler keeps back, in milliseconds, when it
 * builds the runner's abort signal (R175): the signal fires at `remaining - margin`.
 */
export const STEP_RUN_TIMEOUT_MARGIN_MS = 30000;

/**
 * Below this many milliseconds left after the margin, the signal is aborted at once instead of
 * starting a timer (R175): the step fails as timed out, restartable.
 */
export const STEP_RUN_MIN_TIMEOUT_MS = 1000;

/**
 * The most often a caller re-reads the stored review through `StepRunStaleCheckService` during a
 * run, in milliseconds (R175). The service itself does not throttle: `AiStepRunner` does.
 */
export const STEP_RUN_STALE_CHECK_INTERVAL_MS = 5000;

/** Stored by a failure hook or stuck detection for a step type with no runner (R168). */
export const STEP_RUN_NEUTRAL_FAILED_REASON = "The step failed.";

/** Stored by `onAbort` for a step type with no runner (R168). */
export const STEP_RUN_NEUTRAL_ABORTED_REASON = "The step was aborted.";

/**
 * The error a step run task stores for an unexpected error (not a `StepRunFailure`); the raw error
 * is only logged (R146, D188).
 */
export const STEP_RUN_UNEXPECTED_ERROR_MESSAGE = "The step run failed.";
export const STEP_RUN_UNEXPECTED_ERROR_CODE = "Workflows/StepRun/Failed";
