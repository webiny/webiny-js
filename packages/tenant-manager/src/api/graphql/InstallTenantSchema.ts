import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { CreateAndInstallTenantUseCase } from "../features/CreateAndInstallTenant/abstractions.js";

class InstallTenantSchema implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type TenantManagerMutation {
                installTenant(tenantId: ID!): BooleanResponse
            }

            extend type Mutation {
                tenantManager: TenantManagerMutation
            }
        `);

        builder.addResolver({
            path: "Mutation.tenantManager",
            resolver: () => {
                return () => ({});
            }
        });

        builder.addResolver<{ tenantId: string }>({
            path: "TenantManagerMutation.installTenant",
            dependencies: [CreateAndInstallTenantUseCase],
            resolver: (installTenant: CreateAndInstallTenantUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await installTenant.execute(args.tenantId);
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
    implementation: InstallTenantSchema,
    dependencies: []
});
