import { hasPermission } from "@webiny/api-security";
import { pipe } from "@webiny/handler-graphql";
import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import getFile from "./resolvers/getFile";
import listFiles from "./resolvers/listFiles";
import listTags from "./resolvers/listTags";
import createFile from "./resolvers/createFile";
import updateFile from "./resolvers/updateFile";
import createFiles from "./resolvers/createFiles";
import deleteFile from "./resolvers/deleteFile";
import { getSettings, updateSettings } from "./resolvers/settings";
import { install, isInstalled } from "./resolvers/install";
import { FileManagerResolverContext } from "../types";

const emptyResolver = () => ({});

export default [
    {
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
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

                type FileCursors {
                    next: String
                    previous: String
                }

                type FileListMeta {
                    cursors: FileCursors
                    hasNextPage: Boolean
                    hasPreviousPage: Boolean
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
                }

                type FilesBooleanResponse {
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

                enum ListFilesSort {
                    CREATED_ON_ASC
                    CREATED_ON_DESC
                    SIZE_ASC
                    SIZE_DESC
                }

                type FileManagerQuery {
                    getFile(id: ID, where: JSON, sort: String): FileResponse

                    listFiles(
                        limit: Int
                        after: String
                        before: String
                        types: [String]
                        tags: [String]
                        ids: [ID]
                        search: String
                        sort: ListFilesSort
                    ): FileListResponse

                    listTags: [String]

                    # Is File Manager installed?
                    isInstalled: FilesBooleanResponse

                    getSettings: FileManagerSettingsResponse
                }

                type FilesDeleteResponse {
                    data: Boolean
                    error: FileError
                }

                type FileManagerMutation {
                    createFile(data: FileInput!): FileResponse
                    createFiles(data: [FileInput]!): CreateFilesResponse
                    updateFile(id: ID!, data: FileInput!): FileResponse
                    deleteFile(id: ID!): FilesDeleteResponse

                    # Install File manager
                    install(srcPrefix: String): FilesBooleanResponse

                    updateSettings(data: FileManagerSettingsInput): FileManagerSettingsResponse
                }

                input FilesInstallInput {
                    srcPrefix: String!
                }

                extend type Query {
                    fileManager: FileManagerQuery
                }

                extend type Mutation {
                    fileManager: FileManagerMutation
                }
            `,
            resolvers: {
                File: {
                    async src(file, args, context: FileManagerResolverContext) {
                        const settings = await context.fileManager.fileManagerSettings.getSettings();
                        return settings.srcPrefix + file.key;
                    }
                },
                Query: {
                    fileManager: emptyResolver
                },
                Mutation: {
                    fileManager: emptyResolver
                },
                FileManagerQuery: {
                    getFile: pipe(hasPermission("fm.file"), hasI18NContentPermission())(getFile),
                    listFiles: pipe(
                        hasPermission("fm.file"),
                        hasI18NContentPermission()
                    )(listFiles),
                    listTags: listTags,
                    isInstalled,
                    getSettings: pipe(
                        hasPermission("fm.settings"),
                        hasI18NContentPermission()
                    )(getSettings)
                },
                FileManagerMutation: {
                    createFile: pipe(
                        hasPermission("fm.file"),
                        hasI18NContentPermission()
                    )(createFile),
                    updateFile: pipe(
                        hasPermission("fm.file"),
                        hasI18NContentPermission()
                    )(updateFile),
                    createFiles: pipe(
                        hasPermission("fm.file"),
                        hasI18NContentPermission()
                    )(createFiles),
                    deleteFile: pipe(
                        hasPermission("fm.file"),
                        hasI18NContentPermission()
                    )(deleteFile),
                    install,
                    updateSettings: pipe(
                        hasPermission("fm.settings"),
                        hasI18NContentPermission()
                    )(updateSettings)
                }
            }
        }
    }
];
