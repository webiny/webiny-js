import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { FrontendGetSettingsUseCase } from "~/api/features/getSettings/abstractions.js";
import { FrontendUpdateSettingsUseCase } from "~/api/features/updateSettings/abstractions.js";
import type { IFrontendSettings } from "~/shared/types.js";

class FrontendSettingsSchemaImpl implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type FrontendStarterKit {
                id: String!
                label: String!
                config: String!
            }

            type FrontendSettings {
                domain: String!
                starterKits: [FrontendStarterKit!]!
            }

            input FrontendSettingsInput {
                domain: String!
            }

            type FrontendSettingsResponse {
                data: FrontendSettings
                error: FrontendSettingsError
            }

            type FrontendSettingsError {
                code: String
                message: String
                data: JSON
            }

            type FrontendQuery {
                getSettings: FrontendSettingsResponse
            }

            type FrontendMutation {
                updateSettings(data: FrontendSettingsInput!): BooleanResponse
            }

            extend type Query {
                frontend: FrontendQuery
            }

            extend type Mutation {
                frontend: FrontendMutation
            }
        `);

        builder.addResolver({
            path: "Query.frontend",
            resolver: () => () => ({})
        });

        builder.addResolver({
            path: "Mutation.frontend",
            resolver: () => () => ({})
        });

        builder.addResolver({
            path: "FrontendQuery.getSettings",
            dependencies: [FrontendGetSettingsUseCase],
            resolver: (useCase: FrontendGetSettingsUseCase.Interface) => {
                return async () => {
                    const result = await useCase.execute();
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<{ data: IFrontendSettings }>({
            path: "FrontendMutation.updateSettings",
            dependencies: [FrontendUpdateSettingsUseCase],
            resolver: (useCase: FrontendUpdateSettingsUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await useCase.execute(args.data);
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

export const FrontendSettingsSchema = GraphQLSchemaFactory.createImplementation({
    implementation: FrontendSettingsSchemaImpl,
    dependencies: []
});
