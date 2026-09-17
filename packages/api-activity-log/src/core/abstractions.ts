import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    ActivityRecord,
    ActivityRecordInput,
    ActivityTarget,
    SummarySkipReason,
    SummaryValueEntry
} from "./types.js";
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
 * What the job writes back when it settles.
 *
 * A summary and a reason are mutually exclusive in practice but both are optional, because a job
 * that fails records only a reason and the sweeper records only a reason. Either way the transient
 * values are cleared, which is the part that must happen.
 */
export interface IActivityLogSettleSummaryParams {
    recordId: string;
    summary?: string;
    reason?: SummarySkipReason;
}

export interface IActivityLogExtendValuesParams {
    recordId: string;
    /** The run's bundle as it should now stand, already merged by the caller. */
    values: SummaryValueEntry[];
}

export interface IActivityLogStaleValuesParams {
    /** Records whose values were written before this instant are considered abandoned. */
    writtenBefore: string;
    limit?: number;
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
 * anything beyond these six operations — that is what makes the swap possible.
 */
export interface IActivityLogStorage {
    /**
     * Append one record.
     *
     * Records are immutable in everything capture writes. The single exception is
     * `settleSummary` below, which adds a summary after the fact and never alters the account of
     * the change itself.
     */
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

    /**
     * Store a summary, or the reason there is none, and clear the transient values — in one write.
     *
     * One operation rather than two because the clear is the obligation. A job that stored a
     * summary and then failed to clear would leave content values on a record with nothing left to
     * consume them, which is exactly what the sweeper exists to prevent and should not be routinely
     * relied upon.
     *
     * Three requirements the private-model adapter satisfies and any replacement must:
     *
     *   - **Idempotent.** A task can run more than once; the second run must be harmless.
     *   - **Must not disturb ordering.** The keyset cursor pages on a sort key the adapter owns, so
     *     an update that moved a record would make a reader skip or repeat rows mid-page.
     *   - **Must tolerate a missing record.** The entry may have been purged while the job ran.
     *     Doing nothing is correct; failing would retry forever and recreating it would resurrect
     *     history that was deliberately deleted.
     */
    settleSummary(
        params: IActivityLogSettleSummaryParams
    ): Promise<Result<void, ActivityLogPersistenceError>>;

    /**
     * Replace a pending record's transient values, so a run of saves shares one job.
     *
     * The debounce is the feature's entire cost control: without it every save in a run dispatches,
     * and a dispatch is three CMS operations plus a Step Functions call plus — when delayed — an
     * extra Lambda invocation before any work happens.
     *
     * Same three requirements as `settleSummary`, plus one of its own:
     *
     *   - **Idempotent**, **must not disturb ordering**, **must tolerate a missing record**.
     *   - **Must refuse a record whose summary has already settled.** A job that finished while a
     *     later save was extending would otherwise have its result overwritten by values nothing
     *     will ever consume, leaving content on a record with no job coming for it.
     */
    extendSummaryValues(
        params: IActivityLogExtendValuesParams
    ): Promise<Result<void, ActivityLogPersistenceError>>;

    /**
     * Records still carrying transient values written before a given instant.
     *
     * The only operation in the feature that looks across targets rather than within one, and the
     * only one the current storage does badly — see the adapter. It exists for the sweeper, which
     * runs on a schedule rather than in a request, so the cost is tolerable where it would not be
     * on a read path.
     */
    findStaleValues(
        params: IActivityLogStaleValuesParams
    ): Promise<Result<ActivityRecord[], ActivityLogReadError>>;
}

export const ActivityLogStorage = createAbstraction<IActivityLogStorage>("ActivityLog/Storage");

export namespace ActivityLogStorage {
    export type Interface = IActivityLogStorage;
    export type ListParams = IActivityLogListParams;
    export type ListResult = IActivityLogListResult;
    export type DeletionProgress = IActivityLogDeletionProgress;
    export type SettleSummaryParams = IActivityLogSettleSummaryParams;
    export type ExtendValuesParams = IActivityLogExtendValuesParams;
    export type StaleValuesParams = IActivityLogStaleValuesParams;
}
