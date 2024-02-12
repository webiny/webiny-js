import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import {
    ExportPagesParams,
    PbExportPagesResponse,
    ImportPagesParams,
    PbImportExportContext
} from "../types";
import resolve from "./utils/resolve";
import { Response, ErrorResponse } from "@webiny/handler-graphql";

const plugin: GraphQLSchemaPlugin<PbImportExportContext> = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            enum PbImportExportPagesTaskStatus {
                pending
                running
                failed
                success
                aborted
            }

            type PbImportExportPagesTaskStats {
                completed: Int
                failed: Int
                total: Int
            }

            type PbExportPagesTaskData {
                url: String
                error: PbError
            }

            type PbExportPagesTask {
                id: ID!
                createdOn: DateTime!
                createdBy: PbCreatedBy!
                status: PbImportExportPagesTaskStatus!
                data: PbExportPagesTaskData!
                stats: PbImportExportPagesTaskStats!
            }
            type PbExportPagesData {
                task: PbExportPagesTask!
            }

            type PbExportPageResponse {
                data: PbExportPagesData
                error: PbError
            }

            type PbImportPagesTask {
                id: ID!
                createdOn: DateTime!
                createdBy: PbCreatedBy!
                status: PbImportExportPagesTaskStatus!
                stats: PbImportExportPagesTaskStats!
            }

            type PbImportPageData {
                task: PbImportPagesTask!
            }

            type PbImportPageResponse {
                data: PbImportPageData
                error: PbError
            }

            enum PbExportPageRevisionType {
                published
                latest
            }

            type PbExportPagesTaskResponse {
                data: PbExportPagesTask
                error: PbError
            }

            type PbImportPagesTaskResponse {
                data: PbImportPagesTask
                error: PbError
            }

            extend type PbQuery {
                getExportPagesTask(id: ID!): PbExportPagesTaskResponse!
                getImportPagesTask(id: ID!): PbImportPagesTaskResponse!
            }

            extend type PbMutation {
                # Export pages
                exportPages(
                    where: PbListPagesWhereInput
                    sort: [PbListPagesSort!]
                    search: PbListPagesSearchInput
                    revisionType: PbExportPageRevisionType!
                ): PbExportPageResponse!

                # Import pages
                importPages(
                    category: String!
                    zipFileUrl: String!
                    meta: JSON
                ): PbImportPageResponse!
            }
        `,
        resolvers: {
            PbQuery: {
                async getExportPagesTask(_, args, context) {
                    return resolve(() => {
                        return context.pageBuilder.pages.getExportTask(args.id);
                    });
                },
                async getImportPagesTask(_, args, context) {
                    return resolve(() => {
                        return context.pageBuilder.pages.getImportTask(args.id);
                    });
                }
            },
            PbMutation: {
                exportPages: async (
                    _,
                    args,
                    context
                ): Promise<Response<PbExportPagesResponse> | ErrorResponse> => {
                    return resolve(() => {
                        return context.pageBuilder.pages.exportPages(args as ExportPagesParams);
                    });
                },

                importPages: async (_, args, context) => {
                    return resolve(() => {
                        return context.pageBuilder.pages.importPages(args as ImportPagesParams);
                    });
                }
            }
        }
    }
};

export default plugin;
