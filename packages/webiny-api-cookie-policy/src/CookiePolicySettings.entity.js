import { settingsFactory } from "webiny-api/entities";
import { Model } from "webiny-model";

class ColorsModel extends Model {
    constructor() {
        super();
        this.attr("background").char();
        this.attr("text").char();
    }
}

class PaletteModel extends Model {
    constructor() {
        super();
        this.attr("popup").model(ColorsModel);
        this.attr("button").model(ColorsModel);
    }
}
class ContentModel extends Model {
    constructor() {
        super();
        this.attr("href").char();
        this.attr("message").char();
        this.attr("dismiss").char();
        this.attr("link").char();
    }
}

class CookiePolicySettingsModel extends Model {
    constructor() {
        super();
        this.attr("enabled").boolean();
        this.attr("position")
            .char()
            .setValidators("in:bottom:top:bottom-left:bottom-right")
            .setDefaultValue("bottom");
        this.attr("palette").model(PaletteModel);
        this.attr("content").model(ContentModel);
    }
}

export default (...args: Array<any>) =>
    class CookiePolicySettings extends settingsFactory(...args) {
        static key = "cookie-policy";
        static classId = "CookiePolicySettings";
        static collectionName = "Settings";

        data: Object;
        load: Function;

        constructor() {
            super();
            this.attr("data").model(CookiePolicySettingsModel);
        }
    };
