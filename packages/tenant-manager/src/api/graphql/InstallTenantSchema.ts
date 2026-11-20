import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { Response } from "@webiny/api-graphql";
import { ErrorResponse } from "@webiny/api-graphql";
import { CreateAndInstallTenantUseCase } from "../features/CreateAndInstallTenant/abstractions.js";

class InstallTenantSchema implements GraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("tenant-manager/InstallTenantSchema");

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
