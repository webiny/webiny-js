import { createImplementation } from "@webiny/feature/api";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { ApiKeyFactory } from "./abstractions.js";
import { ApiKeyProvider as ProviderAbstraction } from "./abstractions.js";
import type { ApiKey } from "./types.js";

class ApiKeyProviderImpl implements ProviderAbstraction.Interface {
    private cache: ApiKey[] | undefined;

    constructor(
        private tenantContext: TenantContext.Interface,
        private apiKeyFactories: ApiKeyFactory.Interface[]
    ) {}

    async getByToken(token: string): Promise<ApiKey | null> {
        // Lazy load and cache API keys from factories
        if (this.cache === undefined) {
            const results = await Promise.all(
                this.apiKeyFactories.map(factory => factory.execute())
            );
            this.cache = results.flat().map<ApiKey>(codeKey => {
                return {
                    ...codeKey,
                    id: codeKey.name,
                    description: "",
                    tenant: this.tenantContext.getTenant().id,
                    createdOn: new Date().toISOString(),
                    createdBy: {
                        id: "system",
                        type: "admin",
                        displayName: "System"
                    }
                };
            });
        }

        // Search for the API key by token in the cached array
        const apiKey = this.cache.find(key => key.token === token);
        return apiKey || null;
    }
}

export const ApiKeyProvider = createImplementation({
    abstraction: ProviderAbstraction,
    implementation: ApiKeyProviderImpl,
    dependencies: [TenantContext, [ApiKeyFactory, { multiple: true }]]
});
