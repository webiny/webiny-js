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
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
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
            `
        }
    }
];
