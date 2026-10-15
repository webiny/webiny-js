/**
 * The most characters the AI step takes in (R175): the serialised target content, the previous
 * step comments and the step instructions together. Over it the step fails before any model call;
 * nothing is ever truncated, because the AI must not approve content it never saw. `readTarget`
 * (Task 10) and the AI runner (Task 19) share it.
 */
export const AI_STEP_MAX_INPUT_CHARACTERS = 200000;
