import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { resolve } from "./utils/resolve";
import { PbImportExportContext } from "../types";

const plugin: GraphQLSchemaPlugin<PbImportExportContext> = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            enum PbImportExportTaskStatus {
                pending
                processing
                completed
                failed
            }

            type PbImportExportTaskStats {
                pending: Int
                processing: Int
                completed: Int
                failed: Int
                total: Int
            }

            type PbImportExportTask {
                id: ID
                createdOn: DateTime
                createdBy: PbCreatedBy
                status: PbImportExportTaskStatus
                data: JSON
                stats: PbImportExportTaskStats
                error: JSON
            }

            # Response types
            type PbImportExportTaskResponse {
                data: PbImportExportTask
                error: PbError
            }

            type PbImportExportTaskListResponse {
                data: [PbImportExportTask]
                error: PbError
            }

            extend type PbQuery {
                getImportExportTask(id: ID!): PbImportExportTaskResponse
                listImportExportSubTask(
                    id: ID!
                    status: PbImportExportTaskStatus
                    limit: Int
                ): PbImportExportTaskListResponse
            }
        `,
        resolvers: {
            PbQuery: {
                getImportExportTask: async (_, args: any, context) => {
                    return resolve(() => {
                        return context.pageBuilder.importExportTask.getTask(args.id);
                    });
                },
                listImportExportSubTask: async (_, args: any, context) => {
                    return resolve(() => {
                        return context.pageBuilder.importExportTask.listSubTasks(
                            args.id,
                            args.status,
                            args.limit
                        );
                    });
                }
            }
        }
    }
};
export default plugin;
