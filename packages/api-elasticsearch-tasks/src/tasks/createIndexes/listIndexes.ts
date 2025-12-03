import type { CreateElasticsearchIndexTaskPluginIndex } from "~/tasks/createIndexes/CreateElasticsearchIndexTaskPlugin.js";
import type { CreateElasticsearchIndexTaskPlugin } from "~/tasks/createIndexes/CreateElasticsearchIndexTaskPlugin.js";
import type { Context } from "~/types.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { getLocale } from "@webiny/api-core/legacy/i18n/getLocale.js";

export interface IListIndexesParams {
    context: Context;
    plugins: CreateElasticsearchIndexTaskPlugin<Context>[];
    tenants?: Tenant[];
}

export const listIndexes = async (
    params: IListIndexesParams
): Promise<CreateElasticsearchIndexTaskPluginIndex[]> => {
    const { context, plugins, tenants: inputTenants } = params;
    if (plugins.length === 0) {
        return [];
    }

    const indexes: CreateElasticsearchIndexTaskPluginIndex[] = [];
    const tenants = inputTenants || (await context.tenancy.listTenants());
    const initialTenant = context.tenancy.getCurrentTenant();
    try {
        for (const tenant of tenants) {
            context.tenancy.setCurrentTenant(tenant);

            for (const plugin of plugins) {
                const results = await plugin.getIndexList({
                    context,
                    tenant: tenant.id,
                    locale: getLocale().code
                });
                for (const result of results) {
                    if (indexes.some(i => i.index === result.index)) {
                        continue;
                    }
                    indexes.push(result);
                }
            }
        }
    } finally {
        context.tenancy.setCurrentTenant(initialTenant);
    }

    return indexes;
};
