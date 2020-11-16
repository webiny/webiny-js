import gql from "graphql-tag";
import { emptyResolver, ErrorResponse } from "@webiny/commodo-graphql";
import cookiePolicySettings from "./cookiePolicySettings.model";

type SettingsContext = any;

export default () => [
    {
        type: "context",
        name: "context-models-cookie-policy",
        apply({ models }) {
            models.CookiePolicySettings = cookiePolicySettings({
                createBase: models.createBase
            });
        }
    },
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
                    updateSettings(data: CookiePolicySettingsInput): CookiePolicySettingsResponse
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
                    cookiePolicy: emptyResolver
                },
                Mutation: {
                    cookiePolicy: emptyResolver
                },
                CookiePolicyQuery: {
                    getSettings: async (_, args, context: SettingsContext) => {
                        try {
                            const data = await context.settingsManager.getSettings("cookie-policy");
                            return { data };
                        } catch (err) {
                            return new ErrorResponse(err);
                        }
                    }
                },
                CookiePolicyMutation: {
                    /*updateSettings: hasScope("pb:settings")(
                        /!*resolveUpdateSettings(({ models }) => models.CookiePolicySettings)*!/
                    )*/
                }
            }
        }
    }
];
