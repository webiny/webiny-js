import type { TenantIndexFactory } from "~/abstractions/TenantIndexFactory.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";

export const listIndexes = async (
    tenantContext: TenantContext.Interface,
    tenants: Tenant[],
    indexFactories: TenantIndexFactory.Interface[]
): Promise<TenantIndexFactory.IndexConfig[]> => {
    if (indexFactories.length === 0) {
        return [];
    }

    const indexes: TenantIndexFactory.IndexConfig[] = [];
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
