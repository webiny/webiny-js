import gql from "graphql-tag";
import { withFields, string, fields } from "@webiny/commodo";
import PbImageFieldModel from "@webiny/api-page-builder/plugins/models/pbImageField.model";
import { Context } from "@webiny/api-settings-manager/types";
import { transformImageOutput } from "@webiny/api-page-builder/transformers/transformImageOutput";

export default [
    {
        name: "pb-page-settings-social",
        type: "pb-page-settings-model",
        apply({ fields: settingsFields }) {
            settingsFields.social = fields({
                value: {},
                instanceOf: withFields({
                    meta: fields({
                        value: [],
                        list: true,
                        instanceOf: withFields({
                            property: string(),
                            content: string()
                        })()
                    }),
                    title: string(),
                    description: string(),
                    image: fields({
                        value: null,
                        instanceOf: PbImageFieldModel()
                    })
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

                type PbSocialSettingsImageMeta {
                    width: Number
                    height: Number
                    aspectRatio: Number
                    private: Boolean
                }

                type PbSocialSettingsImage {
                    id: ID
                    name: String
                    size: Number
                    src: String
                    type: String
                    meta: PbSocialSettingsImageMeta
                }

                type PbSocialSettings {
                    title: String
                    description: String
                    meta: [PbOpenGraphTag]
                    image: PbSocialSettingsImage
                }

                input PbSocialSettingsImageInput {
                    id: ID!
                    name: String!
                    key: String!
                    size: Number!
                    type: String!
                    src: String!
                }

                input PbSocialSettingsInput {
                    title: String
                    description: String
                    meta: [PbOpenGraphTagInput!]
                    image: PbSocialSettingsImageInput
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
                    image: async ({ image }, _args: unknown, context: Context) => {
                        if (!image) {
                            return null;
                        }
                        const { srcPrefix } = await context.settingsManager.getSettings(
                            "file-manager"
                        );
                        return transformImageOutput("File", image, srcPrefix);
                    }
                }
            }
        }
    }
];
