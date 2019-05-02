// @flow
import { dummyResolver } from "webiny-api/graphql";
import file from "./graphql/file";
import { type PluginType } from "webiny-api/types";
import { hasScope } from "webiny-api-security";
import {
    FileType,
    FileInputType,
    FileResponseType,
    FileListResponseType
} from "webiny-api-files/graphql";

export default ([
    {
        type: "graphql",
        name: "graphql-files-schema",
        namespace: "files",
        typeDefs: [
            FileType,
            FileInputType,
            FileResponseType,
            FileListResponseType,
            file.typeExtensions,
            /* GraphQL */ `
                type FilesQuery {
                    _empty: String
                }

                type FilesMutation {
                    _empty: String
                }

                type Query {
                    files: FilesQuery
                }

                type Mutation {
                    files: FilesMutation
                }
            `
        ],
        resolvers: () => [
            {
                Query: {
                    files: dummyResolver
                },
                Mutation: {
                    files: dummyResolver
                }
            },
            file.resolvers
        ],
        files: {
            shield: {
                FilesQuery: {
                    getFile: hasScope("files:file:crud"),
                    listFiles: hasScope("files:file:crud")
                },
                FilesMutation: {
                    createFile: hasScope("files:file:crud"),
                    updateFile: hasScope("files:file:crud"),
                    deleteFile: hasScope("files:file:crud")
                }
            }
        }
    }
]: Array<PluginType>);
