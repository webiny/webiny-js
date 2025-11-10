import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { ModelsRepository as RepositoryAbstraction } from "./abstractions.js";
import { PluginModelsProvider } from "./abstractions.js";
import {
    ModelNotFoundError,
    ModelStorageError,
    ModelCannotUpdateCodeDefinedError,
    ModelCannotDeleteCodeDefinedError
} from "~/domains/contentModels/errors.js";
import type { CmsModel } from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";

/**
 * ModelsRepository implementation following CQS principle.
 * Provides unified access to both database-stored and plugin-defined models.
 */
class ModelsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private pluginModelsProvider: PluginModelsProvider.Interface,
        private accessControl: AccessControl.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    async get(modelId: string): Promise<Result<CmsModel, RepositoryAbstraction.Error>> {
        try {
            // 1. Check plugin models first (code-defined, immutable) TODO: move to decorator!
            const pluginModels = await this.pluginModelsProvider.getModels();
            const pluginModel = pluginModels.find(m => m.modelId === modelId);

            if (pluginModel) {
                // Apply access control
                const canAccess = await this.accessControl.canAccessModel({ model: pluginModel });
                if (!canAccess) {
                    return Result.fail(new ModelNotFoundError(modelId));
                }
                return Result.ok(pluginModel);
            }

            // 2. Query database models
            const tenant = this.tenantContext.getTenant();
            const dbModel = await this.storageOperations.models.get({ tenant: tenant.id, modelId });
            if (!dbModel) {
                return Result.fail(new ModelNotFoundError(modelId));
            }

            // Apply access control
            const canAccess = await this.accessControl.canAccessModel({ model: dbModel });
            if (!canAccess) {
                return Result.fail(new ModelNotFoundError(modelId));
            }

            return Result.ok(dbModel);
        } catch (error) {
            return Result.fail(new ModelStorageError(error as Error));
        }
    }

    async list(): Promise<Result<CmsModel[], RepositoryAbstraction.Error>> {
        try {
            // 1. Get plugin models TODO: move to decorator!
            const pluginModels = await this.pluginModelsProvider.getModels();

            // 2. Get DB models
            const tenant = this.tenantContext.getTenant();
            const dbModels = await this.storageOperations.models.list({
                where: { tenant: tenant.id }
            });

            // 3. Combine both sources TODO: move to decorator!
            const allModels = [...pluginModels, ...dbModels];

            // 4. Apply access control to all models
            const accessibleModels: CmsModel[] = [];
            for (const model of allModels) {
                const canAccess = await this.accessControl.canAccessModel({ model });
                if (canAccess) {
                    accessibleModels.push(model);
                }
            }

            return Result.ok(accessibleModels);
        } catch (error) {
            return Result.fail(new ModelStorageError(error as Error));
        }
    }

    async create(model: CmsModel): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();
            model.tenant = tenant.id;
            await this.storageOperations.models.create({ model });
            return Result.ok();
        } catch (error) {
            return Result.fail(new ModelStorageError(error as Error));
        }
    }

    async update(model: CmsModel): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Cannot update plugin models. TODO: move to decorator!
            const pluginModels = await this.pluginModelsProvider.getModels();
            const isPluginModel = pluginModels.some(m => m.modelId === model.modelId);

            if (isPluginModel) {
                return Result.fail(new ModelCannotUpdateCodeDefinedError(model.modelId));
            }

            await this.storageOperations.models.update({ model });
            return Result.ok();
        } catch (error) {
            return Result.fail(new ModelStorageError(error as Error));
        }
    }

    async delete(model: CmsModel): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Cannot delete plugin models TODO: move to decorator!
            const pluginModels = await this.pluginModelsProvider.getModels();
            const isPluginModel = pluginModels.some(m => m.modelId === model.modelId);

            if (isPluginModel) {
                return Result.fail(new ModelCannotDeleteCodeDefinedError(model.modelId));
            }

            await this.storageOperations.models.delete({ model });
            return Result.ok();
        } catch (error) {
            return Result.fail(new ModelStorageError(error as Error));
        }
    }
}

export const ModelsRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: ModelsRepositoryImpl,
    dependencies: [TenantContext, PluginModelsProvider, AccessControl, StorageOperations]
});
