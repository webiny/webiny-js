import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { GetCurrentTenantUseCase } from "../features/GetCurrentTenant/abstractions.js";

class GetCurrentTenantSchema implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type TenantResponse {
                data: Tenant
                error: Error
            }

            type Tenant {
                id: ID!
                values: JSON!
            }

            type TenantManagerQuery {
                getCurrentTenant: TenantResponse
            }

            extend type Query {
                tenantManager: TenantManagerQuery
            }
        `);

        builder.addResolver({
            path: "Query.tenantManager",
            resolver: () => {
                return () => ({});
            }
        });

        builder.addResolver({
            path: "TenantManagerQuery.getCurrentTenant",
            dependencies: [GetCurrentTenantUseCase],
            resolver: (getCurrentTenant: GetCurrentTenantUseCase.Interface) => {
                return async () => {
                    const result = await getCurrentTenant.execute();

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        return builder;
    }
}

export default GraphQLSchemaFactory.createImplementation({
    implementation: GetCurrentTenantSchema,
    dependencies: []
});
