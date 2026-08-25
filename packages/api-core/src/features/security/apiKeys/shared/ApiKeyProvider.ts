import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { ApiKeyFactory } from "./abstractions.js";
import { ApiKeyProvider as ProviderAbstraction } from "./abstractions.js";
import type { ApiKey } from "./types.js";
import { SystemIdentityValue } from "~/domain/identity/SystemIdentityValue.js";

export class ApiKeyProvider implements ProviderAbstraction.Interface {
    private cache: ApiKey[] | undefined;

    constructor(
        private tenantContext: TenantContext.Interface,
        private getApiKeyFactories: () => ApiKeyFactory.Interface[]
    ) {}

    async getByToken(token: string): Promise<ApiKey | null> {
        const cache = await this.getCache();

        // Search for the API key by token in the cached array
        const apiKey = cache.find(key => key.token === token);
        return apiKey || null;
    }

    async getBySlug(slug: string): Promise<ApiKey | null> {
        const cache = await this.getCache();

        // Search for the API key by token in the cached array
        const apiKey = cache.find(key => key.slug === slug);
        return apiKey || null;
    }

    private async getCache(): Promise<ApiKey[]> {
        if (this.cache === undefined) {
            const apiKeyFactories = this.getApiKeyFactories();
            const results = await Promise.all(apiKeyFactories.map(factory => factory.execute()));
            this.cache = results.flat().map<ApiKey>(codeKey => {
                return {
                    ...codeKey,
                    id: codeKey.slug,
                    slug: codeKey.slug,
                    description: "",
                    tenant: this.tenantContext.getTenant().id,
                    createdOn: new Date().toISOString(),
                    createdBy: SystemIdentityValue.create()
                };
            });
        }

        return this.cache;
    }
}
