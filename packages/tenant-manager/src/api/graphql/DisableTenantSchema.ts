import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { Response } from "@webiny/api-graphql";
import { ErrorResponse } from "@webiny/api-graphql";
import { DisableTenantUseCase } from "../features/DisableTenant/abstractions.js";

class DisableTenantSchema implements GraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("tenant-manager/DisableTenantSchema");

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
