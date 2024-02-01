import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { ExportPagesParams, ExportPagesResponse, PbImportExportContext } from "../types";
import resolve from "./utils/resolve";
import { Response, ErrorResponse } from "@webiny/handler-graphql";

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
                    where: PbListPagesWhereInput
                    sort: [PbListPagesSort!]
                    search: PbListPagesSearchInput
                    revisionType: PbExportPageRevisionType!
                ): PbExportPageResponse!

                # Import pages
                importPages(
                    category: String!
                    zipFileUrl: String
                    meta: JSON
                ): PbImportPageResponse!
            }
        `,
        resolvers: {
            PbMutation: {
                exportPages: async (
                    _,
                    args,
                    context
                ): Promise<Response<ExportPagesResponse> | ErrorResponse> => {
                    return resolve(() =>
                        context.pageBuilder.pages.exportPages(args as ExportPagesParams)
                    );
                },

                importPages: async (_, args: any, context) => {
                    return resolve(() => context.pageBuilder.pages.importPages(args));
                }
            }
        }
    }
};

export default plugin;
