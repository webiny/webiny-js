// @flow
import { dummyResolver } from "webiny-api/graphql";
import file from "./graphql/file";
import { type PluginType } from "webiny-api/types";
import { hasScope } from "webiny-api-security";

export default ([
    {
        type: "graphql-schema",
        name: "graphql-schema-files",
        schema: {
            namespace: "files",
            typeDefs: () => [
                file.typeDefs,
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
                `,
                file.typeExtensions
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
            ]
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
