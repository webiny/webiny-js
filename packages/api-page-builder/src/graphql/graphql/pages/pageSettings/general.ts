import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";

export const createPageSettingsGeneralGraphQL = (): GraphQLSchemaPlugin => {
    return {
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
                type PbGeneralPageSettings {
                    snippet: String
                    tags: [String]
                    layout: String
                    image: PbFile
                }

                input PbGeneralPageSettingsInput {
                    snippet: String
                    tags: [String]
                    layout: String
                    image: PbFileInput
                }

                extend type PbPageSettings {
                    general: PbGeneralPageSettings
                }

                extend input PbPageSettingsInput {
                    general: PbGeneralPageSettingsInput
                }
            `
        }
    };
};
