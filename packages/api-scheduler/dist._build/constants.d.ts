export declare const SCHEDULE_MODEL_ID = "wbySchedule";
export declare const SCHEDULE_ID_PREFIX = "wby-schedule-";
/**
 * Minimum number of seconds in the future that a schedule can be set.
 * Everything else will result in immediately running the action.
 */
export declare const SCHEDULE_MIN_FUTURE_SECONDS = 65;
export declare const SCHEDULED_ACTION_EVENT_IDENTIFIER = "WebinyScheduledAction";
/** Constant identifier for the publish scheduled action type. */
export declare const SCHEDULED_ACTION_PUBLISH: "publish";
/** Constant identifier for the unpublish scheduled action type. */
export declare const SCHEDULED_ACTION_UNPUBLISH: "unpublish";
export declare const SCHEDULED_ACTIONS: readonly ["publish", "unpublish"];
