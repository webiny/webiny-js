import { Model } from "webiny-model";

class LayoutSettingsModel extends Model {
    constructor() {
        super();
        this.attr("renderer")
            .char()
            .setValue("default");
    }
}

export default LayoutSettingsModel;
