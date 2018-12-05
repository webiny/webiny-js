// @flow
import { Model } from "webiny-model";
import { settingsFactory } from "webiny-api/entities";

class MailchimpSettingsModel extends Model {
    constructor() {
        super();
        this.attr("enabled").boolean();
        this.attr("apiKey").char();
    }
}

export default [
    {
        name: "schema-settings-mailchimp",
        type: "schema-settings",
        namespace: "mailchimp",
        typeDefs: /* GraphQL */ `
            type MailchimpSettings {
                enabled: Boolean
                apiKey: String
            }

            input MailchimpSettingsInput {
                enabled: Boolean
                apiKey: String
            }

            extend type SettingsQuery {
                mailchimp: MailchimpSettings
            }

            extend type SettingsMutation {
                mailchimp(data: MailchimpSettingsInput): MailchimpSettings
            }
        `,
        entity: ({
            mailchimp: {
                entities: { MailchimpSettings }
            }
        }: Object) => MailchimpSettings
    },
    {
        type: "entity",
        name: "entity-mailchimp-settings",
        namespace: "mailchimp",
        entity: {
            name: "MailchimpSettings",
            factory: (...args: Array<any>) => {
                return class MailchimpSettings extends settingsFactory(...args) {
                    static key = "mailchimp";

                    data: Object;
                    load: Function;

                    constructor() {
                        super();
                        this.attr("data").model(MailchimpSettingsModel);
                    }
                };
            }
        }
    }
];
