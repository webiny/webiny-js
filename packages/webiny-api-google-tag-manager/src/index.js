// @flow
import { gql } from "apollo-server-lambda";
import { Model } from "webiny-model";
import { settingsFactory } from "webiny-api/entities";
import { resolveSaveSettings, resolveGetSettings } from "webiny-api/graphql";
import { hasScope } from "webiny-api-security";

class GoogleTagManagerSettingsModel extends Model {
    constructor() {
        super();
        this.attr("enabled").boolean();
        this.attr("code").char();
    }
}

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

                extend type SettingsQuery {
                    googleTagManager: GoogleTagManagerSettingsResponse
                }

                extend type SettingsMutation {
                    googleTagManager(
                        data: GoogleTagManagerSettingsInput
                    ): GoogleTagManagerSettingsResponse
                }
            `,
            resolvers: {
                SettingsQuery: {
                    googleTagManager: (_: any, args: Object, ctx: Object, info: Object) => {
                        const entity = ctx.getEntity("GoogleTagManagerSettings");
                        return resolveGetSettings(entity)(_, args, ctx, info);
                    }
                },
                SettingsMutation: {
                    googleTagManager: (_: any, args: Object, ctx: Object, info: Object) => {
                        const entity = ctx.getEntity("GoogleTagManagerSettings");
                        return resolveSaveSettings(entity)(_, args, ctx, info);
                    }
                }
            }
        },
        security: {
            shield: {
                SettingsMutation: {
                    googleTagManager: hasScope("cms:settings")
                }
            }
        }
    },
    {
        type: "entity",
        name: "entity-google-tag-manager-settings",
        entity: (...args: Array<any>) => {
            return class GoogleTagManagerSettings extends settingsFactory(...args) {
                static key = "google-tag-manager";
                static classId = "GoogleTagManagerSettings";
                static collectionName = "Settings";

                data: Object;
                load: Function;

                constructor() {
                    super();
                    this.attr("data").model(GoogleTagManagerSettingsModel);
                }
            };
        }
    }
];
