import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { KeyNotFoundError } from "@webiny/api-core/features/keyValueStore/index.js";
import { TaskRecoveries } from "~/domain/TaskRecoveries.js";
import type { TaskClaim } from "~/domain/TaskClaim.js";

const RECOVERIES_SCOPE = "background-tasks/recoveries";

/*
 * Only clean-up: a crash loop repeats within minutes, and a task that saves starts the count over
 * anyway. A record nobody updates for a day is not worth keeping.
 */
const RECOVERIES_TTL_MS = 86_400_000;

interface IRecoveriesRecord {
    count: number;
    // When the task had last saved at the previous takeover.
    savedOn: string;
}

const toKey = (target: TaskClaim.Target): string => {
    return `${target.tenant}/${target.taskId}`;
};

/**
 * The count is read and written in two steps. That is safe only because the caller holds the
 * task's claim, so no other process records a takeover of the same task in between.
 */
class KeyValueTaskRecoveriesImpl implements TaskRecoveries.Interface {
    public constructor(private readonly store: GlobalKeyValueStore.Interface) {}

    public async record(target: TaskClaim.Target, savedOn: string): Promise<number> {
        const key = toKey(target);
        const current = await this.store.get<IRecoveriesRecord>(key, { scope: RECOVERIES_SCOPE });
        if (current.isFail() && !(current.error instanceof KeyNotFoundError)) {
            throw current.error;
        }

        let count = 1;
        if (current.isOk() && current.value.savedOn === savedOn) {
            count = current.value.count + 1;
        }

        const record: IRecoveriesRecord = { count, savedOn };
        const expiresAtMs = Date.now() + RECOVERIES_TTL_MS;
        const expiresAt = new Date(expiresAtMs);
        const written = await this.store.set(key, record, { scope: RECOVERIES_SCOPE, expiresAt });
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
