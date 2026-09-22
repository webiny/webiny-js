/**
 * Shared so the dispatcher and the task definition cannot drift apart. A mismatch here fails at
 * trigger time with "task definition was not found", which is a long way from the cause.
 */
export const SUMMARISE_ACTIVITY_TASK_ID = "activityLogSummariseSave";
