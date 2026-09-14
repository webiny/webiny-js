import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { generateAlphaNumericLowerCaseId } from "@webiny/utils";
import { ActivityLogStorage } from "~/core/abstractions.js";
import type { ActivityActor } from "~/core/types.js";
import {
    ActivitySourceResolver,
    ActivityWriter as Abstraction,
    type IWriteActivityParams
} from "./abstractions.js";

/**
 * The single place a record is written, and the single place failure is contained.
 *
 * Both recorders sit on top of this rather than each carrying their own `try`. Containment is the
 * hardest requirement in the feature and the easiest to get subtly wrong, so it exists once: a
 * second copy would be a second chance to forget that a synchronous throw is not a rejection, or
 * that a failed `Result` still needs swallowing.
 *
 * `write` never throws and never rejects. Event handlers run inline, sequentially and awaited
 * inside the write, so a rejection here fails a save that has already persisted.
 */
class ActivityWriterImpl implements Abstraction.Interface {
    constructor(
        private storage: ActivityLogStorage.Interface,
        private identityContext: IdentityContext.Interface,
        private sourceResolver: ActivitySourceResolver.Interface
    ) {}

    async write(params: IWriteActivityParams): Promise<void> {
        try {
            const result = await this.storage.append({
                targetType: "cms-entry",
                targetId: params.targetId,
                revision: params.revision,
                timestamp: new Date().toISOString(),
                actor: this.resolveActor(),
                action: params.action,
                source: this.sourceResolver.resolve(),
                correlationId: params.correlationId ?? generateAlphaNumericLowerCaseId(12),
                changeset: params.changeset ?? [],
                truncated: params.truncated ?? false,
                ...(params.subject ? { subject: params.subject } : {}),
                ...(params.hasNote === undefined ? {} : { hasNote: params.hasNote })
            });

            if (result.isFail()) {
                // Storage converts its failures into values rather than throwing, so this arrives
                // as a result. Report and carry on; the write must not be affected.
                this.report(params, result.error);
            }
        } catch (error) {
            this.report(params, error);
        }
    }

    /**
     * The actor is the ambient identity, never anything carried on the record being written.
     *
     * Every `*By` meta field on a CMS entry is settable through the manage API — the data
     * factories honour the input over the ambient identity — so an entry's own account of who
     * saved it is client-controlled and cannot underpin an audit trail. The same caution applies
     * to a workflow state's `savedBy`.
     *
     * `getIdentity()` never returns null; it falls back to `AnonymousIdentity`.
     */
    private resolveActor(): ActivityActor {
        const identity = this.identityContext.getIdentity();

        return {
            id: identity.id,
            type: identity.type,
            displayName: identity.displayName ?? ""
        };
    }

    private report(params: IWriteActivityParams, error: unknown): void {
        try {
            console.error(
                `[activity-log] Failed to record "${params.action}" for target ` +
                    `"${params.targetId}". The write itself was not affected.`,
                error
            );
        } catch {
            // Even logging is not allowed to break the write.
        }
    }
}

export const ActivityWriter = Abstraction.createImplementation({
    implementation: ActivityWriterImpl,
    dependencies: [ActivityLogStorage, IdentityContext, ActivitySourceResolver]
});
