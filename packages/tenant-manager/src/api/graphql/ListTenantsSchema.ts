import { Response } from "@webiny/api-graphql";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { ErrorResponse } from "@webiny/api-graphql";
import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { ListTenantsUseCase } from "../features/ListTenants/abstractions.js";

class ListTenantsSchema implements GraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("tenant-manager/ListTenantsSchema");

    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type TenantListResponse {
                data: [Tenant!]
                error: Error
            }

            extend type TenantManagerQuery {
                listTenants(search: String): TenantListResponse
            }
        `);

        builder.addResolver<{ search?: string }>({
            path: "TenantManagerQuery.listTenants",
            dependencies: [ListTenantsUseCase],
            resolver: (listTenants: ListTenantsUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await listTenants.execute({ search: args.search });

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
    implementation: ListTenantsSchema,
    dependencies: []
});
