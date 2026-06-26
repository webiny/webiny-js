import {
    DisableTenantRepository as RepositoryAbstraction,
    DisableTenantGateway
} from "./abstractions.js";
import { ContentEntriesCacheProvider } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";

class DisableTenantRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: DisableTenantGateway.Interface,
        private cacheProvider: ContentEntriesCacheProvider.Interface
    ) {}

    async execute(tenantId: string): Promise<void> {
        await this.gateway.disableTenant(tenantId);

        const cache = this.cacheProvider.get(TENANT_MODEL_ID);
        cache.updateItems(item => {
            if (item.entryId === tenantId) {
                return { ...item, values: { ...item.values, status: "disabled" } };
            }
            return item;
        });
    }
}

export const DisableTenantRepository = RepositoryAbstraction.createImplementation({
    implementation: DisableTenantRepositoryImpl,
    dependencies: [DisableTenantGateway, ContentEntriesCacheProvider]
});
