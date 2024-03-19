import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { PbImportExportContext } from "../types";
import { resolve } from "./utils/resolve";

const plugin: GraphQLSchemaPlugin<PbImportExportContext> = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            type PbExportTemplateData {
                task: PbImportExportTask
            }

            type PbExportTemplateResponse {
                data: PbExportTemplateData
                error: PbError
            }

            type PbImportTemplateData {
                task: PbImportExportTask
            }

            type PbImportTemplateResponse {
                data: PbImportTemplateData
                error: PbError
            }

            extend type PbMutation {
                # Export templates
                exportTemplates(ids: [ID!]): PbExportTemplateResponse

                # Import templates
                importTemplates(zipFileUrl: String): PbImportTemplateResponse
            }
        `,
        resolvers: {
            PbMutation: {
                exportTemplates: async (_, args: any, context) => {
                    return resolve(() => context.pageBuilder.templates.exportTemplates(args));
                },

                importTemplates: async (_, args: any, context) => {
                    return resolve(() => context.pageBuilder.templates.importTemplates(args));
                }
            }
        }
    }
};

export default plugin;
