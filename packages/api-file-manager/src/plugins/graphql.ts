import { Response, ErrorResponse, ListResponse } from "@webiny/handler-graphql";
import { FileInput, FileManagerContext, FilesListOpts, FileManagerSettings } from "~/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";

const emptyResolver = () => ({});

const resolve = async fn => {
    try {
        return new Response(await fn());
    } catch (e) {
        return new ErrorResponse(e);
    }
};

const plugin: GraphQLSchemaPlugin<FileManagerContext> = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            type FmCreatedBy {
                id: ID
                displayName: String
            }

            input FileInput {
                key: String
                name: String
                size: Int
                type: String
                tags: [String]
                meta: JSON
            }

            type UploadFileResponseDataFile {
                name: String
                type: String
                size: Int
                key: String
            }

            type UploadFileResponseData {
                # Contains data that is necessary for initiating a file upload.
                data: JSON
                file: UploadFileResponseDataFile
            }

            type FileListMeta {
                cursor: String
                totalCount: Int
                hasMoreItems: Boolean
            }

            type FileError {
                code: String
                message: String
                data: JSON
            }

            type FileListResponse {
                data: [File]
                meta: FileListMeta
                error: FileError
            }

            type FileResponse {
                data: File
                error: FileError
            }

            type CreateFilesResponse {
                data: [File]!
                error: FileError
            }

            type File {
                id: ID
                key: String
                name: String
                size: Int
                type: String
                src: String
                tags: [String]
                meta: JSON
                createdOn: DateTime
                createdBy: FmCreatedBy
            }

            type FileManagerBooleanResponse {
                data: Boolean
                error: FileError
            }

            type FileManagerSettings {
                uploadMinFileSize: Number
                uploadMaxFileSize: Number
            }

            input FileManagerSettingsInput {
                uploadMinFileSize: Number
                uploadMaxFileSize: Number
            }

            type FileManagerSettingsResponse {
                data: FileManagerSettings
                error: FileError
            }

            input FileWhereInput {
                search: String
                type: String
                type_in: [String!]
                tag: String
                tags_in: [String!]
                id_in: [ID!]
                id: ID
            }

            type FmQuery {
                getFile(id: ID, where: JSON, sort: String): FileResponse

                listFiles(
                    limit: Int
                    after: String
                    types: [String]
                    tags: [String]
                    ids: [ID]
                    search: String
                ): FileListResponse

                listTags: [String]

                # Get installed version
                version: String

                getSettings: FileManagerSettingsResponse
            }

            type FilesDeleteResponse {
                data: Boolean
                error: FileError
            }

            type FmMutation {
                createFile(data: FileInput!): FileResponse
                createFiles(data: [FileInput]!): CreateFilesResponse
                updateFile(id: ID!, data: FileInput!): FileResponse
                deleteFile(id: ID!): FilesDeleteResponse

                # Install File manager
                install(srcPrefix: String): FileManagerBooleanResponse

                upgrade(version: String!): FileManagerBooleanResponse

                updateSettings(data: FileManagerSettingsInput): FileManagerSettingsResponse
            }

            input FilesInstallInput {
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
            File: {
                async src(file, args, context: FileManagerContext) {
                    const settings = await context.fileManager.settings.getSettings();
                    return settings.srcPrefix + file.key;
                }
            },
            Query: {
                fileManager: emptyResolver
            },
            Mutation: {
                fileManager: emptyResolver
            },
            FmQuery: {
                getFile(_, args: { id: string }, context) {
                    return resolve(() => context.fileManager.files.getFile(args.id));
                },
                async listFiles(_, args: FilesListOpts, context) {
                    try {
                        const [data, meta] = await context.fileManager.files.listFiles(args);
                        return new ListResponse(data, meta);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                async listTags(_, args, context) {
                    try {
                        return await context.fileManager.files.listTags(args || {});
                    } catch (error) {
                        return new ErrorResponse(error);
                    }
                },
                async version(_, args, context) {
                    const { i18nContent, tenancy, fileManager } = context;
                    if (!tenancy.getCurrentTenant() || !i18nContent.getLocale()) {
                        return null;
                    }

                    return await fileManager.system.getVersion();
                },
                async getSettings(_, args, context) {
                    return resolve(() => context.fileManager.settings.getSettings());
                }
            },
            FmMutation: {
                async createFile(_, args: { data: FileInput }, context) {
                    return resolve(() => context.fileManager.files.createFile(args.data));
                },
                async updateFile(_, args, context) {
                    return resolve(() => context.fileManager.files.updateFile(args.id, args.data));
                },
                async createFiles(_, args, context) {
                    return resolve(() => context.fileManager.files.createFilesInBatch(args.data));
                },
                async deleteFile(_, args, context) {
                    return resolve(async () => {
                        const file = await context.fileManager.files.getFile(args.id);
                        return await context.fileManager.storage.delete({
                            id: file.id,
                            key: file.key
                        });
                    });
                },
                async install(_, args, context) {
                    return resolve(() =>
                        context.fileManager.system.install({ srcPrefix: args.srcPrefix })
                    );
                },
                async upgrade(_, args, context) {
                    return resolve(() => context.fileManager.system.upgrade(args.version));
                },
                async updateSettings(_, args: { data: Partial<FileManagerSettings> }, context) {
                    return resolve(() => context.fileManager.settings.updateSettings(args.data));
                }
            }
        }
    }
};

export default plugin;
