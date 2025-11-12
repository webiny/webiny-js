import { PluginModelsProvider as ProviderAbstraction } from "./abstractions.js";
import { TenantContext } from "@webiny/api-core/features/TenantContext";
import type { CmsModel } from "~/types/index.js";

export type GetCmsModels = () => CmsModel[];

/**
 * PluginModelsProvider implementation that fetches models from plugins.
 */
export class PluginModelsProvider implements ProviderAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private getCmsModels: GetCmsModels
    ) {}

    async getModels(): Promise<CmsModel[]> {
        const tenant = this.tenantContext.getTenant();

        const models = this.getCmsModels();

        return models
            .filter(model => {
                // Filter by tenant/locale if specified in plugin
                // If not specified, plugin model is available for all tenants/locales
                if (model.tenant && model.tenant !== tenant.id) {
                    return false;
                }
                return true;
            })
            .map(model => ({
                ...model,
                tenant: tenant.id
            })) as CmsModel[];
    }
}
