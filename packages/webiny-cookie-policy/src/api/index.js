// @flow
import { Model } from "webiny-model";
import { settingsFactory } from "webiny-api/entities";

class PaletteModel extends Model {
    constructor() {
        super();
        this.attr("popup").char();
        this.attr("body").char();
    }
}

class CookiePolicySettingsModel extends Model {
    constructor() {
        super();
        this.attr("palette").model(PaletteModel);
    }
}

export default [
    {
        name: "schema-settings-cookie-policy",
        type: "schema-settings",
        namespace: "cookiePolicy",
        typeDefs: `
            type CookiePolicySettings {
                palette: CookiePolicySettingsPalette
            }
            
            type CookiePolicySettingsPalette {
                popup: String,
                button: String
            }
            
            input CookiePolicySettingsInput {
                palette: CookiePolicySettingsPaletteInput
            }
            
            input CookiePolicySettingsPaletteInput {
                popup: String,
                button: String
            } 
            
            extend type SettingsQuery {
                cookiePolicy: CookiePolicySettings
            }  
            
            extend type SettingsMutation {
                cookiePolicy(data: CookiePolicySettingsInput): CookiePolicySettings
            }
        `,
        entity: ({
            cookiePolicy: {
                entities: { CookiePolicySettings }
            }
        }) => CookiePolicySettings
    },
    {
        type: "entity",
        name: "entity-cookie-policy-settings",
        namespace: "cookiePolicy",
        entity: {
            name: "CookiePolicySettings",
            factory: (...args: Array<any>) => {
                return class CookiePolicySettings extends settingsFactory(...args) {
                    static key = "cookie-policy";

                    data: Object;
                    load: Function;

                    constructor() {
                        super();
                        this.attr("data").model(CookiePolicySettingsModel);
                    }
                };
            }
        }
    }
];
