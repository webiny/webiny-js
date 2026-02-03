import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { DisableTenantUseCase } from "../features/DisableTenant/abstractions.js";

class DisableTenantSchema implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            extend type TenantManagerMutation {
                disableTenant(tenantId: ID!): BooleanResponse
            }
        `);

        builder.addResolver<{ tenantId: string }>({
            path: "TenantManagerMutation.disableTenant",
            dependencies: [DisableTenantUseCase],
            resolver: (disableTenant: DisableTenantUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await disableTenant.execute(args.tenantId);

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
    implementation: DisableTenantSchema,
    dependencies: []
});
