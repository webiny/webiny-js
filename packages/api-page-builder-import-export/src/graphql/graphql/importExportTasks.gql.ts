import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import resolve from "./utils/resolve";
import { PbImportExportContext } from "../types";

const plugin: GraphQLSchemaPlugin<PbImportExportContext> = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            enum PbImportExportTaskStatus {
                pending
                success
                aborted
                failed
                running
            }

            type PbImportExportTaskStats {
                completed: Int
                failed: Int
                total: Int
            }

            type PbImportExportTaskData {
                url: String
                error: PbError
            }

            # REMOVE when import is implemented
            type PbImportExportTask {
                id: ID!
                createdOn: DateTime!
                createdBy: PbCreatedBy!
                status: PbImportExportTaskStatus!
                data: PbImportExportTaskData!
                stats: PbImportExportTaskStats!
            }

            # Response types
            type PbImportExportTaskResponse {
                data: PbImportExportTask
                error: PbError
            }

            type PbImportExportTaskListResponse {
                data: [PbImportExportTask!]
                error: PbError
            }

            extend type PbQuery {
                getExportTask(id: ID!): PbImportExportTaskResponse!
                # remove when implemented import
                getImportExportTask(id: ID!): PbImportExportTaskResponse
                # remove when implemented import
                listImportExportSubTask(
                    id: ID!
                    status: PbImportExportTaskStatus
                    limit: Int
                ): PbImportExportTaskListResponse
            }
        `,
        resolvers: {
            PbQuery: {
                async getExportTask(_, args, context) {
                    return resolve(() => {
                        return context.pageBuilder.importExportTask.getExportTask(args.id);
                    });
                },
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
