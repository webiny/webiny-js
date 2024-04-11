import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { FileManagerContext } from "~/types";
import { emptyResolver, resolve } from "./utils";

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
                version: String
                getSettings: FmSettingsResponse
            }

            type FmDeleteResponse {
                data: Boolean
                error: FmError
            }

            type FmMutation {
                install(srcPrefix: String): FmBooleanResponse
                updateSettings(data: FmSettingsInput): FmSettingsResponse
            }

            input FmInstallInput {
                srcPrefix: String!
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
                async version(_, __, context) {
                    const { i18n, tenancy, fileManager } = context;
                    if (!tenancy.getCurrentTenant() || !i18n.getContentLocale()) {
                        return null;
                    }

                    const version = await fileManager.getVersion();
                    return version ? "true" : null;
                },
                async getSettings(_, __, context) {
                    return resolve(() => context.fileManager.getSettings());
                }
            },
            FmMutation: {
                async install(_, args: any, context) {
                    return resolve(() =>
                        context.fileManager.install({ srcPrefix: args.srcPrefix })
                    );
                },
                async updateSettings(_, args: any, context) {
                    return resolve(() => context.fileManager.updateSettings(args.data));
                }
            }
        }
    });
    fileManagerGraphQL.name = "fm.graphql.base";

    return fileManagerGraphQL;
};
