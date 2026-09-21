import { createAbstraction, type Result } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { ActivityRecord, ActivityTarget } from "~/core/types.js";
import type {
    ActivityLogNotAuthorizedError,
    ActivityLogTargetNotFoundError
} from "~/domain/errors.js";
import type { ActivityLogReadError } from "~/core/errors.js";

export interface IListActivityParams {
    target: ActivityTarget;
    /**
     * The model the target belongs to.
     *
     * Required, and worth explaining because the brief specifies the query takes target type and
     * target id rather than an entry id — which it does. The model is additional, not a
     * substitute, and it is unavoidable: authorisation runs `canAccessEntry({ model })`, and the
     * model cannot be derived from a bare target id without first reading the entry, which is the
     * very thing being authorised. Every CMS read takes a model for the same reason, and the admin
     * timeline sits on an entry form that already knows it.
     */
    modelId: string;
    revision?: string;
    actorId?: string;
    limit?: number;
    cursor?: string | null;
}

export interface IListActivityResult {
    records: ActivityRecord[];
    /** Opaque. Minted by whichever storage implementation produced it. */
    cursor: string | null;
    hasMore: boolean;
}

export interface IListActivityUseCaseErrors {
    notAuthorized: ActivityLogNotAuthorizedError;
    notFound: ActivityLogTargetNotFoundError;
    read: ActivityLogReadError;
}

type ListActivityError = IListActivityUseCaseErrors[keyof IListActivityUseCaseErrors];

export interface IListActivityUseCase {
    execute(params: IListActivityParams): Promise<Result<IListActivityResult, ListActivityError>>;
}

export const ListActivityUseCase = createAbstraction<IListActivityUseCase>(
    "ActivityLog/ListActivityUseCase"
);

export namespace ListActivityUseCase {
    export type Interface = IListActivityUseCase;
    export type Params = IListActivityParams;
    export type Result = IListActivityResult;
    export type Error = ListActivityError;
}

/**
 * Removes changeset paths the reader may not see.
 *
 * A no-op by default, and deliberately so: the CMS field permission evaluator returns `false`
 * unconditionally, so there is currently no such thing as a field a reader may not see. This
 * exists as the single attachment point for that filter when AACL implements it — one
 * `registerDecorator`, no changes anywhere else.
 *
 * It sits here rather than in storage, which is target-agnostic and must not learn what a field
 * is; rather than in the GraphQL resolver, which a second consumer would bypass; and rather than
 * in the UI, which is never a client's job.
 */
export interface IActivityChangesetFilter {
    filter(records: ActivityRecord[], model: CmsModel): Promise<ActivityRecord[]>;
}

export const ActivityChangesetFilter = createAbstraction<IActivityChangesetFilter>(
    "ActivityLog/ActivityChangesetFilter"
);

export namespace ActivityChangesetFilter {
    export type Interface = IActivityChangesetFilter;
}

/**
 * Which records must have their summary withheld from this reader.
 *
 * Inert by default and expected to stay that way for most installations. It exists because a
 * generated summary is the one thing on a record that may quote content — the changeset names
 * fields and never values, but a sentence describing what changed can reasonably contain a
 * fragment of what it changed to. So the feature needs one place to withhold summaries, for a
 * reader who may see that an entry changed but not what it now says.
 *
 * **It answers a question rather than transforming records**, deliberately. A hook that returned
 * records could drop one, and a dropped record is the failure this feature is most careful about:
 * a timeline with gaps in it tells a reader nothing happened when something did. Returning ids
 * leaves the use case holding the guarantee that a suppressed record loses its summary and nothing
 * else.
 *
 * The same reasoning as `ActivityChangesetFilter`, one abstraction along: not in storage, which
 * must not learn what a field is; not in the resolver, which a second consumer would bypass; not
 * in the UI, which is never a client's job.
 */
export interface IActivitySummaryVisibility {
    /** Ids of records whose summary this reader may not see. Empty for "all of them". */
    hidden(records: ActivityRecord[], model: CmsModel): Promise<Set<string>>;
}

export const ActivitySummaryVisibility = createAbstraction<IActivitySummaryVisibility>(
    "ActivityLog/ActivitySummaryVisibility"
);

export namespace ActivitySummaryVisibility {
    export type Interface = IActivitySummaryVisibility;
}
