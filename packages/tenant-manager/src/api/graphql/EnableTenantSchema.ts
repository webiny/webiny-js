import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { Response } from "@webiny/api-graphql";
import { ErrorResponse } from "@webiny/api-graphql";
import { EnableTenantUseCase } from "../features/EnableTenant/abstractions.js";

class EnableTenantSchema implements GraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("tenant-manager/EnableTenantSchema");

    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            extend type TenantManagerMutation {
                enableTenant(tenantId: ID!): BooleanResponse
            }
        `);

        builder.addResolver<{ tenantId: string }>({
            path: "TenantManagerMutation.enableTenant",
            dependencies: [EnableTenantUseCase],
            resolver: (enableTenant: EnableTenantUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await enableTenant.execute(args.tenantId);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(true);
                };
            }
        });

        return builder;
    }
}

export default GraphQLSchemaFactory.createImplementation({
    implementation: EnableTenantSchema,
    dependencies: []
});
