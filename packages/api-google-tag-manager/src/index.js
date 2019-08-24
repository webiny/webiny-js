// @flow
import { gql } from "apollo-server-lambda";
import { dummyResolver, resolveUpdateSettings, resolveGetSettings } from "@webiny/api/graphql";
import { hasScope } from "@webiny/api-security";
import GoogleTagManagerEntity from "./GoogleTagManagerSettings.entity";

export default [
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
                    updateSettings(
                        data: GtmSettingsInput
                    ): GtmSettingsResponse
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
                    googleTagManager: dummyResolver
                },
                Mutation: {
                    googleTagManager: dummyResolver
                },
                GtmQuery: {
                    getSettings: resolveGetSettings("GoogleTagManagerSettings")
                },
                GtmMutation: {
                    updateSettings: resolveUpdateSettings("GoogleTagManagerSettings")
                }
            }
        },
        security: {
            shield: {
                GtmQuery: {
                    getSettings: hasScope("pb:settings")
                },
                GtmMutation: {
                    updateSettings: hasScope("pb:settings")
                }
            }
        }
    },
    {
        type: "entity",
        name: "entity-google-tag-manager-settings",
        entity: GoogleTagManagerEntity
    }
];
