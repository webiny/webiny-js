// @flow
import { gql } from "apollo-server-lambda";
import { dummyResolver } from "@webiny/api/graphql/commodo";
import { type PluginType } from "@webiny/api/types";
import { hasScope } from "@webiny/api-security";
import { resolveCreate, resolveDelete, resolveGet } from "@webiny/api/graphql/commodo";

import listFiles from "./resolvers/listFiles";
import listTags from "./resolvers/listTags";
import updateFileBySrc from "./resolvers/updateFileBySrc";

const fileFetcher = ctx => ctx.models.File;

export default ([
    {
        type: "graphql-schema",
        name: "graphql-schema-files",
        schema: {
            typeDefs: gql`
                input FileInput {
                    id: ID!
                    name: String
                    size: Int
                    type: String
                    src: String
                    tags: [String]
                    meta: JSON
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

                type File @key(fields: "id") {
                    id: ID
                    name: String
                    size: Int
                    type: String
                    src: String
                    tags: [String]
                    meta: JSON
                    createdOn: DateTime
                }

                type FilesQuery {
                    getFile(id: ID, where: JSON, sort: String): FileResponse

                    listFiles(
                        page: Int
                        perPage: Int
                        types: [String]
                        tags: [String]
                        sort: JSON
                        search: String
                    ): FileListResponse

                    listTags: [String]
                }

                type FilesDeleteResponse {
                    data: Boolean
                    error: FileError
                }

                type FilesMutation {
                    createFile(data: FileInput!): FileResponse
                    updateFileBySrc(src: String!, data: FileInput!): FileResponse
                    deleteFile(id: ID!): FilesDeleteResponse
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
                        return fileFetcher(context).findById(reference.id);
                    }
                },
                Query: {
                    files: dummyResolver
                },
                Mutation: {
                    files: dummyResolver
                },
                FilesQuery: {
                    getFile: resolveGet(fileFetcher),
                    listFiles: listFiles,
                    listTags: listTags
                },
                FilesMutation: {
                    createFile: resolveCreate(fileFetcher),
                    updateFileBySrc: updateFileBySrc,
                    deleteFile: resolveDelete(fileFetcher)
                }
            }
        },
        security: {
            shield: {
                FilesQuery: {
                    getFile: hasScope("files:file:crud"),
                    listFiles: hasScope("files:file:crud")
                },
                FilesMutation: {
                    createFile: hasScope("files:file:crud"),
                    updateFileBySrc: hasScope("files:file:crud"),
                    deleteFile: hasScope("files:file:crud")
                }
            }
        }
    }
]: Array<PluginType>);
