/**
 * Check if the provided date is in the future.
 * We need to ensure that the date is at least a SCHEDULE_MIN_FUTURE_MINUTES minutes in the future.
 * Otherwise, we consider it as "immediate" and run the action right away.
 */
export declare const isValidDate: (input: Date) => boolean;
