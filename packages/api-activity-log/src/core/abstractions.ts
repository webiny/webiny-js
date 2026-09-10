import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ActivityRecord, ActivityRecordInput, ActivityTarget } from "./types.js";
import type { ActivityLogPersistenceError, ActivityLogReadError } from "./errors.js";

export interface IActivityLogListParams {
    target: ActivityTarget;
    /** Narrow to a single revision, including its suffix. */
    revision?: string;
    /** Narrow to a single actor. */
    actorId?: string;
    limit?: number;
    cursor?: string | null;
}

export interface IActivityLogListResult {
    /** Newest first. */
    records: ActivityRecord[];
    cursor: string | null;
    hasMore: boolean;
}

/**
 * The whole storage surface, deliberately narrow.
 *
 * The private CMS model behind this interface is a known stopgap: its per-target read loads the
 * entire model on every page view, and a lighter mechanism is expected to replace it. Nothing
 * above this interface may depend on CMS entry semantics, on the model being queryable, or on
 * anything beyond these three operations — that is what makes the swap possible.
 */
export interface IActivityLogStorage {
    /** Append one record. Records are immutable once written; there is no update. */
    append(
        record: ActivityRecordInput
    ): Promise<Result<ActivityRecord, ActivityLogPersistenceError>>;

    list(
        params: IActivityLogListParams
    ): Promise<Result<IActivityLogListResult, ActivityLogReadError>>;

    /**
     * Remove every record for a target. Idempotent, so a caller that times out part-way through
     * can simply be invoked again.
     */
    deleteAllForTarget(target: ActivityTarget): Promise<Result<void, ActivityLogPersistenceError>>;
}

export const ActivityLogStorage = createAbstraction<IActivityLogStorage>("ActivityLog/Storage");

export namespace ActivityLogStorage {
    export type Interface = IActivityLogStorage;
    export type ListParams = IActivityLogListParams;
    export type ListResult = IActivityLogListResult;
}
