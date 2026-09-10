import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type {
    ActivityAction,
    ActivityEntryAction,
    ActivityReviewAction,
    ActivitySubject,
    ChangesetEntry
} from "~/core/types.js";
import type { IWorkflowState } from "@webiny/api-workflows/domain/workflowState/abstractions.js";

export interface IRecordEntryActivityParams {
    model: CmsModel;
    /** The entry as it is after the write. */
    entry: CmsEntry;
    action: ActivityEntryAction;
    /**
     * The entry as it was before the write, when the event carries one. Its absence means "no
     * changeset", not "everything changed" — a publish or a move changes no field values.
     */
    original?: CmsEntry;
    /**
     * Shared by every record one operation produces. Supplied by a handler that fans out over
     * several entries, such as a bulk delete; minted per record otherwise.
     */
    correlationId?: string;
}

/**
 * Records one entry activity.
 *
 * **Never throws, never rejects.** Event handlers run inline, sequentially and awaited inside the
 * write, so an exception here fails a save that has already persisted. Audit logs has that defect
 * today and it is the single hardest requirement in this feature, so the contract is stated in the
 * type: `record` returns `void`, offers no error channel, and swallows everything.
 */
export interface IEntryActivityRecorder {
    record(params: IRecordEntryActivityParams): Promise<void>;
}

export const EntryActivityRecorder = createAbstraction<IEntryActivityRecorder>(
    "ActivityLog/EntryActivityRecorder"
);

export namespace EntryActivityRecorder {
    export type Interface = IEntryActivityRecorder;
    export type Params = IRecordEntryActivityParams;
}

/** Resolves the label describing where a write came from. */
export interface IActivitySourceResolver {
    resolve(): string;
}

export const ActivitySourceResolver = createAbstraction<IActivitySourceResolver>(
    "ActivityLog/ActivitySourceResolver"
);

export namespace ActivitySourceResolver {
    export type Interface = IActivitySourceResolver;
}

export interface IWriteActivityParams {
    targetId: string;
    revision: string;
    action: ActivityAction;
    correlationId?: string;
    changeset?: ChangesetEntry[];
    truncated?: boolean;
    subject?: ActivitySubject;
    hasNote?: boolean;
}

/**
 * Writes one record. Never throws — see the implementation for why that is stated in the type.
 */
export interface IActivityWriter {
    write(params: IWriteActivityParams): Promise<void>;
}

export const ActivityWriter = createAbstraction<IActivityWriter>("ActivityLog/ActivityWriter");

export namespace ActivityWriter {
    export type Interface = IActivityWriter;
    export type Params = IWriteActivityParams;
}

export interface IRecordReviewActivityParams {
    /** The workflow state as it is after the action. */
    state: IWorkflowState;
    action: ActivityReviewAction;
    /** Whether the actor attached a note. Its content is never passed in, let alone stored. */
    hasNote?: boolean;
    /** Shared with the terminal record a final approval or rejection also produces. */
    correlationId?: string;
}

/**
 * Records publishing workflow activity against the entry under review.
 *
 * Never throws, for the same reason as the entry recorder: APW handlers run inline inside the
 * workflow write.
 */
export interface IReviewActivityRecorder {
    record(params: IRecordReviewActivityParams): Promise<void>;
}

export const ReviewActivityRecorder = createAbstraction<IReviewActivityRecorder>(
    "ActivityLog/ReviewActivityRecorder"
);

export namespace ReviewActivityRecorder {
    export type Interface = IReviewActivityRecorder;
    export type Params = IRecordReviewActivityParams;
}
