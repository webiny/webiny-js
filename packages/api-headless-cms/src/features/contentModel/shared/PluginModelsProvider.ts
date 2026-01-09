import { AccessControl, CmsContext } from "~/features/shared/abstractions.js";
import { PluginModelsProvider as ProviderAbstraction } from "./abstractions.js";
import type { CmsModel } from "~/types/index.js";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin.js";
import { ensureTypeTag } from "~/crud/contentModel/ensureTypeTag.js";
import { filterAsync } from "~/utils/filterAsync.js";
import {
    ModelsProvider,
    type IModelsProvider
} from "~/features/modelBuilder/models/abstractions.js";

/**
 * PluginModelsProvider implementation that fetches models from:
 * 1. Legacy CmsModelPlugin instances
 * 2. New ModelBuilder providers (public and private)
 */
class PluginModelsProviderImpl implements ProviderAbstraction.Interface {
    constructor(
        private cmsContext: CmsContext.Interface,
        private accessControl: AccessControl.Interface,
        private modelsProvider: IModelsProvider
    ) {}

    async list(tenant: string): Promise<CmsModel[]> {
        // Get models from legacy plugins
        const modelPlugins = this.cmsContext.plugins.byType<CmsModelPlugin>(CmsModelPlugin.type);

        const legacyModels = modelPlugins
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
                    tags: ensureTypeTag(plugin.contentModel),
                    tenant
                };
            }) as unknown as CmsModel[];

        // Get models from new builder providers
        const builderModels = await this.modelsProvider.list(tenant);

        // Combine both sources
        const allModels = [...legacyModels, ...builderModels];

        // Apply access control filtering
        return filterAsync(allModels, model => {
            return this.accessControl.canAccessModel({ model });
        });
    }
}

export const PluginModelsProvider = ProviderAbstraction.createImplementation({
    implementation: PluginModelsProviderImpl,
    dependencies: [CmsContext, AccessControl, ModelsProvider]
});
