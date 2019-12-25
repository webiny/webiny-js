import gql from "graphql-tag";
import { string, fields, withFields } from "@webiny/commodo";

export default [
    {
        name: "pb-page-settings-general",
        type: "pb-page-settings-model",
        apply({ fields: settingsFields, context }) {
            settingsFields.general = fields({
                value: {},
                instanceOf: withFields({
                    tags: string({ list: true }),
                    layout: string(),
                    image: context.commodo.fields.id()
                })()
            });
        }
    },
    {
        name: "graphql-schema-page-builder-settings-general",
        type: "graphql-schema",
        schema: {
            typeDefs: gql`
                type PbGeneralPageSettings {
                    tags: [String]
                    layout: String
                    image: File
                }

                input PbGeneralPageSettingsInput {
                    tags: [String]
                    layout: String
                    image: RefInput
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
                    image: ({ image }) => {
                        return image ? { __typename: "File", id: image } : null;
                    }
                }
            }
        }
    }
];
