import {
    InstallTenantRepository as RepositoryAbstraction,
    InstallTenantGateway
} from "./abstractions.js";
import { ContentEntriesCacheProvider } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";

class InstallTenantRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: InstallTenantGateway.Interface,
        private cacheProvider: ContentEntriesCacheProvider.Interface
    ) {}

    async execute(tenantId: string): Promise<void> {
        await this.gateway.installTenant(tenantId);

        const cache = this.cacheProvider.get(TENANT_MODEL_ID);
        cache.updateItems(item => {
            if (item.entryId === tenantId) {
                return {
                    ...item,
                    values: { ...item.values, status: "enabled", isInstalled: true }
                };
            }
            return item;
        });
    }
}

export const InstallTenantRepository = RepositoryAbstraction.createImplementation({
    implementation: InstallTenantRepositoryImpl,
    dependencies: [InstallTenantGateway, ContentEntriesCacheProvider]
});
