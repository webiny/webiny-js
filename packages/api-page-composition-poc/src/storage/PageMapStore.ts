import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { PageMapStore as Abstraction } from "~/domain/abstractions.js";
import { PageCompositionError } from "~/domain/errors.js";
import type { PageMap } from "~/domain/types.js";
import { pageMapKey } from "~/constants.js";

class PageMapStoreImpl implements Abstraction.Interface {
    constructor(private store: KeyValueStore.Interface) {}

    async get(runId: string): Promise<Result<PageMap | null, PageCompositionError>> {
        const result = await this.store.get<PageMap>(pageMapKey(runId));
        // A run that has never been composed has no map; that is a state, not a failure.
        if (result.isFail()) {
            return Result.ok(null);
        }
        return Result.ok(result.value ?? null);
    }

    async set(map: PageMap): Promise<Result<void, PageCompositionError>> {
        const result = await this.store.set(pageMapKey(map.runId), map);
        if (result.isFail()) {
            return Result.fail(
                new PageCompositionError("Could not store the page map.", { runId: map.runId })
            );
        }
        return Result.ok(undefined);
    }
}

export const PageMapStore = Abstraction.createImplementation({
    implementation: PageMapStoreImpl,
    dependencies: [KeyValueStore]
});
