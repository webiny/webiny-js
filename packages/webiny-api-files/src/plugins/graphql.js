// @flow
import { gql } from "apollo-server-lambda";
import { dummyResolver } from "webiny-api/graphql";
import { type PluginType } from "webiny-api/types";
import { hasScope } from "webiny-api-security";
import { resolveCreate, resolveDelete, resolveGet } from "webiny-api/graphql";

import listFiles from "./resolvers/listFiles";
import listTags from "./resolvers/listTags";
import updateFileBySrc from "./resolvers/updateFileBySrc";

const fileFetcher = ctx => ctx.files.entities.File;

export default ([
    {
        type: "graphql-schema",
        name: "graphql-schema-files",
        schema: {
            namespace: "files",
            typeDefs: gql`
                input FileInput {
                    name: String
                    size: Int
                    type: String
                    src: String
                    tags: [String]
                    meta: JSON
                }

                type FileListResponse {
                    data: [File]
                    meta: ListMeta
                    error: Error
                }

                type FileResponse {
                    data: File
                    error: Error
                }

                type File {
                    name: String
                    size: Int
                    type: String
                    src: String
                    tags: [String]
                    meta: JSON
                    createdOn: String
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

                type FilesMutation {
                    createFile(data: FileInput!): FileResponse
                    updateFileBySrc(src: String!, data: FileInput!): FileResponse
                    deleteFile(id: ID!): DeleteResponse
                }

                extend type Query {
                    files: FilesQuery
                }

                extend type Mutation {
                    files: FilesMutation
                }
            `,
            resolvers: {
                Query: {
                    files: dummyResolver
                },
                Mutation: {
                    files: dummyResolver
                },
                FilesQuery: {
                    getFile: resolveGet(fileFetcher),
                    listFiles: listFiles(fileFetcher),
                    listTags: listTags(fileFetcher)
                },
                FilesMutation: {
                    createFile: resolveCreate(fileFetcher),
                    updateFileBySrc: updateFileBySrc(fileFetcher),
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
