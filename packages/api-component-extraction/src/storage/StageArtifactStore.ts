import { createImplementation, Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { StageArtifactStore as StageArtifactStoreAbstraction } from "~/domain/stage.js";
import { ExtractionStorageError, type ExtractionError } from "~/domain/errors.js";

/**
 * Stage artifacts on the tenant-scoped key-value store, keyed deterministically. Tenant scoping is free
 * from `KeyValueStore`, so one tenant's run never reads another's artifacts.
 */
class KeyValueStageArtifactStoreImpl implements StageArtifactStoreAbstraction.Interface {
    constructor(private store: KeyValueStore.Interface) {}

    async putJson(key: string, value: unknown): Promise<Result<void, ExtractionError>> {
        const result = await this.store.set(key, value);
        if (result.isFail()) {
            return Result.fail(
                new ExtractionStorageError("write a stage artifact", result.error.message)
            );
        }
        return Result.ok(undefined);
    }

    async getJson<T>(key: string): Promise<Result<T | null, ExtractionError>> {
        const result = await this.store.get<T>(key);
        // A missing artifact is null, not a failure — the caller decides whether that is a problem.
        if (result.isFail()) {
            return Result.ok(null);
        }
        return Result.ok(result.value ?? null);
    }
}

export const KeyValueStageArtifactStore = createImplementation({
    abstraction: StageArtifactStoreAbstraction,
    implementation: KeyValueStageArtifactStoreImpl,
    dependencies: [KeyValueStore]
});
