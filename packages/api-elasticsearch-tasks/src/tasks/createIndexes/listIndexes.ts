import { OpenSearchTenantIndexFactory } from "~/abstractions/OpenSearchTenantIndexFactory.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";

export const listIndexes = async (
    tenantContext: TenantContext.Interface,
    tenants: Tenant[],
    indexFactories: OpenSearchTenantIndexFactory.Interface[]
): Promise<OpenSearchTenantIndexFactory.IndexConfig[]> => {
    if (indexFactories.length === 0) {
        return [];
    }

    const indexes: OpenSearchTenantIndexFactory.IndexConfig[] = [];
    await tenantContext.withEachTenant(tenants, async tenant => {
        for (const factory of indexFactories) {
            const results = await factory.getIndexList(tenant);
            for (const result of results) {
                if (indexes.some(i => i.index === result.index)) {
                    continue;
                }
                indexes.push(result);
            }
        }
    });

    return indexes;
};
