import { ScheduleActionType } from "@webiny/app-scheduler/types.js";
import type { SchedulerEntry } from "@webiny/app-scheduler/types.js";

/**
 * A scheduled action is superseded by a direct publish/unpublish. The API cancels it, but that
 * happens asynchronously, so reconcile against the entry's current state to clear the badge
 * immediately instead of waiting for the backend cancellation to propagate:
 *
 * - Scheduled PUBLISH is moot once the latest revision is already live (`live.version === version`).
 *   It is NOT moot when an older revision is live and a newer one is queued (live.version < version)
 *   — that is the legitimate "live and scheduled" case.
 * - Scheduled UNPUBLISH is moot once nothing is live.
 */
export const isScheduleMoot = (
    scheduled: SchedulerEntry,
    liveVersion: number | undefined,
    currentVersion: number | undefined
): boolean => {
    if (scheduled.actionType === ScheduleActionType.unpublish) {
        return liveVersion === undefined;
    }
    return liveVersion !== undefined && liveVersion === currentVersion;
};
