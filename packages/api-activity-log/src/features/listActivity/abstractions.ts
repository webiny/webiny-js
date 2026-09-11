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
