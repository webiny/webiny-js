import {
    CmsModelPluginInstance,
    PluginModelsProvider as ProviderAbstraction
} from "./abstractions.js";
import type { CmsModel } from "~/types/index.js";
import type { CmsModelPlugin } from "~/plugins/CmsModelPlugin.js";
import {
    ModelsProvider,
    type IModelsProvider
} from "~/features/modelBuilder/models/abstractions.js";

/**
 * PluginModelsProvider implementation that fetches models from:
 * 1. Legacy CmsModelPlugin instances (resolved from the DI container)
 * 2. New ModelBuilder providers (public and private)
 *
 * Returns every model of the tenant, without access control. ModelsFetcher caches this list for the
 * whole request, so filtering it by the current identity would leak that identity's view into every
 * later read, including reads that run without authorization. GetModelUseCase and ListModelsUseCase
 * apply access control to what they return.
 */
class PluginModelsProviderImpl implements ProviderAbstraction.Interface {
    public constructor(
        private modelPlugins: CmsModelPlugin[],
        private modelsProvider: IModelsProvider
    ) {}

    async list(tenant: string): Promise<CmsModel[]> {
        // Get models from code-defined plugins
        const legacyModels = this.modelPlugins
            .filter(plugin => {
                const { tenant: modelTenant } = plugin.contentModel;
                // Filter by tenant if specified in plugin
                if (modelTenant && modelTenant !== tenant) {
                    return false;
                }

                return true;
            })
            .map(plugin => {
                return {
                    ...plugin.contentModel,
                    tags: this.ensureTypeTag(plugin.contentModel),
                    tenant
                };
            }) as unknown as CmsModel[];

        // Get models from new builder providers.
        const builderModels = await this.modelsProvider.list(tenant);

        // Combine both sources
        return [...legacyModels, ...builderModels];
    }

    private ensureTypeTag(model: Pick<CmsModel, "tags">) {
        // Let's make sure we have a `type` tag assigned.
        // If `type` tag is not set, set it to a default one (`model`).
        const tags = model.tags || [];
        if (!tags.some(tag => tag.startsWith("type:"))) {
            tags.push("type:model");
        }

        return tags;
    }
}

export const PluginModelsProvider = ProviderAbstraction.createImplementation({
    implementation: PluginModelsProviderImpl,
    dependencies: [[CmsModelPluginInstance, { multiple: true }], ModelsProvider]
});
