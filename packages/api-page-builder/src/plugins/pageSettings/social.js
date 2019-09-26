import { gql } from "apollo-server-lambda";
import { withFields, string, fields } from "@webiny/commodo";
import { id } from "@commodo/fields-storage-mongodb/fields";

export default [
    {
        name: "pb-page-settings-social",
        type: "pb-page-settings-model",
        apply(settingsFields) {
            settingsFields.social = fields({
                value: {},
                instanceOf: withFields({
                    meta: fields({
                        list: true,
                        instanceOf: withFields({
                            property: string(),
                            content: string()
                        })()
                    }),
                    title: string(),
                    description: string(),
                    image: id()
                })()
            });
        }
    },
    {
        name: "graphql-schema-page-builder-settings-social",
        type: "graphql-schema",
        schema: {
            typeDefs: gql`
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
                    image: File
                }

                input PbSocialSettingsInput {
                    title: String
                    description: String
                    meta: [PbOpenGraphTagInput!]
                    image: RefInput
                }

                extend type PbPageSettings {
                    social: PbSocialSettings
                }

                extend input PbPageSettingsInput {
                    social: PbSocialSettingsInput
                }
            `,
            resolvers: {
                PbSocialSettings: {
                    image: ({ image }) => {
                        return { __typename: "File", id: image };
                    }
                }
            }
        }
    }
];
