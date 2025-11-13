import { createImplementation } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { CmsContext } from "~/features/shared/abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { PluginGroupsProvider as ProviderAbstraction } from "./abstractions.js";
import { CmsGroupPlugin } from "~/plugins/CmsGroupPlugin.js";
import { filterAsync } from "~/utils/filterAsync.js";
import { createCacheKey } from "~/utils/index.js";
import { createMemoryCache } from "~/utils/index.js";
import type { CmsGroup } from "~/types/index.js";

/**
 * PluginGroupsProvider implementation
 *
 * Fetches groups from CmsGroupPlugin instances.
 * Filters by tenant and applies access control.
 * Results are cached based on tenant + identity + plugin signatures.
 */
class PluginGroupsProviderImpl implements ProviderAbstraction.Interface {
    private cache = createMemoryCache<Promise<CmsGroup[]>>();

    constructor(
        private tenantContext: TenantContext.Interface,
        private cmsContext: CmsContext.Interface,
        private accessControl: AccessControl.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async getGroups(): Promise<CmsGroup[]> {
        const tenant = this.tenantContext.getTenant();
        const pluginGroups = this.cmsContext.plugins.byType<CmsGroupPlugin>(CmsGroupPlugin.type);

        const cacheKey = createCacheKey({
            tenant: tenant.id,
            identity: this.cmsContext.security.isAuthorizationEnabled()
                ? this.identityContext.getIdentity()?.id
                : undefined,
            groups: pluginGroups
                .map(({ contentModelGroup: group }) => {
                    return `${group.id}#${group.slug}#${group.savedOn || "unknown"}`;
                })
                .join("/")
        });

        return this.cache.getOrSet(cacheKey, async (): Promise<CmsGroup[]> => {
            const groups = pluginGroups
                // Filter by tenant if specified in plugin
                // If not specified, plugin group is available for all tenants/locales
                .filter(plugin => {
                    const { tenant: t } = plugin.contentModelGroup;
                    if (t && t !== tenant.id) {
                        return false;
                    }
                    return true;
                })
                .map(plugin => {
                    return {
                        ...plugin.contentModelGroup,
                        tenant: tenant.id,
                        webinyVersion: this.cmsContext.WEBINY_VERSION
                    };
                });

            // Apply access control filtering
            return filterAsync(groups, async (group?: CmsGroup) => {
                if (!group) {
                    return false;
                }
                return this.accessControl.canAccessGroup({ group });
            });
        });
    }
}

export const PluginGroupsProvider = createImplementation({
    abstraction: ProviderAbstraction,
    implementation: PluginGroupsProviderImpl,
    dependencies: [TenantContext, CmsContext, AccessControl, IdentityContext]
});
