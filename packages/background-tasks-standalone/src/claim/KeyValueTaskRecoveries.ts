import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { KeyNotFoundError } from "@webiny/api-core/features/keyValueStore/index.js";
import { TaskRecoveries } from "~/domain/TaskRecoveries.js";
import type { TaskClaim } from "~/domain/TaskClaim.js";

const RECOVERIES_SCOPE = "background-tasks/recoveries";

/*
 * A count expires a day after its last takeover. Crashes that repeat do so within minutes, while a
 * task that was recovered once long ago starts again from zero.
 */
const RECOVERIES_TTL_MS = 86_400_000;

const toKey = (target: TaskClaim.Target): string => {
    return `${target.tenant}/${target.taskId}`;
};

/**
 * The count is read and written in two steps. That is safe only because the caller holds the
 * task's claim, so no other process records a takeover of the same task in between.
 */
class KeyValueTaskRecoveriesImpl implements TaskRecoveries.Interface {
    public constructor(private readonly store: GlobalKeyValueStore.Interface) {}

    public async record(target: TaskClaim.Target): Promise<number> {
        const key = toKey(target);
        const current = await this.store.get<number>(key, { scope: RECOVERIES_SCOPE });
        if (current.isFail() && !(current.error instanceof KeyNotFoundError)) {
            throw current.error;
        }

        const previous = current.isOk() ? current.value : 0;
        const count = previous + 1;
        const expiresAt = new Date(Date.now() + RECOVERIES_TTL_MS);
        const written = await this.store.set(key, count, { scope: RECOVERIES_SCOPE, expiresAt });
        if (written.isFail()) {
            throw written.error;
        }
        return count;
    }
}

export const KeyValueTaskRecoveries = TaskRecoveries.createImplementation({
    implementation: KeyValueTaskRecoveriesImpl,
    dependencies: [GlobalKeyValueStore]
});
