import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { generateAlphaNumericLowerCaseId, parseIdentifier } from "@webiny/utils";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { ActivityLogStorage } from "~/core/abstractions.js";
import { diffValues } from "~/core/diff/diffValues.js";
import type { ActivityActor, ChangesetEntry } from "~/core/types.js";
import { modelToFieldDescriptors } from "~/cms/model/toFieldDescriptors.js";
import {
    ActivitySourceResolver,
    EntryActivityRecorder as Abstraction,
    type IRecordEntryActivityParams
} from "./abstractions.js";

/**
 * Everything substantive about capture happens here: the private-model filter, actor resolution,
 * source labelling, correlation ids, diffing and persistence. The event handlers above are
 * deliberately thin, so there is one place for this to be right rather than thirteen.
 *
 * ## Failure containment
 *
 * `record` never throws and never rejects. `EventPublisher` awaits handlers sequentially, inline,
 * inside the write, so a rejection here surfaces as a failed entry save *after* the entry has
 * already been persisted — the user sees an error, the data is committed, and the two disagree.
 * Audit logs does exactly that today (`AuditLogEntryAfterUpdateEventHandler` wraps and rethrows).
 *
 * So the whole body is wrapped, including the parts that look incapable of throwing: a getter on a
 * malformed entry, a model whose fields are not what the type claims, a storage client that throws
 * synchronously rather than rejecting. A dropped activity record is an acceptable loss; a failed
 * save is not.
 */
class EntryActivityRecorderImpl implements Abstraction.Interface {
    constructor(
        private storage: ActivityLogStorage.Interface,
        private identityContext: IdentityContext.Interface,
        private sourceResolver: ActivitySourceResolver.Interface
    ) {}

    async record(params: IRecordEntryActivityParams): Promise<void> {
        try {
            await this.attemptRecord(params);
        } catch (error) {
            this.reportFailure(params, error);
        }
    }

    private async attemptRecord(params: IRecordEntryActivityParams): Promise<void> {
        const { model, entry, action, original, correlationId } = params;

        // Core features store their own data as entries in private models — background tasks and
        // their logs, folders, record locks, scheduled actions, languages, workflow states, and
        // Website Builder pages and redirects. Capturing those would bury real editorial activity
        // under internal bookkeeping, and would also mean recording the activity log's own writes.
        if (model.isPrivate) {
            return;
        }

        const { changeset, truncated } = this.buildChangeset(model, original, entry);

        const result = await this.storage.append({
            targetType: "cms-entry",
            targetId: this.targetIdOf(entry),
            revision: entry.id,
            timestamp: new Date().toISOString(),
            actor: this.resolveActor(),
            action,
            source: this.sourceResolver.resolve(),
            correlationId: correlationId ?? generateAlphaNumericLowerCaseId(12),
            changeset,
            truncated
        });

        if (result.isFail()) {
            // Storage already converted this into a domain error rather than throwing, so it
            // arrives here as a value. Report it and carry on; the save must not be affected.
            this.reportFailure(params, result.error);
        }
    }

    /**
     * An event without an `original` is not a silent "everything changed" — a publish, an
     * unpublish, a move or a trashing changes no field values at all, and the honest changeset for
     * those is empty. Only events that carry both sides produce one.
     */
    private buildChangeset(
        model: CmsModel,
        original: CmsEntry | undefined,
        entry: CmsEntry
    ): { changeset: ChangesetEntry[]; truncated: boolean } {
        if (!original) {
            return { changeset: [], truncated: false };
        }

        return diffValues(modelToFieldDescriptors(model), original.values, entry.values);
    }

    /**
     * The actor is the ambient identity, never `entry.savedBy`.
     *
     * Every `*By` meta field on an entry is settable through the manage API — `createManageSDL`
     * renders each one as a `CmsIdentityInput` and the data factories honour the input over the
     * ambient identity — so an entry's own record of who saved it is client-controlled and cannot
     * be the basis of an audit trail.
     *
     * `IdentityContext.getIdentity()` never returns null; it falls back to `AnonymousIdentity`.
     * The legacy `context.security` shim, which returned undefined for an anonymous identity and
     * is why audit logs silently skips those writes, no longer exists on this branch.
     */
    private resolveActor(): ActivityActor {
        const identity = this.identityContext.getIdentity();

        return {
            id: identity.id,
            type: identity.type,
            displayName: identity.displayName ?? ""
        };
    }

    /** The entry identity without its revision suffix, so a timeline spans revisions. */
    private targetIdOf(entry: CmsEntry): string {
        if (entry.entryId) {
            return entry.entryId;
        }

        return parseIdentifier(entry.id).id;
    }

    private reportFailure(params: IRecordEntryActivityParams, error: unknown): void {
        try {
            console.error(
                `[activity-log] Failed to record "${params.action}" for entry ` +
                    `"${params.entry?.id}" on model "${params.model?.modelId}". ` +
                    `The write itself was not affected.`,
                error
            );
        } catch {
            // Even logging is not allowed to break the write.
        }
    }
}

export const EntryActivityRecorder = Abstraction.createImplementation({
    implementation: EntryActivityRecorderImpl,
    dependencies: [ActivityLogStorage, IdentityContext, ActivitySourceResolver]
});
