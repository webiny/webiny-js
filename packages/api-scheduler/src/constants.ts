export const SCHEDULE_MODEL_ID = "wbySchedule";
export const SCHEDULE_ID_PREFIX = "wby-schedule-";
/**
 * Minimum number of seconds in the future that a schedule can be set.
 * Everything else will result in immediately running the action.
 */
export const SCHEDULE_MIN_FUTURE_SECONDS = 65;

export const SCHEDULED_ACTION_EVENT_IDENTIFIER = "WebinyScheduledAction";

/** Constant identifier for the publish scheduled action type. */
export const SCHEDULED_ACTION_PUBLISH = "publish" as const;
/** Constant identifier for the unpublish scheduled action type. */
export const SCHEDULED_ACTION_UNPUBLISH = "unpublish" as const;

export const SCHEDULED_ACTIONS = [SCHEDULED_ACTION_PUBLISH, SCHEDULED_ACTION_UNPUBLISH] as const;
