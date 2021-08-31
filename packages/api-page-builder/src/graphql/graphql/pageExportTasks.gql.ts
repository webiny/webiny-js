import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import resolve from "./utils/resolve";
import { PbContext } from "../types";

const plugin: GraphQLSchemaPlugin<PbContext> = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            enum PbPageExportTaskStatus {
                pending
                processing
                completed
            }
            type PbPageExportTask {
                id: ID
                createdOn: DateTime
                createdBy: PbCreatedBy
                status: PbPageExportTaskStatus
                data: JSON
            }

            input PbPageExportTaskInput {
                status: PbPageExportTaskStatus
            }

            input PbPageExportTaskUpdateInput {
                status: PbPageExportTaskStatus
                data: JSON
            }

            # Response types
            type PbPageExportTaskResponse {
                data: PbPageExportTask
                error: PbError
            }

            type PbPageExportTaskListResponse {
                data: [PbPageExportTask]
                error: PbError
            }

            extend type PbQuery {
                listPageExportTasks: PbPageExportTaskListResponse
                getPageExportTask(id: ID!): PbPageExportTaskResponse
            }

            extend type PbMutation {
                createPageExportTask(data: PbPageExportTaskInput!): PbPageExportTaskResponse
                updatePageExportTask(
                    id: ID!
                    data: PbPageExportTaskUpdateInput!
                ): PbPageExportTaskResponse
                deletePageExportTask(id: ID!): PbPageExportTaskResponse
            }
        `,
        resolvers: {
            PbQuery: {
                getPageExportTask: async (_, args: { id: string }, context) => {
                    return resolve(() => {
                        return context.pageBuilder.pageExportTask.get(args.id);
                    });
                },
                listPageExportTasks: async (_, args, context) => {
                    return resolve(() => {
                        return context.pageBuilder.pageExportTask.list();
                    });
                }
            },
            PbMutation: {
                createPageExportTask: async (_, args: { data: Record<string, any> }, context) => {
                    return resolve(() => {
                        return context.pageBuilder.pageExportTask.create(args.data);
                    });
                },
                updatePageExportTask: async (
                    _,
                    args: { id: string; data: Record<string, any> },
                    context
                ) => {
                    return resolve(() => {
                        return context.pageBuilder.pageExportTask.update(args.id, args.data);
                    });
                },
                deletePageExportTask: async (_, args: { id: string }, context) => {
                    return resolve(() => {
                        return context.pageBuilder.pageExportTask.delete(args.id);
                    });
                }
            }
        }
    }
};

export default plugin;
