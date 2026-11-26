import { ApiKeyFactory } from "webiny/api/security";
import { TenantScopes } from "webiny/api/tenancy";
import { GetApiKeyBySlugUseCase } from "webiny/api/security/api-key";

class SharedRootTenantApiKeyImpl implements ApiKeyFactory.Interface {
    constructor(private tenantScopes: TenantScopes.Interface) {}

    async execute(): ApiKeyFactory.Return {
        // The key is stored in the root tenant: read it in the root tenant's scope.
        const result = await this.tenantScopes.withRootTenant(scope => {
            return scope.resolve(GetApiKeyBySlugUseCase).execute("frontend-integration");
        });

        if (result.isFail()) {
            return [];
        }

        const apiKey = result.value;

        return [
            {
                name: apiKey.name,
                slug: apiKey.slug,
                token: apiKey.token,
                permissions: apiKey.permissions
            }
        ];
    }
}

export default ApiKeyFactory.createImplementation({
    implementation: SharedRootTenantApiKeyImpl,
    dependencies: [TenantScopes]
});
