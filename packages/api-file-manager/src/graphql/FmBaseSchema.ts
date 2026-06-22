import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { GetSettingsUseCase } from "~/features/settings/GetSettings/abstractions.js";
import { UpdateSettingsUseCase } from "~/features/settings/UpdateSettings/abstractions.js";

class FmBaseSchema_ implements GraphQLSchemaFactory.Interface {
    public async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type FmError {
                code: String
                message: String
                data: JSON
                stack: String
            }

            type FmCreatedBy {
                id: ID
                displayName: String
                type: String
            }

            type FmListMeta {
                cursor: String
                totalCount: Int
                hasMoreItems: Boolean
            }

            type FmBooleanResponse {
                data: Boolean
                error: FmError
            }

            type FmSettings {
                uploadMinFileSize: Number
                uploadMaxFileSize: Number
                srcPrefix: String
            }

            input FmSettingsInput {
                uploadMinFileSize: Number
                uploadMaxFileSize: Number
                srcPrefix: String
            }

            type FmSettingsResponse {
                data: FmSettings
                error: FmError
            }

            type FmQuery {
                getSettings: FmSettingsResponse
            }

            type FmDeleteResponse {
                data: Boolean
                error: FmError
            }

            type FmMutation {
                updateSettings(data: FmSettingsInput): FmSettingsResponse
            }

            extend type Query {
                fileManager: FmQuery
            }

            extend type Mutation {
                fileManager: FmMutation
            }
        `);

        builder.addResolver({
            path: "Query.fileManager",
            resolver: () => {
                return () => ({});
            }
        });

        builder.addResolver({
            path: "Mutation.fileManager",
            resolver: () => {
                return () => ({});
            }
        });

        builder.addResolver({
            path: "FmQuery.getSettings",
            dependencies: [GetSettingsUseCase],
            resolver: (getSettings: GetSettingsUseCase.Interface) => {
                return async () => {
                    const result = await getSettings.execute();

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                };
            }
        });

        builder.addResolver({
            path: "FmMutation.updateSettings",
            dependencies: [UpdateSettingsUseCase],
            resolver: (updateSettings: UpdateSettingsUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await updateSettings.execute(args.data);

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

export const FmBaseSchema = GraphQLSchemaFactory.createImplementation({
    implementation: FmBaseSchema_,
    dependencies: []
});
