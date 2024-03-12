import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { PbImportExportContext } from "../types";
import { resolve } from "./utils/resolve";

const plugin: GraphQLSchemaPlugin<PbImportExportContext> = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            type FbExportFormData {
                task: PbImportExportTask
            }

            type FbExportFormResponse {
                data: FbExportFormData
                error: FbError
            }

            type FbImportFormData {
                task: PbImportExportTask
            }

            type FbImportFormResponse {
                data: FbImportFormData
                error: FbError
            }

            enum FbExportFormRevisionType {
                published
                latest
            }

            extend type FbMutation {
                # Export forms
                exportForms(
                    ids: [ID!]
                    revisionType: FbExportFormRevisionType!
                ): FbExportFormResponse

                # Import forms
                importForms(zipFileUrl: String, meta: JSON): FbImportFormResponse
            }
        `,
        resolvers: {
            FbMutation: {
                exportForms: async (_, args: any, context) => {
                    return resolve(() => context.formBuilder.forms.exportForms(args));
                },

                importForms: async (_, args: any, context) => {
                    return resolve(() => context.formBuilder.forms.importForms(args));
                }
            }
        }
    }
};

export default plugin;
