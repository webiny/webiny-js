import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { ComposedCaptureStore as Abstraction } from "~/domain/abstractions.js";
import { PageCompositionError } from "~/domain/errors.js";
import type { ComposedCapture } from "~/domain/types.js";
import { composedCaptureKey } from "~/constants.js";

class ComposedCaptureStoreImpl implements Abstraction.Interface {
    constructor(private store: KeyValueStore.Interface) {}

    async get(runId: string): Promise<Result<ComposedCapture | null, PageCompositionError>> {
        const result = await this.store.get<ComposedCapture>(composedCaptureKey(runId));
        // A run nobody has photographed has no record; that is the normal state, not a failure.
        if (result.isFail()) {
            return Result.ok(null);
        }
        return Result.ok(result.value ?? null);
    }

    async set(capture: ComposedCapture): Promise<Result<void, PageCompositionError>> {
        const result = await this.store.set(composedCaptureKey(capture.runId), capture);
        if (result.isFail()) {
            return Result.fail(
                new PageCompositionError("Could not store the composed capture.", {
                    runId: capture.runId
                })
            );
        }
        return Result.ok(undefined);
    }
}

export const ComposedCaptureStore = Abstraction.createImplementation({
    implementation: ComposedCaptureStoreImpl,
    dependencies: [KeyValueStore]
});
