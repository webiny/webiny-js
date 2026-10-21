import type { Result } from "@webiny/feature/api";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { KeyValueConditionFailedError } from "@webiny/api-core/features/keyValueStore/index.js";
import { TaskClaim } from "~/domain/TaskClaim.js";
import { ProcessOwner } from "~/domain/ProcessOwner.js";

// Claims live apart from everyone's records, in their own scope of the global store.
const CLAIM_SCOPE = "background-tasks/claims";

const toKey = (target: TaskClaim.Target): string => {
    return `${target.tenant}/${target.taskId}`;
};

const expiresIn = (ttlMs: number): Date => {
    return new Date(Date.now() + ttlMs);
};

/*
 * A write whose condition does not hold means someone else holds the claim. That is an answer, not
 * a failure, so it becomes `false`.
 */
const toHeld = (result: Result<void, GlobalKeyValueStore.Error>): boolean => {
    if (result.isOk()) {
        return true;
    }
    if (result.error instanceof KeyValueConditionFailedError) {
        return false;
    }
    throw result.error;
};

/**
 * A claim is a global key-value record whose value is the owning process. The store's conditional
 * writes do the checking, so two processes racing for a task cannot both get it.
 */
class KeyValueTaskClaimImpl implements TaskClaim.Interface {
    public constructor(
        private readonly store: GlobalKeyValueStore.Interface,
        private readonly owner: ProcessOwner.Interface
    ) {}

    public async take(target: TaskClaim.Target, ttlMs: number): Promise<boolean> {
        const key = toKey(target);
        const expiresAt = expiresIn(ttlMs);
        const result = await this.store.set(key, this.owner.id, {
            scope: CLAIM_SCOPE,
            expiresAt,
            condition: { exists: false }
        });
        return toHeld(result);
    }

    public async keep(target: TaskClaim.Target, ttlMs: number): Promise<boolean> {
        const key = toKey(target);
        const expiresAt = expiresIn(ttlMs);
        const result = await this.store.set(key, this.owner.id, {
            scope: CLAIM_SCOPE,
            expiresAt,
            condition: { equals: this.owner.id }
        });
        return toHeld(result);
    }

    public async release(target: TaskClaim.Target): Promise<void> {
        const key = toKey(target);
        const result = await this.store.delete(key, {
            scope: CLAIM_SCOPE,
            condition: { equals: this.owner.id }
        });
        // Already gone or held by someone else: either way, nothing of ours is left to release.
        toHeld(result);
    }
}

export const KeyValueTaskClaim = TaskClaim.createImplementation({
    implementation: KeyValueTaskClaimImpl,
    dependencies: [GlobalKeyValueStore, ProcessOwner]
});
