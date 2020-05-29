import gql from "graphql-tag";
import { emptyResolver, resolveUpdateSettings, ErrorResponse } from "@webiny/commodo-graphql";
import { hasScope } from "@webiny/api-security";
import googleTagManagerSettings from "./googleTagManagerSettings.model";
import { Context } from "@webiny/graphql/types";
import { Context as SettingsManagerContext } from "@webiny/api-settings-manager/types";

type SettingsContext = Context & SettingsManagerContext;

export default () => [
    {
        type: "context",
        name: "context-models-google-tag-manager",
        apply({ models }) {
            models.GoogleTagManagerSettings = googleTagManagerSettings({
                createBase: models.createBase
            });
        }
    },
    {
        name: "graphql-schema-google-tag-manager",
        type: "graphql-schema",
        schema: {
            typeDefs: gql`
                type GtmError {
                    code: String
                    message: String
                    data: JSON
                }

                type GtmSettings {
                    enabled: Boolean
                    code: String
                }

                type GtmSettingsResponse {
                    data: GtmSettings
                    error: GtmError
                }

                input GtmSettingsInput {
                    enabled: Boolean
                    code: String
                }

                type GtmQuery {
                    getSettings: GtmSettingsResponse
                }

                type GtmMutation {
                    updateSettings(data: GtmSettingsInput): GtmSettingsResponse
                }

                extend type Query {
                    googleTagManager: GtmQuery
                }

                extend type Mutation {
                    googleTagManager: GtmMutation
                }
            `,
            resolvers: {
                Query: {
                    googleTagManager: emptyResolver
                },
                Mutation: {
                    googleTagManager: emptyResolver
                },
                GtmQuery: {
                    getSettings: async (_, args, context: SettingsContext) => {
                        try {
                            const data = await context.settingsManager.getSettings("google-tag-manager");
                            return { data };
                        } catch (err) {
                            return new ErrorResponse(err);
                        }
                    }
                },
                GtmMutation: {
                    updateSettings: hasScope("pb:settings")(
                        resolveUpdateSettings(({ models }) => models.GoogleTagManagerSettings)
                    )
                }
            }
        }
    }
];
