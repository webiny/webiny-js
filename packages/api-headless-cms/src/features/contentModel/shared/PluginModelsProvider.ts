import { AccessControl, CmsContext } from "~/features/shared/abstractions.js";
import { PluginModelsProvider as ProviderAbstraction } from "./abstractions.js";
import type { CmsModel } from "~/types/index.js";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin.js";
import { ensureTypeTag } from "~/crud/contentModel/ensureTypeTag.js";
import { filterAsync } from "~/utils/filterAsync.js";

/**
 * PluginModelsProvider implementation that fetches models from CmsModelPlugin instances
 */
class PluginModelsProviderImpl implements ProviderAbstraction.Interface {
    constructor(
        private cmsContext: CmsContext.Interface,
        private accessControl: AccessControl.Interface
    ) {}

    async list(tenant: string): Promise<CmsModel[]> {
        const modelPlugins = this.cmsContext.plugins.byType<CmsModelPlugin>(CmsModelPlugin.type);

        const models = modelPlugins
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
                    tenant,
                    webinyVersion: this.cmsContext.WEBINY_VERSION
                };
            }) as unknown as CmsModel[];

        // Apply access control filtering
        return filterAsync(models, model => {
            return this.accessControl.canAccessModel({ model });
        });
    }
}

export const PluginModelsProvider = ProviderAbstraction.createImplementation({
    implementation: PluginModelsProviderImpl,
    dependencies: [CmsContext, AccessControl]
});
