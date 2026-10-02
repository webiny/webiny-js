import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TaskExecutionContext } from "@webiny/background-tasks/api/features/TaskExecutionContext/index.js";
import { ActivitySourceResolver as Abstraction } from "./abstractions.js";

/**
 * Where a write came from.
 *
 * Identity alone cannot answer this, which is the whole reason the task probe exists. Background
 * tasks and scheduled actions impersonate the human who started them — `TaskControl` and
 * `ExecuteScheduledActionUseCase` both set an `AuthenticatedIdentity` built from the initiating
 * user — so a scheduled publish and a hand-clicked publish arrive with the *same* identity, of the
 * same type. Without the probe, every machine-executed write would be labelled as that editor
 * having done it by hand.
 *
 * `TaskExecutionContext` is the intent channel that already exists. It is populated by the task
 * runner before execution and cleared afterwards, so its presence answers "is a task running" and
 * the store's task answers "which one".
 *
 * Resolved optionally: the context is registered by the background-tasks feature, and a project
 * that has not registered it must not make the recorder unconstructable. Its getters also throw
 * rather than return undefined when nothing is running, which is the ordinary case in the GraphQL
 * Lambda, so every read is guarded.
 */
class ActivitySourceResolverImpl implements Abstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private taskContext?: TaskExecutionContext.Interface
    ) {}

    resolve(): string {
        const taskSource = this.resolveTaskSource();

        if (taskSource) {
            return taskSource;
        }

        const identity = this.identityContext.getIdentity();

        if (identity.isAnonymous()) {
            // No human and no task: an internal write, or one triggered by infrastructure such as
            // the EventBridge-driven trash purge before it establishes a task.
            return "system";
        }

        // `type` is a plain string, so this passes through whatever the identity provider set.
        // "admin" for JWT/OIDC users, "api-key" for tokens. An agent using an API key is
        // indistinguishable from any other token holder, by design — the key's name is recorded
        // as the actor instead.
        return identity.type;
    }

    private resolveTaskSource(): string | null {
        if (!this.taskContext) {
            return null;
        }

        try {
            const definitionId = this.taskContext.store.getTask().definitionId;
            return definitionId ? `task:${definitionId}` : "task";
        } catch {
            // Nothing running. The getters throw when unset rather than returning undefined.
            return null;
        }
    }
}

export const ActivitySourceResolver = Abstraction.createImplementation({
    implementation: ActivitySourceResolverImpl,
    dependencies: [IdentityContext, [TaskExecutionContext, { optional: true }]]
});
