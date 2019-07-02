// @flow
import { Model } from "webiny-model";
import { settingsFactory } from "webiny-api/entities";
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
        name: "graphql-schema-settings-google-tag-manager",
        type: "graphql-schema",
        security: {
            shield: {
                SettingsMutation: {
                    googleTagManager: hasScope("cms:settings")
                }
            }
        }
    },
    {
        type: "schema-settings",
        name: "schema-settings-google-tag-manager",
        namespace: "googleTagManager",
        typeDefs: /* GraphQL */ `
            type GoogleTagManagerSettings {
                enabled: Boolean
                code: String
            }

            type GoogleTagManagerSettingsResponse {
                data: GoogleTagManagerSettings
                error: Error
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
        entity: ({
            googleTagManager: {
                entities: { GoogleTagManagerSettings }
            }
        }: Object) => GoogleTagManagerSettings
    },
    {
        type: "entity",
        name: "entity-google-tag-manager-settings",
        namespace: "googleTagManager",
        entity: {
            name: "GoogleTagManagerSettings",
            factory: (...args: Array<any>) => {
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
    }
];
