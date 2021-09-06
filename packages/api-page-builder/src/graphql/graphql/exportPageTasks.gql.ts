import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import resolve from "./utils/resolve";
import { PbContext } from "../types";

const plugin: GraphQLSchemaPlugin<PbContext> = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            enum PbExportPageTaskStatus {
                pending
                processing
                completed
                failed
            }
            type PbExportPageTask {
                id: ID
                createdOn: DateTime
                createdBy: PbCreatedBy
                status: PbExportPageTaskStatus
                data: JSON
            }

            input PbExportPageTaskInput {
                status: PbExportPageTaskStatus
            }

            input PbExportPageTaskUpdateInput {
                status: PbExportPageTaskStatus
                data: JSON
            }

            # Response types
            type PbExportPageTaskResponse {
                data: PbExportPageTask
                error: PbError
            }

            type PbExportPageTaskListResponse {
                data: [PbExportPageTask]
                error: PbError
            }

            extend type PbQuery {
                listExportPageTasks: PbExportPageTaskListResponse
                getExportPageTask(id: ID!): PbExportPageTaskResponse
            }

            extend type PbMutation {
                createExportPageTask(data: PbExportPageTaskInput!): PbExportPageTaskResponse
                updateExportPageTask(
                    id: ID!
                    data: PbExportPageTaskUpdateInput!
                ): PbExportPageTaskResponse
                deleteExportPageTask(id: ID!): PbExportPageTaskResponse
            }
        `,
        resolvers: {
            PbQuery: {
                getExportPageTask: async (_, args: { id: string }, context) => {
                    return resolve(() => {
                        return context.pageBuilder.pageExportTask.get(args.id);
                    });
                },
                listExportPageTasks: async (_, args, context) => {
                    return resolve(() => {
                        return context.pageBuilder.pageExportTask.list();
                    });
                }
            },
            PbMutation: {
                createExportPageTask: async (_, args: { data: Record<string, any> }, context) => {
                    return resolve(() => {
                        return context.pageBuilder.pageExportTask.create(args.data);
                    });
                },
                updateExportPageTask: async (
                    _,
                    args: { id: string; data: Record<string, any> },
                    context
                ) => {
                    return resolve(() => {
                        return context.pageBuilder.pageExportTask.update(args.id, args.data);
                    });
                },
                deleteExportPageTask: async (_, args: { id: string }, context) => {
                    return resolve(() => {
                        return context.pageBuilder.pageExportTask.delete(args.id);
                    });
                }
            }
        }
    }
};

export default plugin;
