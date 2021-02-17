import { Response, ErrorResponse, ListResponse } from "@webiny/handler-graphql";
import { FileInput, FileManagerContext, FilesListOpts, Settings } from "../types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import defaults from "./crud/utils/defaults";

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

                # Is File Manager installed?
                isInstalled: FileManagerBooleanResponse

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
                        return await context.fileManager.files.listTags();
                    } catch (error) {
                        return new ErrorResponse(error);
                    }
                },
                async isInstalled(_, args, context) {
                    const { i18nContent, security } = context;
                    if (!security.getTenant() || !i18nContent.getLocale()) {
                        return false;
                    }

                    const { fileManager } = context;

                    const settings = await fileManager.settings.getSettings();
                    return new Response(Boolean(settings?.installed));
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
                    return resolve(() => context.fileManager.files.deleteFile(args.id));
                },
                async install(_, args, context) {
                    const { fileManager, elasticSearch } = context;
                    try {
                        const settings = await fileManager.settings.getSettings();

                        if (settings && settings.installed) {
                            return new ErrorResponse({
                                code: "FILES_INSTALL_ABORTED",
                                message: "File Manager is already installed."
                            });
                        }

                        const data: Partial<Settings> = {
                            installed: true,
                            webinyVersion: context.WEBINY_VERSION
                        };

                        if (args.srcPrefix) {
                            data.srcPrefix = args.srcPrefix;
                        }

                        if (!settings) {
                            await fileManager.settings.createSettings(data);
                        } else {
                            await fileManager.settings.updateSettings(data);
                        }

                        // Create ES index if it doesn't already exist.
                        const esIndex = defaults.es(context);
                        const { body: exists } = await elasticSearch.indices.exists(esIndex);
                        if (!exists) {
                            await elasticSearch.indices.create(esIndex);
                        }

                        return new Response(true);
                    } catch (error) {
                        return new ErrorResponse(error);
                    }
                },
                async updateSettings(_, args: { data: Partial<Settings> }, context) {
                    return resolve(() => context.fileManager.settings.updateSettings(args.data));
                }
            }
        }
    }
};

export default plugin;
