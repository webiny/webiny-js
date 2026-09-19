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

export interface IActivityLogDeletionProgress {
    /** False when records remain and the caller should invoke again. */
    finished: boolean;
    /** How many records this call removed. Zero alongside `finished: false` means no progress. */
    deleted: number;
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
     * Remove records for a target, in a bounded chunk. Idempotent, so a caller that stops
     * part-way through can simply invoke again.
     *
     * Reports progress rather than only success or failure, because its caller is a background
     * task that has to tell three outcomes apart: finished, more remain, and broken. Collapsing
     * the middle case into either of the others is what makes a cleanup loop spin — which is the
     * defect `EmptyTrashBinTaskDefinition` has, where a persistently failing delete is swallowed
     * and the loop re-reads the same page until the timeout check breaks it.
     */
    deleteAllForTarget(
        target: ActivityTarget
    ): Promise<Result<IActivityLogDeletionProgress, ActivityLogPersistenceError>>;
}

export const ActivityLogStorage = createAbstraction<IActivityLogStorage>("ActivityLog/Storage");

export namespace ActivityLogStorage {
    export type Interface = IActivityLogStorage;
    export type ListParams = IActivityLogListParams;
    export type ListResult = IActivityLogListResult;
    export type DeletionProgress = IActivityLogDeletionProgress;
}
