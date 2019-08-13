// @flow
import { gql } from "apollo-server-lambda";
import { dummyResolver, resolveUpdateSettings, resolveGetSettings } from "webiny-api/graphql";
import { hasScope } from "webiny-api-security";
import GoogleTagManagerEntity from "./GoogleTagManagerSettings.entity";

export default [
    {
        name: "graphql-schema-google-tag-manager",
        type: "graphql-schema",
        schema: {
            typeDefs: gql`
                type GoogleTagManagerError {
                    code: String
                    message: String
                    data: JSON
                }

                type GoogleTagManagerSettings {
                    enabled: Boolean
                    code: String
                }

                type GoogleTagManagerSettingsResponse {
                    data: GoogleTagManagerSettings
                    error: GoogleTagManagerError
                }

                input GoogleTagManagerSettingsInput {
                    enabled: Boolean
                    code: String
                }

                type GoogleTagManagerQuery {
                    getSettings: GoogleTagManagerSettingsResponse
                }

                type GoogleTagManagerMutation {
                    updateSettings(
                        data: GoogleTagManagerSettingsInput
                    ): GoogleTagManagerSettingsResponse
                }

                extend type Query {
                    googleTagManager: GoogleTagManagerQuery
                }

                extend type Mutation {
                    googleTagManager: GoogleTagManagerMutation
                }
            `,
            resolvers: {
                Query: {
                    googleTagManager: dummyResolver
                },
                Mutation: {
                    googleTagManager: dummyResolver
                },
                GoogleTagManagerQuery: {
                    getSettings: resolveGetSettings("GoogleTagManagerSettings")
                },
                GoogleTagManagerMutation: {
                    updateSettings: resolveUpdateSettings("GoogleTagManagerSettings")
                }
            }
        },
        security: {
            shield: {
                GoogleTagManagerQuery: {
                    getSettings: hasScope("cms:settings")
                },
                GoogleTagManagerMutation: {
                    updateSettings: hasScope("cms:settings")
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
