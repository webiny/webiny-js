import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { CreateTenantUseCase } from "../features/CreateTenant/abstractions.js";

class CreateTenantSchema implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            input CreateTenantInput {
                id: ID
                name: String!
                description: String
                extensions: JSON
            }

            extend type TenantManagerMutation {
                createTenant(input: CreateTenantInput!): BooleanResponse
            }
        `);

        builder.addResolver<{ input: CreateTenantUseCase.Input }>({
            path: "TenantManagerMutation.createTenant",
            dependencies: [CreateTenantUseCase],
            resolver: (createTenant: CreateTenantUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await createTenant.execute(args.input);

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
    implementation: CreateTenantSchema,
    dependencies: []
});
