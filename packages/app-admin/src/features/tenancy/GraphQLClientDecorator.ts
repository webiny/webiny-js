import { GraphQLClient } from "@webiny/app/features/graphqlClient/index.js";
import { TenancyService } from "~/features/tenancy/abstractions.js";

class GraphQLClientWithTenantId implements GraphQLClient.Interface {
    constructor(
        private context: TenancyService.Interface,
        private decoratee: GraphQLClient.Interface
    ) {}

    async execute<TVariables = any, TResult = any>(
        params: GraphQLClient.Request<TVariables>
    ): Promise<TResult> {
        const tenant = this.context.getCurrentTenant();

        const tenantHeaders = tenant ? { "x-tenant": tenant } : {};

        return this.decoratee.execute({
            ...params,
            headers: { ...params.headers, ...tenantHeaders }
        });
    }
}

export const GraphQLClientDecorator = GraphQLClient.createDecorator({
    decorator: GraphQLClientWithTenantId,
    dependencies: [TenancyService]
});
