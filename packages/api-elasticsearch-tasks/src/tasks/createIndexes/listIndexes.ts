import { OpensearchTenantIndexFactory } from "~/abstractions/OpensearchTenantIndexFactory.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";

export const listIndexes = async (
    tenantContext: TenantContext.Interface,
    tenants: Tenant[],
    indexFactories: OpensearchTenantIndexFactory.Interface[]
): Promise<OpensearchTenantIndexFactory.IndexConfig[]> => {
    if (indexFactories.length === 0) {
        return [];
    }

    const indexes: OpensearchTenantIndexFactory.IndexConfig[] = [];
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
