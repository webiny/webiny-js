import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { ExportPagesParams, ImportPagesParams } from "~/types";
import { PbImportExportContext } from "../types";
import resolve from "./utils/resolve";

const plugin: GraphQLSchemaPlugin<PbImportExportContext> = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            type PbExportPageData {
                task: PbImportExportTask
            }

            type PbExportPageResponse {
                data: PbExportPageData
                error: PbError
            }

            type PbImportPageData {
                task: PbImportExportTask
            }

            type PbImportPageResponse {
                data: PbImportPageData
                error: PbError
            }

            enum PbExportPageRevisionType {
                published
                latest
            }

            extend type PbMutation {
                # Export pages
                exportPages(
                    ids: [ID!]
                    revisionType: PbExportPageRevisionType!
                    where: PbListPagesWhereInput
                    sort: [PbListPagesSort!]
                    search: PbListPagesSearchInput
                ): PbExportPageResponse

                # Import pages
                importPages(category: String!, zipFileUrl: String): PbImportPageResponse
            }
        `,
        resolvers: {
            PbMutation: {
                exportPages: async (_, args: any, context) => {
                    /**
                     * We know that args is ExportPagesParams.
                     */
                    return resolve(() =>
                        context.pageBuilder.pages.exportPages(args as unknown as ExportPagesParams)
                    );
                },

                importPages: async (_, args: any, context) => {
                    /**
                     * We know that args is ExportPagesParams.
                     */
                    return resolve(() =>
                        context.pageBuilder.pages.importPages(args as unknown as ImportPagesParams)
                    );
                }
            }
        }
    }
};

export default plugin;
