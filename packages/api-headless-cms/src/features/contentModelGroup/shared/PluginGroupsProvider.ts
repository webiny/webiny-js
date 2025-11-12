import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { PluginGroupsProvider as ProviderAbstraction } from "./abstractions.js";
import type { CmsGroup } from "~/types/index.js";

export type GetGroups = () => CmsGroup[];

/**
 * PluginGroupsProvider implementation that fetches groups from plugins.
 */
export class PluginGroupsProvider implements ProviderAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private getCmsGroups: GetGroups
    ) {}

    async getGroups(): Promise<CmsGroup[]> {
        const tenant = this.tenantContext.getTenant();

        const groups = this.getCmsGroups();

        return groups
            .filter(group => {
                // Filter by tenant if specified in plugin
                // If not specified, plugin group is available for all tenants/locales
                if (group.tenant && group.tenant !== tenant.id) {
                    return false;
                }
                return true;
            })
            .map(group => ({
                ...group,
                tenant: tenant.id
            })) as CmsGroup[];
    }
}
