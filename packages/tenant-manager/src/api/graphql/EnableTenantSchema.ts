import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { EnableTenantUseCase } from "../features/EnableTenant/abstractions.js";

class EnableTenantSchema implements GraphQLSchemaFactory.Interface {
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
