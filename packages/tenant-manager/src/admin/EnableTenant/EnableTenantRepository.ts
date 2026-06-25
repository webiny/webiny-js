import {
    EnableTenantRepository as RepositoryAbstraction,
    EnableTenantGateway
} from "./abstractions.js";
import { ContentEntriesCacheProvider } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";

class EnableTenantRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: EnableTenantGateway.Interface,
        private cacheProvider: ContentEntriesCacheProvider.Interface
    ) {}

    async execute(tenantId: string): Promise<void> {
        await this.gateway.enableTenant(tenantId);

        const cache = this.cacheProvider.get(TENANT_MODEL_ID);
        cache.updateItems(item => {
            if (item.entryId === tenantId) {
                return { ...item, values: { ...item.values, status: "enabled" } };
            }
            return item;
        });
    }
}

export const EnableTenantRepository = RepositoryAbstraction.createImplementation({
    implementation: EnableTenantRepositoryImpl,
    dependencies: [EnableTenantGateway, ContentEntriesCacheProvider]
});
