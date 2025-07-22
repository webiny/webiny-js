import { SCHEDULE_MIN_FUTURE_SECONDS } from "~/constants.js";

/**
 * Check if the provided date is in the future.
 * We need to ensure that the date is at least a SCHEDULE_MIN_FUTURE_MINUTES minutes in the future.
 * Otherwise, we consider it as "immediate" and run the action right away.
 */
export const dateInTheFuture = (date: Date): boolean => {
    const minDate = new Date(Date.now() + SCHEDULE_MIN_FUTURE_SECONDS * 1000);

    return date.getTime() >= minDate.getTime();
};
