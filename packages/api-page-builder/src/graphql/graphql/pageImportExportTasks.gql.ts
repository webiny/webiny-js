import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import resolve from "./utils/resolve";
import { PbContext } from "../types";

const plugin: GraphQLSchemaPlugin<PbContext> = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            enum PbPageImportExportTaskStatus {
                pending
                processing
                completed
                failed
            }

            type PbPageImportExportTaskStats {
                pending: Int
                processing: Int
                completed: Int
                failed: Int
                total: Int
            }

            type PbPageImportExportTask {
                id: ID
                createdOn: DateTime
                createdBy: PbCreatedBy
                status: PbPageImportExportTaskStatus
                data: JSON
                stats: PbPageImportExportTaskStats
                error: JSON
            }

            # Response types
            type PbPageImportExportTaskResponse {
                data: PbPageImportExportTask
                error: PbError
            }

            extend type PbQuery {
                getPageImportExportTask(id: ID!): PbPageImportExportTaskResponse
            }
        `,
        resolvers: {
            PbQuery: {
                getPageImportExportTask: async (_, args: { id: string }, context) => {
                    return resolve(() => {
                        return context.pageBuilder.pageImportExportTask.get(args.id);
                    });
                }
            }
        }
    }
};

export default plugin;
