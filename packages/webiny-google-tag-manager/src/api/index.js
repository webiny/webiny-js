// @flow
import { Model } from "webiny-model";
import { settingsFactory } from "webiny-api/entities";

class GoogleTagManagerSettingsModel extends Model {
    constructor() {
        super();
        this.attr("enabled").boolean();
        this.attr("code").char();
    }
}

export default [
    {
        type: "schema-settings",
        name: "schema-settings-google-tag-manager",
        namespace: "googleTagManager",
        typeDefs: /* GraphQL */ `
            type GoogleTagManagerSettings {
                enabled: Boolean
                code: String
            }

            input GoogleTagManagerSettingsInput {
                enabled: Boolean
                code: String
            }

            extend type SettingsQuery {
                googleTagManager: GoogleTagManagerSettings
            }

            extend type SettingsMutation {
                googleTagManager(data: GoogleTagManagerSettingsInput): GoogleTagManagerSettings
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
