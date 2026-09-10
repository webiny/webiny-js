import { Result } from "@webiny/feature/api";
import { GetLatestRevisionByEntryIdIncludingDeletedUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ActivityLogStorage } from "~/core/abstractions.js";
import type { ActivityRecord } from "~/core/types.js";
import { ActivityLogNotAuthorizedError, ActivityLogTargetNotFoundError } from "~/domain/errors.js";
import { ActivityLogPermissions } from "~/features/permissions/index.js";
import {
    ActivityChangesetFilter,
    ListActivityUseCase as Abstraction,
    type IListActivityParams
} from "./abstractions.js";

/** What an actor looks like to a reader without `activityLog.actor`. */
const REDACTED_ACTOR = {
    id: "",
    type: "",
    displayName: ""
} as const;

class ListActivityUseCaseImpl implements Abstraction.Interface {
    constructor(
        private permissions: ActivityLogPermissions.Interface,
        private getModel: GetModelUseCase.Interface,
        private getTargetEntry: GetLatestRevisionByEntryIdIncludingDeletedUseCase.Interface,
        private storage: ActivityLogStorage.Interface,
        private changesetFilter: ActivityChangesetFilter.Interface
    ) {}

    /**
     * ## Check order matters, and this order is deliberate
     *
     * The permission is checked **before** the model is resolved. The reverse order — resolve,
     * return `NotFound`, then authorise — tells an unauthorised caller whether a target exists,
     * which is an existence oracle over every entry in the installation. So:
     *
     *   1. `activityLog.timeline` — may this caller read timelines at all?
     *   2. resolve the model — only now is it safe to distinguish missing from forbidden.
     *   3. read the target *within that model* — which authorises and validates membership.
     *
     * A caller failing step 1 cannot tell a real target from an invented one.
     *
     * ## Why step 3 reads the entry rather than only checking access
     *
     * `modelId` is caller-supplied, and storage keys records on target id alone — records do not
     * carry a model. Authorising against the *supplied* model while retrieving by target id alone
     * would let a reader authorise against a model they can read and pull activity for a target in
     * one they cannot: pass `modelId` of a readable model with the `targetId` of an entry
     * elsewhere, and the checks pass while the records come from the other model.
     *
     * Reading the target within the supplied model closes it, because the read fails when the
     * entry is not in that model. The CMS use case also performs `canAccessEntry({ model })`
     * itself, so authorisation and membership are one call on the sanctioned path rather than two
     * checks that could drift.
     *
     * The `IncludingDeleted` variant is deliberate: this feature records trashing and restoring,
     * so a binned entry's timeline has to stay readable — that history is often exactly what
     * someone is looking for.
     */
    async execute(params: IListActivityParams) {
        const canReadTimeline = await this.permissions.canAccess("timeline");

        if (!canReadTimeline) {
            return Result.fail(new ActivityLogNotAuthorizedError());
        }

        const canSeeActor = await this.permissions.canAccess("actor");

        // Filtering by actor is itself an actor-identity operation: it answers "did this person
        // touch this entry" without ever rendering a name. Rejected rather than ignored, so a
        // caller is never silently handed unfiltered results.
        if (params.actorId && !canSeeActor) {
            return Result.fail(new ActivityLogNotAuthorizedError());
        }

        const modelResult = await this.getModel.execute(params.modelId);

        if (modelResult.isFail()) {
            return Result.fail(new ActivityLogTargetNotFoundError(params.target.id));
        }

        const model = modelResult.value;

        const targetEntry = await this.getTargetEntry.execute(model, { id: params.target.id });

        if (targetEntry.isFail()) {
            // Not authorised to read the model, or the target does not live in it. Both are
            // reported as this caller already knows: the CMS gives the same answers for a direct
            // entry read, so nothing new is disclosed either way.
            return targetEntry.error.code === "Cms/Entry/NotAuthorized"
                ? Result.fail(new ActivityLogNotAuthorizedError())
                : Result.fail(new ActivityLogTargetNotFoundError(params.target.id));
        }

        const listed = await this.storage.list({
            target: params.target,
            revision: params.revision,
            actorId: params.actorId,
            limit: params.limit,
            cursor: params.cursor
        });

        if (listed.isFail()) {
            return Result.fail(listed.error);
        }

        const filtered = await this.changesetFilter.filter(listed.value.records, model);

        return Result.ok({
            records: canSeeActor ? filtered : filtered.map(redactActor),
            cursor: listed.value.cursor,
            hasMore: listed.value.hasMore
        });
    }
}

/**
 * Redacts the actor while leaving the record otherwise intact.
 *
 * The record is not hidden. Hiding it would make the timeline lie by omission — a reader would see
 * gaps in an entry's history and reasonably conclude nothing happened in them. A redacted record
 * says something true: this changed, then, in these fields, by someone.
 *
 * The placeholder carries no identity at all, not even a stable pseudonym: a pseudonym is
 * re-identifiable across a timeline by anyone who can correlate one record with a known event.
 */
const redactActor = (record: ActivityRecord): ActivityRecord => ({
    ...record,
    actor: { ...REDACTED_ACTOR }
});

export const ListActivityUseCase = Abstraction.createImplementation({
    implementation: ListActivityUseCaseImpl,
    dependencies: [
        ActivityLogPermissions,
        GetModelUseCase,
        GetLatestRevisionByEntryIdIncludingDeletedUseCase,
        ActivityLogStorage,
        ActivityChangesetFilter
    ]
});
