import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import type { FileManagerContext } from "~/types.js";
import { emptyResolver, resolve } from "./utils.js";

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
                    return resolve(() => context.fileManager.getSettings());
                }
            },
            FmMutation: {
                async updateSettings(_, args: any, context) {
                    return resolve(() => context.fileManager.updateSettings(args.data));
                }
            }
        }
    });
    fileManagerGraphQL.name = "fm.graphql.base";

    return fileManagerGraphQL;
};
