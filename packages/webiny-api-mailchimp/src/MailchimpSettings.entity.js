import { settingsFactory } from "webiny-api/entities";
import MailchimpApi from "./MailchimpApi";
import { EntityModel } from "webiny-entity";

const mailchimpSettingsModelFactory = parent => {
    return class MailchimpSettingsModel extends EntityModel {
        apiKey: ?string;
        enabled: ?boolean;
        constructor() {
            super();
            this.setParentEntity(parent);
            this.attr("enabled").boolean();
            this.attr("apiKey")
                .char()
                .onSet(value => {
                    if (value && value !== this.apiKey) {
                        this.getParentEntity()
                            .on("beforeSave", async () => {
                                const mailchimp = new MailchimpApi({ apiKey: value });
                                const valid = await mailchimp.isValidApiKey();
                                if (!valid) {
                                    throw Error("API key invalid.");
                                }
                            })
                            .setOnce();
                    }
                    return value;
                });
        }
    };
};

export default (...args: Array<any>) =>
    class MailchimpSettings extends settingsFactory(...args) {
        static key = "mailchimp";
        static classId = "MailchimpSettings";
        static collectionName = "Settings";

        data: Object;
        load: Function;

        constructor() {
            super();
            this.attr("data").model(mailchimpSettingsModelFactory(this));
        }
    };
