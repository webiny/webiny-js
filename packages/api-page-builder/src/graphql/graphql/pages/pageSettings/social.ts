import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";

export const createPageSettingsSocialGraphQL = (): GraphQLSchemaPlugin => {
    return {
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
                type PbOpenGraphTag {
                    property: String
                    content: String
                }

                input PbOpenGraphTagInput {
                    property: String!
                    content: String!
                }

                type PbSocialSettings {
                    title: String
                    description: String
                    meta: [PbOpenGraphTag]
                    image: PbFile
                }

                input PbSocialSettingsInput {
                    title: String
                    description: String
                    meta: [PbOpenGraphTagInput!]
                    image: PbFileInput
                }

                extend type PbPageSettings {
                    social: PbSocialSettings
                }

                extend input PbPageSettingsInput {
                    social: PbSocialSettingsInput
                }
            `
        }
    };
};
