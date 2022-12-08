import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { ExportBlocksParams, ImportBlocksParams } from "~/types";
import { PbImportExportContext } from "../types";
import resolve from "./utils/resolve";

const plugin: GraphQLSchemaPlugin<PbImportExportContext> = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            type PbExportBlockData {
                task: PbImportExportTask
            }

            type PbExportBlockResponse {
                data: PbExportBlockData
                error: PbError
            }

            type PbImportBlockData {
                task: PbImportExportTask
            }

            type PbImportBlockResponse {
                data: PbImportBlockData
                error: PbError
            }

            extend type PbMutation {
                # Export blocks
                exportBlocks(ids: [ID!], where: PbListPageBlocksWhereInput): PbExportBlockResponse

                # Import blocks
                importBlocks(category: String!, zipFileUrl: String): PbImportBlockResponse
            }
        `,
        resolvers: {
            PbMutation: {
                exportBlocks: async (_, args: any, context) => {
                    /**
                     * We know that args is ExportBlocksParams.
                     */
                    return resolve(() =>
                        context.pageBuilder.blocks.exportBlocks(
                            args as unknown as ExportBlocksParams
                        )
                    );
                },

                importBlocks: async (_, args: any, context) => {
                    /**
                     * We know that args is ExportBlocksParams.
                     */
                    return resolve(() =>
                        context.pageBuilder.blocks.importBlocks(
                            args as unknown as ImportBlocksParams
                        )
                    );
                }
            }
        }
    }
};

export default plugin;
