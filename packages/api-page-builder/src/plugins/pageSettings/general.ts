import gql from "graphql-tag";
import { string, fields, withFields } from "@webiny/commodo";
import { transformImageOutput } from "@webiny/api-page-builder/transformers/transformImageOutput";
import { Context } from "@webiny/api-settings-manager/types";
import PbImageFieldModel from "@webiny/api-page-builder/plugins/models/pbImageField.model";

export default [
    {
        name: "pb-page-settings-general",
        type: "pb-page-settings-model",
        apply({ fields: settingsFields }) {
            settingsFields.general = fields({
                value: {},
                instanceOf: withFields({
                    tags: string({ list: true }),
                    layout: string(),
                    image: fields({
                        value: null,
                        instanceOf: PbImageFieldModel()
                    })
                })()
            });
        }
    },
    {
        name: "graphql-schema-page-builder-settings-general",
        type: "graphql-schema",
        schema: {
            typeDefs: gql`
                type PbGeneralSettingsImageMeta {
                    width: Number
                    height: Number
                    aspectRatio: Number
                    private: Boolean
                }

                type PbGeneralSettingsImage {
                    id: ID
                    name: String
                    size: Number
                    src: String
                    type: String
                    meta: PbGeneralSettingsImageMeta
                }

                type PbGeneralPageSettings {
                    tags: [String]
                    layout: String
                    image: PbGeneralSettingsImage
                }

                input PbGeneralSettingsImageMetaInput {
                    width: Number
                    height: Number
                    aspectRatio: Number
                    private: Boolean
                }

                input PbGeneralSettingsImageInput {
                    id: ID!
                    name: String!
                    key: String
                    size: Number!
                    src: String
                    type: String!
                    meta: PbGeneralSettingsImageMetaInput
                }

                input PbGeneralPageSettingsInput {
                    tags: [String]
                    layout: String
                    image: PbGeneralSettingsImageInput
                }

                extend type PbPageSettings {
                    general: PbGeneralPageSettings
                }

                extend input PbPageSettingsInput {
                    general: PbGeneralPageSettingsInput
                }
            `,
            resolvers: {
                PbGeneralPageSettings: {
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
