import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { ActivityEntryAction } from "~/core/types.js";

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
