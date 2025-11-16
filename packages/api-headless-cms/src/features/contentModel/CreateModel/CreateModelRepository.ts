import { Result } from "@webiny/feature/api";
import { CreateModelRepository as RepositoryAbstraction } from "./abstractions.js";
import { ModelCache } from "~/features/contentModel/shared/abstractions.js";
import { PluginModelsProvider } from "~/features/contentModel/shared/abstractions.js";
import { ModelSlugTakenError } from "~/domain/contentModel/errors.js";
import { ModelPersistenceError } from "~/domain/contentModel/errors.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/TenantContext";
import type { CmsModel } from "~/types/index.js";
import { ensureTypeTag } from "~/domain/contentModel/ensureTypeTag.js";

/**
 * CreateModelRepository - Validates and persists a new model.
 *
 * Responsibilities:
 * - Validate modelId uniqueness
 * - Validate API name uniqueness (singularApiName, pluralApiName)
 * - Check for plugin model conflicts
 * - Persist to storage
 * - Clear ModelCache after successful create
 */
class CreateModelRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelCache: ModelCache.Interface,
        private pluginModelsProvider: PluginModelsProvider.Interface,
        private storageOperations: StorageOperations.Interface,
        private tenantContext: TenantContext.Interface
    ) {}

    async execute(model: CmsModel): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();

            // Validate modelId uniqueness
            if (model.modelId) {
                const existingById = await this.storageOperations.models.list({
                    where: {
                        tenant: tenant.id,
                        modelId: model.modelId
                    }
                });

                if (existingById.length > 0) {
                    return Result.fail(new ModelSlugTakenError(model.modelId));
                }
            }

            // Validate API name uniqueness
            const apiNameConflict = await this.checkApiNameConflict(model, tenant.id);
            if (apiNameConflict) {
                return Result.fail(
                    new ModelSlugTakenError(`${model.singularApiName}/${model.pluralApiName}`)
                );
            }

            // Check for plugin model conflicts
            const pluginModels = await this.pluginModelsProvider.list(tenant.id);
            const pluginModelConflict = pluginModels.find(pm => {
                return (
                    pm.modelId === model.modelId ||
                    pm.singularApiName === model.singularApiName ||
                    pm.pluralApiName === model.pluralApiName
                );
            });

            if (pluginModelConflict) {
                return Result.fail(
                    new ModelSlugTakenError(`${model.singularApiName}/${model.pluralApiName}`)
                );
            }

            // TODO: ideally, this will eventually be handled by the CmsModel domain object
            model.tags = ensureTypeTag(model);

            // Persist to storage
            await this.storageOperations.models.create({ model });

            // Clear cache
            this.modelCache.clear();

            return Result.ok();
        } catch (error) {
            return Result.fail(new ModelPersistenceError(error as Error));
        }
    }

    private async checkApiNameConflict(model: CmsModel, tenant: string): Promise<boolean> {
        // Check singular API name
        const existingBySingular = await this.storageOperations.models.list({
            where: {
                tenant,
                singularApiName: model.singularApiName
            }
        });

        if (existingBySingular.length > 0) {
            return true;
        }

        // Check plural API name
        const existingByPlural = await this.storageOperations.models.list({
            where: {
                tenant,
                pluralApiName: model.pluralApiName
            }
        });

        return existingByPlural.length > 0;
    }
}

export const CreateModelRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateModelRepositoryImpl,
    dependencies: [ModelCache, PluginModelsProvider, StorageOperations, TenantContext]
});
