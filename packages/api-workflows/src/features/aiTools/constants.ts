/**
 * The most characters the AI step takes in (R175): the serialised target content, the previous
 * step comments and the step instructions together. Over it the step fails before any model call;
 * nothing is ever truncated, because the AI must not approve content it never saw. `readTarget`
 * and the AI runner share it.
 */
export const AI_STEP_MAX_INPUT_CHARACTERS = 200000;

/** The built-in tools (R173); a step allowlists them like any other tool. */
export const READ_TARGET_TOOL_NAME = "readTarget";
export const UPDATE_TARGET_FIELDS_TOOL_NAME = "updateTargetFields";
export const BUILT_IN_AI_TOOL_NAMES = [READ_TARGET_TOOL_NAME, UPDATE_TARGET_FIELDS_TOOL_NAME];

/**
 * Fixed texts the tools answer to the model (R87: never a provider or storage error). The AI
 * runner also fails a step over the input cap with the first one.
 */
export const AI_STEP_CONTENT_TOO_LARGE_MESSAGE = "The content is too large for the AI review.";
export const AI_TOOL_STEP_NOT_RUNNING_MESSAGE = "The review step is no longer running.";
export const AI_TOOL_STEP_CHECK_FAILED_MESSAGE =
    "The step could not be checked; nothing was written.";
export const AI_TOOL_NO_FIELDS_MESSAGE = "No fields were given.";
