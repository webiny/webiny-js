// @flow
import { gql } from "apollo-server-lambda";
import { withFields } from "@commodo/fields";
import { string, fields } from "@commodo/fields/fields";

export default [
    {
        name: "pb-page-settings-seo",
        type: "pb-page-settings-model",
        apply(settingsFields) {
            settingsFields.seo = fields({
                value: {},
                instanceOf: withFields({
                    title: string(),
                    description: string(),
                    meta: fields({
                        list: true,
                        instanceOf: withFields({
                            name: string(),
                            content: string()
                        })()
                    })
                })()
            });
        }
    },
    {
        name: "graphql-schema-page-builder-settings-seo",
        type: "graphql-schema",
        schema: {
            typeDefs: gql`
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
    }
];
