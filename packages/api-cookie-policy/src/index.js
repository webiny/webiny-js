// @flow
import { gql } from "apollo-server-lambda";
import { dummyResolver, resolveGetSettings, resolveUpdateSettings } from "@webiny/api/graphql";
import { hasScope } from "@webiny/api-security";
import CookiePolicySettingsEntity from "./CookiePolicySettings.entity";

export default [
    {
        name: "graphql-schema-settings-cookie-policy",
        type: "graphql-schema",
        schema: {
            typeDefs: gql`
                type CookiePolicySettings {
                    enabled: Boolean
                    policyLink: String
                    position: String
                    palette: CookiePolicySettingsPalette
                    content: CookiePolicySettingsContent
                }

                type CookiePolicyError {
                    code: String
                    message: String
                    data: JSON
                }

                type CookiePolicySettingsResponse {
                    data: CookiePolicySettings
                    error: CookiePolicyError
                }

                type CookiePolicySettingsContent {
                    href: String
                    message: String
                    dismiss: String
                    link: String
                }

                type CookiePolicySettingsPaletteColors {
                    background: String
                    text: String
                }

                type CookiePolicySettingsPalette {
                    popup: CookiePolicySettingsPaletteColors
                    button: CookiePolicySettingsPaletteColors
                }

                input CookiePolicySettingsInput {
                    enabled: Boolean
                    position: String
                    palette: CookiePolicySettingsPaletteInput
                    content: CookiePolicySettingsContentInput
                }

                input CookiePolicySettingsPaletteColorsInput {
                    background: String
                    text: String
                }

                input CookiePolicySettingsPaletteInput {
                    popup: CookiePolicySettingsPaletteColorsInput
                    button: CookiePolicySettingsPaletteColorsInput
                }

                input CookiePolicySettingsContentInput {
                    href: String
                    message: String
                    dismiss: String
                    link: String
                }

                type CookiePolicyQuery {
                    getSettings: CookiePolicySettingsResponse
                }

                type CookiePolicyMutation {
                    updateSettings(
                        data: CookiePolicySettingsInput
                    ): CookiePolicySettingsResponse
                }

                extend type Query {
                    cookiePolicy: CookiePolicyQuery
                }

                extend type Mutation {
                    cookiePolicy: CookiePolicyMutation
                }
                
            `,
            resolvers: {
                Query: {
                    cookiePolicy: dummyResolver
                },
                Mutation: {
                    cookiePolicy: dummyResolver
                },
                CookiePolicyQuery: {
                    getSettings: resolveGetSettings("CookiePolicySettings")
                },
                CookiePolicyMutation: {
                    updateSettings: resolveUpdateSettings("CookiePolicySettings")
                }
            }
        },
        security: {
            shield: {
                CookiePolicyQuery: {
                    getSettings: hasScope("cms:settings")
                },
                CookiePolicyMutation: {
                    updateSettings: hasScope("cms:settings")
                }
            }
        }
    },
    {
        type: "entity",
        name: "entity-cookie-policy-settings",
        entity: CookiePolicySettingsEntity
    }
];
