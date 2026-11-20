import { DeleteModelStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/index.js";
import type { CmsModelStorageOperationsDeleteParams } from "@webiny/api-headless-cms/types/index.js";
import { ScopeRegistry } from "~/features/scopes/abstractions.js";

/**
 * Deletes the model (SQL storage), then clears its pg scope. A model is deleted only without
 * entries, so this is a few small deletes and runs inline. If clearing fails, the model is still
 * deleted; a model created later under the same id finds the old slot map, which costs a sync for
 * keys it doesn't have, never wrong results.
 */
class PgDeleteModelImpl implements DeleteModelStorageOperation.Interface {
    public constructor(
        private readonly scopes: ScopeRegistry.Interface,
        private readonly decoratee: DeleteModelStorageOperation.Interface
    ) {}

    public async execute(params: CmsModelStorageOperationsDeleteParams): Promise<void> {
        await this.decoratee.execute(params);
        await this.scopes.clear(params.model);
    }
}

export const PgDeleteModel = DeleteModelStorageOperation.createDecorator({
    decorator: PgDeleteModelImpl,
    dependencies: [ScopeRegistry]
});
