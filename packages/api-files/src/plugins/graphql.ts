import gql from "graphql-tag";
import { emptyResolver } from "@webiny/commodo-graphql";
import { hasScope } from "@webiny/api-security";
import { resolveCreate, resolveGet, resolveUpdate } from "@webiny/commodo-graphql";

import listFiles from "./resolvers/listFiles";
import listTags from "./resolvers/listTags";
import uploadFile from "./resolvers/uploadFile";
import uploadFiles from "./resolvers/uploadFiles";
import createFiles from "./resolvers/createFiles";
import deleteFile from "./resolvers/deleteFile";
import { install, isInstalled } from "./resolvers/install";

const getFile = ({ models }): any => models.File;

export default [
    {
        type: "graphql-schema",
        name: "graphql-schema-files",
        schema: {
            typeDefs: gql`
                input FileInput {
                    id: ID
                    key: String
                    name: String
                    size: Int
                    type: String
                    tags: [String]
                    meta: JSON
                }

                input UploadFileInput {
                    name: String!
                    type: String!
                    size: Int!
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

                type UploadFileResponse {
                    error: FileError
                    data: UploadFileResponseData
                }

                type UploadFilesResponse {
                    error: FileError
                    data: [UploadFileResponseData]!
                }

                type FileListMeta {
                    totalCount: Int
                    totalPages: Int
                    page: Int
                    perPage: Int
                    from: Int
                    to: Int
                    previousPage: Int
                    nextPage: Int
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

                type File @key(fields: "id") {
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

                type FilesQuery {
                    getFile(id: ID, where: JSON, sort: String): FileResponse

                    listFiles(
                        page: Int
                        perPage: Int
                        types: [String]
                        tags: [String]
                        ids: [ID]
                        sort: JSON
                        search: String
                    ): FileListResponse

                    listTags: [String]

                    # Is File Manager installed?
                    isInstalled: FilesBooleanResponse
                }

                type FilesDeleteResponse {
                    data: Boolean
                    error: FileError
                }

                type FilesMutation {
                    uploadFile(data: UploadFileInput!): UploadFileResponse
                    uploadFiles(data: [UploadFileInput]!): UploadFilesResponse
                    createFile(data: FileInput!): FileResponse
                    createFiles(data: [FileInput]!): CreateFilesResponse
                    updateFile(id: ID!, data: FileInput!): FileResponse
                    deleteFile(id: ID!): FilesDeleteResponse

                    # Install File manager
                    install(srcPrefix: String): FilesBooleanResponse
                }

                input FilesInstallInput {
                    srcPrefix: String!
                }

                extend type Query {
                    files: FilesQuery
                }

                extend type Mutation {
                    files: FilesMutation
                }
            `,
            resolvers: {
                File: {
                    __resolveReference(reference, context) {
                        return getFile(context).findById(reference.id);
                    }
                },
                Query: {
                    files: emptyResolver
                },
                Mutation: {
                    files: emptyResolver
                },
                FilesQuery: {
                    getFile: resolveGet(getFile),
                    listFiles: listFiles,
                    listTags: listTags,
                    isInstalled
                },
                FilesMutation: {
                    uploadFile,
                    uploadFiles,
                    createFile: resolveCreate(getFile),
                    updateFile: resolveUpdate(getFile),
                    createFiles,
                    deleteFile,
                    install
                }
            }
        },
        security: {
            shield: {
                FilesQuery: {
                    getFile: hasScope("files:file:crud")
                },
                FilesMutation: {
                    uploadFile: hasScope("files:file:crud"),
                    createFile: hasScope("files:file:crud"),
                    updateFile: hasScope("files:file:crud"),
                    deleteFile: hasScope("files:file:crud")
                }
            }
        }
    }
];
