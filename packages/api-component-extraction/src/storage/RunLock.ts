import { createImplementation, Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { RunLock as RunLockAbstraction } from "~/domain/abstractions.js";
import { ExtractionStorageError, type ExtractionError } from "~/domain/errors.js";
import { runLockKey } from "~/constants.js";

/**
 * One in-flight run per job, on the tenant-scoped key-value store.
 *
 * Check-then-set, so NOT atomic — the same deliberate trade the theme extraction lock documents: it
 * stops the realistic case (an impatient double-click, two admins minutes apart), costs one read, and
 * the seam does not change if a conditional write is later needed. Tenant scoping is free from
 * `KeyValueStore`, so one tenant's run never blocks another's.
 */
class RunLockImpl implements RunLockAbstraction.Interface {
    constructor(private store: KeyValueStore.Interface) {}

    async current(jobId: string): Promise<Result<string | null, ExtractionError>> {
        const result = await this.store.get<string>(runLockKey(jobId));
        // A missing key is "no run holding it", not a failure.
        if (result.isFail()) {
            return Result.ok(null);
        }
        return Result.ok(result.value ?? null);
    }

    async acquire(jobId: string, runId: string): Promise<Result<boolean, ExtractionError>> {
        const held = await this.current(jobId);
        if (held.isFail()) {
            return Result.fail(held.error);
        }

        // Re-acquiring our own lock succeeds, so a stage task resuming after a `continue` is not locked
        // out by itself.
        if (held.value && held.value !== runId) {
            return Result.ok(false);
        }

        const result = await this.store.set(runLockKey(jobId), runId);
        if (result.isFail()) {
            return Result.fail(
                new ExtractionStorageError("reserve the run slot", result.error.message)
            );
        }
        return Result.ok(true);
    }

    async release(jobId: string, runId: string): Promise<Result<void, ExtractionError>> {
        const held = await this.current(jobId);
        if (held.isFail()) {
            return Result.fail(held.error);
        }

        // Only the holder may release, or a late-finishing abandoned run would release the lock out from
        // under the run that legitimately took it next.
        if (held.value && held.value !== runId) {
            return Result.ok(undefined);
        }

        const result = await this.store.delete(runLockKey(jobId));
        if (result.isFail()) {
            return Result.fail(
                new ExtractionStorageError("release the run slot", result.error.message)
            );
        }
        return Result.ok(undefined);
    }
}

export const RunLock = createImplementation({
    abstraction: RunLockAbstraction,
    implementation: RunLockImpl,
    dependencies: [KeyValueStore]
});
