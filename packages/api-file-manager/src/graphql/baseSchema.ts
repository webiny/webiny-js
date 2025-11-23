import {
    ErrorResponse,
    GraphQLSchemaPlugin,
    Response
} from "@webiny/handler-graphql";
import type { FileManagerContext } from "~/types.js";
import { emptyResolver } from "./utils.js";
import { GetSettingsUseCase } from "~/features/settings/GetSettings/abstractions.js";
import { UpdateSettingsUseCase } from "~/features/settings/UpdateSettings/abstractions.js";

export const createBaseSchema = () => {
    const fileManagerGraphQL = new GraphQLSchemaPlugin<FileManagerContext>({
        typeDefs: /* GraphQL */ `
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
        `,
        resolvers: {
            Query: {
                fileManager: emptyResolver
            },
            Mutation: {
                fileManager: emptyResolver
            },
            FmQuery: {
                async getSettings(_, __, context) {
                    const getSettings = context.container.resolve(GetSettingsUseCase);
                    const result = await getSettings.execute();

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                }
            },
            FmMutation: {
                async updateSettings(_, args: any, context) {
                    const updateSettings = context.container.resolve(UpdateSettingsUseCase);
                    const result = await updateSettings.execute(args.data);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                }
            }
        }
    });
    fileManagerGraphQL.name = "fm.graphql.base";

    return fileManagerGraphQL;
};
