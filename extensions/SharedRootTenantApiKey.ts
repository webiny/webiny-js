import { ApiKeyFactory } from "webiny/api/security";
import { TenantContext } from "webiny/api/tenancy";
import { GetApiKeyBySlugUseCase } from "webiny/api/security/api-key";

class SharedRootTenantApiKeyImpl implements ApiKeyFactory.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private getApiKeyBySlug: GetApiKeyBySlugUseCase.Interface
    ) {}

    async execute(): ApiKeyFactory.Return {
        const result = await this.tenantContext.withRootTenant(() => {
            return this.getApiKeyBySlug.execute("frontend-integration");
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
    dependencies: [TenantContext, GetApiKeyBySlugUseCase]
});
