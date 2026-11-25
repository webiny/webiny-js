import { TenantIndexFactory } from "~/abstractions/TenantIndexFactory.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { TenantScopes } from "@webiny/api-core/features/tenancy/TenantScopes/index.js";

/** The indexes of the given tenants, each listed by the index factories of its own scope. */
export const listIndexes = async (
    tenantScopes: TenantScopes.Interface,
    tenants: Tenant[]
): Promise<TenantIndexFactory.IndexConfig[]> => {
    const indexes: TenantIndexFactory.IndexConfig[] = [];
    await tenantScopes.withEachTenant(tenants, async scope => {
        for (const factory of scope.resolveAll(TenantIndexFactory)) {
            const results = await factory.getIndexList(scope.tenant);
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
