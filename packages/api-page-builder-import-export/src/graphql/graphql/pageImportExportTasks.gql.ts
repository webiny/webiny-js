import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import resolve from "./utils/resolve";
import { PbPageImportExportContext } from "../types";
import { PageImportExportTaskStatus } from "~/types";

const plugin: GraphQLSchemaPlugin<PbPageImportExportContext> = {
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

            type PbPageImportExportTaskListResponse {
                data: [PbPageImportExportTask]
                error: PbError
            }

            extend type PbQuery {
                getPageImportExportTask(id: ID!): PbPageImportExportTaskResponse
                listPageImportExportSubTask(
                    id: ID!
                    status: PbPageImportExportTaskStatus
                    limit: Int
                ): PbPageImportExportTaskListResponse
            }
        `,
        resolvers: {
            PbQuery: {
                getPageImportExportTask: async (_, args: { id: string }, context) => {
                    return resolve(() => {
                        return context.pageBuilder.pageImportExportTask.get(args.id);
                    });
                },
                listPageImportExportSubTask: async (
                    _,
                    args: { id: string; status: PageImportExportTaskStatus; limit: number },
                    context
                ) => {
                    return resolve(() => {
                        return context.pageBuilder.pageImportExportTask.listSubTasks(
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
