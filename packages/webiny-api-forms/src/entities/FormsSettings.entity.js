import { Model } from "webiny-model";
import { settingsFactory } from "webiny-api/entities";

class ReCaptchaSettingsModel extends Model {
    enabled: ?boolean;
    siteKey: ?string;
    secretKey: ?string;
    constructor() {
        super();
        this.attr("enabled").boolean();
        this.attr("siteKey")
            .char()
            .setValidators("maxLength:100");
        this.attr("secretKey")
            .char()
            .setValidators("maxLength:100");
    }
}

class FormsSettingsModel extends Model {
    reCaptcha: Object;
    constructor() {
        super();
        this.attr("reCaptcha").model(ReCaptchaSettingsModel);
    }
}

export default (...args: Array<any>) =>
    class FormsSettings extends settingsFactory(...args) {
        static key = "forms";
        static classId = "FormsSettings";
        static collectionName = "Settings";

        data: Object;
        load: Function;

        constructor() {
            super();
            this.attr("data").model(FormsSettingsModel);
        }
    };
