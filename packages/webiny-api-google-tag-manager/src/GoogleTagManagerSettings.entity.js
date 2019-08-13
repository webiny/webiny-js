import { settingsFactory } from "webiny-api/entities";
import { Model } from "webiny-model";

class GoogleTagManagerSettingsModel extends Model {
    constructor() {
        super();
        this.attr("enabled").boolean();
        this.attr("code").char();
    }
}


export default (...args: Array<any>) =>
    class GoogleTagManagerSettings extends settingsFactory(...args) {
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
