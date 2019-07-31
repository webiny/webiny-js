// @flow
import { Model } from "webiny-model";
import { settingsFactory } from "webiny-api/entities";
import type { ApiContext } from "webiny-api/types";

class ReCaptchaSettingsModel extends Model {
    enabled: ?boolean;
    siteKey: ?string;
    constructor() {
        super();
        this.attr("enabled").boolean();
        this.attr("siteKey")
            .char()
            .setValidators("maxLength:100");
    }
}

const formsSettingsModelFactory = () => {
    return class FormsSettingsModel extends Model {
        reCaptcha: Object;
        constructor() {
            super();
            this.attr("reCaptcha").model(ReCaptchaSettingsModel);
        }
    };
};

export default [
    {
        name: "schema-settings-forms",
        type: "schema-settings",
        namespace: "forms",
        typeDefs: /* GraphQL */ `
            type ReCaptchaSettings {
                enabled: Boolean
                siteKey: String
            }

            input ReCaptchaSettingsInput {
                enabled: Boolean
                siteKey: String
            }

            type FormsSettings {
                reCaptcha: ReCaptchaSettings
            }

            type FormsSettingsResponse {
                data: FormsSettings
                error: Error
            }

            input FormsSettingsInput {
                reCaptcha: ReCaptchaSettingsInput
            }

            extend type SettingsQuery {
                forms: FormsSettingsResponse
            }

            extend type SettingsMutation {
                forms(data: FormsSettingsInput): FormsSettingsResponse
            }
        `,
        entity: ({ getEntity }: ApiContext) => getEntity("FormsSettings")
    },
    {
        type: "entity",
        name: "entity-forms-settings",
        entity: (...args: Array<any>) =>
            class FormsSettings extends settingsFactory(...args) {
                static key = "forms";
                static classId = "FormsSettings";
                static collectionName = "Settings";

                data: Object;
                load: Function;

                constructor() {
                    super();
                    this.attr("data").model(formsSettingsModelFactory());
                }
            }
    }
];
