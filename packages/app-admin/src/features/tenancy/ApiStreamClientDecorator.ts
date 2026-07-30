import { ApiStreamClient } from "@webiny/app/features/apiStreamClient/index.js";
import { TenantContext } from "~/features/tenancy/abstractions.js";

/**
 * Adds the current tenant to streaming API requests, so a streaming route resolves the same tenant
 * as an equivalent GraphQL call. Mirrors the tenancy `GraphQLClientDecorator`.
 */
class ApiStreamClientWithTenantId implements ApiStreamClient.Interface {
    constructor(
        private context: TenantContext.Interface,
        private decoratee: ApiStreamClient.Interface
    ) {}

    async execute(params: ApiStreamClient.Request): Promise<Response> {
        const tenant = this.context.getCurrentTenant();

        const tenantHeaders = tenant ? { "x-tenant": tenant } : {};

        return this.decoratee.execute({
            ...params,
            headers: { ...params.headers, ...tenantHeaders }
        });
    }
}

export const ApiStreamClientDecorator = ApiStreamClient.createDecorator({
    decorator: ApiStreamClientWithTenantId,
    dependencies: [TenantContext]
});
