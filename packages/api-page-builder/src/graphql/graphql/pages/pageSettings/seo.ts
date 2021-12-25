import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";

export const createPageSettingsSeoGraphQL = (): GraphQLSchemaPlugin => {
    return {
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
                type PbSeoSettingsMetaTag {
                    name: String
                    content: String
                }

                input PbSeoSettingsMetaTagInput {
                    name: String!
                    content: String!
                }

                type PbSeoSettings {
                    title: String
                    description: String
                    meta: [PbSeoSettingsMetaTag]
                }

                input PbSeoPageSettingsInput {
                    title: String
                    description: String
                    meta: [PbSeoSettingsMetaTagInput]
                }

                extend type PbPageSettings {
                    seo: PbSeoSettings
                }

                extend input PbPageSettingsInput {
                    seo: PbSeoPageSettingsInput
                }
            `
        }
    };
};
